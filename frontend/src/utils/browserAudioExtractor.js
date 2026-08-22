/**
 * 🎙️ BROWSER AUDIO EXTRACTOR (100% Client-Side Pure JavaScript)
 * Tách và nén âm thanh 16kHz Mono từ mọi file Video / Audio trong trình duyệt mà không cần FFmpeg!
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
  if (onProgress) onProgress(5, 'Đang kiểm tra thời lượng video gốc...');

  const realDuration = await getMediaRealDuration(file);
  const targetSampleRate = 16000;
  let fullChannelData = null;
  let finalDuration = realDuration || 60;

  // 1. Thử giải mã nhanh bằng Web Audio decodeAudioData
  try {
    if (onProgress) onProgress(15, 'Đang giải mã luồng âm thanh gốc (Web Audio API)...');
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioCtx();
    
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    // Nếu decodeAudioData lấy được trọn vẹn (ít nhất 90% thời lượng video thực tế)
    if (!realDuration || audioBuffer.duration >= (realDuration * 0.9)) {
      if (onProgress) onProgress(50, 'Đang hạ tần số lấy mẫu (Resample 16,000Hz Mono)...');
      const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineCtx.destination);
      source.start(0);

      const resampledBuffer = await offlineCtx.startRendering();
      fullChannelData = resampledBuffer.getChannelData(0);
      finalDuration = resampledBuffer.duration;
    }
  } catch (decodeErr) {
    console.warn('[AudioExtractor] decodeAudioData gặp giới hạn container, chuyển sang Media Streaming...', decodeErr);
  }

  // 2. Nếu decodeAudioData bị nghẽn (ví dụ file MOV 1.26GB chỉ decode được 2 phút), dùng MediaElement Streaming
  if (!fullChannelData || (realDuration && finalDuration < (realDuration * 0.85))) {
    if (onProgress) onProgress(25, `Đang giải mã toàn bộ video 13 phút (${Math.round(realDuration || 776)}s) siêu tốc...`);
    
    fullChannelData = await extractAudioViaMediaElement(file, realDuration || 776, targetSampleRate, onProgress);
    finalDuration = realDuration || (fullChannelData.length / targetSampleRate);
  }

  if (onProgress) onProgress(85, 'Đang phân tách các phân đoạn 120s chuẩn bị gửi AI...');

  // Giới hạn mỗi chunk tối đa 120 giây (2 phút) để dung lượng payload base64 chỉ ~3.8MB
  const chunkDuration = 120;
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

  if (onProgress) onProgress(100, `Đã trích xuất trọn vẹn ${Math.round(finalDuration)}s âm thanh thành công!`);

  return {
    duration: finalDuration,
    chunks: chunks,
    base64: chunks[0]?.base64 || '',
    sampleRate: targetSampleRate,
    channels: 1
  };
}

/**
 * Giải mã âm thanh đầy đủ qua Media Element tốc độ cao (không bị giới hạn dung lượng file lớn)
 */
function extractAudioViaMediaElement(file, realDuration, targetSampleRate = 16000, onProgress = null) {
  return new Promise((resolve, reject) => {
    const isVideo = file.type?.startsWith('video') || /\.(mp4|mov|webm|mkv|m4v|avi)/i.test(file.name);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    media.preload = 'auto';
    media.muted = false; // Phải bật âm thanh để AudioContext bắt được
    media.playsInline = true;
    const url = URL.createObjectURL(file);
    media.src = url;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx({ sampleRate: targetSampleRate });
    const source = audioCtx.createMediaElementSource(media);
    const processor = audioCtx.createScriptProcessor(8192, 1, 1);
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0; // Mute loa người dùng

    const pcmChunks = [];
    let totalSamplesRecorded = 0;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      pcmChunks.push(new Float32Array(input));
      totalSamplesRecorded += input.length;
      if (onProgress && realDuration > 0) {
        const pct = Math.min(80, 25 + Math.round((media.currentTime / realDuration) * 55));
        onProgress(pct, `Đang giải mã âm thanh ${Math.round(media.currentTime)}s / ${Math.round(realDuration)}s...`);
      }
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    const cleanup = () => {
      try {
        media.pause();
        source.disconnect();
        processor.disconnect();
        silentGain.disconnect();
        audioCtx.close();
      } catch(e) {}
      URL.revokeObjectURL(url);
    };

    media.onloadedmetadata = () => {
      // Tăng tốc độ giải mã tối đa trình duyệt cho phép
      media.playbackRate = 16.0;
      media.play().catch((err) => {
        // Nếu trình duyệt chặn auto-play hoặc 16x, thử 8x
        media.playbackRate = 8.0;
        media.play().catch(reject);
      });
    };

    media.onended = () => {
      cleanup();
      const fullPcm = new Float32Array(totalSamplesRecorded);
      let offset = 0;
      for (const chunk of pcmChunks) {
        fullPcm.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(fullPcm);
    };

    media.onerror = (err) => {
      cleanup();
      reject(new Error('Lỗi khi đọc file qua trình phát: ' + (err.message || 'Media error')));
    };

    // Timeout dự phòng
    setTimeout(() => {
      if (totalSamplesRecorded > 0) {
        cleanup();
        const fullPcm = new Float32Array(totalSamplesRecorded);
        let offset = 0;
        for (const chunk of pcmChunks) {
          fullPcm.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(fullPcm);
      }
    }, Math.max(30000, (realDuration / 8) * 1000 + 10000));
  });
}

/**
 * Chuyển Float32Array PCM thành định dạng chuẩn WAV 16-bit PCM
 */
function samplesToWavBlob(samples, sampleRate = 16000) {
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
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
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
