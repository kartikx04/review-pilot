package models

// Severity levels for findings
const (
	SeverityCritical   = "Critical"
	SeverityWarning    = "Warning"
	SeveritySuggestion = "Suggestion"
)

// Category types for findings
const (
	CategorySecurity     = "Security"
	CategoryBug          = "Bug"
	CategoryCodeQuality  = "Code Quality"
	CategoryTestCoverage = "Test Coverage"
)

// ReviewVerdict represents overall assessment
const (
	VerdictChangesRequested = "CHANGES_REQUESTED"
	VerdictNeedsReview      = "NEEDS_REVIEW"
	VerdictApprovedWithTips = "APPROVED_WITH_SUGGESTIONS"
	VerdictApproved         = "APPROVED"
)

// PRReviewRequest is the payload sent from the frontend
type PRReviewRequest struct {
	PRURL       string `json:"pr_url"`
	GitHubToken string `json:"github_token,omitempty"`
	AIProvider  string `json:"ai_provider,omitempty"` // "gemini", "groq", or "local"
	APIKey      string `json:"api_key,omitempty"`
	Model       string `json:"model,omitempty"`
	SampleID    string `json:"sample_id,omitempty"`
	CustomDiff  string `json:"custom_diff,omitempty"`
	CustomTitle string `json:"custom_title,omitempty"`
}

// PullRequest details parsed from GitHub or sample
type PullRequest struct {
	Number       int    `json:"number"`
	Title        string `json:"title"`
	Body         string `json:"body"`
	State        string `json:"state"`
	HTMLURL      string `json:"html_url"`
	Owner        string `json:"owner"`
	Repo         string `json:"repo"`
	BaseRef      string `json:"base_ref"`
	HeadRef      string `json:"head_ref"`
	Additions    int    `json:"additions"`
	Deletions    int    `json:"deletions"`
	ChangedFiles int    `json:"changed_files"`
	Author       string `json:"author"`
	AuthorAvatar string `json:"author_avatar"`
}

// FileChange holds single file diff information
type FileChange struct {
	Filename    string `json:"filename"`
	Status      string `json:"status"` // added, modified, removed
	Additions   int    `json:"additions"`
	Deletions   int    `json:"deletions"`
	Changes     int    `json:"changes"`
	Patch       string `json:"patch"`
	RawURL      string `json:"raw_url,omitempty"`
	OldFilename string `json:"old_filename,omitempty"`
}

// Finding represents an individual issue, vulnerability, or suggestion
type Finding struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	Severity       string `json:"severity"`        // Critical, Warning, Suggestion
	Category       string `json:"category"`        // Security, Bug, Code Quality, Test Coverage
	File           string `json:"file"`
	Line           int    `json:"line"`
	EndLine        int    `json:"end_line,omitempty"`
	RuleID         string `json:"rule_id,omitempty"`
	Source         string `json:"source"`          // "static_analysis" or "ai_review"
	Explanation    string `json:"explanation"`
	Recommendation string `json:"recommendation"`
	CodeSnippet    string `json:"code_snippet,omitempty"`
	ProposedFix    string `json:"proposed_fix,omitempty"`
	Confidence     string `json:"confidence"`      // High, Medium, Low
}

// ReviewSummary gives high-level overview metrics
type ReviewSummary struct {
	TotalFindings       int      `json:"total_findings"`
	CriticalCount       int      `json:"critical_count"`
	WarningCount        int      `json:"warning_count"`
	SuggestionCount     int      `json:"suggestion_count"`
	SecurityScore       int      `json:"security_score"` // 0 - 100
	Verdict             string   `json:"verdict"`
	VerdictMessage      string   `json:"verdict_message"`
	SummaryText         string   `json:"summary_text"`
	PositiveAspects     []string `json:"positive_aspects"`
	MissingTests        []string `json:"missing_tests"`
	AnalyzedFilesCount  int      `json:"analyzed_files_count"`
	LinesAnalyzed       int      `json:"lines_analyzed"`
	DurationMs          int64    `json:"duration_ms"`
	StaticAnalysisFound int      `json:"static_analysis_found"`
	AIFound             int      `json:"ai_found"`
}

// ReviewResponse is the full result returned to client
type ReviewResponse struct {
	PullRequest PullRequest   `json:"pull_request"`
	Summary     ReviewSummary `json:"summary"`
	Findings    []Finding     `json:"findings"`
	Files       []FileChange  `json:"files"`
}

// SamplePR represents a pre-configured scenario with known vulnerabilities
type SamplePR struct {
	ID          string       `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Language    string       `json:"language"`
	Tags        []string     `json:"tags"`
	PR          PullRequest  `json:"pr"`
	Files       []FileChange `json:"files"`
}
