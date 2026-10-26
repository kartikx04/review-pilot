import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  GitBranch,
  Layers,
  FileCode2,
} from 'lucide-react';
import { ReviewResponse } from '../types';

interface OverviewMetricsProps {
  data: ReviewResponse;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ data }) => {
  const { pull_request: pr, summary } = data;

  // Compute health color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  const getVerdictDetails = (verdict: string) => {
    switch (verdict) {
      case 'CHANGES_REQUESTED':
        return {
          icon: ShieldAlert,
          title: 'Changes Requested',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          containerBg: 'bg-rose-950/30 border-rose-500/30 text-rose-200',
        };
      case 'APPROVED_WITH_SUGGESTIONS':
        return {
          icon: AlertTriangle,
          title: 'Approved with Suggestions',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          containerBg: 'bg-amber-950/30 border-amber-500/30 text-amber-200',
        };
      case 'APPROVED':
        return {
          icon: ShieldCheck,
          title: 'Approved',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          containerBg: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200',
        };
      default:
        return {
          icon: CheckCircle2,
          title: 'Review Complete',
          badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          containerBg: 'bg-blue-950/30 border-blue-500/30 text-blue-200',
        };
    }
  };

  const verdictInfo = getVerdictDetails(summary.verdict);
  const VerdictIcon = verdictInfo.icon;

  return (
    <div className="space-y-6 mb-8">
      {/* PR Header & Meta Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {pr.owner}/{pr.repo} #{pr.number}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                {pr.state || 'open'}
              </span>
              <div className="flex items-center text-xs text-slate-400 space-x-1">
                <GitBranch className="w-3.5 h-3.5" />
                <span>{pr.head_ref || 'feature'}</span>
                <span>&rarr;</span>
                <span>{pr.base_ref || 'main'}</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {pr.title}
            </h1>
          </div>

          {/* Author avatar & Diff stats */}
          <div className="flex items-center space-x-4 shrink-0">
            {pr.author_avatar && (
              <img
                src={pr.author_avatar}
                alt={pr.author}
                className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800"
              />
            )}
            <div className="text-right">
              <p className="text-xs font-medium text-slate-300">
                by <span className="text-white font-semibold">{pr.author || 'contributor'}</span>
              </p>
              <div className="flex items-center justify-end space-x-2 text-xs font-mono mt-1">
                <span className="text-emerald-400">+{pr.additions}</span>
                <span className="text-rose-400">-{pr.deletions}</span>
                <span className="text-slate-500">({pr.changed_files} files)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between gap-4 ${verdictInfo.containerBg}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-black/20">
              <VerdictIcon className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide uppercase">
                  Verdict: {verdictInfo.title}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {summary.verdict_message}
              </p>
              {summary.ai_review_status === 'failed' && (
                <p className="text-xs opacity-90 mt-1">External AI: unavailable — static findings only.</p>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-2 shrink-0 text-xs font-mono opacity-80">
            <Clock className="w-3.5 h-3.5" />
            <span>{summary.duration_ms}ms analysis</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards + Score Ring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Security Health Score */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-slate-400 mb-2">Health Score</span>
          <div
            className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(
              summary.security_score
            )}`}
          >
            <span className="text-2xl font-black font-mono tracking-tight">
              {summary.security_score}
            </span>
            <span className="text-[10px] font-semibold uppercase opacity-75">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            {summary.security_score >= 80 ? 'Low Risk' : summary.security_score >= 50 ? 'Moderate Risk' : 'High Risk'}
          </span>
        </div>

        {/* Critical Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Issues</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-400 font-mono">
              {summary.critical_count}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Vulnerabilities & direct bugs</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-rose-400/80 font-semibold uppercase">
            Blocks Merge
          </div>
        </div>

        {/* Warnings Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Warnings</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {summary.warning_count}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Resource leaks & race risks</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-amber-400/80 font-semibold uppercase">
            Action Recommended
          </div>
        </div>

        {/* Suggestions Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Suggestions</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-blue-400 font-mono">
              {summary.suggestion_count}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Code style & optimizations</p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-blue-400/80 font-semibold uppercase">
            Best Practices
          </div>
        </div>

        {/* Inspection Stats Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Analysis Scope</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Files:</span>
              <span className="font-mono text-slate-200">{summary.analyzed_files_count}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Lines Scanned:</span>
              <span className="font-mono text-slate-200">{summary.lines_analyzed}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Static / AI:</span>
              <span className="font-mono text-indigo-300">
                {summary.static_analysis_found} / {summary.ai_found} ({summary.ai_provider} · {summary.ai_review_status})
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center text-[10px] text-slate-400">
            <FileCode2 className="w-3 h-3 mr-1" />
            <span>Dual-engine verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
