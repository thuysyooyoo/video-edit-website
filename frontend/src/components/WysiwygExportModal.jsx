import React, { useState, useEffect, useRef } from 'react';
import { toCanvas } from 'html-to-image';
import { renderCompositedFrame } from '../utils/canvasCompositor';
import { calculateMicroZoomFactor } from '../utils/microZoomEngine';
import { Film, CheckCircle2, AlertCircle, X, Download, Loader2, Sparkles } from 'lucide-react';
import ysFixWebmDuration from 'fix-webm-duration';

export default function WysiwygExportModal({
  isOpen,
  onClose,
  clip,
  sourceVideoUrl = "http://127.0.0.1:8000/api/stream/source",
  words = [],
  customTitle = '',
  titleConfig = {},
  brandConfig = {},
  captionConfig = {},
  captionPreset = 'pop',
  fontStyle = {},
  textLayers = [],
  animatedStickers = [],
  brolls = [],
  skipIntervals = [],
  soundFxMarkers = [],
  selectedBgm = 'none',
  bgmVolume = 25,
  videoLayout = 'fill',
  isAudioOnly = false,
  layerOrder = [],
  activeTransition = 'none',
  currentTime = 0,
  onSeek,
  setIsExporting,
  totalDuration = 180,
  excludedWordIndices = new Set()
}) {
  const [status, setStatus] = useState('idle'); // idle | preparing | recording | converting | completed | error
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Đang chuẩn bị dữ liệu...');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canvasRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isCancelledRef = useRef(false);
  const loadedMediaRef = useRef(new Map());
  const loadedLogoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const bgmAudioRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const isCapturingFrameRef = useRef(false);
  const isSeekingSkipRef = useRef(false);

  // Helper làm sạch tên tệp tin an toàn tuyệt đối trên Windows / macOS (xóa bỏ ký tự cấm : ? / \)
  const sanitizeFileName = (rawTitle) => {
    const cleanStr = (rawTitle || 'clip_video')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Chuyển tiếng Việt có dấu thành không dấu
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();
    return `OPUS_STUDIO_${cleanStr || 'CLIP'}_1080P.webm`;
  };

  // Tính toán thời lượng chuẩn xác (không bị giới hạn 30s)
  const clipStart = clip?.start_time ?? 0;
  const clipEnd = clip?.end_time ?? (clip?.duration ? (clipStart + clip.duration) : (totalDuration || 180));
  const rawDuration = Math.max(1, clipEnd - clipStart);
  
  const skippedTotal = (skipIntervals || []).reduce((acc, curr) => {
    const s = Math.max(clipStart, Math.min(clipEnd, curr.start));
    const e = Math.max(clipStart, Math.min(clipEnd, curr.end));
    return acc + Math.max(0, e - s);
  }, 0);
  const actualDuration = Math.max(1, rawDuration - skippedTotal);

  const formatSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(2);
    return `${m.toString().padStart(2, '0')}:${s.padStart(5, '0')}`;
  };

  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      if (setIsExporting) setIsExporting(true);
      startExportProcess();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    isCancelledRef.current = true;
    if (setIsExporting) setIsExporting(false);
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current.src = '';
    }
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.src = '';
      bgmAudioRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const soundBuffersRef = useRef(new Map());

  // Preload toàn bộ ảnh/video B-Roll, Logo và Sound FX AudioBuffers vào bộ nhớ
  const preloadMedia = async (audioCtx) => {
    loadedMediaRef.current.clear();
    soundBuffersRef.current.clear();
    loadedLogoRef.current = null;

    // 1. Đợi Web Fonts nạp đầy đủ (Vietnamese glyphs)
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 2. Preload Logo
    if (brandConfig?.showLogo && brandConfig?.logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = brandConfig.logoUrl;
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = () => {
          const fallbackImg = new Image();
          fallbackImg.src = brandConfig.logoUrl;
          fallbackImg.onload = () => {
            loadedLogoRef.current = fallbackImg;
            resolve();
          };
          fallbackImg.onerror = resolve;
        };
      });
      if (img.complete && img.naturalWidth > 0) {
        loadedLogoRef.current = img;
      }
    }

    // 3. Preload B-Rolls
    for (const b of brolls || []) {
      const src = b.fileUrl || b.imageUrl || b.videoUrl;
      if (!src) continue;
      
      const isVideo = b.mediaType === 'video' || (src && /\.(mp4|mov|webm|mkv|m4v)/i.test(src));
      if (isVideo) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.src = src;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        loadedMediaRef.current.set(b.id, v);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        await new Promise(resolve => {
          img.onload = () => {
            loadedMediaRef.current.set(b.id, img);
            resolve();
          };
          img.onerror = () => {
            const fallbackImg = new Image();
            fallbackImg.src = src;
            fallbackImg.onload = () => {
              loadedMediaRef.current.set(b.id, fallbackImg);
              resolve();
            };
            fallbackImg.onerror = resolve;
          };
        });
      }
    }

    // 4. 🔊 PRELOAD TOÀN BỘ SOUND FX THÀNH AUDIOBUFFERS ĐẢM BẢO XUẤT RA CÓ ĐẦY ĐỦ ÂM THANH HIỆU ỨNG
    if (audioCtx && soundFxMarkers && soundFxMarkers.length > 0) {
      for (const fx of soundFxMarkers) {
        let soundFile = fx.file || fx.sound || 'whoosh.wav';
        if (!soundFile.endsWith('.wav') && !soundFile.endsWith('.mp3')) {
          soundFile += '.wav';
        }
        const sfxUrl = fx.fileUrl || `/assets/sounds/${soundFile}`;
        
        if (!soundBuffersRef.current.has(sfxUrl)) {
          try {
            const resp = await fetch(sfxUrl);
            if (resp.ok) {
              const arrayBuf = await resp.arrayBuffer();
              const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
              soundBuffersRef.current.set(sfxUrl, audioBuf);
            }
          } catch (err) {
            console.warn("[SoundFX Preload Notice] Không thể tải audio buffer:", sfxUrl, err);
          }
        }
      }
    }
  };

  const startExportProcess = async () => {
    try {
      setStatus('preparing');
      setProgress(0);
      setStatusMessage('Đang nạp video nguồn, font chữ & bộ giải mã Sound FX...');
      setErrorMessage('');

      // 🎧 Khởi tạo Web Audio API Context sớm để nạp Sound FX Buffers
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtxClass({ sampleRate: 48000 });
      audioCtxRef.current = audioCtx;

      await preloadMedia(audioCtx);

      if (isCancelledRef.current) return;

      const video = hiddenVideoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        throw new Error('Canvas hoặc Video ref không khả dụng');
      }

      // Khởi tạo Canvas Full HD 1080x1920 với GPU Context tối ưu
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Đặt nguồn video chuẩn (hỗ trợ cả Blob URL, Data URL, domain hiện tại)
      let effectiveVideoUrl = sourceVideoUrl || '/api/stream/source';
      if (effectiveVideoUrl.startsWith('blob:') || effectiveVideoUrl.startsWith('data:')) {
        video.removeAttribute('crossorigin');
      } else if (effectiveVideoUrl.startsWith('http://') || effectiveVideoUrl.startsWith('https://')) {
        effectiveVideoUrl = effectiveVideoUrl.replace(/http:\/\/(127\.0\.0\.1|localhost):8000/, window.location.origin);
        video.crossOrigin = 'anonymous';
      } else {
        effectiveVideoUrl = `${window.location.origin}${effectiveVideoUrl}`;
        video.crossOrigin = 'anonymous';
      }

      video.src = effectiveVideoUrl;

      await new Promise((resolve, reject) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        let resolved = false;
        const handleSuccess = () => {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
        };
        const handleError = () => {
          if (!resolved) {
            // Fallback: nếu lỗi CORS, thử bỏ thuộc tính crossOrigin
            if (video.crossOrigin) {
              video.removeAttribute('crossorigin');
              video.src = effectiveVideoUrl;
              video.load();
              return;
            }
            resolved = true;
            cleanup();
            reject(new Error('Không thể tải video nguồn'));
          }
        };
        const cleanup = () => {
          video.removeEventListener('loadeddata', handleSuccess);
          video.removeEventListener('canplay', handleSuccess);
          video.removeEventListener('loadedmetadata', handleSuccess);
          video.removeEventListener('error', handleError);
        };
        video.addEventListener('loadeddata', handleSuccess);
        video.addEventListener('canplay', handleSuccess);
        video.addEventListener('loadedmetadata', handleSuccess);
        video.addEventListener('error', handleError);
        video.load();
      });

      if (isCancelledRef.current) return;

      // Di chuyển tới đầu clip
      video.currentTime = clipStart;
      if (onSeek) onSeek(clipStart);
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      // Lắng nghe sự kiện seeked để mở khóa cờ nhảy cắt đoạn an toàn
      video.addEventListener('seeked', () => {
        isSeekingSkipRef.current = false;
      });

      setStatus('recording');
      setStatusMessage('Đang chụp khung hình trực tiếp từ Preview DOM chuẩn 1080x1920 (30 FPS)...');

      // Đánh thức AudioContext nếu bị trình duyệt đưa về trạng thái suspended
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (e) {}
      }

      const sourceNode = audioCtx.createMediaElementSource(video);
      const destNode = audioCtx.createMediaStreamDestination();
      
      // Nối video audio vào destNode (kèm master gain)
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.0;
      sourceNode.connect(masterGain);
      masterGain.connect(destNode);

      // Nối BGM nếu có (lặp vô tận & âm lượng êm dịu)
      if (selectedBgm && selectedBgm !== 'none') {
        try {
          const trackUrls = {
            lofi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
            cinematic: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=inspiring-cinematic-ambient-116199.mp3',
            energetic: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=electronic-future-beats-117997.mp3'
          };
          const bgmUrl = trackUrls[selectedBgm] || `/assets/sounds/bgm/${selectedBgm}.mp3`;
          const bgm = new Audio(bgmUrl);
          bgm.crossOrigin = 'anonymous';
          bgm.loop = true;
          const bgmSource = audioCtx.createMediaElementSource(bgm);
          const bgmGain = audioCtx.createGain();
          bgmGain.gain.value = ((bgmVolume || 25) / 100) * 0.35;
          bgmSource.connect(bgmGain);
          bgmGain.connect(destNode);
          bgm.play().catch(() => {});
          bgmAudioRef.current = bgm;
        } catch (e) {
          console.warn("BGM initialization notice:", e);
        }
      }

      // Khởi tạo MediaStream kết hợp Video từ Canvas và Audio từ Web Audio API Destination
      const canvasStream = canvas.captureStream(30); // 30 FPS chuẩn video điện ảnh TikTok/Reels siêu mượt mà
      const combinedStream = new MediaStream([
        canvasStream.getVideoTracks()[0],
        destNode.stream.getAudioTracks()[0]
      ]);

      // Khởi tạo MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000 // 6 Mbps Full HD 1080x1920 siêu mượt mà, không drop frame
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (isCancelledRef.current) return;
        await handleRecordedBlob();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500); // chunk mỗi 500ms

      // 🛡️ PHƯƠNG ÁN C: TỰ ĐỘNG TẠM DỪNG KHI CHUYỂN TAB (BẢO TOÀN 30 FPS KHÔNG GIẬT KHUNG HÌNH)
      let isPausedByTabSwitch = false;
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (!video.paused && recorder.state === 'recording') {
            isPausedByTabSwitch = true;
            video.pause();
            if (recorder.state === 'recording') {
              try { recorder.pause(); } catch(e) {}
            }
            if (bgmAudioRef.current && !bgmAudioRef.current.paused) {
              try { bgmAudioRef.current.pause(); } catch(e) {}
            }
            setStatusMessage('⚠️ Đã tạm dừng xuất vì chuyển tab. Vui lòng quay lại tab để tiếp tục ghi hình...');
          }
        } else {
          if (isPausedByTabSwitch) {
            isPausedByTabSwitch = false;
            if (recorder.state === 'paused') {
              try { recorder.resume(); } catch(e) {}
            }
            if (bgmAudioRef.current && bgmAudioRef.current.paused) {
              try { bgmAudioRef.current.play().catch(() => {}); } catch(e) {}
            }
            video.play().catch(() => {});
            setStatusMessage('Đang tiếp tục chụp khung hình chuẩn 1080x1920 (30 FPS Điện Ảnh)...');
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Bắt đầu phát video
      await video.play();

      // Vòng lặp Render Khung Hình Siêu Ổn Định 30 FPS (Zero lag, Zero jitter)
      const playedFxSet = new Set();
      let lastProgressVal = -1;

      const renderStep = () => {
        if (isCancelledRef.current) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          return;
        }

        const currT = video.currentTime;

        // ⏭️ REAL-TIME SKIP INTERVALS (CẮT BỎ TOÀN BỘ TỪ GẠCH ĐỎ & KHOẢNG LẶNG ĐÃ XÓA)
        if (skipIntervals && skipIntervals.length > 0 && !isSeekingSkipRef.current) {
          for (const skip of skipIntervals) {
            if (currT >= (skip.start - 0.02) && currT < (skip.end - 0.02)) {
              isSeekingSkipRef.current = true;
              video.currentTime = skip.end + 0.01;
              return;
            }
          }
        }

        // Kiểm tra kết thúc clip (chạy đủ toàn bộ thời lượng clip)
        if (currT >= clipEnd || video.ended) {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          video.pause();
          if (bgmAudioRef.current) bgmAudioRef.current.pause();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          return;
        }

        // Tự động hồi phục nếu video bị đứng ngoài ý muốn (chỉ khi không bị pause do chuyển tab)
        if (video.paused && !video.ended && currT < clipEnd && !isSeekingSkipRef.current && !isPausedByTabSwitch) {
          video.play().catch(() => {});
        }

        // 🔊 PHÁT SOUND FX CHUẨN XÁC VÀO LUỒNG THU RECORDING TỪ AUDIOBUFFER (ZERO DELAY)
        if (soundFxMarkers && soundFxMarkers.length > 0 && audioCtx && audioCtx.state === 'running') {
          for (const fx of soundFxMarkers) {
            const fxTime = fx.time >= clipStart ? fx.time : (clipStart + fx.time);
            const fxKey = fx.id || `${fx.file || fx.sound}_${fxTime}`;
            
            if (currT >= (fxTime - 0.05) && currT <= (fxTime + 0.15) && !playedFxSet.has(fxKey)) {
              playedFxSet.add(fxKey);
              let soundFile = fx.file || fx.sound || 'whoosh.wav';
              if (!soundFile.endsWith('.wav') && !soundFile.endsWith('.mp3')) {
                soundFile += '.wav';
              }
              const sfxUrl = fx.fileUrl || `/assets/sounds/${soundFile}`;
              const audioBuf = soundBuffersRef.current.get(sfxUrl);
              
              if (audioBuf) {
                try {
                  const sfxSource = audioCtx.createBufferSource();
                  sfxSource.buffer = audioBuf;
                  const sfxGain = audioCtx.createGain();
                  sfxGain.gain.value = 0.95;
                  sfxSource.connect(sfxGain);
                  sfxGain.connect(destNode);
                  sfxSource.start(0);
                } catch (e) {
                  console.warn("Lỗi phát Sound FX buffer:", e);
                }
              }
            }
          }
        }

        // 🎬 Kiểm tra Chuyển Cảnh Transition (Split Scenes, Chuyển cảnh chung, hoặc B-Roll Enter)
        let activeTransitionEffect = 'none';
        let transitionProgress = 0;

        // 1. Kiểm tra phân cảnh hiện tại (activeScene)
        const activeScene = (clip?.scenes || []).find(s => {
          const isAbs = currT >= s.start_time && currT < s.end_time;
          const rel = currT - clipStart;
          const isRel = rel >= s.start_time && rel < s.end_time;
          return isAbs || isRel;
        });

        if (activeScene?.transition && activeScene.transition !== 'none') {
          if (activeScene.transition === 'blur') {
            // 🌫️ Mờ xuyên suốt 100% thời gian phân cảnh
            activeTransitionEffect = 'blur';
            transitionProgress = 1.0;
          } else if (activeScene.transition === 'fade_black') {
            // 🖤 Tối đen xuyên suốt 100% thời gian phân cảnh
            activeTransitionEffect = 'fade_black';
            transitionProgress = 1.0;
          } else {
            // Các hiệu ứng khác: 0.4s ở đầu phân cảnh (tính từ start_time)
            const sStart = (activeScene.start_time >= clipStart && clipStart > 0) ? activeScene.start_time : (clipStart + (activeScene.start_time || 0));
            const elapsedInScene = currT - sStart;
            if (elapsedInScene >= 0 && elapsedInScene <= 0.4) {
              activeTransitionEffect = activeScene.transition;
              transitionProgress = 1 - (elapsedInScene / 0.4);
            }
          }
        }

        // 2. Chỉ kiểm tra chuyển cảnh chung nếu toàn bộ video chưa hề bị cắt split scenes
        if (activeTransitionEffect === 'none' && (!clip?.scenes || clip.scenes.length <= 1) && activeTransition && activeTransition !== 'none') {
          const relT = currT - clipStart;
          if (relT >= 0 && relT <= 0.4) {
            activeTransitionEffect = activeTransition;
            transitionProgress = 1 - (relT / 0.4);
          }
        }

        // 🖼️ Xác định B-Roll đang active (ưu tiên layer trên cùng - reverse order)
        const activeBroll = (brolls || []).slice().reverse().find(b => {
          const bStart = b.start;
          const bEnd = b.end || (b.start + (b.duration || 4));
          const isAbsMatch = currT >= (bStart - 0.05) && currT <= (bEnd + 0.05);
          const relTime = currT - clipStart;
          const isRelMatch = relTime >= (bStart - 0.05) && relTime <= (bEnd + 0.05);
          return isAbsMatch || isRelMatch;
        });

        // 3. Kiểm tra chuyển cảnh vào của B-Roll (enterTransition trong 0.35s đầu)
        if (activeTransitionEffect === 'none' && activeBroll?.enterTransition && activeBroll.enterTransition !== 'none') {
          const bStart = (activeBroll.start >= clipStart && clipStart > 0) ? activeBroll.start : (clipStart + (activeBroll.start || 0));
          const relInBroll = currT - bStart;
          if (relInBroll >= 0 && relInBroll <= 0.35) {
            activeTransitionEffect = activeBroll.enterTransition;
            transitionProgress = 1 - (relInBroll / 0.35);
          }
        }

        const activeBrollEl = activeBroll ? loadedMediaRef.current.get(activeBroll.id) : null;

        // 🎬 Đồng bộ thời gian và phát video B-Roll nếu là video (không bị đứng yên!)
        if (activeBroll && activeBrollEl && activeBrollEl.tagName === 'VIDEO') {
          const bStart = (activeBroll.start >= clipStart && clipStart > 0) ? activeBroll.start : (clipStart + (activeBroll.start || 0));
          const elapsedInBroll = Math.max(0, currT - bStart);
          const brollVideoDur = activeBrollEl.duration || 10;
          const targetBrollTime = brollVideoDur > 0 ? (elapsedInBroll % brollVideoDur) : elapsedInBroll;
          
          if (activeBrollEl.paused) {
            activeBrollEl.play().catch(() => {});
          }
          if (Math.abs(activeBrollEl.currentTime - targetBrollTime) > 0.15) {
            activeBrollEl.currentTime = targetBrollTime;
          }
        }

        // 🏷️ Kiểm tra hiển thị Tiêu đề Hook
        const relT = currT >= clipStart ? (currT - clipStart) : currT;
        const isTitleVis = titleConfig?.visible !== false && (
          titleConfig?.startTime === undefined || (
            relT >= ((titleConfig.startTime ?? 0) - 0.05) &&
            relT <= ((titleConfig.startTime ?? 0) + (titleConfig.duration ?? 6) + 0.05)
          )
        );

        // 🔍 Tính toán Dynamic Micro-Zoom (3-5%) theo nhịp lời thoại
        const microZoom = calculateMicroZoomFactor(currT, clipStart, clip?.scenes || [], true);

        try {
          // 🎨 Vẽ toàn bộ frame độ phân giải 1080x1920 Full HD chuẩn xác từng pixel
          renderCompositedFrame(ctx, {
            videoElement: video,
            videoLayout,
            isAudioOnly,
            activeBrollMediaElement: activeBrollEl,
            activeBrollConfig: activeBroll,
            zoomScale: microZoom.scale,
            titleConfig,
            customTitle: (customTitle && customTitle.trim()) ? customTitle.trim() : (clip?.title || ''),
            isTitleVisible: isTitleVis,
            brandConfig,
            logoImgElement: loadedLogoRef.current,
            words,
            captionConfig,
            captionPreset,
            fontStyle,
            textLayers,
            animatedStickers,
            currentTransitionEffect: activeTransitionEffect,
            transitionProgress,
            currentTime: currT,
            clipStartTime: clipStart,
            clipDuration: rawDuration,
            excludedWordIndices: excludedWordIndices || new Set(),
            layerOrder,
            targetWidth: 1080,
            targetHeight: 1920
          });
        } catch (e) {
          console.warn("Lỗi vẽ khung hình canvas:", e);
        }

        // Cập nhật thanh tiến trình % (Throttle để không gây re-render liên tục)
        const p = Math.min(99, Math.max(0, Math.round(((currT - clipStart) / rawDuration) * 100)));
        if (p !== lastProgressVal) {
          lastProgressVal = p;
          setProgress(p);
        }
      };

      const renderLoop = () => {
        if (isCancelledRef.current) {
          return;
        }
        renderStep();
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      };

      animFrameIdRef.current = requestAnimationFrame(renderLoop);

    } catch (err) {
      console.error('Lỗi trong quá trình xuất WYSIWYG:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Đã xảy ra lỗi không mong muốn');
    }
  };

  // Đóng gói và tải video trực tiếp trên trình duyệt (100% Client-Side)
  const handleRecordedBlob = async () => {
    try {
      setStatus('converting');
      setProgress(100);
      setStatusMessage('Đang hoàn tất đóng gói video Full HD (30 FPS)...');

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const targetName = sanitizeFileName(customTitle || clip?.title);
      
      // Khắc phục lỗi hiển thị thời lượng của WebM (Fix WebM Duration bug)
      const rawDuration = clip?.duration || (videoRef?.current?.duration) || 60;
      const durationMs = Math.round(rawDuration * 1000);
      
      let finalBlob = blob;
      try {
        finalBlob = await ysFixWebmDuration(blob, durationMs, { logger: false });
      } catch (err) {
        console.warn('Không thể sửa WebM duration metadata, dùng file gốc:', err);
      }

      const videoUrl = URL.createObjectURL(finalBlob);
      setFileName(targetName);
      setDownloadUrl(videoUrl);
      setStatus('completed');
      setStatusMessage('Đã xuất video hoàn tất 100% khớp xem trước!');

      // Tự động kích hoạt tải video về máy tính người dùng
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = targetName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error('Lỗi khi xuất file video:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Lỗi khi đóng gói file video');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#12141e] border border-[#2c3147] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2c3147] flex items-center justify-between bg-[#181b28]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Xuất Video WYSIWYG (100% Khớp Preview)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DOM Snapshot HD
                </span>
              </h3>
              <p className="text-xs text-slate-400">Chụp khung hình thực tế từ Preview DOM chuẩn 1080x1920</p>
            </div>
          </div>
          {status === 'completed' || status === 'error' ? (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Live Mini Preview Box */}
          <div className="relative aspect-9/16 max-h-56 mx-auto rounded-xl overflow-hidden border border-[#3b4160] shadow-xl bg-black flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            
            {status === 'recording' && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                REC 1080x1920 DOM
              </div>
            )}
          </div>

          {/* Video Player used for playback/capture (Never display: none to prevent browser throttling) */}
          <video
            ref={hiddenVideoRef}
            style={{ position: 'absolute', width: '2px', height: '2px', opacity: 0.01, pointerEvents: 'none', top: 0, left: 0, zIndex: -10 }}
            playsInline
            crossOrigin="anonymous"
          />

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                {status === 'preparing' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                {status === 'recording' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                {status === 'converting' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                {statusMessage}
              </span>
              <span className="font-mono font-bold text-white text-sm">{progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-[#1e2235] rounded-full overflow-hidden p-0.5 border border-[#323854]">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  status === 'completed' ? 'bg-emerald-500' :
                  status === 'error' ? 'bg-rose-500' :
                  status === 'converting' ? 'bg-amber-500 animate-pulse' :
                  'bg-gradient-to-r from-brand-600 to-indigo-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-[#181b28] border border-[#2c3147]">
              <div className="text-[10px] text-slate-400">Độ Phân Giải</div>
              <div className="font-bold text-white mt-0.5">1080 x 1920 (9:16)</div>
            </div>
            <div className="p-2 rounded-lg bg-[#181b28] border border-[#2c3147]">
              <div className="text-[10px] text-slate-400">Thời Lượng Thực Tế</div>
              <div className="font-bold text-emerald-400 mt-0.5">{formatSec(actualDuration)}</div>
            </div>
            <div className="p-2 rounded-lg bg-[#181b28] border border-[#2c3147]">
              <div className="text-[10px] text-slate-400">Tốc Độ Khung Hình</div>
              <div className="font-bold text-indigo-400 mt-0.5">30 FPS Smooth (Điện Ảnh)</div>
            </div>
          </div>

          {/* ⚠️ Cảnh báo quan trọng về chuyển tab */}
          {status === 'recording' && (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span><strong>Lưu ý:</strong> Vui lòng <strong>giữ nguyên tab này</strong> khi đang xuất video. Nếu bạn chuyển tab khác, hệ thống sẽ tự động tạm dừng để đảm bảo video không bị giật lag khung hình.</span>
            </div>
          )}

          {/* Error Display */}
          {status === 'error' && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2c3147] bg-[#181b28] flex items-center justify-between">
          {status === 'completed' ? (
            <>
              <div className="text-xs text-slate-400">
                File đã được tải về: <span className="font-bold text-white">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="px-3.5 py-1.5 rounded-lg bg-[#252a3d] hover:bg-[#323854] text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải Lại
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/30"
                >
                  Xong
                </button>
              </div>
            </>
          ) : status === 'error' ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Đóng
              </button>
              <button
                onClick={startExportProcess}
                className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold"
              >
                Thử Lại
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Vui lòng không đóng cửa sổ trong khi xuất video...
              </span>
              <button
                onClick={() => {
                  cleanup();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Hủy Bỏ
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
