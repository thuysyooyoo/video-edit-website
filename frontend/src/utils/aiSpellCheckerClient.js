/**
 * ✨ AI SPELL CHECKER & CONTEXTUAL TRANSCRIPT FIXER (100% Client-Side Pure JS + Gemini Cloud)
 * Phân tích toàn bộ ngữ cảnh câu chuyện tiếng Việt để phát hiện từ viết sai chính tả / nghe nhầm
 * 
 * ⚠️ QUY TẮC CỐT LÕI BẮT BUỘC (1-to-1 Word Replacement):
 * Từ gợi ý sửa PHẢI CÓ SỐ LƯỢNG TỪ / TIẾNG Y HỆT TỪ CẦN SỬA để bảo toàn 100% mốc thời gian sóng âm!
 * Ví dụ: "suy cơ" (2 từ) => "nguy cơ" (2 từ)
 *        "bít" (1 từ) => "biết" (1 từ)
 *        "lý do" (2 từ) => "lí do" (2 từ)
 * TUYỆT ĐỐI KHÔNG gợi ý thêm bớt từ (ví dụ: cấm gợi ý "suy cơ" thành "nguy cơ ẩn" làm lệch timestamp).
 */

const PROMPT_SPELL_CHECK = `
Bạn là Chuyên Gia Hiệu Đính & Biên Tập Ngôn Ngữ Tiếng Việt cao cấp kiêm chuyên gia xuất nhập khẩu, logistics và kinh doanh.
Nhân vật nói trong video xưng tên là "Thúy" (chia sẻ kiến thức về xuất nhập khẩu, logistics, kinh doanh, quản trị...).

Nhiệm vụ: Phân tích danh sách các từ trong transcript dưới đây (được nhận diện từ âm thanh nên có thể có một số từ bị nghe nhầm, sai chính tả, sai dấu hoặc sai thuật ngữ chuyên môn).
Hãy tìm ra TẤT CẢ các lỗi chính tả hoặc nghe nhầm dựa trên NGỮ CẢNH TOÀN CÂU.

═══════════════════════════════════════════════════════════════
QUY TẮC BẮT BUỘC VỀ SỐ LƯỢNG TỪ (CỰC KỲ QUAN TRỌNG):
═══════════════════════════════════════════════════════════════
1. MỖI GỢI Ý THAY THẾ PHẢI CÓ SỐ LƯỢNG TIẾNG/TỪ CHÍNH XÁC BẰNG SỐ LƯỢNG TIẾNG/TỪ GỐC (1-TO-1 WORD REPLACEMENT):
   - Nếu từ gốc có 1 tiếng (1 word) -> Từ gợi ý BẮT BUỘC chỉ có đúng 1 tiếng (ví dụ: "bít" -> "biết", "suy" -> "nguy", "thủy" -> "thúy").
   - Nếu cụm từ gốc có 2 tiếng (2 words) -> Cụm gợi ý BẮT BUỘC chỉ có đúng 2 tiếng (ví dụ: "suy cơ" -> "nguy cơ", "công ti" -> "công ty", "tàu mclean" -> "tàu McLean").
   - TUYỆT ĐỐI KHÔNG thêm từ hoặc bớt từ (CẤM: "suy cơ" thành "nguy cơ tiềm ẩn" vì 2 từ biến thành 4 từ sẽ làm hỏng đồng bộ thời gian phụ đề!).

2. TÊN RIÊNG VÀ THUẬT NGỮ CHUYÊN MÔN:
   - Tên người nói xưng hô luôn là "Thúy" (nếu nhận diện thành "Thủy", "Thuý", "Tuý" thì sửa thành "Thúy").
   - Thuật ngữ chuyên môn: "Malcolm McLean", "Ideal X", "container", "mạn tàu", "bốc dỡ", "chính ngạch", "mã HS", "thuế xuất nhập khẩu"...

## DANH SÁCH TỪ VÀ MỐC THỜI GIAN THEO THỨ TỰ:
{words_json}

## ĐỊNH DẠNG ĐẦU RA JSON DUY NHẤT (Chỉ trả về JSON thuần túy, không có markdown text):
{
  "corrections": [
    {
      "startIndex": 12,
      "endIndex": 13,
      "originalText": "suy cơ",
      "suggestedText": "nguy cơ",
      "context": "...chúng ta cần kiểm soát các suy cơ tiềm ẩn...",
      "reason": "Sai chính tả / nghe nhầm theo ngữ cảnh"
    }
  ]
}
`;

