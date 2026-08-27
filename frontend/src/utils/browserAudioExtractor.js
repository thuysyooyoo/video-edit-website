/**
 * 🎙️ BROWSER AUDIO EXTRACTOR (100% Client-Side Pure JavaScript)
 * Tách và nén âm thanh 16kHz Mono từ mọi file Video / Audio trong trình duyệt chuẩn xác 100% mẫu sóng âm!
 */

/**
 * Lấy thời lượng thực tế của Media (Video/Audio) từ metadata trình duyệt
 */
export function getMediaRealDuration(file) {
  return new Promise((resolve) => {
    const isVideo = file.type?.startsWith('video') || /\.(mp4|mov|webm|mkv|m4v|avi)/i.test(file.name);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    media.preload = 'metadata';
    const url = URL.createObjectURL(file);
    media.src = url;
    media.onloadedmetadata = () => {
      const dur = media.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(dur) ? dur : 0);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

export async function extractAudioFromMedia(file, onProgress = null) {
  if (onProgress) onProgress(5, 'Đang đọc metadata và kiểm tra định dạng media...');

  const realDuration = await getMediaRealDuration(file);
  const targetSampleRate = 16000;
  let fullChannelData = null;
  let finalDuration = realDuration || 60;

  // 1. Giải mã trực tiếp luồng âm thanh qua Web Audio decodeAudioData (Chính xác 100% từng mẫu âm thanh)
  try {
    if (onProgress) onProgress(15, 'Đang giải mã âm thanh gốc (Web Audio decodeAudioData)...');
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioCtx();
    
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    if (onProgress) onProgress(45, 'Đang chuẩn hóa tần số lấy mẫu (OfflineAudioContext 16,000Hz Mono)...');
    
    // Dùng OfflineAudioContext để resample chuẩn xác về 16,000Hz Mono mà không bị méo tốc độ hay sai pitch
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampledBuffer = await offlineCtx.startRendering();
    fullChannelData = resampledBuffer.getChannelData(0);
    finalDuration = resampledBuffer.duration;
    
  } catch (decodeErr) {
    console.warn('[AudioExtractor] decodeAudioData direct failed, trying MediaElement capture...', decodeErr);
  }

  // 2. Nếu decodeAudioData thất bại, capture qua MediaElement với tốc độ chuẩn 1.0x (KHÔNG tua nhanh để tránh lệch thời gian)
  if (!fullChannelData || fullChannelData.length === 0) {
    if (onProgress) onProgress(25, `Đang giải mã âm thanh qua Media Element (${Math.round(realDuration || 60)}s)...`);
    fullChannelData = await extractAudioViaMediaElement(file, realDuration || 60, targetSampleRate, onProgress);
    finalDuration = realDuration || (fullChannelData.length / targetSampleRate);
  }

  if (onProgress) onProgress(80, 'Đang phân tách các phân đoạn 25s (High-Precision Chunks)...');

  // ⚡ Dùng chunk 25 giây (thay vì 120s) để AI có độ phân giải thời gian cực cao và không bị trôi dạt timestamp!
  const chunkDuration = 25.0;
  const numChunks = Math.max(1, Math.ceil(finalDuration / chunkDuration));
  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const startSec = i * chunkDuration;
    const endSec = Math.min(finalDuration, (i + 1) * chunkDuration);
    const startSample = Math.floor(startSec * targetSampleRate);
    const endSample = Math.min(fullChannelData.length, Math.floor(endSec * targetSampleRate));
    
    const chunkSamples = fullChannelData.subarray(startSample, endSample);
    const wavBlob = samplesToWavBlob(chunkSamples, targetSampleRate);
    const base64Data = await blobToBase64(wavBlob);

    chunks.push({
      index: i,
      startSec,
      endSec,
      duration: endSec - startSec,
      blob: wavBlob,
      base64: base64Data
    });
  }

  if (onProgress) onProgress(100, `Đã trích xuất ${Math.round(finalDuration)}s âm thanh chuẩn xác 100%!`);

  return {
    duration: finalDuration,
    chunks: chunks,
    base64: chunks[0]?.base64 || '',
    sampleRate: targetSampleRate,
    channels: 1,
    pcmData: fullChannelData // Xuất kèm mảng PCM để thực hiện Acoustic Waveform Energy Alignment
  };
}

/**
 * Fallback: Giải mã âm thanh chuẩn 1.0x nếu direct arrayBuffer bị lỗi container
 */
function extractAudioViaMediaElement(file, realDuration, targetSampleRate = 16000, onProgress = null) {
  return new Promise((resolve, reject) => {
    const isVideo = file.type?.startsWith('video') || /\.(mp4|mov|webm|mkv|m4v|avi)/i.test(file.name);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    media.preload = 'auto';
    media.muted = false;
    media.playsInline = true;
    const url = URL.createObjectURL(file);
    media.src = url;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(media);
    const processor = audioCtx.createScriptProcessor(8192, 1, 1);
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;

    const capturedChunks = [];
    let totalSamples = 0;
    const nativeSampleRate = audioCtx.sampleRate || 48000;

    let isPausedByTabSwitch = false;
    let watchdogTimer = null;
    let lastTime = -1;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      capturedChunks.push(new Float32Array(input));
      totalSamples += input.length;
      if (onProgress && realDuration > 0 && !isPausedByTabSwitch) {
        const pct = Math.min(80, 25 + Math.round((media.currentTime / realDuration) * 55));
        onProgress(pct, `Đang giải mã luồng phát ${Math.round(media.currentTime)}s / ${Math.round(realDuration)}s...`);
      }
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!media.paused) {
          isPausedByTabSwitch = true;
          media.pause();
          if (onProgress) onProgress(media.currentTime / realDuration * 55 + 25, '⚠️ Đã tạm dừng bóc băng vì chuyển tab. Vui lòng quay lại tab để tiếp tục (Bảo vệ luồng 12 phút)...');
        }
      } else {
        if (isPausedByTabSwitch) {
          isPausedByTabSwitch = false;
          media.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const cleanup = () => {
      try {
        clearInterval(watchdogTimer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        media.pause();
        source.disconnect();
        processor.disconnect();
        silentGain.disconnect();
        audioCtx.close();
      } catch(e) {}
      URL.revokeObjectURL(url);
    };

    const processExtractedAudio = async () => {
      cleanup();
      if (totalSamples === 0) {
        return reject(new Error('Không trích xuất được âm thanh nào.'));
      }
      const rawNativePcm = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of capturedChunks) {
        rawNativePcm.set(chunk, offset);
        offset += chunk.length;
      }
      const resampled = await resamplePcmBuffer(rawNativePcm, nativeSampleRate, targetSampleRate);
      resolve(resampled);
    };

    media.onloadedmetadata = () => {
      media.playbackRate = 1.0;
      media.play().catch(reject);
      
      // Watchdog Timer linh hoạt thay cho setTimeout cứng nhắc
      watchdogTimer = setInterval(() => {
        if (!isPausedByTabSwitch) {
          if (media.currentTime === lastTime && media.currentTime > 0) {
            // Video bị kẹt không chạy được tiếp dù không chuyển tab
            if (media.currentTime >= realDuration - 1.0) {
              processExtractedAudio(); // Đã đến đuôi video
            }
          }
          lastTime = media.currentTime;
        }
      }, 3000);
    };

    media.onended = () => {
      processExtractedAudio();
    };

    media.onerror = (err) => {
      cleanup();
      reject(new Error('Lỗi MediaElement: ' + (err.message || 'Media playback error')));
    };
  });
}

/**
 * Resample mảng PCM từ native sample rate về 16kHz Mono
 */
async function resamplePcmBuffer(pcmData, fromRate, toRate) {
  if (fromRate === toRate) return pcmData;
  const duration = pcmData.length / fromRate;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * toRate), toRate);
  
  const audioBuffer = offlineCtx.createBuffer(1, pcmData.length, fromRate);
  audioBuffer.copyToChannel(pcmData, 0);

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

/**
 * Chuyển Float32Array PCM thành định dạng chuẩn WAV 16-bit PCM 16kHz
 */
export function samplesToWavBlob(samples, sampleRate = 16000) {
  const numOfChan = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numOfChan, true);
  // sample rate (chuẩn 16,000)
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
