/**
 * ⚡ GEMINI CLIENT TRANSCRIBER (100% Serverless Cloud AI)
 * Gửi âm thanh trực tiếp từ trình duyệt lên Google Gemini 2.5 Flash / 3.6 Flash để bóc băng và trích xuất timestamp từng từ siêu tốc (3-5s)!
 */

export const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Khuyên dùng - Siêu tốc & Chuẩn xác)', desc: 'Mô hình chuẩn thế hệ mới của Google' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Tối tân)', desc: 'Mô hình thông minh cao cấp nhất' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', desc: 'Tự động chọn bản Flash mới nhất' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Suy luận sâu)', desc: 'Độ chính xác ngữ pháp cao nhất' }
];

export async function transcribeWithGeminiClient(base64Audio, totalDuration, apiKey, preferredModel = 'gemini-2.5-flash', onProgress = null) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng cung cấp Gemini API Key để thực hiện bóc băng AI.');
  }

  // Danh sách các model fallback theo thứ tự ưu tiên
  const candidateModels = [
    preferredModel,
    'gemini-2.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro'
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  const systemInstruction = `
Bạn là chuyên gia bóc băng âm thanh (Speech-to-Text) và đồng bộ thời gian (Word-Level Alignment) chuyên nghiệp cho video ngắn dạng TikTok/Reels/Shorts.
Nhiệm vụ của bạn:
1. Nghe kỹ toàn bộ file âm thanh và bóc băng chính xác 100% từng từ tiếng Việt (hoặc tiếng Anh nếu có).
2. Tự động tính toán mốc thời gian bắt đầu (start) và kết thúc (end) tính bằng GIÂY cho TỪNG TỪ MỘT, đảm bảo mốc thời gian trải đều mượt mà và tổng thời lượng xấp xỉ ${Math.round(totalDuration)} giây.
3. Trả về định dạng JSON DUY NHẤT theo schema sau, KHÔNG thêm bất kỳ lời giải thích nào:

{
  "full_text": "Toàn bộ văn bản lời thoại...",
  "duration": ${Math.round(totalDuration * 100) / 100},
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

  let lastError = null;

  // Thử lần lượt các candidate models
  for (const model of candidateModels) {
    try {
      if (onProgress) onProgress(30, `Đang kết nối Google Gemini Cloud (${model})...`);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || response.statusText || 'Lỗi kết nối Gemini API';
        // Nếu là lỗi 404 (model not found), tiếp tục thử model tiếp theo
        if (response.status === 404 || errMsg.includes('no longer available')) {
          console.warn(`[Gemini Model Fallback] Model ${model} không khả dụng, thử model tiếp theo...`);
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(`Google Gemini API Error (${response.status}): ${errMsg}`);
      }

      if (onProgress) onProgress(75, 'Gemini AI đang hoàn tất kịch bản và đồng bộ phụ đề...');

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

      const words = (parsed.words || []).map((w, idx) => ({
        word: String(w.word || ''),
        start: Number(w.start) || 0,
        end: Number(w.end) || (Number(w.start) + 0.3),
        score: Number(w.score) || 0.95
      }));

      const fullText = parsed.full_text || words.map(w => w.word).join(' ');
      const duration = parsed.duration || totalDuration || (words.length > 0 ? words[words.length - 1].end : 60);

      if (onProgress) onProgress(100, 'Đã bóc băng thành công!');

      return {
        full_text: fullText,
        duration: duration,
        words: words
      };

    } catch (err) {
      if (candidateModels.indexOf(model) === candidateModels.length - 1) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Không thể kết nối tới Google Gemini API.');
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
