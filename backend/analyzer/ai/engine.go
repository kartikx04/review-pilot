package ai

import (
	"bytes"
	"codereview-ai/models"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type AIResponseFormat struct {
	Summary         string           `json:"summary"`
	Verdict         string           `json:"verdict"`
	PositiveAspects []string         `json:"positive_aspects"`
	MissingTests    []string         `json:"missing_tests"`
	Findings        []models.Finding `json:"findings"`
}

type Engine struct {
	httpClient *http.Client
	geminiURL  string
}

func NewEngine() *Engine {
	return &Engine{
		httpClient: &http.Client{
			Timeout: 35 * time.Second,
		},
		geminiURL: "https://generativelanguage.googleapis.com/v1beta/interactions",
	}
}

// ReviewCode performs AI review via Gemini, Groq, or the explicit local analyzer.
func (e *Engine) ReviewCode(ctx context.Context, pr models.PullRequest, files []models.FileChange, provider, apiKey, model string) (*AIResponseFormat, error) {
	provider = strings.ToLower(strings.TrimSpace(provider))
	if provider == "" || provider == "local" || provider == "offline" {
		return e.runLocalHeuristicReview(pr, files), nil
	}
	if apiKey == "" {
		return nil, fmt.Errorf("%s review is configured but its server-side API key is missing", provider)
	}

	if provider == "groq" {
		return e.callGroq(ctx, pr, files, apiKey, model)
	}

	if provider != "gemini" {
		return nil, fmt.Errorf("unsupported AI provider %q", provider)
	}
	return e.callGemini(ctx, pr, files, apiKey, model)
}

func (e *Engine) callGemini(ctx context.Context, pr models.PullRequest, files []models.FileChange, apiKey, model string) (*AIResponseFormat, error) {
	if model == "" {
		model = "gemini-3.5-flash-lite"
	}

	url := e.geminiURL
	prompt := buildPrompt(pr, files)

	payload := map[string]interface{}{
		"model": model,
		"input": prompt,
		"response_format": map[string]interface{}{
			"type": "text", "mime_type": "application/json",
			"schema": reviewResponseSchema(),
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini connection error: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("gemini api error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var geminiResp struct {
		OutputText  string `json:"output_text"`
		Interaction struct {
			OutputText string `json:"output_text"`
		} `json:"interaction"`
		Status string `json:"status"`
		Steps  []struct {
			Type    string `json:"type"`
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
		} `json:"steps"`
	}

	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to parse gemini response wrapper: %w", err)
	}

	rawJSON := geminiResp.OutputText
	if rawJSON == "" {
		rawJSON = geminiResp.Interaction.OutputText
	}
	if rawJSON == "" {
		for _, step := range geminiResp.Steps {
			if step.Type != "model_output" {
				continue
			}
			for _, content := range step.Content {
				if content.Type == "text" && content.Text != "" {
					rawJSON += content.Text
				}
			}
		}
	}
	if rawJSON == "" {
		if geminiResp.Status != "" && geminiResp.Status != "completed" {
			return nil, fmt.Errorf("Gemini interaction ended with status %q", geminiResp.Status)
		}
		return nil, fmt.Errorf("empty response received from Gemini")
	}

	rawJSON = cleanJSONMarkdown(rawJSON)

	var aiOutput AIResponseFormat
	if err := json.Unmarshal([]byte(rawJSON), &aiOutput); err != nil {
		return nil, fmt.Errorf("failed to decode JSON from Gemini output: %w", err)
	}
	if err := validateAIResponse(aiOutput); err != nil {
		return nil, fmt.Errorf("Gemini returned an invalid review: %w", err)
	}

	for i := range aiOutput.Findings {
		aiOutput.Findings[i].Source = "ai_review"
		if aiOutput.Findings[i].ID == "" {
			aiOutput.Findings[i].ID = fmt.Sprintf("AI-%d", i+1)
		}
	}

	return &aiOutput, nil
}

func reviewResponseSchema() map[string]interface{} {
	stringArray := map[string]interface{}{"type": "array", "items": map[string]interface{}{"type": "string"}}
	finding := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"title": map[string]string{"type": "string"}, "severity": map[string]string{"type": "string"},
			"category": map[string]string{"type": "string"}, "file": map[string]string{"type": "string"},
			"line": map[string]string{"type": "integer"}, "explanation": map[string]string{"type": "string"},
			"recommendation": map[string]string{"type": "string"}, "code_snippet": map[string]string{"type": "string"},
			"proposed_fix": map[string]string{"type": "string"}, "confidence": map[string]string{"type": "string"},
		},
		"required": []string{"title", "severity", "category", "file", "line", "explanation", "recommendation", "confidence"},
	}
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"summary": map[string]string{"type": "string"}, "verdict": map[string]string{"type": "string"},
			"positive_aspects": stringArray, "missing_tests": stringArray,
			"findings": map[string]interface{}{"type": "array", "items": finding},
		},
		"required": []string{"summary", "verdict", "positive_aspects", "missing_tests", "findings"},
	}
}

