package github

import "testing"

func TestParsePRURL(t *testing.T) {
	tests := []struct {
		url        string
		wantOwner  string
		wantRepo   string
		wantNumber int
		wantErr    bool
	}{
		{
			url:        "https://github.com/facebook/react/pull/12345",
			wantOwner:  "facebook",
			wantRepo:   "react",
			wantNumber: 12345,
			wantErr:    false,
		},
		{
			url:        "https://github.com/golang/go/pull/500/files",
			wantOwner:  "golang",
			wantRepo:   "go",
			wantNumber: 500,
			wantErr:    false,
		},
		{
			url:        "github.com/owner/my-repo/pull/42",
			wantOwner:  "owner",
			wantRepo:   "my-repo",
			wantNumber: 42,
			wantErr:    false,
		},
		{
			url:     "https://github.com/owner/my-repo/issues/42",
			wantErr: true,
		},
		{
			url:     "invalid-url",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		owner, repo, number, err := ParsePRURL(tt.url)
		if (err != nil) != tt.wantErr {
			t.Errorf("ParsePRURL(%q) err = %v, wantErr = %v", tt.url, err, tt.wantErr)
			continue
		}
		if !tt.wantErr {
			if owner != tt.wantOwner || repo != tt.wantRepo || number != tt.wantNumber {
				t.Errorf("ParsePRURL(%q) = (%s, %s, %d), want (%s, %s, %d)",
					tt.url, owner, repo, number, tt.wantOwner, tt.wantRepo, tt.wantNumber)
			}
		}
	}
}
