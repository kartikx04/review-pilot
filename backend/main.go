package main

import (
	"codereview-ai/handlers"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	loadEnvironmentFile(".env")
	loadEnvironmentFile("../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiHandler := handlers.NewAPIHandler()
	mux := http.NewServeMux()

	// Register API routes
	mux.HandleFunc("/api/health", apiHandler.HandleHealth)
	mux.HandleFunc("/api/samples", apiHandler.HandleGetSamples)
	mux.HandleFunc("/api/review", apiHandler.HandleReview)

	// Check if React production build exists in ../frontend/dist or ./frontend/dist
	frontendDist := "../frontend/dist"
	if _, err := os.Stat(frontendDist); os.IsNotExist(err) {
		frontendDist = "./frontend/dist"
	}

	if info, err := os.Stat(frontendDist); err == nil && info.IsDir() {
		fs := http.FileServer(http.Dir(frontendDist))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if handlers.EnableCORS(w, r) {
				return
			}
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}

			// SPA routing fallback: if static file not found, serve index.html
			filePath := filepath.Join(frontendDist, filepath.Clean(r.URL.Path))
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				http.ServeFile(w, r, filepath.Join(frontendDist, "index.html"))
				return
			}
			fs.ServeHTTP(w, r)
		})
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if handlers.EnableCORS(w, r) {
				return
			}
			if r.URL.Path != "/" {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/plain")
			fmt.Fprintf(w, "PRLens AI Code Reviewer API (Go) is running!\nVisit /api/health or /api/samples\n")
		})
	}

	serverAddr := ":" + port
	log.Printf("======================================================")
	log.Printf("  PRLens AI Code Review Backend starting on port %s", port)
	log.Printf("  Frontend Dashboard: http://localhost:%s/", port)
	log.Printf("  API Endpoints:")
	log.Printf("    - GET  http://localhost:%s/api/health", port)
	log.Printf("    - GET  http://localhost:%s/api/samples", port)
	log.Printf("    - POST http://localhost:%s/api/review", port)
	log.Printf("======================================================")

	if err := http.ListenAndServe(serverAddr, mux); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
	}
}

// loadEnvironmentFile supports local development without adding a dotenv
// dependency. Existing process environment values always take precedence and
// values are never logged.
func loadEnvironmentFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		key = strings.TrimSpace(key)
		if !found || key == "" || os.Getenv(key) != "" {
			continue
		}
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		_ = os.Setenv(key, value)
	}
}
