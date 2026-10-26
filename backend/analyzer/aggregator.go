package analyzer

import (
	"codereview-ai/analyzer/ai"
	"codereview-ai/analyzer/static"
	"codereview-ai/models"
	"context"
	"math"
	"strings"
	"time"
)

type Aggregator struct {
	staticEngine *static.Engine
	aiEngine     *ai.Engine
}

func NewAggregator() *Aggregator {
	return &Aggregator{
		staticEngine: static.NewEngine(),
		aiEngine:     ai.NewEngine(),
	}
}

// ReviewPullRequest runs both static analysis and AI code review and merges results
func (a *Aggregator) ReviewPullRequest(ctx context.Context, pr models.PullRequest, files []models.FileChange, provider, apiKey, model string) (*models.ReviewResponse, error) {
	startTime := time.Now()

	// 1. Run Static Analysis across all file patches
	var staticFindings []models.Finding
	linesAnalyzed := 0

	for _, file := range files {
		patchFindings := a.staticEngine.AnalyzePatch(file.Filename, file.Patch)
		staticFindings = append(staticFindings, patchFindings...)
		linesAnalyzed += file.Additions + file.Deletions
	}

	// 2. Run AI Review
	aiResult, err := a.aiEngine.ReviewCode(ctx, pr, files, provider, apiKey, model)
	if err != nil {
		// Log and continue with static findings if AI engine returns error
		aiResult = &ai.AIResponseFormat{
			Summary: "AI review failed to complete; displaying static analysis results.",
			Verdict: models.VerdictNeedsReview,
		}
	}

	// 3. Deduplicate and merge findings
	allFindings := mergeFindings(staticFindings, aiResult.Findings)

	// 4. Calculate severity counts
	criticalCount := 0
	warningCount := 0
	suggestionCount := 0

	for _, f := range allFindings {
		switch f.Severity {
		case models.SeverityCritical:
			criticalCount++
		case models.SeverityWarning:
			warningCount++
		case models.SeveritySuggestion:
			suggestionCount++
		}
	}

	// 5. Calculate Security Health Score (0 - 100)
	deduction := (criticalCount * 30) + (warningCount * 10) + (suggestionCount * 3)
	score := 100 - deduction
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	// 6. Determine final verdict
	var verdict string
	var verdictMessage string

	if criticalCount > 0 {
		verdict = models.VerdictChangesRequested
		verdictMessage = "Critical security or functional bugs detected. Merge should be blocked until resolved."
	} else if warningCount >= 2 {
		verdict = models.VerdictChangesRequested
		verdictMessage = "Multiple warnings detected. Please resolve potential bugs before merging."
	} else if warningCount > 0 || suggestionCount > 0 {
		verdict = models.VerdictApprovedWithTips
		verdictMessage = "No blocking issues found. Code can be merged after reviewing recommendations."
	} else {
		verdict = models.VerdictApproved
		verdictMessage = "All static analysis and AI checks passed cleanly. Ready to merge."
	}

	duration := time.Since(startTime).Milliseconds()

	summary := models.ReviewSummary{
		TotalFindings:       len(allFindings),
		CriticalCount:       criticalCount,
		WarningCount:        warningCount,
		SuggestionCount:     suggestionCount,
		SecurityScore:       score,
		Verdict:             verdict,
		VerdictMessage:      verdictMessage,
		SummaryText:         aiResult.Summary,
		PositiveAspects:     aiResult.PositiveAspects,
		MissingTests:        aiResult.MissingTests,
		AnalyzedFilesCount:  len(files),
		LinesAnalyzed:       linesAnalyzed,
		DurationMs:          duration,
		StaticAnalysisFound: len(staticFindings),
		AIFound:             len(aiResult.Findings),
	}

	return &models.ReviewResponse{
		PullRequest: pr,
		Summary:     summary,
		Findings:    allFindings,
		Files:       files,
	}, nil
}

// mergeFindings combines static and AI findings, deduplicating overlapping line reports
func mergeFindings(staticFindings, aiFindings []models.Finding) []models.Finding {
	var merged []models.Finding
	merged = append(merged, staticFindings...)

	for _, aiF := range aiFindings {
		duplicate := false
		for i, sF := range merged {
			// If same file and within 2 lines of each other, merge details
			if strings.EqualFold(aiF.File, sF.File) && math.Abs(float64(aiF.Line-sF.Line)) <= 2 {
				duplicate = true
				// Enrich static finding with AI explanation if AI provided one
				if len(aiF.Explanation) > len(sF.Explanation) {
					merged[i].Explanation = aiF.Explanation
				}
				if aiF.ProposedFix != "" && sF.ProposedFix == "" {
					merged[i].ProposedFix = aiF.ProposedFix
				}
				merged[i].Source = "static_and_ai"
				break
			}
		}

		if !duplicate {
			merged = append(merged, aiF)
		}
	}

	return merged
}
