/**
 * 🎯 VIRAL ANALYZER & CLIP SPLITTER (100% Client-Side Pure JavaScript)
 * Phân tích kịch bản theo 3 trụ cột (Hook - Problem - Solution, 1-4 phút) bằng Gemini AI
 * Tự động tạo Tiêu Đề Hook 2 vế cuốn hút bám sát nội dung lời thoại!
 */

const PROMPT_VIRAL_3_PILLARS = `
Bạn là chuyên gia biên tập video viral hàng đầu trên TikTok, YouTube Shorts, Reels (Chuẩn phong cách MrBeast, Alex Hormozi, SupoClip).
Nhiệm vụ: Phân tích toàn bộ transcript lời thoại và trích xuất TẤT CẢ các đoạn trích tiềm năng Triệu View (trích xuất từ 3 đến 6 Clips phân bổ đều từ đầu đến cuối video dài) theo CẤU TRÚC 3 TRỤ CỘT BẮT BUỘC:

═══════════════════════════════════════════════════════════════
CẤU TRÚC 3 TRỤ CỘT CỦA MỖI CLIP VIRAL:
═══════════════════════════════════════════════════════════════
1. PHẦN 1: HOOK (Mở đầu cuốn hút 5 - 15 giây đầu):
   - Câu mở đầu gây sốc, giật tít, khơi gợi tò mò, nêu vấn đề nóng khiến người xem dừng lại.
   - Trích dẫn rõ câu Hook và chấm hook_score (50 - 100).

2. PHẦN 2: PROBLEM (Vấn đề / Nỗi đau / Thách thức 40 - 150 giây giữa):
   - Đào sâu nguyên nhân, rủi ro, câu chuyện cụ thể hoặc thử thách gay cấn.
   - Nêu rõ Problem và chấm engagement_score (50 - 100).

3. PHẦN 3: SOLUTION (Giải pháp / Giá trị / Bài học 20 - 60 giây cuối):
   - Đưa ra giải pháp dứt khoát, mẹo thực tế, bài học đắt giá hoặc kết luận đọng lại.
   - Nêu rõ Solution và chấm value_score (50 - 100).

QUY TẮC TIÊU ĐỀ 'title' & THỜI LƯỢNG (CỰC KỲ NGHIÊM NGẶT):
- TIÊU ĐỀ 'title' BẮT BUỘC CÓ CẤU TRÚC 2 VẾ (Ngăn cách bằng dấu hai chấm ":"):
  + Vế 1 (Chủ đề / Đối tượng nóng, 2-4 từ) : Vế 2 (Bài học / Cảnh báo / Câu hỏi giật tít, 3-6 từ).
  + Viết IN HOA TOÀN BỘ, dưới 45 ký tự.
  + TUYỆT ĐỐI KHÔNG lấy nguyên câu thoại nói ngẫu nhiên trong bài. PHẢI TỰ ĐÚC KẾT TIÊU ĐỀ CÓ Ý NGHĨA TRỌN VẸN.
  + Ví dụ: "DANH MỤC HÀNG HÓA: QUY ĐỊNH MỚI CẦN BIẾT!" hoặc "TRA CỨU MÃ HS: 2 CÁCH NHANH NHẤT!" hoặc "DÂN XUẤT NHẬP KHẨU: ĐÃ BIẾT LUẬT MỚI CHƯA?".
- Thời lượng mỗi clip: TỐI THIỂU 60 GIÂY (1 phút) và TỐI ĐA 240 GIÂY (4 phút). (Nếu video gốc ngắn hơn 60s, giữ toàn bộ video).
- start_time & end_time: Cắt đúng đầu câu và cuối câu hoàn chỉnh của người nói.

## DỮ LIỆU TRANSCRIPT:
{transcript_text}

## ĐỊNH DẠNG ĐẦU RA JSON DUY NHẤT (Chỉ trả về JSON thuần túy, không có markdown text):
{
  "clips": [
    {
      "id": 1,
      "title": "DANH MỤC HÀNG HÓA: QUY ĐỊNH MỚI CẦN BIẾT!",
      "start_time": 0.0,
      "end_time": 120.0,
      "hook": "Câu mở đầu giật gân ấn tượng...",
      "hook_score": 95,
      "problem": "Vấn đề và rủi ro chính...",
      "engagement_score": 92,
      "solution": "Giải pháp và bài học đắt giá...",
      "value_score": 94,
      "shareability_score": 90,
      "overall_score": 93,
      "summary": "Tóm tắt lý do vì sao clip này cuốn hút"
    }
  ]
}
`;

