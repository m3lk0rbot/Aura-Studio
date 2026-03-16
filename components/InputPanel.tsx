import React, { useMemo, useState } from 'react';
import { analyzeText, summarizeText } from '../services/aiService';
import { SummaryResult, CampaignResult } from '../types';

interface InputPanelProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onDemo: () => void;
  autosave: boolean;
  onToggleAutosave: () => void;
  summaryData: SummaryResult | null;
  campaignData: CampaignResult | null;
  onGenerateCampaign: () => void;
  onError: (msg: string) => void;
  isPro: boolean;
  isLoading: boolean;
  generateText: boolean;
  setGenerateText: (val: boolean) => void;
  generateImage: boolean;
  setGenerateImage: (val: boolean) => void;
  generateAudio: boolean;
  setGenerateAudio: (val: boolean) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  value,
  onChange,
  onClear,
  onDemo,
  autosave,
  onToggleAutosave,
  summaryData,
  campaignData,
  onGenerateCampaign,
  onError,
  isPro,
  isLoading,
  generateText,
  setGenerateText,
  generateImage,
  setGenerateImage,
  generateAudio,
  setGenerateAudio,
}) => {
  const stats = useMemo(() => analyzeText(value), [value]);

  const copySummary = () => {
    if (summaryData) navigator.clipboard.writeText(summaryData.summary);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Input Area (Col 8) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="sourceText" className="text-sm font-semibold text-slate-200">
              Source Material
            </label>
            <div className="flex gap-2">
              <button
                onClick={onClear}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={onDemo}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Load Demo
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur"></div>
            <textarea
              id="sourceText"
              rows={10}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="relative w-full resize-y rounded-xl border border-slate-800 bg-slate-950/50 px-5 py-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all shadow-inner font-sans leading-relaxed text-sm"
              placeholder="Paste your article, draft, or brain dump here..."
            />
          </div>
          
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autosave ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-600'}`}></div>
              <label className="text-xs text-slate-400 cursor-pointer select-none hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={autosave}
                  onChange={onToggleAutosave}
                  className="hidden"
                />
                {autosave ? 'Autosave on' : 'Autosave off'}
              </label>
            </div>
            <p className="text-xs text-slate-500">Local storage active</p>
          </div>
        </div>

        {/* Live Analysis Sidebar (Col 4) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Analysis</h2>
                {isPro && <span className="text-[10px] bg-cyan-900 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-800">PRO</span>}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <span className="text-xs text-slate-400">Words</span>
                <span className="text-sm font-semibold text-slate-200">{stats.wordCount}</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <span className="text-xs text-slate-400">Read Time</span>
                <span className="text-sm font-semibold text-slate-200">~{stats.readingTime} m</span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <span className="text-xs text-slate-400">Sentiment</span>
                <span className={`text-sm font-semibold ${
                  stats.sentiment === 'Positive' ? 'text-emerald-400' : 
                  stats.sentiment === 'Negative' ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {stats.sentiment}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <span className="text-xs text-slate-400">Complexity</span>
                <span className="text-sm font-semibold text-cyan-200/80">{stats.complexity}</span>
              </div>
            </div>
                        <div className="mt-6 pt-6 border-t border-slate-800/50">
                 {isPro ? (
                    <div className="flex flex-row items-center justify-between gap-2 mb-4 px-2">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={generateText} onChange={(e) => setGenerateText(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-cyan-500" />
                            Text
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={generateImage} onChange={(e) => setGenerateImage(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-fuchsia-500" />
                            Image
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" checked={generateAudio} onChange={(e) => setGenerateAudio(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-emerald-500" />
                            Audio
                        </label>
                    </div>
                 ) : (
                    <p className="text-xs text-slate-500 mb-4 text-center">Free Mode - Generating Text Only</p>
                 )}
                 <button
                    onClick={onGenerateCampaign}
                    disabled={isLoading}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        isPro 
                        ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 shadow-fuchsia-900/20' 
                        : 'bg-cyan-600/90 hover:bg-cyan-500 shadow-cyan-900/20'
                    }`}
                 >
                    {isLoading ? 'Generating Campaign...' : isPro ? 'Generate AI Campaign' : 'Generate Campaign'}
                 </button>
                 <p className="mt-2 text-[10px] text-slate-500 text-center uppercase tracking-widest">
                    {isPro ? 'Customize your generation' : 'Generates all platforms + 1 Image + Audio'}
                 </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Image Archive Row */}
      {campaignData?.images && campaignData.images.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-300">Image Archive</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignData.images.map((img, idx) => (
              <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img 
                  src={img.url} 
                  alt={img.description} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                   <div className="flex items-center justify-between gap-2">
                     <p className="text-[10px] text-slate-300 line-clamp-2 italic flex-1">{img.description}</p>
                     <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = img.url;
                            link.download = `campaign-image-${idx}.png`;
                            link.click();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-cyan-600 hover:text-white transition-all shadow-lg"
                        title="Download Image"
                     >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary & Keywords Row */}
      <div className="grid gap-6 lg:grid-cols-12">
         {/* Summary Output (Col 8) */}
         <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Generated Summary</h3>
                {summaryData && (
                    <button onClick={copySummary} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        Copy
                    </button>
                )}
            </div>
            <div className={`rounded-2xl border bg-slate-900/20 p-5 min-h-[140px] ${isPro ? 'border-fuchsia-900/30' : 'border-slate-800'}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {summaryData ? summaryData.summary : <span className="text-slate-600 italic">Click 'Generate Summary' to distill your text.</span>}
                </p>
            </div>
         </div>

         {/* Keywords (Col 4) */}
         <div className="lg:col-span-4">
             <h3 className="text-sm font-semibold text-slate-300 mb-2">Keywords</h3>
             <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4 min-h-[140px]">
                <div className="flex flex-wrap gap-2">
                    {summaryData?.keywords && summaryData.keywords.length > 0 ? (
                        summaryData.keywords.map((k, i) => (
                        <span 
                            key={i} 
                            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-400"
                        >
                            #{k}
                        </span>
                        ))
                    ) : (
                        <p className="text-xs text-slate-600 italic">Waiting for analysis...</p>
                    )}
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};