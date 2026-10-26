import { ReviewRequestPayload, ReviewResponse, SamplePR } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function fetchSamples(): Promise<SamplePR[]> {
  const res = await fetch(`${API_BASE_URL}/samples`);
  if (!res.ok) {
    throw new Error(`Failed to load sample PRs (${res.status})`);
  }
  return res.json();
}

export async function submitReview(payload: ReviewRequestPayload): Promise<ReviewResponse> {
  const res = await fetch(`${API_BASE_URL}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Review failed with status ${res.status}`);
  }

  return data;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// LocalStorage helpers for user settings
export interface UserSettings {
  aiProvider: 'gemini' | 'groq' | 'local';
  apiKey: string;
  githubToken: string;
  model: string;
}

const SETTINGS_KEY = 'prlens_settings';

export function loadSettings(): UserSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    aiProvider: 'local',
    apiKey: '',
    githubToken: '',
    model: 'gemini-2.0-flash',
  };
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