const PROMPT_GENERATE_HOOK_TITLE = `
Bạn là bậc thầy giật tít Video Viral triệu view (Hook Headline Master) trên TikTok, Reels và Shorts.
Hãy đọc kỹ nội dung kịch bản và sáng tạo ra ĐÚNG 1 TIÊU ĐỀ HOOK đỉnh cao thuộc 1 trong 3 thể loại thu hút nhất:
1. BÀI HỌC / BÍ QUYẾT ĐẮT GIÁ: Ví dụ "TRA CỨU MÃ HS: 2 CÁCH NHANH NHẤT!" hoặc "TỐI ƯU CHI PHÍ: TIẾT KIỆM 50% VẬN CHUYỂN!"
2. CẢNH BÁO / RỦI RO CẦN TRÁNH: Ví dụ "MẶT HÀNG RỦI RO: TRÁNH BỊ PHẠT NẶNG!" hoặc "DANH MỤC HÀNG HÓA: ĐIỀU DOANH NGHIỆP CẦN BIẾT!"
3. CÂU HỎI TÒ MÒ / KÍCH THÍCH TƯ DUY: Ví dụ "DÂN XUẤT NHẬP KHẨU: ĐÃ BIẾT LUẬT MỚI CHƯA?" hoặc "CONTAINER ĐẦU TIÊN: RA ĐỜI THẾ NÀO?"

- CẤU TRÚC BẮT BUỘC 2 VẾ (Ngăn cách bằng dấu hai chấm ":"):
  + Vế 1 (Chủ đề / Đối tượng nóng): 2-4 từ.
  + Vế 2 (Bài học / Cảnh báo / Câu hỏi giật tít): 3-6 từ.
- TỔNG ĐỘ DÀI: Dưới 45 ký tự, chữ IN HOA TOÀN BỘ, không dài dòng, không dùng từ nối rườm rà.
- TUYỆT ĐỐI KHÔNG cắt vụn câu thoại nói ngẫu nhiên trong bài. PHẢI TỰ ĐÚC KẾT TIÊU ĐỀ CÓ Ý NGHĨA TRỌN VẸN.

## NỘI DUNG KỊCH BẢN:
{text}

Chỉ xuất ra DUY NHẤT 1 dòng Tiêu Đề Hook in hoa, không giải thích thêm:
`;

/**
 * Hít mốc thời gian vào biên từ (Word Boundary Snapper)
 */
function snapToWordBoundary(time, words, isEnd = false) {
  if (!words || words.length === 0) return time;
  let closest = words[0];
  let minDiff = Math.abs((isEnd ? closest.end : closest.start) - time);

  for (const w of words) {
    const target = isEnd ? w.end : w.start;
    const diff = Math.abs(target - time);
    if (diff < minDiff) {
      minDiff = diff;
      closest = w;
    }
  }
  return Math.round((isEnd ? closest.end : closest.start) * 100) / 100;
}

/**
 * AI Sinh Tiêu Đề Hook 2 Vế Bám Sát Kịch Bản
 */
export async function generateSmartHookTitle(text, apiKey, model = 'gemini-2.5-flash') {
  if (!text) return "DANH MỤC HÀNG HÓA: QUY ĐỊNH MỚI CẦN BIẾT!";
  if (apiKey) {
    try {
      const prompt = PROMPT_GENERATE_HOOK_TITLE.replace('{text}', text.slice(0, 2000));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 60 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rawTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawTitle && rawTitle.length >= 6) {
          const cleanTitle = rawTitle.replace(/^["'`*#:\-\s]+|["'`*#:\-\s]+$/g, '').slice(0, 50).toUpperCase();
          if (cleanTitle.length >= 6) {
            return cleanTitle;
          }
        }
      }
    } catch (e) {
      console.warn("Hook generation notice:", e);
    }
  }

  return getFallbackSmartTitle(text);
}

