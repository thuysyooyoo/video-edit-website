import React, { useState } from 'react';
import { X, Volume2, Play, Check, Music, Sparkles } from 'lucide-react';
import { EXTENDED_SOUND_FX, playSoundFxEffect } from '../utils/soundFxSynthesizer';

export default function SoundFxPickerModal({ isOpen, onClose, onSelect, timestamp }) {
  const [playingId, setPlayingId] = useState(null);

  if (!isOpen) return null;

  const playPreview = (fx) => {
    playSoundFxEffect(fx.id);
    setPlayingId(fx.id);
    setTimeout(() => setPlayingId(null), 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-[#11121a] border border-[#262a3d] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#202334] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Kho 10+ Sound Effects Viral
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  SupoClip Sound
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Chèn vào mốc thời gian: <strong className="text-rose-400 font-mono">{timestamp?.toFixed(2)}s</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#1a1c29] text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of FX */}
        <div className="p-5 space-y-2.5 overflow-y-auto max-h-[60vh]">
          {EXTENDED_SOUND_FX.map((fx) => (
            <div
              key={fx.id}
              className="p-3 bg-[#161824] hover:bg-[#1f2235] border border-[#25283a] hover:border-rose-500/50 rounded-2xl flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => playPreview(fx)}
                  title="Nghe thử âm thanh"
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    playingId === fx.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105' : 'bg-[#222538] text-slate-300 group-hover:text-white'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{fx.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#202334] text-slate-400 border border-[#2c3148]">
                      {fx.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fx.desc} • <span className="text-rose-300 font-mono font-bold">{fx.duration}</span></p>
                </div>
              </div>

              <button
                onClick={() => {
                  playPreview(fx);
                  onSelect(fx);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-xs font-bold text-rose-300 hover:text-white transition-all shadow-sm active:scale-95"
              >
                Chèn
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
