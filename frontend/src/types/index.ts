export type SeverityLevel = 'Critical' | 'Warning' | 'Suggestion';
export type FindingCategory = 'Security' | 'Bug' | 'Code Quality' | 'Test Coverage';

export type ReviewVerdict =
  | 'CHANGES_REQUESTED'
  | 'NEEDS_REVIEW'
  | 'APPROVED_WITH_SUGGESTIONS'
  | 'APPROVED';

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  owner: string;
  repo: string;
  base_ref: string;
  head_ref: string;
  additions: number;
  deletions: number;
  changed_files: number;
  author: string;
  author_avatar: string;
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
  raw_url?: string;
  old_filename?: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: SeverityLevel;
  category: FindingCategory;
  file: string;
  line: number;
  end_line?: number;
  rule_id?: string;
  source: string; // "static_analysis", "ai_review", "static_and_ai"
  explanation: string;
  recommendation: string;
  code_snippet?: string;
  proposed_fix?: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface ReviewSummary {
  total_findings: number;
  critical_count: number;
  warning_count: number;
  suggestion_count: number;
  security_score: number; // 0 - 100
  verdict: ReviewVerdict;
  verdict_message: string;
  summary_text: string;
  positive_aspects: string[];
  missing_tests: string[];
  analyzed_files_count: number;
  lines_analyzed: number;
  duration_ms: number;
  static_analysis_found: number;
  ai_found: number;
}

export interface ReviewResponse {
  pull_request: PullRequest;
  summary: ReviewSummary;
  findings: Finding[];
  files: FileChange[];
}

export interface SamplePR {
  id: string;
  title: string;
  description: string;
  language: string;
  tags: string[];
  pr: PullRequest;
  files: FileChange[];
}

export interface ReviewRequestPayload {
  pr_url?: string;
  github_token?: string;
  ai_provider?: string;
  api_key?: string;
  model?: string;
  sample_id?: string;
  custom_diff?: string;
  custom_title?: string;
}

export type FindingStatus = 'pending' | 'accepted' | 'dismissed';
