package static

import (
	"codereview-ai/models"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type Rule struct {
	ID             string
	Title          string
	Severity       string
	Category       string
	Language       string // "all", "go", "js", "py"
	FileExtensions []string
	Pattern        *regexp.Regexp
	Explanation    string
	Recommendation string
	ProposedFix    string
}

type Engine struct {
	rules []Rule
}

func NewEngine() *Engine {
	e := &Engine{}
	e.initRules()
	return e
}

func (e *Engine) initRules() {
	e.rules = []Rule{
		// 1. Hardcoded Secrets
		{
			ID:             "SEC-001",
			Title:          "Potential Hardcoded Secret or Token Detected",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".go", ".js", ".ts", ".jsx", ".tsx", ".py", ".env", ".json", ".yaml", ".yml"},
			Pattern:        regexp.MustCompile(`(?i)(api[_-]?key|secret[_-]?key|auth[_-]?token|jwt[_-]?secret|private[_-]?key|password)\s*[:=]\s*["']([A-Za-z0-9_\-\.]{10,})["']`),
			Explanation:    "Hardcoding secrets, API tokens, or credentials in source code exposes sensitive access to anyone with repository read privileges. Secrets committed to git history are difficult to revoke and frequently harvested by automated scrapers.",
			Recommendation: "Store credentials in environment variables (e.g. `os.Getenv`, `process.env`) or a secrets manager (AWS Secrets Manager, HashiCorp Vault), and exclude them from git via `.gitignore`.",
			ProposedFix:    "const secret = os.Getenv(\"JWT_SECRET\") // Retrieve securely from environment",
		},
		{
			ID:             "SEC-002",
			Title:          "AWS Access Key ID Detected",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".go", ".js", ".ts", ".py", ".json", ".yaml"},
			Pattern:        regexp.MustCompile(`AKIA[0-9A-Z]{16}`),
			Explanation:    "An AWS Access Key identifier pattern was detected in the patch. Exposing cloud credentials allows unauthorized resource provisioning, data exfiltration, or denial of service.",
			Recommendation: "Revoke this key immediately in AWS IAM and use IAM roles / instance metadata service or environment variables instead.",
			ProposedFix:    "cfg, err := config.LoadDefaultConfig(ctx) // Use AWS IAM Roles or AWS_PROFILE",
		},
		// 2. SQL Injection
		{
			ID:             "SEC-003",
			Title:          "SQL Injection Vulnerability via String Formatting",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "go",
			FileExtensions: []string{".go"},
			Pattern:        regexp.MustCompile(`(?i)(fmt\.Sprintf\([^)]*(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^)]*%s)|(db\.(Query|QueryRow|Exec)\([^)]*\+[^)]*\))`),
			Explanation:    "Constructing SQL statements by string formatting or string concatenation allows attackers to manipulate queries, bypass authentication, and extract or delete database records.",
			Recommendation: "Always use parameterized queries with placeholders (`?` or `$1`, `$2`) to separate SQL logic from untrusted user input.",
			ProposedFix:    "row := db.QueryRowContext(ctx, \"SELECT id, name FROM users WHERE id = ?\", userID)",
		},
		{
			ID:             "SEC-004",
			Title:          "SQL Injection Vulnerability in Python Query Execution",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "py",
			FileExtensions: []string{".py"},
			Pattern:        regexp.MustCompile(`(?i)(cursor\.execute|db\.execute)\s*\(\s*(f["']|["'].*%s["']\s*%)`),
			Explanation:    "Executing raw formatted SQL strings with f-strings or `%` allows untrusted input to break out of SQL literals.",
			Recommendation: "Pass parameters as a separate tuple argument to `cursor.execute(query, (param1, param2))`.",
			ProposedFix:    "cursor.execute(\"SELECT * FROM users WHERE email = %s\", (user_email,))",
		},
		// 3. Command Injection
		{
			ID:             "SEC-005",
			Title:          "Potential OS Command Injection Risk",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".go", ".py", ".js", ".ts"},
			Pattern:        regexp.MustCompile(`(?i)(exec\.Command\s*\(\s*["'](sh|bash|cmd)["'],\s*["']-c["']|subprocess\.(Popen|run|call)\s*\(.*shell\s*=\s*True|child_process\.exec\s*\()`),
			Explanation:    "Executing shell commands with shell interpretation (`shell=True`, `sh -c`, or `child_process.exec`) with variable parameters allows arbitrary command execution if input contains shell metacharacters (`;`, `|`, `&&`).",
			Recommendation: "Pass command and arguments as individual array elements without invoking an intermediate shell.",
			ProposedFix:    "exec.Command(\"convert\", filename, \"output.pdf\") // No shell evaluation",
		},
		// 4. Path Traversal
		{
			ID:             "SEC-006",
			Title:          "Path Traversal Risk via Unsanitized File Path",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".go", ".py", ".js", ".ts"},
			Pattern:        regexp.MustCompile(`(?i)(os\.Open|os\.ReadFile|open|fs\.readFile)\s*\(\s*(filepath\.Join\(.*(r\.URL|req\.|request\.)|f["'].*\{request\.)`),
			Explanation:    "Constructing file paths directly from user input without validation allows attackers to use directory traversal sequences (`../../etc/passwd`) to read or overwrite arbitrary server files.",
			Recommendation: "Sanitize user paths with `filepath.Clean` and verify the canonical path begins with the intended root directory.",
			ProposedFix:    "cleanPath := filepath.Clean(userInput)\nif !strings.HasPrefix(cleanPath, allowedDir) { return ErrInvalidPath }",
		},
		// 5. XSS & Dangerous HTML
		{
			ID:             "SEC-007",
			Title:          "Cross-Site Scripting (XSS) via dangerouslySetInnerHTML",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "js",
			FileExtensions: []string{".jsx", ".tsx", ".js", ".ts"},
			Pattern:        regexp.MustCompile(`dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*[^}]+\}\}`),
			Explanation:    "Directly injecting raw HTML into the DOM bypasses React's built-in XSS protections. If the HTML content originates from user input or untrusted APIs, attackers can inject malicious JavaScript to steal session tokens or perform actions on behalf of the user.",
			Recommendation: "Sanitize the HTML using a library like DOMPurify (`DOMPurify.sanitize(content)`) before rendering, or render plain text children.",
			ProposedFix:    "<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />",
		},
		// 6. Insecure Cryptography
		{
			ID:             "SEC-008",
			Title:          "Weak Cryptographic Hash Function (MD5/SHA-1)",
			Severity:       models.SeverityWarning,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".go", ".py", ".js", ".ts"},
			Pattern:        regexp.MustCompile(`(?i)(md5\.New\(\)|hashlib\.md5\(|crypto\.createHash\(['"]md5['"]\)|sha1\.New\(\)|hashlib\.sha1\()`),
			Explanation:    "MD5 and SHA-1 are cryptographically broken algorithms susceptible to hash collision and length extension attacks. They must not be used for password hashing, digital signatures, or security tokens.",
			Recommendation: "Use SHA-256 (`crypto/sha256`) for general hashing, or Argon2id / bcrypt for password hashing.",
			ProposedFix:    "h := sha256.New()\nh.Write(data)",
		},
		// 7. Resource Leaks: Missing resp.Body.Close() in Go
		{
			ID:             "BUG-001",
			Title:          "Missing HTTP Response Body Close (Resource Leak)",
			Severity:       models.SeverityWarning,
			Category:       models.CategoryBug,
			Language:       "go",
			FileExtensions: []string{".go"},
			Pattern:        regexp.MustCompile(`(http\.Get|http\.Post|client\.Do)\s*\(`),
			Explanation:    "In Go, failing to close `resp.Body` leaks TCP connections and file descriptors. Under high traffic, this exhausts connection pools and causes the service to hang.",
			Recommendation: "Always ensure `if resp != nil { defer resp.Body.Close() }` is called immediately following the error check.",
			ProposedFix:    "resp, err := client.Do(req)\nif err != nil { return err }\ndefer resp.Body.Close()",
		},
		// 8. Ignored Errors in Go
		{
			ID:             "QUAL-001",
			Title:          "Silently Ignored Error Return",
			Severity:       models.SeveritySuggestion,
			Category:       models.CategoryCodeQuality,
			Language:       "go",
			FileExtensions: []string{".go"},
			Pattern:        regexp.MustCompile(`_\s*=\s*(json\.Unmarshal|io\.Copy|os\.Remove|db\.Close)\(`),
			Explanation:    "Discarding errors with the blank identifier (`_`) masks runtime failures, making debugging difficult and potentially leaving system state corrupted.",
			Recommendation: "Inspect and log the error or propagate it to the caller.",
			ProposedFix:    "if err := json.Unmarshal(data, &target); err != nil {\n    return fmt.Errorf(\"parse failed: %w\", err)\n}",
		},
		// 9. Memory Leak in React useEffect
		{
			ID:             "BUG-002",
			Title:          "Potential Memory Leak: Missing Interval/Timer Cleanup in useEffect",
			Severity:       models.SeverityWarning,
			Category:       models.CategoryBug,
			Language:       "js",
			FileExtensions: []string{".jsx", ".tsx"},
			Pattern:        regexp.MustCompile(`(setInterval|addEventListener)\s*\(`),
			Explanation:    "Setting up intervals or event listeners inside React `useEffect` without returning a cleanup function keeps background timers active after the component unmounts, leading to memory leaks and invalid state updates.",
			Recommendation: "Return a cleanup function from `useEffect` that calls `clearInterval(timerId)` or `removeEventListener`.",
			ProposedFix:    "useEffect(() => {\n  const id = setInterval(poll, 5000);\n  return () => clearInterval(id);\n}, []);",
		},
		// 10. Insecure Deserialization in Python
		{
			ID:             "SEC-009",
			Title:          "Insecure Deserialization via pickle or unsafe YAML",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "py",
			FileExtensions: []string{".py"},
			Pattern:        regexp.MustCompile(`(?i)(pickle\.loads|yaml\.load\([^,)]+\))`),
			Explanation:    "Loading untrusted data using `pickle.loads` or `yaml.load` allows arbitrary code execution because pickle allows arbitrary object construction upon unpickling.",
			Recommendation: "Use `json.loads` for safe data serialization or `yaml.safe_load()` for YAML files.",
			ProposedFix:    "data = yaml.safe_load(user_content) # Use SafeLoader",
		},
		// 11. Arbitrary Code Execution via eval() or exec()
		{
			ID:             "SEC-010",
			Title:          "Arbitrary Code Execution via eval()",
			Severity:       models.SeverityCritical,
			Category:       models.CategorySecurity,
			Language:       "all",
			FileExtensions: []string{".py", ".js", ".ts"},
			Pattern:        regexp.MustCompile(`(?i)(eval\s*\(|exec\s*\()`),
			Explanation:    "Using `eval()` executes arbitrary code from string expressions. Passing untrusted input to eval allows attackers to run arbitrary system commands, read files, or compromise the host server.",
			Recommendation: "Avoid `eval()`. In Python, use `ast.literal_eval()` for safe expression evaluation or use a dedicated math parsing library like `simpleeval`.",
			ProposedFix:    "import ast\nreturn ast.literal_eval(value) # Safe evaluation without arbitrary code execution",
		},
		// 12. Concurrency Race: Map access without lock
		{
			ID:             "BUG-003",
			Title:          "Potential Concurrent Map Access",
			Severity:       models.SeverityWarning,
			Category:       models.CategoryBug,
			Language:       "go",
			FileExtensions: []string{".go"},
			Pattern:        regexp.MustCompile(`go\s+func\(.*\)\s*\{[^}]*([a-zA-Z0-9_]+\[[^\]]+\]\s*=)`),
			Explanation:    "Concurrent writes to a standard Go `map` without synchronization trigger fatal runtime panics.",
			Recommendation: "Protect map reads/writes with a `sync.RWMutex` or use `sync.Map`.",
			ProposedFix:    "mu.Lock()\ncache[key] = val\nmu.Unlock()",
		},
	}
}

