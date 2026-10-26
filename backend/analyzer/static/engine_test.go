package static

import (
	"codereview-ai/models"
	"testing"
)

func TestEngineDetectsSQLInjection(t *testing.T) {
	engine := NewEngine()
	patch := `@@ -1,3 +1,5 @@
+func GetUser(id string) {
+	query := fmt.Sprintf("SELECT * FROM users WHERE id = '%s'", id)
+	db.Query(query)
+}`
	findings := engine.AnalyzePatch("user_repo.go", patch)
	if len(findings) == 0 {
		t.Fatalf("Expected SQL injection finding, got 0")
	}

	found := false
	for _, f := range findings {
		if f.RuleID == "SEC-003" && f.Severity == models.SeverityCritical {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected SEC-003 SQL injection rule match")
	}
}

func TestEngineDetectsHardcodedSecret(t *testing.T) {
	engine := NewEngine()
	patch := `@@ -1,2 +1,4 @@
+const jwt_secret = "my-super-secret-production-token-12345"
+var apiKey = "1234567890abcdef"
`
	findings := engine.AnalyzePatch("config.go", patch)
	if len(findings) == 0 {
		t.Fatalf("Expected secret finding, got 0")
	}

	foundSecret := false
	for _, f := range findings {
		if f.RuleID == "SEC-001" {
			foundSecret = true
			break
		}
	}
	if !foundSecret {
		t.Errorf("Expected SEC-001 rule match")
	}
}

func TestEngineDetectsReactXSS(t *testing.T) {
	engine := NewEngine()
	patch := `@@ -1,2 +1,4 @@
+export function Bio({ bioHtml }) {
+  return <div dangerouslySetInnerHTML={{ __html: bioHtml }} />;
+}`
	findings := engine.AnalyzePatch("Bio.tsx", patch)
	found := false
	for _, f := range findings {
		if f.RuleID == "SEC-007" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected SEC-007 React XSS rule match")
	}
}

func TestEngineDetectsCommandInjection(t *testing.T) {
	engine := NewEngine()
	patch := `@@ -1,2 +1,4 @@
+def run_report(name):
+    subprocess.run(f"cat {name}", shell=True)
+`
	findings := engine.AnalyzePatch("exporter.py", patch)
	found := false
	for _, f := range findings {
		if f.RuleID == "SEC-005" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected SEC-005 command injection rule match")
	}
}

func TestEngineDetectsEvalDangerousExecution(t *testing.T) {
	engine := NewEngine()
	patch := `@@ -1,2 +1,2 @@
 def calculate(value):
-    return value
+    return eval(value)`

	findings := engine.AnalyzePatch("calculator.py", patch)
	found := false
	for _, f := range findings {
		if f.RuleID == "SEC-010" && f.Severity == models.SeverityCritical {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected SEC-010 eval rule match")
	}
}

func TestEngineDetectsUnsafeYAMLLoaderWithExplicitLoader(t *testing.T) {
	patch := `@@ -1,0 +1,4 @@
+import yaml
+
+def load_config(config_text):
+    return yaml.load(config_text, Loader=yaml.Loader)`

	findings := NewEngine().AnalyzePatch("config_loader.py", patch)
	for _, finding := range findings {
		if finding.RuleID == "SEC-009" && finding.Severity == models.SeverityCritical {
			return
		}
	}
	t.Fatal("expected SEC-009 for yaml.load with yaml.Loader")
}

func TestEngineDetectsNonProgressingBinarySearch(t *testing.T) {
	patch := `@@ -1,0 +1,14 @@
+def binary_search(arr, target):
+    left = 0
+    right = len(arr) - 1
+    while left < right:
+        mid = (left + right) // 2
+        if arr[mid] == target:
+            return mid
+        elif arr[mid] < target:
+            left = mid  # Bug: should be mid + 1
+        else:
+            right = mid - 1
+    return -1`

	findings := NewEngine().AnalyzePatch("search.py", patch)
	for _, finding := range findings {
		if finding.RuleID == "BUG-004" && finding.Severity == models.SeverityCritical {
			return
		}
	}
	t.Fatal("expected BUG-004 for a non-progressing binary-search lower bound")
}

func TestEngineDoesNotFlagCorrectBinarySearchProgress(t *testing.T) {
	patch := `@@ -1,0 +1,14 @@
+def binary_search(arr, target):
+    left = 0
+    right = len(arr) - 1
+    while left < right:
+        mid = (left + right) // 2
+        if arr[mid] == target:
+            return mid
+        elif arr[mid] < target:
+            left = mid + 1
+        else:
+            right = mid - 1
+    return -1`

	findings := NewEngine().AnalyzePatch("search.py", patch)
	for _, finding := range findings {
		if finding.RuleID == "BUG-004" {
			t.Fatal("did not expect BUG-004 for a progressing lower bound")
		}
	}
}

func TestEngineDetectsUnconditionalDijkstraRelaxation(t *testing.T) {
	patch := `@@ -1,0 +1,12 @@
+import heapq
+def dijkstra(graph, start):
+    distances = {node: float("inf") for node in graph}
+    queue = [(0, start)]
+    while queue:
+        current_distance, node = heapq.heappop(queue)
+        for neighbor, weight in graph[node]:
+            new_distance = current_distance + weight
+            distances[neighbor] = new_distance
+            heapq.heappush(queue, (new_distance, neighbor))`

	findings := NewEngine().AnalyzePatch("dijkstra.py", patch)
	for _, finding := range findings {
		if finding.RuleID == "BUG-005" && finding.Severity == models.SeverityCritical {
			return
		}
	}
	t.Fatal("expected BUG-005 for an unconditional Dijkstra relaxation")
}

func TestEngineDoesNotFlagGuardedDijkstraRelaxation(t *testing.T) {
	patch := `@@ -1,0 +1,13 @@
+import heapq
+def dijkstra(graph, start):
+    distances = {node: float("inf") for node in graph}
+    queue = [(0, start)]
+    while queue:
+        current_distance, node = heapq.heappop(queue)
+        for neighbor, weight in graph[node]:
+            new_distance = current_distance + weight
+            if new_distance < distances[neighbor]:
+                distances[neighbor] = new_distance
+                heapq.heappush(queue, (new_distance, neighbor))`

	findings := NewEngine().AnalyzePatch("dijkstra.py", patch)
	for _, finding := range findings {
		if finding.RuleID == "BUG-005" {
			t.Fatal("did not expect BUG-005 for a guarded Dijkstra relaxation")
		}
	}
}
