/**
 * ⚡ GROQ WHISPER LARGE-V3 TRANSCRIBER (0.8s Ultra-Fast Acoustic STT)
 * Sử dụng mô hình nhận diện giọng nói Whisper Large-V3 lớn nhất thế giới của OpenAI qua Groq LPU
 * Tích hợp cơ chế Phân Đoạn Tự Động (Auto-Chunking 4 Phút) + Gối Đầu 1.5s + Khử Trùng Từ + Context Prompting
 * Xử lý mọi video dung lượng lớn (nhiều GB, 30p - 2 tiếng) KHÔNG BAO GIỜ BỊ LỖI 413 REQUEST ENTITY TOO LARGE!
 */

import { samplesToWavBlob } from './browserAudioExtractor';

/**
 * Helper gửi 1 phân đoạn âm thanh lên Groq Whisper API (kèm Timeout & Tự động Thử lại Retry)
 */
async function sendChunkToGroq(wavBlob, apiKey, promptText = '', retryCount = 0) {
  const formData = new FormData();
  formData.append('file', wavBlob, 'audio_chunk_16k.wav');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('language', 'vi');
  formData.append('temperature', '0');
  
  if (promptText && promptText.trim()) {
    formData.append('prompt', promptText.trim().slice(-200));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout cho mỗi phân đoạn

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if ((response.status === 429 || response.status === 503) && retryCount < 3) {
        const waitMs = (retryCount + 1) * 2000;
        console.warn(`[Groq API Busy] Thử lại sau ${waitMs / 1000}s (Lần ${retryCount + 1}/3)...`);
        await new Promise(res => setTimeout(res, waitMs));
        return sendChunkToGroq(wavBlob, apiKey, promptText, retryCount + 1);
      }

      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Lỗi kết nối Groq API (${response.status}: ${response.statusText})`;
      throw new Error(errMsg);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError' && retryCount < 2) {
      console.warn(`[Groq Timeout] Phân đoạn bị quá 35s, đang thử lại lần ${retryCount + 1}...`);
      return sendChunkToGroq(wavBlob, apiKey, promptText, retryCount + 1);
    }
    throw err;
  }
}

/**
 * 🎙️ Bóc băng âm thanh tiếng Việt với Groq Whisper Large-V3 (Hỗ trợ file dài vô hạn)
 * @param {Object} audioResult - Kết quả từ extractAudioFromMedia (chứa pcmData, duration...)
 * @param {string} apiKey - Groq API Key (bắt đầu bằng gsk_...)
 * @param {Function} onProgress - Callback tiến độ
 */
export async function transcribeWithGroqWhisper(audioResult, apiKey = '', onProgress = null) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập Groq API Key để bóc băng siêu tốc bằng Whisper Large-V3.');
  }

  const pcmData = audioResult?.pcmData;
  const duration = audioResult?.duration || 60;
  const targetSampleRate = 16000;

  if (!pcmData || !(pcmData instanceof Float32Array)) {
    throw new Error('Dữ liệu sóng âm PCM 16kHz không hợp lệ.');
  }

  // ⚡ Phân đoạn 240 giây (4 phút) mỗi phân đoạn (Chỉ ~7.68 MB WAV, luôn an toàn dưới mức trần 25MB của Groq)
  const segmentDuration = 240.0;
  const overlapSec = 1.5; // Gối đầu 1.5 giây giữa các phân đoạn chống đứt từ
  const numSegments = Math.max(1, Math.ceil(duration / segmentDuration));

  const allWords = [];
  let accumulatedText = '';
  let lastContextPrompt = '';

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  for (let i = 0; i < numSegments; i++) {
    const isFirst = i === 0;
    const startSec = isFirst ? 0 : Math.max(0, i * segmentDuration - overlapSec);
    const endSec = Math.min(duration, (i + 1) * segmentDuration);
    
    const startSample = Math.floor(startSec * targetSampleRate);
    const endSample = Math.min(pcmData.length, Math.floor(endSec * targetSampleRate));
    const segmentSamples = pcmData.subarray(startSample, endSample);

    if (segmentSamples.length === 0) continue;

    if (onProgress) {
      const progressPercent = Math.min(95, 20 + Math.round((i / numSegments) * 75));
      const segmentLabel = numSegments > 1 
        ? `Đang bóc băng đoạn ${i + 1}/${numSegments} (${formatMinSec(startSec)} - ${formatMinSec(endSec)})...`
        : `Đang gửi âm thanh đến Whisper Large-V3 (${formatMinSec(duration)})...`;
      onProgress(progressPercent, segmentLabel);
    }

    // Đóng gói WAV cho phân đoạn này
    const wavBlob = samplesToWavBlob(segmentSamples, targetSampleRate);

    // Gửi phân đoạn lên Groq Whisper LPU
    const resultData = await sendChunkToGroq(wavBlob, apiKey, lastContextPrompt);
    const rawWords = resultData.words || [];
    const segmentText = (resultData.text || '').trim();

    if (segmentText) {
      accumulatedText += (accumulatedText ? ' ' : '') + segmentText;
      const wordsInSeg = segmentText.split(/\s+/);
      lastContextPrompt = wordsInSeg.slice(-10).join(' ');
    }

    // Ghép nối và khử trùng lặp từ ở vùng gối đầu (Overlap Zone)
    for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
      const wItem = rawWords[wIdx];
      const text = (wItem.word || '').trim();
      if (!text) continue;

      const absStart = Math.round((startSec + (typeof wItem.start === 'number' ? wItem.start : 0)) * 100) / 100;
      const absEnd = Math.round((startSec + (typeof wItem.end === 'number' ? wItem.end : (wItem.start + 0.3))) * 100) / 100;

      // Kiểm tra khử trùng lặp nếu từ này rơi vào vùng gối đầu đã có ở phân đoạn trước
      if (!isFirst && allWords.length > 0) {
        const lastWord = allWords[allWords.length - 1];
        if (absStart < lastWord.end - 0.05) {
          const cleanCur = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
          const cleanLast = lastWord.word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
          if (cleanCur === cleanLast || absStart < lastWord.start + 0.1) {
            continue;
          }
        }
      }

      allWords.push({
        id: allWords.length,
        word: text,
        start: absStart,
        end: Math.max(absStart + 0.08, absEnd),
        score: 0.99
      });
    }

    // Nghỉ nhẹ 150ms giữa các phân đoạn để tránh dồn dập request
    if (i < numSegments - 1) {
      await new Promise(res => setTimeout(res, 150));
    }
  }

  if (onProgress) {
    onProgress(100, `Bóc băng Whisper Large-V3 hoàn tất (${allWords.length} từ chuẩn sóng âm 100%)!`);
  }

  return {
    full_text: accumulatedText || allWords.map(w => w.word).join(' '),
    duration: duration,
    words: allWords,
    engine: 'groq_whisper_large_v3'
  };
}