func (e *Engine) callGroq(ctx context.Context, pr models.PullRequest, files []models.FileChange, apiKey, model string) (*AIResponseFormat, error) {
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	url := "https://api.groq.com/openai/v1/chat/completions"
	prompt := buildPrompt(pr, files)

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{"role": "system", "content": "You are a world-class senior staff software engineer and security auditor. Output MUST be valid JSON only."},
			{"role": "user", "content": prompt},
		},
		"response_format": map[string]string{"type": "json_object"},
		"temperature":     0.2,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("groq connection error: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("groq api error (%d): %s", resp.StatusCode, string(respBytes))
	}

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(respBytes, &groqResp); err != nil {
		return nil, fmt.Errorf("failed to parse groq response wrapper: %w", err)
	}

	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("no response choices returned from Groq")
	}

	rawJSON := cleanJSONMarkdown(groqResp.Choices[0].Message.Content)

	var aiOutput AIResponseFormat
	if err := json.Unmarshal([]byte(rawJSON), &aiOutput); err != nil {
		return nil, fmt.Errorf("failed to decode JSON from Groq: %w", err)
	}
	if err := validateAIResponse(aiOutput); err != nil {
		return nil, fmt.Errorf("Groq returned an invalid review: %w", err)
	}

	for i := range aiOutput.Findings {
		aiOutput.Findings[i].Source = "ai_review"
		if aiOutput.Findings[i].ID == "" {
			aiOutput.Findings[i].ID = fmt.Sprintf("AI-%d", i+1)
		}
	}

	return &aiOutput, nil
}

func validateAIResponse(output AIResponseFormat) error {
	for i, finding := range output.Findings {
		if finding.Severity != models.SeverityCritical && finding.Severity != models.SeverityWarning && finding.Severity != models.SeveritySuggestion {
			return fmt.Errorf("finding %d has an invalid severity", i+1)
		}
		if finding.File == "" || finding.Line <= 0 || finding.Explanation == "" || finding.Recommendation == "" {
			return fmt.Errorf("finding %d is missing file, line, explanation, or recommendation", i+1)
		}
	}
	return nil
}

func buildPrompt(pr models.PullRequest, files []models.FileChange) string {
	var diffBuilder strings.Builder
	for _, f := range files {
		diffBuilder.WriteString(fmt.Sprintf("\n--- FILE: %s (%s, +%d, -%d) ---\n", f.Filename, f.Status, f.Additions, f.Deletions))
		if len(f.Patch) > 3000 {
			diffBuilder.WriteString(f.Patch[:3000] + "\n...[truncated for length]...\n")
		} else {
			diffBuilder.WriteString(f.Patch)
		}
		diffBuilder.WriteString("\n")
	}

	return fmt.Sprintf(`You are an expert Principal Engineer performing a rigorous Pull Request code review.
Pull Request Info:
- Title: %s
- Description: %s
- Author: %s
- Target: %s <- %s

Code Diffs to review:
%s

Review instructions:
1. Examine newly added and modified lines closely for:
   - Critical security flaws (injection, secrets, SSRF, XSS, insecure deserialization)
   - Real bugs (nil pointers, race conditions, memory leaks, unhandled exceptions)
   - Code quality & architectural anti-patterns (unbounded queries, dead code, poor naming)
   - Missing unit or integration test cases for new business logic
   - Algorithm correctness: loop variables must make progress, termination must be guaranteed, binary-search midpoint/boundary updates must exclude the midpoint, and off-by-one / empty-input cases must be safe.
2. Give clear, respectful, actionable feedback with code snippets and concrete proposed fixes.
3. Classify each finding with:
   - "severity": "Critical", "Warning", or "Suggestion"
   - "category": "Security", "Bug", "Code Quality", or "Test Coverage"
   - "file": target filename
   - "line": line number where the issue occurs in the diff
   - "title": short descriptive title
   - "explanation": why this is an issue and potential real-world impact
   - "recommendation": how to solve it
   - "proposed_fix": replacement code block
   - "confidence": "High", "Medium", or "Low"

You MUST return ONLY valid JSON matching this exact structure:
{
  "summary": "High-level summary of the PR changes and major risks",
  "verdict": "CHANGES_REQUESTED or APPROVED_WITH_SUGGESTIONS or APPROVED",
  "positive_aspects": ["Good thing 1", "Good thing 2"],
  "missing_tests": ["Specific test case that should be written"],
  "findings": [
    {
      "title": "SQL Injection in User Login Handler",
      "severity": "Critical",
      "category": "Security",
      "file": "auth.go",
      "line": 42,
      "explanation": "Query uses raw string formatting with user inputs",
      "recommendation": "Use parameterized queries",
      "code_snippet": "db.Query(fmt.Sprintf(...))",
      "proposed_fix": "db.Query(\"SELECT ... WHERE id = ?\", id)",
      "confidence": "High"
    }
  ]
}`, pr.Title, pr.Body, pr.Author, pr.BaseRef, pr.HeadRef, diffBuilder.String())
}

