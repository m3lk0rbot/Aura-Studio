import React, { useState, useMemo } from 'react';
import { ArchivedPost, ArchivedCampaign } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPro: boolean;
    onTogglePro: (val: boolean) => void;
    credits: number;
    user: {
        displayName: string;
        email: string;
        photoURL: string;
        uid: string;
    } | null;
    archives: ArchivedPost[];
    campaigns: ArchivedCampaign[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    isPro, 
    onTogglePro,
    credits,
    user,
    archives,
    campaigns
}) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Statistics' | 'History' | 'Store'>('Overview');

    const stats = useMemo(() => {
        const totalCampaigns = campaigns.length;
        const totalSinglePosts = archives.length;
        let totalPostsInCampaigns = 0;
        let totalImages = 0;
        let totalAudio = 0;
        const platformCounts: Record<string, number> = {};

        campaigns.forEach(c => {
            totalPostsInCampaigns += c.posts.length;
            totalImages += c.images.length;
            c.posts.forEach(p => {
                if (p.audioUrl) totalAudio++;
                platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
            });
        });

        archives.forEach(a => {
            if (a.imageUrl) totalImages++;
            if (a.audioUrl) totalAudio++;
            platformCounts[a.platform] = (platformCounts[a.platform] || 0) + 1;
        });

        const totalPosts = totalPostsInCampaigns + totalSinglePosts;
        const mostUsedPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const platformBreakdown = Object.entries(platformCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: totalPosts > 0 ? (count / totalPosts) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalCampaigns,
            totalSinglePosts,
            totalPosts,
            totalImages,
            totalAudio,
            mostUsedPlatform,
            platformBreakdown
        };
    }, [archives, campaigns]);

    const historyItems = useMemo(() => {
        const items = [
            ...campaigns.map(c => ({
                id: c.id,
                type: 'Campaign',
                title: c.summary,
                date: new Date(c.createdAt),
                icon: '🚀',
                color: 'text-cyan-400'
            })),
            ...archives.map(a => ({
                id: a.id,
                type: 'Post',
                title: `${a.platform} Post`,
                date: new Date(a.createdAt),
                icon: '📝',
                color: 'text-fuchsia-400'
            }))
        ];
        return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);
    }, [archives, campaigns]);

    if (!isOpen) return null;

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Mode Selection */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <div>
                    <div className="font-medium text-slate-200 flex items-center gap-2">
                        AI Engine Mode
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${isPro ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500' : 'bg-slate-600'}`}>
                            {isPro ? 'GEMINI PRO' : 'LOCAL'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {isPro ? 'Using advanced Google Gemini AI.' : 'Using local heuristic algorithms.Using free API so there may be API Limit error.'}
                    </p>
                </div>
                <button 
                    onClick={() => onTogglePro(!isPro)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${isPro ? 'bg-cyan-600' : 'bg-slate-700'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {/* Credit Status */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Local Usage</p>
                    <p className="text-xl font-bold text-emerald-400">Unlimited</p>
                    <p className="text-[10px] text-slate-500 mt-1">Free forever</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">AI Credits</p>
                    <p className="text-xl font-bold text-white">{credits}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Generations remaining</p>
                </div>
            </div>

            {/* Account Info */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                <h3 className="text-sm font-medium text-slate-200 mb-3">Account Info</h3>
                <div className="flex items-center gap-3">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-700" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                            {user?.displayName?.substring(0, 2).toUpperCase() || 'GU'}
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-white">{user?.displayName || 'Guest User'}</p>
                        <p className="text-[10px] text-slate-500">{user?.email}</p>
                    </div>
                    {isPro && (
                         <span className="ml-auto text-[10px] bg-cyan-900/50 text-cyan-400 px-2 py-1 rounded border border-cyan-900">
                            PRO ACTIVE
                         </span>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStatistics = () => (
        <div className="animate-fade-in space-y-6 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Campaigns</p>
                    <p className="text-2xl font-bold text-white tracking-tighter">{stats.totalCampaigns}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Posts</p>
                    <p className="text-2xl font-bold text-white tracking-tighter">{stats.totalPosts}</p>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1">Platform Usage</p>
                <div className="space-y-2">
                    {stats.platformBreakdown.length === 0 ? (
                        <p className="text-xs text-slate-600 italic px-1">No data available yet.</p>
                    ) : (
                        stats.platformBreakdown.map((p) => (
                            <div key={p.name} className="space-y-1">
                                <div className="flex justify-between text-[10px] px-1">
                                    <span className="text-slate-300 font-medium uppercase tracking-wider">{p.name}</span>
                                    <span className="text-slate-500">{p.count} posts ({Math.round(p.percentage)}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
                                    <div 
                                        className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-1000" 
                                        style={{ width: `${p.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Visuals</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-cyan-400">{stats.totalImages}</span>
                        <span className="text-[10px] text-slate-600 uppercase">Images</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Audio</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-fuchsia-400">{stats.totalAudio}</span>
                        <span className="text-[10px] text-slate-600 uppercase">Files</span>
                    </div>
                </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-fuchsia-500/10 border border-slate-800/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Efficiency Score</p>
                        <p className="text-[10px] text-slate-500">Content generation performance</p>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                    You've maintained a visual-to-text ratio of <span className="text-cyan-400 font-bold">{stats.totalPosts > 0 ? (stats.totalImages / stats.totalPosts).toFixed(2) : 0}</span>. 
                    Your most active platform is <span className="text-fuchsia-400 font-bold uppercase">{stats.mostUsedPlatform}</span>.
                </p>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="animate-fade-in h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {historyItems.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-xs text-slate-600 italic">No activity history yet.</p>
                </div>
            ) : (
                historyItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50 hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300">
                        <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shadow-inner ${item.color}`}>
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.type}</span>
                                <span className="text-[9px] text-slate-600 font-mono">{item.date.toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{item.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderStore = () => (
        <div className="animate-fade-in space-y-6">
            <div className="text-center space-y-2 mb-6">
                <h3 className="text-lg font-bold text-white">Top Up Your Creative Engine</h3>
                <p className="text-sm text-slate-400">Get 500 AI generations for just $5.00</p>
            </div>

            <div className="relative group p-1 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-fuchsia-500/20">
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-cyan-900 text-cyan-200 mb-2">
                                BEST VALUE
                            </span>
                            <h4 className="text-xl font-bold text-white">Pro Pack</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white">$5.00</span>
                        </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            500 AI Generations
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Access to all platforms
                        </li>
                        <li className="flex items-center gap-2 text-sm text-slate-300">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Priority processing
                        </li>
                    </ul>

                    <button className="w-full py-3 rounded-lg bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.09-3.358 7.188-7.245 7.188H10.12l-1.304 6.742a.804.804 0 0 1-.74.673zm-2.96-1.28h3.762l1.656-8.567.112-.582h3.204c3.085 0 4.966-1.53 5.717-5.57.025-.124.045-.246.064-.366.233-1.488-.02-2.423-.746-3.25C17.062 1.009 15.422.64 13.458.64H5.998L2.47 21.337z"/><path d="M9.826 21.337h3.816c.496 0 .918-.36 1.003-.85l.707-4.067.16-1.016c.112-.71.724-1.234 1.442-1.234h.346c2.756 0 4.536-1.372 5.094-4.227.233-1.488-.02-2.423-.746-3.25-.824-1.21-2.464-1.58-4.428-1.58H8.86L6.5 21.337h3.326z"/></svg>
                        Buy with PayPal
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-3">
                        Secure payment processing via PayPal.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="px-6 border-b border-slate-800">
                    <div className="flex gap-6">
                        {['Overview', 'Statistics', 'History', 'Store'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-3 text-sm font-medium transition-colors relative ${
                                    activeTab === tab 
                                    ? 'text-cyan-400' 
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {activeTab === 'Overview' && renderOverview()}
                    {activeTab === 'Statistics' && renderStatistics()}
                    {activeTab === 'History' && renderHistory()}
                    {activeTab === 'Store' && renderStore()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};