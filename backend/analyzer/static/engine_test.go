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
