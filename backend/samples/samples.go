package samples

import "codereview-ai/models"

var Catalog = []models.SamplePR{
	{
		ID:          "sample-go-sqli-secrets",
		Title:       "Go Auth Service: SQL Injection & Hardcoded JWT Secret",
		Description: "Simulates an authentication service PR containing raw SQL query formatting, a hardcoded production secret, and unclosed HTTP response body.",
		Language:    "Go",
		Tags:        []string{"Security", "SQLi", "Hardcoded Secret", "Go"},
		PR: models.PullRequest{
			Number:       42,
			Title:        "feat(auth): Add user authentication handler and JWT token issuance",
			Body:         "Implements user login endpoint `/api/v1/auth/login` with database lookup, JWT signing, and external auth server health check.",
			State:        "open",
			HTMLURL:      "https://github.com/acme-corp/auth-service/pull/42",
			Owner:        "acme-corp",
			Repo:         "auth-service",
			BaseRef:      "main",
			HeadRef:      "feat/user-login",
			Additions:    38,
			Deletions:    4,
			ChangedFiles: 1,
			Author:       "dev-intern",
			AuthorAvatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
		},
		Files: []models.FileChange{
			{
				Filename:  "services/auth_service.go",
				Status:    "modified",
				Additions: 38,
				Deletions: 4,
				Changes:   42,
				Patch: `@@ -12,4 +12,38 @@ import (
 	"database/sql"
+	"fmt"
+	"net/http"
+	"time"
 )

+// JWT signing configuration
+const jwt_secret = "super-secret-production-jwt-token-2024"

+func (s *AuthService) AuthenticateUser(username, password string) (*User, error) {
+	// Execute database query for credentials
+	query := fmt.Sprintf("SELECT id, username, role FROM users WHERE username = '%s' AND password_hash = '%s'", username, password)
+	row := s.db.QueryRow(query)
+
+	var u User
+	if err := row.Scan(&u.ID, &u.Username, &u.Role); err != nil {
+		return nil, err
+	}
+
+	// Ping audit service
+	resp, err := http.Get("https://audit.internal.acme.com/ping")
+	if err != nil {
+		fmt.Println("Warning: audit ping failed", err)
+	}
+
+	return &u, nil
+}`,
			},
		},
	},
	{
		ID:          "sample-react-xss-leak",
		Title:       "React Dashboard: Stored XSS & Memory Leak",
		Description: "A React pull request introducing dangerous HTML rendering without sanitization and an uncleaned setInterval timer in useEffect.",
		Language:    "TypeScript/React",
		Tags:        []string{"Security", "XSS", "Memory Leak", "React"},
		PR: models.PullRequest{
			Number:       108,
			Title:        "feat(profile): Render rich user bio and real-time activity tracker",
			Body:         "Displays markdown/HTML bios from user profile payload and polls user activity statistics every 3 seconds.",
			State:        "open",
			HTMLURL:      "https://github.com/cloud-nexus/dashboard-web/pull/108",
			Owner:        "cloud-nexus",
			Repo:         "dashboard-web",
			BaseRef:      "main",
			HeadRef:      "feature/rich-profile",
			Additions:    32,
			Deletions:    2,
			ChangedFiles: 1,
			Author:       "frontend-wizard",
			AuthorAvatar: "https://avatars.githubusercontent.com/u/2049182?v=4",
		},
		Files: []models.FileChange{
			{
				Filename:  "src/components/UserProfileWidget.tsx",
				Status:    "modified",
				Additions: 32,
				Deletions: 2,
				Changes:   34,
				Patch: `@@ -8,2 +8,32 @@ import React, { useState, useEffect } from 'react';
 
+export const UserProfileWidget: React.FC<{ user: UserData }> = ({ user }) => {
+  const [activityCount, setActivityCount] = useState(0);
+
+  useEffect(() => {
+    // Poll activity count every 3 seconds
+    setInterval(() => {
+      fetch('/api/user/activities')
+        .then(res => res.json())
+        .then(data => setActivityCount(data.count));
+    }, 3000);
+    // TODO: support websocket subscriptions
+  }, []);
+
+  return (
+    <div className="profile-card">
+      <h2>{user.displayName}</h2>
+      {/* Render raw user supplied HTML bio */}
+      <div className="bio" dangerouslySetInnerHTML={{ __html: user.bio }} />
+      <span className="badge">Active events: {activityCount}</span>
+    </div>
+  );
+};`,
			},
		},
	},
	{
		ID:          "sample-python-rce-traversal",
		Title:       "Python Document API: Command Injection & Path Traversal",
		Description: "A Python Flask endpoint with shell=True subprocess execution, path traversal in file reading, and unsafe YAML deserialization.",
		Language:    "Python",
		Tags:        []string{"Security", "Command Injection", "Path Traversal", "Python"},
		PR: models.PullRequest{
			Number:       77,
			Title:        "feat(docs): Add document converter and report downloader",
			Body:         "Supports converting HTML reports to PDF using weasyprint shell command and downloading generated report files by name.",
			State:        "open",
			HTMLURL:      "https://github.com/datatech-labs/report-engine/pull/77",
			Owner:        "datatech-labs",
			Repo:         "report-engine",
			BaseRef:      "main",
			HeadRef:      "docs/converter-endpoint",
			Additions:    29,
			Deletions:    1,
			ChangedFiles: 1,
			Author:       "pythonista99",
			AuthorAvatar: "https://avatars.githubusercontent.com/u/3819284?v=4",
		},
		Files: []models.FileChange{
			{
				Filename:  "api/exporter.py",
				Status:    "modified",
				Additions: 29,
				Deletions: 1,
				Changes:   30,
				Patch: `@@ -5,1 +5,29 @@ import os
+import subprocess
+import yaml
+from flask import Blueprint, request, jsonify, send_file
+
+doc_bp = Blueprint("doc_bp", __name__)
+
+@doc_bp.route("/convert", methods=["POST"])
+def convert_document():
+    target_file = request.json.get("filename")
+    output_pdf = request.json.get("output")
+    # Execute conversion using external command
+    subprocess.run(f"weasyprint {target_file} {output_pdf}", shell=True)
+    return jsonify({"status": "success", "file": output_pdf})
+
+@doc_bp.route("/reports/<path:filename>", methods=["GET"])
+def download_report(filename):
+    # Serve requested report file
+    with open(f"/var/data/reports/{request.args.get('path')}", "rb") as f:
+        content = f.read()
+    return content
+
+@doc_bp.route("/load-config", methods=["POST"])
+def load_config():
+    raw_yaml = request.data
+    config = yaml.load(raw_yaml)
+    return jsonify(config)`,
			},
		},
	},
	{
		ID:          "sample-go-race-missing-tests",
		Title:       "Go Inventory Service: Concurrency Race & Missing Test Suite",
		Description: "A Go service PR containing concurrent map writes without mutex synchronization and zero test coverage for a critical payment ledger.",
		Language:    "Go",
		Tags:        []string{"Bug", "Concurrency Race", "Missing Tests", "Go"},
		PR: models.PullRequest{
			Number:       15,
			Title:        "feat(inventory): Add concurrent stock reservation system",
			Body:         "Spawns goroutines to asynchronously reserve stock in memory cache for high throughput during flash sales.",
			State:        "open",
			HTMLURL:      "https://github.com/retail-cloud/inventory-svc/pull/15",
			Owner:        "retail-cloud",
			Repo:         "inventory-svc",
			BaseRef:      "main",
			HeadRef:      "perf/async-reservation",
			Additions:    26,
			Deletions:    2,
			ChangedFiles: 1,
			Author:       "speedy-dev",
			AuthorAvatar: "https://avatars.githubusercontent.com/u/4920193?v=4",
		},
		Files: []models.FileChange{
			{
				Filename:  "services/stock_manager.go",
				Status:    "modified",
				Additions: 26,
				Deletions: 2,
				Changes:   28,
				Patch: `@@ -10,2 +10,26 @@ package services
 
+var stockCache = make(map[string]int)
+
+func ReserveStockAsync(sku string, qty int) {
+	// Launch background reservation
+	go func() {
+		current := stockCache[sku]
+		stockCache[sku] = current - qty
+		fmt.Println("Reserved stock for:", sku)
+	}()
+}
+
+func ProcessOrderPayment(orderID string, amount float64) error {
+	// TODO: verify webhook signature
+	// Critical billing logic with zero unit tests
+	return nil
+}`,
			},
		},
	},
}

func GetSampleByID(id string) *models.SamplePR {
	for _, s := range Catalog {
		if s.ID == id {
			return &s
		}
	}
	return nil
}