/**
 * Bộ từ điển thông minh dự phòng (Đảm bảo luôn có tiêu đề 2 vế ý nghĩa chuẩn chuyên ngành)
 */
export function getFallbackSmartTitle(text = '') {
  const lower = (text || '').toLowerCase();
  if (lower.includes('thuế') || lower.includes('mặt hàng') || lower.includes('danh mục') || lower.includes('văn bản')) {
    return "DANH MỤC HÀNG HÓA: QUY ĐỊNH MỚI CẦN BIẾT!";
  }
  if (lower.includes('hs') || lower.includes('mã')) {
    return "TRA CỨU MÃ HS: 2 CÁCH NHANH NHẤT!";
  }
  if (lower.includes('phương thức') || lower.includes('kiểm tra') || lower.includes('hải quan')) {
    return "KIỂM TRA HÀNG HÓA: 2 PHƯƠNG THỨC MỚI!";
  }
  if (lower.includes('container') || lower.includes('mclean') || lower.includes('tàu') || lower.includes('cảng')) {
    return "CONTAINER ĐẦU TIÊN: RA ĐỜI THẾ NÀO?";
  }
  if (lower.includes('chi phí') || lower.includes('tối ưu') || lower.includes('logistics') || lower.includes('vận chuyển')) {
    return "TỐI ƯU CHI PHÍ: TIẾT KIỆM 50% LOGISTICS!";
  }
  if (lower.includes('rủi ro') || lower.includes('phạt') || lower.includes('lỗi')) {
    return "MẶT HÀNG RỦI RO: TRÁNH BỊ PHẠT NẶNG!";
  }
  return "DÂN XUẤT NHẬP KHẨU: ĐÃ BIẾT ĐIỀU NÀY CHƯA?";
}

/**
 * Phân Tích Kịch Bản & Cắt Clips (Client-Side Pure JS + Gemini Cloud AI)
 */
