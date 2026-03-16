import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { TabId, SummaryResult, GeneratedPost, UserProfile, ArchivedPost, CampaignResult, ArchivedCampaign } from './types';
import { analyzeText, generateCampaign } from './services/aiService';
import { InputPanel } from './components/InputPanel';
import { PostGenerator } from './components/PostGenerator';
import { Toast } from './components/Toast';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage';
import { ArchiveModal } from './components/ArchiveModal';
import { GenerationOverlay } from './components/GenerationOverlay';

// Define which platforms are Pro-only
const PRO_PLATFORMS = new Set([
    TabId.SNAPCHAT, 
    TabId.INSTAGRAM, 
    TabId.TELEGRAM, 
    TabId.PINTEREST, 
    TabId.REDDIT
]);

// Platform Configuration
const PLATFORM_CONFIG: Record<string, { theme: string; styles: any[]; name: string }> = {
    [TabId.FACEBOOK]: {
        name: 'Facebook',
        theme: 'blue',
        styles: [
            { label: 'Friendly', value: 'friendly' },
            { label: 'Community', value: 'community' },
            { label: 'Casual', value: 'casual' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.TWITTER]: {
        name: 'Twitter',
        theme: 'cyan',
        styles: [
            { label: 'Normal', value: 'normal' },
            { label: 'Thread', value: 'thread' },
            { label: 'Punchy', value: 'punchy' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.LINKEDIN]: {
        name: 'LinkedIn',
        theme: 'indigo',
        styles: [
            { label: 'Network', value: 'network' },
            { label: 'Professional', value: 'professional' },
            { label: 'Thought Leader', value: 'thought-leader' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.INSTAGRAM]: {
        name: 'Instagram',
        theme: 'fuchsia',
        styles: [
            { label: 'Aesthetic', value: 'aesthetic' },
            { label: 'Caption', value: 'caption' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.SNAPCHAT]: {
        name: 'Snapchat',
        theme: 'amber',
        styles: [
            { label: 'Casual', value: 'casual' },
            { label: 'Hype', value: 'hype' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.TELEGRAM]: {
        name: 'Telegram',
        theme: 'cyan', 
        styles: [
            { label: 'Update', value: 'update' },
            { label: 'Broadcast', value: 'broadcast' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.PINTEREST]: {
        name: 'Pinterest',
        theme: 'rose',
        styles: [
            { label: 'Descriptive', value: 'descriptive' },
            { label: 'Default', value: 'default' },
        ]
    },
    [TabId.REDDIT]: {
        name: 'Reddit',
        theme: 'orange',
        styles: [
            { label: 'Discussion', value: 'discussion' },
            { label: 'Default', value: 'default' },
        ]
    },
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(TabId.EDITOR);
  const [sourceText, setSourceText] = useState('');
  const [autosave, setAutosave] = useState(true);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  
  // Data States
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignResult | null>(null);
  const [postsMap, setPostsMap] = useState<Record<string, GeneratedPost[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateText, setGenerateText] = useState(true);
  const [generateImage, setGenerateImage] = useState(true);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [generationSteps, setGenerationSteps] = useState<any[]>([
    { id: 'analyzing', label: 'Analyzing Source Material', status: 'pending' },
    { id: 'images', label: 'Generating Visual Assets', status: 'pending' },
    { id: 'audio', label: 'Crafting Audio Narratives', status: 'pending' },
    { id: 'saving', label: 'Archiving to Firebase', status: 'pending' },
  ]);
  const [lastGenMode, setLastGenMode] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'info'|'ok'|'warn'|'err' } | null>(null);
  const [archives, setArchives] = useState<ArchivedPost[]>([]);
  const [campaigns, setCampaigns] = useState<ArchivedCampaign[]>([]);

  const resetWorkspace = () => {
    setSourceText('');
    setCampaignData(null);
    setSummaryData(null);
    setPostsMap({});
    setActiveTab(TabId.EDITOR);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Clear UI on new login or user change
        if (!user || user.uid !== firebaseUser.uid) {
          resetWorkspace();
        }
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            // Auto-upgrade default admin to admin role if missing
            if (userData.email === 'tangit.naga@gmail.com' && userData.role !== 'admin') {
              try {
                await setDoc(userRef, { role: 'admin' }, { merge: true });
                userData.role = 'admin';
              } catch (e) {
                console.error("Failed to auto-upgrade admin role", e);
              }
            }
            setUser(userData);
            setIsProMode(userData.isPro);
          } else {
            // New user initialization
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
              isPro: false,
              role: firebaseUser.email === 'tangit.naga@gmail.com' ? 'admin' : 'user',
              credits: 5,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
            setIsProMode(false);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        setIsProMode(false);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Archive & Campaign Listener
  useEffect(() => {
    if (!user) {
      setArchives([]);
      setCampaigns([]);
      return;
    }
    
    const qArchives = query(collection(db, 'archives'), where('userId', '==', user.uid));
    const unsubscribeArchives = onSnapshot(qArchives, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: typeof data.createdAt === 'string' ? data.createdAt : data.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        } as ArchivedPost;
      });
      setArchives(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'archives');
    });

    const qCampaigns = query(collection(db, 'campaigns'), where('userId', '==', user.uid));
    const unsubscribeCampaigns = onSnapshot(qCampaigns, (snapshot) => {
      const docs = snapshot.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          ...data,
          createdAt: typeof data.createdAt === 'string' ? data.createdAt : data.createdAt?.toDate()?.toISOString() || new Date().toISOString()
        } as ArchivedCampaign;
      });
      setCampaigns(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'campaigns');
    });

    return () => {
      unsubscribeArchives();
      unsubscribeCampaigns();
    };
  }, [user]);

  useEffect(() => {
    const savedAuto = localStorage.getItem('scs_autosave');
    if (savedAuto !== null) setAutosave(savedAuto === '1');

    const savedText = localStorage.getItem('scs_sourceText');
    if (savedText && (savedAuto === '1' || savedAuto === null)) {
      setSourceText(savedText);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scs_autosave', autosave ? '1' : '0');
    if (autosave) {
      localStorage.setItem('scs_sourceText', sourceText);
    }
  }, [sourceText, autosave]);

  const showToast = (msg: string, type: 'info'|'ok'|'warn'|'err' = 'info') => {
    setToast({ msg, type });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logged out successfully', 'ok');
    } catch (error) {
      showToast('Logout failed', 'err');
    }
  };

  const handleSaveToArchive = async (post: GeneratedPost, platform: string) => {
    if (!user) return;

    // Check limits
    if (!user.isPro && archives.length >= 10) {
      showToast('Free tier limit reached (10 saves). Upgrade to Pro for unlimited!', 'warn');
      setIsSettingsOpen(true);
      return;
    }

    try {
      const archiveRef = doc(collection(db, 'archives'));
      
      let finalImageUrl = post.imageUrl || null;
      let finalAudioUrl = post.audioUrl || null;

      await setDoc(archiveRef, {
        userId: user.uid,
        platform,
        content: post.content,
        imageUrl: finalImageUrl,
        visualDescription: post.visualDescription || null,
        audioUrl: finalAudioUrl,
        createdAt: new Date().toISOString()
      });
      showToast('Saved to archive!', 'ok');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'archives');
      showToast('Failed to save', 'err');
    }
  };

  const handleDeleteArchive = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'archives', id));
      showToast('Deleted from archive', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `archives/${id}`);
    }
  };

  const handleTogglePro = async (val: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPro: val }, { merge: true });
      setUser(prev => prev ? { ...prev, isPro: val } : null);
      setIsProMode(val);
      showToast(val ? 'Pro Mode Activated!' : 'Switched to Local Mode', 'ok');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updatePosts = (platform: string, newPosts: GeneratedPost[]) => {
      setPostsMap(prev => ({ ...prev, [platform]: newPosts }));
  };

  const handleTabClick = (tabId: TabId) => {
      if (PRO_PLATFORMS.has(tabId) && !isProMode) {
          showToast("Upgrade to Pro to unlock this platform", 'info');
          setIsSettingsOpen(true);
          return;
      }
      setActiveTab(tabId);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleGenerateCampaign = async () => {
    if (!sourceText || sourceText.length < 20) {
      showToast("Please enter more text to generate a campaign.", "warn");
      return;
    }

    // Reset steps
    setGenerationSteps([
      { id: 'analyzing', label: 'Analyzing Source Material', status: 'pending' },
      { id: 'images', label: 'Generating Visual Assets', status: 'pending' },
      { id: 'audio', label: 'Crafting Audio Narratives', status: 'pending' },
      { id: 'saving', label: 'Archiving to Firebase', status: 'pending' },
    ]);
    
    setIsGenerating(true);
    const mode = isProMode ? 'Gemini AI' : 'Local Mode';

    try {
      const result = await generateCampaign(sourceText, PLATFORM_CONFIG, isProMode, { text: generateText, image: generateImage, audio: generateAudio }, (stepId) => {
        setGenerationSteps(prev => prev.map(s => {
          if (s.id === stepId) return { ...s, status: 'loading' };
          const stepIdx = prev.findIndex(p => p.id === stepId);
          const currentIdx = prev.indexOf(s);
          if (stepIdx !== -1 && currentIdx < stepIdx) return { ...s, status: 'done' };
          return s;
        }));
      });

      // Update steps to show audio is done
      setGenerationSteps(prev => prev.map(s => {
        if (s.id === 'audio') return { ...s, status: 'done' };
        if (s.id === 'saving') return { ...s, status: 'loading' };
        return s;
      }));

      setCampaignData(result);
      setSummaryData({ summary: result.summary, keywords: result.keywords });
      
      const newPostsMap: Record<string, GeneratedPost[]> = {};
      result.posts.forEach((p, i) => {
        if (!newPostsMap[p.platform]) newPostsMap[p.platform] = [];
        newPostsMap[p.platform].push({
          id: `campaign-${Date.now()}-${i}`,
          content: p.content,
          audioUrl: p.audioUrl,
          style: p.style
        });
      });
      setPostsMap(newPostsMap);
      
      // Save to Firestore automatically
      if (user) {
        try {
          // 1. Save the full campaign
          const campaignRef = doc(collection(db, 'campaigns'));
          
          // Use base64 images directly
          const imageUrls = result.images.map((img) => ({
              url: img.url,
              description: img.description
          }));

          // Use base64 audio directly
          const postsWithUrls = result.posts.map((post) => ({
              ...post,
              audioUrl: post.audioUrl
          }));

          await setDoc(campaignRef, {
            userId: user.uid,
            summary: result.summary,
            keywords: result.keywords,
            images: imageUrls,
            posts: postsWithUrls,
            createdAt: new Date().toISOString()
          });

          // 2. Save sourceText in a separate document
          await setDoc(doc(db, 'campaign_sources', campaignRef.id), {
            userId: user.uid,
            sourceText: sourceText
          });

          // 2. Also save individual posts to archives
          const archivePromises = postsWithUrls.map(post => 
            setDoc(doc(collection(db, 'archives')), {
              userId: user.uid,
              platform: post.platform,
              content: post.content,
              imageUrl: imageUrls[0]?.url || '',
              visualDescription: imageUrls[0]?.description || '',
              audioUrl: post.audioUrl || '',
              createdAt: new Date().toISOString()
            })
          );
          await Promise.all(archivePromises);

          // 3. Deduct Credits if in Pro Mode
          if (isProMode && user.credits > 0) {
            const newCredits = user.credits - 1;
            await setDoc(doc(db, 'users', user.uid), { credits: newCredits }, { merge: true });
            setUser({ ...user, credits: newCredits });
          }

          setGenerationSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
          setLastGenMode(mode);
          
          // Clear mode banner after 5 seconds
          setTimeout(() => setLastGenMode(null), 8000);

        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'campaigns/archives');
        }
      }

      showToast(`Campaign generated using ${mode}!`, "ok");
    } catch (err: any) {
      setGenerationSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
      const msg = err.message || "";
      if (msg.toLowerCase().includes("permission denied") || msg.toLowerCase().includes("requested entity was not found")) {
        showToast("Gemini API access required. Please select your API key.", "warn");
        // @ts-ignore
        if (window.aistudio?.openSelectKey) {
           // @ts-ignore
           await window.aistudio.openSelectKey();
        }
      } else {
        showToast(msg || "Failed to generate campaign.", "err");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadCampaign = async (campaign: ArchivedCampaign) => {
    setCampaignData(campaign);
    setSummaryData({ summary: campaign.summary, keywords: campaign.keywords });
    
    // Fetch sourceText from separate collection
    try {
        const sourceDoc = await getDoc(doc(db, 'campaign_sources', campaign.id));
        if (sourceDoc.exists()) {
            setSourceText(sourceDoc.data().sourceText || '');
        } else {
            setSourceText('');
        }
    } catch (e) {
        console.error("Failed to load source text", e);
        setSourceText('');
    }
    
    const newPostsMap: Record<string, GeneratedPost[]> = {};
    campaign.posts.forEach((p, i) => {
      if (!newPostsMap[p.platform]) newPostsMap[p.platform] = [];
      newPostsMap[p.platform].push({
        id: `loaded-${campaign.id}-${i}`,
        content: p.content,
        audioUrl: p.audioUrl,
        style: p.style
      });
    });
    setPostsMap(newPostsMap);
    setActiveTab(TabId.EDITOR);
    setIsArchiveOpen(false);
    showToast("Campaign loaded into workspace", "ok");
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      showToast("Campaign deleted", "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`);
    }
  };

  const renderTabContent = () => {
    if (activeTab === TabId.EDITOR) {
        return (
            <InputPanel
                value={sourceText}
                onChange={setSourceText}
                autosave={autosave}
                onToggleAutosave={() => setAutosave(!autosave)}
                onClear={() => {
                    setSourceText('');
                    showToast('Cleared text', 'info');
                }}
                onDemo={() => {
                    setSourceText("Building better habits doesn’t require a complete lifestyle overhaul. Most change happens when you make the next action obvious, small, and repeatable. Start by identifying one behavior you want to improve and reduce any friction around it. That could mean preparing your environment ahead of time, scheduling a short time window, or using a simple checklist. Track progress in a way that feels motivating rather than punishing—consistency matters more than intensity.");
                    showToast('Demo text loaded', 'ok');
                }}
                summaryData={summaryData}
                campaignData={campaignData}
                onGenerateCampaign={handleGenerateCampaign}
                onError={(msg) => showToast(msg, 'err')}
                isPro={isProMode}
                isLoading={isGenerating}
                generateText={generateText}
                setGenerateText={setGenerateText}
                generateImage={generateImage}
                setGenerateImage={setGenerateImage}
                generateAudio={generateAudio}
                setGenerateAudio={setGenerateAudio}
            />
        );
    }

    const conf = PLATFORM_CONFIG[activeTab];
    if (conf) {
        return (
            <PostGenerator
                platform={conf.name}
                sourceText={sourceText}
                posts={postsMap[conf.name] || []}
                onUpdate={(p) => updatePosts(conf.name, p)}
                onSave={(post) => handleSaveToArchive(post, conf.name)}
                onError={(msg) => showToast(msg, 'err')}
                colorTheme={conf.theme}
                styleOptions={conf.styles}
                isPro={isProMode}
            />
        );
    }
    return null;
  };

  const tabs = [
    { id: TabId.EDITOR, label: 'Editor', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
    { id: TabId.FACEBOOK, label: 'Facebook', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg> },
    { id: TabId.TWITTER, label: 'Twitter', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.1 1.5c1.1-.7 1.9-1.8 2.3-3.1a10.6 10.6 0 01-3.5 1.3 5.5 5.5 0 00-9.3 5v1A15.6 15.6 0 011.7 3a5.5 5.5 0 001.7 7.4 5.5 5.5 0 01-2.5-.7v.1a5.5 5.5 0 004.4 5.4 5.5 5.5 0 01-2.5.1 5.5 5.5 0 005.1 3.8 11 11 0 01-6.8 2.4c-.4 0-.9 0-1.3-.1a15.6 15.6 0 008.4 2.5c10.1 0 15.6-8.4 15.6-15.6v-.7A11.1 11.1 0 0023 3z"/></svg> },
    { id: TabId.LINKEDIN, label: 'LinkedIn', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> },
    { id: TabId.INSTAGRAM, label: 'Instagram', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.5.2.9.5 1.3.9.4.4.7.8.9 1.3.2.4.4 1 .5 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.5-.5.9-.9 1.3-.4.4-.8.7-1.3.9-.4.2-1 .4-2.2.5-1.2.1-1.6.1-4.8.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5-.5-.2-.9-.5-1.3-.9-.4-.4-.7-.8-.9-1.3-.2-.4-.4-1-.5-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.5.5-.9.9-1.3.4-.4.8-.7 1.3-.9.4-.2 1-.4 2.2-.5 1.3-.1 1.6-.1 4.9-.1m0-2.2C8.7 0 8.3 0 7.1.1c-1.3.1-2.2.3-3 .6-.8.3-1.5.8-2.1 1.4C1.4 2.7.9 3.4.6 4.2.3 5 .1 5.9.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.2.3 2.1.6 2.9.3.8.8 1.5 1.4 2.1.6.6 1.3 1.1 2.1 1.4.8.3 1.7.5 2.9.6 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c1.2-.1 2.1-.3 2.9-.6.8-.3 1.5-.8 2.1-1.4.6-.6 1.1-1.3 1.4-2.1.3-.8.5-1.7.6-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.2-.3-2.1-.6-2.9-.3-.8-.8-1.5-1.4-2.1-.6-.6-1.3-1.1-2.1-1.4-.8-.3-1.7-.5-2.9-.6C15.7 0 15.3 0 12 0z"/><path d="M12 5.8c-3.4 0-6.2 2.8-6.2 6.2 0 3.4 2.8 6.2 6.2 6.2 3.4 0 6.2-2.8 6.2-6.2 0-3.4-2.8-6.2-6.2-6.2zm0 10.2c-2.2 0-4-1.8-4-4 0-2.2 1.8-4 4-4 2.2 0 4 1.8 4 4 0 2.2-1.8 4-4 4zm6.5-10.8c-.8 0-1.4.6-1.4 1.4 0 .8.6 1.4 1.4 1.4.8 0 1.4-.6 1.4-1.4 0-.8-.6-1.4-1.4-1.4z"/></svg> },
    { id: TabId.SNAPCHAT, label: 'Snapchat', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C7.5 2 4 5.2 4 9.2c0 2.5 1.4 4.7 3.6 6-.2.7-.5 1.5-.9 2.1-.2.3-.3.5-.1.8.2.3.6.3.8.2 2.3-1.1 3.9-2.3 4.6-2.9.5.1 1 .1 1.5.1 4.4 0 8-3.2 8-7.3C21.5 5.2 18 2 12 2z"/></svg> },
    { id: TabId.TELEGRAM, label: 'Telegram', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.4 3.4L2.6 10.6c-1.4.5-1.4 2.1.3 2.6l4.8 1.5 1.8 5.7c.3 1 .1 1.2 1 .4l2.6-2.2 5.3 3.9c1 .5 2.5.3 2.7-1L23.5 4.6c.3-1.4-1.5-1.9-2.1-1.2z"/></svg> },
    { id: TabId.PINTEREST, label: 'Pinterest', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.1 9.4 7.8 11.1-.1-.9-.2-2.3 0-3.3l1.4-5.9s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.4 0-2.8-2-4.9-4.9-4.9-3.6 0-5.7 2.7-5.7 5.5 0 1.1.4 2.3 1 2.9.1.1.1.2.1.3-.1.4-.3 1.2-.4 1.4-.1.3-.2.3-.5.2-1.9-.9-3.1-3.6-3.1-5.9 0-4.8 3.5-9.2 10-9.2 5.3 0 9.4 3.8 9.4 8.8 0 5.2-3.3 9.4-7.9 9.4-1.5 0-3-.8-3.5-1.8l-1 3.7c-.4 1.4-1.3 3.1-2 4.1 1.5.4 3.1.7 4.7.7 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg> },
    { id: TabId.REDDIT, label: 'Reddit', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5 4.7c.7 0 1.3.6 1.3 1.2 0 .7-.6 1.3-1.3 1.3l-2.6-.5-.8 3.7c1.8.1 3.5.6 4.7 1.5.3-.3.7-.5 1.2-.5 1 0 1.8.8 1.8 1.8 0 .7-.4 1.3-1 1.6 0 .2 0 .3 0 .5 0 2.7-3.1 4.9-7 4.9-3.9 0-7-2.2-7-4.9 0-.2 0-.4 0-.5a1.8 1.8 0 0 1 1-1.6c0-1 .8-1.8 1.8-1.8.5 0 .9.2 1.2.5 1.2-.9 2.9-1.4 4.7-1.5l.9-4.2a.3.3 0 0 1 .4-.2l2.9.6a1.2 1.2 0 0 1 1.1-.7z"/></svg> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-3xl"></div>
            <div className="absolute -bottom-48 left-10 h-[520px] w-[520px] rounded-full bg-cyan-500/12 blur-3xl"></div>
            <div className="absolute top-28 right-10 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl"></div>
        </div>

      <header className="border-b border-slate-800/70 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Aura Studio</h1>
              <p className="mt-1 text-sm text-slate-300">
                AI Social Agent: Captions + Images + Hashtags.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsArchiveOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold">
                  {campaigns.length}
                </span>
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </button>

              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-full border border-slate-700 bg-slate-900/40 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 transition-all"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
              
              {isProMode ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-200">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Gemini Active - {user?.credits || 0} Credits
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-800/60 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Local Mode - Unlimited*
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {lastGenMode && (
          <div className="mb-6 animate-slide-down">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Content Generated Successfully</p>
                  <p className="text-xs text-emerald-400/80">Created using {lastGenMode}</p>
                </div>
              </div>
              <button 
                onClick={() => setLastGenMode(null)}
                className="text-emerald-400/50 hover:text-emerald-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <div className="border-b border-slate-800/70 px-4 pt-4 overflow-x-auto">
            <nav className="flex gap-2 pb-4 min-w-max" aria-label="Tabs">
              {tabs.map((tab) => {
                const isLocked = PRO_PLATFORMS.has(tab.id) && !isProMode;
                return (
                    <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`group flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 relative ${
                        activeTab === tab.id
                        ? 'bg-cyan-500/10 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/40'
                        : isLocked 
                            ? 'text-slate-600 cursor-not-allowed hover:bg-slate-900/20' 
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    >
                    <span className={`transition-colors duration-200 ${activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {tab.icon}
                    </span>
                    {tab.label}
                    {isLocked && (
                        <svg className="w-3 h-3 ml-1 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    )}
                    </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 md:p-6 min-h-[400px]">
            {renderTabContent()}
          </div>
        </section>

        <footer className="mt-6 text-center text-xs text-slate-600">
          Private & Secure • Processing happens entirely within your browser.
        </footer>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isPro={isProMode}
        onTogglePro={handleTogglePro}
        credits={user?.credits || 0}
        user={user ? {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        } : null}
        archives={archives}
        campaigns={campaigns}
      />

      <ArchiveModal 
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        archives={archives}
        campaigns={campaigns}
        onDelete={handleDeleteArchive}
        onDeleteCampaign={handleDeleteCampaign}
        onPreviewCampaign={handleLoadCampaign}
      />

      <GenerationOverlay 
        isOpen={isGenerating}
        steps={generationSteps}
        sourcePreview={sourceText.substring(0, 100) + (sourceText.length > 100 ? '...' : '')}
        onClose={() => setIsGenerating(false)}
      />

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;