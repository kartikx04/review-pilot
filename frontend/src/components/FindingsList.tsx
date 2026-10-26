import React, { useState, useMemo } from 'react';
import { Search, Filter, ShieldCheck, CheckCheck } from 'lucide-react';
import { Finding, FindingStatus, SeverityLevel, FindingCategory } from '../types';
import { FindingCard } from './FindingCard';

interface FindingsListProps {
  findings: Finding[];
  decisions: Record<string, FindingStatus>;
  onDecisionChange: (id: string, status: FindingStatus) => void;
  onAcceptAllSuggestions: () => void;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  decisions,
  onDecisionChange,
  onAcceptAllSuggestions,
}) => {
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<'all' | 'pending' | 'accepted' | 'dismissed'>('all');

  // Severity counts
  const counts = useMemo(() => {
    return {
      all: findings.length,
      critical: findings.filter((f) => f.severity === 'Critical').length,
      warning: findings.filter((f) => f.severity === 'Warning').length,
      suggestion: findings.filter((f) => f.severity === 'Suggestion').length,
    };
  }, [findings]);

  // Categories list
  const categories: (FindingCategory | 'All')[] = [
    'All',
    'Security',
    'Bug',
    'Code Quality',
    'Test Coverage',
  ];

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Severity check
      if (severityFilter !== 'All' && f.severity !== severityFilter) {
        return false;
      }
      // Category check
      if (categoryFilter !== 'All' && f.category !== categoryFilter) {
        return false;
      }
      // Decision check
      const currentDecision = decisions[f.id] || 'pending';
      if (decisionFilter !== 'all' && currentDecision !== decisionFilter) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          f.title.toLowerCase().includes(q) ||
          f.file.toLowerCase().includes(q) ||
          f.explanation.toLowerCase().includes(q) ||
          (f.rule_id && f.rule_id.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [findings, severityFilter, categoryFilter, decisionFilter, searchQuery, decisions]);

  return (
    <div className="space-y-5">
      {/* Control / Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4">
        {/* Row 1: Severity Pills + Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Severity Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setSeverityFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                severityFilter === 'All'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Findings ({counts.all})
            </button>
            <button
              onClick={() => setSeverityFilter('Critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                severityFilter === 'Critical'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              Critical ({counts.critical})
            </button>
            <button
              onClick={() => setSeverityFilter('Warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                severityFilter === 'Warning'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              Warnings ({counts.warning})
            </button>
            <button
              onClick={() => setSeverityFilter('Suggestion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                severityFilter === 'Suggestion'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-blue-400 hover:bg-blue-950/40'
              }`}
            >
              Suggestions ({counts.suggestion})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter findings by file, rule, or text..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Row 2: Categories + Decision filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Decision filter & Quick Accept All button */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs bg-slate-900/60 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase px-1">Status:</span>
              {(['all', 'pending', 'accepted', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setDecisionFilter(status)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition ${
                    decisionFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {counts.suggestion > 0 && (
              <button
                onClick={onAcceptAllSuggestions}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-300 border border-slate-700 transition shrink-0"
                title="Mark all suggestions as accepted"
              >
                <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Accept Suggestions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Findings List or Empty State */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              status={decisions[finding.id] || 'pending'}
              onStatusChange={onDecisionChange}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No Findings Found Matching Filters
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            Try adjusting your search query, severity, or category filters to view other review items.
          </p>
        </div>
      )}
    </div>
  );
};
