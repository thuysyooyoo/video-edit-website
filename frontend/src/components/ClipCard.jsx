import React from 'react';
import { Play, Sparkles, AlertCircle, Lightbulb, Flame, CheckCircle2, Clock } from 'lucide-react';

export default function ClipCard({ clip, isActive, onSelect }) {
  const score = clip.hook_score || 85;
  const isTopTier = score >= 90;

  return (
    <div
      onClick={() => onSelect(clip)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
        isActive
          ? 'bg-dark-800 border-brand-500/80 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/40'
          : 'bg-dark-850 border-dark-700 hover:border-dark-600 hover:bg-dark-800/80'
      }`}
    >
      {/* Top Banner: Score & Duration */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs shadow-sm ${
              isTopTier
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Hook Score: {score}/100</span>
          </div>
          {isTopTier && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Viral Top 1
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{clip.duration}s</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug mb-3 group-hover:text-brand-glow transition-colors">
        {clip.title}
      </h3>

      {/* Hook, Problem, Solution Pills */}
      <div className="space-y-1.5 text-xs text-slate-300">
        {clip.hook && (
          <div className="flex items-start gap-1.5 bg-dark-900/60 p-2 rounded-xl border border-dark-700/60">
            <p className="line-clamp-1">
              <strong className="text-yellow-400/90 font-semibold">Hook: </strong>
              {clip.hook}
            </p>
          </div>
        )}

        {clip.problem && (
          <div className="flex items-start gap-1.5 bg-dark-900/60 p-2 rounded-xl border border-dark-700/60">
            <p className="line-clamp-1">
              <strong className="text-rose-400/90 font-semibold">Problem: </strong>
              {clip.problem}
            </p>
          </div>
        )}

        {clip.solution && (
          <div className="flex items-start gap-1.5 bg-dark-900/60 p-2 rounded-xl border border-dark-700/60">
            <p className="line-clamp-1">
              <strong className="text-emerald-400/90 font-semibold">Solution: </strong>
              {clip.solution}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Status / Play prompt */}
      <div className="mt-3 pt-3 border-t border-dark-700/50 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Mốc: <strong>{clip.start_time}s</strong> ➔ <strong>{clip.end_time}s</strong>
        </span>
        <span className={`font-semibold flex items-center gap-1 ${isActive ? 'text-brand-glow' : 'text-slate-400 group-hover:text-white'}`}>
          <Play className="w-3 h-3 fill-current" />
          {isActive ? 'Đang chỉnh sửa' : 'Xem & Sửa'}
        </span>
      </div>
    </div>
  );
}
