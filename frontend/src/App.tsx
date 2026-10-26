import { useState, useEffect } from 'react';
import {
  submitReview,
  checkBackendHealth,
  loadSettings,
  saveSettings,
  UserSettings,
} from './services/api';
import { ReviewResponse, FindingStatus } from './types';
import { Navbar } from './components/Navbar';
import { PrInputForm } from './components/PrInputForm';
import { OverviewMetrics } from './components/OverviewMetrics';
import { FindingsList } from './components/FindingsList';
import { FileDiffViewer } from './components/FileDiffViewer';
import { PositiveAspectsCard } from './components/PositiveAspectsCard';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import {
  ListFilter,
  FileCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const DEFAULT_TARGET_PR = 'https://github.com/kartikx04/pr-test/pull/1';

export function App() {
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'findings' | 'diff'>('findings');
  const [backendConnected, setBackendConnected] = useState(true);

  // Settings & Modals
  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Developer decisions on findings: id -> 'pending' | 'accepted' | 'dismissed'
  const [decisions, setDecisions] = useState<Record<string, FindingStatus>>({});

  // Initial load: automatically review the user's PR
  useEffect(() => {
    async function init() {
      const isHealthy = await checkBackendHealth();
      setBackendConnected(isHealthy);
      executeReview({ pr_url: DEFAULT_TARGET_PR });
    }
    init();
  }, []);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleDecisionChange = (id: string, status: FindingStatus) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: status,
    }));
  };

  const handleAcceptAllSuggestions = () => {
    if (!reviewData) return;
    const newDecisions = { ...decisions };
    reviewData.findings
      .filter((f) => f.severity === 'Suggestion')
      .forEach((f) => {
        newDecisions[f.id] = 'accepted';
      });
    setDecisions(newDecisions);
  };

  const executeReview = async (payload: {
    pr_url?: string;
    sample_id?: string;
    custom_diff?: string;
    custom_title?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await submitReview({
        ...payload,
        ai_provider: settings.aiProvider,
        github_token: settings.githubToken,
      });

      setReviewData(response);
      setDecisions({});
      setBackendConnected(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during review analysis.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeURL = (url: string) => {
    executeReview({ pr_url: url });
  };

  const handleAnalyzeDiff = (diff: string, title: string) => {
    executeReview({ custom_diff: diff, custom_title: title });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        backendConnected={backendConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        hasReview={reviewData !== null}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Simplified, Clean Hero */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI & Static Code Auditor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Pull Request Code Review
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Paste any GitHub pull request URL to audit changed code for security flaws and bugs before merging.
          </p>
        </div>

        {/* Streamlined PR URL Input Form */}
        <PrInputForm
          onAnalyzeURL={handleAnalyzeURL}
          onAnalyzeDiff={handleAnalyzeDiff}
          isLoading={isLoading}
          error={error}
          onClearError={() => setError(null)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Loading Spinner */}
        {isLoading && !reviewData && (
          <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800">
            <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">Auditing Pull Request...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fetching GitHub diff &bull; Running static rules &bull; Generating AI review
            </p>
          </div>
        )}

        {/* Review Results */}
        {reviewData && (
          <div className="space-y-6 animate-fade-in">
            {/* Overview & Metric Cards */}
            <OverviewMetrics data={reviewData} />

            {/* Positive Aspects & Test Coverage Cards */}
            <PositiveAspectsCard
              positiveAspects={reviewData.summary.positive_aspects}
              missingTests={reviewData.summary.missing_tests}
            />

            {/* Navigation Tabs (Findings vs Code Diffs) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`inline-flex items-center space-x-2 pb-2.5 px-2 text-sm font-semibold transition border-b-2 -mb-2 ${
                    activeTab === 'findings'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>Review Findings ({reviewData.findings.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('diff')}
                  className={`inline-flex items-center space-x-2 pb-2.5 px-2 text-sm font-semibold transition border-b-2 -mb-2 ${
                    activeTab === 'diff'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>Changed Files ({reviewData.files.length})</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center text-xs text-slate-500 font-mono">
                Developer retains final authority on fixes
              </div>
            </div>

            {/* Tab 1: Findings List */}
            {activeTab === 'findings' && (
              <FindingsList
                findings={reviewData.findings}
                decisions={decisions}
                onDecisionChange={handleDecisionChange}
                onAcceptAllSuggestions={handleAcceptAllSuggestions}
              />
            )}

            {/* Tab 2: File Diff Viewer */}
            {activeTab === 'diff' && (
              <FileDiffViewer
                files={reviewData.files}
                findings={reviewData.findings}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-850 py-5 bg-slate-950/60 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">PRLens AI Code Reviewer</span>
          </div>
          <div>
            Golang &bull; React &bull; TypeScript &bull; Tailwind CSS
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {reviewData && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          data={reviewData}
          decisions={decisions}
        />
      )}
    </div>
  );
}

export default App;
