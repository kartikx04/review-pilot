# Vulnerable Test Repository & Demonstration Scenarios

This directory provides realistic test fixtures containing known security vulnerabilities, runtime bugs, and code smells across multiple programming languages. These files demonstrate the capabilities of **PRLens AI Code Reviewer** during college presentations, code audits, or unit testing.

---

### Test Scenarios

#### 1. Go Authentication Service (`vulnerable-repo/auth_service.go`)
- **SQL Injection (Critical - SEC-003)**: Uses `fmt.Sprintf` with unescaped user input to concatenate dynamic SQL. Allows authentication bypass (`' OR '1'='1`).
- **Hardcoded Secret (Critical - SEC-001)**: `jwt_secret` committed directly to source code. Exposes signing keys to repository readers.
- **Resource Leak (Warning - BUG-001)**: HTTP request executed without `defer resp.Body.Close()`, causing socket pool exhaustion.

#### 2. React User Profile Widget (`vulnerable-repo/UserProfileWidget.tsx`)
- **Stored XSS (Critical - SEC-007)**: `dangerouslySetInnerHTML={{ __html: user.bio }}` renders raw user-supplied HTML into the DOM without sanitization via DOMPurify.
- **Memory Leak (Warning - BUG-002)**: `setInterval` running inside `useEffect` without returning a cleanup function (`clearInterval`). Keeps timers alive when component unmounts.

#### 3. Python Document API (`vulnerable-repo/exporter.py`)
- **Command Injection (Critical - SEC-005)**: `subprocess.run(..., shell=True)` formats untrusted input into shell command line. An attacker can append `; rm -rf /` or reverse shells.
- **Path Traversal (Critical - SEC-006)**: `open(f"/var/data/reports/{path}")` allows directory traversal (`../../etc/passwd`).
- **Insecure Deserialization (Critical - SEC-009)**: `yaml.load` executes arbitrary Python objects if supplied maliciously. Requires `yaml.safe_load()`.

---

### How to Test in PRLens
1. Start both the backend and frontend.
2. In the UI, click **"Load Demo Sample"** in the top selector.
3. Select any of the pre-configured samples to trigger instant static analysis + AI review.
4. Or, copy any snippet from these files into the **"Paste Custom Git Diff"** tab.
