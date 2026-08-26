import React, { useState, useEffect, useRef, useMemo } from 'react';
import TopBar from './components/TopBar';
import OpusTranscript, { COMMON_FILLERS_LIST } from './components/OpusTranscript';
import OpusCanvasPreview from './components/OpusCanvasPreview';
import OpusTimeline from './components/OpusTimeline';
import OpusRightSidebar from './components/OpusRightSidebar';
import UploadView from './components/UploadView';
import DashboardView from './components/DashboardView';
import ClipPreviewModal from './components/ClipPreviewModal';
import BrollPickerModal from './components/BrollPickerModal';
import SoundFxPickerModal from './components/SoundFxPickerModal';
import AICopilotDrawer from './components/AICopilotDrawer';
import WysiwygExportModal from './components/WysiwygExportModal';
import ProjectsLibraryModal from './components/ProjectsLibraryModal';
import OpusVerticalLayersDrawer from './components/OpusVerticalLayersDrawer';
import OpusSpellCheckModal from './components/OpusSpellCheckModal';
import ErrorBoundary from './components/ErrorBoundary';
import { toPng } from 'html-to-image';
import { RefreshCw } from 'lucide-react';
import { saveProjectToVault } from './utils/projectVault';
import { getMediaFromIndexedDB, saveMediaToIndexedDB } from './utils/mediaStorage';

