import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  RotateCcw,
  Code,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Finding, FindingStatus } from '../types';

interface FindingCardProps {
  finding: Finding;
  status: FindingStatus;
  onStatusChange: (id: string, newStatus: FindingStatus) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  status,
  onStatusChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopyFix = () => {
    if (!finding.proposed_fix) return;
    navigator.clipboard.writeText(finding.proposed_fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return {
          icon: ShieldAlert,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          indicator: 'bg-rose-500',
        };
      case 'Warning':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          icon: Lightbulb,
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          indicator: 'bg-blue-500',
        };
    }
  };

  const severityStyle = getSeverityBadge(finding.severity);
  const SeverityIcon = severityStyle.icon;

  const isDismissed = status === 'dismissed';
  const isAccepted = status === 'accepted';

  return (
    <div
      className={`glass-panel rounded-2xl border transition duration-200 overflow-hidden ${
        isDismissed
          ? 'opacity-60 border-slate-800 bg-slate-900/30'
          : isAccepted
          ? 'border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 shadow-lg shadow-black/20'
      }`}
    >
      {/* Header bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-start sm:items-center space-x-3">
          <div className={`p-2 rounded-xl border ${severityStyle.bg} shrink-0`}>
            <SeverityIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Severity Badge */}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${severityStyle.bg}`}>
                {finding.severity}
              </span>

              {/* Category Pill */}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {finding.category}
              </span>

              {/* Source Pill */}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                {finding.source === 'static_analysis'
                  ? 'Static Rule'
                  : finding.source === 'ai_review'
                  ? 'AI Evaluation'
                  : 'Static + AI'}
              </span>

              {finding.rule_id && (
                <span className="text-[10px] font-mono text-slate-500">
                  {finding.rule_id}
                </span>
              )}
            </div>

            <h3 className={`text-base font-bold text-white tracking-tight ${isDismissed ? 'line-through text-slate-400' : ''}`}>
              {finding.title}
            </h3>
          </div>
        </div>

        {/* File and line badge + Collapse toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-indigo-300">{finding.file}</span>
            <span className="text-slate-500">:</span>
            <span className="text-amber-400 font-bold">{finding.line}</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Explanation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Why this is an issue:
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {finding.explanation}
            </p>
          </div>

          {/* Problematic Code Snippet */}
          {finding.code_snippet && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                <span className="flex items-center space-x-1 text-rose-400">
                  <Code className="w-3.5 h-3.5 mr-1" /> Problematic Code (Line {finding.line}):
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 font-mono text-xs text-rose-200 overflow-x-auto">
                <code>{finding.code_snippet}</code>
              </div>
            </div>
          )}

          {/* Recommendation & Proposed Fix */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Recommended Fix:
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">
              {finding.recommendation}
            </p>

            {finding.proposed_fix && (
              <div className="relative group">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-t border-x border-slate-800 rounded-t-xl text-xs text-slate-400 font-mono">
                  <span>Suggested Replacement:</span>
                  <button
                    onClick={handleCopyFix}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5 rounded-b-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre">
                  <code>{finding.proposed_fix}</code>
                </div>
              </div>
            )}
          </div>

          {/* Developer Decision Bar (Developer retains final authority) */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Developer Decision:</span>{' '}
              {isAccepted ? (
                <span className="text-emerald-400 font-medium">✓ Accepted by Developer</span>
              ) : isDismissed ? (
                <span className="text-slate-500 font-medium">✕ Marked as False Positive</span>
              ) : (
                <span className="text-amber-400 font-medium">Pending Review</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onStatusChange(finding.id, isAccepted ? 'pending' : 'accepted')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isAccepted
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 border border-slate-700'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isAccepted ? 'Accepted' : 'Accept Suggestion'}</span>
              </button>

              <button
                type="button"
                onClick={() => onStatusChange(finding.id, isDismissed ? 'pending' : 'dismissed')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isDismissed
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                    : 'bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isDismissed ? 'Dismissed' : 'Mark as False Positive'}</span>
              </button>

              {(isAccepted || isDismissed) && (
                <button
                  type="button"
                  onClick={() => onStatusChange(finding.id, 'pending')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                  title="Reset Decision"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
