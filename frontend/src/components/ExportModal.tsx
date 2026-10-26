import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ReviewResponse, FindingStatus } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReviewResponse;
  decisions: Record<string, FindingStatus>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  decisions,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdownReport = (): string => {
    const { pull_request: pr, summary, findings } = data;

    let md = `## 🛡️ PRLens AI Code Review Summary\n\n`;
    md += `**Target:** [${pr.owner}/${pr.repo} #${pr.number}](${pr.html_url}) &mdash; *${pr.title}*\n`;
    md += `**Verdict:** **${summary.verdict.replace(/_/g, ' ')}** &mdash; ${summary.verdict_message}\n`;
    md += `**Security & Quality Score:** \`${summary.security_score}/100\`\n\n`;

    md += `### 📊 Metrics Overview\n`;
    md += `- 🚨 **Critical Vulnerabilities:** ${summary.critical_count}\n`;
    md += `- ⚠️ **Warnings & Bugs:** ${summary.warning_count}\n`;
    md += `- 💡 **Suggestions & Quality:** ${summary.suggestion_count}\n`;
    md += `- 📁 **Files Analyzed:** ${summary.analyzed_files_count} (${summary.lines_analyzed} lines in ${summary.duration_ms}ms)\n\n`;

    if (summary.positive_aspects && summary.positive_aspects.length > 0) {
      md += `### 👍 What this PR Did Well\n`;
      summary.positive_aspects.forEach((item) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (summary.missing_tests && summary.missing_tests.length > 0) {
      md += `### 🧪 Recommended Test Coverage\n`;
      summary.missing_tests.forEach((test) => {
        md += `- ${test}\n`;
      });
      md += `\n`;
    }

    md += `### 🔍 Detailed Findings & Action Items\n\n`;

    if (findings.length === 0) {
      md += `*No issues identified. Code is clean and meets quality benchmarks.*\n\n`;
    } else {
      findings.forEach((f, idx) => {
        const status = decisions[f.id] || 'pending';
        const statusEmoji =
          status === 'accepted' ? '✅ [Accepted]' : status === 'dismissed' ? '🚫 [False Positive]' : '⏳ [Pending]';

        md += `#### ${idx + 1}. [${f.severity.toUpperCase()}] ${f.title} ${statusEmoji}\n`;
        md += `- **File:** \`${f.file}:${f.line}\`\n`;
        md += `- **Category:** ${f.category} | **Source:** ${f.source}\n`;
        md += `- **Explanation:** ${f.explanation}\n`;
        md += `- **Recommendation:** ${f.recommendation}\n`;

        if (f.code_snippet) {
          md += `\n\`\`\`\n// Problematic code (line ${f.line}):\n${f.code_snippet}\n\`\`\`\n`;
        }

        if (f.proposed_fix) {
          md += `\n\`\`\`\n// Proposed Fix:\n${f.proposed_fix}\n\`\`\`\n`;
        }
        md += `\n---\n\n`;
      });
    }

    md += `*Generated automatically by PRLens AI Code Reviewer. Final review decisions remain with the developer.*`;
    return md;
  };

  const markdownContent = generateMarkdownReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prlens-review-${data.pull_request.repo}-pr${data.pull_request.number}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      ...data,
      developer_decisions: decisions,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prlens-review-${data.pull_request.repo}-pr${data.pull_request.number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-3xl glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-950 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Review Report</h3>
              <p className="text-xs text-slate-400">
                Ready to paste into GitHub PR review comments or download for submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-900/50">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
            {markdownContent}
          </pre>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:px-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Includes developer resolution status</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMD}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>.md</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>.json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
