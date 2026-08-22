/**
 * 🎙️ BROWSER AUDIO EXTRACTOR (100% Client-Side Pure JavaScript)
 * Tách và nén âm thanh 16kHz Mono từ mọi file Video / Audio trong trình duyệt mà không cần FFmpeg!
 */

export async function extractAudioFromMedia(file, onProgress = null) {
  if (onProgress) onProgress(10, 'Đang đọc dữ liệu media từ thiết bị...');

  const arrayBuffer = await file.arrayBuffer();
  if (onProgress) onProgress(30, 'Đang giải mã luồng âm thanh gốc (Web Audio API)...');

  // Khởi tạo AudioContext để giải mã PCM
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const tempCtx = new AudioCtx();
  
  let audioBuffer;
  try {
    audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    tempCtx.close();
    throw new Error('Trình duyệt không thể giải mã âm thanh từ file này: ' + e.message);
  }
  tempCtx.close();

  if (onProgress) onProgress(60, 'Đang hạ tần số lấy mẫu (Resample 16,000Hz Mono)...');

  // Hạ mẫu xuống 16kHz Mono để kích thước siêu nhỏ (tiết kiệm 80% dung lượng gửi AI)
  const targetSampleRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
  
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampledBuffer = await offlineCtx.startRendering();
  if (onProgress) onProgress(80, 'Đang tối ưu các phân đoạn âm thanh chuẩn 16kHz...');

  const totalDuration = resampledBuffer.duration;
  // Giới hạn mỗi chunk tối đa 120 giây (2 phút) để dung lượng payload base64 chỉ ~3.8MB, không bao giờ vượt 20MB của Gemini API
  const chunkDuration = 120;
  const numChunks = Math.max(1, Math.ceil(totalDuration / chunkDuration));
  const chunks = [];

  const fullChannelData = resampledBuffer.getChannelData(0);

  for (let i = 0; i < numChunks; i++) {
    const startSec = i * chunkDuration;
    const endSec = Math.min(totalDuration, (i + 1) * chunkDuration);
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

  if (onProgress) onProgress(100, 'Đã trích xuất và tối ưu âm thanh thành công!');

  return {
    duration: totalDuration,
    chunks: chunks,
    base64: chunks[0]?.base64 || '',
    sampleRate: targetSampleRate,
    channels: 1
  };
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