// AnalyzePatch scans git diff patch lines and reports issues
func (e *Engine) AnalyzePatch(filename string, patch string) []models.Finding {
	var findings []models.Finding
	if patch == "" {
		return findings
	}

	lines := strings.Split(patch, "\n")
	currentLineNumber := 0
	hunkHeaderRegex := regexp.MustCompile(`^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@`)

	for _, line := range lines {
		// Detect git diff hunk header: @@ -old,count +new,count @@
		if strings.HasPrefix(line, "@@") {
			matches := hunkHeaderRegex.FindStringSubmatch(line)
			if len(matches) > 1 {
				num, err := strconv.Atoi(matches[1])
				if err == nil {
					currentLineNumber = num - 1
				}
			}
			continue
		}

		if strings.HasPrefix(line, "-") {
			// Removed line, skip
			continue
		}

		// Added or context line
		currentLineNumber++

		// We only trigger findings on ADDED lines in the PR
		if !strings.HasPrefix(line, "+") {
			continue
		}

		addedContent := strings.TrimPrefix(line, "+")

		for _, rule := range e.rules {
			if !matchesExtension(filename, rule.FileExtensions) {
				continue
			}

			if rule.Pattern.MatchString(addedContent) {
				finding := models.Finding{
					ID:             fmt.Sprintf("%s-%s-%d", rule.ID, sanitizeFilename(filename), currentLineNumber),
					Title:          rule.Title,
					Severity:       rule.Severity,
					Category:       rule.Category,
					File:           filename,
					Line:           currentLineNumber,
					RuleID:         rule.ID,
					Source:         "static_analysis",
					Explanation:    rule.Explanation,
					Recommendation: rule.Recommendation,
					CodeSnippet:    strings.TrimSpace(addedContent),
					ProposedFix:    rule.ProposedFix,
					Confidence:     "High",
				}
				findings = append(findings, finding)
			}
		}
	}

	return findings
}

func matchesExtension(filename string, exts []string) bool {
	for _, ext := range exts {
		if strings.HasSuffix(strings.ToLower(filename), strings.ToLower(ext)) {
			return true
		}
	}
	return false
}

func sanitizeFilename(path string) string {
	clean := strings.ReplaceAll(path, "/", "_")
	clean = strings.ReplaceAll(clean, ".", "_")
	return clean
}
