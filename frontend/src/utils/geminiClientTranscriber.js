/**
 * ⚡ GEMINI CLIENT TRANSCRIBER (100% Serverless Cloud AI)
 * Gửi âm thanh trực tiếp từ trình duyệt lên Google Gemini 2.5 Flash / 3.6 Flash để bóc băng và trích xuất timestamp từng từ siêu tốc (3-5s)!
 */

export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Khuyên dùng - Siêu tốc & Ổn định)', desc: 'Mô hình thế hệ mới chuẩn nhất của Google' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Chuẩn xác cao)', desc: 'Mô hình bóc băng và xử lý video tối ưu' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Tối tân)', desc: 'Mô hình thông minh cao cấp nhất' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Tự động chọn bản Flash mới nhất của Google' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Suy luận sâu)', desc: 'Độ chính xác ngữ pháp cao nhất' }
];

/**
 * Gửi 1 đoạn âm thanh (chunk) lên Google Gemini API
 */
async function transcribeSingleChunk(base64Audio, chunkDuration, apiKey, preferredModel = 'gemini-3.5-flash-lite') {
  const candidateModels = [
    preferredModel,
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview'
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  const systemInstruction = `
Bạn là chuyên gia bóc băng âm thanh (Speech-to-Text) và đồng bộ thời gian (Word-Level Alignment) chuyên nghiệp cho video ngắn dạng TikTok/Reels/Shorts.
Nhiệm vụ của bạn:
1. Nghe kỹ toàn bộ file âm thanh và bóc băng chính xác 100% từng từ tiếng Việt (hoặc tiếng Anh nếu có).
2. Tự động tính toán mốc thời gian bắt đầu (start) và kết thúc (end) tính bằng GIÂY cho TỪNG TỪ MỘT, đảm bảo mốc thời gian trải đều mượt mà từ 0.0 đến ${Math.round(chunkDuration)} giây.
3. Trả về định dạng JSON DUY NHẤT theo schema sau, KHÔNG thêm bất kỳ lời giải thích nào:

{
  "full_text": "Toàn bộ văn bản lời thoại của đoạn này...",
  "duration": ${Math.round(chunkDuration * 100) / 100},
  "words": [
    { "word": "Chào", "start": 0.0, "end": 0.25, "score": 0.99 },
    { "word": "mọi", "start": 0.26, "end": 0.45, "score": 0.99 },
    { "word": "người,", "start": 0.46, "end": 0.75, "score": 0.98 }
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
            text: "Hãy bóc băng toàn bộ file âm thanh này và xuất ra danh sách từng từ kèm timestamp start và end tính bằng giây chuẩn JSON."
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
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
 * ⚡ Bóc băng toàn bộ âm thanh (Tự động ghép nối các Chunks 120s nếu video dài)
 */
export async function transcribeWithGeminiClient(audioDataOrBase64, totalDuration, apiKey, preferredModel = 'gemini-3.5-flash-lite', onProgress = null) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng cung cấp Gemini API Key để thực hiện bóc băng AI.');
  }

  // Chuẩn hóa danh sách chunks
  let chunks = [];
  let duration = totalDuration || 60;

  if (typeof audioDataOrBase64 === 'object' && audioDataOrBase64.chunks && audioDataOrBase64.chunks.length > 0) {
    chunks = audioDataOrBase64.chunks;
    duration = audioDataOrBase64.duration || totalDuration;
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

  if (onProgress) onProgress(100, 'Đã bóc băng & đồng bộ phụ đề hoàn tất!');

  const fullText = textParts.join(' ') || allWords.map(w => w.word).join(' ');

  return {
    full_text: fullText,
    duration: duration,
    words: allWords
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