/**
 * Phân tích và phát hiện lỗi chính tả trong transcript bằng Gemini AI
 * @param {Array} words Danh sách từ [{ word, start, end, ... }]
 * @param {string} apiKey Google Gemini API Key
 * @param {string} model Tên model (gemini-2.5-flash / gemini-3.5-flash...)
 * @returns {Promise<Array>} Danh sách gợi ý sửa lỗi [{ startIndex, endIndex, originalText, suggestedText, context, reason }]
 */
export async function checkTranscriptSpelling(words = [], apiKey = '', model = 'gemini-2.5-flash') {
  if (!words || words.length === 0) return [];
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key để sử dụng tính năng AI Sửa Chính Tả.");
  }

  // Chuẩn bị payload danh sách từ gọn nhẹ kèm index
  const compactWords = words.map((w, idx) => ({
    i: idx,
    w: w.word
  }));

  // Chia nhỏ thành các đoạn ~180 từ nếu kịch bản dài để xử lý chính xác từng câu
  const batchSize = 180;
  const batches = [];
  for (let i = 0; i < compactWords.length; i += batchSize) {
    batches.push(compactWords.slice(i, i + batchSize));
  }

  const allCorrections = [];

  for (const batch of batches) {
    const prompt = PROMPT_SPELL_CHECK.replace('{words_json}', JSON.stringify(batch));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || response.statusText || 'Lỗi gọi API');
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);

      if (parsed.corrections && Array.isArray(parsed.corrections)) {
        for (const item of parsed.corrections) {
          const sIdx = Number(item.startIndex);
          const eIdx = Number(item.endIndex ?? item.startIndex);
          
          if (!isNaN(sIdx) && sIdx >= 0 && sIdx < words.length) {
            const actualEnd = isNaN(eIdx) ? sIdx : Math.min(words.length - 1, eIdx);
            const origWordsCount = Math.max(1, actualEnd - sIdx + 1);
            const suggestedTokens = (item.suggestedText || '').trim().split(/\s+/).filter(Boolean);
            
            // 🛡️ Kiểm tra nghiêm ngặt: Bắt buộc số lượng từ gợi ý phải bằng đúng số lượng từ gốc!
            let finalSuggestedText = item.suggestedText;
            if (suggestedTokens.length !== origWordsCount) {
              console.warn(`[SpellChecker] Bỏ qua gợi ý không khớp số lượng từ: "${item.originalText}" (${origWordsCount} từ) vs "${item.suggestedText}" (${suggestedTokens.length} từ)`);
              if (suggestedTokens.length > origWordsCount) {
                finalSuggestedText = suggestedTokens.slice(0, origWordsCount).join(' ');
              } else {
                continue; // Không an toàn -> bỏ qua
              }
            }

            // Tạo context câu xung quanh
            const ctxStart = Math.max(0, sIdx - 4);
            const ctxEnd = Math.min(words.length - 1, actualEnd + 4);
            const contextText = words.slice(ctxStart, ctxEnd + 1).map(w => w.word).join(' ');

            allCorrections.push({
              id: `corr_${sIdx}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              startIndex: sIdx,
              endIndex: actualEnd,
              originalText: item.originalText || words.slice(sIdx, actualEnd + 1).map(w => w.word).join(' '),
              suggestedText: finalSuggestedText,
              customText: finalSuggestedText, // Cho phép người dùng chỉnh sửa tay
              context: item.context || `...${contextText}...`,
              reason: item.reason || 'Sửa lỗi chính tả / nghe nhầm theo ngữ cảnh',
              status: 'pending' // 'pending' | 'accepted' | 'rejected'
            });
          }
        }
      }
    } catch (err) {
      console.warn("[SpellChecker] Lỗi khi kiểm tra chính tả batch:", err);
    }
  }

  // Loại bỏ các mục trùng lặp theo startIndex
  const uniqueMap = new Map();
  for (const c of allCorrections) {
    if (!uniqueMap.has(c.startIndex)) {
      uniqueMap.set(c.startIndex, c);
    }
  }

  return Array.from(uniqueMap.values());
}