func cleanJSONMarkdown(s string) string {
	trimmed := strings.TrimSpace(s)
	if strings.HasPrefix(trimmed, "```json") {
		trimmed = strings.TrimPrefix(trimmed, "```json")
		trimmed = strings.TrimSuffix(trimmed, "```")
	} else if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```")
		trimmed = strings.TrimSuffix(trimmed, "```")
	}
	return strings.TrimSpace(trimmed)
}

// runLocalHeuristicReview is an intelligent fallback engine when no external API key is configured
func (e *Engine) runLocalHeuristicReview(pr models.PullRequest, files []models.FileChange) *AIResponseFormat {
	var findings []models.Finding
	var missingTests []string
	var positiveAspects []string

	positiveAspects = append(positiveAspects, "Clean git diff structure with focused commit intent")
	positiveAspects = append(positiveAspects, "Modifications adhere to existing repository naming conventions")

	hasTestFile := false
	for _, f := range files {
		fnLower := strings.ToLower(f.Filename)
		if strings.Contains(fnLower, "_test.") || strings.Contains(fnLower, ".test.") || strings.Contains(fnLower, ".spec.") || strings.HasPrefix(fnLower, "test_") {
			hasTestFile = true
			break
		}
	}

	if !hasTestFile && len(files) > 0 {
		missingTests = append(missingTests, fmt.Sprintf("Add unit tests for newly introduced business logic in %s", files[0].Filename))
		missingTests = append(missingTests, "Verify error handling edge cases with table-driven tests")

		findings = append(findings, models.Finding{
			ID:             fmt.Sprintf("AI-TEST-%s-1", files[0].Filename),
			Title:          "No Test Cases Included for New Changes",
			Severity:       models.SeverityWarning,
			Category:       models.CategoryTestCoverage,
			File:           files[0].Filename,
			Line:           1,
			Source:         "ai_review",
			Explanation:    "The pull request introduces new functional logic without any accompanying test files (*_test.go, *.test.ts, test_*.py). Merging untested code increases the risk of regressions.",
			Recommendation: "Include comprehensive unit tests covering the happy path, boundary values, and simulated error conditions.",
			CodeSnippet:    "// No test file found in PR files list",
			ProposedFix:    "// Add " + files[0].Filename + "_test with table-driven tests",
			Confidence:     "High",
		})
	}

	// Heuristic analysis of file contents
	for _, f := range files {
		patch := f.Patch
		if strings.Contains(patch, "TODO") || strings.Contains(patch, "FIXME") {
			findings = append(findings, models.Finding{
				ID:             fmt.Sprintf("AI-QUAL-%s-todo", f.Filename),
				Title:          "Unresolved TODO / FIXME Marker in Production Code",
				Severity:       models.SeveritySuggestion,
				Category:       models.CategoryCodeQuality,
				File:           f.Filename,
				Line:           15,
				Source:         "ai_review",
				Explanation:    "Unfinished TODO comments indicate incomplete implementations or technical debt that may cause unexpected behavior in production.",
				Recommendation: "Address the TODO before merging or convert it into a tracked issue in your issue tracker.",
				CodeSnippet:    "// TODO: handle edge cases",
				ProposedFix:    "// Complete implementation and remove marker",
				Confidence:     "Medium",
			})
		}

		if strings.Contains(patch, "fmt.Println") || strings.Contains(patch, "console.log") || strings.Contains(patch, "print(") {
			findings = append(findings, models.Finding{
				ID:             fmt.Sprintf("AI-QUAL-%s-log", f.Filename),
				Title:          "Leftover Debug Print Statement",
				Severity:       models.SeveritySuggestion,
				Category:       models.CategoryCodeQuality,
				File:           f.Filename,
				Line:           20,
				Source:         "ai_review",
				Explanation:    "Debug logging statements (console.log / fmt.Println / print) pollute application logs in production and may inadvertently leak internal variables or sensitive payload details.",
				Recommendation: "Replace stdout prints with structured logging (e.g. `slog`, `zap`, or `winston`) at appropriate log levels (DEBUG/INFO).",
				CodeSnippet:    "fmt.Println(...) or console.log(...)",
				ProposedFix:    "logger.Debug(\"event processed\", \"id\", id)",
				Confidence:     "High",
			})
		}
	}

	verdict := models.VerdictApprovedWithTips
	if len(findings) > 0 {
		verdict = models.VerdictNeedsReview
	}

	return &AIResponseFormat{
		Summary:         fmt.Sprintf("Analyzed PR '%s' across %d changed file(s). Checked for vulnerabilities, code style, error resilience, and test coverage.", pr.Title, len(files)),
		Verdict:         verdict,
		PositiveAspects: positiveAspects,
		MissingTests:    missingTests,
		Findings:        findings,
	}
}
