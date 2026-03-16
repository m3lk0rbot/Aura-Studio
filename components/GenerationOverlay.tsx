import React from 'react';

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

interface GenerationOverlayProps {
  isOpen: boolean;
  steps: GenerationStep[];
  sourcePreview: string;
  onClose: () => void;
}

export const GenerationOverlay: React.FC<GenerationOverlayProps> = ({ isOpen, steps, sourcePreview, onClose }) => {
  if (!isOpen) return null;

  const hasError = steps.some(s => s.status === 'error');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasError ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                <svg className={`w-6 h-6 ${!hasError && 'animate-pulse'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {!hasError && <div className="absolute -top-1 -right-1 w-3 h-3 bg-fuchsia-500 rounded-full animate-ping"></div>}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{hasError ? 'Generation Failed' : 'Generating Campaign'}</h2>
              <p className="text-xs text-slate-400">{hasError ? 'Something went wrong during the process.' : 'AI is crafting your social media strategy...'}</p>
            </div>
          </div>
          
          {hasError && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Source Preview */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Source Material</p>
          <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
            "{sourcePreview}"
          </p>
        </div>

        {/* Progress Steps */}
        <div className="p-6 space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                  step.status === 'loading' ? 'bg-cyan-500/20 text-cyan-400' :
                  step.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-slate-800 text-slate-600'
                }`}>
                  {step.status === 'done' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : step.status === 'loading' ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  ) : step.status === 'error' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  step.status === 'loading' ? 'text-white' :
                  step.status === 'done' ? 'text-slate-300' :
                  'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {step.status === 'done' && (
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Done</span>
              )}
              {step.status === 'loading' && (
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest animate-pulse">Processing...</span>
              )}
              {step.status === 'error' && (
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Error</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
          {hasError ? (
            <button 
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl transition-all"
            >
              Close and Try Again
            </button>
          ) : (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
              Please wait while we prepare your multi-platform campaign.<br/>
              This usually takes 15-30 seconds.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
