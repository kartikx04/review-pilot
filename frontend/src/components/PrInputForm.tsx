import React, { useState } from 'react';
import { GitPullRequest, Code2, Play, AlertCircle, FileCode } from 'lucide-react';

interface PrInputFormProps {
  onAnalyzeURL: (url: string) => void;
  onAnalyzeDiff: (diff: string, title: string) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  onOpenSettings: () => void;
}

const DEFAULT_PR_URL = 'https://github.com/kartikx04/pr-test/pull/1';

const DEFAULT_SAMPLE_DIFF = `@@ -1,2 +1,2 @@
 def calculate(value):
-    return value
+    return eval(value)`;

export const PrInputForm: React.FC<PrInputFormProps> = ({
  onAnalyzeURL,
  onAnalyzeDiff,
  isLoading,
  error,
  onClearError,
  onOpenSettings,
}) => {
  const [prUrl, setPrUrl] = useState(DEFAULT_PR_URL);
  const [showCustomDiff, setShowCustomDiff] = useState(false);
  const [customDiff, setCustomDiff] = useState(DEFAULT_SAMPLE_DIFF);
  const [customTitle, setCustomTitle] = useState('Dynamic Calculation Patch (eval)');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim()) return;
    onClearError();
    onAnalyzeURL(prUrl.trim());
  };

  const handleDiffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDiff.trim()) return;
    onClearError();
    onAnalyzeDiff(customDiff.trim(), customTitle.trim() || 'Custom Patch Review');
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 mb-8">
      {/* Clean PR URL Input Form */}
      <form onSubmit={handleUrlSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repository/pull/number"
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !prUrl.trim()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                <span>Auditing PR...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2 fill-current" />
                <span>Start Review</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Helper Pill & Toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setPrUrl('https://github.com/kartikx04/pr-test/pull/1');
                onClearError();
                onAnalyzeURL('https://github.com/kartikx04/pr-test/pull/1');
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 font-mono transition"
            >
              <span>kartikx04/pr-test#1</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomDiff(!showCustomDiff)}
            className="text-slate-400 hover:text-slate-200 transition flex items-center space-x-1"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCustomDiff ? 'Hide Custom Diff' : 'Paste Raw Diff'}</span>
          </button>
        </div>
      </form>

      {/* Optional Collapsible Custom Git Diff Mode */}
      {showCustomDiff && (
        <form onSubmit={handleDiffSubmit} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Patch Description
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Unified Git Diff
            </label>
            <textarea
              rows={4}
              value={customDiff}
              onChange={(e) => setCustomDiff(e.target.value)}
              className="w-full p-2.5 font-mono text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !customDiff.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analyze Raw Diff</span>
            </button>
          </div>
        </form>
      )}

      {/* Error Notice */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-rose-300">Analysis Error</p>
              <p className="mt-0.5 text-rose-200/90 leading-relaxed">{error}</p>
              {error.toLowerCase().includes('rate limit') && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="mt-1.5 text-xs text-white underline underline-offset-2 hover:text-rose-100 font-semibold"
                >
                  Configure GitHub Token in Settings &rarr;
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-400 hover:text-rose-200 text-sm font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};
