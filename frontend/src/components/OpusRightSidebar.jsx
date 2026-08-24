import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Subtitles, 
  UploadCloud, 
  LayoutGrid, 
  Video, 
  Infinity as InfinityIcon, 
  Type, 
  Music, 
  Scissors, 
  Mic, 
  Smile, 
  Highlighter, 
  ChevronLeft, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  Zap, 
  Search, 
  Plus, 
  Play, 
  Check, 
  RotateCcw, 
  Sliders, 
  Italic, 
  Underline,
  Globe,
  Languages,
  Palette,
  Layers,
  FileAudio,
  Loader2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Move,
  Crown,
  Download,
  Save,
  FileCode,
  FolderOpen,
  Clock,
  Hourglass,
  Edit2,
  Edit3
} from 'lucide-react';
import { VIRAL_FONTS } from '../utils/captionStyles';
import AnimatedStickerItem, { ANIMATION_PRESETS } from './AnimatedStickerItem';

export default function OpusRightSidebar({
  activeTab = 'ai_enhance',
  setActiveTab,
  captionPreset,
  setCaptionPreset,
  captionEffect = 'pop',
  setCaptionEffect,
  highlightKeywords,
  setHighlightKeywords,
  speechEnhance,
  setSpeechEnhance,
  aiEmoji,
  setAiEmoji,
  autoCensor = false,
  setAutoCensor,
  autoTransitions,
  setAutoTransitions,
  activeTransition = 'zoom_in',
  setActiveTransition,
  speakerColors = true,
  setSpeakerColors,
  // Auto vs Manual Sound FX & Ducking
  autoWhoosh = true,
  setAutoWhoosh,
  autoDing = true,
  setAutoDing,
  audioDucking = true,
  setAudioDucking,
  // Auto vs Manual B-Roll
  autoBroll = false,
  setAutoBroll,
  // Font Customization State
  fontStyle = {},
  setFontStyle,
  // Watermark State
  watermark = { visible: true, text: 'OPUS STUDIO', pos: 'top-right', opacity: 85 },
  setWatermark,
  // Cleanup callbacks
  onRemoveAllFillers,
  onRemoveAllPauses,
  pauseThreshold,
  setPauseThreshold,
  detectedFillersCount,
  detectedPausesCount,
  activeCleanupMode,
  setActiveCleanupMode,
  // Manual B-Roll / Audio / Text / Transition callbacks
  onOpenBrollPicker,
  onOpenSoundFxPicker,
  onInsertSoundFx,
  onAddTextLayer,
  textLayers = [],
  onRemoveTextLayer,
  onUpdateTextLayer,
  selectedTextLayerId,
  setSelectedTextLayerId,
  isPlacingTextMode = false,
  onStartPlaceTextMode,
  onCancelPlaceText,
  brolls = [],
  onDeleteBroll,
  onUpdateBroll,
  // Animation / Stickers callbacks & state
  onAddAnimatedSticker,
  animatedStickers = [],
  onRemoveAnimatedSticker,
  onUpdateAnimatedSticker,
  // Interactive Auto-Mix
  onRunAutoAudioMix,
  isAutoMixing = false,
  autoMixMessage = '',
  soundFxCount = 0,
  onClearAllSoundFx,
  // Multi-Scene Transitions State
  clip,
  selectedTransitionSceneId,
  setSelectedTransitionSceneId,
  onUpdateSceneTransition,
  // Brand Template & Title Customization
  brandConfig,
  setBrandConfig,
  titleConfig,
  setTitleConfig,
  customTitle,
  setCustomTitle,
  // Background Music Props
  selectedBgm = 'none',
  setSelectedBgm,
  bgmVolume = 25,
  setBgmVolume,
  customBgmList = [],
  setCustomBgmList,
  // Layer Stacking Order Props
  layerOrder = [],
  setLayerOrder,
  onMoveLayerUp,
  onMoveLayerDown,
  onBringLayerToFront,
  onSendLayerToBack,
  onMoveBrollUp,
  onMoveBrollDown
}) {
  const [captionSubTab, setCaptionSubTab] = useState('presets');
  const [playingFx, setPlayingFx] = useState(null);
  const bgmFileInputRef = useRef(null);

  // Text & Title Tab State
  const [textMainSubTab, setTextMainSubTab] = useState('title'); // 'title' | 'layer'
  const [editingTextId, setEditingTextId] = useState(null);
  const [customTextInput, setCustomTextInput] = useState('');
  const [selectedTextStyle, setSelectedTextStyle] = useState('plain'); // 'plain' (mặc định không khung) | 'header' | 'neon_tag' | 'gradient_badge' | 'callout_box' | 'yellow_impact'
  const [customTextFont, setCustomTextFont] = useState('Montserrat');
  const [customTextSize, setCustomTextSize] = useState(42);
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [customTextWeight, setCustomTextWeight] = useState('Black');
  const [customTextStrokeColor, setCustomTextStrokeColor] = useState('#000000');
  const [customTextStrokeWidth, setCustomTextStrokeWidth] = useState(6);
  const [customTextHasShadow, setCustomTextHasShadow] = useState(true);
  const [customTextShadowColor, setCustomTextShadowColor] = useState('#000000');
  const [customTextUppercase, setCustomTextUppercase] = useState(true);
  const [customTextAnimIn, setCustomTextAnimIn] = useState('pop');
  const [customTextAnimInDur, setCustomTextAnimInDur] = useState(0.35);
  const [customTextAnimOut, setCustomTextAnimOut] = useState('fade_out');
  const [customTextAnimOutDur, setCustomTextAnimOutDur] = useState(0.35);

  // Tự động đồng bộ Lớp Chữ đang chọn để chỉnh sửa trực tiếp trong Tab Text
  React.useEffect(() => {
    if (selectedTextLayerId) {
      const targetTl = textLayers.find(tl => (tl.id || tl) === selectedTextLayerId);
      if (targetTl) {
        const textObj = typeof targetTl === 'string' ? { id: selectedTextLayerId, text: targetTl } : targetTl;
        setEditingTextId(textObj.id);
        setCustomTextInput(textObj.text || '');
        setSelectedTextStyle(textObj.style || 'plain');
        setCustomTextFont(textObj.fontFamily || 'Montserrat');
        setCustomTextSize(textObj.fontSize || 42);
        setCustomTextColor(textObj.textColor || '#ffffff');
        setCustomTextWeight(textObj.fontWeight || 'Black');
        setCustomTextStrokeColor(textObj.strokeColor || '#000000');
        setCustomTextStrokeWidth(textObj.strokeWidth ?? 6);
        setCustomTextHasShadow(textObj.hasShadow ?? true);
        setCustomTextShadowColor(textObj.shadowColor || '#000000');
        setCustomTextUppercase(textObj.isUppercase ?? true);
        setCustomTextAnimIn(textObj.animIn || 'pop');
        setCustomTextAnimInDur(textObj.animInDuration ?? 0.35);
        setCustomTextAnimOut(textObj.animOut || 'fade_out');
        setCustomTextAnimOutDur(textObj.animOutDuration ?? 0.35);
      }
    }
  }, [selectedTextLayerId, textLayers]);

  // Brand Logo Upload Ref
  const logoInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Dubbing State
  const [dubbingLang, setDubbingLang] = useState('en');
  const [isDubbing, setIsDubbing] = useState(false);

  // Custom User Templates Library State
  const [userTemplates, setUserTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('opus_user_custom_templates');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      {
        id: 'tmpl_tiktok',
        name: 'Mẫu TikTok Viral (MrBeast Neon)',
        desc: 'Font Montserrat Black, Pop Word Xanh Lá, Tiêu đề Vàng Gradient',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Montserrat', fontSize: 40, textColor: '#ffffff', strokeWidth: 8, strokeColor: '#000000', highlightColor: '#22c55e', effect: 'pop' },
          captionPreset: 'Karaoke Neon Green',
          captionEffect: 'pop',
          titleConfig: { visible: true, style: 'gradient_gold' },
          brandConfig: { showLogo: true, logoText: 'OPUS STUDIO', logoSize: 65, logoOpacity: 90 }
        }
      },
      {
        id: 'tmpl_hormozi',
        name: 'Mẫu Doanh Nhân (Alex Hormozi)',
        desc: 'Font Bebas Neue, Pill-Box Vàng Chữ Đen, Tiêu đề Pill White',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Bebas Neue', fontSize: 44, textColor: '#ffffff', strokeWidth: 0, strokeColor: '#000000', highlightColor: '#000000', effect: 'pill', pillBgColor: '#facc15', pillTextColor: '#000000' },
          captionPreset: 'Alex Hormozi Pill-Box',
          captionEffect: 'pill',
          titleConfig: { visible: true, style: 'pill_white' },
          brandConfig: { showLogo: true, logoText: 'BIZ HUB', logoSize: 70, logoOpacity: 95 }
        }
      },
      {
        id: 'tmpl_cyberpunk',
        name: 'Mẫu Công Nghệ (Cyber Neon Glow)',
        desc: 'Font Kanit, Phát sáng Cyan Neon, Tiêu đề Neon Cyber',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Kanit', fontSize: 38, textColor: '#ffffff', strokeWidth: 6, strokeColor: '#000000', highlightColor: '#00f0ff', effect: 'glow', glowColor: '#00f0ff' },
          captionPreset: 'Cyberpunk Neon Glow',
          captionEffect: 'glow',
          titleConfig: { visible: true, style: 'neon_cyber' },
          brandConfig: { showLogo: true, logoText: 'CYBER LAB', logoSize: 65, logoOpacity: 90 }
        }
      },
      {
        id: 'tmpl_red_warning',
        name: 'Mẫu Cảnh Báo (Red Warning Impact)',
        desc: 'Font Anton, Chữ Đỏ Rực Cảnh Báo, Tiêu đề Yellow Impact',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Anton', fontSize: 42, textColor: '#ffffff', strokeWidth: 9, strokeColor: '#000000', highlightColor: '#ef4444', effect: 'pop' },
          captionPreset: 'Red Impact Warning',
          captionEffect: 'pop',
          titleConfig: { visible: true, style: 'yellow_impact' },
          brandConfig: { showLogo: true, logoText: 'ALERT 24/7', logoSize: 65, logoOpacity: 95 }
        }
      },
      {
        id: 'tmpl_podcast',
        name: 'Mẫu Podcast Clean Thanh Lịch',
        desc: 'Font Inter 36px, Chữ Xanh Dương Tối Giản, Tiêu đề Pill White',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Inter', fontSize: 36, textColor: '#f8fafc', strokeWidth: 4, strokeColor: '#000000', highlightColor: '#38bdf8', effect: 'pop' },
          captionPreset: 'Minimalist Clean White',
          captionEffect: 'pop',
          titleConfig: { visible: true, style: 'pill_white' },
          brandConfig: { showLogo: true, logoText: 'TALK SHOW', logoSize: 60, logoOpacity: 85 }
        }
      },
      {
        id: 'tmpl_vietnam',
        name: 'Mẫu Sáng Tạo Việt (Be Vietnam Pro)',
        desc: 'Font Be Vietnam Pro, Viền Đen Chữ Vàng, Tiêu đề Gradient Gold',
        createdAt: 'Mẫu sẵn có',
        preset: {
          fontStyle: { fontFamily: 'Be Vietnam Pro', fontSize: 38, textColor: '#ffffff', strokeWidth: 8, strokeColor: '#000000', highlightColor: '#fde047', effect: 'pop' },
          captionPreset: 'TikTok Classic Tiếng Việt',
          captionEffect: 'pop',
          titleConfig: { visible: true, style: 'gradient_gold' },
          brandConfig: { showLogo: true, logoText: 'VIETNAM VIRAL', logoSize: 65, logoOpacity: 90 }
        }
      }
    ];
  });

  const handleApplyTemplate = (tmpl) => {
    if (!tmpl?.preset) return;
    if (tmpl.preset.fontStyle && setFontStyle) setFontStyle(tmpl.preset.fontStyle);
    if (tmpl.preset.captionPreset && setCaptionPreset) setCaptionPreset(tmpl.preset.captionPreset);
    if (tmpl.preset.captionEffect && setCaptionEffect) setCaptionEffect(tmpl.preset.captionEffect);
    if (tmpl.preset.titleConfig && setTitleConfig) setTitleConfig(prev => ({ ...prev, ...tmpl.preset.titleConfig }));
    if (tmpl.preset.brandConfig && setBrandConfig) setBrandConfig(prev => ({ ...prev, ...tmpl.preset.brandConfig }));
    alert(`✅ Đã áp dụng giao diện "${tmpl.name}" thành công!`);
  };

  const handleSaveCurrentAsTemplate = () => {
    const name = prompt("Nhập tên cho Template mới của bạn:", `Template Cá Nhân ${userTemplates.length + 1}`);
    if (!name || !name.trim()) return;

    const newTmpl = {
      id: `tmpl_${Date.now()}`,
      name: name.trim(),
      desc: `Lưu ngày ${new Date().toLocaleDateString('vi-VN')} • Tùy chỉnh riêng`,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      isCustom: true,
      preset: {
        fontStyle,
        captionPreset,
        captionEffect,
        titleConfig,
        brandConfig
      }
    };

    const updated = [newTmpl, ...userTemplates];
    setUserTemplates(updated);
    try {
      localStorage.setItem('opus_user_custom_templates', JSON.stringify(updated));
    } catch(e) {}
    alert(`✅ Đã lưu mẫu "${name}" vào Kho Template cá nhân thành công!`);
  };

  const handleDeleteTemplate = (e, tmplId) => {
    e.stopPropagation();
    const updated = userTemplates.filter(t => t.id !== tmplId);
    setUserTemplates(updated);
    try {
      localStorage.setItem('opus_user_custom_templates', JSON.stringify(updated));
    } catch(e) {}
  };

  const handleExportTemplate = (e, tmpl) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tmpl, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${tmpl.name.replace(/\s+/g, '_')}_template.json`);
    dlAnchor.click();
  };

  const handleImportTemplateFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.preset) {
          const newTmpl = {
            ...parsed,
            id: `tmpl_${Date.now()}`,
            name: parsed.name || file.name.replace('.json', ''),
            isCustom: true
          };
          const updated = [newTmpl, ...userTemplates];
          setUserTemplates(updated);
          localStorage.setItem('opus_user_custom_templates', JSON.stringify(updated));
          alert(`✅ Đã nhập Template "${newTmpl.name}" thành công!`);
        }
      } catch(err) {
        alert("File template không hợp lệ!");
      }
    };
    reader.readAsText(file);
  };

  const tools = [
    { id: 'ai_enhance', label: 'AI enhance', icon: Sparkles },
    { id: 'captions', label: 'Captions', icon: Subtitles },
    { id: 'media', label: 'Media', icon: UploadCloud },
    { id: 'brand', label: 'Brand template', icon: LayoutGrid },
    { id: 'broll', label: 'B-Roll', icon: Video },
    { id: 'transitions', label: 'Transitions', icon: InfinityIcon },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'animation', label: 'Animation', icon: Sparkles },
    { id: 'audio', label: 'Audio', icon: Music },
  ];

  const soundFxList = [
    { id: 'whoosh', name: 'Whoosh Fast Swoosh', category: 'Chuyển cảnh', file: 'whoosh.wav', duration: '0.25s' },
    { id: 'ding', name: 'Ding Bling Sparkle', category: 'Điểm nhấn', file: 'ding.wav', duration: '0.35s' },
    { id: 'pop', name: 'Pop Bubble Subtitle', category: 'Hiện chữ', file: 'pop.wav', duration: '0.10s' },
    { id: 'boom', name: 'Cinematic Hit Impact', category: 'Tác động mạnh', file: 'boom.wav', duration: '0.60s' },
    { id: 'camera', name: 'Camera Shutter Click', category: 'Chụp ảnh', file: 'camera.wav', duration: '0.05s' },
  ];

  const captionPresetsList = [
    {
      id: 'karaoke_neon',
      name: 'Karaoke Neon Green (MrBeast)',
      desc: 'Montserrat Black, viền 8px, Pop Word Xanh Lá Viral',
      style: { fontFamily: 'Montserrat', fontSize: 40, fontWeight: 'Black', textColor: '#ffffff', strokeWidth: 8, strokeColor: '#000000', highlightColor: '#22c55e', effect: 'pop', isUppercase: true, hasShadow: true, shadowColor: '#000000' }
    },
    {
      id: 'hormozi_pill',
      name: 'Alex Hormozi Pill-Box',
      desc: 'Bebas Neue, Hộp Pill Vàng Chữ Đen nổi bật',
      style: { fontFamily: 'Bebas Neue', fontSize: 44, fontWeight: 'Black', textColor: '#ffffff', strokeWidth: 0, strokeColor: '#000000', highlightColor: '#000000', effect: 'pill', pillBgColor: '#facc15', pillTextColor: '#000000', isUppercase: true, hasShadow: true, shadowColor: '#000000' }
    },
    {
      id: 'cyberpunk_glow',
      name: 'Cyberpunk Neon Glow',
      desc: 'Kanit, Phát sáng Cyan Neon rực rỡ',
      style: { fontFamily: 'Kanit', fontSize: 38, fontWeight: 'Black', textColor: '#ffffff', strokeWidth: 6, strokeColor: '#000000', highlightColor: '#00f0ff', effect: 'glow', glowColor: '#00f0ff', isUppercase: true, hasShadow: true, shadowColor: '#00f0ff' }
    },
    {
      id: 'red_warning',
      name: 'Red Impact Warning',
      desc: 'Anton, Đỏ rực cảnh báo nguy hiểm',
      style: { fontFamily: 'Anton', fontSize: 42, fontWeight: 'Black', textColor: '#ffffff', strokeWidth: 9, strokeColor: '#000000', highlightColor: '#ef4444', effect: 'pop', isUppercase: true, hasShadow: true, shadowColor: '#000000' }
    },
    {
      id: 'tiktok_vietnam',
      name: 'TikTok Classic Tiếng Việt',
      desc: 'Be Vietnam Pro, Viền đen chữ vàng chuẩn nét',
      style: { fontFamily: 'Be Vietnam Pro', fontSize: 38, fontWeight: 'Black', textColor: '#ffffff', strokeWidth: 8, strokeColor: '#000000', highlightColor: '#fde047', effect: 'pop', isUppercase: true, hasShadow: true, shadowColor: '#000000' }
    },
    {
      id: 'minimalist_clean',
      name: 'Minimalist Clean White',
      desc: 'Inter, Tối giản thanh lịch hiện đại',
      style: { fontFamily: 'Inter', fontSize: 36, fontWeight: 'SemiBold', textColor: '#f8fafc', strokeWidth: 4, strokeColor: '#000000', highlightColor: '#38bdf8', effect: 'pop', isUppercase: false, hasShadow: false }
    }
  ];

  const transitionsList = [
    { id: 'zoom_in', name: 'Zoom In Punch', desc: 'Phóng to đột ngột tạo điểm nhấn thị giác mạnh mẽ' },
    { id: 'circle_wipe', name: 'Circle Wipe (SupoClip)', desc: 'Vòng tròn mở rộng quét chuyển cảnh mượt mà' },
    { id: 'flat_slide', name: 'Flat Slide (SupoClip)', desc: 'Trượt thanh phẳng ngang hiện đại' },
    { id: 'flash_white', name: 'Flash White', desc: 'Chớp sáng điện ảnh lôi cuốn và mượt mà' },
    { id: 'glitch', name: 'Glitch Cyber', desc: 'Hiệu ứng nhiễu sóng số phong cách hiện đại' },
    { id: 'fade_black', name: 'Fade Black', desc: 'Mờ dần vào nền đen điện ảnh tinh tế' },
    { id: 'blur', name: 'Blur Dissolve', desc: 'Hòa tan làm mờ nhòe mềm mại' },
    { id: 'none', name: 'Không Chuyển Cảnh', desc: 'Cắt thẳng liền mạch tức thì (Hard Cut)' },
  ];

  const bgmTracks = [
    { id: 'lofi', name: 'Upbeat Lo-Fi Beat', bpm: '90 BPM', duration: '2:15' },
    { id: 'cinematic', name: 'Cinematic Inspiring Flow', bpm: '110 BPM', duration: '3:00' },
    { id: 'energetic', name: 'Tech Energetic Rhythm', bpm: '128 BPM', duration: '1:45' }
  ];

  const playSoundEffect = (fx) => {
    try {
      const soundUrl = fx.fileUrl || `/assets/sounds/${fx.file || fx.sound || 'whoosh.wav'}`;
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.warn("Sound effect playback:", e));
      setPlayingFx(fx.id);
      setTimeout(() => setPlayingFx(null), 800);
    } catch (e) {
      console.log("Audio play error:", e);
    }
  };

  const updateFont = (key, val) => {
    if (setFontStyle) {
      setFontStyle(prev => ({ ...prev, [key]: val }));
    }
  };

  const applyPreset = (preset) => {
    if (setFontStyle && preset.style) {
      setFontStyle(prev => ({ ...prev, ...preset.style }));
    }
    if (setCaptionPreset) {
      setCaptionPreset(preset.name);
    }
  };

  const {
    fontFamily = 'Montserrat',
    fontSize = 40,
    textColor = '#ffffff',
    fontWeight = 'Black',
    isItalic = false,
    isUnderline = false,
    isUppercase = true,
    strokeColor = '#000000',
    strokeWidth = 8,
    hasShadow = false,
    shadowColor = '#000000',
    shadowX = 2,
    shadowY = 2,
    shadowBlur = 2,
    hasHighlight = true,
    highlightColor = '#04f827'
  } = fontStyle;

  return (
    <div className="h-full flex bg-[#101118] border-l border-[#222536] overflow-hidden select-none font-sans">
      {/* Tool Drawer Content */}
      <div className="flex-1 min-w-0 bg-[#12131c] border-r border-[#202334] p-4 flex flex-col overflow-y-auto">
        
        {/* ═══════════════════════════════════════════════════
            TAB 1: AI ENHANCE
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'ai_enhance' && (
          <div className="space-y-4 font-sans text-xs">
            {activeCleanupMode === 'fillers' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#212435]">
                  <button
                    onClick={() => setActiveCleanupMode(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Loại bỏ các từ thừa</span>
                  </button>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <span>{detectedFillersCount || 4} từ thừa</span>
                  </div>
                </div>

                <div className="bg-[#181a26] border border-[#272b3f] rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>Toàn bộ là từ ngữ thừa</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="space-y-1.5 pt-1 text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input type="checkbox" defaultChecked className="accent-brand-500 rounded" />
                      <span>Chọn tất cả ({detectedFillersCount} từ thừa)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-brand-500 rounded" />
                      <span>Từ lặp lại</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-brand-500 rounded" />
                      <span>Từ ậm ờ (à, ừm, xong, hôm...)</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRemoveAllFillers();
                    setActiveCleanupMode(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs shadow-lg hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Xóa tất cả từ thừa
                </button>
              </div>
            ) : activeCleanupMode === 'pauses' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#212435]">
                  <button
                    onClick={() => setActiveCleanupMode(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Loại bỏ các khoảng dừng</span>
                  </button>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <span>{detectedPausesCount || 20} khoảng dừng</span>
                  </div>
                </div>

                <div className="bg-[#181a26] border border-[#272b3f] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>Thời gian tạm dừng</span>
                    <span className="font-mono text-yellow-400 font-bold">{pauseThreshold} giây</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={pauseThreshold}
                    onChange={(e) => setPauseThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none accent-white cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    onRemoveAllPauses();
                    setActiveCleanupMode(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs shadow-lg hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Xóa tất cả
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  <strong className="text-white">{detectedPausesCount || 20}</strong> các khoảng dừng được tìm thấy
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-sm tracking-tight">AI enhance</h3>

                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveCleanupMode('fillers')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1a1c29] hover:bg-[#23263a] border border-[#272b3f] text-left text-xs font-semibold text-white transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Scissors className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
                      <span>Remove bad takes / fillers</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#25283b] text-[10px] text-slate-400">
                      {detectedFillersCount}
                    </span>
                  </button>

                  <button 
                    onClick={() => setActiveCleanupMode('pauses')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1a1c29] hover:bg-[#23263a] border border-[#272b3f] text-left text-xs font-semibold text-white transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>Remove pauses (Khoảng dừng)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#25283b] text-[10px] text-slate-400">
                      {detectedPausesCount}
                    </span>
                  </button>
                </div>

                <div className="h-[1px] bg-[#222538] my-2" />

                <div className="space-y-3.5">
                  {/* Auto Censor Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Auto censor (Bíp từ nhạy cảm)</div>
                      <div className="text-[10px] text-slate-400">Tự động che từ ngữ nguy hiểm và bíp</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoCensor}
                      onChange={(e) => setAutoCensor && setAutoCensor(e.target.checked)}
                      className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Speech Enhancement Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Speech enhancement</div>
                      <div className="text-[10px] text-slate-400">Khử ồn & làm rõ giọng nói chuẩn studio</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={speechEnhance}
                      onChange={(e) => setSpeechEnhance(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* AI Emoji Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">AI emoji</div>
                      <div className="text-[10px] text-slate-400">Tự hiện icon cảm xúc phía trên từ đang đọc</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiEmoji}
                      onChange={(e) => setAiEmoji(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* AI Keywords Highlighter Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">AI keywords highlighter</div>
                      <div className="text-[10px] text-slate-400">Tự động tô màu nổi bật từ khóa viral</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={highlightKeywords}
                      onChange={(e) => setHighlightKeywords(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto Transitions Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Auto transitions</div>
                      <div className="text-[10px] text-slate-400">Tự động chèn chuyển cảnh tại các điểm cắt</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoTransitions}
                      onChange={(e) => setAutoTransitions(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Speaker Colors Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Speaker colors</div>
                      <div className="text-[10px] text-slate-400">Phân biệt màu sắc lời thoại từng người</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={speakerColors}
                      onChange={(e) => setSpeakerColors && setSpeakerColors(e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Video Dubbing Dropdown */}
                  <div className="p-2.5 bg-[#171926] border border-[#262a3d] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Languages className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Video dubbing (Lồng tiếng AI)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={dubbingLang}
                        onChange={(e) => setDubbingLang(e.target.value)}
                        className="flex-1 bg-[#10121a] border border-[#272b3d] text-white text-xs rounded-lg px-2.5 py-1"
                      >
                        <option value="en">Tiếng Anh (English)</option>
                        <option value="zh">Tiếng Trung (Mandarin)</option>
                        <option value="ja">Tiếng Nhật (Japanese)</option>
                        <option value="ko">Tiếng Hàn (Korean)</option>
                        <option value="fr">Tiếng Pháp (French)</option>
                      </select>
                      <button
                        onClick={() => {
                          setIsDubbing(true);
                          setTimeout(() => {
                            setIsDubbing(false);
                            alert(`Đã hoàn tất tạo bản audio lồng tiếng: ${dubbingLang.toUpperCase()}`);
                          }, 1200);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1"
                      >
                        {isDubbing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>{isDubbing ? 'Đang dịch...' : 'Bắt đầu'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 2: CAPTIONS (PRESETS, FONT & EFFECTS)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'captions' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex border-b border-[#212435] pb-2 text-xs font-semibold">
              <button 
                onClick={() => setCaptionSubTab('presets')}
                className={`flex-1 text-center pb-1 transition-all ${captionSubTab === 'presets' ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
              >
                Presets
              </button>
              <button 
                onClick={() => setCaptionSubTab('font')}
                className={`flex-1 text-center pb-1 transition-all ${captionSubTab === 'font' ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
              >
                Font
              </button>
              <button 
                onClick={() => setCaptionSubTab('effects')}
                className={`flex-1 text-center pb-1 transition-all ${captionSubTab === 'effects' ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
              >
                Effects
              </button>
            </div>

            {/* PRESETS SUBTAB */}
            {captionSubTab === 'presets' && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white mb-1">Mẫu Phụ Đề Nổi Bật</div>
                {captionPresetsList.map((preset) => {
                  const isSelected = fontStyle.highlightColor === preset.style.highlightColor && fontStyle.fontFamily === preset.style.fontFamily;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected ? 'bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-[#161826] hover:bg-[#202336] border-[#272b40]'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-indigo-300 flex items-center gap-1.5">
                          <span>{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400">{preset.desc}</div>
                      </div>
                      <span className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: preset.style.highlightColor }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* FONT SUBTAB */}
            {captionSubTab === 'font' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between font-bold text-white text-xs">
                  <span>Font settings</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kho 22+ Fonts Viral</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => updateFont('fontFamily', e.target.value)}
                    className="w-full bg-[#181a26] border border-[#272b3f] text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-500"
                  >
                    {VIRAL_FONTS.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 flex items-center gap-2 bg-[#181a26] border border-[#272b3f] rounded-xl px-2.5 py-1.5">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => updateFont('textColor', e.target.value)}
                      className="w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => updateFont('fontSize', parseInt(e.target.value) || 40)}
                      className="w-10 bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                    />
                    <span className="text-slate-500 text-[11px]">px</span>
                  </div>

                  <div className="col-span-6">
                    <select
                      value={fontWeight}
                      onChange={(e) => updateFont('fontWeight', e.target.value)}
                      className="w-full bg-[#181a26] border border-[#272b3f] text-white rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Black">Black (Đậm nhất)</option>
                      <option value="Bold">Bold (Đậm)</option>
                      <option value="SemiBold">SemiBold</option>
                      <option value="Medium">Medium</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300 font-medium">Decoration</span>
                  <div className="flex items-center gap-2 text-slate-300">
                    <button
                      onClick={() => updateFont('isItalic', !isItalic)}
                      className={`p-1.5 rounded-lg border transition-all ${isItalic ? 'bg-brand-600 border-brand-500 text-white' : 'border-[#272b3f] hover:bg-[#1f2233]'}`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateFont('isUnderline', !isUnderline)}
                      className={`p-1.5 rounded-lg border transition-all ${isUnderline ? 'bg-brand-600 border-brand-500 text-white' : 'border-[#272b3f] hover:bg-[#1f2233]'}`}
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300 font-medium">Uppercase</span>
                  <input
                    type="checkbox"
                    checked={isUppercase}
                    onChange={(e) => updateFont('isUppercase', e.target.checked)}
                    className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300 font-medium">Font stroke</span>
                  <div className="flex items-center gap-2 bg-[#181a26] border border-[#272b3f] rounded-xl px-2.5 py-1">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => updateFont('strokeColor', e.target.value)}
                      className="w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="number"
                      value={strokeWidth}
                      onChange={(e) => updateFont('strokeWidth', parseInt(e.target.value) || 0)}
                      className="w-8 bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                    />
                    <span className="text-slate-500 text-[11px]">px</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-[#202334]">
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-300 font-medium">AI keywords highlighter</span>
                    <input
                      type="checkbox"
                      checked={hasHighlight}
                      onChange={(e) => updateFont('hasHighlight', e.target.checked)}
                      className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div 
                      onClick={() => updateFont('highlightColor', '#04f827')}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        highlightColor === '#04f827' ? 'bg-emerald-950/40 border border-emerald-500' : 'bg-[#181a26] border border-[#272b3f] hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#04f827]" />
                        <span className="font-mono text-white text-[11px]">04f827FF (Xanh Neon)</span>
                      </div>
                      {highlightColor === '#04f827' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>

                    <div 
                      onClick={() => updateFont('highlightColor', '#FFFD03')}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        highlightColor === '#FFFD03' ? 'bg-yellow-950/40 border border-yellow-500' : 'bg-[#181a26] border border-[#272b3f] hover:border-yellow-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#FFFD03]" />
                        <span className="font-mono text-white text-[11px]">FFFD03FF (Vàng Sáng)</span>
                      </div>
                      {highlightColor === '#FFFD03' && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </div>

                    <div 
                      onClick={() => updateFont('highlightColor', '#FF007A')}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        highlightColor === '#FF007A' ? 'bg-pink-950/40 border border-pink-500' : 'bg-[#181a26] border border-[#272b3f] hover:border-pink-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#FF007A]" />
                        <span className="font-mono text-white text-[11px]">FF007AFF (Hồng Neon)</span>
                      </div>
                      {highlightColor === '#FF007A' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EFFECTS SUBTAB */}
            {captionSubTab === 'effects' && (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white mb-1">Hiệu Ứng Hoạt Họa Phụ Đề</div>
                {[
                  { id: 'pop', name: 'Pop In Scale Bounce (MrBeast)', desc: 'Chữ nảy phóng to 1.15x khi phát âm' },
                  { id: 'pill', name: 'Alex Hormozi Pill-Box', desc: 'Hộp nền vàng/đỏ bo góc ôm từ đang đọc' },
                  { id: 'glow', name: 'Cyberpunk Neon Glow', desc: 'Tỏa sáng hào quang neon rực rỡ' },
                  { id: 'wave', name: 'Karaoke Color Wave', desc: 'Sóng màu quét từ trái qua phải' },
                  { id: 'slide', name: 'Smooth Slide Up', desc: 'Trượt mượt mà từng dòng' }
                ].map((eff) => (
                  <div
                    key={eff.id}
                    onClick={() => {
                      if (setCaptionEffect) setCaptionEffect(eff.id);
                      if (setFontStyle) setFontStyle(prev => ({ ...prev, effect: eff.id }));
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      (fontStyle?.effect || captionEffect) === eff.id ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-[#161826] hover:bg-[#202336] border-[#272b40]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{eff.name}</div>
                      <div className="text-[10px] text-slate-400">{eff.desc}</div>
                    </div>
                    {(fontStyle?.effect || captionEffect) === eff.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 3: MEDIA (LOGO THƯƠNG HIỆU & NHẠC NỀN)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'media' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                <span>Media & Logo Thương Hiệu</span>
              </h3>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">Kéo thả tự do</span>
            </div>

            {/* 1. Logo Upload & Controls */}
            <div className="p-3.5 bg-[#171926] border border-[#272b40] rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#222638]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Logo / Sticker Thương Hiệu</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={brandConfig?.showLogo ?? true}
                    onChange={(e) => setBrandConfig && setBrandConfig({ ...brandConfig, showLogo: e.target.checked })}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <span className="text-slate-300 text-[11px]">Hiển thị</span>
                </label>
              </div>

              {/* Upload button & preview */}
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl bg-[#10121a] border-2 border-dashed border-[#2f334a] hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden shrink-0 group relative"
                >
                  {brandConfig?.logoUrl ? (
                    <img src={brandConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                      <span className="text-[8px] text-slate-400 mt-1">Tải Logo</span>
                    </>
                  )}
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('http://127.0.0.1:8000/api/upload-media', {
                          method: 'POST',
                          body: formData
                        });
                        if (res.ok) {
                          const resJson = await res.json();
                          setBrandConfig && setBrandConfig({ ...brandConfig, logoUrl: resJson.file_url, showLogo: true });
                          return;
                        }
                      } catch (err) {}
                      const url = URL.createObjectURL(file);
                      setBrandConfig && setBrandConfig({ ...brandConfig, logoUrl: url, showLogo: true });
                    }
                  }}
                  className="hidden"
                />

                <div className="flex-1 space-y-1.5">
                  <div className="text-[11px] font-bold text-white">
                    {brandConfig?.logoUrl ? "Đã tải Logo hình ảnh" : "Chưa tải ảnh (Dùng chữ / Slogan)"}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                    >
                      + Tải ảnh mới
                    </button>
                    {brandConfig?.logoUrl && (
                      <button
                        onClick={() => setBrandConfig && setBrandConfig({ ...brandConfig, logoUrl: null })}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-[10px]"
                      >
                        Xóa Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Slogan / Brand Text */}
              <div>
                <span className="text-slate-400 text-[10px]">Tên thương hiệu / Slogan chữ:</span>
                <input
                  type="text"
                  value={brandConfig?.logoText || ''}
                  onChange={(e) => setBrandConfig && setBrandConfig({ ...brandConfig, logoText: e.target.value })}
                  placeholder="OPUS STUDIO"
                  className="w-full bg-[#10121a] border border-[#272b3d] text-white rounded-lg px-2.5 py-1 text-xs mt-1 font-bold"
                />
              </div>

              {/* Logo Size & Opacity */}
              <div className="space-y-2 pt-1 border-t border-[#202334]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Kích thước Logo:</span>
                  <span className="font-mono text-indigo-400">{brandConfig?.logoSize || 65}px</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="140"
                  value={brandConfig?.logoSize || 65}
                  onChange={(e) => setBrandConfig && setBrandConfig({ ...brandConfig, logoSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none accent-indigo-500 cursor-pointer"
                />

                <div className="flex items-center justify-between text-slate-300">
                  <span>Độ mờ đục:</span>
                  <span className="font-mono text-indigo-400">{brandConfig?.logoOpacity || 90}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brandConfig?.logoOpacity || 90}
                  onChange={(e) => setBrandConfig && setBrandConfig({ ...brandConfig, logoOpacity: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Drag tip */}
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-300 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 shrink-0" />
                <span>Kéo thả Logo tự do: Bấm & giữ Logo trực tiếp trên khung video xem trước để dời vị trí.</span>
              </div>
            </div>

            {/* 2. Background Music Selector (Kích hoạt phát & tải nhạc nền) */}
            <div className="p-3.5 bg-[#171926] border border-[#272b40] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <span>Kho Nhạc Nền (BGM)</span>
                </div>
                <button
                  onClick={() => bgmFileInputRef.current?.click()}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-[9px] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tải nhạc từ máy</span>
                </button>
                <input
                  ref={bgmFileInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a,audio/aac"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && setCustomBgmList && setSelectedBgm) {
                      const url = URL.createObjectURL(file);
                      const newTrack = {
                        id: `custom_bgm_${Date.now()}`,
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        bpm: 'Tự tải lên',
                        duration: 'Audio',
                        url: url,
                        isCustom: true
                      };
                      setCustomBgmList(prev => [newTrack, ...prev]);
                      setSelectedBgm(newTrack.id);
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="space-y-1.5">
                {/* 1. Mute / No BGM option */}
                <div
                  onClick={() => setSelectedBgm && setSelectedBgm('none')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedBgm === 'none' ? 'bg-slate-800/90 border-slate-400 text-white shadow-md' : 'bg-[#12131e] border-[#222638] text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="font-bold text-xs">🔇 Không dùng nhạc nền (Tắt BGM)</div>
                  {selectedBgm === 'none' && <Check className="w-4 h-4 text-white" />}
                </div>

                {/* 2. Custom Uploaded Tracks */}
                {customBgmList.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedBgm && setSelectedBgm(track.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedBgm === track.id ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md ring-1 ring-emerald-400' : 'bg-[#12131e] border-[#25283c] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="font-bold text-xs text-emerald-300 truncate">🎵 {track.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Nhạc tải lên từ máy</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedBgm === track.id && <Check className="w-4 h-4 text-emerald-400" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setCustomBgmList) setCustomBgmList(prev => prev.filter(t => t.id !== track.id));
                          if (selectedBgm === track.id && setSelectedBgm) setSelectedBgm('none');
                        }}
                        className="p-1 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 3. Stock Tracks */}
                {bgmTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedBgm && setSelectedBgm(track.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedBgm === track.id ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md ring-1 ring-emerald-400' : 'bg-[#12131e] border-[#25283c] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{track.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{track.bpm} • {track.duration}</div>
                    </div>
                    {selectedBgm === track.id && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                ))}
              </div>

              {selectedBgm !== 'none' && (
                <div className="space-y-1 pt-2 border-t border-[#222638]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Âm lượng nhạc nền:</span>
                    <span className="font-mono text-emerald-400">{bgmVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume && setBgmVolume(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#25283a] rounded-lg appearance-none accent-emerald-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 4: BRAND TEMPLATE (KHO TEMPLATE NGƯỜI DÙNG)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'brand' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Kho Template Người Dùng</span>
              </h3>
              <span className="text-[10px] text-amber-400 font-mono font-bold">{userTemplates.length} Mẫu</span>
            </div>

            {/* Template Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveCurrentAsTemplate}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Lưu Mẫu Mới</span>
              </button>

              <button
                onClick={() => templateInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-[#1c1f30] hover:bg-[#252940] border border-[#2e334d] text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nhập File (.json)</span>
              </button>

              <input
                ref={templateInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportTemplateFile}
                className="hidden"
              />
            </div>

            {/* User Templates List */}
            <div className="space-y-2.5">
              <div className="text-slate-400 text-[11px] font-bold">Danh sách Mẫu Template:</div>

              {userTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-3 bg-[#161826] border border-[#272b40] hover:border-amber-500/60 rounded-2xl transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white group-hover:text-amber-300 flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                      <span>{tmpl.name}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#202336] text-slate-400 font-mono">
                      {tmpl.createdAt}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug">
                    {tmpl.desc}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#222538]">
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <Check className="w-3 h-3" />
                      <span>Áp dụng mẫu</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleExportTemplate(e, tmpl)}
                        title="Tải template về máy tính (.json)"
                        className="p-1.5 rounded-lg bg-[#1e2133] hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {tmpl.isCustom && (
                        <button
                          onClick={(e) => handleDeleteTemplate(e, tmpl.id)}
                          title="Xóa template này"
                          className="p-1.5 rounded-lg bg-[#1e2133] hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 5: B-ROLL (KHO TƯ LIỆU & QUẢN LÝ B-ROLL TRÊN CLIP)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'broll' && (
          <div className="space-y-4 font-sans text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <span>B-Roll Minh Họa</span>
              </h3>
              {brolls && brolls.length > 0 && (
                <span className="bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {brolls.length} B-Roll
                </span>
              )}
            </div>

            {/* AI Auto B-Roll Card */}
            <div className="p-3 bg-[#171926] border border-[#272b40] rounded-2xl space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#222638]">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tự Động Chèn B-Roll AI</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoBroll}
                  onChange={(e) => setAutoBroll && setAutoBroll(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                AI sẽ tự động phân tích câu thoại để gắn hình ảnh/video B-Roll minh họa phù hợp ngữ cảnh.
              </p>
            </div>

            {/* Mở Kho B-Roll Button */}
            <div className="space-y-2">
              <button
                onClick={() => onOpenBrollPicker && onOpenBrollPicker()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Mở Kho Tư Liệu B-Roll / Tải Lên</span>
              </button>
            </div>

            {/* Danh Sách B-Roll Đang Có Trên Clip */}
            {brolls && brolls.length > 0 && (
              <div className="p-3 bg-[#171926] border border-[#272b40] rounded-2xl space-y-2.5">
                <div className="font-bold text-white text-xs flex items-center justify-between">
                  <span>B-Roll Trên Video Này:</span>
                  <span className="text-[10px] text-slate-400 font-mono">{brolls.length} mục</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {brolls.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className="p-2.5 rounded-xl bg-[#12131e] border border-[#24283c] hover:border-amber-500/50 space-y-2 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/30">
                            {b.thumb || '🎬'}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-white text-xs truncate">{b.title || `B-Roll #${idx + 1}`}</div>
                            <div className="text-[10px] text-amber-400 font-mono">
                              {((b.start ?? 0)).toFixed(1)}s ➔ {((b.end ?? 4)).toFixed(1)}s ({(Math.max(0.5, (b.end ?? 4) - (b.start ?? 0))).toFixed(1)}s)
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteBroll && onDeleteBroll(b.id)}
                          title="Xóa B-Roll này"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Layout Style Selector */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#1e2235] text-[10px]">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Kiểu khung B-Roll:</span>
                          <select
                            value={b.style || 'split_50_50_top'}
                            onChange={(e) => onUpdateBroll && onUpdateBroll(b.id, { style: e.target.value })}
                            className="w-full bg-[#181a26] border border-[#2b3048] text-white rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="split_50_50_top">Chia đôi (Trên)</option>
                            <option value="split_50_50_bottom">Chia đôi (Dưới)</option>
                            <option value="split_30_70_top">Tỉ lệ 30:70</option>
                            <option value="full_cover">Toàn màn hình</option>
                            <option value="pip">Khung nổi PiP</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-slate-400 block mb-0.5">Chuyển cảnh vào:</span>
                          <select
                            value={b.enterTransition || 'zoom_in'}
                            onChange={(e) => onUpdateBroll && onUpdateBroll(b.id, { enterTransition: e.target.value })}
                            className="w-full bg-[#181a26] border border-[#2b3048] text-white rounded-lg px-2 py-1 focus:outline-none"
                          >
                            <option value="zoom_in">Zoom In Punch</option>
                            <option value="fade_in">Fade In</option>
                            <option value="slide_up">Slide Up</option>
                            <option value="none">Hard Cut</option>
                          </select>
                        </div>
                      </div>

                      {/* B-Roll Volume Control Slider */}
                      <div className="pt-1.5 border-t border-[#1e2235] space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Volume2 className="w-3 h-3 text-amber-400" />
                            <span>Âm lượng video B-Roll:</span>
                          </span>
                          <span className="font-bold text-amber-300 font-mono">
                            {(b.volume !== undefined ? b.volume : 0) === 0 ? '🔇 Tắt tiếng (Mute)' : `${b.volume}%`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={b.volume !== undefined ? b.volume : 0}
                            onChange={(e) => onUpdateBroll && onUpdateBroll(b.id, { volume: parseInt(e.target.value, 10) })}
                            className="w-full h-1.5 bg-[#181a26] rounded-lg accent-amber-500 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateBroll && onUpdateBroll(b.id, { volume: (b.volume || 0) > 0 ? 0 : 20 })}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                              (b.volume || 0) === 0 ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'bg-[#181a26] border-[#2b3048] text-slate-400'
                            }`}
                          >
                            {(b.volume || 0) === 0 ? 'Muted' : 'Mute'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 6: TRANSITIONS (CHUYỂN CẢNH ĐIỂM CẮT)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'transitions' && (
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <InfinityIcon className="w-4 h-4 text-amber-400" />
                <span>Transitions (Chuyển Cảnh)</span>
              </h3>
              {clip?.scenes && clip.scenes.length > 1 && (
                <span className="bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  {clip.scenes.length - 1} Điểm Cắt
                </span>
              )}
            </div>

            {/* Hiển thị phân cảnh đang được chọn */}
            {clip?.scenes && clip.scenes.length > 1 && selectedTransitionSceneId ? (
              <div className="p-3 bg-[#171926] border border-amber-500/50 rounded-2xl">
                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Đang chỉnh hiệu ứng cho: <span className="text-white">{clip.scenes.find(s => s.id === selectedTransitionSceneId)?.title || 'Phân cảnh'}</span></span>
                </div>
              </div>
            ) : clip?.scenes && clip.scenes.length > 1 ? (
              <div className="p-3 bg-[#171926] border border-[#272b40] rounded-2xl text-[11px] text-slate-400">
                <span>Bấm vào badge <strong className="text-amber-400">⚡</strong> trên Timeline để chọn phân cảnh cần đổi hiệu ứng.</span>
              </div>
            ) : (
              <div className="p-3 bg-[#171926] border border-[#272b40] rounded-2xl text-[11px] text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-200">Hiệu Ứng Chuyển Cảnh Chung:</div>
                <p className="text-[10px] leading-relaxed">
                  Bấm nút <strong>Cắt Phân Cảnh (Split / Cây kéo)</strong> trên Timeline để chia đôi đoạn và chèn các chuyển cảnh độc lập tại từng vị trí.
                </p>
              </div>
            )}

            {/* 2. Full Transitions Cards Library */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-300">Thư Viện Hiệu Ứng Chuyển Cảnh</div>
              <div className="grid grid-cols-1 gap-2">
                {transitionsList.map((trans) => {
                  const targetScene = clip?.scenes?.find(s => s.id === selectedTransitionSceneId) || (clip?.scenes && clip.scenes[0]);
                  const isSelected = targetScene ? (targetScene.transition || 'none') === trans.id : activeTransition === trans.id;

                  return (
                    <div
                      key={trans.id}
                      onClick={() => {
                        if (targetScene && onUpdateSceneTransition) {
                          onUpdateSceneTransition(targetScene.id, trans.id);
                        } else if (setActiveTransition) {
                          setActiveTransition(trans.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-amber-950/50 border-amber-500 text-white ring-2 ring-amber-500 shadow-lg' 
                          : 'bg-[#151724] hover:bg-[#1f2235] border-[#25283c] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1c1e2e] border border-white/10 flex items-center justify-center font-bold text-[10px] text-amber-400 shrink-0">
                          {trans.id.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">
                            {trans.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {trans.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold shrink-0 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 7: CHỮ TÙY BIẾN (GỌN GÀNG, CLICK-TO-PLACE, 22 FONTS, IN/OUT ANIMATION)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'text' && (
          <div className="space-y-3.5 font-sans text-xs animate-fade-in">
            {/* Header with Sub-tab Switcher */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Type className="w-4 h-4 text-indigo-400" />
                <span>Lớp Chữ & Tiêu Đề</span>
              </h3>
              <div className="flex items-center bg-[#151724] p-0.5 rounded-xl border border-[#262a3e]">
                <button
                  onClick={() => setTextMainSubTab('title')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                    textMainSubTab === 'title'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  <span>Tiêu Đề Hook</span>
                </button>
                <button
                  onClick={() => setTextMainSubTab('layer')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                    textMainSubTab === 'layer'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  <span>Lớp Chữ Tự Do</span>
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                SUBTAB 1: TIÊU ĐỀ HOOK (TITLE CARD & STYLES)
               ═══════════════════════════════════════════════════ */}
            {textMainSubTab === 'title' && (
              <div className="space-y-3 animate-fade-in">
                {/* 1. Toggle Bật/Tắt Tiêu Đề & Input Sửa Chữ */}
                <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={titleConfig?.visible !== false}
                        onChange={(e) => {
                          setTitleConfig && setTitleConfig(prev => ({
                            ...prev,
                            visible: e.target.checked
                          }));
                        }}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="font-bold text-white text-xs">Hiển thị Tiêu Đề Hook trên Video</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30">
                      👑 Thu hút 3s đầu
                    </span>
                  </div>

                  {/* Input sửa nội dung tiêu đề */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Nội dung Tiêu Đề:</span>
                    <input
                      type="text"
                      value={customTitle || ''}
                      onChange={(e) => {
                        if (setCustomTitle) setCustomTitle(e.target.value);
                      }}
                      placeholder="Gõ tiêu đề hấp dẫn cho clip..."
                      className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 2. Bộ Sưu Tập Kiểu Tiêu Đề (Title Preset Styles) */}
                <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chọn Kiểu / Phong Cách Tiêu Đề:</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: 'gradient_gold',
                        name: 'Hoàng Kim Gradient',
                        desc: 'Nền vàng ánh kim sang trọng, chữ đen in đậm',
                        icon: '👑',
                        badge: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border-amber-300'
                      },
                      {
                        id: 'pill_white',
                        name: 'Tối Giản Pill White',
                        desc: 'Khung trắng bo tròn hiện đại phong cách Alex Hormozi',
                        icon: '💊',
                        badge: 'bg-white text-black border-slate-200'
                      },
                      {
                        id: 'neon_cyber',
                        name: 'Cyberpunk Neon',
                        desc: 'Nền đen bóng viền xanh ngọc Neon phát sáng',
                        icon: '🟢',
                        badge: 'bg-black text-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                      },
                      {
                        id: 'yellow_impact',
                        name: 'Yellow Impact',
                        desc: 'Chữ vàng viền đen dày nổi bật không nền',
                        icon: '⚡',
                        badge: 'bg-black/90 text-yellow-300 border-yellow-400'
                      },
                      {
                        id: 'header_indigo',
                        name: 'Banner Indigo',
                        desc: 'Banner tím xanh hiện đại tinh tế cho chuyên gia',
                        icon: '🏷️',
                        badge: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400'
                      }
                    ].map(preset => {
                      const isSelected = (titleConfig?.style || 'gradient_gold') === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setTitleConfig && setTitleConfig(prev => ({
                              ...prev,
                              style: preset.id
                            }));
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/80 shadow-lg'
                              : 'bg-[#10121a] border-[#25293d] hover:border-amber-400/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="text-base">{preset.icon}</span>
                            <div className="truncate">
                              <div className="font-bold text-white text-xs">{preset.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider shrink-0 ${preset.badge}`}>
                            Mẫu
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Tùy Chỉnh Định Dạng Kiểu Chữ Tiêu Đề */}
                <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Định Dạng Font & Kích Thước Tiêu Đề:</span>
                  </span>

                  {/* Font chữ & Độ phóng to (Scale) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Font chữ:</span>
                      <select
                        value={titleConfig?.fontFamily || 'Montserrat'}
                        onChange={(e) => {
                          setTitleConfig && setTitleConfig(prev => ({
                            ...prev,
                            fontFamily: e.target.value
                          }));
                        }}
                        className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-amber-500"
                      >
                        {VIRAL_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Tỉ lệ Zoom ({titleConfig?.scale ?? 100}%):</span>
                      <input
                        type="range"
                        min="50"
                        max="160"
                        value={titleConfig?.scale ?? 100}
                        onChange={(e) => {
                          setTitleConfig && setTitleConfig(prev => ({
                            ...prev,
                            scale: parseInt(e.target.value)
                          }));
                        }}
                        className="w-full h-1.5 bg-[#25293d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Chiều rộng khung & Chiều cao đệm (Padding) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e2235]">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Chiều rộng khung ({titleConfig?.boxWidth ?? 280}px):</span>
                      <input
                        type="range"
                        min="160"
                        max="420"
                        value={titleConfig?.boxWidth ?? 280}
                        onChange={(e) => {
                          setTitleConfig && setTitleConfig(prev => ({
                            ...prev,
                            boxWidth: parseInt(e.target.value)
                          }));
                        }}
                        className="w-full h-1.5 bg-[#25293d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Độ đệm viền ({titleConfig?.paddingY ?? 6}px):</span>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={titleConfig?.paddingY ?? 6}
                        onChange={(e) => {
                          setTitleConfig && setTitleConfig(prev => ({
                            ...prev,
                            paddingY: parseInt(e.target.value)
                          }));
                        }}
                        className="w-full h-1.5 bg-[#25293d] rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Reset Position Button */}
                  <button
                    onClick={() => {
                      setTitleConfig && setTitleConfig(prev => ({
                        ...prev,
                        pos: { x: 50, y: 10 },
                        scale: 100,
                        boxWidth: 280,
                        paddingY: 6
                      }));
                    }}
                    className="w-full py-1.5 rounded-xl bg-[#202438] hover:bg-[#2c324e] text-slate-300 hover:text-white text-[10px] font-bold transition flex items-center justify-center gap-1"
                  >
                    <Move className="w-3 h-3" />
                    <span>Đặt lại vị trí giữa trên (X: 50%, Y: 10%)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
                SUBTAB 2: LỚP CHỮ TỰ DO (CUSTOM TEXT LAYERS)
               ═══════════════════════════════════════════════════ */}
            {textMainSubTab === 'layer' && (
              <div className="space-y-3.5 animate-fade-in">
                {/* 1. Nút Click-to-Place (Nhấp vào Video để đặt chữ) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (isPlacingTextMode) {
                        if (onCancelPlaceText) onCancelPlaceText();
                      } else {
                        if (onStartPlaceTextMode) {
                          onStartPlaceTextMode({
                            text: customTextInput.trim() || 'VĂN BẢN MỚI',
                            style: selectedTextStyle,
                            fontFamily: customTextFont,
                            fontSize: customTextSize,
                            textColor: customTextColor,
                            fontWeight: customTextWeight,
                            strokeColor: customTextStrokeColor,
                            strokeWidth: customTextStrokeWidth,
                            hasShadow: customTextHasShadow,
                            shadowColor: customTextShadowColor,
                            isUppercase: customTextUppercase,
                            animIn: customTextAnimIn,
                            animInDuration: customTextAnimInDur,
                            animOut: customTextAnimOut,
                            animOutDuration: customTextAnimOutDur
                          });
                        }
                      }
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      isPlacingTextMode
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>{isPlacingTextMode ? '📍 Đang Chờ Nhấp Video' : '📍 Nhấp Video Đặt Chữ'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onAddTextLayer && onAddTextLayer(customTextInput.trim() || 'VĂN BẢN MỚI', selectedTextStyle, {
                        fontFamily: customTextFont,
                        fontSize: customTextSize,
                        textColor: customTextColor,
                        fontWeight: customTextWeight,
                        strokeColor: customTextStrokeColor,
                        strokeWidth: customTextStrokeWidth,
                        hasShadow: customTextHasShadow,
                        shadowColor: customTextShadowColor,
                        isUppercase: customTextUppercase,
                        animIn: customTextAnimIn,
                        animInDuration: customTextAnimInDur,
                        animOut: customTextAnimOut,
                        animOutDuration: customTextAnimOutDur
                      });
                      setCustomTextInput('');
                    }}
                    className="py-2 px-2 rounded-xl bg-[#202438] hover:bg-[#2c324e] text-indigo-300 hover:text-white font-bold text-[11px] border border-[#313650] transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm Ở Giữa</span>
                  </button>
                </div>

                {/* 2. Khung Nhập Chữ & Chọn Kiểu Khung */}
                <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2.5">
                  {editingTextId && (
                    <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-500/50 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-bold text-white truncate">Đang sửa: "{customTextInput || 'Lớp chữ'}"</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTextId(null);
                          if (setSelectedTextLayerId) setSelectedTextLayerId(null);
                          setCustomTextInput('');
                        }}
                        className="px-2 py-0.5 rounded bg-[#25293d] hover:bg-[#343b56] text-slate-200 text-[10px] font-bold shrink-0 transition"
                      >
                        + Tạo mới
                      </button>
                    </div>
                  )}

                  {/* Input text */}
                  <div>
                    <input
                      type="text"
                      value={customTextInput}
                      onChange={(e) => {
                        setCustomTextInput(e.target.value);
                        if (editingTextId && onUpdateTextLayer) {
                          onUpdateTextLayer(editingTextId, { text: e.target.value });
                        }
                      }}
                      placeholder="Gõ nội dung chữ muốn chèn..."
                      className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Kiểu hiển thị khung */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Kiểu khung:</span>
                      <select
                        value={selectedTextStyle}
                        onChange={(e) => {
                          setSelectedTextStyle(e.target.value);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { style: e.target.value });
                          }
                        }}
                        className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="plain">⭐ Chữ Thuần (Plain)</option>
                        <option value="header">🏷️ Header Indigo</option>
                        <option value="neon_tag">🟢 Neon Cyber</option>
                        <option value="gradient_badge">👑 Gold Banner</option>
                        <option value="callout_box">💬 Callout Glass</option>
                        <option value="yellow_impact">⚡ Yellow Impact</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Font chữ:</span>
                      <select
                        value={customTextFont}
                        onChange={(e) => {
                          setCustomTextFont(e.target.value);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { fontFamily: e.target.value });
                          }
                        }}
                        className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        {VIRAL_FONTS.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Màu sắc & Cỡ chữ */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1e2235]">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Màu chữ:</span>
                      <div className="flex items-center gap-1.5 bg-[#0d0f17] border border-[#2a2e44] rounded-lg px-1.5 py-0.5">
                        <input
                          type="color"
                          value={customTextColor}
                          onChange={(e) => {
                            setCustomTextColor(e.target.value);
                            if (editingTextId && onUpdateTextLayer) {
                              onUpdateTextLayer(editingTextId, { textColor: e.target.value });
                            }
                          }}
                          className="w-4 h-4 rounded-full border-0 cursor-pointer bg-transparent"
                        />
                        <span className="font-mono text-white text-[10px] font-bold">{customTextColor}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Cỡ chữ:</span>
                      <div className="flex items-center bg-[#0d0f17] border border-[#2a2e44] rounded-lg px-2 py-0.5">
                        <input
                          type="number"
                          min="20"
                          max="120"
                          value={customTextSize}
                          onChange={(e) => {
                            const sz = parseInt(e.target.value) || 42;
                            setCustomTextSize(sz);
                            if (editingTextId && onUpdateTextLayer) {
                              onUpdateTextLayer(editingTextId, { fontSize: sz });
                            }
                          }}
                          className="w-full bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                        />
                        <span className="text-slate-500 text-[10px]">px</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Viền chữ:</span>
                      <div className="flex items-center gap-1 bg-[#0d0f17] border border-[#2a2e44] rounded-lg px-1.5 py-0.5">
                        <input
                          type="color"
                          value={customTextStrokeColor}
                          onChange={(e) => {
                            setCustomTextStrokeColor(e.target.value);
                            if (editingTextId && onUpdateTextLayer) {
                              onUpdateTextLayer(editingTextId, { strokeColor: e.target.value });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded-full border-0 cursor-pointer bg-transparent"
                        />
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={customTextStrokeWidth}
                          onChange={(e) => {
                            const sw = parseInt(e.target.value) || 0;
                            setCustomTextStrokeWidth(sw);
                            if (editingTextId && onUpdateTextLayer) {
                              onUpdateTextLayer(editingTextId, { strokeWidth: sw });
                            }
                          }}
                          className="w-6 bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* In hoa & Đổ bóng checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={customTextUppercase}
                        onChange={(e) => {
                          setCustomTextUppercase(e.target.checked);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { isUppercase: e.target.checked });
                          }
                        }}
                        className="w-3 h-3 accent-indigo-500 rounded"
                      />
                      <span>IN HOA</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={customTextHasShadow}
                        onChange={(e) => {
                          setCustomTextHasShadow(e.target.checked);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { hasShadow: e.target.checked });
                          }
                        }}
                        className="w-3 h-3 accent-indigo-500 rounded"
                      />
                      <span>Đổ bóng 3D</span>
                    </label>
                  </div>
                </div>

                {/* 3. Hiệu Ứng Chuyển Động In & Out */}
                <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Hiệu Ứng Chuyển Động (In & Out Animation)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {/* In Animation */}
                    <div>
                      <span className="text-slate-400 block mb-0.5">Xuất hiện (In):</span>
                      <select
                        value={customTextAnimIn}
                        onChange={(e) => {
                          setCustomTextAnimIn(e.target.value);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { animIn: e.target.value });
                          }
                        }}
                        className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        <option value="pop">⚡ Pop Nảy</option>
                        <option value="fade_in">✨ Fade In</option>
                        <option value="slide_up">⬆️ Slide Up</option>
                        <option value="slide_left">➡️ Slide Left</option>
                        <option value="typewriter">⌨️ Đánh máy</option>
                        <option value="bounce">🎾 Bounce</option>
                        <option value="none">🚫 Không</option>
                      </select>
                    </div>

                    {/* Out Animation */}
                    <div>
                      <span className="text-slate-400 block mb-0.5">Biến mất (Out):</span>
                      <select
                        value={customTextAnimOut}
                        onChange={(e) => {
                          setCustomTextAnimOut(e.target.value);
                          if (editingTextId && onUpdateTextLayer) {
                            onUpdateTextLayer(editingTextId, { animOut: e.target.value });
                          }
                        }}
                        className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500"
                      >
                        <option value="fade_out">✨ Fade Out</option>
                        <option value="zoom_out">🔍 Zoom Out</option>
                        <option value="slide_down">⬇️ Slide Down</option>
                        <option value="slide_right">➡️ Slide Right</option>
                        <option value="none">🚫 Không</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Danh Sách Các Lớp Chữ Hiện Có */}
                {textLayers && textLayers.length > 0 && (
                  <div className="p-3 bg-[#151724] border border-[#262a3e] rounded-2xl space-y-2">
                    <div className="font-bold text-white text-xs flex items-center justify-between">
                      <span>Các Lớp Chữ Đang Có ({textLayers.length}):</span>
                      <span className="text-[10px] text-slate-400">Nhấp để chỉnh sửa</span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {textLayers.map((tl, idx) => {
                        const textObj = typeof tl === 'string' ? { id: `tl_${idx}`, text: tl } : tl;
                        const isSelectedForEdit = editingTextId === (textObj.id || idx);

                        return (
                          <div
                            key={textObj.id || idx}
                            onClick={() => {
                              setEditingTextId(textObj.id || idx);
                              if (setSelectedTextLayerId) setSelectedTextLayerId(textObj.id || idx);
                              setCustomTextInput(textObj.text || '');
                              setSelectedTextStyle(textObj.style || 'plain');
                              setCustomTextFont(textObj.fontFamily || 'Montserrat');
                              setCustomTextSize(textObj.fontSize || 42);
                              setCustomTextColor(textObj.textColor || '#ffffff');
                              setCustomTextWeight(textObj.fontWeight || 'Black');
                              setCustomTextStrokeColor(textObj.strokeColor || '#000000');
                              setCustomTextStrokeWidth(textObj.strokeWidth ?? 6);
                              setCustomTextHasShadow(textObj.hasShadow ?? true);
                              setCustomTextShadowColor(textObj.shadowColor || '#000000');
                              setCustomTextUppercase(textObj.isUppercase ?? true);
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                              isSelectedForEdit
                                ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500 text-white'
                                : 'bg-[#10121a] border-[#25293d] hover:border-indigo-500/50 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[9px] ${
                                isSelectedForEdit ? 'bg-indigo-600 text-white' : 'bg-indigo-600/30 text-indigo-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-bold text-white truncate max-w-[150px]">{textObj.text}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e2235] text-slate-400 font-mono">
                                {textObj.style === 'plain' ? 'Không khung' : textObj.style}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                title="Sửa nội dung & font chữ"
                                className="p-1 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingTextId === (textObj.id || idx)) {
                                    setEditingTextId(null);
                                    setCustomTextInput('');
                                  }
                                  onRemoveTextLayer && onRemoveTextLayer(textObj.id || idx);
                                }}
                                title="Xóa lớp chữ này"
                                className="p-1 rounded-lg hover:bg-rose-600 text-slate-400 hover:text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 8: KHO ANIMATION ĐỒ HỌA ĐỘNG TỰ ĐỘNG KÈM SOUND FX (TAB RIÊNG BIỆT)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'animation' && (
          <div className="space-y-4 font-sans text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Kho Animation Đồ Họa Động</span>
              </h3>
              <span className="text-[10px] text-amber-400 font-mono font-bold">Tự kèm Sound FX</span>
            </div>

            <div className="p-3 bg-gradient-to-r from-amber-950/40 via-rose-950/40 to-amber-950/40 border border-amber-500/30 rounded-2xl space-y-1.5">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>8+ Mẫu Animation Động Vẽ Tay & Biểu Tượng Viral</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Khi bấm <strong>+ Chèn</strong>, hệ thống sẽ <strong>tự động đồng bộ Sound Effect tương ứng lên Timeline</strong> tại đúng giây hiện tại.
              </p>
            </div>

            {/* Grid các mẫu Animation Động */}
            <div className="grid grid-cols-2 gap-2.5">
              {ANIMATION_PRESETS.map((anim) => (
                <div
                  key={anim.id}
                  className="p-3 rounded-2xl bg-[#161824] hover:bg-[#1f2236] border border-[#272b40] hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  {/* Live Animation Preview Box */}
                  <div className="h-20 bg-[#0c0d15] rounded-xl flex items-center justify-center overflow-hidden border border-white/5 relative">
                    <AnimatedStickerItem type={anim.id} scale={70} isPlaying={true} />
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[8px] font-mono text-slate-400">
                      {anim.category}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-white text-xs truncate group-hover:text-amber-300 transition">
                      {anim.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {anim.desc}
                    </div>
                  </div>

                  {/* Action Buttons: Thử Tiếng + Thêm vào Video */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#222538]">
                    <button
                      onClick={() => {
                        try {
                          const soundUrl = anim.sound.fileUrl || `/assets/sounds/${anim.sound.file || 'pop.wav'}`;
                          const snd = new Audio(soundUrl);
                          snd.volume = 0.9;
                          snd.play().catch(() => {});
                        } catch(e) {}
                      }}
                      title={`Nghe thử Sound FX: ${anim.sound.name}`}
                      className="p-1.5 rounded-lg bg-[#202336] hover:bg-amber-600 text-slate-300 hover:text-white transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onAddAnimatedSticker && onAddAnimatedSticker(anim.id)}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-[10px] shadow-sm transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Chèn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Danh sách các Animation đang có trên clip với bộ chỉnh thời gian xuất hiện & thời lượng */}
            {animatedStickers && animatedStickers.length > 0 && (
              <div className="p-3 bg-[#171926] border border-[#272b40] rounded-2xl space-y-2.5">
                <div className="font-bold text-white text-xs flex items-center justify-between">
                  <span>Animation Đang Có Trên Clip ({animatedStickers.length}):</span>
                  <span className="text-[10px] text-amber-400 font-bold">Chỉnh thời gian & thời lượng</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {animatedStickers.map((stk, idx) => {
                    const preset = ANIMATION_PRESETS.find(p => p.id === stk.type) || { name: stk.type, thumb: '✨' };
                    return (
                      <div
                        key={stk.id || idx}
                        className="p-2.5 rounded-xl bg-[#10121a] border border-[#25293d] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">{preset.thumb}</span>
                            <span className="font-bold text-white truncate">{preset.name}</span>
                          </div>

                          <button
                            onClick={() => onRemoveAnimatedSticker && onRemoveAnimatedSticker(stk.id || idx)}
                            title="Xóa Animation này"
                            className="p-1 rounded-lg hover:bg-rose-600 text-slate-400 hover:text-white transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bộ chỉnh Mốc Bắt Đầu (s) và Thời Lượng (s) */}
                        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#1e2235]">
                          {/* Bắt đầu */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Bắt đầu (s):</span>
                            </span>
                            <div className="flex items-center gap-1 bg-[#181a26] border border-[#2d3249] rounded-lg p-0.5">
                              <button
                                onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { startTime: Math.max(0, Math.round(((stk.startTime ?? 0) - 0.5) * 10) / 10) })}
                                className="w-5 h-5 rounded bg-[#25293d] hover:bg-[#343b56] text-white font-bold flex items-center justify-center text-[10px]"
                                title="Giảm 0.5s"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={stk.startTime ?? 0}
                                onChange={(e) => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { startTime: Math.max(0, parseFloat(e.target.value) || 0) })}
                                className="w-full bg-transparent text-center text-white font-mono font-bold text-[11px] focus:outline-none"
                              />
                              <button
                                onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { startTime: Math.round(((stk.startTime ?? 0) + 0.5) * 10) / 10 })}
                                className="w-5 h-5 rounded bg-[#25293d] hover:bg-[#343b56] text-white font-bold flex items-center justify-center text-[10px]"
                                title="Tăng 0.5s"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Thời lượng */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Hourglass className="w-3 h-3 text-amber-400" />
                              <span>Thời lượng (s):</span>
                            </span>
                            <div className="flex items-center gap-1 bg-[#181a26] border border-[#2d3249] rounded-lg p-0.5">
                              <button
                                onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { duration: Math.max(0.5, Math.round(((stk.duration ?? 4) - 0.5) * 10) / 10) })}
                                className="w-5 h-5 rounded bg-[#25293d] hover:bg-[#343b56] text-white font-bold flex items-center justify-center text-[10px]"
                                title="Giảm 0.5s"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="0.1"
                                min="0.5"
                                value={stk.duration ?? 4}
                                onChange={(e) => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { duration: Math.max(0.5, parseFloat(e.target.value) || 0.5) })}
                                className="w-full bg-transparent text-center text-white font-mono font-bold text-[11px] focus:outline-none"
                              />
                              <button
                                onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { duration: Math.round(((stk.duration ?? 4) + 0.5) * 10) / 10 })}
                                className="w-5 h-5 rounded bg-[#25293d] hover:bg-[#343b56] text-white font-bold flex items-center justify-center text-[10px]"
                                title="Tăng 0.5s"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Duration Chips */}
                        <div className="flex items-center gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-medium">Nhanh:</span>
                          {[1, 2, 3, 4, 6].map(dur => (
                            <button
                              key={dur}
                              onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(stk.id, { duration: dur })}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition ${
                                (stk.duration ?? 4) === dur
                                  ? 'bg-amber-500 text-black font-bold'
                                  : 'bg-[#1e2235] text-slate-300 hover:bg-[#2c324a]'
                              }`}
                            >
                              {dur}s
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 8.5: QUẢN LÝ LỚP & SẮP XẾP ĐÈ LỚP TOÀN DIỆN (UNIFIED MULTI-TYPE LAYER MANAGER)
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'layers' && (
          <div className="space-y-4 font-sans text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Quản Lý Lớp & Thứ Tự Đè Lớp</span>
              </h3>
              <button
                onClick={() => {
                  const defaultOrder = [
                    'layer_base_video',
                    'layer_broll',
                    'layer_transitions',
                    'layer_captions',
                    'layer_title',
                    'layer_logo',
                    ...(textLayers || []).map((tl, i) => (tl && tl.id) ? tl.id : `tl_${i}`),
                    ...(animatedStickers || []).map((stk, i) => (stk && stk.id) ? stk.id : `stk_${i}`)
                  ];
                  if (setLayerOrder) setLayerOrder(defaultOrder);
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition flex items-center gap-1"
                title="Khôi phục thứ tự lớp chuẩn khuyến nghị"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Thứ tự chuẩn</span>
              </button>
            </div>

            {/* Smart Banner Information */}
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1.5">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quy Tắc Đè Lớp (Layer Hierarchy):</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Lớp ở <strong>TRÊN CÙNG</strong> sẽ xuất hiện đè lên các lớp ở dưới. Chuyển cảnh (Transitions) là 1 lớp độc lập, có thể di chuyển lên/xuống để quyết định xem có hòa trộn vào Text/Animation hay không.
              </p>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (onAddTextLayer) {
                    onAddTextLayer('VĂN BẢN MỚI', 'plain', {
                      fontFamily: 'Montserrat',
                      fontSize: 42,
                      textColor: '#ffffff'
                    });
                  }
                }}
                className="py-2 px-2 rounded-xl bg-[#1a1d2e] hover:bg-[#252a42] border border-[#2e3452] text-indigo-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ Thêm Lớp Chữ</span>
              </button>

              <button
                onClick={() => {
                  if (setActiveTab) setActiveTab('animation');
                }}
                className="py-2 px-2 rounded-xl bg-[#1a1d2e] hover:bg-[#252a42] border border-[#2e3452] text-amber-300 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Chèn Animation</span>
              </button>
            </div>

            {/* Danh Sách Tất Cả Các Lớp Theo Thứ Tự Từ TRÊN CÙNG (Top) Xuống DƯỚI CÙNG (Bottom) */}
            <div className="space-y-2">
              {(() => {
                // Xây dựng danh sách layer hợp nhất
                const layerMap = new Map();

                layerMap.set('layer_base_video', {
                  id: 'layer_base_video',
                  type: 'base_video',
                  name: '🎬 Video / Voiceover Gốc',
                  desc: 'Lớp nền đáy hiển thị Speaker / Audio Studio',
                  isBase: true
                });

                layerMap.set('layer_broll', {
                  id: 'layer_broll',
                  type: 'broll',
                  name: '🖼️ Lớp B-Roll Minh Họa',
                  desc: `${brolls.length} B-Roll • Cho phép chỉnh đè B-Roll`,
                  count: brolls.length
                });

                layerMap.set('layer_transitions', {
                  id: 'layer_transitions',
                  type: 'transitions',
                  name: '✨ Lớp Chuyển Cảnh (Transitions)',
                  desc: 'Hiệu ứng chuyển cảnh (Blur, Fade, Flash, Glitch)'
                });

                layerMap.set('layer_captions', {
                  id: 'layer_captions',
                  type: 'captions',
                  name: '💬 Lớp Phụ Đề Karaoke',
                  desc: 'Chạy chữ tự động đồng bộ giọng nói',
                  visible: captionConfig?.visible !== false
                });

                layerMap.set('layer_title', {
                  id: 'layer_title',
                  type: 'title',
                  name: '🏷️ Lớp Thẻ Tiêu Đề Hook',
                  desc: customTitle || clip?.title || 'Tiêu đề Viral',
                  visible: titleConfig?.visible !== false
                });

                layerMap.set('layer_logo', {
                  id: 'layer_logo',
                  type: 'logo',
                  name: '⭐ Lớp Logo Thương Hiệu',
                  desc: brandConfig?.logoText || 'Logo Watermark',
                  visible: brandConfig?.showLogo !== false
                });

                (textLayers || []).forEach((tl, idx) => {
                  const textObj = typeof tl === 'string' ? { id: `tl_${idx}`, text: tl } : tl;
                  const textId = textObj.id || `tl_${idx}`;
                  layerMap.set(textId, {
                    id: textId,
                    type: 'text',
                    name: `📝 Lớp Chữ: "${textObj.text || 'Văn bản'}"`,
                    rawObj: textObj,
                    visible: textObj.visible !== false
                  });
                });

                (animatedStickers || []).forEach((stk, idx) => {
                  const stkId = stk.id || `stk_${idx}`;
                  const preset = ANIMATION_PRESETS.find(p => p.id === stk.type) || { name: stk.type, thumb: '✨' };
                  layerMap.set(stkId, {
                    id: stkId,
                    type: 'animatedSticker',
                    name: `🎨 Sticker: ${preset.name}`,
                    rawObj: stk,
                    preset,
                    visible: stk.visible !== false
                  });
                });

                let orderedKeys = [];
                if (Array.isArray(layerOrder) && layerOrder.length > 0) {
                  orderedKeys = [...layerOrder].reverse();
                } else {
                  orderedKeys = [
                    ...(animatedStickers || []).map((stk, i) => stk.id || `stk_${i}`),
                    ...(textLayers || []).map((tl, i) => (tl && tl.id) ? tl.id : `tl_${i}`),
                    'layer_logo',
                    'layer_title',
                    'layer_captions',
                    'layer_transitions',
                    'layer_broll',
                    'layer_base_video'
                  ];
                }

                Array.from(layerMap.keys()).forEach(k => {
                  if (!orderedKeys.includes(k)) {
                    orderedKeys.unshift(k);
                  }
                });

                const unifiedList = orderedKeys.map(k => layerMap.get(k)).filter(Boolean);

                // Kiểm tra xem Transitions đang nằm trên hay dưới Text/Stickers
                const transIdx = orderedKeys.indexOf('layer_transitions');
                const hasTextAboveTrans = orderedKeys.slice(0, transIdx).some(k => k.startsWith('tl_') || k.startsWith('text_') || k.startsWith('stk_') || k === 'layer_title' || k === 'layer_captions');

                return unifiedList.map((layer, idx) => {
                  const isTop = idx === 0;
                  const isBottom = idx === unifiedList.length - 1 || layer.isBase;

                  return (
                    <div
                      key={layer.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                        layer.type === 'text' ? 'bg-[#141624] border-[#292e48] hover:border-indigo-500/60' :
                        layer.type === 'title' ? 'bg-[#181620] border-[#383126] hover:border-amber-500/60' :
                        layer.type === 'transitions' ? 'bg-[#171426] border-[#34274c] hover:border-purple-500/60' :
                        layer.type === 'animatedSticker' ? 'bg-[#1a1524] border-[#3d274c] hover:border-rose-500/60' :
                        layer.type === 'broll' ? 'bg-[#171924] border-[#28324a] hover:border-amber-500/60' :
                        'bg-[#10121a] border-[#202436]'
                      }`}
                    >
                      {/* Top Bar of Layer Card */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-md bg-white/10 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span>{layer.name}</span>
                              {layer.type === 'transitions' && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${
                                  hasTextAboveTrans
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}>
                                  {hasTextAboveTrans ? 'Dưới Chữ (Không mờ)' : 'Trên Chữ'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{layer.desc}</div>
                          </div>
                        </div>

                        {/* Reorder Buttons: Up & Down */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!layer.isBase && (
                            <>
                              <button
                                onClick={() => onMoveLayerUp && onMoveLayerUp(layer.id)}
                                disabled={isTop}
                                title="Đưa lớp lên trên (Đè lên lớp khác)"
                                className="p-1 rounded-lg bg-[#202438] hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-[#202438] text-slate-300 hover:text-white transition"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onMoveLayerDown && onMoveLayerDown(layer.id)}
                                disabled={isBottom}
                                title="Đưa lớp xuống dưới (Nằm dưới lớp khác)"
                                className="p-1 rounded-lg bg-[#202438] hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-[#202438] text-slate-300 hover:text-white transition"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Visibility Toggle */}
                          {layer.type === 'title' && (
                            <button
                              onClick={() => setTitleConfig && setTitleConfig(prev => ({ ...prev, visible: !(titleConfig?.visible !== false) }))}
                              title={titleConfig?.visible !== false ? "Ẩn Tiêu Đề" : "Hiện Tiêu Đề"}
                              className={`p-1 rounded-lg transition ${
                                titleConfig?.visible !== false ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-500 hover:bg-slate-800'
                              }`}
                            >
                              {titleConfig?.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {layer.type === 'captions' && (
                            <button
                              onClick={() => setCaptionConfig && setCaptionConfig(prev => ({ ...prev, visible: !(captionConfig?.visible !== false) }))}
                              title={captionConfig?.visible !== false ? "Ẩn Phụ Đề" : "Hiện Phụ Đề"}
                              className={`p-1 rounded-lg transition ${
                                captionConfig?.visible !== false ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-slate-500 hover:bg-slate-800'
                              }`}
                            >
                              {captionConfig?.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {layer.type === 'logo' && (
                            <button
                              onClick={() => setBrandConfig && setBrandConfig(prev => ({ ...prev, showLogo: !(brandConfig?.showLogo !== false) }))}
                              title={brandConfig?.showLogo !== false ? "Ẩn Logo" : "Hiện Logo"}
                              className={`p-1 rounded-lg transition ${
                                brandConfig?.showLogo !== false ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-500 hover:bg-slate-800'
                              }`}
                            >
                              {brandConfig?.showLogo !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {layer.type === 'text' && (
                            <>
                              <button
                                onClick={() => onUpdateTextLayer && onUpdateTextLayer(layer.id, { visible: !(layer.rawObj?.visible !== false) })}
                                title={layer.rawObj?.visible !== false ? "Ẩn Lớp Chữ" : "Hiện Lớp Chữ"}
                                className={`p-1 rounded-lg transition ${
                                  layer.rawObj?.visible !== false ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-slate-500 hover:bg-slate-800'
                                }`}
                              >
                                {layer.rawObj?.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => onRemoveTextLayer && onRemoveTextLayer(layer.id)}
                                title="Xóa Lớp Chữ này"
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {layer.type === 'animatedSticker' && (
                            <>
                              <button
                                onClick={() => onUpdateAnimatedSticker && onUpdateAnimatedSticker(layer.id, { visible: !(layer.rawObj?.visible !== false) })}
                                title={layer.rawObj?.visible !== false ? "Ẩn Sticker" : "Hiện Sticker"}
                                className={`p-1 rounded-lg transition ${
                                  layer.rawObj?.visible !== false ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-500 hover:bg-slate-800'
                                }`}
                              >
                                {layer.rawObj?.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => onRemoveAnimatedSticker && onRemoveAnimatedSticker(layer.id)}
                                title="Xóa Sticker này"
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ✏️ SỬA CHỮ TRỰC TIẾP TẠI CHỖ (INLINE TEXT EDITING CHO TIÊU ĐỀ & LỚP CHỮ) */}
                      {layer.type === 'title' && (
                        <div className="pt-1.5 border-t border-[#2a261a] space-y-1">
                          <span className="text-[10px] text-amber-400/80 font-bold block">Sửa Nội Dung Tiêu Đề Trực Tiếp:</span>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle && setCustomTitle(e.target.value)}
                            placeholder="Gõ tiêu đề video..."
                            className="w-full bg-[#100e16] border border-[#3b3425] text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      )}

                      {layer.type === 'text' && (
                        <div className="pt-1.5 border-t border-[#1e2338] space-y-1">
                          <span className="text-[10px] text-indigo-400/80 font-bold block">Sửa Nội Dung Chữ Trực Tiếp:</span>
                          <input
                            type="text"
                            value={layer.rawObj?.text || ''}
                            onChange={(e) => onUpdateTextLayer && onUpdateTextLayer(layer.id, { text: e.target.value })}
                            placeholder="Gõ nội dung chữ..."
                            className="w-full bg-[#0d0f17] border border-[#2a2e44] text-white font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {/* 🖼️ SẮP XẾP ĐÈ LÊN NHAU GIỮA CÁC B-ROLL (SUB-LIST B-ROLLS REORDERING) */}
                      {layer.type === 'broll' && brolls && brolls.length > 0 && (
                        <div className="pt-1.5 border-t border-[#1e2538] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                            <span>Thứ Tự Đè Giữa Các B-Roll (B-Roll Trên Đè Lên B-Roll Dưới):</span>
                          </div>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {brolls.map((b, bIdx) => (
                              <div
                                key={b.id || bIdx}
                                className="p-1.5 rounded-lg bg-[#0e1017] border border-[#22273d] flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs">{b.thumb || '🎬'}</span>
                                  <span className="font-bold text-white truncate max-w-[130px]">{b.title || `B-Roll #${bIdx + 1}`}</span>
                                  <span className="text-[9px] text-amber-400 font-mono">({(b.start ?? 0).toFixed(1)}s)</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => onMoveBrollUp && onMoveBrollUp(b.id)}
                                    disabled={bIdx === 0}
                                    title="Đưa B-Roll này đè lên B-Roll trước"
                                    className="p-1 rounded bg-[#181b28] hover:bg-amber-600 disabled:opacity-20 text-slate-300 hover:text-white transition"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onMoveBrollDown && onMoveBrollDown(b.id)}
                                    disabled={bIdx === brolls.length - 1}
                                    title="Đưa B-Roll này nằm dưới B-Roll sau"
                                    className="p-1 rounded bg-[#181b28] hover:bg-amber-600 disabled:opacity-20 text-slate-300 hover:text-white transition"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 8: AUDIO
           ═══════════════════════════════════════════════════ */}
        {activeTab === 'audio' && (
          <div className="space-y-4 font-sans text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-400" />
              <span>Hòa Âm Đa Kênh & Sound FX</span>
            </h3>

            {/* 🎙️ Voiceover & AI Speech Audio Controls */}
            <div className="p-3.5 bg-[#171926] border border-[#272b40] rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#222638]">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Kênh Giọng Đọc (Voice Track)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30">
                  🎙️ Master Track
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">AI Speech Enhancement</div>
                  <div className="text-[10px] text-slate-400">Lọc 98% tiếng ồn, ù rít, làm trong giọng</div>
                </div>
                <input
                  type="checkbox"
                  checked={speechEnhance}
                  onChange={(e) => setSpeechEnhance && setSpeechEnhance(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* ⚡ Auto Sound FX & Ducking */}
            <div className="p-3.5 bg-[#171926] border border-[#272b40] rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#222638]">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Tự Động Hòa Âm Sound FX</span>
                </span>
                <span className="text-[10px] text-rose-300 font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                  {soundFxCount} Sound FX trên Timeline
                </span>
              </div>

              <button
                disabled={isAutoMixing}
                onClick={onRunAutoAudioMix}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isAutoMixing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang quét & tạo Sound FX...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-yellow-300" />
                    <span>Quét & Tự Động Tạo Sound FX</span>
                  </>
                )}
              </button>

              {isAutoMixing && (
                <div className="p-2.5 bg-[#1c1424] border border-rose-500/30 rounded-xl space-y-1.5 animate-pulse">
                  <div className="flex items-center justify-between text-[11px] text-rose-300 font-semibold">
                    <span>Tiến trình AI:</span>
                    <span className="font-mono">Processing...</span>
                  </div>
                  <p className="text-[10px] text-slate-300 italic">{autoMixMessage}</p>
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-[#222638]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Tự chèn Whoosh khi chuyển cảnh</div>
                    <div className="text-[10px] text-slate-400">Lướt âm tạo nhịp khi chuyển ý</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoWhoosh}
                    onChange={(e) => setAutoWhoosh && setAutoWhoosh(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Tự chèn Ding/Pop tại từ khóa vàng</div>
                    <div className="text-[10px] text-slate-400">Gây ấn tượng tại từ trọng tâm</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDing}
                    onChange={(e) => setAutoDing && setAutoDing(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Audio Ducking (-12dB)</div>
                    <div className="text-[10px] text-slate-400">Tự giảm nhạc nền khi người nói cất giọng</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioDucking}
                    onChange={(e) => setAudioDucking && setAudioDucking(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {soundFxCount > 0 && (
                <button
                  onClick={onClearAllSoundFx}
                  className="w-full py-1.5 rounded-lg bg-[#221c24] hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-[#352739] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa tất cả hiệu ứng âm thanh trên Timeline</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Kho Hiệu Ứng Thủ Công</span>
                <span className="text-[10px] text-slate-400 font-normal">Nghe thử & Chèn</span>
              </div>

              <div className="space-y-2">
                {soundFxList.map((fx) => (
                  <div
                    key={fx.id}
                    className="p-2.5 bg-[#161824] border border-[#24283b] rounded-xl flex items-center justify-between hover:border-[#343a54] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => playSoundEffect(fx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          playingFx === fx.id ? 'bg-rose-500 text-white' : 'bg-[#222538] text-slate-300 hover:text-white'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                      <div>
                        <div className="font-bold text-white text-xs">{fx.name}</div>
                        <div className="text-[10px] text-slate-400">{fx.category} • {fx.duration}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playSoundEffect(fx);
                        onInsertSoundFx && onInsertSoundFx(fx);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-[10px] font-bold text-rose-300 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Chèn</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Far Right Vertical Icon Nav Tabs */}
      <div className="w-16 shrink-0 bg-[#0a0b10] flex flex-col items-center py-3 space-y-3 z-10 border-l border-[#1d2030] overflow-y-auto">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (setActiveTab) setActiveTab(t.id);
                if (setActiveCleanupMode) setActiveCleanupMode(null);
              }}
              title={t.label}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isSelected
                  ? 'bg-[#1e2030] text-white shadow-md border border-[#33374d]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131520]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : ''}`} />
              <span className="text-[9px] font-semibold tracking-tight text-center leading-none">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
