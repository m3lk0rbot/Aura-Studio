import React, { useState } from 'react';
import { summarizeText } from '../services/aiService';
import { SummaryResult } from '../types';

interface SummaryPanelProps {
  sourceText: string;
  summaryData: SummaryResult | null;
  onUpdate: (data: SummaryResult) => void;
  onError: (msg: string) => void;
  isPro: boolean;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ sourceText, summaryData, onUpdate, onError, isPro }) => {
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState('4');

  const handleSummarize = async () => {
    if (!sourceText || sourceText.length < 20) {
      onError("Please enter more text in Tab 1 first.");
      return;
    }
    setLoading(true);
    try {
      const data = await summarizeText(sourceText, length, isPro);
      onUpdate(data);
    } catch (err: any) {
      onError(err.message || "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Length</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <option value="2">Quick Bite (2)</option>
            <option value="4">Standard (4)</option>
            <option value="6">Deep Dive (6)</option>
          </select>
        </div>
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Generate Summary'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Summary */}
        <div className="lg:col-span-2 flex flex-col">
           <div className="flex items-center justify-between mb-2 px-1">
             <h3 className="text-sm font-semibold text-slate-300">Executive Summary</h3>
             <div className="flex items-center gap-3">
                {summaryData && (
                    <span className="text-xs text-slate-500">
                        {summaryData.summary.length} chars
                    </span>
                )}
                {summaryData && (
                    <button
                        onClick={() => copyToClipboard(summaryData.summary)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                        Copy text
                    </button>
                )}
             </div>
           </div>
           
           <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/30 p-6 shadow-inner min-h-[200px]">
             <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-200 font-normal">
              {summaryData ? summaryData.summary : <span className="text-slate-600 italic">No summary generated yet. Click generate above.</span>}
             </p>
           </div>
        </div>

        {/* Keywords */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2 px-1">Detected Keywords</h3>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5 min-h-[200px]">
            <div className="flex flex-wrap gap-2">
              {summaryData?.keywords && summaryData.keywords.length > 0 ? (
                summaryData.keywords.map((k, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500/50 hover:text-cyan-100 transition-colors cursor-default select-all"
                  >
                    #{k}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Keywords will appear here after analysis.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};