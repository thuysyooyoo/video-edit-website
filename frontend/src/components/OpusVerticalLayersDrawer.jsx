import React, { useState } from 'react';
import { 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Trash2, 
  Clock, 
  Hourglass, 
  Volume2, 
  Sparkles, 
  Type, 
  Film, 
  Crown, 
  Move, 
  GripVertical,
  X,
  Plus,
  Play,
  Zap
} from 'lucide-react';
import { ANIMATION_PRESETS } from './AnimatedStickerItem';

function OpusVerticalLayersDrawer({
  isOpen = true,
  onClose,
  clipDuration = 30,
  currentTime = 0,
  onSeek,
  // Header / Title
  titleConfig,
  onUpdateTitleConfig,
  customTitle,
  setCustomTitle,
  onUpdateCustomTitle,
  // Text Layers
  textLayers = [],
  onUpdateTextLayer,
  onRemoveTextLayer,
  selectedTextLayerId,
  setSelectedTextLayerId,
  onReorderTextLayers,
  // Animated Stickers
  animatedStickers = [],
  onUpdateAnimatedSticker,
  onRemoveAnimatedSticker,
  selectedAnimatedStickerId,
  setSelectedAnimatedStickerId,
  // B-Rolls
  brolls = [],
  onUpdateBroll,
  onDeleteBroll,
  onReorderBrolls,
  selectedBrollId,
  setSelectedBrollId,
  // Sound FX
  soundFxMarkers = [],
  onUpdateSoundFxTime,
  onDeleteSoundFx,
  // Select Element callback
  onSelectElement
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'text' | 'animation' | 'broll' | 'sound'
  const [draggedLayerIdx, setDraggedLayerIdx] = useState(null);
  const [dragOverLayerIdx, setDragOverLayerIdx] = useState(null);

  // Build a unified layers list with unified metadata
  const layersList = [];

  // 1. Header Hook Title
  if (titleConfig) {
    const tStart = titleConfig.startTime ?? 0;
    const tDur = titleConfig.duration ?? 6;
    const tEnd = tStart + tDur;
    const isVisible = titleConfig.visible !== false;

    layersList.push({
      id: 'layer_header_title',
      type: 'title',
      name: customTitle || 'Tiêu đề Hook (Header Card)',
      icon: Crown,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-950/30 border-amber-500/40',
      tag: 'Header 👑',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      startTime: tStart,
      duration: tDur,
      endTime: tEnd,
      visible: isVisible,
      rawObj: titleConfig,
      onUpdateTime: (newStart, newDur) => {
        if (onUpdateTitleConfig) {
          onUpdateTitleConfig(prev => ({
            ...prev,
            startTime: Math.max(0, Math.round(newStart * 10) / 10),
            duration: Math.max(0.5, Math.round(newDur * 10) / 10)
          }));
        }
      },
      onToggleVisible: () => {
        if (onUpdateTitleConfig) {
          onUpdateTitleConfig(prev => ({ ...prev, visible: !isVisible }));
        }
      },
      onDelete: () => {
        if (onUpdateTitleConfig) {
          onUpdateTitleConfig(prev => ({ ...prev, visible: false }));
        }
      }
    });
  }

  // 2. Custom Text Layers
  (textLayers || []).forEach((tl, idx) => {
    const textObj = typeof tl === 'string' ? { id: `tl_${idx}`, text: tl } : tl;
    const tStart = textObj.startTime ?? 0;
    const tDur = textObj.duration ?? 5.0;
    const tEnd = tStart + tDur;
    const isVisible = textObj.visible !== false;
    const isSelected = selectedTextLayerId === textObj.id;

    layersList.push({
      id: textObj.id || `text_${idx}`,
      index: idx,
      type: 'text',
      name: textObj.text || 'Lớp chữ',
      icon: Type,
      iconColor: 'text-indigo-400',
      bgColor: isSelected ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500' : 'bg-indigo-950/30 border-indigo-500/30',
      tag: textObj.style === 'plain' ? 'Chữ thuần' : textObj.style || 'Text',
      tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      startTime: tStart,
      duration: tDur,
      endTime: tEnd,
      visible: isVisible,
      rawObj: textObj,
      onUpdateTime: (newStart, newDur) => {
        if (onUpdateTextLayer) {
          onUpdateTextLayer(textObj.id, {
            startTime: Math.max(0, Math.round(newStart * 10) / 10),
            duration: Math.max(0.5, Math.round(newDur * 10) / 10)
          });
        }
      },
      onToggleVisible: () => {
        if (onUpdateTextLayer) {
          onUpdateTextLayer(textObj.id, { visible: !isVisible });
        }
      },
      onDelete: () => {
        if (onRemoveTextLayer) onRemoveTextLayer(textObj.id || idx);
      }
    });
  });

  // 3. Animated Stickers
  (animatedStickers || []).forEach((stk, idx) => {
    const preset = ANIMATION_PRESETS.find(p => p.id === stk.type) || { name: stk.type, thumb: '✨' };
    const sStart = stk.startTime ?? 0;
    const sDur = stk.duration ?? 4.0;
    const sEnd = sStart + sDur;
    const isVisible = stk.visible !== false;
    const isSelected = selectedAnimatedStickerId === stk.id;

    layersList.push({
      id: stk.id || `stk_${idx}`,
      index: idx,
      type: 'animation',
      name: `${preset.thumb} ${preset.name}`,
      icon: Sparkles,
      iconColor: 'text-yellow-400',
      bgColor: isSelected ? 'bg-amber-950/70 border-amber-400 ring-1 ring-amber-400' : 'bg-amber-950/30 border-amber-500/30',
      tag: 'Animation 🌟',
      tagColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      startTime: sStart,
      duration: sDur,
      endTime: sEnd,
      visible: isVisible,
      rawObj: stk,
      onUpdateTime: (newStart, newDur) => {
        if (onUpdateAnimatedSticker) {
          onUpdateAnimatedSticker(stk.id, {
            startTime: Math.max(0, Math.round(newStart * 10) / 10),
            duration: Math.max(0.5, Math.round(newDur * 10) / 10)
          });
        }
      },
      onToggleVisible: () => {
        if (onUpdateAnimatedSticker) {
          onUpdateAnimatedSticker(stk.id, { visible: !isVisible });
        }
      },
      onDelete: () => {
        if (onRemoveAnimatedSticker) onRemoveAnimatedSticker(stk.id || idx);
      }
    });
  });

  // 4. B-Rolls
  (brolls || []).forEach((b, idx) => {
    const bStart = b.start ?? 0;
    const bDur = b.duration ?? 4.0;
    const bEnd = bStart + bDur;
    const isSelected = selectedBrollId === b.id;

    layersList.push({
      id: b.id || `b_${idx}`,
      index: idx,
      type: 'broll',
      name: b.title || 'B-Roll Video/Ảnh',
      icon: Film,
      iconColor: 'text-amber-500',
      bgColor: isSelected ? 'bg-amber-950/70 border-amber-500 ring-1 ring-amber-400' : 'bg-amber-950/20 border-amber-600/30',
      tag: b.enterTransition ? `B-Roll • ${b.enterTransition}` : 'B-Roll 🎬',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      startTime: bStart,
      duration: bDur,
      endTime: bEnd,
      visible: true,
      rawObj: b,
      onUpdateTime: (newStart, newDur) => {
        if (onUpdateBroll) {
          onUpdateBroll(b.id, {
            start: Math.max(0, Math.round(newStart * 10) / 10),
            duration: Math.max(0.5, Math.round(newDur * 10) / 10)
          });
        }
      },
      onToggleVisible: () => {},
      onDelete: () => {
        if (onDeleteBroll) onDeleteBroll(b.id);
      }
    });
  });

  // 5. Sound FX Markers
  (soundFxMarkers || []).forEach((fx, idx) => {
    const fxTime = fx.time ?? 0;

    layersList.push({
      id: fx.id || `fx_${idx}`,
      index: idx,
      type: 'sound',
      name: fx.name || fx.soundId || 'Hiệu ứng âm thanh',
      icon: Volume2,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-950/30 border-rose-500/30',
      tag: 'Sound FX 🔔',
      tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      startTime: fxTime,
      duration: 0.3,
      endTime: fxTime + 0.3,
      visible: true,
      rawObj: fx,
      onUpdateTime: (newStart) => {
        if (onUpdateSoundFxTime) {
          onUpdateSoundFxTime(fx.id, Math.max(0, Math.round(newStart * 10) / 10));
        }
      },
      onToggleVisible: () => {},
      onDelete: () => {
        if (onDeleteSoundFx) onDeleteSoundFx(fx.id);
      }
    });
  });

  // Combined count for Header + Text
  const totalTextAndHeaderCount = (textLayers || []).length + (titleConfig ? 1 : 0);

  // Filtered layers
  const displayedLayers = filterType === 'all' 
    ? layersList 
    : filterType === 'text'
      ? layersList.filter(l => l.type === 'text' || l.type === 'title')
      : layersList.filter(l => l.type === filterType);

  const handleLayerDragStart = (e, index, layer) => {
    setDraggedLayerIdx(index);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLayerIdx !== index) {
      setDragOverLayerIdx(index);
    }
  };

  const handleLayerDrop = (e, dropIndex) => {
    e.preventDefault();
    const sourceIndex = draggedLayerIdx;
    setDraggedLayerIdx(null);
    setDragOverLayerIdx(null);

    if (sourceIndex === null || sourceIndex === dropIndex) return;

    const sourceLayer = displayedLayers[sourceIndex];
    const targetLayer = displayedLayers[dropIndex];

    // If reordering between text layers
    if (sourceLayer && targetLayer && sourceLayer.type === 'text' && targetLayer.type === 'text' && onReorderTextLayers) {
      onReorderTextLayers(sourceLayer.index, targetLayer.index);
    }
    // If reordering between B-Roll layers (cho phép kéo đè vị trí B-Roll)
    if (sourceLayer && targetLayer && sourceLayer.type === 'broll' && targetLayer.type === 'broll' && onReorderBrolls) {
      onReorderBrolls(sourceLayer.index, targetLayer.index);
    }
  };

  const handleLayerDragEnd = () => {
    setDraggedLayerIdx(null);
    setDragOverLayerIdx(null);
  };

  return (
    <div className="h-full bg-[#11121b] border-l border-[#24283b] flex flex-col font-sans select-none text-xs animate-fade-in shadow-2xl">
      {/* ── Top Header ── */}
      <div className="p-3 bg-[#151724] border-b border-[#24283b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>Bảng Lớp & Timeline Dọc</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                {layersList.length} lớp
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Kéo tay đổi vị trí đè & Sửa chữ trực tiếp</div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#252a3f] text-slate-400 hover:text-white transition"
            title="Đóng Bảng Lớp"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filter Pills (Gom Header với Lớp Chữ vào 1 phần) ── */}
      <div className="px-3 py-2 bg-[#0e0f17] border-b border-[#202334] flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'all', label: 'Tất cả', count: layersList.length },
          { id: 'text', label: 'Văn Bản & Tiêu Đề', count: totalTextAndHeaderCount },
          { id: 'animation', label: 'Animation', count: (animatedStickers || []).length },
          { id: 'broll', label: 'B-Roll', count: (brolls || []).length },
          { id: 'sound', label: 'Sound FX', count: (soundFxMarkers || []).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 ${
              filterType === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#181a26] text-slate-400 hover:text-white hover:bg-[#222638]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="opacity-75 font-mono">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ── Layers List Container ── */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {displayedLayers.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
            <Layers className="w-8 h-8 opacity-30 text-indigo-400" />
            <p className="text-xs">Chưa có lớp nào trong danh mục này.</p>
            <p className="text-[10px] text-slate-600">Thêm Text, Animation, B-Roll từ thanh công cụ bên cạnh.</p>
          </div>
        ) : (
          displayedLayers.map((layer, idx) => {
            const IconComp = layer.icon;
            const isCurrentlyPlaying = currentTime >= layer.startTime && currentTime <= layer.endTime;
            const isBeingDragged = draggedLayerIdx === idx;
            const isDragOver = dragOverLayerIdx === idx;
            const isDraggable = layer.type === 'text' || layer.type === 'broll';

            return (
              <div
                key={layer.id}
                draggable={isDraggable}
                onDragStart={(e) => handleLayerDragStart(e, idx, layer)}
                onDragOver={(e) => handleLayerDragOver(e, idx)}
                onDrop={(e) => handleLayerDrop(e, idx)}
                onDragEnd={handleLayerDragEnd}
                onClick={() => {
                  if (onSeek) onSeek(layer.startTime);
                  if (layer.type === 'text' && setSelectedTextLayerId) setSelectedTextLayerId(layer.id);
                  if (layer.type === 'animation' && setSelectedAnimatedStickerId) setSelectedAnimatedStickerId(layer.id);
                  if (layer.type === 'broll' && setSelectedBrollId) setSelectedBrollId(layer.id);
                  if (onSelectElement) onSelectElement(layer.type, layer.id);
                }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer space-y-2 select-none ${layer.bgColor} ${
                  isCurrentlyPlaying ? 'ring-1 ring-emerald-400/80 shadow-md' : 'hover:border-indigo-400/50'
                } ${isBeingDragged ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''} ${
                  isDragOver ? 'border-2 border-indigo-400 bg-indigo-950/80 shadow-xl' : ''
                }`}
              >
                {/* Header Row: Icon + Name + Actions (Eye / Delete / Reorder) */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    {/* Drag Handle Icon (Kéo tay đổi vị trí lớp) */}
                    {isDraggable && (
                      <div 
                        title="Nhấn giữ và kéo tay để đổi thứ tự lớp đè (Z-Index)"
                        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-indigo-300 p-0.5"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      <IconComp className={`w-3.5 h-3.5 ${layer.iconColor}`} />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white text-xs truncate">{layer.name}</div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-semibold ${layer.tagColor}`}>
                        {layer.tag}
                      </span>
                    </div>
                  </div>

                  {/* Top-Right Control Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Layer Reorder Up / Down for Text */}
                    {layer.type === 'text' && onReorderTextLayers && (
                      <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
                        <button
                          disabled={layer.index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderTextLayers(layer.index, layer.index - 1);
                          }}
                          title="Đưa lớp chữ lên trên (Z-Index cao hơn)"
                          className="p-1 rounded hover:bg-indigo-600 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={layer.index === (textLayers.length - 1)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderTextLayers(layer.index, layer.index + 1);
                          }}
                          title="Hạ lớp chữ xuống dưới (Z-Index thấp hơn)"
                          className="p-1 rounded hover:bg-indigo-600 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Layer Reorder Up / Down for B-Roll */}
                    {layer.type === 'broll' && onReorderBrolls && (
                      <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-amber-500/20">
                        <button
                          disabled={layer.index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderBrolls(layer.index, layer.index - 1);
                          }}
                          title="Đưa B-Roll lên lớp trên (ưu tiên hiển thị đè lên B-roll khác)"
                          className="p-1 rounded hover:bg-amber-600 text-amber-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={layer.index === (brolls.length - 1)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderBrolls(layer.index, layer.index + 1);
                          }}
                          title="Hạ B-Roll xuống lớp dưới"
                          className="p-1 rounded hover:bg-amber-600 text-amber-300 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Toggle Visibility Eye */}
                    {layer.type !== 'sound' && layer.type !== 'broll' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          layer.onToggleVisible();
                        }}
                        title={layer.visible ? 'Ẩn lớp này' : 'Hiện lớp này'}
                        className="p-1.5 rounded-lg bg-black/40 hover:bg-[#2c314a] text-slate-300 hover:text-white transition"
                      >
                        {layer.visible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                      </button>
                    )}

                    {/* Play Sound Preview */}
                    {layer.type === 'sound' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const soundFile = layer.rawObj.file || `${layer.rawObj.soundId}.wav`;
                            const snd = new Audio(layer.rawObj.fileUrl || `/assets/sounds/${soundFile}`);
                            snd.volume = 0.9;
                            snd.play().catch(() => {});
                          } catch(err) {}
                        }}
                        title="Nghe thử tiếng"
                        className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/50 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        layer.onDelete();
                      }}
                      title="Xóa lớp này khỏi video"
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-600 text-slate-400 hover:text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* ✍️ SỬA CHỮ TRỰC TIẾP NGAY TRÊN BẢNG LỚP: Tiêu Đề Hook & Lớp Văn Bản */}
                {layer.type === 'title' && (
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 bg-[#0b0c13] border border-amber-500/40 focus-within:border-amber-400 rounded-xl px-2.5 py-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <input
                        type="text"
                        value={customTitle || ''}
                        onChange={(e) => {
                          if (onUpdateCustomTitle) onUpdateCustomTitle(e.target.value);
                          if (setCustomTitle) setCustomTitle(e.target.value);
                        }}
                        placeholder="Sửa nội dung Tiêu Đề Hook..."
                        className="w-full bg-transparent text-white font-bold text-xs focus:outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                {layer.type === 'text' && (
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 bg-[#0b0c13] border border-indigo-500/40 focus-within:border-indigo-400 rounded-xl px-2.5 py-1.5">
                      <Type className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <input
                        type="text"
                        value={layer.rawObj.text || ''}
                        onChange={(e) => {
                          if (onUpdateTextLayer) {
                            onUpdateTextLayer(layer.rawObj.id, { text: e.target.value });
                          }
                        }}
                        placeholder="Sửa nội dung chữ..."
                        className="w-full bg-transparent text-white font-bold text-xs focus:outline-none placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                {/* Timing Steppers Row: Bắt đầu (In) & Biến mất (Out) & Thời lượng (Duration) */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                  {/* Xuất hiện (In) */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Xuất hiện (s):</span>
                    </span>
                    <div className="flex items-center gap-0.5 bg-[#0e1017] border border-[#2d3249] rounded-lg p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          layer.onUpdateTime(layer.startTime - 0.5, layer.duration);
                        }}
                        className="w-5 h-5 rounded bg-[#1e2235] hover:bg-[#2c324a] text-white font-bold flex items-center justify-center text-[10px]"
                        title="Lùi 0.5s"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={layer.startTime.toFixed(1)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          layer.onUpdateTime(val, layer.duration);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-center text-white font-mono font-bold text-[11px] focus:outline-none"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          layer.onUpdateTime(layer.startTime + 0.5, layer.duration);
                        }}
                        className="w-5 h-5 rounded bg-[#1e2235] hover:bg-[#2c324a] text-white font-bold flex items-center justify-center text-[10px]"
                        title="Tăng 0.5s"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Biến mất (Out) hoặc Thời lượng */}
                  {layer.type !== 'sound' ? (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Hourglass className="w-3 h-3 text-amber-400" />
                        <span>Biến mất (s):</span>
                      </span>
                      <div className="flex items-center gap-0.5 bg-[#0e1017] border border-[#2d3249] rounded-lg p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            layer.onUpdateTime(layer.startTime, Math.max(0.5, layer.duration - 0.5));
                          }}
                          className="w-5 h-5 rounded bg-[#1e2235] hover:bg-[#2c324a] text-white font-bold flex items-center justify-center text-[10px]"
                          title="Giảm 0.5s"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          value={layer.endTime.toFixed(1)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || (layer.startTime + 1);
                            layer.onUpdateTime(layer.startTime, Math.max(0.5, val - layer.startTime));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent text-center text-white font-mono font-bold text-[11px] focus:outline-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            layer.onUpdateTime(layer.startTime, layer.duration + 0.5);
                          }}
                          className="w-5 h-5 rounded bg-[#1e2235] hover:bg-[#2c324a] text-white font-bold flex items-center justify-center text-[10px]"
                          title="Tăng 0.5s"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end pb-1 text-[10px] text-slate-400">
                      <span>Mặc định phát tại giây này</span>
                    </div>
                  )}
                </div>

                {/* Hiệu ứng Chuyển Động Xuất Hiện (In) & Biến Mất (Out) cho Text Layer */}
                {layer.type === 'text' && (
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Hiệu ứng:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={layer.rawObj.animIn || 'pop'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (onUpdateTextLayer) onUpdateTextLayer(layer.id, { animIn: e.target.value });
                        }}
                        title="Hiệu ứng chuyển động lúc xuất hiện (In Animation)"
                        className="bg-[#0e1017] border border-[#2d3249] text-indigo-300 rounded px-1.5 py-0.5 text-[9px] font-bold focus:outline-none"
                      >
                        <option value="pop">⚡ Pop Nảy</option>
                        <option value="fade_in">✨ Fade In</option>
                        <option value="slide_up">⬆️ Slide Up</option>
                        <option value="slide_left">➡️ Slide Left</option>
                        <option value="typewriter">⌨️ Typewriter</option>
                        <option value="bounce">🎾 Bounce</option>
                        <option value="none">🚫 Không hiệu ứng</option>
                      </select>

                      <span className="text-slate-500 font-bold">➔</span>

                      <select
                        value={layer.rawObj.animOut || 'fade_out'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (onUpdateTextLayer) onUpdateTextLayer(layer.id, { animOut: e.target.value });
                        }}
                        title="Hiệu ứng chuyển động lúc biến mất (Out Animation)"
                        className="bg-[#0e1017] border border-[#2d3249] text-purple-300 rounded px-1.5 py-0.5 text-[9px] font-bold focus:outline-none"
                      >
                        <option value="fade_out">✨ Fade Out</option>
                        <option value="zoom_out">🔍 Zoom Out</option>
                        <option value="slide_down">⬇️ Slide Down</option>
                        <option value="slide_right">➡️ Slide Right</option>
                        <option value="none">🚫 Không hiệu ứng</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer Summary ── */}
      <div className="p-3 bg-[#131522] border-t border-[#24283b] flex items-center justify-between text-[11px] text-slate-400">
        <span>⏱️ Thời lượng clip: <strong className="text-white font-mono">{clipDuration.toFixed(1)}s</strong></span>
        <span className="text-emerald-400 font-semibold">Tự động đồng bộ</span>
      </div>
    </div>
  );
}

export default React.memo(OpusVerticalLayersDrawer);