export default function App() {
  const [data, setData] = useState(null);
  const [activeClip, setActiveClip] = useState(null);
  const [selectedPreviewClip, setSelectedPreviewClip] = useState(null);
  const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'dashboard' | 'editor'
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingHd, setIsExportingHd] = useState(false);
  const [isWysiwygModalOpen, setIsWysiwygModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isSpellCheckModalOpen, setIsSpellCheckModalOpen] = useState(false);

  // AI Copilot Drawer State & Selected Model (Phiên 4)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Background Job Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);

  // Studio Settings & Live Visual Transformations
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [videoLayout, setVideoLayout] = useState('fill'); // 'fill' | 'fit' | 'split'
  const [faceTrackerEnabled, setFaceTrackerEnabled] = useState(true);
  const [captionPreset, setCaptionPreset] = useState('Karaoke Neon Green');
  const [captionEffect, setCaptionEffect] = useState('pop'); // 'pop' | 'wave' | 'glow' | 'slide'
  const [customTitle, setCustomTitle] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState('captions');
  
  const [highlightKeywords, setHighlightKeywords] = useState(true);
  const [speechEnhance, setSpeechEnhance] = useState(true);
  const [aiEmoji, setAiEmoji] = useState(false);
  const [autoCensor, setAutoCensor] = useState(false);
  const [autoTransitions, setAutoTransitions] = useState(true);
  const [activeTransition, setActiveTransition] = useState('zoom_in');
  const [selectedTransitionSceneId, setSelectedTransitionSceneId] = useState(null);
  const [speakerColors, setSpeakerColors] = useState(true);

  const handleOpenTransitionsTab = (sceneId) => {
    setActiveSidebarTab('transitions');
    setSelectedTransitionSceneId(sceneId);
  };

  // Brand Logo & Template Configuration
  const [brandConfig, setBrandConfig] = useState({
    showLogo: true,
    logoUrl: null, // Custom uploaded logo URL
    logoText: 'OPUS STUDIO',
    logoSize: 65,
    logoOpacity: 90,
    pos: { x: 82, y: 6 }, // Draggable percentage position
    primaryColor: '#6366f1',
    secondaryColor: '#04f827',
    accentColor: '#ff007a'
  });

  // Top Hook Title Style, Position, Scale, ScaleX, ScaleY, Timing & Visibility
  const [titleConfig, setTitleConfig] = useState({
    visible: true,
    style: 'yellow_impact', // 'yellow_impact' | 'gradient_gold' | 'neon_cyber' | 'pill_white' | 'minimal'
    scale: 100, // percentage 40 - 300
    scaleX: 100, // horizontal stretch %
    scaleY: 100, // vertical stretch %
    boxWidth: 320,
    paddingY: 6,
    pos: { x: 50, y: 11 }, // Draggable percentage position
    startTime: 0, // start offset in seconds
    duration: 9999 // duration in seconds (persistent across video)
  });

  // Subtitle / Caption Position, Scale, ScaleX, ScaleY & Visibility
  const [captionConfig, setCaptionConfig] = useState({
    visible: true,
    scale: 100, // percentage 40 - 300
    scaleX: 100, // horizontal stretch %
    scaleY: 100, // vertical stretch %
    pos: { x: 50, y: 84 } // Draggable percentage position
  });

  // Background Music (BGM) State
  const [selectedBgm, setSelectedBgm] = useState('none');
  const [bgmVolume, setBgmVolume] = useState(25);
  const [customBgmList, setCustomBgmList] = useState([]);
  const bgmAudioRef = useRef(new Audio());

  // Auto vs Manual Sound FX & Ducking (Phiên 3)
  const [autoWhoosh, setAutoWhoosh] = useState(true);
  const [autoDing, setAutoDing] = useState(true);
  const [audioDucking, setAudioDucking] = useState(true);
  const [autoBroll, setAutoBroll] = useState(false);

  // Interactive Auto-Mix State
  const [isAutoMixing, setIsAutoMixing] = useState(false);
  const [autoMixMessage, setAutoMixMessage] = useState('');

  // Font Customization State (1:1 Chuẩn Ảnh Font Settings)
  const [fontStyle, setFontStyle] = useState({
    fontFamily: 'Montserrat',
    fontSize: 40,
    textColor: '#ffffff',
    fontWeight: 'Black',
    isItalic: false,
    isUnderline: false,
    isUppercase: true,
    strokeColor: '#000000',
    strokeWidth: 8,
    hasShadow: true,
    shadowColor: '#000000',
    shadowX: 2,
    shadowY: 2,
    shadowBlur: 2,
    hasHighlight: true,
    highlightColor: '#04f827'
  });

  // Cleanup State
  const [excludedWordIndices, setExcludedWordIndices] = useState(new Set());
  const [excludedPauseIndices, setExcludedPauseIndices] = useState(new Set());
  const [pauseThreshold, setPauseThreshold] = useState(0.5);
  const [activeCleanupMode, setActiveCleanupMode] = useState(null);

  // Layers: B-Roll, Sound FX, Draggable Text Layers, Animated Stickers
  const [brolls, setBrolls] = useState([]);
  const [selectedBrollId, setSelectedBrollId] = useState(null);
  const [soundFxMarkers, setSoundFxMarkers] = useState([]);
  const [textLayers, setTextLayers] = useState([]);
  const [selectedTextLayerId, setSelectedTextLayerId] = useState(null);
  const [animatedStickers, setAnimatedStickers] = useState([]);
  const [selectedAnimatedStickerId, setSelectedAnimatedStickerId] = useState(null);
  const [isLayersDrawerOpen, setIsLayersDrawerOpen] = useState(false);

  // 🥞 Unified Multi-Type Layer Stacking Order State (Caption nằm dưới Transitions)
  const [layerOrder, setLayerOrder] = useState([
    'layer_base_video',
    'layer_broll',
    'layer_captions',
    'layer_transitions',
    'layer_title',
    'layer_logo'
  ]);

  // Đồng bộ layerOrder khi thêm/xóa textLayer hoặc sticker mới
  useEffect(() => {
    setLayerOrder(prev => {
      let currentList = Array.isArray(prev) && prev.length > 0 ? [...prev] : [
        'layer_base_video',
        'layer_broll',
        'layer_captions',
        'layer_transitions',
        'layer_title',
        'layer_logo'
      ];
      (textLayers || []).forEach((tl, idx) => {
        const id = (tl && tl.id) ? tl.id : `tl_${idx}`;
        if (!currentList.includes(id)) {
          currentList.push(id);
        }
      });
      (animatedStickers || []).forEach((stk, idx) => {
        const id = (stk && stk.id) ? stk.id : `stk_${idx}`;
        if (!currentList.includes(id)) {
          currentList.push(id);
        }
      });
      return currentList;
    });
  }, [textLayers, animatedStickers]);

  const handleMoveLayerUp = (layerId) => {
    setLayerOrder(prev => {
      const list = [...(prev || [])];
      const idx = list.indexOf(layerId);
      if (idx === -1 || idx === list.length - 1) return list;
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      return list;
    });
  };

  const handleMoveLayerDown = (layerId) => {
    setLayerOrder(prev => {
      const list = [...(prev || [])];
      const idx = list.indexOf(layerId);
      if (idx <= 1) return list;
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      return list;
    });
  };

  const handleBringLayerToFront = (layerId) => {
    setLayerOrder(prev => {
      const list = (prev || []).filter(id => id !== layerId);
      list.push(layerId);
      return list;
    });
  };

  const handleSendLayerToBack = (layerId) => {
    setLayerOrder(prev => {
      const list = (prev || []).filter(id => id !== layerId && id !== 'layer_base_video');
      return ['layer_base_video', layerId, ...list];
    });
  };

  const handleMoveBrollUp = (brollId) => {
    setBrolls(prev => {
      const list = [...(prev || [])];
      const idx = list.findIndex(b => b.id === brollId);
      if (idx === -1 || idx === list.length - 1) return list;
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      return list;
    });
  };

  const handleMoveBrollDown = (brollId) => {
    setBrolls(prev => {
      const list = [...(prev || [])];
      const idx = list.findIndex(b => b.id === brollId);
      if (idx <= 0) return list;
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      return list;
    });
  };

  // ↩️ Global Undo / ↪️ Redo State Machine
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isPerformingUndoRedoRef = useRef(false);

  // 📏 DRAGGABLE RESIZABLE PANELS & WORKSPACE SPLITTERS
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('opus_layout_left_width');
    return saved ? parseInt(saved, 10) : 480;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const saved = localStorage.getItem('opus_layout_right_width');
    return saved ? parseInt(saved, 10) : 380;
  });
  const [layersDrawerWidth, setLayersDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('opus_layout_layers_width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [timelineHeight, setTimelineHeight] = useState(() => {
    const saved = localStorage.getItem('opus_layout_timeline_height');
    return saved ? parseInt(saved, 10) : 210;
  });

  const [resizingPanel, setResizingPanel] = useState(null); // 'left' | 'right' | 'layers' | 'timeline' | null
  const resizeDragStateRef = useRef(null);

  const handleStartResize = (panel, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingPanel(panel);
    resizeDragStateRef.current = {
      panel,
      startX: e.clientX,
      startY: e.clientY,
      startLeftW: leftPanelWidth,
      startRightW: rightPanelWidth,
      startLayersW: layersDrawerWidth,
      startTimelineH: timelineHeight
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizingPanel || !resizeDragStateRef.current) return;
      const { panel, startX, startY, startLeftW, startRightW, startLayersW, startTimelineH } = resizeDragStateRef.current;

      if (panel === 'left') {
        const deltaX = e.clientX - startX;
        const maxW = Math.min(850, window.innerWidth * 0.55);
        const newW = Math.max(260, Math.min(maxW, startLeftW + deltaX));
        setLeftPanelWidth(newW);
        localStorage.setItem('opus_layout_left_width', newW);
      } else if (panel === 'right') {
        const deltaX = startX - e.clientX; // Kéo sang trái mở rộng panel phải
        const maxW = Math.min(650, window.innerWidth * 0.45);
        const newW = Math.max(280, Math.min(maxW, startRightW + deltaX));
        setRightPanelWidth(newW);
        localStorage.setItem('opus_layout_right_width', newW);
      } else if (panel === 'layers') {
        const deltaX = startX - e.clientX;
        const maxW = Math.min(520, window.innerWidth * 0.4);
        const newW = Math.max(240, Math.min(maxW, startLayersW + deltaX));
        setLayersDrawerWidth(newW);
        localStorage.setItem('opus_layout_layers_width', newW);
      } else if (panel === 'timeline') {
        const deltaY = startY - e.clientY; // Kéo lên trên nâng cao timeline
        const maxH = Math.min(480, window.innerHeight * 0.6);
        const newH = Math.max(120, Math.min(maxH, startTimelineH + deltaY));
        setTimelineHeight(newH);
        localStorage.setItem('opus_layout_timeline_height', newH);
      }
    };

    const handleMouseUp = () => {
      if (resizingPanel) {
        setResizingPanel(null);
        resizeDragStateRef.current = null;
      }
    };

    if (resizingPanel) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = resizingPanel === 'timeline' ? 'row-resize' : 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingPanel]);

  // Modals for B-Roll & Sound FX Picker
  const [isBrollPickerOpen, setIsBrollPickerOpen] = useState(false);
  const [brollTimeRange, setBrollTimeRange] = useState(null);

  const [isSoundFxPickerOpen, setIsSoundFxPickerOpen] = useState(false);
  const [soundFxTimestamp, setSoundFxTimestamp] = useState(0);

  const videoRef = useRef(null);
  const playedFxRef = useRef(new Set());
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(null);

  // 🎧 Web Audio API Studio Speech Enhancement Engine (Studio Quality DSP)
  useEffect(() => {
    if (!videoRef.current) return;
    
    const setupAudioGraph = () => {
      try {
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          
          // 🛡️ Kết nối an toàn nguồn video MediaElement
          let source = null;
          try {
            source = ctx.createMediaElementSource(videoRef.current);
          } catch(e) {
            console.warn("createMediaElementSource already attached:", e);
            return;
          }
          
          // 1. Smooth High-Pass Filter (Cắt tần số ù rì dưới 75Hz, bảo toàn độ ấm/dày của giọng nói)
          const highPass = ctx.createBiquadFilter();
          highPass.type = 'highpass';
          highPass.frequency.value = 75;
          highPass.Q.value = 0.707;

          // 2. Notch Filters (Triệt tiêu tiếng ù điện xoay chiều 50Hz, 60Hz)
          const notch50 = ctx.createBiquadFilter();
          notch50.type = 'notch';
          notch50.frequency.value = 50;
          notch50.Q.value = 8;

          const notch60 = ctx.createBiquadFilter();
          notch60.type = 'notch';
          notch60.frequency.value = 60;
          notch60.Q.value = 8;

          // 3. Smooth Low-Pass Filter (Cắt tiếng rít chói trên 11,500Hz, giữ nguyên độ trong trẻo và hơi thở)
          const lowPass = ctx.createBiquadFilter();
          lowPass.type = 'lowpass';
          lowPass.frequency.value = 11500;
          lowPass.Q.value = 0.707;

          // 4. Vocal Formant Presence (Làm nổi bật âm thoại tiếng Việt tự nhiên)
          const vocalPresence = ctx.createBiquadFilter();
          vocalPresence.type = 'peaking';
          vocalPresence.frequency.value = 2800;
          vocalPresence.Q.value = 1.2;
          vocalPresence.gain.value = 2.5; // +2.5dB

          const vocalWarmth = ctx.createBiquadFilter();
          vocalWarmth.type = 'peaking';
          vocalWarmth.frequency.value = 1000;
          vocalWarmth.Q.value = 1.0;
          vocalWarmth.gain.value = 1.5; // +1.5dB

          // 5. Broadcast Compressor (Nén dải động cân bằng, tự nhiên)
          const compressor = ctx.createDynamicsCompressor();
          compressor.threshold.value = -16;
          compressor.knee.value = 20;
          compressor.ratio.value = 2.5;
          compressor.attack.value = 0.005;
          compressor.release.value = 0.15;

          // 6. 🔊 Makeup Gain (+5.1dB bù âm lượng chuẩn Studio sau khi nén)
          const makeupGain = ctx.createGain();
          makeupGain.gain.value = 1.8;

          // 7. Studio Noise Gate Node (Ngắt ồn thông minh khi ngừng nói)
          const gateGain = ctx.createGain();
          gateGain.gain.value = 1.0;

          // 👁️ MẮT THẦN ANALYSER ĐẶT TRƯỚC GATE (Đo trực tiếp tín hiệu micro gốc, chống kẹt ngắt âm)
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          const pcmData = new Float32Array(analyser.fftSize);

          let isGateOpen = true;
          const checkNoiseGate = () => {
            if (ctx.state === 'running') {
              analyser.getFloatTimeDomainData(pcmData);
              let sum = 0;
              for (let i = 0; i < pcmData.length; i++) {
                sum += pcmData[i] * pcmData[i];
              }
              const rms = Math.sqrt(sum / pcmData.length);
              const db = 20 * Math.log10(Math.max(1e-5, rms));

              // Nếu âm lượng < -42dB (khoảng nghỉ) -> Giảm nhẹ tiếng ồn nền xuống 0.08 (-22dB)
              if (db < -42) {
                if (isGateOpen) {
                  isGateOpen = false;
                  gateGain.gain.setTargetAtTime(0.08, ctx.currentTime, 0.03);
                }
              } else if (db >= -38) { // Khi người nói cất giọng -> Mở cổng 100%
                if (!isGateOpen) {
                  isGateOpen = true;
                  gateGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.005);
                }
              }
            }
            requestAnimationFrame(checkNoiseGate);
          };
          requestAnimationFrame(checkNoiseGate);

          // Gain Nodes for A/B Bypass vs Processed
          const bypassGain = ctx.createGain();
          const effectGain = ctx.createGain();

          // Bypass path (Nguyên bản 100%)
          source.connect(bypassGain);
          bypassGain.connect(ctx.destination);

          // Analyser đo sóng âm trực tiếp từ nguồn
          source.connect(analyser);

          // Processed path với Makeup Gain và Noise Gate
          source.connect(highPass);
          highPass.connect(notch50);
          notch50.connect(notch60);
          notch60.connect(lowPass);
          lowPass.connect(vocalPresence);
          vocalPresence.connect(vocalWarmth);
          vocalWarmth.connect(compressor);
          compressor.connect(makeupGain);
          makeupGain.connect(gateGain);
          gateGain.connect(effectGain);
          effectGain.connect(ctx.destination);

          // Thiết lập Gain ban đầu
          if (speechEnhance) {
            bypassGain.gain.value = 0;
            effectGain.gain.value = 1;
          } else {
            bypassGain.gain.value = 1;
            effectGain.gain.value = 0;
          }

          audioContextRef.current = ctx;
          audioNodesRef.current = { bypassGain, effectGain, ctx, gateGain };
        }
      } catch (err) {
        console.warn("Web Audio API setup notice:", err);
      }
    };

    videoRef.current.addEventListener('play', setupAudioGraph, { once: true });
  }, [currentView]);

  // Update audio filter gains on toggle
  useEffect(() => {
    if (audioNodesRef.current) {
      const { bypassGain, effectGain, ctx } = audioNodesRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (speechEnhance) {
        bypassGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        effectGain.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
      } else {
        bypassGain.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
        effectGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    }
  }, [speechEnhance]);

  // 🎵 Đồng bộ phát / dừng / âm lượng Nhạc nền (BGM) với Video
  useEffect(() => {
    const bgmAudio = bgmAudioRef.current;
    if (!bgmAudio) return;

    if (!selectedBgm || selectedBgm === 'none') {
      bgmAudio.pause();
      return;
    }

    const trackUrls = {
      lofi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      cinematic: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=inspiring-cinematic-ambient-116199.mp3',
      energetic: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=electronic-future-beats-117997.mp3'
    };

    const custom = customBgmList.find(c => c.id === selectedBgm);
    const audioUrl = custom?.url || trackUrls[selectedBgm];

    if (audioUrl) {
      if (bgmAudio.src !== audioUrl) {
        bgmAudio.src = audioUrl;
        bgmAudio.loop = true;
      }
      bgmAudio.volume = Math.max(0, Math.min(1, (bgmVolume / 100) * 0.4));

      if (isPlaying) {
        bgmAudio.play().catch(() => {});
      } else {
        bgmAudio.pause();
      }
    } else {
      bgmAudio.pause();
    }
  }, [selectedBgm, isPlaying, bgmVolume, customBgmList]);

  const handleProcessSuccess = (pipelineData) => {
    if (!pipelineData || !pipelineData.viral_clips) return;
    setData(pipelineData);
    const firstClip = pipelineData.viral_clips[0];
    setActiveClip(firstClip);
    setCurrentTime(firstClip.start_time || 0);
    setCustomTitle(firstClip.title || 'Video Mới');
    setBrolls([]);
    setTextLayers([]);
    setAnimatedStickers([]);
    setSoundFxMarkers([]);
    setExcludedWordIndices(new Set());
    setExcludedPauseIndices(new Set());

    try {
      localStorage.setItem('opus_current_project', JSON.stringify(pipelineData));
    } catch(e) {}

    // Nếu chọn Cắt Viral AI và có nhiều hơn 1 clip -> Hiện Dashboard để chọn, ngược lại vào thẳng Editor
    if (pipelineData.processing_mode === 'viral_ai' && pipelineData.viral_clips.length > 1) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('editor');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Kiểm tra dự án lưu tạm trong trình duyệt trước
      const savedLocal = localStorage.getItem('opus_current_project');
      if (savedLocal) {
        try {
          const json = JSON.parse(savedLocal);
          if (json && json.has_data && json.viral_clips && json.viral_clips.length > 0) {
            // 💾 Khôi phục file video/audio từ IndexedDB và cấp mới blob_url sau khi F5/Ctrl+F5
            let hasValidMedia = false;
            try {
              const savedBlob = await getMediaFromIndexedDB('current_video_file');
              if (savedBlob && (savedBlob instanceof Blob || savedBlob.size > 0)) {
                const freshBlobUrl = URL.createObjectURL(savedBlob);
                if (json.video_metadata) {
                  json.video_metadata.blob_url = freshBlobUrl;
                  json.video_metadata.video_path = freshBlobUrl;
                  json.video_metadata.file = savedBlob;
                }
                hasValidMedia = true;
              }
            } catch (idbErr) {
              console.warn("IndexedDB load notice:", idbErr);
            }

            // Nếu không còn file video thực trong IndexedDB -> Xóa cache hết hạn và trở về Upload để nạp file mới
            if (!hasValidMedia && (!json.video_metadata?.blob_url || json.video_metadata.blob_url.startsWith('blob:'))) {
              console.warn("Media blob expired. Resetting to upload view.");
              localStorage.removeItem('opus_current_project');
              setCurrentView('upload');
              setIsLoading(false);
              return null;
            }

            setData(json);
            const firstClip = json.viral_clips[0];
            setActiveClip(firstClip);
            setCurrentTime(firstClip.start_time || 0);
            setCustomTitle(firstClip.title || 'Video Mới');
            
            // Điều hướng view phù hợp (nếu là viral_ai có nhiều clip -> mở Dashboard)
            if (json.processing_mode === 'viral_ai' && json.viral_clips.length > 1) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('editor');
            }
            setIsLoading(false);
            return json;
          }
        } catch(e) {
          localStorage.removeItem('opus_current_project');
        }
      }

      // 2. Dự phòng: Kiểm tra server cục bộ nếu đang chạy dev server
      try {
        const res = await fetch('/api/data').catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          if (json.has_data && json.viral_clips && json.viral_clips.length > 0) {
            setData(json);
            const firstClip = json.viral_clips[0];
            setActiveClip(firstClip);
            setCurrentTime(firstClip.start_time);
            setCustomTitle(firstClip.title);
            setCurrentView('editor');
            setIsLoading(false);
            return json;
          }
        }
      } catch(e) {}

      setCurrentView('upload');
    } catch (err) {
      console.error("Failed to load pipeline data:", err);
      setCurrentView('upload');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwitchProject = (newData) => {
    if (!newData) return;
    setData(newData);
    if (newData.viral_clips && newData.viral_clips.length > 0) {
      const firstClip = newData.viral_clips[0];
      setActiveClip(firstClip);
      setCurrentTime(firstClip.start_time);
      setCustomTitle(firstClip.title || '');
      setBrolls(firstClip.brolls || []);
      setSoundFxMarkers(firstClip.soundFxMarkers || []);
      setExcludedWordIndices(new Set());
      setExcludedPauseIndices(new Set());
      setCurrentView('dashboard');
    }
  };

  // ↩️ GLOBAL UNDO / ↪️ REDO ENGINE
  const captureStateSnapshot = () => {
    return {
      transcriptWords: data?.transcript?.words ? JSON.parse(JSON.stringify(data.transcript.words)) : null,
      excludedWordIndices: Array.from(excludedWordIndices),
      excludedPauseIndices: Array.from(excludedPauseIndices),
      textLayers: JSON.parse(JSON.stringify(textLayers)),
      animatedStickers: JSON.parse(JSON.stringify(animatedStickers)),
      brolls: JSON.parse(JSON.stringify(brolls)),
      soundFxMarkers: JSON.parse(JSON.stringify(soundFxMarkers)),
      titleConfig: titleConfig ? JSON.parse(JSON.stringify(titleConfig)) : null,
      customTitle,
      fontStyle: fontStyle ? JSON.parse(JSON.stringify(fontStyle)) : null
    };
  };

  const pushStateToHistory = () => {
    if (isPerformingUndoRedoRef.current) return;
    const snap = captureStateSnapshot();
    setHistoryStack(prev => {
      const nextStack = prev.slice(0, historyIndex + 1);
      if (nextStack.length >= 35) nextStack.shift();
      return [...nextStack, snap];
    });
    setHistoryIndex(prev => Math.min(34, prev + 1));
  };

  const applySnapshot = (snap) => {
    if (!snap) return;
    isPerformingUndoRedoRef.current = true;
    if (snap.transcriptWords && data?.transcript) {
      setData(prev => ({
        ...prev,
        transcript: {
          ...prev.transcript,
          words: snap.transcriptWords
        }
      }));
    }
    if (snap.excludedWordIndices) setExcludedWordIndices(new Set(snap.excludedWordIndices));
    if (snap.excludedPauseIndices) setExcludedPauseIndices(new Set(snap.excludedPauseIndices));
    if (snap.textLayers) setTextLayers(snap.textLayers);
    if (snap.animatedStickers) setAnimatedStickers(snap.animatedStickers);
    if (snap.brolls) setBrolls(snap.brolls);
    if (snap.soundFxMarkers) setSoundFxMarkers(snap.soundFxMarkers);
    if (snap.titleConfig) setTitleConfig(snap.titleConfig);
    if (snap.customTitle !== undefined) setCustomTitle(snap.customTitle);
    if (snap.fontStyle) setFontStyle(snap.fontStyle);
    
    setTimeout(() => {
      isPerformingUndoRedoRef.current = false;
    }, 60);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);
      applySnapshot(historyStack[targetIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      applySnapshot(historyStack[targetIdx]);
    }
  };

  // Global Keyboard shortcuts: Ctrl+Z (Undo) & Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, historyStack]);

  const handleReorderTextLayers = (fromIdx, toIdx) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= textLayers.length || toIdx >= textLayers.length) return;
    pushStateToHistory();
    setTextLayers(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const handleUpdateBroll = (brollIdOrObj, updates = null) => {
    if (typeof brollIdOrObj === 'object' && brollIdOrObj !== null) {
      pushStateToHistory();
      setBrolls(prev => prev.map(b => b.id === brollIdOrObj.id ? brollIdOrObj : b));
    } else {
      setBrolls(prev => prev.map(b => b.id === brollIdOrObj ? { ...b, ...updates } : b));
    }
  };

  // Filter words belonging to current clip
  const allWords = data?.transcript?.words || [];
  const currentClipWords = useMemo(() => {
    return allWords.filter(
      w => activeClip && w.start >= activeClip.start_time - 0.2 && w.end <= activeClip.end_time + 0.5
    );
  }, [allWords, activeClip]);

  // Detected Fillers Count
  const detectedFillersCount = useMemo(() => {
    let count = 0;
    currentClipWords.forEach((w) => {
      const clean = w.word.toLowerCase().replace(/[.,!?\"']/g, '').trim();
      if (COMMON_FILLERS_LIST.includes(clean)) count++;
    });
    return count;
  }, [currentClipWords]);

  // Detected Pauses & Pauses List with 80ms Acoustic Cushion (Đệm âm thanh bảo toàn giọng nói)
  const detectedPausesList = useMemo(() => {
    const list = [];
    let pCount = 0;
    const PADDING_SEC = 0.08; // 80ms đệm an toàn ở cả 2 đầu khoảng lặng

    for (let i = 1; i < currentClipWords.length; i++) {
      const prev = currentClipWords[i - 1];
      const curr = currentClipWords[i];
      const gap = curr.start - prev.end;
      
      // Chỉ tính là khoảng lặng có thể cắt nếu khoảng cách >= (pauseThreshold) và sau khi trừ đệm vẫn còn ít nhất 100ms
      if (gap >= pauseThreshold) {
        const cutStart = Math.round((prev.end + PADDING_SEC) * 100) / 100;
        const cutEnd = Math.round((curr.start - PADDING_SEC) * 100) / 100;
        
        if (cutEnd - cutStart >= 0.10) {
          list.push({
            index: pCount++,
            id: `pause_${prev.end.toFixed(2)}_${curr.start.toFixed(2)}`,
            rawStart: prev.end,
            rawEnd: curr.start,
            cutStart: cutStart,
            cutEnd: cutEnd,
            duration: gap
          });
        }
      }
    }
    return list;
  }, [currentClipWords, pauseThreshold]);

  const detectedPausesCount = detectedPausesList.length;

  // Real-time Skip Intervals (Chính xác từng tích tắc sóng âm, không lẹm tiếng)
  const skipIntervals = useMemo(() => {
    if (!currentClipWords.length) return [];
    
    const excludedList = Array.from(excludedWordIndices)
      .filter(idx => idx >= 0 && idx < currentClipWords.length)
      .sort((a, b) => a - b);
      
    const intervals = [];

    // Gom cụm các từ bị xóa liền kề (giới hạn đúng phạm vi từ đó, không nuốt khoảng lặng sau đó)
    if (excludedList.length > 0) {
      let chunkStartIdx = excludedList[0];
      let chunkEndIdx = excludedList[0];

      for (let i = 1; i < excludedList.length; i++) {
        if (excludedList[i] === chunkEndIdx + 1) {
          chunkEndIdx = excludedList[i];
        } else {
          const start = Math.max(0, currentClipWords[chunkStartIdx].start - 0.02);
          const end = currentClipWords[chunkEndIdx].end + 0.04;
          intervals.push({ start, end });
          chunkStartIdx = excludedList[i];
          chunkEndIdx = excludedList[i];
        }
      }

      const start = Math.max(0, currentClipWords[chunkStartIdx].start - 0.02);
      const end = currentClipWords[chunkEndIdx].end + 0.04;
      intervals.push({ start, end });
    }

    // Khoảng lặng explicit do người dùng chủ động bấm gạch bỏ (áp dụng đệm an toàn 80ms)
    if (excludedPauseIndices && excludedPauseIndices.size > 0) {
      excludedPauseIndices.forEach((pIdx) => {
        const targetPause = detectedPausesList.find(p => p.index === pIdx);
        if (targetPause) {
          intervals.push({
            start: targetPause.cutStart,
            end: targetPause.cutEnd
          });
        }
      });
    }

    // Merge các khoảng nhảy gối nhau (ngưỡng 0.005s để không nuốt các từ ngắn hợp lệ)
    intervals.sort((a, b) => a.start - b.start);
    const merged = [];
    intervals.forEach(curr => {
      if (!merged.length) {
        merged.push({ ...curr });
      } else {
        const last = merged[merged.length - 1];
        if (curr.start <= last.end + 0.005) {
          last.end = Math.max(last.end, curr.end);
        } else {
          merged.push({ ...curr });
        }
      }
    });

    return merged;
  }, [excludedWordIndices, excludedPauseIndices, currentClipWords, detectedPausesList]);

  // Poll job status when processing
  useEffect(() => {
    let interval = null;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/job-status');
          const statusJson = await res.json();
          setJobStatus(statusJson);

          if (statusJson.status === 'completed') {
            setIsProcessing(false);
            clearInterval(interval);
            const loaded = await fetchData();
            // Xóa cache cũ không có videoId
            try {
              localStorage.removeItem('opus_saved_project_1');
              localStorage.removeItem('opus_saved_project_2');
            } catch(e) {}
            if (loaded?.video_metadata?.is_audio_only || loaded?.video_metadata?.media_type === 'audio') {
              setCurrentView('editor');
            } else {
              setCurrentView('dashboard');
            }
          } else if (statusJson.status === 'error') {
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleStartProcessing = async (inputSource, apiKey, audioFile = null, aiEngine = 'auto') => {
    setIsProcessing(true);
    setJobStatus({ status: 'processing', progress: 5, stage: 'Đang chuẩn bị...', message: 'Khởi động AI Engine...' });

    try {
      let res;
      if (audioFile) {
        const formData = new FormData();
        formData.append('file', audioFile);
        if (apiKey) formData.append('gemini_api_key', apiKey);
        if (aiEngine) formData.append('ai_engine', aiEngine);
        res = await fetch('http://127.0.0.1:8000/api/upload-audio', {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch('http://127.0.0.1:8000/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input_source: inputSource,
            gemini_api_key: apiKey,
            ai_engine: aiEngine
          })
        });
      }
      if (!res.ok) {
        const errData = await res.json();
        setJobStatus({ status: 'error', error: errData.detail || "Không thể khởi động tác vụ.", stage: 'Lỗi khởi động' });
        setIsProcessing(false);
      }
    } catch (err) {
      setJobStatus({ status: 'error', error: `Lỗi kết nối: ${err.message}`, stage: 'Lỗi kết nối' });
      setIsProcessing(false);
    }
  };

  const handleCancelProcessing = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/reset-job', { method: 'POST' });
    } catch (e) {}
    setIsProcessing(false);
    setJobStatus({ status: 'idle', progress: 0, stage: '', message: '', error: null });
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.warn("Video playback notice:", err);
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        });
      } else {
        setIsPlaying(true);
      }
    }
  };

  // Live Sound Effects & Real-Time Skip Engine (Không nhảy sớm, không đáp trễ)
  const handleTimeUpdate = (time) => {
    for (const skip of skipIntervals) {
      if (time >= skip.start && time < skip.end) {
        if (videoRef.current) {
          videoRef.current.currentTime = skip.end;
          setCurrentTime(skip.end);
        }
        return;
      }
    }

    setCurrentTime(time);

    const clipStart = activeClip?.start_time || 0;
    const relTime = time - clipStart;

    soundFxMarkers.forEach((marker) => {
      const markerKey = marker.id || `${marker.name}_${marker.time}`;
      if (relTime >= marker.time - 0.05 && relTime <= marker.time + 0.3) {
        if (!playedFxRef.current.has(markerKey)) {
          playedFxRef.current.add(markerKey);
          try {
            const soundUrl = marker.fileUrl || `/assets/sounds/${marker.file || marker.sound || 'whoosh.wav'}`;
            const fxAudio = new Audio(soundUrl);
            fxAudio.volume = 0.9;
            fxAudio.play().catch(err => console.log("Sound FX autoplay error:", err));
          } catch (e) {
            console.log("Audio play error:", e);
          }
        }
      }
    });

    if (activeClip && time >= activeClip.end_time) {
      playedFxRef.current.clear();
      if (videoRef.current) {
        videoRef.current.currentTime = activeClip.start_time;
        setCurrentTime(activeClip.start_time);
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (timestamp) => {
    for (const skip of skipIntervals) {
      if (timestamp >= skip.start && timestamp < skip.end) {
        timestamp = skip.end + 0.02;
        break;
      }
    }

    setCurrentTime(timestamp);
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }

    const clipStart = activeClip?.start_time || 0;
    const seekRelTime = timestamp - clipStart;
    soundFxMarkers.forEach((m) => {
      const markerKey = m.id || `${m.name}_${m.time}`;
      if (m.time >= seekRelTime - 0.1) {
        playedFxRef.current.delete(markerKey);
      }
    });
  };

  const handleToggleExcludeWords = (indices, mode = 'toggle') => {
    pushStateToHistory();
    const next = new Set(excludedWordIndices);
    if (mode === 'exclude') {
      indices.forEach(idx => next.add(idx));
    } else if (mode === 'restore') {
      indices.forEach(idx => next.delete(idx));
    } else {
      indices.forEach(idx => {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      });
    }
    setExcludedWordIndices(next);
  };

  const handleEditPhraseText = (indices, newPhraseText) => {
    if (!data?.transcript?.words || indices.length === 0 || !newPhraseText?.trim()) return;
    pushStateToHistory();

    // Kiểm tra xem indices là 1 dải liên tục hay nhiều vị trí tách rời (từ tìm kiếm)
    const isContiguous = indices.length === 1 || indices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);

    if (isContiguous) {
      const firstWord = currentClipWords[indices[0]];
      const lastWord = currentClipWords[indices[indices.length - 1]];
      const totalStart = firstWord?.start || 0;
      const totalEnd = lastWord?.end || totalStart + 1.0;
      const totalDuration = totalEnd - totalStart;

      const newWordsArr = newPhraseText.trim().split(/\s+/);
      const wordDuration = totalDuration / Math.max(1, newWordsArr.length);

      const replacements = newWordsArr.map((w, i) => ({
        word: w,
        start: totalStart + i * wordDuration,
        end: totalStart + (i + 1) * wordDuration,
        score: 1.0
      }));

      const actualStartIndex = data.transcript.words.findIndex(w => w === firstWord);
      const actualEndIndex = data.transcript.words.findIndex(w => w === lastWord);

      if (actualStartIndex !== -1 && actualEndIndex !== -1) {
        const updatedWords = [...data.transcript.words];
        updatedWords.splice(actualStartIndex, (actualEndIndex - actualStartIndex) + 1, ...replacements);
        setData({
          ...data,
          transcript: {
            ...data.transcript,
            words: updatedWords
          }
        });
      }
    } else {
      // Sửa hàng loạt nhiều từ ở các vị trí khác nhau
      const targetWordsToReplace = indices.map(idx => currentClipWords[idx]).filter(Boolean);
      const updatedWords = data.transcript.words.map(w => {
        if (targetWordsToReplace.includes(w)) {
          return {
            ...w,
            word: newPhraseText.trim()
          };
        }
        return w;
      });

      setData({
        ...data,
        transcript: {
          ...data.transcript,
          words: updatedWords
        }
      });
    }
  };

  const handleOpenBrollPicker = (range) => {
    setBrollTimeRange(range || { start: currentTime, end: currentTime + 4 });
    setIsBrollPickerOpen(true);
  };

  const handleOpenSoundFxPicker = (time) => {
    setSoundFxTimestamp(time || currentTime);
    setIsSoundFxPickerOpen(true);
  };

  const handleSelectBroll = (brollObjOrArray) => {
    const items = Array.isArray(brollObjOrArray) ? brollObjOrArray : [brollObjOrArray];
    const clipStart = activeClip?.start_time || 0;

    // 🔊 Tự động thêm Sound Effect Whoosh/Transition tương ứng cho mỗi B-Roll được thêm vào!
    const newSoundFxList = [];
    items.forEach((b, idx) => {
      const bStartTime = b.start !== undefined ? (b.start >= clipStart ? (b.start - clipStart) : b.start) : Math.max(0, currentTime - clipStart);
      const relTime = Math.max(0, bStartTime);
      const soundFxId = `sfx_broll_${Date.now()}_${idx}`;
      
      newSoundFxList.push({
        id: soundFxId,
        name: 'Whoosh Fast Swoosh',
        file: 'whoosh.wav',
        time: Math.round(relTime * 10) / 10,
        category: 'Chuyển cảnh'
      });
    });

    if (newSoundFxList.length > 0) {
      setSoundFxMarkers(prev => [...prev, ...newSoundFxList]);
      playedFxRef.current.clear();
      try {
        const sound = new Audio('/assets/sounds/whoosh.wav');
        sound.volume = 0.85;
        sound.play().catch(() => {});
      } catch(e) {}
    }

    setBrolls(prev => [...prev, ...items]);
  };

  const handleReorderBrolls = (sourceIndex, targetIndex) => {
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    setBrolls(prev => {
      if (sourceIndex >= prev.length || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleSelectSoundFx = (fxObj, specificTime = null) => {
    const clipStart = activeClip?.start_time || 0;
    const targetTime = specificTime !== null ? specificTime : currentTime;
    const relTime = Math.max(0, targetTime - clipStart);
    setSoundFxMarkers([...soundFxMarkers, { ...fxObj, id: `manual_${Date.now()}`, time: Math.round(relTime * 10) / 10 }]);
    playedFxRef.current.clear();
  };

  const handleUpdateSoundFxTime = (id, newTime) => {
    if (!activeClip) return;
    const clipStart = activeClip.start_time;
    const clipEnd = activeClip.end_time;
    const clipDur = clipEnd - clipStart;
    const boundedTime = Math.max(0, Math.min(clipDur, newTime));
    setSoundFxMarkers(prev => prev.map(m => m.id === id ? { ...m, time: Math.round(boundedTime * 10) / 10 } : m));
    playedFxRef.current.clear();
  };

  const handleDeleteSoundFx = (id) => {
    setSoundFxMarkers(prev => prev.filter(m => m.id !== id));
    playedFxRef.current.clear();
  };

  const handleRunAutoAudioMix = () => {
    if (!activeClip) return;
    setIsAutoMixing(true);
    setAutoMixMessage('AI đang phân tích kịch bản và quét các điểm chuyển cảnh...');

    setTimeout(() => {
      setAutoMixMessage('AI đang nhận diện các từ khóa trọng tâm...');

      setTimeout(() => {
        setAutoMixMessage('AI đang thiết lập cân bằng âm lượng Audio Ducking...');

        setTimeout(() => {
          const clipStart = activeClip.start_time;
          const clipEnd = activeClip.end_time;
          const clipDur = clipEnd - clipStart;

          const newMarkers = [];

          if (autoWhoosh) {
            newMarkers.push({
              id: 'whoosh_start',
              name: 'Whoosh Fast',
              file: 'whoosh.wav',
              time: 0.4,
              category: 'Chuyển cảnh'
            });

            if (clipDur > 20) {
              newMarkers.push({
                id: 'whoosh_mid',
                name: 'Whoosh Fast',
                file: 'whoosh.wav',
                time: Math.round(clipDur * 0.48 * 10) / 10,
                category: 'Chuyển cảnh'
              });
            }
          }

          if (autoDing && currentClipWords.length > 0) {
            const candidateWords = currentClipWords.filter(w => w.word.length >= 5 && (w.start - clipStart) > 2.0);
            const step = Math.max(1, Math.floor(candidateWords.length / 3));
            
            for (let i = 0; i < candidateWords.length && newMarkers.length < 5; i += step) {
              const kw = candidateWords[i];
              const relTime = Math.max(0.8, Math.min(clipDur - 1.0, kw.start - clipStart));
              newMarkers.push({
                id: `ding_${i}`,
                name: 'Ding Bling Sparkle',
                file: 'ding.wav',
                time: Math.round(relTime * 10) / 10,
                category: 'Điểm nhấn'
              });
            }
          }

          setSoundFxMarkers(newMarkers);
          playedFxRef.current.clear();
          setIsAutoMixing(false);
          setAutoMixMessage('');

          try {
            const soundWhoosh = new Audio('/assets/sounds/whoosh.wav');
            soundWhoosh.volume = 0.9;
            soundWhoosh.play().catch(() => {});
          } catch(e) {}
        }, 500);
      }, 500);
    }, 500);
  };

  // Extend Clip Functions
  const handleExtendStart = (seconds = 5) => {
    if (!activeClip) return;
    const newStart = Math.max(0, activeClip.start_time - seconds);
    setActiveClip({
      ...activeClip,
      start_time: newStart,
      duration: activeClip.end_time - newStart
    });
    setCurrentTime(newStart);
  };

  const handleExtendEnd = (seconds = 5) => {
    if (!activeClip) return;
    // BUG #17 FIX: Use actual video duration instead of hardcoded test value
    const maxDur = data?.transcript?.duration || videoRef.current?.duration || 600;
    const newEnd = Math.min(maxDur, activeClip.end_time + seconds);
    setActiveClip({
      ...activeClip,
      end_time: newEnd,
      duration: newEnd - activeClip.start_time
    });
  };

  // Copilot Action Execution Engine
  const handleExecuteCopilotAction = (action) => {
    if (!action || !action.type) return;

    if (action.type === 'set_title' && action.title) {
      setCustomTitle(action.title);
    } else if (action.type === 'update_font' && action.style) {
      setFontStyle(prev => ({ ...prev, ...action.style }));
    } else if (action.type === 'cleanup_speech') {
      handleRemoveAllFillers();
      handleRemoveAllPauses();
    } else if (action.type === 'run_auto_mix') {
      handleRunAutoAudioMix();
    } else if (action.type === 'export_hd') {
      handleExportHd();
    } else if (action.type === 'add_broll') {
      setBrolls(prev => [...prev, { title: action.title || 'B-Roll AI', time: action.time || 2.0 }]);
    }
  };

  const handleClearAllSoundFx = () => {
    setSoundFxMarkers([]);
    playedFxRef.current.clear();
  };

  const handleTogglePause = (pauseIndex) => {
    pushStateToHistory();
    const next = new Set(excludedPauseIndices);
    if (next.has(pauseIndex)) {
      next.delete(pauseIndex);
    } else {
      next.add(pauseIndex);
    }
    setExcludedPauseIndices(next);
  };

  const handleRemoveAllFillers = () => {
    pushStateToHistory();
    const next = new Set(excludedWordIndices);
    currentClipWords.forEach((w, idx) => {
      const clean = w.word.toLowerCase().replace(/[.,!?\"']/g, '').trim();
      if (COMMON_FILLERS_LIST.includes(clean)) {
        next.add(idx);
      }
    });
    setExcludedWordIndices(next);
  };

  const handleRemoveAllPauses = () => {
    pushStateToHistory();
    const next = new Set();
    detectedPausesList.forEach(p => {
      next.add(p.index);
    });
    setExcludedPauseIndices(next);
  };

  // ✨ Áp dụng các từ đã sửa từ AI Spell Checker (Bảo toàn 100% mốc thời gian sóng âm gốc)
  const handleApplySpellCorrections = (acceptedCorrections = []) => {
    if (!acceptedCorrections || acceptedCorrections.length === 0 || !data?.transcript?.words) return;
    pushStateToHistory();

    const newWords = [...data.transcript.words];
    let changedCount = 0;

    for (const item of acceptedCorrections) {
      const sIdx = item.startIndex;
      const eIdx = item.endIndex;
      const targetText = (item.customText || item.suggestedText || '').trim();
      if (!targetText) continue;

      const tokens = targetText.split(/\s+/).filter(Boolean);
      const spanCount = Math.max(1, eIdx - sIdx + 1);

      if (tokens.length === spanCount) {
        // Thay thế 1-to-1 từng từ giữ nguyên start, end
        for (let i = 0; i < spanCount; i++) {
          const wIdx = sIdx + i;
          if (wIdx < newWords.length && newWords[wIdx]) {
            newWords[wIdx] = {
              ...newWords[wIdx],
              word: tokens[i]
            };
            changedCount++;
          }
        }
      } else if (spanCount === 1) {
        // 1 từ gốc thay bằng 1 token
        if (sIdx < newWords.length && newWords[sIdx]) {
          newWords[sIdx] = {
            ...newWords[sIdx],
            word: tokens[0] || targetText
          };
          changedCount++;
        }
      } else {
        // Nếu số lượng token khác spanCount, phân bổ cho các slot
        for (let i = 0; i < spanCount; i++) {
          const wIdx = sIdx + i;
          if (wIdx < newWords.length && newWords[wIdx]) {
            newWords[wIdx] = {
              ...newWords[wIdx],
              word: tokens[i] || (i === 0 ? targetText : '')
            };
            changedCount++;
          }
        }
      }
    }

    if (changedCount > 0) {
      const updatedFullText = newWords.map(w => w.word).filter(Boolean).join(' ');
      setData(prev => ({
        ...prev,
        transcript: {
          ...prev.transcript,
          words: newWords,
          full_text: updatedFullText
        }
      }));
    }
  };

  const handleAddTextLayer = (title, style = 'plain', options = {}) => {
    pushStateToHistory();
    const clipStart = activeClip?.start_time || 0;
    const relTime = Math.max(0, currentTime - clipStart);
    const tStart = options.startTime !== undefined ? options.startTime : Math.round(relTime * 10) / 10;
    const tDur = options.duration !== undefined ? options.duration : 4.0;
    const soundFxId = `sfx_text_${Date.now()}`;

    // 1. Tự động thêm Sound Effect cho Text Layer vào Timeline (mặc định pop.wav hoặc ding.wav)
    const textSound = options.soundFile || 'pop.wav';
    const textSoundName = options.soundName || 'Pop Text Sound';
    setSoundFxMarkers(prev => [
      ...prev,
      {
        id: soundFxId,
        name: textSoundName,
        file: textSound,
        time: tStart,
        category: 'Text Layer'
      }
    ]);
    playedFxRef.current.clear();

    // 2. Phát âm thanh xem trước tức thì
    try {
      const soundUrl = options.soundFileUrl || `/assets/sounds/${textSound}`;
      const snd = new Audio(soundUrl);
      snd.volume = 0.85;
      snd.play().catch(() => {});
    } catch(e) {}

    // 3. Thêm Text Layer với startTime & duration chuẩn xác
    setTextLayers(prev => [
      ...prev,
      {
        id: `tl_${Date.now()}_${prev.length}`,
        text: title,
        style: style,
        startTime: tStart,
        duration: tDur,
        scale: options.scale || 100,
        boxWidth: options.boxWidth || 280,
        paddingY: options.paddingY || 6,
        pos: options.pos || { x: 50, y: 60 + (prev.length % 4) * 8 },
        fontFamily: options.fontFamily || fontStyle?.fontFamily || 'Montserrat',
        fontSize: options.fontSize || 42,
        textColor: options.textColor || '#ffffff',
        fontWeight: options.fontWeight || 'Black',
        strokeColor: options.strokeColor || '#000000',
        strokeWidth: options.strokeWidth ?? 6,
        hasShadow: options.hasShadow ?? true,
        shadowColor: options.shadowColor || '#000000',
        isUppercase: options.isUppercase ?? true,
        animIn: options.animIn || 'pop',
        animInDuration: options.animInDuration ?? 0.35,
        animOut: options.animOut || 'fade_out',
        animOutDuration: options.animOutDuration ?? 0.35,
        soundFxId: soundFxId
      }
    ]);
  };

  const handleUpdateTextLayer = (id, updates) => {
    setTextLayers(prev => prev.map(tl => tl.id === id ? { ...tl, ...updates } : tl));
  };

  const handleUpdateTextLayerPos = (id, pos) => {
    setTextLayers(prev => prev.map(tl => tl.id === id ? { ...tl, pos } : tl));
  };

  const handleRemoveTextLayer = (id) => {
    pushStateToHistory();
    const target = textLayers.find(tl => tl.id === id);
    if (target?.soundFxId) {
      setSoundFxMarkers(prev => prev.filter(sfx => sfx.id !== target.soundFxId));
    }
    setTextLayers(prev => prev.filter(tl => tl.id !== id));
  };

  // 📍 CHẾ ĐỘ CLICK VÀO VIDEO ĐỂ ĐẶT VỊ TRÍ CHỮ
  const [isPlacingTextMode, setIsPlacingTextMode] = useState(false);
  const [pendingTextOptions, setPendingTextOptions] = useState(null);

  const handleStartPlaceTextMode = (options = {}) => {
    setPendingTextOptions(options);
    setIsPlacingTextMode(true);
  };

  const handlePlaceTextAtPos = (pos) => {
    setIsPlacingTextMode(false);
    const textContent = pendingTextOptions?.text || 'VĂN BẢN MỚI';
    const textStyle = pendingTextOptions?.style || 'plain';
    handleAddTextLayer(textContent, textStyle, {
      ...pendingTextOptions,
      pos: pos
    });
    setPendingTextOptions(null);
  };

  const handleCancelPlaceText = () => {
    setIsPlacingTextMode(false);
    setPendingTextOptions(null);
  };

  // 🌟 ANIMATED STICKERS WITH AUTOMATIC TIMELINE SOUND FX
  const handleAddAnimatedSticker = (stickerType, customPos = null) => {
    pushStateToHistory();
    const clipStart = activeClip?.start_time || 0;
    const relTime = Math.max(0, currentTime - clipStart);

    const soundMap = {
      circle_red: { name: 'Whoosh Swish', file: 'whoosh.wav' },
      check_green: { name: 'Ding Bell Ting', file: 'ding.wav' },
      arrow_red: { name: 'Whoosh Fast', file: 'whoosh.wav' },
      arrow_yellow: { name: 'Whoosh Fast', file: 'whoosh.wav' },
      cross_red: { name: 'Thud Error Hit', file: 'whoosh.wav' },
      star_sparkle: { name: 'Chime Sparkle', file: 'ding.wav' },
      question_mark: { name: 'Pop Plop', file: 'ding.wav' },
      focus_box_red: { name: 'Whoosh Fast', file: 'whoosh.wav' },
    };

    const soundInfo = soundMap[stickerType] || { name: 'Ding Bell Ting', file: 'ding.wav' };
    const soundFxId = `sfx_anim_${Date.now()}`;

    // 1. Tự động đồng bộ Sound Effect vào đúng mốc thời gian trên Timeline
    setSoundFxMarkers(prev => [
      ...prev,
      {
        id: soundFxId,
        name: soundInfo.name,
        file: soundInfo.file,
        time: Math.round(relTime * 10) / 10,
        category: 'Animation'
      }
    ]);
    playedFxRef.current.clear();

    // 2. Phát âm thanh xem trước tức thì
    try {
      const snd = new Audio(`/assets/sounds/${soundInfo.file}`);
      snd.volume = 0.85;
      snd.play().catch(() => {});
    } catch(e) {}

    // 3. Thêm Animation Sticker Layer lên Canvas
    setAnimatedStickers(prev => [
      ...prev,
      {
        id: `anim_${Date.now()}`,
        type: stickerType,
        startTime: Math.round(relTime * 10) / 10,
        duration: 4.0,
        scale: 100,
        pos: customPos || { x: 50, y: 50 },
        soundFxId: soundFxId
      }
    ]);
  };

  const handleUpdateAnimatedSticker = (id, updates) => {
    setAnimatedStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveAnimatedSticker = (id) => {
    pushStateToHistory();
    setAnimatedStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleSplitAtPlayhead = () => {
    if (!activeClip || !data) return;
    const splitPoint = currentTime;
    const clipStart = activeClip.start_time || 0;
    const clipEnd = activeClip.end_time || 60;

    const currentScenes = activeClip.scenes && activeClip.scenes.length > 0 ? activeClip.scenes : [
      { id: `${activeClip.id}_sc0`, title: 'Đoạn 1', start_time: clipStart, end_time: clipEnd, transition: null }
    ];

    const targetIdx = currentScenes.findIndex(
      s => splitPoint > s.start_time + 0.5 && splitPoint < s.end_time - 0.5
    );

    if (targetIdx === -1) {
      alert("Không thể cắt tách sát biên phân cảnh (cần cách điểm đầu/cuối tối thiểu 0.5 giây).");
      return;
    }

    const targetScene = currentScenes[targetIdx];
    const baseTitle = targetScene.title.replace(/\s*\([A-Z0-9]+\)$/, '');

    const sceneA = {
      ...targetScene,
      id: `sc_${Date.now()}_${targetIdx}_A`,
      title: `${baseTitle} (A)`,
      end_time: splitPoint,
      transition: 'zoom_in' // Mặc định hiệu ứng chuyển cảnh khi vừa cắt đôi
    };

    const sceneB = {
      ...targetScene,
      id: `sc_${Date.now()}_${targetIdx}_B`,
      title: `${baseTitle} (B)`,
      start_time: splitPoint,
      transition: targetScene.transition || null
    };

    const nextScenes = [...currentScenes];
    nextScenes.splice(targetIdx, 1, sceneA, sceneB);

    setActiveClip({
      ...activeClip,
      scenes: nextScenes
    });
  };

  const handleSplitSceneAtTime = (startTime, endTime = null) => {
    if (!activeClip) return;
    pushStateToHistory();
    const clipStart = activeClip.start_time || 0;
    const clipEnd = activeClip.end_time || 60;

    let currentScenes = activeClip.scenes && activeClip.scenes.length > 0 ? [...activeClip.scenes] : [
      { id: `${activeClip.id}_sc0`, title: 'Đoạn 1', start_time: clipStart, end_time: clipEnd, transition: null }
    ];

    const splitPoints = [startTime];
    if (endTime && endTime > startTime + 0.5 && endTime < clipEnd - 0.3) {
      splitPoints.push(endTime);
    }

    splitPoints.forEach((sp) => {
      const targetIdx = currentScenes.findIndex(
        s => sp > s.start_time + 0.3 && sp < s.end_time - 0.3
      );
      if (targetIdx !== -1) {
        const targetScene = currentScenes[targetIdx];
        const baseTitle = targetScene.title.replace(/\s*\([A-Z0-9]+\)$/, '');
        const sceneA = {
          ...targetScene,
          id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}_A`,
          title: `${baseTitle} (A)`,
          end_time: sp,
          transition: 'zoom_in'
        };
        const sceneB = {
          ...targetScene,
          id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}_B`,
          title: `${baseTitle} (B)`,
          start_time: sp,
          transition: targetScene.transition || null
        };
        currentScenes.splice(targetIdx, 1, sceneA, sceneB);
      }
    });

    setActiveClip({
      ...activeClip,
      scenes: currentScenes
    });
  };

  const handleDeleteScene = (sceneId) => {
    if (!activeClip) return;
    const currentScenes = activeClip.scenes || [];
    if (currentScenes.length <= 1) {
      alert("Không thể xóa hết tất cả phân cảnh. Phải giữ lại ít nhất 1 đoạn video.");
      return;
    }

    const deletedScene = currentScenes.find(s => s.id === sceneId);
    const nextScenes = currentScenes.filter(s => s.id !== sceneId);

    if (deletedScene && nextScenes.length > 0) {
      // 1. Tự động gạch bỏ/loại bỏ toàn bộ từ trong transcript thuộc phân cảnh bị xóa
      const nextExcluded = new Set(excludedWordIndices);
      currentClipWords.forEach((w, idx) => {
        if (w.start >= deletedScene.start_time - 0.1 && w.end <= deletedScene.end_time + 0.1) {
          nextExcluded.add(idx);
        }
      });
      setExcludedWordIndices(nextExcluded);

      // 2. Tính toán lại mốc bắt đầu, kết thúc và trừ thời lượng thực tế của clip
      const newStart = nextScenes[0].start_time;
      const newEnd = nextScenes[nextScenes.length - 1].end_time;
      const netDuration = nextScenes.reduce((sum, s) => sum + Math.max(0, s.end_time - s.start_time), 0);
      const roundedDur = Math.round(netDuration * 100) / 100;

      const updatedClip = {
        ...activeClip,
        start_time: newStart,
        end_time: newEnd,
        duration: roundedDur,
        scenes: nextScenes
      };

      setActiveClip(updatedClip);

      // Cập nhật cả danh sách viral_clips để đồng bộ Clip Cards
      if (data?.viral_clips) {
        setData(prev => ({
          ...prev,
          viral_clips: prev.viral_clips.map(c => c.id === activeClip.id ? updatedClip : c)
        }));
      }

      // 3. Nếu con trỏ phát (currentTime) đang nằm trong đoạn vừa xóa, tự động nhảy về đầu đoạn còn lại
      if (currentTime >= deletedScene.start_time && currentTime <= deletedScene.end_time) {
        const nextTargetTime = nextScenes.find(s => s.start_time >= deletedScene.end_time)?.start_time || newStart;
        setCurrentTime(nextTargetTime);
        if (videoRef.current) {
          videoRef.current.currentTime = nextTargetTime;
        }
      }
    }
  };

  const handleUpdateSceneTransition = (sceneId, transitionType) => {
    if (!activeClip) return;
    const currentScenes = activeClip.scenes || [];
    const nextScenes = currentScenes.map(s => {
      if (s.id === sceneId) {
        return { ...s, transition: transitionType === 'none' ? null : transitionType };
      }
      return s;
    });

    setActiveClip({
      ...activeClip,
      scenes: nextScenes
    });
  };

  // BUG #11 FIX: Delete the actually selected layer by its ID
  const handleDeleteSelectedLayer = () => {
    if (selectedBrollId) {
      setBrolls(prev => prev.filter(b => b.id !== selectedBrollId));
      setSelectedBrollId(null);
    } else if (selectedTextLayerId) {
      setTextLayers(prev => prev.filter(t => t.id !== selectedTextLayerId));
      setSelectedTextLayerId(null);
    } else if (selectedAnimatedStickerId) {
      setAnimatedStickers(prev => prev.filter(s => s.id !== selectedAnimatedStickerId));
      setSelectedAnimatedStickerId(null);
    } else if (brolls.length > 0) {
      setBrolls(prev => prev.slice(0, -1));
    } else if (textLayers.length > 0) {
      setTextLayers(prev => prev.slice(0, -1));
    } else if (soundFxMarkers.length > 0) {
      setSoundFxMarkers(prev => prev.slice(0, -1));
    }
  };

  const handleExport = async () => {
    if (!activeClip) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/cut-custom-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: activeClip.id,
          excluded_word_indices: Array.from(excludedWordIndices),
          excluded_pause_indices: Array.from(excludedPauseIndices)
        })
      });
      const resJson = await res.json();
      if (res.ok) {
        alert(`Đã xuất cắt nhanh thành công!\nFile lưu tại: ${resJson.file_path}`);
      } else {
        alert(`Lỗi xuất video: ${resJson.detail || "Không rõ"}`);
      }
    } catch (err) {
      alert(`Lỗi kết nối: ${err.message}`);
    }
  };

  const handleExportHd = async () => {
    if (!activeClip) return;
    setIsExportingHd(true);

    try {
      // 📸 Chụp Snapshot Đồ Họa độ phân giải cao chuẩn 1080x1920 (WYSIWYG)
      const canvasContainer = document.getElementById('opus-canvas-container');
      const containerWidth = canvasContainer ? canvasContainer.getBoundingClientRect().width : 340;
      const pixelRatio = Math.max(1.5, Math.min(4.5, 1080 / containerWidth));

      let titleCardPng = null;
      const titleEl = document.getElementById('title-card-capture');
      if (titleEl && titleConfig?.visible !== false) {
        try {
          titleCardPng = await toPng(titleEl, {
            pixelRatio,
            backgroundColor: 'transparent',
            filter: (node) => !node.classList?.contains('export-ignore-handle') && !node.classList?.contains('element-action-toolbar')
          });
        } catch (e) {
          console.warn('Error capturing title card snapshot:', e);
        }
      }

      let brandLogoPng = null;
      const logoEl = document.getElementById('brand-logo-capture');
      if (logoEl && brandConfig?.showLogo) {
        try {
          brandLogoPng = await toPng(logoEl, {
            pixelRatio,
            backgroundColor: 'transparent',
            filter: (node) => !node.classList?.contains('export-ignore-handle') && !node.classList?.contains('element-action-toolbar')
          });
        } catch (e) {
          console.warn('Error capturing brand logo snapshot:', e);
        }
      }

      const res = await fetch('http://127.0.0.1:8000/api/export-hd-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: activeClip.id,
          custom_title: customTitle || activeClip.title,
          title_card_image: titleCardPng,
          brand_logo_image: brandLogoPng,
          title_config: titleConfig,
          caption_config: captionConfig,
          caption_preset: captionPreset,
          font_style: fontStyle,
          brand_config: brandConfig,
          text_layers: textLayers,
          sound_fx_markers: soundFxMarkers,
          auto_whoosh: autoWhoosh,
          auto_ding: autoDing,
          brolls: brolls,
          selected_bgm: selectedBgm,
          bgm_volume: bgmVolume,
          excluded_word_indices: Array.from(excludedWordIndices),
          excluded_pause_indices: Array.from(excludedPauseIndices),
          skip_intervals: skipIntervals,
          scenes: activeClip.scenes || []
        })
      });
      const resJson = await res.json();
      if (res.ok) {
        // Tự động kích hoạt tải video về máy tính
        const downloadUrl = `http://127.0.0.1:8000/api/download-clip/${resJson.file_name}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = resJson.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`✅ XUẤT VIDEO 9:16 FULL HD THÀNH CÔNG!\n\nĐộ phân giải: 1080x1920 Full HD (CRF 18)\nFile đã bắt đầu tải về máy: ${resJson.file_name}\nĐường dẫn lưu trữ: ${resJson.file_path}`);
      } else {
        alert(`Lỗi Render HD: ${resJson.detail || "Không rõ"}`);
      }
    } catch (err) {
      alert(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setIsExportingHd(false);
    }
  };

  // 💾 Lưu Tạm Toàn Bộ Dự Án Video vào IndexedDB Vault của Trình Duyệt
  const handleSaveProject = async () => {
    if (!activeClip) return;
    
    const projectState = {
      id: data?.video_metadata?.id || `proj_${Date.now()}`,
      title: customTitle || activeClip.title || 'Dự Án Video',
      video_metadata: data?.video_metadata,
      transcript: data?.transcript,
      viral_clips: data?.viral_clips,
      clip_id: activeClip.id,
      clip: activeClip,
      scenes: activeClip.scenes || [],
      customTitle: customTitle || activeClip.title,
      transcriptWords: data?.transcript?.words,
      fontStyle,
      captionPreset,
      captionEffect,
      titleConfig,
      captionConfig,
      brandConfig,
      textLayers,
      animatedStickers,
      brolls,
      soundFxMarkers,
      excludedWordIndices: Array.from(excludedWordIndices),
      excludedPauseIndices: Array.from(excludedPauseIndices),
      aspectRatio,
      videoLayout,
      activeTransition,
      speechEnhance,
      savedAt: new Date().toISOString()
    };

    try {
      await saveProjectToVault(projectState);
      localStorage.setItem('opus_current_project', JSON.stringify({
        ...data,
        editor_state: projectState
      }));
      alert(`✅ ĐÃ LƯU DỰ ÁN VÀO TRÌNH DUYỆT THÀNH CÔNG!\n\nDự án "${customTitle || activeClip.title}" đã được lưu trữ an toàn trong IndexedDB của máy bạn.`);
    } catch (err) {
      console.error("Save project error:", err);
      alert(`Lỗi lưu dự án: ${err.message}`);
    }
  };

  const handleSelectClipToPreview = (clip) => {
    setSelectedPreviewClip(clip);
  };

  const handleGoToEditor = (clip) => {
    setSelectedPreviewClip(null);
    const targetClip = clip || (data?.viral_clips && data.viral_clips[0]);
    if (!targetClip) {
      setCurrentView('editor');
      return;
    }

    setActiveClip(targetClip);
    setCurrentTime(targetClip.start_time || 0);
    setCustomTitle(targetClip.title || "Clip Studio");

    // Khôi phục bản lưu tạm nếu có
    let restored = false;
    try {
      const videoId = data?.video_metadata?.id || 'default';
      const localSaved = localStorage.getItem(`opus_saved_project_${videoId}_${targetClip.id}`) || localStorage.getItem(`opus_saved_project_${targetClip.id}`);
      const backendState = data?.editor_state;
      const p = localSaved ? JSON.parse(localSaved) : (backendState || null);
      if (p) {
        if (p.customTitle) setCustomTitle(p.customTitle);
        if (p.transcriptWords && data?.transcript) {
          setData(prev => ({
            ...prev,
            transcript: {
              ...prev.transcript,
              words: p.transcriptWords
            }
          }));
        }
        if (p.fontStyle) setFontStyle(p.fontStyle);
        if (p.captionPreset) setCaptionPreset(p.captionPreset);
        if (p.captionEffect) setCaptionEffect(p.captionEffect);
        if (p.titleConfig) setTitleConfig(p.titleConfig);
        if (p.captionConfig) setCaptionConfig(p.captionConfig);
        if (p.brandConfig) setBrandConfig(p.brandConfig);
        if (p.textLayers) setTextLayers(p.textLayers);
        if (p.animatedStickers) setAnimatedStickers(p.animatedStickers);
        if (p.brolls) setBrolls(p.brolls);
        if (p.soundFxMarkers) setSoundFxMarkers(p.soundFxMarkers);
        if (p.excludedWordIndices) setExcludedWordIndices(new Set(p.excludedWordIndices));
        if (p.excludedPauseIndices) setExcludedPauseIndices(new Set(p.excludedPauseIndices));
        if (p.aspectRatio) setAspectRatio(p.aspectRatio);
        if (p.videoLayout) setVideoLayout(p.videoLayout);
        if (p.activeTransition) setActiveTransition(p.activeTransition);
        if (p.speechEnhance !== undefined) setSpeechEnhance(p.speechEnhance);
        if (p.clip?.scenes && p.clip.scenes.length > 0) {
          setActiveClip(p.clip);
        } else if (p.scenes && p.scenes.length > 0) {
          setActiveClip({ ...targetClip, scenes: p.scenes });
        }
        restored = true;
      }
    } catch(e) {}

    if (!restored) {
      setExcludedWordIndices(new Set());
      setExcludedPauseIndices(new Set());
      setBrolls([]);
      setTextLayers([]);
      setAnimatedStickers([]);
      setSoundFxMarkers([]);
    }

    playedFxRef.current.clear();
    setCurrentView('editor');
  };

  const handleSelectElementToCustomize = (type, id = null) => {
    if (type === 'captions') {
      setActiveSidebarTab('captions');
    } else if (type === 'broll') {
      setActiveSidebarTab('broll');
    } else if (type === 'text') {
      if (id) {
        setSelectedTextLayerId(id);
        setActiveSidebarTab('text');
      }
    } else if (type === 'title' || type === 'brand' || type === 'logo') {
      setActiveSidebarTab('brand');
    } else if (type === 'animation') {
      setActiveSidebarTab('animation');
    } else if (type === 'audio' || type === 'sound') {
      setActiveSidebarTab('audio');
    } else if (type === 'transitions') {
      setActiveSidebarTab('transitions');
    }
  };

  const clipDuration = activeClip ? (activeClip.end_time - activeClip.start_time) : 30;

  return (
    <div className="h-screen w-screen bg-[#090a0f] flex flex-col font-sans text-slate-100 overflow-hidden select-none">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Đang tải Opus AI Studio...</p>
          </div>
        </div>
      ) : currentView === 'upload' ? (
        <UploadView
          onProcessSuccess={handleProcessSuccess}
          onBack={data?.has_data ? () => setCurrentView(data.viral_clips?.length > 1 ? 'dashboard' : 'editor') : null}
          onStartProcessing={handleStartProcessing}
          onCancelProcessing={handleCancelProcessing}
          isProcessing={isProcessing}
          jobStatus={jobStatus}
        />
      ) : currentView === 'dashboard' ? (
        <>
          <DashboardView
            videoTitle={data?.video_metadata?.title}
            clips={data?.viral_clips || []}
            sourceVideoUrl={data?.video_metadata?.blob_url || data?.video_metadata?.video_path}
            isAudioOnly={Boolean(data?.video_metadata?.is_audio_only || data?.video_metadata?.media_type === 'audio')}
            onSelectClip={handleSelectClipToPreview}
            onOpenUpload={() => setCurrentView('upload')}
            onGoToEditor={handleGoToEditor}
          />

          <ClipPreviewModal
            clip={selectedPreviewClip}
            isOpen={!!selectedPreviewClip}
            onClose={() => setSelectedPreviewClip(null)}
            onGoToEditor={handleGoToEditor}
            words={data?.transcript?.words || []}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onSpeechCleanup={() => setActiveCleanupMode('fillers')}
            speechEnhance={speechEnhance}
            onToggleSpeechEnhance={() => setSpeechEnhance(!speechEnhance)}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            videoLayout={videoLayout}
            setVideoLayout={setVideoLayout}
            faceTrackerEnabled={faceTrackerEnabled}
            setFaceTrackerEnabled={setFaceTrackerEnabled}
            onExport={handleExport}
            onExportHd={handleExportHd}
            onExportWysiwyg={() => setIsWysiwygModalOpen(true)}
            onSaveProject={handleSaveProject}
            onOpenProjects={() => setIsProjectsModalOpen(true)}
            isExportingHd={isExportingHd}
            videoTitle={data?.video_metadata?.title}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
            isCopilotOpen={isCopilotOpen}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            clipDuration={clipDuration}
            onExtendStart={handleExtendStart}
            onExtendEnd={handleExtendEnd}
            onUndo={handleUndo}
            canUndo={historyIndex > 0}
            onRedo={handleRedo}
            canRedo={historyIndex < historyStack.length - 1}
            onToggleLayersDrawer={() => setIsLayersDrawerOpen(!isLayersDrawerOpen)}
            isLayersDrawerOpen={isLayersDrawerOpen}
          />

          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Script / Transcript Editor (Kéo dịch chuyển độ rộng tùy ý) */}
            <div 
              style={{ width: `${leftPanelWidth}px` }} 
              className="h-full overflow-hidden shrink-0 relative"
            >
              <OpusTranscript
                clip={activeClip}
                words={data?.transcript?.words || []}
                currentTime={currentTime}
                onSeekWord={handleSeek}
                excludedWordIndices={excludedWordIndices}
                onToggleExcludeWords={handleToggleExcludeWords}
                onEditPhraseText={handleEditPhraseText}
                onOpenBrollPicker={handleOpenBrollPicker}
                onOpenSoundFxPicker={handleOpenSoundFxPicker}
                onAddTextLayer={handleAddTextLayer}
                onSplitSceneAtTime={handleSplitSceneAtTime}
                excludedPauseIndices={excludedPauseIndices}
                onTogglePause={handleTogglePause}
                highlightKeywords={highlightKeywords}
                pauseThreshold={pauseThreshold}
                activeCleanupMode={activeCleanupMode}
                onOpenSpellCheck={() => setIsSpellCheckModalOpen(true)}
              />
            </div>

            {/* 📏 Vạch Phân Cách Kéo Thả 1 (Transcript <-> Preview) */}
            <div
              onMouseDown={(e) => handleStartResize('left', e)}
              title="↔️ Kéo sang trái / phải để điều chỉnh độ rộng khung kịch bản Transcript"
              className={`w-1.5 hover:w-2.5 h-full cursor-col-resize select-none flex items-center justify-center transition-all z-30 group shrink-0 ${
                resizingPanel === 'left' 
                  ? 'bg-indigo-500 w-2.5 shadow-lg shadow-indigo-500/50' 
                  : 'bg-[#151724] hover:bg-indigo-500/80 border-r border-[#202336]'
              }`}
            >
              <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* Center: Video Canvas Preview với Full Live Visual Transformations, Kéo Thả, Zoom To Nhỏ & Sửa/Xóa */}
            <div className="flex-1 h-full overflow-hidden min-w-[260px] relative">
              <OpusCanvasPreview
                videoRef={videoRef}
                clip={activeClip}
                words={data?.transcript?.words || []}
                currentTime={currentTime}
                sourceVideoUrl={data?.video_metadata?.blob_url || data?.video_metadata?.video_path || '/api/stream/source'}
                captionPreset={captionPreset}
                setCaptionPreset={setCaptionPreset}
                captionEffect={captionEffect}
                customTitle={customTitle}
                setCustomTitle={setCustomTitle}
                aspectRatio={aspectRatio}
                videoLayout={videoLayout}
                faceTrackerEnabled={faceTrackerEnabled}
                isAudioOnly={Boolean(data?.video_metadata?.is_audio_only || data?.video_metadata?.media_type === 'audio' || data?.video_metadata?.author === 'File Ghi Âm')}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onTimeUpdate={handleTimeUpdate}
                brolls={brolls}
                textLayers={textLayers}
                animatedStickers={animatedStickers}
                onUpdateAnimatedSticker={handleUpdateAnimatedSticker}
                onRemoveAnimatedSticker={handleRemoveAnimatedSticker}
                onOpenAudioTab={() => setActiveSidebarTab('audio')}
                fontStyle={fontStyle}
                setFontStyle={setFontStyle}
                aiEmoji={aiEmoji}
                autoCensor={autoCensor}
                speakerColors={speakerColors}
                brandConfig={brandConfig}
                onUpdateBrandConfig={setBrandConfig}
                titleConfig={titleConfig}
                onUpdateTitleConfig={setTitleConfig}
                captionConfig={captionConfig}
                onUpdateCaptionConfig={setCaptionConfig}
                captionPos={captionConfig.pos}
                onUpdateCaptionPos={(newPos) => setCaptionConfig(prev => ({ ...prev, pos: newPos }))}
                onUpdateTextLayer={handleUpdateTextLayer}
                onUpdateTextLayerPos={handleUpdateTextLayerPos}
                activeTransition={activeTransition}
                onSelectElementToCustomize={handleSelectElementToCustomize}
                onRemoveTextLayer={handleRemoveTextLayer}
                onRemoveBroll={(brollId) => setBrolls(prev => prev.filter(b => b.id !== brollId))}
                onEditPhraseText={handleEditPhraseText}
                isPlacingTextMode={isPlacingTextMode}
                onPlaceTextAtPos={handlePlaceTextAtPos}
                onCancelPlaceText={handleCancelPlaceText}
                layerOrder={layerOrder}
                isExporting={isExportingHd}
                excludedWordIndices={excludedWordIndices}
              />
            </div>

            {/* 📏 Vạch Phân Cách Kéo Thả 2 (Preview <-> Tools Sidebar) */}
            <div
              onMouseDown={(e) => handleStartResize('right', e)}
              title="↔️ Kéo sang trái / phải để điều chỉnh độ rộng bảng công cụ Opus Tools"
              className={`w-1.5 hover:w-2.5 h-full cursor-col-resize select-none flex items-center justify-center transition-all z-30 group shrink-0 ${
                resizingPanel === 'right' 
                  ? 'bg-indigo-500 w-2.5 shadow-lg shadow-indigo-500/50' 
                  : 'bg-[#151724] hover:bg-indigo-500/80 border-l border-[#202336]'
              }`}
            >
              <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* Right: Opus Tools Sidebar (Kéo dịch chuyển độ rộng tùy ý) */}
            <div 
              style={{ width: `${rightPanelWidth}px` }} 
              className="h-full overflow-hidden shrink-0 relative"
            >
              <OpusRightSidebar
                activeTab={activeSidebarTab}
                setActiveTab={setActiveSidebarTab}
                captionPreset={captionPreset}
                setCaptionPreset={setCaptionPreset}
                captionEffect={captionEffect}
                setCaptionEffect={setCaptionEffect}
                highlightKeywords={highlightKeywords}
                setHighlightKeywords={setHighlightKeywords}
                speechEnhance={speechEnhance}
                setSpeechEnhance={setSpeechEnhance}
                aiEmoji={aiEmoji}
                setAiEmoji={setAiEmoji}
                autoCensor={autoCensor}
                setAutoCensor={setAutoCensor}
                autoTransitions={autoTransitions}
                setAutoTransitions={setAutoTransitions}
                activeTransition={activeTransition}
                setActiveTransition={setActiveTransition}
                speakerColors={speakerColors}
                setSpeakerColors={setSpeakerColors}
                autoWhoosh={autoWhoosh}
                setAutoWhoosh={setAutoWhoosh}
                autoDing={autoDing}
                setAutoDing={setAutoDing}
                audioDucking={audioDucking}
                setAudioDucking={setAudioDucking}
                autoBroll={autoBroll}
                setAutoBroll={setAutoBroll}
                fontStyle={fontStyle}
                setFontStyle={setFontStyle}
                brandConfig={brandConfig}
                setBrandConfig={setBrandConfig}
                titleConfig={titleConfig}
                setTitleConfig={setTitleConfig}
                customTitle={customTitle}
                setCustomTitle={setCustomTitle}
                selectedBgm={selectedBgm}
                setSelectedBgm={setSelectedBgm}
                bgmVolume={bgmVolume}
                setBgmVolume={setBgmVolume}
                customBgmList={customBgmList}
                setCustomBgmList={setCustomBgmList}
                onRemoveAllFillers={handleRemoveAllFillers}
                onRemoveAllPauses={handleRemoveAllPauses}
                pauseThreshold={pauseThreshold}
                setPauseThreshold={setPauseThreshold}
                detectedFillersCount={detectedFillersCount}
                detectedPausesCount={detectedPausesCount}
                activeCleanupMode={activeCleanupMode}
                setActiveCleanupMode={setActiveCleanupMode}
                onOpenSpellCheck={() => setIsSpellCheckModalOpen(true)}
                onOpenBrollPicker={handleOpenBrollPicker}
                onOpenSoundFxPicker={handleOpenSoundFxPicker}
                onInsertSoundFx={handleSelectSoundFx}
                onAddTextLayer={handleAddTextLayer}
                textLayers={textLayers}
                selectedTextLayerId={selectedTextLayerId}
                setSelectedTextLayerId={setSelectedTextLayerId}
                onRemoveTextLayer={handleRemoveTextLayer}
                onUpdateTextLayer={handleUpdateTextLayer}
                onReorderTextLayers={handleReorderTextLayers}
                isPlacingTextMode={isPlacingTextMode}
                onStartPlaceTextMode={handleStartPlaceTextMode}
                onCancelPlaceText={handleCancelPlaceText}
                brolls={brolls}
                onDeleteBroll={(brollId) => setBrolls(prev => prev.filter(b => b.id !== brollId))}
                onUpdateBroll={handleUpdateBroll}
                onAddAnimatedSticker={handleAddAnimatedSticker}
                animatedStickers={animatedStickers}
                onRemoveAnimatedSticker={handleRemoveAnimatedSticker}
                onUpdateAnimatedSticker={handleUpdateAnimatedSticker}
                onRunAutoAudioMix={handleRunAutoAudioMix}
                isAutoMixing={isAutoMixing}
                autoMixMessage={autoMixMessage}
                soundFxCount={soundFxMarkers.length}
                onClearAllSoundFx={handleClearAllSoundFx}
                clip={activeClip}
                selectedTransitionSceneId={selectedTransitionSceneId}
                setSelectedTransitionSceneId={setSelectedTransitionSceneId}
                onUpdateSceneTransition={handleUpdateSceneTransition}
                layerOrder={layerOrder}
                setLayerOrder={setLayerOrder}
                onMoveLayerUp={handleMoveLayerUp}
                onMoveLayerDown={handleMoveLayerDown}
                onBringLayerToFront={handleBringLayerToFront}
                onSendLayerToBack={handleSendLayerToBack}
                onMoveBrollUp={handleMoveBrollUp}
                onMoveBrollDown={handleMoveBrollDown}
              />
            </div>

            {/* 📏 Vạch Phân Cách Kéo Thả 3 (Tools Sidebar <-> Layers Drawer) */}
            {isLayersDrawerOpen && (
              <div
                onMouseDown={(e) => handleStartResize('layers', e)}
                title="↔️ Kéo sang trái / phải để điều chỉnh độ rộng bảng Quản lý lớp Canva"
                className={`w-1.5 hover:w-2.5 h-full cursor-col-resize select-none flex items-center justify-center transition-all z-30 group shrink-0 ${
                  resizingPanel === 'layers' 
                    ? 'bg-indigo-500 w-2.5 shadow-lg shadow-indigo-500/50' 
                    : 'bg-[#151724] hover:bg-indigo-500/80 border-l border-[#202336]'
                }`}
              >
                <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
              </div>
            )}

            {/* Far Right: Vertical Layers & Timeline Drawer (Phong cách Canva - Kéo dịch chuyển độ rộng tùy ý) */}
            {isLayersDrawerOpen && (
              <div 
                style={{ width: `${layersDrawerWidth}px` }} 
                className="h-full bg-[#131520] overflow-hidden shrink-0 shadow-2xl z-20 animate-fade-in relative"
              >
                <OpusVerticalLayersDrawer
                  isOpen={isLayersDrawerOpen}
                  onClose={() => setIsLayersDrawerOpen(false)}
                  clipDuration={clipDuration}
                  currentTime={currentTime}
                  onSeek={handleSeek}
                  titleConfig={titleConfig}
                  onUpdateTitleConfig={setTitleConfig}
                  customTitle={customTitle}
                  setCustomTitle={setCustomTitle}
                  onUpdateCustomTitle={setCustomTitle}
                  textLayers={textLayers}
                  onUpdateTextLayer={handleUpdateTextLayer}
                  onRemoveTextLayer={handleRemoveTextLayer}
                  selectedTextLayerId={selectedTextLayerId}
                  setSelectedTextLayerId={setSelectedTextLayerId}
                  onReorderTextLayers={handleReorderTextLayers}
                  animatedStickers={animatedStickers}
                  onUpdateAnimatedSticker={handleUpdateAnimatedSticker}
                  onRemoveAnimatedSticker={handleRemoveAnimatedSticker}
                  selectedAnimatedStickerId={selectedAnimatedStickerId}
                  setSelectedAnimatedStickerId={setSelectedAnimatedStickerId}
                  brolls={brolls}
                  onUpdateBroll={handleUpdateBroll}
                  onDeleteBroll={(id) => setBrolls(prev => prev.filter(b => b.id !== id))}
                  onReorderBrolls={handleReorderBrolls}
                  selectedBrollId={selectedBrollId}
                  setSelectedBrollId={setSelectedBrollId}
                  soundFxMarkers={soundFxMarkers}
                  onUpdateSoundFxTime={handleUpdateSoundFxTime}
                  onDeleteSoundFx={handleDeleteSoundFx}
                  onSelectElement={handleSelectElementToCustomize}
                />
              </div>
            )}
          </div>

          {/* 📏 Vạch Phân Cách Kéo Thả Ngang (Workspace <-> Timeline) */}
          <div
            onMouseDown={(e) => handleStartResize('timeline', e)}
            title="↕️ Kéo lên / xuống để nâng cao hoặc hạ thấp thanh Timeline"
            className={`h-1.5 hover:h-2.5 w-full cursor-row-resize select-none flex items-center justify-center transition-all z-30 group shrink-0 ${
              resizingPanel === 'timeline' 
                ? 'bg-indigo-500 h-2.5 shadow-lg shadow-indigo-500/50' 
                : 'bg-[#10121d] hover:bg-indigo-500/80 border-t border-b border-[#1b1e2e]'
            }`}
          >
            <div className="h-0.5 w-16 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
          </div>

          {/* Bottom Multi-Track Timeline */}
          <OpusTimeline
            clip={activeClip}
            currentTime={currentTime}
            onSeek={handleSeek}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            totalDuration={data?.transcript?.duration || 142.17}
            customHeight={timelineHeight}
            titleConfig={titleConfig}
            onUpdateTitleConfig={setTitleConfig}
            customTitle={customTitle}
            brolls={brolls}
            soundFxMarkers={soundFxMarkers}
            textLayers={textLayers}
            onUpdateTextLayer={handleUpdateTextLayer}
            onDeleteTextLayer={handleRemoveTextLayer}
            selectedTextLayerId={selectedTextLayerId}
            onSelectTextLayer={(id) => {
              setSelectedTextLayerId(id);
              if (id) {
                handleSelectElementToCustomize('text', id);
              }
            }}
            animatedStickers={animatedStickers}
            skipIntervals={skipIntervals}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onDeleteSelectedLayer={handleDeleteSelectedLayer}
            onAddMediaTrack={() => setIsBrollPickerOpen(true)}
            onOpenAudioTab={() => setActiveSidebarTab('audio')}
            onOpenTransitionsTab={handleOpenTransitionsTab}
            onUpdateSoundFxTime={handleUpdateSoundFxTime}
            onDeleteSoundFx={handleDeleteSoundFx}
            onDeleteBroll={(id) => setBrolls(prev => prev.filter(b => b.id !== id))}
            onUpdateBroll={handleUpdateBroll}
            onDeleteScene={handleDeleteScene}
            onDeleteAnimatedSticker={handleRemoveAnimatedSticker}
            onUpdateAnimatedSticker={handleUpdateAnimatedSticker}
            onUpdateSceneTransition={handleUpdateSceneTransition}
          />

          {/* AI Producer Copilot Drawer */}
          <AICopilotDrawer
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            clip={activeClip}
            fontStyle={fontStyle}
            soundFxCount={soundFxMarkers.length}
            onExecuteAction={handleExecuteCopilotAction}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        </div>
      )}

      {/* B-Roll Selection Modal */}
      <ErrorBoundary onReset={() => setIsBrollPickerOpen(false)}>
        <BrollPickerModal
          isOpen={isBrollPickerOpen}
          onClose={() => setIsBrollPickerOpen(false)}
          onSelect={handleSelectBroll}
          timeRange={brollTimeRange}
          clipStartTime={activeClip?.start_time || 0}
        />
      </ErrorBoundary>

      {/* Sound FX Selection Modal */}
      <ErrorBoundary onReset={() => setIsSoundFxPickerOpen(false)}>
        <SoundFxPickerModal
          isOpen={isSoundFxPickerOpen}
          onClose={() => setIsSoundFxPickerOpen(false)}
          onSelect={handleSelectSoundFx}
          timestamp={soundFxTimestamp}
        />
      </ErrorBoundary>

      {/* 📂 Modal Kho Dự Án Video (Bảo lưu toàn bộ video cũ, không bao giờ bị mất) */}
      <ErrorBoundary onReset={() => setIsProjectsModalOpen(false)}>
        <ProjectsLibraryModal
          isOpen={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          onSwitchProject={handleSwitchProject}
        />
      </ErrorBoundary>

      {/* 🎬 Modal Xuất Video WYSIWYG Chuẩn CapCut (Khớp 100% Preview) */}
      <ErrorBoundary onReset={() => setIsWysiwygModalOpen(false)}>
        <WysiwygExportModal
          isOpen={isWysiwygModalOpen}
          onClose={() => setIsWysiwygModalOpen(false)}
          clip={activeClip}
          sourceVideoUrl={data?.video_metadata?.blob_url || data?.video_metadata?.video_path || '/api/stream/source'}
          words={data?.transcript?.words || []}
          customTitle={customTitle || activeClip?.title || ''}
          titleConfig={titleConfig}
          brandConfig={brandConfig}
          captionConfig={captionConfig}
          fontStyle={fontStyle}
          textLayers={textLayers}
          animatedStickers={animatedStickers}
          brolls={brolls}
          skipIntervals={skipIntervals}
          soundFxMarkers={soundFxMarkers}
          selectedBgm={selectedBgm}
          bgmVolume={bgmVolume}
          videoLayout={videoLayout}
          isAudioOnly={Boolean(data?.video_metadata?.is_audio_only || data?.video_metadata?.media_type === 'audio' || data?.video_metadata?.author === 'File Ghi Âm')}
          layerOrder={layerOrder}
          activeTransition={activeTransition}
          currentTime={currentTime}
          onSeek={handleSeek}
          setIsExporting={setIsExportingHd}
          totalDuration={data?.transcript?.duration || activeClip?.duration || 180}
          excludedWordIndices={excludedWordIndices}
          speechEnhance={speechEnhance}
        />

        {/* ✨ Modal AI Sửa Chính Tả & Thuật Ngữ (1-to-1 Word Replacement) */}
        <OpusSpellCheckModal
          isOpen={isSpellCheckModalOpen}
          onClose={() => setIsSpellCheckModalOpen(false)}
          words={data?.transcript?.words || []}
          onApplyCorrections={handleApplySpellCorrections}
          apiKey={localStorage.getItem('opus_gemini_api_key') || ''}
          selectedModel={selectedModel}
          onSeekWord={handleSeek}
        />
      </ErrorBoundary>
    </div>
  );
}
