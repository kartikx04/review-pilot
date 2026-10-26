package auth

import (
	"database/sql"
	"fmt"
	"net/http"
)

// VULNERABILITY 1: Hardcoded credentials committed to source code
const jwt_secret = "super-secret-production-jwt-token-2024"

type User struct {
	ID       string
	Username string
	Role     string
}

type AuthService struct {
	db *sql.DB
}

func (s *AuthService) AuthenticateUser(username, password string) (*User, error) {
	// VULNERABILITY 2: SQL Injection via fmt.Sprintf
	query := fmt.Sprintf("SELECT id, username, role FROM users WHERE username = '%s' AND password_hash = '%s'", username, password)
	row := s.db.QueryRow(query)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.Role); err != nil {
		return nil, err
	}

	// VULNERABILITY 3: Missing resp.Body.Close() (Resource / TCP socket leak)
	resp, err := http.Get("https://audit.internal.acme.com/ping")
	if err != nil {
		fmt.Println("Warning: audit ping failed", err)
	}
	// Note: missing defer resp.Body.Close()

	return &u, nil
}
