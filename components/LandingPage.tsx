import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const LandingPage: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn("Login popup was closed before completing.");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
      <div className="absolute -bottom-48 left-10 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div className="z-10 text-center max-w-2xl animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-0.5 mb-8 shadow-2xl shadow-fuchsia-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>

        <h1 className="text-5xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Aura Studio
        </h1>
        
        <p className="text-lg text-slate-400 mb-5 leading-relaxed">
          The ultimate Aura Studio for social media. Generate high-impact captions, 
          trending hashtags, and stunning visual assets in a single fluid stream. 
          Powered by Gemini Multimodal AI.
        </p>

        {/* Coming Soon */}
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Coming Soon</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Chrome Extension */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 text-sm font-medium">
              <svg className="w-4 h-4 text-fuchsia-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 5.5h5L12 12l-2.5-4.5zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 8.5 12 8.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm0-5.5a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              Chrome Extension
            </div>
            {/* Windows App */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 text-sm font-medium">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
              Windows App
            </div>
            {/* iOS App */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-300 text-sm font-medium">
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              iOS App
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`group relative inline-flex items-center justify-center px-4 py-2 font-semibold text-white transition-all duration-200 bg-slate-900 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-fuchsia-500 ${isLoggingIn ? 'opacity-75 cursor-not-allowed' : 'hover:bg-slate-800 hover:border-slate-600'}`}
          >
            {isLoggingIn ? (
              <svg className="animate-spin w-5 h-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
          </button>
          
          <div className="flex items-center justify-center gap-8 text-xs font-medium text-slate-500 uppercase tracking-widest mt-8">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-fuchsia-500"></div>
              Free Tier: 10 Saves
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan-500"></div>
              Pro Tier: Unlimited
            </span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-600 text-sm">
        &copy; 2026 Aura Studio. Built for the Gemini Live Agent Challenge.
      </footer>
    </div>
  );
};