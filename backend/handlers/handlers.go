package handlers

import (
	"codereview-ai/analyzer"
	"codereview-ai/github"
	"codereview-ai/models"
	"codereview-ai/samples"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"
)

type APIHandler struct {
	aggregator *analyzer.Aggregator
}

func NewAPIHandler() *APIHandler {
	return &APIHandler{
		aggregator: analyzer.NewAggregator(),
	}
}

// EnableCORS sets headers for cross-origin frontend requests
func EnableCORS(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return true
	}
	return false
}

// HandleHealth provides a status check
func (h *APIHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	response := map[string]interface{}{
		"status":    "healthy",
		"service":   "PRLens AI Code Reviewer API",
		"version":   "1.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
	}

	writeJSON(w, http.StatusOK, response)
}

// HandleGetSamples returns pre-built sample PRs with known bugs
func (h *APIHandler) HandleGetSamples(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	writeJSON(w, http.StatusOK, samples.Catalog)
}

// HandleReview processes GitHub PR URLs, sample PRs, or custom diffs
func (h *APIHandler) HandleReview(w http.ResponseWriter, r *http.Request) {
	if EnableCORS(w, r) {
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.PRReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "Invalid request JSON payload: "+err.Error())
		return
	}

	// Provider credentials live only in the server process; never accept them from React.
	provider := strings.ToLower(req.AIProvider)
	apiKey := os.Getenv("GEMINI_API_KEY")
	model := os.Getenv("GEMINI_MODEL")
	if provider == "groq" {
		apiKey = os.Getenv("GROQ_API_KEY")
		model = os.Getenv("GROQ_MODEL")
	}
	if req.Model != "" {
		model = req.Model
	}

	ghToken := req.GitHubToken
	if ghToken == "" {
		ghToken = os.Getenv("GITHUB_TOKEN")
	}

	var pr models.PullRequest
	var files []models.FileChange

	// Case A: Sample PR selected
	if req.SampleID != "" {
		sample := samples.GetSampleByID(req.SampleID)
		if sample == nil {
			writeJSONError(w, http.StatusNotFound, "Sample PR with ID '"+req.SampleID+"' not found")
			return
		}
		pr = sample.PR
		files = sample.Files
	} else if req.CustomDiff != "" {
		// Case B: Custom diff pasted directly
		title := req.CustomTitle
		if title == "" {
			title = "Custom Git Diff Review"
		}
		pr = models.PullRequest{
			Number:       1,
			Title:        title,
			Body:         "Reviewing manually supplied code patch",
			State:        "open",
			HTMLURL:      "https://github.com/local/custom-review/pull/1",
			Owner:        "developer",
			Repo:         "custom-submission",
			BaseRef:      "main",
			HeadRef:      "patch-1",
			Additions:    strings.Count(req.CustomDiff, "\n+"),
			Deletions:    strings.Count(req.CustomDiff, "\n-"),
			ChangedFiles: 1,
			Author:       "developer",
			AuthorAvatar: "https://avatars.githubusercontent.com/u/583231?v=4",
		}

		filename := "custom_submission.go"
		if strings.Contains(req.CustomDiff, "dangerouslySetInnerHTML") || strings.Contains(req.CustomDiff, "useEffect") || strings.Contains(req.CustomDiff, "useState") || strings.Contains(req.CustomDiff, "const [") {
			filename = "custom_submission.tsx"
		} else if strings.Contains(req.CustomDiff, "def ") || (strings.Contains(req.CustomDiff, "import ") && strings.Contains(req.CustomDiff, "subprocess")) {
			filename = "custom_submission.py"
		}

		files = []models.FileChange{
			{
				Filename:  filename,
				Status:    "modified",
				Additions: pr.Additions,
				Deletions: pr.Deletions,
				Changes:   pr.Additions + pr.Deletions,
				Patch:     req.CustomDiff,
			},
		}
	} else if req.PRURL != "" {
		// Case C: GitHub PR URL provided
		owner, repo, number, err := github.ParsePRURL(req.PRURL)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}

		ghClient := github.NewClient(ghToken)

		fetchedPR, err := ghClient.FetchPR(owner, repo, number)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}

		fetchedFiles, err := ghClient.FetchPRFiles(owner, repo, number)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, err.Error())
			return
		}

		pr = *fetchedPR
		files = fetchedFiles
	} else {
		writeJSONError(w, http.StatusBadRequest, "Please provide a GitHub PR URL, select a sample PR, or paste a custom diff")
		return
	}

	// Run static analysis & AI review
	reviewResult, err := h.aggregator.ReviewPullRequest(r.Context(), pr, files, req.AIProvider, apiKey, model)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "Failed to analyze pull request: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, reviewResult)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]interface{}{
		"error":   message,
		"status":  status,
		"success": false,
	})
}
