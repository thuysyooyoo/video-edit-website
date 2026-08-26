/**
 * ⚡ GEMINI CLIENT TRANSCRIBER (100% Serverless Cloud AI)
 * Gửi âm thanh trực tiếp từ trình duyệt lên Google Gemini 2.5 Flash / 3.6 Flash để bóc băng và trích xuất timestamp từng từ siêu tốc (3-5s)!
 */

export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Miễn phí - Siêu tốc & Ổn định nhất)', desc: 'Mô hình chuẩn miễn phí của Google AI Studio' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Chuẩn xác cao)', desc: 'Mô hình bóc băng và xử lý video tối ưu' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Tối tân)', desc: 'Mô hình thông minh cao cấp nhất' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Tự động chọn bản Flash mới nhất của Google' }
];

/**
 * 🎯 ACOUSTIC WAVEFORM ENERGY ALIGNMENT (VAD Snapper)
 * Căn chỉnh mốc thời gian của từng từ vào đúng chân sóng âm của tiếng nói thực tế trong PCM buffer
 */
export function alignWordsWithAcousticEnergy(words = [], pcmData = null, sampleRate = 16000) {
  if (!words || words.length === 0 || !pcmData || pcmData.length === 0) {
    return words;
  }

  const frameSize = Math.round(sampleRate * 0.02); // 20ms frame (320 samples @ 16kHz)
  const totalDuration = pcmData.length / sampleRate;

  // Tính toán Energy Envelope (RMS) theo từng frame 20ms
  const numFrames = Math.floor(pcmData.length / frameSize);
  const frameEnergies = new Float32Array(numFrames);

  let maxEnergy = 0.00001;
  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const startSample = f * frameSize;
    for (let s = 0; s < frameSize; s++) {
      const val = pcmData[startSample + s];
      sum += val * val;
    }
    const rms = Math.sqrt(sum / frameSize);
    frameEnergies[f] = rms;
    if (rms > maxEnergy) maxEnergy = rms;
  }

  // Ngưỡng năng lượng tiếng nói tối thiểu (Voice Activity Threshold)
  const noiseFloor = maxEnergy * 0.08;

  // Căn chỉnh từng từ vào dao động sóng âm thực tế
  return words.map((w) => {
    let rawStart = w.start;
    let rawEnd = w.end;

    // Quét tìm Energy Onset trong cửa sổ [-0.25s, +0.25s] quanh rawStart
    const searchStartFrame = Math.max(0, Math.floor((rawStart - 0.25) / 0.02));
    const searchEndFrame = Math.min(numFrames - 1, Math.floor((rawStart + 0.25) / 0.02));

    let bestOnsetFrame = Math.floor(rawStart / 0.02);
    for (let f = searchStartFrame; f <= searchEndFrame; f++) {
      if (frameEnergies[f] >= noiseFloor) {
        bestOnsetFrame = f;
        break;
      }
    }

    // Quét tìm Energy Offset trong cửa sổ [-0.20s, +0.30s] quanh rawEnd
    const searchEndFrameStart = Math.max(0, Math.floor((rawEnd - 0.20) / 0.02));
    const searchEndFrameEnd = Math.min(numFrames - 1, Math.floor((rawEnd + 0.30) / 0.02));

    let bestOffsetFrame = Math.floor(rawEnd / 0.02);
    for (let f = searchEndFrameEnd; f >= searchEndFrameStart; f--) {
      if (frameEnergies[f] >= noiseFloor) {
        bestOffsetFrame = f + 1;
        break;
      }
    }

    const alignedStart = Math.max(0, Math.min(totalDuration, Math.round(bestOnsetFrame * 0.02 * 100) / 100));
    const alignedEnd = Math.max(alignedStart + 0.12, Math.min(totalDuration, Math.round(bestOffsetFrame * 0.02 * 100) / 100));

    return {
      ...w,
      start: alignedStart,
      end: alignedEnd
    };
  });
}

/**
 * Gửi 1 đoạn âm thanh (chunk) lên Google Gemini API
 */
