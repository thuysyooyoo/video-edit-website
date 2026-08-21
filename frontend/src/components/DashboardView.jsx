import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Zap, 
  Plus, 
  LayoutGrid, 
  List, 
  Filter, 
  Download, 
  SlidersHorizontal, 
  Share2, 
  Scissors, 
  Sparkles,
  HelpCircle,
  Clock,
  Play
} from 'lucide-react';

export default function DashboardView({
  videoTitle = "Training nội bộ",
  clips = [],
  onSelectClip,
  onOpenUpload,
  onGoToEditor
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [disableHeadline, setDisableHeadline] = useState(false);

  const filteredClips = clips.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.summary && c.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `00:00 ${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090a0f] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* ── Top Dashboard Header Bar ── */}
      <header className="h-14 bg-[#0d0e15] border-b border-[#1f2233] px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Video Title */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center text-xs font-bold">
            ▶
          </div>
          <span className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md">
            {videoTitle}
          </span>
        </div>

        {/* Center: Search input */}
        <div className="relative w-80 hidden md:block">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find keywords or moments..."
            className="w-full bg-[#161824] border border-[#272b3d] rounded-xl pl-9 pr-12 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-medium"
          />
          <span className="absolute right-3 top-2 px-1.5 py-0.2 rounded bg-[#222536] text-[10px] font-mono text-slate-400 border border-[#2e334a]">
            ⌘ K
          </span>
        </div>

        {/* Right: Credits, Notifications, Upload button */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-[#181a26] text-slate-400 hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              4
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161824] border border-[#272a3c] text-xs font-bold text-yellow-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>AI Online</span>
          </div>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/25 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Video</span>
          </button>
        </div>
      </header>

      {/* ── Secondary Toolbar & Headline Banner ── */}
      <div className="px-6 py-3 border-b border-[#1b1d2c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: View tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#131520] p-1 rounded-xl border border-[#222536]">
            <button className="p-1.5 rounded-lg bg-[#222538] text-white">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-slate-500 hover:text-white">
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="font-bold text-sm text-white">Original clips ({filteredClips.length})</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141622] hover:bg-[#1e2030] text-slate-300 border border-[#24273a] font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141622] hover:bg-[#1e2030] text-slate-300 border border-[#24273a] font-medium">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="px-6 py-2.5 bg-[#0f111a] border-b border-[#191c2b] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>
            A headline has been added to the first 5 seconds of your top ranked videos. If you'd like to refine it further, click <strong>"Edit Clip"</strong>.
          </span>
        </div>
        <button 
          onClick={() => setDisableHeadline(!disableHeadline)}
          className="text-slate-400 hover:text-white underline text-[11px] shrink-0 ml-2"
        >
          {disableHeadline ? 'Enable headline' : 'Disable it'}
        </button>
      </div>

      {/* ── Clips Grid View (Screenshot 1 Layout) ── */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {filteredClips.map((clip, index) => {
            const score = clip.hook_score || (95 - index * 3);
            const scoreColor = score >= 90 ? 'text-emerald-400' : score >= 80 ? 'text-yellow-400' : 'text-slate-300';

            return (
              <div key={clip.id} className="flex flex-col group select-none">
                {/* 9:16 Vertical Video Card */}
                <div 
                  onClick={() => onSelectClip(clip)}
                  className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-[#24273a] group-hover:border-brand-500/80 group-hover:shadow-xl group-hover:shadow-brand-500/10 transition-all cursor-pointer flex items-center justify-center"
                >
                  {/* Background Video Poster Preview */}
                  <video
                    src="http://127.0.0.1:8000/api/stream/source"
                    className="w-full h-full object-cover pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity"
                    muted
                  />

                  {/* Top Duration Pill */}
                  <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    {formatDuration(clip.duration)}
                  </div>

                  {/* Top Headline Banner on Video */}
                  {!disableHeadline && (
                    <div className="absolute top-8 left-2 right-2 text-center pointer-events-none">
                      <div className="bg-white/95 text-black font-black text-[10px] px-2 py-1 rounded shadow-md inline-block max-w-[95%] uppercase leading-tight line-clamp-2">
                        {clip.title}
                      </div>
                    </div>
                  )}

                  {/* Subtitle Karaoke on Video */}
                  <div className="absolute bottom-6 left-2 right-2 text-center pointer-events-none">
                    <p className="text-[12px] font-black uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      <span className="text-yellow-400">VÀ ĐƯỢC XÁC</span>
                    </p>
                  </div>

                  {/* Center Play Button on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Below Card: Score, 4 Virality Metrics, and Title */}
                <div className="mt-2.5 space-y-1.5">
                  {/* Score & Actions Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg font-black ${scoreColor}`}>
                        {clip.overall_score || score}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {clip.hook_grade || 'A+'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 text-slate-400">
                      <button 
                        title="Tải video HD"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`http://127.0.0.1:8000/api/stream/clip/${clip.id}`, '_blank');
                        }}
                        className="p-1 rounded hover:bg-[#1a1d2c] hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        title="Mở trình chỉnh sửa chi tiết (Edit Clip)"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoToEditor(clip);
                        }}
                        className="p-1 rounded hover:bg-[#1a1d2c] hover:text-brand-glow text-slate-300 transition-colors"
                      >
                        <Scissors className="w-3.5 h-3.5 text-brand-glow" />
                      </button>
                    </div>
                  </div>

                  {/* 4-Axis Virality Metrics (SupoClip Style) */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400 bg-[#141624] p-1.5 rounded-lg border border-[#202438]">
                    <div title="Điểm Hook mở đầu">
                      <span className="text-slate-500 block text-[8px]">HOOK</span>
                      <strong className="text-amber-300">{clip.hook_score || 92}</strong>
                    </div>
                    <div title="Điểm tương tác / giữ chân">
                      <span className="text-slate-500 block text-[8px]">ENGAGE</span>
                      <strong className="text-emerald-300">{clip.engagement_score || 90}</strong>
                    </div>
                    <div title="Điểm giá trị giải pháp">
                      <span className="text-slate-500 block text-[8px]">VALUE</span>
                      <strong className="text-cyan-300">{clip.value_score || 94}</strong>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 
                    onClick={() => onSelectClip(clip)}
                    className="font-bold text-xs text-slate-200 line-clamp-2 leading-snug hover:text-brand-glow cursor-pointer transition-colors"
                  >
                    {clip.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Questions button bottom-right like Opus Clip */}
      <div className="fixed bottom-4 right-6 z-30">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181a26] border border-[#2d3247] text-slate-300 hover:text-white text-xs font-semibold shadow-xl transition-all">
          <HelpCircle className="w-3.5 h-3.5 text-brand-glow" />
          <span>Questions?</span>
        </button>
      </div>
    </div>
  );
}
