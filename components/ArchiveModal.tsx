import React, { useState } from 'react';
import { ArchivedPost, ArchivedCampaign } from '../types';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archives: ArchivedPost[];
  campaigns: ArchivedCampaign[];
  onDelete: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  onPreviewCampaign: (campaign: ArchivedCampaign) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({ 
  isOpen, 
  onClose, 
  archives, 
  campaigns, 
  onDelete,
  onDeleteCampaign,
  onPreviewCampaign
}) => {
  const [activeView, setActiveView] = useState<'campaigns' | 'posts'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArchives = archives.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white">Your Archive</h2>
            <p className="text-sm text-slate-400">Cloud stored campaigns and posts</p>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveView('campaigns')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'campaigns' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Campaigns
            </button>
            <button 
              onClick={() => setActiveView('posts')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'posts' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Single Posts
            </button>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/20">
          {activeView === 'campaigns' ? (
            campaigns.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No campaigns generated yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((camp) => (
                  <div key={camp.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all">
                    {camp.images && camp.images.length > 0 && (
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={camp.images[0].url} 
                          alt="Campaign Hero" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Campaign</p>
                            <h3 className="text-sm font-bold text-white line-clamp-1">{camp.summary}</h3>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = camp.images[0].url;
                              link.download = `campaign-hero-${camp.id}.png`;
                              link.click();
                            }}
                            className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Download Hero Image"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4 italic leading-relaxed">
                        "{camp.summary}"
                      </p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        {camp.keywords.slice(0, 3).map((k, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                            #{k}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto flex items-center gap-2">
                        <button 
                          onClick={() => onPreviewCampaign(camp)}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                        >
                          Preview
                        </button>
                        <button 
                          onClick={() => onDeleteCampaign(camp.id)}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                          title="Delete Campaign"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/50 flex justify-between items-center">
                      <span className="text-[9px] text-slate-600 font-mono">
                        {camp.posts.length} Posts
                      </span>
                      <span className="text-[9px] text-slate-600">
                        {new Date(camp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            archives.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p>No archived posts yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search posts..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <svg className="absolute right-3 top-3 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredArchives.map((post) => (
                    <div key={post.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col group relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-900 px-2 py-1 rounded-md">
                            {post.platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {post.imageUrl && (
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = post.imageUrl!;
                                link.download = `${post.platform}-image-${post.id}.png`;
                                link.click();
                              }}
                              className="text-slate-600 hover:text-emerald-400 transition-colors p-1"
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
                                link.download = `${post.platform}-audio-${post.id}.mp3`;
                                link.click();
                              }}
                              className="text-slate-600 hover:text-amber-400 transition-colors p-1"
                              title="Download Audio"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => onDelete(post.id)}
                            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                            title="Delete from archive"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 line-clamp-4 mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {post.audioUrl && (
                        <div className="mb-3 p-1.5 bg-slate-950 rounded-lg border border-slate-800/50">
                          <audio src={post.audioUrl} controls className="w-full h-6 accent-cyan-500" />
                        </div>
                      )}

                      {post.imageUrl && (
                        <div className="mt-auto rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900">
                          <img 
                            src={post.imageUrl} 
                            alt="Generated visual" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="mt-3 text-[10px] text-slate-600">
                        Saved on {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            {activeView === 'campaigns' ? `${campaigns.length} campaigns` : `${archives.length} posts`} archived
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
