/**
 * ✨ AI SPELL CHECKER & CONTEXTUAL TRANSCRIPT FIXER (100% Client-Side Pure JS + Gemini Cloud)
 * Phân tích và hiểu TRỌN VẸN TOÀN BỘ NGỮ CẢNH VIDEO tiếng Việt trước khi phát hiện từ viết sai chính tả / nghe nhầm
 * 
 * ⚠️ QUY TẮC CỐT LÕI BẮT BUỘC (1-to-1 Word Replacement):
 * Từ gợi ý sửa PHẢI CÓ SỐ LƯỢNG TỪ / TIẾNG Y HỆT TỪ CẦN SỬA để bảo toàn 100% mốc thời gian sóng âm!
 * Ví dụ: "suy cơ" (2 từ) => "nguy cơ" (2 từ)
 *        "bán hành" (2 từ) => "ban hành" (2 từ)
 *        "bà" (1 từ) => "bàn" (1 từ)
 * TUYỆT ĐỐI KHÔNG thêm bớt từ làm lệch timestamp.
 */

const PROMPT_SPELL_CHECK_TEMPLATE = `
Bạn là Chuyên Gia Hiệu Đính Ngôn Ngữ Tiếng Việt kiêm chuyên gia xuất nhập khẩu, thương mại quốc tế, logistics và kinh doanh.
Nhân vật nói trong video xưng tên là "Thúy" (chia sẻ kiến thức về thủ tục hải quan, xuất nhập khẩu, tra cứu mã HS, logistics, kinh doanh...).

═══════════════════════════════════════════════════════════════
PHA 1: NGỮ CẢNH TOÀN CỤC CỦA VIDEO (HÃY ĐỌC VÀ HIỂU TOÀN BỘ CÂU CHUYỆN):
═══════════════════════════════════════════════════════════════
"""
{full_context}
"""

═══════════════════════════════════════════════════════════════
PHA 2: DANH SÁCH TỪ ĐƯỢC ĐÁNH SỐ THỨ TỰ [INDEX: TỪ]:
═══════════════════════════════════════════════════════════════
{numbered_words}

═══════════════════════════════════════════════════════════════
QUY TẮC HIỆU ĐÍNH BẮT BUỘC (CỰC KỲ QUAN TRỌNG):
═══════════════════════════════════════════════════════════════
1. Dựa trên NGỮ CẢNH TOÀN BỘ VIDEO ở Pha 1, hãy tìm ra các từ bị nhận diện âm thanh nghe nhầm hoặc sai chính tả:
   - Nghe nhầm từ vựng: "bán hành ngày 1/3" -> "ban hành", "bà thảo luận" -> "bàn thảo luận", "quý định" -> "quy định", "để không tríng" -> "để không tránh", "suy cơ" -> "nguy cơ"...
   - Tên riêng và xưng hô: "Thúy", "Malcolm McLean", "Ideal X", "mã HS", "container", "chính ngạch", "hải quan"...

2. BẢO TOÀN 100% SỐ LƯỢNG TỪ (1-TO-1 WORD REPLACEMENT):
   - Từ gốc 1 tiếng -> Gợi ý đúng 1 tiếng (VD: "bà" -> "bàn", "tríng" -> "tránh").
   - Cụm từ gốc 2 tiếng -> Gợi ý đúng 2 tiếng (VD: "bán hành" -> "ban hành", "suy cơ" -> "nguy cơ").
   - TUYỆT ĐỐI KHÔNG thêm từ hoặc bớt từ để không làm hỏng đồng bộ mốc thời gian sóng âm!

## ĐỊNH DẠNG ĐẦU RA JSON DUY NHẤT (Chỉ trả về JSON thuần túy):
{
  "corrections": [
    {
      "startIndex": 3,
      "endIndex": 3,
      "originalText": "bà",
      "suggestedText": "bàn",
      "context": "...chúng ta sẽ bà được...",
      "reason": "Nghe nhầm theo ngữ cảnh 'bàn luận'"
    }
  ]
}
`;

/**
 * Phân tích và phát hiện lỗi chính tả trong transcript bằng Gemini AI dựa trên toàn bộ ngữ cảnh
 * @param {Array} words Danh sách từ [{ word, start, end, ... }]
 * @param {string} apiKey Google Gemini API Key
 * @param {string} model Tên model (gemini-2.5-flash)
 * @param {string} fullContextText Toàn bộ nội dung kịch bản của video để AI nạp ngữ cảnh
 * @returns {Promise<Array>} Danh sách gợi ý sửa lỗi
 */
export async function checkTranscriptSpelling(words = [], apiKey = '', model = 'gemini-2.5-flash', fullContextText = '') {
  if (!words || words.length === 0) return [];
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Vui lòng nhập Google Gemini API Key để sử dụng tính năng AI Sửa Chính Tả.");
  }

  // 1. Chuẩn bị ngữ cảnh toàn cục (Global Full Story Context)
  const fullStory = (fullContextText || words.map(w => w.word).join(' ')).trim().slice(0, 10000);

  // 2. Chia các từ thành từng batch ~120 từ để phân tích chi tiết
  const batchSize = 120;
  const batches = [];
  for (let i = 0; i < words.length; i += batchSize) {
    batches.push({
      startOffset: i,
      items: words.slice(i, i + batchSize)
    });
  }

  const allCorrections = [];

  for (const b of batches) {
    // Đánh số thứ tự từng từ kèm index thực tế: [12: Chúng] [13: ta] [14: sẽ]...
    const numberedText = b.items.map((w, localIdx) => `[${b.startOffset + localIdx}:${w.word}]`).join(' ');

    const prompt = PROMPT_SPELL_CHECK_TEMPLATE
      .replace('{full_context}', fullStory)
      .replace('{numbered_words}', numberedText);

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
        throw new Error(errJson?.error?.message || response.statusText || 'Lỗi gọi API Gemini');
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
              customText: finalSuggestedText,
              context: item.context || `...${contextText}...`,
              reason: item.reason || 'Sửa lỗi chính tả / nghe nhầm theo ngữ cảnh video',
              status: 'pending'
            });
          }
        }
      }
    } catch (err) {
      console.warn("[SpellChecker] Lỗi phân tích chính tả batch:", err);
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
