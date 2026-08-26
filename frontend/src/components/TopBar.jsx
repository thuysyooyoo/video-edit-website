import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Crop, 
  ChevronDown, 
  Wand2, 
  ArrowLeft,
  Zap,
  Loader2,
  Cpu,
  Clock,
  Layout,
  Check,
  Save,
  Mic,
  Undo2,
  Redo2,
  Layers
} from 'lucide-react';

export default function TopBar({ 
  onSpeechCleanup, 
  speechEnhance = false,
  onToggleSpeechEnhance,
  onExtendClip, 
  aspectRatio, 
  setAspectRatio, 
  onExport, 
  onExportHd,
  onExportWysiwyg,
  onSaveProject,
  onOpenProjects,
  isExportingHd = false,
  videoTitle, 
  onBackToDashboard,
  onToggleCopilot,
  isCopilotOpen = false,
  selectedModel = 'gemini-3.7-flash',
  setSelectedModel,
  faceTrackerEnabled = true,
  setFaceTrackerEnabled,
  videoLayout = 'fill',
  setVideoLayout,
  clipDuration = 30,
  onExtendStart,
  onExtendEnd,
  onUndo,
  canUndo = false,
  onRedo,
  canRedo = false,
  onToggleLayersDrawer,
  isLayersDrawerOpen = false
}) {
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const extendRef = useRef(null);
  const layoutRef = useRef(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (extendRef.current && !extendRef.current.contains(event.target)) {
        setIsExtendOpen(false);
      }
      if (layoutRef.current && !layoutRef.current.contains(event.target)) {
        setIsLayoutOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const layoutOptions = [
    { id: 'fill', label: 'Fill (Toàn màn hình 9:16)', desc: 'Tự động phóng to lấp đầy khung dọc' },
    { id: 'fit', label: 'Fit (Khung vừa vặn)', desc: 'Giữ nguyên tỉ lệ gốc có viền mờ phía sau' },
    { id: 'split', label: 'Split Screen 50/50', desc: 'Chia đôi màn hình cho 2 người đối thoại' },
  ];

  return (
    <header className="h-14 bg-[#0e1017] border-b border-[#202334] px-3.5 flex items-center justify-between select-none z-30 font-sans shadow-md">
      {/* ── LEFT: Navigation & Core Tools ── */}
      <div className="flex items-center gap-2">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161824] hover:bg-[#202336] text-slate-300 hover:text-white border border-[#262a3d] text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Danh sách Clips</span>
          </button>
        )}

        {onOpenProjects && (
          <button
            onClick={onOpenProjects}
            title="Kho dự án video đã nạp"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#181a28] hover:bg-[#24283e] text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>📂 Kho Dự Án</span>
          </button>
        )}

        {/* ↩️ Undo / ↪️ Redo */}
        <div className="flex items-center bg-[#141622] border border-[#24283b] rounded-xl p-0.5 shadow-sm">
          <button
            disabled={!canUndo}
            onClick={onUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202438] disabled:opacity-25 disabled:hover:bg-transparent transition active:scale-90"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!canRedo}
            onClick={onRedo}
            title="Làm lại (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202438] disabled:opacity-25 disabled:hover:bg-transparent transition active:scale-90"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 📑 Bảng Quản Lý Lớp Canva */}
        {onToggleLayersDrawer && (
          <button
            onClick={onToggleLayersDrawer}
            title="Bật/Tắt Bảng Quản Lý Lớp Dọc"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isLayersDrawerOpen
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/30'
                : 'bg-[#161824] hover:bg-[#202336] text-slate-300 hover:text-white border-[#262a3d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quản Lý Lớp</span>
          </button>
        )}
      </div>

      {/* ── CENTER: Video Format & AI Tracker Bar ── */}
      <div className="hidden md:flex items-center gap-1 bg-[#131520] p-1 rounded-2xl border border-[#222638] shadow-inner text-xs">
        {/* Tỉ lệ khung hình */}
        <button 
          onClick={() => setAspectRatio(aspectRatio === '9:16' ? '16:9' : '9:16')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1e2133] hover:bg-[#282d44] text-white font-bold transition shadow-sm"
          title="Đổi tỉ lệ khung hình 9:16 (Dọc) hoặc 16:9 (Ngang)"
        >
          <span className="w-2 h-3 border border-white rounded-xs inline-block" />
          <span>{aspectRatio}</span>
        </button>

        {/* Layout Mode Dropdown */}
        <div className="relative" ref={layoutRef}>
          <button 
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#1c1f30] font-semibold transition"
          >
            <Crop className="w-3 h-3 text-slate-400" />
            <span>Layout: <strong className="capitalize text-indigo-300">{videoLayout}</strong></span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isLayoutOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-[#141622] border border-[#2d3248] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
              {layoutOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setVideoLayout && setVideoLayout(opt.id);
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between ${
                    videoLayout === opt.id ? 'bg-indigo-600/30 border border-indigo-500/40 text-white' : 'hover:bg-[#1f2233] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {videoLayout === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ⏱️ Extend Clip (+5s Trước / +5s Sau) */}
        {(onExtendStart || onExtendEnd) && (
          <div className="relative" ref={extendRef}>
            <button 
              onClick={() => setIsExtendOpen(!isExtendOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#1c1f30] font-semibold transition"
              title="Mở rộng thêm thời lượng đoạn clip"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Extend Clip</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExtendOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#141622] border border-[#2d3248] rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-fade-in">
                <button
                  onClick={() => {
                    onExtendStart && onExtendStart(5);
                    setIsExtendOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs hover:bg-[#202438] text-slate-200 hover:text-white flex items-center justify-between transition"
                >
                  <span className="font-semibold">⏮️ Thêm 5s ở đầu</span>
                  <span className="text-[10px] text-amber-400 font-mono">+5s Start</span>
                </button>
                <button
                  onClick={() => {
                    onExtendEnd && onExtendEnd(5);
                    setIsExtendOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-left text-xs hover:bg-[#202438] text-slate-200 hover:text-white flex items-center justify-between transition"
                >
                  <span className="font-semibold">⏭️ Thêm 5s ở cuối</span>
                  <span className="text-[10px] text-emerald-400 font-mono">+5s End</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Face Tracker */}
        <button 
          onClick={() => setFaceTrackerEnabled && setFaceTrackerEnabled(!faceTrackerEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold transition ${
            faceTrackerEnabled ? 'text-emerald-300 bg-emerald-950/50 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
          }`}
          title="Tự động bám theo khuôn mặt nhân vật chính"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${faceTrackerEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span>Face Tracker</span>
        </button>

        {/* Speech Enhancement */}
        <button
          onClick={() => {
            onToggleSpeechEnhance ? onToggleSpeechEnhance() : onSpeechCleanup && onSpeechCleanup();
          }}
          title="Khử ồn & làm rõ giọng nói AI"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold transition ${
            speechEnhance ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className={`w-3 h-3 ${speechEnhance ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span>Lọc Giọng AI</span>
        </button>
      </div>

      {/* ── RIGHT: AI Copilot, Save Draft & Export Button ── */}
      <div className="flex items-center gap-2">
        {/* AI Copilot Pill */}
        <div className="flex items-center bg-[#141622] border border-[#282c42] rounded-xl p-0.5 shadow-sm">
          <button
            onClick={onToggleCopilot}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              isCopilotOpen
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-indigo-300 hover:text-white hover:bg-[#202336]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Copilot</span>
          </button>

          <div className="h-3 w-[1px] bg-[#2a2e42] mx-0.5" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
            className="bg-transparent text-slate-300 text-[10px] font-bold px-1.5 py-1 focus:outline-none cursor-pointer hover:text-white"
          >
            <option value="gemini-2.5-flash" className="bg-[#12131e] text-white">Gemini 2.5 Flash</option>
            <option value="gemini-3.5-flash-lite" className="bg-[#12131e] text-white">Gemini 3.5 Flash Lite</option>
            <option value="gemini-3.5-flash" className="bg-[#12131e] text-white">Gemini 3.5 Flash</option>
            <option value="gemini-3.7-flash" className="bg-[#12131e] text-white">Gemini 3.7 Flash</option>
            <option value="gemini-flash-latest" className="bg-[#12131e] text-white">Gemini Flash Latest</option>
          </select>
        </div>

        {/* Lưu Tạm */}
        {onSaveProject && (
          <button
            onClick={onSaveProject}
            title="Lưu tạm thời toàn bộ thiết lập video"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#161824] hover:bg-[#22263a] text-slate-200 hover:text-white border border-[#272b3e] text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Lưu Tạm</span>
          </button>
        )}

        {/* 🎬 NÚT XUẤT VIDEO WYSIWYG CHÍNH (Nổi bật, đỉnh cao) */}
        {onExportWysiwyg ? (
          <div className="relative flex items-center" ref={exportMenuRef}>
            <button
              onClick={onExportWysiwyg}
              title="Xuất Video MP4 WYSIWYG khớp 100% Canvas xem trước"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-l-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 ring-1 ring-amber-300/40"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-200 animate-pulse" />
              <span>Xuất Video WYSIWYG</span>
            </button>

            {/* Menu mở rộng các tùy chọn xuất khác */}
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-2 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-r-xl border-l border-white/20 text-xs font-bold shadow-md transition"
              title="Tùy chọn xuất khác"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#141622] border border-[#2d3248] rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in text-xs">
                <button
                  onClick={() => {
                    onExport();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-[#202438] text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <div className="font-bold">Xuất Cắt Nhanh (FFmpeg)</div>
                    <div className="text-[10px] text-slate-400">Chỉ cắt video theo transcript</div>
                  </div>
                </button>

                <button
                  disabled={isExportingHd}
                  onClick={() => {
                    onExportHd();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full p-2 rounded-xl text-left hover:bg-[#202438] text-slate-200 hover:text-white flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="font-bold">Render Backend 1080p</div>
                    <div className="text-[10px] text-slate-400">Xuất qua server xử lý nền</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Video</span>
          </button>
        )}
      </div>
    </header>
  );
}
