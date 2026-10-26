import React, { useState } from 'react';
import { FileCode, ChevronDown, ChevronUp, AlertCircle, ShieldAlert } from 'lucide-react';
import { FileChange, Finding } from '../types';

interface FileDiffViewerProps {
  files: FileChange[];
  findings: Finding[];
}

export const FileDiffViewer: React.FC<FileDiffViewerProps> = ({ files, findings }) => {
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({});

  const toggleFile = (filename: string) => {
    setCollapsedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  // Map findings by file and line for inline annotations
  const findingsMap = React.useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of findings) {
      const key = `${f.file}:${f.line}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(f);
    }
    return map;
  }, [findings]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <span>Changed Files & Code Diffs ({files.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Unified view of pull request changes with inline security findings
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {files.map((file) => {
          const isCollapsed = collapsedFiles[file.filename];
          const fileFindings = findings.filter((f) => f.file === file.filename);

          return (
            <div
              key={file.filename}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
            >
              {/* File Header */}
              <div
                onClick={() => toggleFile(file.filename)}
                className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition select-none"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono text-xs font-bold text-slate-200 truncate">
                    {file.filename}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 uppercase">
                    {file.status || 'modified'}
                  </span>

                  {fileFindings.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      {fileFindings.length} issue{fileFindings.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">+{file.additions}</span>
                    <span className="text-rose-400 font-semibold">-{file.deletions}</span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Diff Content */}
              {!isCollapsed && (
                <div className="p-0 bg-slate-950 font-mono text-xs overflow-x-auto">
                  {file.patch ? (
                    <div className="divide-y divide-slate-900/50">
                      {renderDiffLines(file.filename, file.patch, findingsMap)}
                    </div>
                  ) : (
                    <div className="p-4 text-slate-500 text-center italic">
                      Binary file or diff unavailable
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function renderDiffLines(
  filename: string,
  patch: string,
  findingsMap: Map<string, Finding[]>
) {
  const lines = patch.split('\n');
  let currentNewLine = 0;
  let currentOldLine = 0;

  return lines.map((line, idx) => {
    let lineType: 'hunk' | 'added' | 'deleted' | 'context' = 'context';
    let lineClass = 'text-slate-300 hover:bg-slate-900/60';
    let displayOldLine = '';
    let displayNewLine = '';

    if (line.startsWith('@@')) {
      lineType = 'hunk';
      lineClass = 'bg-indigo-950/30 text-indigo-400 font-semibold py-1 border-y border-indigo-900/30';
      // parse hunk header
      const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (match) {
        currentOldLine = parseInt(match[1], 10) - 1;
        currentNewLine = parseInt(match[2], 10) - 1;
      }
    } else if (line.startsWith('+')) {
      lineType = 'added';
      currentNewLine++;
      displayNewLine = currentNewLine.toString();
      lineClass = 'bg-emerald-950/30 text-emerald-200 border-l-2 border-emerald-500';
    } else if (line.startsWith('-')) {
      lineType = 'deleted';
      currentOldLine++;
      displayOldLine = currentOldLine.toString();
      lineClass = 'bg-rose-950/30 text-rose-200 border-l-2 border-rose-500';
    } else {
      currentOldLine++;
      currentNewLine++;
      displayOldLine = currentOldLine.toString();
      displayNewLine = currentNewLine.toString();
    }

    const key = `${filename}:${currentNewLine}`;
    const inlineFindings = lineType === 'added' ? findingsMap.get(key) : undefined;

    return (
      <React.Fragment key={idx}>
        <div className={`flex items-start px-2 py-0.5 leading-5 font-mono ${lineClass}`}>
          {/* Old line number */}
          <span className="w-10 text-right pr-2 text-slate-600 select-none shrink-0 text-[11px]">
            {displayOldLine}
          </span>
          {/* New line number */}
          <span className="w-10 text-right pr-3 text-slate-600 select-none shrink-0 text-[11px]">
            {displayNewLine}
          </span>
          {/* Code line */}
          <span className="flex-1 whitespace-pre overflow-x-visible">
            {line}
          </span>
        </div>

        {/* Inline Finding Marker if present on this line */}
        {inlineFindings && inlineFindings.length > 0 && (
          <div className="bg-rose-950/40 border-y border-rose-500/40 px-4 py-2 text-rose-200 space-y-1 my-0.5">
            {inlineFindings.map((f) => (
              <div key={f.id} className="flex items-start space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-rose-300">[{f.severity.toUpperCase()} - {f.category}]:</span>{' '}
                  <span className="font-semibold text-white">{f.title}</span> &mdash;{' '}
                  <span className="text-slate-300">{f.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  });
}