async function transcribeSingleChunk(base64Audio, chunkDuration, apiKey, preferredModel = 'gemini-2.5-flash') {
  const candidateModels = [
    preferredModel,
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest'
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  const systemInstruction = `
Bạn là chuyên gia bóc băng âm thanh (Speech-to-Text) và đồng bộ thời gian từng từ chuẩn xác tuyệt đối (Acoustic Phoneme & Word-Level Alignment) cho video ngắn.
Nhiệm vụ của bạn:
1. Nghe kỹ từng tích tắc của file âm thanh và bóc băng chính xác 100% từng từ tiếng Việt.
2. QUY TẮC BẮT BUỘC BẢO TOÀN NGUYÊN BẢN TỪNG TỪ (VERBATIM):
   - Giữ nguyên TẤT CẢ các từ phát âm ra, kể cả từ đệm, từ ngập ngừng ("à", "ừm", "ờ", "thì", "là", "mà", từ nói lặp lại).
   - TUYỆT ĐỐI KHÔNG tự ý xóa bỏ, lược bớt hay tóm tắt bất kỳ từ nào. Âm thanh phát ra bao nhiêu từ thì danh sách 'words' phải có đủ bấy nhiêu từ.
3. QUY TẮC MỐC THỜI GIAN TỪNG TỪ:
   - Mốc "start" của mỗi từ: Phải là đúng thời điểm chính xác (tính bằng giây, số thực float) khi người nói bắt đầu phát ra âm thanh của từ đó.
   - Mốc "end" của mỗi từ: Phải là thời điểm người nói dứt âm của từ đó.
   - TUYỆT ĐỐI KHÔNG tự ý chia đều hoặc kéo giãn thời gian giữa các từ.
   - Nếu giữa 2 từ người nói im lặng, ngắt nghỉ hoặc lấy hơi (ví dụ từ trước kết thúc ở 1.2s, người nói ngắt 1.0s rồi mới nói từ tiếp theo ở 2.2s), khoảng trống đó PHẢI ĐƯỢC GIỮ NGUYÊN (start của từ sau là 2.2s).
   - Nếu trong vài giây đầu file chưa có tiếng nói (ví dụ 1.5s đầu im lặng), từ đầu tiên PHẢI bắt đầu từ 1.5s, KHÔNG được bắt đầu từ 0.0s.
4. Trả về định dạng JSON DUY NHẤT theo schema sau, KHÔNG thêm bất kỳ lời giải thích nào:

{
  "full_text": "Toàn bộ văn bản lời thoại của đoạn này...",
  "duration": ${Math.round(chunkDuration * 100) / 100},
  "words": [
    { "word": "Chào", "start": 0.35, "end": 0.65, "score": 0.99 },
    { "word": "mọi", "start": 0.70, "end": 0.95, "score": 0.99 },
    { "word": "người,", "start": 1.00, "end": 1.45, "score": 0.98 }
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: "audio/wav",
              data: base64Audio
            }
          },
          {
            text: "Hãy nghe kỹ âm thanh và bóc băng chính xác từng từ kèm mốc start và end đúng từng tích tắc âm thanh thực tế, xuất JSON chuẩn."
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.0,
      response_mime_type: "application/json"
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    }
  };

  let lastErr = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || response.statusText || 'Lỗi kết nối Gemini API';
        
        // Nếu là lỗi 404 (model not found), thử model tiếp theo
        if (response.status === 404 && candidateModels.indexOf(model) < candidateModels.length - 1) {
          console.warn(`[Gemini Model Fallback] Model ${model} trả về 404, thử model tiếp theo...`);
          lastErr = new Error(errMsg);
          continue;
        }
        throw new Error(`Google Gemini API (${model}): ${errMsg}`);
      }

      const resData = await response.json();
      const textResponse = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('Gemini API không trả về kết quả lời thoại nào.');
      }

      let parsed;
      try {
        parsed = JSON.parse(textResponse);
      } catch (e) {
        const match = textResponse.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('Không thể phân tích dữ liệu JSON trả về từ Gemini.');
        }
      }

      return {
        full_text: parsed.full_text || '',
        duration: parsed.duration || chunkDuration,
        words: (parsed.words || []).map((w) => ({
          word: String(w.word || ''),
          start: Math.max(0, Number(w.start) || 0),
          end: Math.max(0, Number(w.end) || (Number(w.start) + 0.3)),
          score: Number(w.score) || 0.95
        }))
      };

    } catch (err) {
      lastErr = err;
      if (candidateModels.indexOf(model) === candidateModels.length - 1) {
        throw err;
      }
    }
  }

  throw lastErr || new Error('Không thể kết nối tới Google Gemini API.');
}

/**
 * ⚡ Bóc băng toàn bộ âm thanh (Tự động ghép nối các Chunks 25s độ phân giải cao và căn chỉnh sóng âm)
 */
export async function transcribeWithGeminiClient(audioDataOrBase64, totalDuration, apiKey, preferredModel = 'gemini-2.5-flash', onProgress = null) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng cung cấp Gemini API Key để thực hiện bóc băng AI.');
  }

  // Chuẩn hóa danh sách chunks
  let chunks = [];
  let duration = totalDuration || 60;
  let rawPcm = null;

  if (typeof audioDataOrBase64 === 'object' && audioDataOrBase64.chunks && audioDataOrBase64.chunks.length > 0) {
    chunks = audioDataOrBase64.chunks;
    duration = audioDataOrBase64.duration || totalDuration;
    rawPcm = audioDataOrBase64.pcmData || null;
  } else {
    const base64Str = typeof audioDataOrBase64 === 'string' ? audioDataOrBase64 : audioDataOrBase64.base64;
    chunks = [{
      index: 0,
      startSec: 0,
      endSec: duration,
      duration: duration,
      base64: base64Str
    }];
  }

  const allWords = [];
  const textParts = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const pct = Math.round(((i) / chunks.length) * 100);

    if (onProgress) {
      const startMin = Math.floor(chunk.startSec / 60);
      const startSec = Math.floor(chunk.startSec % 60);
      const endMin = Math.floor(chunk.endSec / 60);
      const endSec = Math.floor(chunk.endSec % 60);
      const timeStr = `${startMin}:${startSec.toString().padStart(2, '0')} - ${endMin}:${endSec.toString().padStart(2, '0')}`;
      
      onProgress(
        pct, 
        chunks.length > 1 
          ? `Đang bóc băng đoạn ${i + 1}/${chunks.length} (${timeStr}) bằng Gemini AI...`
          : `Đang gửi âm thanh lên Google Gemini AI (${preferredModel})...`
      );
    }

    const chunkResult = await transcribeSingleChunk(chunk.base64, chunk.duration, apiKey, preferredModel);
    
    if (chunkResult.full_text) {
      textParts.push(chunkResult.full_text);
    }

    // Dịch chuyển mốc thời gian của từng từ theo mốc bắt đầu của chunk
    if (Array.isArray(chunkResult.words)) {
      chunkResult.words.forEach(w => {
        allWords.push({
          word: w.word,
          start: Math.round((chunk.startSec + w.start) * 100) / 100,
          end: Math.round((chunk.startSec + w.end) * 100) / 100,
          score: w.score
        });
      });
    }
  }

  if (onProgress) onProgress(90, 'Đang căn chỉnh mốc thời gian vào dao động sóng âm thực tế (Acoustic Alignment)...');

  // 🎯 CĂN CHỈNH SÓNG ÂM THỰC TẾ NẾU CÓ MẢNG PCM GỐC
  let finalWords = allWords;
  if (rawPcm && rawPcm.length > 0) {
    try {
      finalWords = alignWordsWithAcousticEnergy(allWords, rawPcm, 16000);
    } catch(alignErr) {
      console.warn('[VAD Alignment] Warning:', alignErr);
    }
  }

  if (onProgress) onProgress(100, 'Đã bóc băng & đồng bộ phụ đề hoàn tất!');

  const fullText = textParts.join(' ') || finalWords.map(w => w.word).join(' ');

  return {
    full_text: fullText,
    duration: duration,
    words: finalWords
  };
}

/**
 * 🧹 Tự động nhận diện từ thừa (filler words) và khoảng lặng trong trình duyệt
 */
export function detectFillersAndPausesClient(words = [], pauseThreshold = 0.5) {
  const fillers = ['ừm', 'à', 'ờ', 'ừ', 'thì', 'là', 'mà', 'kiểu', 'kiểu như', 'uh', 'um', 'ah', 'er'];
  const fillerIndices = [];
  const pauseIntervals = [];

  for (let i = 0; i < words.length; i++) {
    const cleanWord = (words[i].word || '').toLowerCase().replace(/[.,!?\"']/g, '').trim();
    if (fillers.includes(cleanWord)) {
      fillerIndices.push(i);
    }

    if (i < words.length - 1) {
      const gap = words[i + 1].start - words[i].end;
      if (gap >= pauseThreshold) {
        pauseIntervals.push({
          index: i,
          start: words[i].end,
          end: words[i + 1].start,
          duration: Math.round(gap * 10) / 10
        });
      }
    }
  }

  return {
    fillerIndices,
    pauseIntervals
  };
}
