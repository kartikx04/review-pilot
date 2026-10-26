package analyzer

import (
	"codereview-ai/models"
	"testing"
)

func TestMergeFindingsPreservesDistinctNearbyAIFindings(t *testing.T) {
	aiFindings := []models.Finding{
		{ID: "AI-1", File: "min_cost_flow.py", Line: 37, Title: "Hardcoded flow increment"},
		{ID: "AI-2", File: "min_cost_flow.py", Line: 39, Title: "Reverse residual edge is missing"},
	}

	merged := mergeFindings(nil, aiFindings)
	if len(merged) != 2 {
		t.Fatalf("expected both nearby AI findings, got %#v", merged)
	}
	if merged[0].Source == "static_and_ai" || merged[1].Source == "static_and_ai" {
		t.Fatal("AI-only findings must not be labeled static_and_ai")
	}
}

func TestMergeFindingsStillEnrichesMatchingStaticFinding(t *testing.T) {
	staticFinding := models.Finding{File: "search.py", Line: 10, Explanation: "short"}
	aiFinding := models.Finding{File: "search.py", Line: 11, Explanation: "more detailed explanation", ProposedFix: "left = mid + 1"}

	merged := mergeFindings([]models.Finding{staticFinding}, []models.Finding{aiFinding})
	if len(merged) != 1 || merged[0].Source != "static_and_ai" {
		t.Fatalf("expected one combined static/AI finding, got %#v", merged)
	}
	if merged[0].Explanation != aiFinding.Explanation || merged[0].ProposedFix != aiFinding.ProposedFix {
		t.Fatalf("expected AI details to enrich static finding, got %#v", merged[0])
	}
}
