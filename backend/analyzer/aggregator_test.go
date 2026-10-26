package analyzer

import (
	"codereview-ai/models"
	"context"
	"testing"
)

func TestReviewPullRequestBlocksNonProgressingBinarySearch(t *testing.T) {
	patch := `@@ -1,0 +1,14 @@
+def binary_search(arr, target):
+    left = 0
+    right = len(arr) - 1
+    while left < right:
+        mid = (left + right) // 2
+        if arr[mid] == target:
+            return mid
+        elif arr[mid] < target:
+            left = mid
+        else:
+            right = mid - 1
+    return -1`

	response, err := NewAggregator().ReviewPullRequest(
		context.Background(),
		models.PullRequest{Title: "fix search"},
		[]models.FileChange{{Filename: "search.py", Patch: patch, Additions: 12}},
		"local", "", "",
	)
	if err != nil {
		t.Fatalf("ReviewPullRequest returned error: %v", err)
	}
	if response.Summary.Verdict != models.VerdictChangesRequested {
		t.Fatalf("expected blocking verdict, got %s", response.Summary.Verdict)
	}
	if response.Summary.AIReviewStatus != "local" {
		t.Fatalf("expected local AI status, got %s", response.Summary.AIReviewStatus)
	}
	if response.Summary.AIProvider != "local" {
		t.Fatalf("expected local AI provider, got %s", response.Summary.AIProvider)
	}
}