export async function analyzeViralClipsClient(transcript, videoMetadata = {}, apiKey = '', model = 'gemini-2.5-flash', processingMode = 'full') {
  const fullText = transcript.full_text || '';
  const words = transcript.words || [];
  const totalDuration = transcript.duration || 60;
  const isAudio = Boolean(videoMetadata.is_audio_only || videoMetadata.media_type === 'audio' || videoMetadata.author === 'File Ghi Âm');

  // ══════════════════════════════════════════════════════════════════════════════
  // CHẾ ĐỘ 1: DÙNG NGUYÊN BẢN (TOÀN BỘ THỜI LƯỢNG)
  // ══════════════════════════════════════════════════════════════════════════════
  if (processingMode === 'full' || totalDuration <= 60) {
    // 🧠 AI Sinh Tiêu Đề Hook bám sát nội dung cho toàn bộ video
    let aiHookTitle = 'DANH MỤC HÀNG HÓA: QUY ĐỊNH MỚI CẦN BIẾT!';
    if (apiKey && fullText) {
      try {
        aiHookTitle = await generateSmartHookTitle(fullText, apiKey, model);
      } catch (e) {
        aiHookTitle = getFallbackSmartTitle(fullText);
      }
    } else {
      aiHookTitle = getFallbackSmartTitle(fullText);
    }

    // Tự động phân tách các phân cảnh ban đầu (mỗi 15s)
    const scenes = [];
    const stepDuration = 15.0;
    const sceneCount = Math.max(1, Math.ceil(totalDuration / stepDuration));

    for (let i = 0; i < sceneCount; i++) {
      const sStart = Math.round(i * stepDuration * 10) / 10;
      const sEnd = Math.round(Math.min(totalDuration, (i + 1) * stepDuration) * 10) / 10;
      if (sEnd - sStart < 1.0 && i > 0) continue;

      scenes.push({
        id: `sc_${Date.now()}_${i}`,
        title: `Phân Cảnh ${i + 1}`,
        start_time: sStart,
        end_time: sEnd,
        duration: Math.round((sEnd - sStart) * 10) / 10,
        transition: 'none'
      });
    }

    const singleClip = {
      id: 1,
      title: aiHookTitle,
      start_time: 0.0,
      end_time: Math.round(totalDuration * 100) / 100,
      duration: Math.round(totalDuration * 100) / 100,
      hook: fullText.slice(0, 100) + '...',
      hook_score: 98,
      hook_grade: 'A+',
      problem: fullText.slice(100, 300) || 'Nội dung phân tích chuyên sâu',
      engagement_score: 95,
      solution: fullText.slice(-150) || 'Giải pháp và bài học đắt giá',
      value_score: 96,
      shareability_score: 94,
      overall_score: 96,
      summary: fullText.slice(0, 150),
      reason: 'Video nguyên bản hoàn chỉnh được bóc băng từng từ 100% thời lượng.',
      scenes: scenes
    };

    return [singleClip];
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CHẾ ĐỘ 2: CẮT CLIP VIRAL BẰNG AI THEO 3 TRỤ CỘT (1 - 4 PHÚT)
  // ══════════════════════════════════════════════════════════════════════════════
  if (apiKey && fullText) {
    try {
      const transcriptParagraphs = [];
      const step = 25; // 25s
      for (let t = 0; t < totalDuration; t += step) {
        const tEnd = Math.min(totalDuration, t + step);
        const segWords = words.filter(w => w.start >= t && w.start < tEnd);
        if (segWords.length > 0) {
          const segText = segWords.map(w => w.word).join(' ');
          const mStart = Math.floor(t / 60);
          const sStart = Math.floor(t % 60);
          const mEnd = Math.floor(tEnd / 60);
          const sEnd = Math.floor(tEnd % 60);
          transcriptParagraphs.push(`[${mStart}:${sStart.toString().padStart(2, '0')} - ${mEnd}:${sEnd.toString().padStart(2, '0')}] (giây ${Math.round(t)} - ${Math.round(tEnd)}): ${segText}`);
        }
      }
      const formattedTranscript = transcriptParagraphs.join('\n\n');

      const prompt = PROMPT_VIRAL_3_PILLARS.replace('{transcript_text}', formattedTranscript);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            response_mime_type: "application/json"
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(jsonStr || '{}');

        if (parsed.clips && Array.isArray(parsed.clips) && parsed.clips.length > 0) {
          const calcGrade = (score) => {
            if (score >= 95) return 'A+';
            if (score >= 90) return 'A';
            if (score >= 85) return 'B+';
            if (score >= 80) return 'B';
            return 'C+';
          };

          return parsed.clips.map((c, idx) => {
            const rawSt = Math.max(0, parseFloat(c.start_time) || 0);
            const rawEt = Math.min(totalDuration, parseFloat(c.end_time) || (rawSt + 60));
            
            const sStart = snapToWordBoundary(rawSt, words, false);
            const sEnd = snapToWordBoundary(rawEt, words, true);
            const cDur = Math.max(10, Math.round((sEnd - sStart) * 10) / 10);

            const hScore = parseInt(c.hook_score) || 90;
            const pScore = parseInt(c.engagement_score || c.problem_score) || 88;
            const sScore = parseInt(c.value_score || c.solution_score) || 92;
            const shScore = parseInt(c.shareability_score) || 89;
            const oScore = parseInt(c.overall_score) || Math.round(hScore * 0.35 + pScore * 0.25 + sScore * 0.25 + shScore * 0.15);

            // Tạo 3 phân cảnh chuẩn 3 Trụ Cột
            const hookEnd = Math.round(Math.min(sEnd, sStart + Math.min(15, cDur * 0.2)) * 10) / 10;
            const probEnd = Math.round(Math.max(hookEnd + 5, sEnd - Math.min(25, cDur * 0.25)) * 10) / 10;

            const scenes = [
              {
                id: `sc_c${idx}_hook`,
                title: 'Mở Đầu (Hook 5-15s)',
                start_time: sStart,
                end_time: hookEnd,
                duration: Math.round((hookEnd - sStart) * 10) / 10,
                transition: 'zoom_in'
              },
              {
                id: `sc_c${idx}_prob`,
                title: 'Nội Dung (Problem)',
                start_time: hookEnd,
                end_time: probEnd,
                duration: Math.round((probEnd - hookEnd) * 10) / 10,
                transition: 'none'
              },
              {
                id: `sc_c${idx}_sol`,
                title: 'Giải Pháp (Solution)',
                start_time: probEnd,
                end_time: sEnd,
                duration: Math.round((sEnd - probEnd) * 10) / 10,
                transition: 'none'
              }
            ];

            let clipTitle = (c.title || '').trim();
            // Nếu tiêu đề bị thiếu dấu 2 chấm hoặc quá ngắn, tạo lại bằng bộ sinh thông minh
            if (!clipTitle || clipTitle.length < 6 || !clipTitle.includes(':')) {
              const clipSliceText = c.hook || (words.filter(w => w.start >= sStart && w.end <= sEnd).map(w => w.word).join(' '));
              clipTitle = getFallbackSmartTitle(clipSliceText);
            }

            return {
              id: idx + 1,
              title: clipTitle.toUpperCase(),
              start_time: sStart,
              end_time: sEnd,
              duration: cDur,
              hook: c.hook || fullText.slice(0, 80) + '...',
              hook_score: hScore,
              hook_grade: calcGrade(hScore),
              problem: c.problem || 'Vấn đề thực tế được phân tích sâu',
              engagement_score: pScore,
              engagement_grade: calcGrade(pScore),
              solution: c.solution || 'Giải pháp và bài học rút ra',
              value_score: sScore,
              value_grade: calcGrade(sScore),
              shareability_score: shScore,
              shareability_grade: calcGrade(shScore),
              overall_score: oScore,
              summary: c.summary || 'Đoạn trích có nhịp điệu nhanh, cảm xúc dồn dập phù hợp giữ chân người xem.',
              reason: 'Clip đạt chuẩn 3 trụ cột Hook - Problem - Solution tiềm năng triệu view.',
              scenes
            };
          });
        }
      }
    } catch (err) {
      console.warn("AI Viral analysis fallback to heuristics:", err);
    }
  }

  // Fallback Heuristic: Sinh Tiêu Đề Hook 2 vế chuẩn cho từng clip (Tuyệt đối không lấy câu thoại đầu)
  const fallbackClips = [];
  const clipLength = Math.min(totalDuration, 90.0);
  const numClips = Math.max(1, Math.min(5, Math.ceil(totalDuration / clipLength)));

  for (let i = 0; i < numClips; i++) {
    const cStart = snapToWordBoundary(Math.round(i * (totalDuration / numClips) * 10) / 10, words, false);
    const cEnd = snapToWordBoundary(Math.round(Math.min(totalDuration, cStart + clipLength) * 10) / 10, words, true);
    const cDur = Math.max(10, Math.round((cEnd - cStart) * 10) / 10);

    const clipWords = words.filter(w => w.start >= cStart && w.end <= cEnd);
    const clipText = clipWords.map(w => w.word).join(' ');

    const smartTitle = getFallbackSmartTitle(clipText);

    fallbackClips.push({
      id: i + 1,
      title: smartTitle,
      start_time: cStart,
      end_time: cEnd,
      duration: cDur,
      hook: clipText.slice(0, 80) + '...',
      hook_score: 92 - i * 3,
      hook_grade: i === 0 ? 'A+' : 'A',
      problem: 'Nội dung phân tích thực tế',
      engagement_score: 88,
      solution: 'Giải pháp và giá trị đắt giá',
      value_score: 90,
      shareability_score: 87,
      overall_score: 90 - i * 2,
      summary: clipText.slice(0, 120),
      reason: 'Đoạn trích được tối ưu thời lượng 1 - 4 phút chuẩn TikTok/Shorts.',
      scenes: [
        {
          id: `sc_c${i}_0`,
          title: 'Mở Đầu (Hook)',
          start_time: cStart,
          end_time: Math.round((cStart + cDur * 0.25) * 10) / 10,
          transition: 'zoom_in'
        },
        {
          id: `sc_c${i}_1`,
          title: 'Cao Trào (Problem & Solution)',
          start_time: Math.round((cStart + cDur * 0.25) * 10) / 10,
          end_time: cEnd,
          transition: 'none'
        }
      ]
    });
  }

  return fallbackClips;
}
