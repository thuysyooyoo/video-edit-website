import React, { useState, useRef, useEffect } from 'react';
import BrollEditModal from './BrollEditModal';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Search, 
  Plus, 
  X,
  Zap,
  Sparkles,
  Settings
} from 'lucide-react';

function OpusTimeline({
  clip,
  currentTime,
  onSeek,
  isPlaying,
  onTogglePlay,
  totalDuration = 142.17,
  titleConfig,
  onUpdateTitleConfig,
  customTitle,
  brolls = [],
  soundFxMarkers = [],
  textLayers = [],
  animatedStickers = [],
  skipIntervals = [],
  onSplitAtPlayhead,
  onDeleteSelectedLayer,
  onAddMediaTrack,
  onOpenAudioTab,
  onOpenTransitionsTab,
  onUpdateSoundFxTime,
  onDeleteSoundFx,
  onDeleteBroll,
  onUpdateBroll,
  onDeleteScene,
  onDeleteAnimatedSticker,
  onUpdateAnimatedSticker,
  onUpdateTextLayer,
  onDeleteTextLayer,
  selectedTextLayerId,
  onSelectTextLayer,
  customHeight = null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Selection states
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [selectedBrollId, setSelectedBrollId] = useState(null);
  const [editingBroll, setEditingBroll] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState(false);
  const [selectedAnimatedStickerId, setSelectedAnimatedStickerId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [titleDraggingMode, setTitleDraggingMode] = useState(null); // 'move' | 'resize_left' | 'resize_right'
  const [titleDragState, setTitleDragState] = useState(null);
  const [stickerDraggingMode, setStickerDraggingMode] = useState(null); // 'move' | 'resize_left' | 'resize_right'
  const [stickerDragState, setStickerDragState] = useState(null);
  const [textLayerDraggingMode, setTextLayerDraggingMode] = useState(null); // 'move' | 'resize_left' | 'resize_right'
  const [textLayerDragState, setTextLayerDragState] = useState(null);
  const [brollDraggingMode, setBrollDraggingMode] = useState(null); // 'move' | 'resize_left' | 'resize_right'
  const [brollDragState, setBrollDragState] = useState(null);

  const volumeRef = useRef(null);
  const containerTrackRef = useRef(null);

  const handleTitleMouseDown = (e, mode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedTitle(true);
    setTitleDraggingMode(mode);
    setTitleDragState({
      startMouseX: e.clientX,
      initialStartTime: titleConfig?.startTime ?? 0,
      initialDuration: titleConfig?.duration ?? 6
    });
  };

  const handleStickerMouseDown = (e, stk, mode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnimatedStickerId(stk.id);
    setStickerDraggingMode(mode);
    setStickerDragState({
      id: stk.id,
      startMouseX: e.clientX,
      initialStartTime: stk.startTime ?? 0,
      initialDuration: stk.duration ?? 4
    });
  };

  const handleTextLayerMouseDown = (e, textObj, mode) => {
    e.stopPropagation();
    e.preventDefault();
    if (onSelectTextLayer) onSelectTextLayer(textObj.id);
    setTextLayerDraggingMode(mode);
    setTextLayerDragState({
      id: textObj.id,
      startMouseX: e.clientX,
      initialStartTime: textObj.startTime ?? 0,
      initialDuration: textObj.duration ?? 5
    });
  };

  const handleBrollMouseDown = (e, broll, mode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedBrollId(broll.id);
    setBrollDraggingMode(mode);
    setBrollDragState({
      id: broll.id,
      startMouseX: e.clientX,
      initialStart: broll.start ?? 0,
      initialDuration: broll.duration ?? 4
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setIsVolumeOpen(false);
      }
      if (event.target.closest('.sound-fx-marker') === null) {
        setSelectedMarkerId(null);
      }
      if (event.target.closest('.broll-track-block') === null) {
        setSelectedBrollId(null);
      }
      if (event.target.closest('.title-track-block') === null) {
        setSelectedTitle(false);
      }
      if (event.target.closest('.animated-sticker-track-block') === null) {
        setSelectedAnimatedStickerId(null);
      }
      if (event.target.closest('.text-layer-track-block') === null) {
        if (onSelectTextLayer) onSelectTextLayer(null);
      }
      if (event.target.closest('.scene-track-block') === null && event.target.closest('.transition-badge-btn') === null) {
        setSelectedSceneId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clipStart = clip?.start_time || 0;
  const clipEnd = clip?.end_time || 60;
  const rawClipDuration = clip?.duration || Math.max(1, clipEnd - clipStart);

  // Tính tổng thời lượng các đoạn đã bị cắt bỏ (từ thừa, khoảng lặng)
  const totalDeletedSecs = (skipIntervals || []).reduce((sum, s) => sum + (s.end - s.start), 0);
  const effectiveClipDuration = Math.max(1.0, rawClipDuration - totalDeletedSecs);
  const clipDuration = rawClipDuration;

  // Default scenes list if not yet split
  const scenes = clip?.scenes && clip.scenes.length > 0 ? clip.scenes : [
    { id: `${clip?.id || 'clip'}_sc0`, title: clip?.title || 'Phân cảnh chính', start_time: clipStart, end_time: clipEnd, transition: null }
  ];

  // Tính toán thời lượng phát thực tế sau khi trừ đi các khoảng đã bị cắt
  const playedDuration = (() => {
    const rawElapsed = Math.max(0, Math.min(rawClipDuration, currentTime - clipStart));
    const deletedBefore = (skipIntervals || [])
      .filter(s => s.end <= currentTime)
      .reduce((sum, s) => sum + (s.end - s.start), 0);
    const activeSkip = (skipIntervals || []).find(s => currentTime >= s.start && currentTime < s.end);
    const inSkip = activeSkip ? (currentTime - activeSkip.start) : 0;
    return Math.max(0, Math.min(effectiveClipDuration, rawElapsed - deletedBefore - inSkip));
  })();

  // Global mouse handlers for Drag and Drop on Sound FX, Title, & Animated Stickers Timeline Markers
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      // 1. Sound FX Marker Dragging
      if (draggingId && containerTrackRef.current) {
        const rect = containerTrackRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        const newRelTime = ratio * clipDuration;
        if (onUpdateSoundFxTime) {
          onUpdateSoundFxTime(draggingId, newRelTime);
        }
      }

      // 2. Title Block Dragging & Resizing
      if (titleDraggingMode && titleDragState && containerTrackRef.current && onUpdateTitleConfig) {
        const rect = containerTrackRef.current.getBoundingClientRect();
        const deltaSeconds = ((e.clientX - titleDragState.startMouseX) / rect.width) * clipDuration;

        if (titleDraggingMode === 'move') {
          const newStart = Math.max(0, Math.min(clipDuration - 0.8, titleDragState.initialStartTime + deltaSeconds));
          onUpdateTitleConfig(prev => ({
            ...prev,
            startTime: Math.round(newStart * 10) / 10
          }));
        } else if (titleDraggingMode === 'resize_right') {
          const newDur = Math.max(0.8, Math.min(clipDuration - (titleConfig?.startTime ?? 0), titleDragState.initialDuration + deltaSeconds));
          onUpdateTitleConfig(prev => ({
            ...prev,
            duration: Math.round(newDur * 10) / 10
          }));
        } else if (titleDraggingMode === 'resize_left') {
          const newStart = Math.max(0, Math.min(titleDragState.initialStartTime + titleDragState.initialDuration - 0.8, titleDragState.initialStartTime + deltaSeconds));
          const newDur = Math.max(0.8, (titleDragState.initialStartTime + titleDragState.initialDuration) - newStart);
          onUpdateTitleConfig(prev => ({
            ...prev,
            startTime: Math.round(newStart * 10) / 10,
            duration: Math.round(newDur * 10) / 10
          }));
        }
      }

      // 3. Animated Sticker Dragging & Resizing
      if (stickerDraggingMode && stickerDragState && containerTrackRef.current && onUpdateAnimatedSticker) {
        const rect = containerTrackRef.current.getBoundingClientRect();
        const deltaSeconds = ((e.clientX - stickerDragState.startMouseX) / rect.width) * clipDuration;

        if (stickerDraggingMode === 'move') {
          const newStart = Math.max(0, Math.min(clipDuration - 0.5, stickerDragState.initialStartTime + deltaSeconds));
          onUpdateAnimatedSticker(stickerDragState.id, {
            startTime: Math.round(newStart * 10) / 10
          });
        } else if (stickerDraggingMode === 'resize_right') {
          const newDur = Math.max(0.5, Math.min(clipDuration - (stickerDragState.initialStartTime || 0), stickerDragState.initialDuration + deltaSeconds));
          onUpdateAnimatedSticker(stickerDragState.id, {
            duration: Math.round(newDur * 10) / 10
          });
        } else if (stickerDraggingMode === 'resize_left') {
          const totalEnd = stickerDragState.initialStartTime + stickerDragState.initialDuration;
          const newStart = Math.max(0, Math.min(totalEnd - 0.5, stickerDragState.initialStartTime + deltaSeconds));
          const newDur = Math.max(0.5, totalEnd - newStart);
          onUpdateAnimatedSticker(stickerDragState.id, {
            startTime: Math.round(newStart * 10) / 10,
            duration: Math.round(newDur * 10) / 10
          });
        }
      }

      // 4. Text Layer Dragging & Resizing
      if (textLayerDraggingMode && textLayerDragState && containerTrackRef.current && onUpdateTextLayer) {
        const rect = containerTrackRef.current.getBoundingClientRect();
        const deltaSeconds = ((e.clientX - textLayerDragState.startMouseX) / rect.width) * clipDuration;

        if (textLayerDraggingMode === 'move') {
          const newStart = Math.max(0, Math.min(clipDuration - 0.5, textLayerDragState.initialStartTime + deltaSeconds));
          onUpdateTextLayer(textLayerDragState.id, {
            startTime: Math.round(newStart * 10) / 10
          });
        } else if (textLayerDraggingMode === 'resize_right') {
          const newDur = Math.max(0.5, Math.min(clipDuration - (textLayerDragState.initialStartTime || 0), textLayerDragState.initialDuration + deltaSeconds));
          onUpdateTextLayer(textLayerDragState.id, {
            duration: Math.round(newDur * 10) / 10
          });
        } else if (textLayerDraggingMode === 'resize_left') {
          const totalEnd = textLayerDragState.initialStartTime + textLayerDragState.initialDuration;
          const newStart = Math.max(0, Math.min(totalEnd - 0.5, textLayerDragState.initialStartTime + deltaSeconds));
          const newDur = Math.max(0.5, totalEnd - newStart);
          onUpdateTextLayer(textLayerDragState.id, {
            startTime: Math.round(newStart * 10) / 10,
            duration: Math.round(newDur * 10) / 10
          });
        }
      }

      // 5. B-Roll Dragging & Resizing (Kéo dời mốc & kéo đè lên nhau tùy ý trên Timeline)
      if (brollDraggingMode && brollDragState && containerTrackRef.current && onUpdateBroll) {
        const rect = containerTrackRef.current.getBoundingClientRect();
        const deltaSeconds = ((e.clientX - brollDragState.startMouseX) / rect.width) * clipDuration;

        if (brollDraggingMode === 'move') {
          const newStart = Math.max(0, Math.min(clipDuration - 0.5, brollDragState.initialStart + deltaSeconds));
          onUpdateBroll(brollDragState.id, {
            start: Math.round(newStart * 10) / 10
          });
        } else if (brollDraggingMode === 'resize_right') {
          const newDur = Math.max(0.5, Math.min(clipDuration - (brollDragState.initialStart || 0), brollDragState.initialDuration + deltaSeconds));
          onUpdateBroll(brollDragState.id, {
            duration: Math.round(newDur * 10) / 10
          });
        } else if (brollDraggingMode === 'resize_left') {
          const totalEnd = brollDragState.initialStart + brollDragState.initialDuration;
          const newStart = Math.max(0, Math.min(totalEnd - 0.5, brollDragState.initialStart + deltaSeconds));
          const newDur = Math.max(0.5, totalEnd - newStart);
          onUpdateBroll(brollDragState.id, {
            start: Math.round(newStart * 10) / 10,
            duration: Math.round(newDur * 10) / 10
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggingId) {
        setDraggingId(null);
      }
      if (titleDraggingMode) {
        setTitleDraggingMode(null);
        setTitleDragState(null);
      }
      if (stickerDraggingMode) {
        setStickerDraggingMode(null);
        setStickerDragState(null);
      }
      if (textLayerDraggingMode) {
        setTextLayerDraggingMode(null);
        setTextLayerDragState(null);
      }
      if (brollDraggingMode) {
        setBrollDraggingMode(null);
        setBrollDragState(null);
      }
    };

    if (draggingId || titleDraggingMode || stickerDraggingMode || textLayerDraggingMode || brollDraggingMode) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingId, titleDraggingMode, titleDragState, stickerDraggingMode, stickerDragState, textLayerDraggingMode, textLayerDragState, brollDraggingMode, brollDragState, clipDuration, onUpdateSoundFxTime, onUpdateTitleConfig, onUpdateAnimatedSticker, onUpdateTextLayer, onUpdateBroll, titleConfig]);

  const handleMarkerMouseDown = (e, markerId) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(markerId);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, ((currentTime - clipStart) / clipDuration) * 100));

  const handleDeleteActiveSelection = () => {
    if (selectedSceneId && scenes.length > 1 && onDeleteScene) {
      onDeleteScene(selectedSceneId);
      setSelectedSceneId(null);
    } else if (selectedBrollId && onDeleteBroll) {
      onDeleteBroll(selectedBrollId);
      setSelectedBrollId(null);
    } else if (selectedMarkerId && onDeleteSoundFx) {
      onDeleteSoundFx(selectedMarkerId);
      setSelectedMarkerId(null);
    } else if (onDeleteSelectedLayer) {
      onDeleteSelectedLayer();
    }
  };

  const getTransitionLabel = (type) => {
    if (!type || type === 'none') return 'Chuyển Cảnh';
    if (type === 'zoom_in') return 'Zoom In';
    if (type === 'flash_white') return 'Flash White';
    if (type === 'glitch') return 'Glitch';
    if (type === 'fade_black') return 'Fade Black';
    if (type === 'blur') return 'Blur';
    return type;
  };

  return (
    <div 
      style={customHeight && !isCollapsed ? { height: `${customHeight}px` } : {}}
      className={`${isCollapsed ? 'h-14' : (customHeight ? '' : 'h-44')} bg-[#090a0f] border-t border-[#1c1f2e] flex flex-col justify-between p-2 select-none font-sans transition-all duration-100 relative shrink-0`}
    >
      {/* ── Top Controls Bar ── */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <span className="w-4 h-4 rounded-md border border-slate-500 flex items-center justify-center text-[9px] font-bold">
              {isCollapsed ? '+' : '-'}
            </span>
            <span className="font-semibold text-slate-200">{isCollapsed ? 'Hiện Timeline' : 'Thu Gọn Timeline'}</span>
          </button>

          <div className="h-3.5 w-[1px] bg-[#242738] mx-0.5" />

          {/* Split at Playhead */}
          <button 
            onClick={onSplitAtPlayhead}
            title="Cắt đôi phân cảnh tại con trỏ phát (Split) để chèn Transitions chuyển cảnh" 
            className="px-2 py-1 rounded-lg bg-[#181a27] hover:bg-indigo-600 border border-[#2b2f44] text-slate-200 hover:text-white flex items-center gap-1.5 font-bold transition-all shadow-sm active:scale-95"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Cắt Phân Cảnh (Split)</span>
          </button>

          {/* Delete Selection */}
          <button 
            onClick={handleDeleteActiveSelection}
            title="Xóa đoạn phân cảnh, B-roll hoặc âm thanh đang được chọn" 
            className={`p-1.5 rounded-lg border transition-colors ${
              selectedSceneId || selectedBrollId || selectedMarkerId
                ? 'bg-rose-950/70 border-rose-500 text-rose-300 hover:bg-rose-600 hover:text-white ring-1 ring-rose-500 animate-pulse'
                : 'bg-[#141624] border-[#24273a] text-slate-400 hover:text-rose-400'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Volume control */}
          <div className="relative" ref={volumeRef}>
            <button 
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
              className="p-1 rounded-lg hover:bg-[#1c1e2b] text-slate-300 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {isVolumeOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#141622] border border-[#2d3248] rounded-xl shadow-2xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Âm lượng</span>
                  <span className="font-mono text-indigo-400">{isMuted ? '0%' : `${volume}%`}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="150"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none accent-indigo-500 cursor-pointer"
                />

                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1 border-t border-[#222638]">
                  <input
                    type="checkbox"
                    checked={isMuted}
                    onChange={(e) => setIsMuted(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Tắt tiếng (Mute)</span>
                </label>
              </div>
            )}
          </div>

          <button 
            onClick={onOpenAudioTab}
            className="p-1.5 rounded-lg bg-[#1e2130] text-slate-200 border border-[#2c3044] hover:text-white hover:bg-[#282d42] transition-colors"
            title="Mở bảng Mixer Audio"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Play Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onSeek(clipStart)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-md"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button 
            onClick={() => onSeek(clipEnd)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-bold text-white tracking-wide ml-1 flex items-center gap-1.5">
            <span>{formatTime(playedDuration)}</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-emerald-300">{formatTime(effectiveClipDuration)}</span>
            {totalDeletedSecs > 0.5 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-600/50 text-[9px] font-mono text-rose-300 font-bold" title={`Đã cắt sạch ${totalDeletedSecs.toFixed(1)}s đoạn thừa khỏi video`}>
                ✂ -{totalDeletedSecs.toFixed(1)}s
              </span>
            )}
          </span>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 h-1 bg-[#232738] rounded-lg appearance-none accent-white cursor-pointer"
          />
        </div>
      </div>

      {/* ── Multi-Track Timeline Container ── */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onAddMediaTrack}
            className="w-8 h-28 rounded-xl bg-[#131520] hover:bg-[#1e2030] border border-[#24273a] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Thêm B-Roll hoặc Phương tiện"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div 
            ref={containerTrackRef}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(clipStart + ratio * clipDuration);
            }}
            className="flex-1 h-28 bg-[#10121a] rounded-xl border border-[#232638] relative overflow-hidden flex flex-col cursor-pointer"
          >
            {/* ── TRACK 1: Overlays, B-Rolls & Sound FX ── */}
            <div className="h-8 border-b border-[#1c1f2e] bg-[#0c0e15] relative overflow-hidden">
              {/* Sound FX Markers */}
              {soundFxMarkers.map((s) => {
                const percent = Math.max(0, Math.min(98, (s.time / clipDuration) * 100));
                const isSelected = selectedMarkerId === s.id;
                return (
                  <div
                    key={s.id || `s_${s.time}`}
                    style={{ left: `${percent}%` }}
                    onMouseDown={(e) => handleMarkerMouseDown(e, s.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarkerId(s.id);
                    }}
                    title={`Âm thanh: ${s.name} (${s.time.toFixed(1)}s) - Giữ & kéo để dời vị trí`}
                    className={`sound-fx-marker absolute top-1 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-0.5 cursor-grab active:cursor-grabbing z-30 transition-shadow ${
                      isSelected
                        ? 'bg-rose-500 text-white ring-2 ring-white shadow-lg'
                        : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md'
                    }`}
                  >
                    <span>🔔</span>
                    <span className="truncate max-w-[50px]">{s.name}</span>

                    {isSelected && (
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteSoundFx) onDeleteSoundFx(s.id);
                          setSelectedMarkerId(null);
                        }}
                        className="ml-1 w-3 h-3 rounded-full bg-white text-rose-600 text-[8px] font-black flex items-center justify-center hover:bg-rose-100 transition-colors"
                      >
                        x
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Animated Sticker Overlay Track Blocks */}
              {animatedStickers.map((stk) => {
                const sStart = stk.startTime ?? 0;
                const sDur = stk.duration ?? 4;
                const startPercent = Math.max(0, Math.min(95, (sStart / clipDuration) * 100));
                const widthPercent = Math.max(5, Math.min(100 - startPercent, (sDur / clipDuration) * 100));
                const isSelected = selectedAnimatedStickerId === stk.id;

                return (
                  <div
                    key={stk.id || `stk_${sStart}`}
                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => handleStickerMouseDown(e, stk, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnimatedStickerId(stk.id);
                    }}
                    title={`Animation Động: ${stk.type} (Bắt đầu: ${sStart.toFixed(1)}s, Dài: ${sDur.toFixed(1)}s) - Giữ để dời, kéo 2 mép để chỉnh thời lượng`}
                    className={`animated-sticker-track-block absolute top-1 h-6 rounded-md border text-white flex items-center justify-between px-1 text-[8px] font-bold shadow-md cursor-grab active:cursor-grabbing transition-all z-20 select-none ${
                      isSelected
                        ? 'border-yellow-300 bg-gradient-to-r from-amber-500 to-yellow-500 ring-2 ring-yellow-300 shadow-xl'
                        : 'border-yellow-400/80 bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:border-yellow-300'
                    }`}
                  >
                    {/* Left Resize Handle */}
                    <div
                      onMouseDown={(e) => handleStickerMouseDown(e, stk, 'resize_left')}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l transition-colors"
                      title="Kéo mép trái để đổi mốc bắt đầu"
                    />

                    <div className="flex items-center gap-1 truncate pointer-events-none pl-1">
                      <span>🌟</span>
                      <span className="truncate">{stk.type.replace('_', ' ')}</span>
                      <span className="text-[7px] opacity-80 font-mono">({sDur.toFixed(1)}s)</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteAnimatedSticker) onDeleteAnimatedSticker(stk.id);
                        }}
                        title="Xóa Animation này"
                        className="w-3.5 h-3.5 rounded-full bg-white/30 hover:bg-rose-600 text-white text-[7px] font-black flex items-center justify-center transition-colors shrink-0"
                      >
                        x
                      </button>
                    </div>

                    {/* Right Resize Handle */}
                    <div
                      onMouseDown={(e) => handleStickerMouseDown(e, stk, 'resize_right')}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r transition-colors"
                      title="Kéo mép phải để kéo dài / thu ngắn thời lượng"
                    />
                  </div>
                );
              })}

              {/* Text Layers Track Blocks (Lớp chữ kéo thả & chỉnh thời gian) */}
              {textLayers.map((tl, idx) => {
                const textObj = typeof tl === 'string' ? { id: `tl_${idx}`, text: tl } : tl;
                const tStart = textObj.startTime ?? 0;
                const tDur = textObj.duration ?? 5.0;
                const startPercent = Math.max(0, Math.min(96, (tStart / clipDuration) * 100));
                const widthPercent = Math.max(5, Math.min(100 - startPercent, (tDur / clipDuration) * 100));
                const isSelected = selectedTextLayerId === textObj.id;

                return (
                  <div
                    key={textObj.id || `text_${idx}`}
                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => handleTextLayerMouseDown(e, textObj, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectTextLayer) onSelectTextLayer(textObj.id);
                    }}
                    title={`Lớp Chữ: "${textObj.text}" (Bắt đầu: ${tStart.toFixed(1)}s, Dài: ${tDur.toFixed(1)}s) - Giữ để dời, kéo 2 mép để chỉnh thời lượng`}
                    className={`text-layer-track-block absolute top-1 h-6 rounded-md border text-white flex items-center justify-between px-1 text-[8px] font-bold shadow-md cursor-grab active:cursor-grabbing transition-all z-20 select-none ${
                      isSelected
                        ? 'border-indigo-300 bg-gradient-to-r from-indigo-600 to-purple-600 ring-2 ring-indigo-300 shadow-xl'
                        : 'border-indigo-400/80 bg-gradient-to-r from-indigo-700/90 to-purple-800/90 hover:border-indigo-300'
                    }`}
                  >
                    {/* Left Resize Handle */}
                    <div
                      onMouseDown={(e) => handleTextLayerMouseDown(e, textObj, 'resize_left')}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l transition-colors"
                      title="Kéo mép trái để đổi mốc bắt đầu"
                    />

                    <div className="flex items-center gap-1 truncate pointer-events-none pl-1">
                      <span>✍️</span>
                      <span className="truncate max-w-[90px]">{textObj.text}</span>
                      <span className="text-[7px] opacity-80 font-mono">({tDur.toFixed(1)}s)</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteTextLayer) onDeleteTextLayer(textObj.id || idx);
                        }}
                        title="Xóa lớp chữ này"
                        className="w-3.5 h-3.5 rounded-full bg-white/30 hover:bg-rose-600 text-white text-[7px] font-black flex items-center justify-center transition-colors shrink-0"
                      >
                        x
                      </button>
                    </div>

                    {/* Right Resize Handle */}
                    <div
                      onMouseDown={(e) => handleTextLayerMouseDown(e, textObj, 'resize_right')}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r transition-colors"
                      title="Kéo mép phải để kéo dài / thu ngắn thời lượng"
                    />
                  </div>
                );
              })}

              {/* B-Roll Track Blocks (Kéo dời vị trí, kéo đè lên nhau & kéo 2 mép chỉnh thời lượng) */}
              {brolls.map((b) => {
                const startPercent = Math.max(0, Math.min(95, (b.start / clipDuration) * 100));
                const widthPercent = Math.max(6, Math.min(100 - startPercent, (b.duration / clipDuration) * 100));
                const isSelected = selectedBrollId === b.id;

                return (
                  <div
                    key={b.id || `b_${b.start}`}
                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                    onMouseDown={(e) => handleBrollMouseDown(e, b, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBrollId(b.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingBroll(b);
                    }}
                    title={`B-Roll: ${b.title} (${b.duration?.toFixed(1)}s) - Giữ để dời mốc & kéo đè vị trí, kéo 2 mép để chỉnh thời lượng, nhấp đúp để sửa`}
                    className={`broll-track-block absolute top-1 h-6 rounded-md border flex items-center justify-between px-1 text-[8px] font-bold shadow-md cursor-grab active:cursor-grabbing transition-all select-none ${
                      isSelected
                        ? 'bg-amber-600 text-white border-white ring-2 ring-amber-400 z-30 shadow-lg'
                        : 'bg-amber-600/80 hover:bg-amber-600 text-white border-amber-400'
                    }`}
                  >
                    {/* Left Resize Handle */}
                    <div
                      onMouseDown={(e) => handleBrollMouseDown(e, b, 'resize_left')}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l transition-colors"
                      title="Kéo mép trái để đổi mốc bắt đầu"
                    />

                    <div className="flex items-center gap-1 truncate pointer-events-none pl-1">
                      <span>{b.thumb || '🎬'}</span>
                      <span className="truncate max-w-[80px]">{b.title}</span>
                      <span className="text-[7px] opacity-80 font-mono">({b.duration?.toFixed(1)}s)</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBroll(b);
                          }}
                          title="Sửa phong cách, hiệu ứng vào và thời lượng"
                          className="w-3.5 h-3.5 rounded bg-black/40 hover:bg-black/80 text-white flex items-center justify-center text-[8px]"
                        >
                          <Settings className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {isSelected && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteBroll) onDeleteBroll(b.id);
                            setSelectedBrollId(null);
                          }}
                          title="Xóa B-Roll này"
                          className="w-3 h-3 rounded-full bg-white text-amber-800 text-[8px] font-black flex items-center justify-center hover:bg-amber-100 transition-colors shrink-0"
                        >
                          x
                        </button>
                      )}
                    </div>

                    {/* Right Resize Handle */}
                    <div
                      onMouseDown={(e) => handleBrollMouseDown(e, b, 'resize_right')}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r transition-colors"
                      title="Kéo mép phải để kéo dài / thu ngắn thời lượng"
                    />
                  </div>
                );
              })}
              {/* Hook Title Track Block (Kéo dời vị trí & Kéo 2 đầu chỉnh độ dài thời gian) */}
              {titleConfig?.visible !== false && (
                <div
                  style={{
                    left: `${Math.max(0, Math.min(95, ((titleConfig?.startTime ?? 0) / clipDuration) * 100))}%`,
                    width: `${Math.max(5, Math.min(100 - Math.max(0, Math.min(95, ((titleConfig?.startTime ?? 0) / clipDuration) * 100)), ((titleConfig?.duration ?? 6) / clipDuration) * 100))}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTitle(true);
                  }}
                  onMouseDown={(e) => handleTitleMouseDown(e, 'move')}
                  className={`title-track-block absolute top-1 h-6 rounded-md border flex items-center justify-between px-1 text-[9px] font-bold shadow-md cursor-grab active:cursor-grabbing transition-all select-none z-25 ${
                    selectedTitle
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-white ring-2 ring-yellow-300 shadow-xl'
                      : 'bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 text-white border-amber-300'
                  }`}
                  title={`Tiêu đề Hook (${(titleConfig?.duration ?? 6).toFixed(1)}s) - Giữ để dời vị trí hoặc kéo 2 mép để chỉnh thời lượng`}
                >
                  {/* Left Resize Handle */}
                  <div
                    onMouseDown={(e) => handleTitleMouseDown(e, 'resize_left')}
                    className="w-2 h-full bg-white/40 hover:bg-white cursor-ew-resize rounded-l-sm flex items-center justify-center text-[7px]"
                    title="Kéo mép trái để đổi mốc bắt đầu"
                  >
                    |
                  </div>

                  <div className="flex items-center gap-1 truncate px-1 pointer-events-none">
                    <span>📌</span>
                    <span className="truncate">{customTitle || clip?.title || 'Tiêu Đề Hook'}</span>
                    <span className="text-[8px] opacity-90 font-mono">({(titleConfig?.duration ?? 6).toFixed(1)}s)</span>
                  </div>

                  {/* Right Resize Handle */}
                  <div
                    onMouseDown={(e) => handleTitleMouseDown(e, 'resize_right')}
                    className="w-2 h-full bg-white/40 hover:bg-white cursor-ew-resize rounded-r-sm flex items-center justify-center text-[7px]"
                    title="Kéo mép phải để kéo dài / thu ngắn thời lượng"
                  >
                    |
                  </div>
                </div>
              )}
            </div>

            {/* ── TRACK 2: Multi-Scene Video Segments & Transitions ── */}
            <div className="flex-1 relative flex items-center overflow-hidden bg-[#07080d]">
              {scenes.map((scene, idx) => {
                const scStartRel = Math.max(0, scene.start_time - clipStart);
                const scEndRel = Math.min(clipDuration, scene.end_time - clipStart);
                const scDur = Math.max(0.1, scEndRel - scStartRel);

                const leftPct = (scStartRel / clipDuration) * 100;
                const widthPct = (scDur / clipDuration) * 100;
                const isSelected = selectedSceneId === scene.id;

                return (
                  <React.Fragment key={scene.id || `sc_${idx}`}>
                    {/* Scene Block */}
                    <div
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSceneId(scene.id);
                      }}
                      className={`scene-track-block absolute top-1 bottom-1 rounded-lg border flex flex-col justify-between p-1.5 transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 border-indigo-400 ring-2 ring-indigo-400 z-20 shadow-xl'
                          : 'bg-gradient-to-r from-[#171926] to-[#12141f] hover:from-[#202334] hover:to-[#1a1c2b] border-[#2a2e45]'
                      }`}
                    >
                      {/* Scene Header */}
                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          <span className="truncate">{scene.title || `Đoạn ${idx + 1}`}</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 shrink-0">
                          {scDur.toFixed(1)}s
                        </span>
                      </div>

                      {/* Waveform graphic pattern */}
                      <div className="flex items-center justify-around opacity-40 h-3">
                        {Array.from({ length: 15 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-[1.5px] bg-indigo-300 rounded-full"
                            style={{ height: `${4 + (i % 4) * 3}px` }}
                          />
                        ))}
                      </div>

                      {/* Quick Delete Scene Button on Selection */}
                      {isSelected && scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteScene) onDeleteScene(scene.id);
                            setSelectedSceneId(null);
                          }}
                          title="Xóa đoạn này khỏi video"
                          className="absolute top-1 right-1 w-4 h-4 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md z-30"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Transition Badge ở ĐẦU mỗi phân cảnh -> Click mở Sidebar Transitions cho phân cảnh này */}
                    <div
                      style={{ left: `${leftPct}%` }}
                      className="absolute top-1/2 -translate-y-1/2 translate-x-[2px] z-30 pointer-events-auto"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenTransitionsTab) {
                            onOpenTransitionsTab(scene.id);
                          }
                        }}
                        className={`transition-badge-btn px-2 py-0.8 rounded-md border flex items-center gap-1 shadow-lg text-[9px] font-bold transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                          scene.transition && scene.transition !== 'none'
                            ? 'bg-amber-500 text-black border-amber-300 ring-2 ring-amber-400/60'
                            : 'bg-[#181b29] hover:bg-amber-600 hover:text-white text-amber-300 border-[#3d4464]'
                        }`}
                        title="Mở thanh Transitions bên phải để chọn hiệu ứng chuyển cảnh cho phân cảnh này"
                      >
                        <Zap className="w-3 h-3 fill-current text-current" />
                        <span className="uppercase">
                          {getTransitionLabel(scene.transition)}
                        </span>
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Playhead GPU Accelerated */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-white z-40 pointer-events-none shadow-[0_0_12px_rgba(255,255,255,1)]"
              style={{ left: `${progressPercent}%`, willChange: 'left' }}
            >
              <div className="absolute -top-1 -left-[5px] w-3 h-4 rounded-sm bg-white text-black font-bold text-[8px] flex items-center justify-center shadow-lg border border-black/40">
                ▼
              </div>
            </div>
          </div>

          <button
            onClick={onAddMediaTrack}
            className="w-8 h-28 rounded-xl bg-[#131520] hover:bg-[#1e2030] border border-[#24273a] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Thêm B-Roll hoặc Phương tiện"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* B-Roll Edit Modal */}
      {editingBroll && (
        <BrollEditModal
          isOpen={!!editingBroll}
          onClose={() => setEditingBroll(null)}
          broll={editingBroll}
          onUpdateBroll={(updated) => {
            if (onUpdateBroll) onUpdateBroll(updated);
            setEditingBroll(null);
          }}
          onDeleteBroll={(id) => {
            if (onDeleteBroll) onDeleteBroll(id);
            setEditingBroll(null);
          }}
          clipDuration={clipDuration}
        />
      )}
    </div>
  );
}

export default React.memo(OpusTimeline);
