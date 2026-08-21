import React, { useState, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Scissors, 
  Download, 
  Share2, 
  Sparkles, 
  Copy, 
  Smartphone, 
  FileCode, 
  Zap, 
  ChevronRight,
  Video,
  Mic,
  MessageSquare
} from 'lucide-react';

export default function ClipPreviewModal({ 
  clip, 
  isOpen, 
  onClose, 
  onGoToEditor,
  words = []
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAiToolsMenu, setShowAiToolsMenu] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen || !clip) return null;

  const clipWords = words.filter(
    w => w.start >= clip.start_time - 0.2 && w.end <= clip.end_time + 0.5
  );

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    // Open stream URL in new tab to trigger download
    window.open(`http://127.0.0.1:8000/api/stream/clip/${clip.id}`, '_blank');
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const score = clip.hook_score || 95;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#111219] border border-[#232637] rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex relative animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-[#1b1d2a] hover:bg-[#25283b] text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── 1. Left Score Metrics Panel (20%) ── */}
        <div className="w-48 bg-[#0d0e15] border-r border-[#202334] p-5 flex flex-col justify-between">
          <div>
            {/* Like/Dislike */}
            <div className="flex items-center gap-2 mb-6">
              <button className="p-2 rounded-lg bg-[#181a26] text-slate-400 hover:text-white transition-colors">
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-[#181a26] text-slate-400 hover:text-white transition-colors">
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>

            {/* Big Score */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-emerald-400">{score}</span>
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">AI Viral Score</p>
            </div>

            {/* Score Factors: HOOK - PROBLEM - SOLUTION */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Hook:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">({clip.hook_score || 95})</span>
                  <strong className="text-emerald-400 font-bold">{clip.hook_grade || 'A+'}</strong>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Problem:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">({clip.problem_score || 90})</span>
                  <strong className="text-emerald-400 font-bold">{clip.problem_grade || 'A'}</strong>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Solution:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">({clip.solution_score || 92})</span>
                  <strong className="text-emerald-400 font-bold">{clip.solution_grade || 'A+'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500">
            Đánh giá 3 Trụ Cột: Hook - Problem - Solution
          </div>
        </div>

        {/* ── 2. Center 9:16 Video Player (35%) ── */}
        <div className="w-[340px] bg-black border-r border-[#202334] flex items-center justify-center p-4 relative">
          <div className="w-full aspect-[9/16] relative rounded-2xl overflow-hidden bg-[#0a0b10] border border-[#2b2f44] shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              src="http://127.0.0.1:8000/api/stream/source"
              onTimeUpdate={(e) => {
                const t = e.target.currentTime;
                setCurrentTime(t);
                if (t >= clip.end_time) {
                  e.target.currentTime = clip.start_time;
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.currentTime = clip.start_time;
              }}
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
              playsInline
            />

            {/* Tag Low-Res Preview */}
            <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-slate-300">
              PREVIEW
            </div>

            {/* Timestamp tag */}
            <div className="absolute top-3 right-3 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-white">
              {formatTime(clip.duration)}
            </div>

            {/* Top Hook Bar */}
            <div className="absolute top-8 left-2 right-2 pointer-events-none text-center">
              <div className="bg-white/95 text-black font-black text-xs px-2.5 py-1 rounded shadow-md inline-block max-w-[90%] uppercase leading-tight">
                {clip.title}
              </div>
            </div>

            {/* Subtitles Overlay */}
            <div className="absolute bottom-10 left-2 right-2 pointer-events-none text-center">
              <p className="text-sm font-black uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <span className="text-yellow-400">VÀ ĐƯỢC XÁC</span>
              </p>
            </div>

            {/* Play Button Icon */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Right Details & Transcript Area (30%) ── */}
        <div className="flex-1 bg-[#101118] p-6 flex flex-col justify-between overflow-hidden">
          <div className="overflow-y-auto pr-2 space-y-4">
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-base text-white leading-snug">
                #{clip.id} {clip.title}
              </h2>
              <button className="p-1 text-slate-400 hover:text-white">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Time range */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="px-2 py-0.5 rounded bg-[#1c1e2b] border border-[#2c3044] text-slate-300">
                [{formatTime(clip.start_time)} - {formatTime(clip.end_time)}]
              </span>
              <span>Thời lượng: <strong>{clip.duration}s</strong></span>
            </div>

            {/* Hook, Problem, Solution Analysis Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                  <span>Hook</span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">{clip.hook_grade || 'A+'}</span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  {clip.hook || "Câu mở đầu thu hút sự chú ý"}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
                <div className="flex items-center justify-between text-rose-400 font-bold text-[11px]">
                  <span>Problem</span>
                  <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.2 rounded font-mono">{clip.problem_grade || 'A'}</span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  {clip.problem || "Vấn đề / nỗi đau của người xem"}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                  <span>Solution</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">{clip.solution_grade || 'A+'}</span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                  {clip.solution || "Giải pháp / giá trị mang lại"}
                </p>
              </div>
            </div>

            {/* Transcript Snippet Box */}
            <div className="bg-[#0b0c12] p-4 rounded-2xl border border-[#212435] text-xs text-slate-200 leading-relaxed max-h-[30vh] overflow-y-auto">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span className="px-1 py-0.5 rounded bg-[#202334] text-slate-300">CC</span>
                <span>Lời thoại trong đoạn:</span>
              </div>
              <p>
                {clipWords.map((w, idx) => (
                  <span key={idx} className="mx-0.5 hover:text-yellow-400 transition-colors">
                    {w.word}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-[11px] text-slate-500 pt-2 border-t border-[#1f2233]">
            Clip đã được cắt trọn vẹn kết câu theo cấu trúc 3 Trụ Cột: Hook - Problem - Solution (Thời lượng: {clip.duration}s).
          </div>
        </div>

        {/* ── 4. Far Right Opus Action Toolbar (15%) ── */}
        <div className="w-48 bg-[#131520] border-l border-[#202334] p-3 flex flex-col justify-between select-none">
          {/* Action List Buttons */}
          <div className="space-y-1.5 relative">
            <button className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all">
              <Share2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Publish on Social</span>
            </button>

            <button className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export XML</span>
            </button>

            <button 
              onClick={handleDownload}
              className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download HD</span>
            </button>

            <button className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Upscale & download</span>
            </button>

            <div className="h-[1px] bg-[#222538] my-2" />

            {/* ⭐ FLAGSHIP BUTTON: EDIT CLIP */}
            <button
              onClick={() => {
                onClose();
                onGoToEditor(clip);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all active:scale-95"
            >
              <Scissors className="w-4 h-4" />
              <span>Edit clip (Chi tiết)</span>
            </button>

            {/* AI Tools dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAiToolsMenu(!showAiToolsMenu)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-glow" />
                  <span>AI tools</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showAiToolsMenu && (
                <div className="absolute right-0 top-10 w-44 bg-[#181a26] border border-[#2f334a] rounded-xl shadow-2xl p-1.5 space-y-1 z-30 animate-fade-in">
                  <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-[#25283b] text-left">
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add B-Roll</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-[#25283b] text-left">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enhance speech</span>
                  </button>
                  <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-200 hover:bg-[#25283b] text-left">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Voiceover hook</span>
                  </button>
                </div>
              )}
            </div>

            <button className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>9:16 Vertical</span>
            </button>

            <button className="w-full flex items-center gap-2 p-2 rounded-xl bg-[#1c1e2b] hover:bg-[#25283a] text-slate-200 text-xs font-semibold transition-all">
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
