import React, { useState } from 'react';
import { generatePosts } from '../services/aiService';
import { GeneratedPost } from '../types';

interface PostGeneratorProps {
  platform: string;
  sourceText: string;
  posts: GeneratedPost[];
  onUpdate: (posts: GeneratedPost[]) => void;
  onSave: (post: GeneratedPost) => void;
  onError: (msg: string) => void;
  styleOptions: { label: string; value: string }[];
  colorTheme: string; 
  isPro: boolean;
}

export const PostGenerator: React.FC<PostGeneratorProps> = ({
  platform,
  sourceText,
  posts,
  onUpdate,
  onSave,
  onError,
  styleOptions,
  colorTheme,
  isPro
}) => {
  const [style, setStyle] = useState(styleOptions[0].value);
  const [hashtags, setHashtags] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!sourceText || sourceText.length < 20) {
      onError("Source text is empty or too short.");
      return;
    }
    setLoading(true);
    try {
      // Pass isPro flag
      const results = await generatePosts(platform, sourceText, style, hashtags, isPro);
      onUpdate(results);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.toLowerCase().includes("permission denied") || msg.toLowerCase().includes("requested entity was not found")) {
        onError("Gemini API access required. Please select your API key.");
        // @ts-ignore
        if (window.aistudio?.openSelectKey) {
           // @ts-ignore
           window.aistudio.openSelectKey();
        }
      } else {
        onError(msg || "Generation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = () => {
    const all = posts.map((p, i) => `Post ${i + 1}:\n${p.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(all);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedPostId(prev => prev === id ? null : id);
  };

  const themeClasses: Record<string, any> = {
    fuchsia: {
        btn: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/20',
        ring: 'focus:ring-fuchsia-500/40',
        activeBorder: 'border-fuchsia-500/30'
    },
    amber: {
        btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-900/20',
        ring: 'focus:ring-amber-500/40',
        activeBorder: 'border-amber-500/30'
    },
    emerald: {
        btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20',
        ring: 'focus:ring-emerald-500/40',
        activeBorder: 'border-emerald-500/30'
    },
    cyan: {
        btn: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20',
        ring: 'focus:ring-cyan-500/40',
        activeBorder: 'border-cyan-500/30'
    },
    indigo: {
        btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20',
        ring: 'focus:ring-indigo-500/40',
        activeBorder: 'border-indigo-500/30'
    },
    rose: {
        btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20',
        ring: 'focus:ring-rose-500/40',
        activeBorder: 'border-rose-500/30'
    },
    orange: {
        btn: 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20',
        ring: 'focus:ring-orange-500/40',
        activeBorder: 'border-orange-500/30'
    },
    blue: {
        btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20',
        ring: 'focus:ring-blue-500/40',
        activeBorder: 'border-blue-500/30'
    }
  };

  const currentTheme = themeClasses[colorTheme] || { btn: 'bg-slate-700', ring: 'focus:ring-slate-500', activeBorder: 'border-slate-500' };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls - Simplified */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          {platform} Campaign Posts
        </h2>
        
        {posts.length > 0 && (
            <button
                onClick={copyAll}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/50 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
                {copiedId === 'all' ? 'Copied!' : 'Copy All'}
            </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl border-2 border-dashed border-slate-800/50 bg-slate-900/20">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 mb-4">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <p className="text-slate-500 font-medium">No posts generated for {platform}</p>
            <p className="text-sm text-slate-600 mt-1">Go to Editor tab and click 'Generate AI Campaign'</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div 
                key={post.id} 
                className={`group relative flex flex-col rounded-2xl border bg-slate-900/40 p-5 transition-all duration-300 hover:shadow-xl hover:bg-slate-900/60 hover:-translate-y-1 ${currentTheme.activeBorder} border-slate-800`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                      {idx + 1}
                  </span>
                  {post.style && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-wider border border-slate-700">
                      {post.style}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                        {post.content.length} chars
                    </span>
                    
                    <button
                        onClick={() => toggleExpand(post.id)}
                        className="text-[10px] uppercase font-semibold text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                        {expandedPostId === post.id ? 'Collapse' : 'Expand'}
                    </button>

                    {platform === 'Twitter' && (
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 text-slate-800" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path 
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                    fill="none" 
                                    stroke={post.content.length > 280 ? '#f43f5e' : '#10b981'} 
                                    strokeWidth="4" 
                                    strokeDasharray={`${Math.min(100, (post.content.length / 280) * 100)}, 100`} 
                                />
                            </svg>
                        </div>
                    )}
                    
                    <button
                        onClick={() => copyToClipboard(post.content, post.id)}
                        className={`p-2 rounded-lg transition-colors ${copiedId === post.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        title="Copy text"
                    >
                        {copiedId === post.id ? (
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        )}
                    </button>

                    {post.imageUrl && (
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = post.imageUrl!;
                                link.download = `${platform}-image-${post.id}.png`;
                                link.click();
                            }}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-900/40 hover:text-emerald-400 transition-colors"
                            title="Download Image"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}

                    {post.audioUrl && (
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = post.audioUrl!;
                                link.download = `${platform}-audio-${post.id}.mp3`;
                                link.click();
                            }}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-amber-900/40 hover:text-amber-400 transition-colors"
                            title="Download Audio"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={() => onSave(post)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-cyan-900/40 hover:text-cyan-400 transition-colors"
                        title="Save to Archive"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </button>
                </div>
              </div>
              
              {post.audioUrl && (
                <div className="mb-4 p-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <audio 
                    controls 
                    className="w-full h-8 accent-cyan-500"
                    src={post.audioUrl}
                  />
                  <p className="mt-1 text-[9px] text-slate-500 text-center uppercase tracking-widest font-semibold">
                    AI Voice Narrative
                  </p>
                </div>
              )}

              <div className="relative flex-1">
                <textarea
                    readOnly
                    value={post.content}
                    className={`w-full bg-transparent resize-none text-sm leading-relaxed text-slate-200 focus:outline-none font-sans transition-all duration-300 ${
                        expandedPostId === post.id ? 'h-64' : 'h-24'
                    }`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};