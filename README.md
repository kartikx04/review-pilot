# PRLens — AI-Powered GitHub PR Code Review & Security Auditor

> **An AI-assisted code review and static analysis tool that audits GitHub pull requests for critical bugs, security vulnerabilities, code smells, and missing test cases before merging.**

Built with **Golang**, **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. Designed to be lightweight, developer-first, and demonstration-ready for college projects and engineering presentations.

---

## 🌟 Key Features

1. **GitHub Pull Request Analysis**
   - Parses public or private GitHub PR URLs (e.g. `https://github.com/owner/repo/pull/123`).
   - Fetches PR metadata (author, branch, commit stats) and file diff patches using the GitHub REST API.
   - Built-in GitHub Personal Access Token support for private repos and increased rate limits.

2. **Static Code Analysis Engine (Go)**
   - High-performance, zero-dependency pattern and heuristic analyzer implemented in Go.
   - Scans newly added lines (`+`) in unified git diffs for:
     - **Hardcoded Secrets**: Leaked JWT secrets, API tokens, AWS keys, and private keys (`SEC-001`, `SEC-002`).
     - **SQL Injection**: String concatenation and raw formatting in SQL queries (`SEC-003`, `SEC-004`).
     - **Command Injection**: `subprocess(shell=True)`, `exec.Command("sh", "-c")` (`SEC-005`).
     - **Path Traversal**: Unsanitized filesystem access via request parameters (`SEC-006`).
     - **Cross-Site Scripting (XSS)**: Unsanitized DOM injection via `dangerouslySetInnerHTML` (`SEC-007`).
     - **Resource Leaks**: Missing `defer resp.Body.Close()` in Go HTTP requests (`BUG-001`).
     - **Memory Leaks**: `setInterval` / event listeners in React `useEffect` without cleanup (`BUG-002`).
     - **Concurrency Races**: Unsynchronized map writes in Go goroutines (`BUG-003`).
     - **Missing Test Suites**: Flags critical new business logic introduced without accompanying tests.

3. **AI-Powered Code Review Engine**
   - Supports **Google Gemini** (`gemini-2.0-flash` / `gemini-1.5-flash`) and **Groq** (`llama-3.3-70b-versatile`).
   - Returns structured JSON findings containing plain-English explanations, severity ratings, and actionable code replacements.
   - **Intelligent Local Engine Fallback**: Includes a built-in heuristic review engine that operates completely offline—guaranteeing 100% reliability during live college presentations without requiring API keys or incurring rate limits!

4. **Structured Review Dashboard**
   - **Severity Tiers**: `Critical` (blocks merge), `Warning` (bugs & leaks), and `Suggestion` (quality & style).
   - **Security Health Score (0-100)**: Visual gauge calculating PR risk.
   - **Review Verdict**: `CHANGES_REQUESTED`, `APPROVED_WITH_SUGGESTIONS`, or `APPROVED`.
   - **Developer Decides**: Developer retains final authority with **"Accept Suggestion"** and **"Mark as False Positive"** controls.
   - **Interactive File Diff Viewer**: Color-coded unified git diffs with inline security annotations.
   - **1-Click Copy Proposed Fix**: Instantly copies suggested code replacement to clipboard.
   - **Report Exporter**: Generates formatted Markdown summaries ready to paste into GitHub PR comments or download as JSON.

5. **1-Click Demo Scenarios (No GitHub PR Needed!)**
   - Four pre-built vulnerability PRs included right on the dashboard:
     - ⚡ **Go Auth Service**: SQL injection, hardcoded JWT secret, unclosed HTTP body.
     - ⚡ **React Profile Widget**: Stored XSS via raw HTML, memory leak in `setInterval`.
     - ⚡ **Python Document API**: Remote command injection, path traversal, unsafe YAML parsing.
     - ⚡ **Inventory Service**: Goroutine race condition on shared map, zero test files.

---

## 🏗️ Architecture & Project Structure

```
pr-review-ai/
├── backend/
│   ├── main.go                     # Unified HTTP server (API + static SPA frontend)
│   ├── go.mod                      # Pure Go standard library (zero external deps)
│   ├── models/
│   │   └── models.go               # Data contracts (PullRequest, Finding, Summary)
│   ├── github/
│   │   ├── client.go               # GitHub REST API client & URL parser
│   │   └── client_test.go          # Unit tests for GitHub URL parsing
│   ├── analyzer/
│   │   ├── aggregator.go           # Merges static analysis + AI findings & scores PR
│   │   ├── static/
│   │   │   ├── engine.go           # Static regex & heuristic vulnerability engine
│   │   │   └── engine_test.go      # Unit tests for SQLi, XSS, secrets, and shell injection
│   │   └── ai/
│   │       └── engine.go           # Google Gemini, Groq, and Local Heuristic reviewer
│   ├── handlers/
│   │   └── handlers.go             # CORS-enabled REST endpoints (/api/review, /api/samples)
│   └── samples/
│       └── samples.go              # Built-in vulnerability fixtures for 1-click demos
├── frontend/
│   ├── package.json
│   ├── vite.config.ts              # Vite configuration with proxy to Go backend
│   ├── tailwind.config.js          # Tailwind CSS styling
│   └── src/
│       ├── main.tsx                # React root mount
│       ├── App.tsx                 # Main application controller
│       ├── types/index.ts          # TypeScript type definitions
│       ├── services/api.ts         # REST API client & localStorage settings
│       └── components/
│           ├── Navbar.tsx          # Brand, health indicator, settings & export triggers
│           ├── PrInputForm.tsx     # PR URL input, 1-click demo pills, custom diff paste
│           ├── OverviewMetrics.tsx # Verdict banner, health score gauge, metric cards
│           ├── FindingsList.tsx    # Filterable list (severity, category, search, decision)
│           ├── FindingCard.tsx     # Expandable card with explanation, diff & fix copy
│           ├── FileDiffViewer.tsx  # Unified git diff viewer with inline annotations
│           ├── PositiveAspectsCard.tsx # Good practices & test coverage suggestions
│           ├── SettingsModal.tsx   # Gemini / Groq API key & GitHub token settings
│           └── ExportModal.tsx     # Markdown & JSON review exporter
├── samples/
│   ├── README.md                   # Detailed vulnerability walkthrough
│   └── vulnerable-repo/            # Source code test files
│       ├── auth_service.go
│       ├── UserProfileWidget.tsx
│       └── exporter.py
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Golang**: 1.20+ (`go version`)
- **Node.js**: 18+ & **npm** (`node -v && npm -v`)

---

### Option 1: Run the Unified Go Server (Recommended & Simplest)

The Go backend automatically serves the compiled React dashboard and all API endpoints on a single port:

```bash
# 1. Build the React frontend once
cd frontend
npm install
npm run build

