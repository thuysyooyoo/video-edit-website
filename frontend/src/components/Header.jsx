import React from 'react';
import { Sparkles, PlusCircle, Settings, Video, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Header({ onOpenImport, hasData, videoTitle, onOpenSettings }) {
  return (
    <header className="h-16 border-b border-dark-700 bg-dark-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              OPUS <span className="text-brand-glow font-black">AI</span> STUDIO
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-glow border border-brand-500/30">
              Desktop Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-md">
            {videoTitle ? `Dự án: ${videoTitle}` : "Tự động phân tích & biên tập video ngắn 9:16"}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Gemini AI: <strong className="text-emerald-400">Online</strong></span>
        </div>

        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-brand-600/25 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Import Video Mới</span>
        </button>
      </div>
    </header>
  );
}
