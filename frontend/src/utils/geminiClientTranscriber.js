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
 * ⚡ Bóc băng toàn bộ âm thanh (Tự động ghép nối các Chunks 120s nếu video dài)
 */
export async function transcribeWithGeminiClient(audioDataOrBase64, totalDuration, apiKey, preferredModel = 'gemini-2.5-flash', onProgress = null) {
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
