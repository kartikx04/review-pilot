import React from 'react';
import { ThumbsUp, TestTube2, CheckCircle2 } from 'lucide-react';

interface PositiveAspectsCardProps {
  positiveAspects: string[];
  missingTests: string[];
}

export const PositiveAspectsCard: React.FC<PositiveAspectsCardProps> = ({
  positiveAspects,
  missingTests,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      {/* Positive Aspects */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2.5 mb-3 text-emerald-400">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">What this PR Did Well</h3>
        </div>
        {positiveAspects && positiveAspects.length > 0 ? (
          <ul className="space-y-2">
            {positiveAspects.map((aspect, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{aspect}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">No specific positive items noted.</p>
        )}
      </div>

      {/* Missing Test Cases */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2.5 mb-3 text-indigo-400">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <TestTube2 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">Recommended Test Coverage</h3>
        </div>
        {missingTests && missingTests.length > 0 ? (
          <ul className="space-y-2">
            {missingTests.map((testItem, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{testItem}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">All modified files appear to have adequate test coverage.</p>
        )}
      </div>
    </div>
  );
};