# 2. Run the Go backend
cd ../backend
go run main.go
```

Open your browser to: **`http://localhost:8080`**

---

### Option 2: Run in Development Mode (Live Hot-Reloading)

```bash
# Terminal 1: Start Go Backend
cd backend
go run main.go

# Terminal 2: Start Vite Frontend Dev Server
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run backend static analysis and GitHub URL parser unit tests:

```bash
cd backend
go test -v ./...
```

Sample output:
```
=== RUN   TestEngineDetectsSQLInjection
--- PASS: TestEngineDetectsSQLInjection (0.00s)
=== RUN   TestEngineDetectsHardcodedSecret
--- PASS: TestEngineDetectsHardcodedSecret (0.00s)
=== RUN   TestEngineDetectsReactXSS
--- PASS: TestEngineDetectsReactXSS (0.00s)
=== RUN   TestEngineDetectsCommandInjection
--- PASS: TestEngineDetectsCommandInjection (0.00s)
PASS
ok  	codereview-ai/analyzer/static	0.447s
=== RUN   TestParsePRURL
--- PASS: TestParsePRURL (0.00s)
PASS
ok  	codereview-ai/github	0.732s
```

---

## 🎓 College Project Demonstration Guide

When presenting this project to evaluators or professors, follow this structured demo script:

### Step 1: Open the Application Dashboard
- Navigate to `http://localhost:8080`.
- Highlight the **clean, responsive dark-mode UI** with real-time backend connection status (`Go Backend Ready`).

### Step 2: 1-Click Vulnerability Scenarios
- Explain that rather than requiring real live GitHub PR creation during an exam/presentation, PRLens includes 4 realistic test scenarios:
  1. Click **`Go Auth Service: SQL Injection & Hardcoded JWT Secret`**:
     - Point out the **Security Score** drop to `20/100` and the verdict: **`CHANGES_REQUESTED (Blocks Merge)`**.
     - Review the findings:
       - **SQL Injection (`SEC-003`)**: Explains how string interpolation allows SQL tampering, with recommended parameterized query.
       - **Hardcoded Secret (`SEC-001`)**: Explains credential leakage risk and offers `os.Getenv("JWT_SECRET")` fix.
       - **HTTP Body Leak (`BUG-001`)**: Identifies missing `defer resp.Body.Close()`.
  2. Click **`React Dashboard: Stored XSS & Memory Leak`**:
     - Highlights `dangerouslySetInnerHTML` with `DOMPurify` replacement.
     - Flags uncleaned `setInterval` timer inside `useEffect`.
  3. Click **`Python Document API: Command Injection & Path Traversal`**:
     - Flags `subprocess.run(shell=True)` and insecure `yaml.load`.

### Step 3: Test Real GitHub PR or Custom Diff
- Switch to the **"Paste Custom Git Diff"** tab.
- Paste any unified diff snippet or click "Reset to Vulnerable Sample Diff".
- Click **"Analyze Diff Patch"** to demonstrate instant scanning.

### Step 4: Developer Decision-Making
- Emphasize that **the developer retains final authority**:
  - Click **"Accept Suggestion"** on a finding to mark it resolved.
  - Click **"Mark as False Positive"** on an intentional pattern.
  - Notice the finding state updates cleanly.

### Step 5: Exporting the Report
- Click **"Export Report"** in the top navigation bar.
- Show the auto-generated **GitHub Markdown PR Review Comment** containing the verdict, metric table, code diffs, and developer resolution status.
- Demonstrate **1-click Copy Markdown** and **Download .json / .md**.

### Step 6: Configuration & LLM Flexibility
- Click **Settings**:
  - Show the toggle between **Local Engine** (offline, zero-cost), **Google Gemini**, and **Groq**.
  - Show optional GitHub Token configuration to bypass rate limits.

---

## 🔒 Security Best Practices Implemented
- Sanitized HTML preview via text nodes and Markdown code fences.
- Zero credential logging; API keys stored client-side in browser `localStorage`.
- Comprehensive CORS security headers configured on Go HTTP handlers.
- Pure Go standard library networking with strict request timeouts.

---

## 📄 License
This project is open-source and intended for educational and engineering demonstration purposes.
