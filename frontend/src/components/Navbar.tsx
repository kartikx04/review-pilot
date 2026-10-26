import React from 'react';
import { ShieldCheck, Settings, Download, Github, Sparkles, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  backendConnected: boolean;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  hasReview: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendConnected,
  onOpenSettings,
  onOpenExport,
  hasReview,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                PRLens
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-2.5 h-2.5 mr-1" /> AI Reviewer
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Automated GitHub PR Security & Quality Auditor</p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center space-x-3">
          {/* Backend Status */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              backendConnected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}
          >
            {backendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                <span>Go Backend Ready</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Backend Disconnected</span>
              </>
            )}
          </div>

          {/* Export Report */}
          {hasReview && (
            <button
              onClick={onOpenExport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Export Review Report"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Configure AI & GitHub API Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700/60"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
