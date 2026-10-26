package ai

import (
	"codereview-ai/models"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGeminiInteractionsReviewParsesStructuredFindings(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-goog-api-key") != "test-key" {
			t.Error("Gemini API key was not sent in the request header")
		}
		if r.URL.Path != "/interactions" {
			t.Errorf("unexpected endpoint path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"completed","steps":[{"type":"model_output","content":[{"type":"text","text":"{\"summary\":\"Found a loop bug\",\"verdict\":\"CHANGES_REQUESTED\",\"positive_aspects\":[],\"missing_tests\":[],\"findings\":[{\"title\":\"Loop does not progress\",\"severity\":\"Critical\",\"category\":\"Bug\",\"file\":\"search.py\",\"line\":9,\"explanation\":\"left remains mid\",\"recommendation\":\"use mid + 1\",\"confidence\":\"High\"}]}"}]}]}`))
	}))
	defer server.Close()

	engine := NewEngine()
	engine.geminiURL = server.URL + "/interactions"
	result, err := engine.ReviewCode(context.Background(), models.PullRequest{Title: "binary search"}, []models.FileChange{{Filename: "search.py", Patch: "+left = mid"}}, "gemini", "test-key", "")
	if err != nil {
		t.Fatalf("ReviewCode returned error: %v", err)
	}
	if len(result.Findings) != 1 || result.Findings[0].Source != "ai_review" || result.Findings[0].ID == "" {
		t.Fatalf("expected one normalized AI finding, got %#v", result.Findings)
	}
}

func TestConfiguredProviderDoesNotSilentlyFallBackOnFailure(t *testing.T) {
	engine := NewEngine()
	engine.geminiURL = "http://127.0.0.1:1/interactions"
	if _, err := engine.ReviewCode(context.Background(), models.PullRequest{}, nil, "gemini", "test-key", ""); err == nil {
		t.Fatal("expected external provider failure instead of a local fallback")
	}
}
