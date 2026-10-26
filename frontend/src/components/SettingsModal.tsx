import React, { useState } from 'react';
import { X, Key, Github, Cpu, Eye, EyeOff, Check, ShieldAlert } from 'lucide-react';
import { UserSettings } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'groq' | 'local'>(settings.aiProvider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [githubToken, setGithubToken] = useState(settings.githubToken);
  const [model, setModel] = useState(settings.model || 'gemini-2.0-flash');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      aiProvider: provider,
      apiKey: apiKey.trim(),
      githubToken: githubToken.trim(),
      model: model.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Reviewer Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* AI Engine Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              AI Review Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setProvider('local');
                  setModel('local-heuristic');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  provider === 'local'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">Local Engine</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Offline / Demo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('gemini');
                  setModel('gemini-2.0-flash');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  provider === 'gemini'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">Google Gemini</span>
                <span className="text-[10px] text-slate-500 mt-0.5">2.0 / 1.5 Flash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('groq');
                  setModel('llama-3.3-70b-versatile');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  provider === 'groq'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold">Groq</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Llama 3.3 70B</span>
              </button>
            </div>
          </div>

          {/* API Key (if not local) */}
          {provider !== 'local' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {provider === 'gemini' ? 'Google Gemini API Key' : 'Groq API Key'}
                </label>
                <span className="text-[11px] text-slate-500">Stored locally in browser</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                  className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If omitted, the backend will attempt reading `GEMINI_API_KEY` / `GROQ_API_KEY` from server environment.
              </p>
            </div>
          )}

          {/* GitHub Personal Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Github className="w-3.5 h-3.5 mr-1" />
                <span>GitHub Personal Access Token (Optional)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_... (increases rate limit from 60/hr to 5,000/hr)"
                className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Required only for private repositories or to avoid GitHub's IP rate limit during multiple tests.
            </p>
          </div>

          {/* College Demo Banner */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start space-x-2 text-xs text-indigo-200/90">
            <ShieldAlert className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white">College Project Demo Friendly:</span>
              <p className="mt-0.5 text-[11px] text-slate-300">
                You can select "Local Engine" anytime to demonstrate full functionality without incurring API quotas or needing network access.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
