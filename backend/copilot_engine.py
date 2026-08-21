import os
import sys
import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google import genai
from backend.config import GEMINI_API_KEY

AVAILABLE_MODELS = [
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (Tối Ưu & Siêu Nhanh)", "desc": "Mô hình mới nhất, xử lý ngữ cảnh cực nhanh"},
    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (Lý Luận Sâu)", "desc": "Tư duy sản xuất video & viết kịch bản chuyên sâu"},
    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "desc": "Cân bằng tốc độ và độ chính xác"},
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "desc": "Mô hình flash thử nghiệm"},
]

SYSTEM_PROMPT = """
Bạn là AI Video Producer Copilot chuyên nghiệp (tương tự phong cách producer.opus.pro).
Bạn có toàn quyền điều khiển Studio dựng video ngắn (TikTok, YouTube Shorts, Reels) cho người dùng.

Người dùng sẽ ra lệnh bằng tiếng Việt tự nhiên (ví dụ: đổi tiêu đề, đổi màu chữ neon, xóa từ ậm ờ, thêm âm thanh Whoosh, tối ưu điểm viral, xuất video Full HD...).

NHIỆM VỤ CỦA BẠN:
1. Trả lời người dùng ngắn gọn, chuyên nghiệp và truyền cảm hứng.
2. Trích xuất CHÍNH XÁC các HÀNH ĐỘNG (Actions) cần thực hiện trên Studio dưới dạng mảng JSON `actions`.
3. Gợi ý 3 câu lệnh nhanh tiếp theo trong `quick_suggestions`.

CÁC HÀNH ĐỘNG HỖ TRỢ (ACTIONS):
- `{"type": "set_title", "title": "Tiêu Đề Mới"}`
- `{"type": "update_font", "style": {"fontFamily": "Montserrat"|"Arial"|"Inter"|"Impact", "fontSize": 44, "highlightColor": "#04f827"|"#FFFD03"|"#FF007A", "isUppercase": true, "textColor": "#ffffff", "strokeWidth": 8}}`
- `{"type": "cleanup_speech", "remove_fillers": true, "remove_pauses": true}`
- `{"type": "run_auto_mix"}` (Tự động quét và hòa âm Sound FX)
- `{"type": "add_sound_fx", "name": "Whoosh Fast", "file": "whoosh.wav", "time": 0.4}`
- `{"type": "add_broll", "title": "Minh họa B-Roll", "prompt": "mô tả hình ảnh", "time": 2.0}`
- `{"type": "trim_clip", "start_time": 184.0, "end_time": 220.0}`
- `{"type": "export_hd"}` (Kích hoạt xuất video 1080x1920)

BẠN BẮT BUỘC TRẢ VỀ JSON THUẦN TÚY CÓ CẤU TRÚC SAU:
{
  "message": "Lời giải thích hoặc tư vấn thân thiện bằng tiếng Việt...",
  "actions": [ ... danh sách action nếu có ... ],
  "quick_suggestions": [ "Gợi ý 1", "Gợi ý 2", "Gợi ý 3" ]
}
"""

class CopilotEngine:
    def __init__(self, default_model: str = "gemini-2.0-flash"):
        self.default_model = default_model

    def chat(
        self,
        user_message: str,
        history: List[Dict] = None,
        clip_context: Dict = None,
        model_name: str = None,
        api_key: Optional[str] = None
    ) -> Dict:
        """
        Xử lý tin nhắn của người dùng, phân tích ý định và trả về Action thực thi.
        """
        chosen_model = model_name or self.default_model
        active_key = api_key or GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")

        history = history or []
        clip_context = clip_context or {}

        # Context summary
        context_str = f"""
THÔNG TIN CLIP HIỆN TẠI:
- Tiêu đề hiện tại: "{clip_context.get('title', 'Chưa đặt')}"
- Thời lượng: {clip_context.get('duration', 30)}s (Từ {clip_context.get('start_time', 0)}s đến {clip_context.get('end_time', 30)}s)
- Điểm Viral Hook Score: {clip_context.get('hook_score', 95)}/100
- Lời thoại trích đoạn: "{clip_context.get('script', '')[:400]}"
- Cấu hình Font hiện tại: Font {clip_context.get('font_style', {}).get('fontFamily', 'Montserrat')}, Size {clip_context.get('font_style', {}).get('fontSize', 40)}px, Highlight {clip_context.get('font_style', {}).get('highlightColor', '#04f827')}
"""

        # Try Gemini LLM
        if active_key and active_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                client = genai.Client(api_key=active_key)
                prompt = f"{SYSTEM_PROMPT}\n\n{context_str}\n\nLỆNH CỦA NGƯỜI DÙNG: {user_message}"
                
                response = client.models.generate_content(
                    model=chosen_model,
                    contents=prompt
                )
                
                raw_text = response.text.strip()
                # Remove markdown code block fences if any
                clean_json = re.sub(r"^```json\s*", "", raw_text, flags=re.IGNORECASE)
                clean_json = re.sub(r"^```\s*", "", clean_json)
                clean_json = re.sub(r"\s*```$", "", clean_json)
                
                parsed = json.loads(clean_json)
                return {
                    "success": True,
                    "model_used": chosen_model,
                    "message": parsed.get("message", "Đã thực hiện xong yêu cầu của bạn!"),
                    "actions": parsed.get("actions", []),
                    "quick_suggestions": parsed.get("quick_suggestions", [
                        "Viết lại tiêu đề Hook viral",
                        "Tự động hòa âm Sound FX",
                        "Xuất video 9:16 Full HD"
                    ])
                }
            except Exception as e:
                print(f"[CopilotEngine] Gemini Error ({chosen_model}): {e}. Fallback to rule-based parser.")

        # Fallback Rule-Based NLP Parser (Đảm bảo luôn chạy được cả khi chưa có API Key)
        return self._rule_based_fallback(user_message, clip_context, chosen_model)

    def _rule_based_fallback(self, user_message: str, clip_context: Dict, model_name: str) -> Dict:
        msg_lower = user_message.lower()
        actions = []
        reply = "Tôi đã ghi nhận yêu cầu và điều chỉnh Studio cho bạn!"
        
        # 1. Đổi tiêu đề / Viết lại Hook
        if any(k in msg_lower for k in ["tiêu đề", "title", "hook", "đặt tên", "đổi tên"]):
            new_title = "BÍ MẬT KINH DOANH VÀ LUẬT BẤT THÀNH VĂN"
            if "viral" in msg_lower or "giật gân" in msg_lower or "99" in msg_lower:
                new_title = "CẢNH BÁO: SAI LẦM PHÁP LÝ KHIẾN BẠN MẤT TRẮNG!"
            actions.append({"type": "set_title", "title": new_title})
            reply = f"Đã viết lại tiêu đề Hook siêu viral cho bạn: **\"{new_title}\"**."

        # 2. Đổi font / Đổi màu sắc phụ đề
        elif any(k in msg_lower for k in ["màu", "font", "chữ", "neon", "vàng", "hồng", "xanh"]):
            color = "#04f827" # Xanh neon
            if "vàng" in msg_lower:
                color = "#FFFD03"
            elif "hồng" in msg_lower or "pink" in msg_lower:
                color = "#FF007A"
            
            font = "Montserrat"
            if "impact" in msg_lower:
                font = "Impact"
            elif "arial" in msg_lower:
                font = "Arial"

            actions.append({
                "type": "update_font",
                "style": {
                    "fontFamily": font,
                    "fontSize": 44,
                    "highlightColor": color,
                    "isUppercase": True,
                    "strokeWidth": 8
                }
            })
            reply = f"Đã cập nhật phong cách phụ đề Karaoke: Font **{font}**, cỡ chữ **44px** và màu Highlight **{color}** nổi bật!"

        # 3. Dọn dẹp từ thừa / Speech cleanup
        elif any(k in msg_lower for k in ["từ thừa", "ậm ờ", "khoảng lặng", "xóa từ", "clean", "dọn"]):
            actions.append({"type": "cleanup_speech", "remove_fillers": True, "remove_pauses": True})
            reply = "Đã loại bỏ toàn bộ từ thừa (à, ừm, xong...) và các khoảng dừng ngắt quãng trong lời thoại!"

        # 4. Tự động hòa âm Sound FX
        elif any(k in msg_lower for k in ["hòa âm", "sound fx", "âm thanh", "whoosh", "ding", "nhạc nền", "ducking"]):
            actions.append({"type": "run_auto_mix"})
            reply = "Đã kích hoạt bộ máy Tự Động Hòa Âm: Chèn tiếng Whoosh tại các điểm chuyển cảnh và Ding tại các từ khóa trọng tâm!"

        # 5. Xuất video Full HD
        elif any(k in msg_lower for k in ["xuất", "export", "render", "1080", "full hd", "tải về", "download"]):
            actions.append({"type": "export_hd"})
            reply = "Đang bắt đầu Render xuất video dọc 9:16 Full HD 1080x1920 (CRF 18) chuẩn phòng thu cho bạn!"

        # 6. Mặc định: Gợi ý sản xuất
        else:
            reply = "Tôi là AI Producer của bạn. Tôi có thể giúp bạn đổi kiểu chữ phụ đề, chèn B-Roll minh họa, tự động quét Sound FX hoặc xuất video chuẩn 9:16 Full HD!"

        return {
            "success": True,
            "model_used": model_name,
            "message": reply,
            "actions": actions,
            "quick_suggestions": [
                "Đổi màu chữ sang Vàng Sáng TikTok",
                "Tự động tạo Sound FX Whoosh & Ding",
                "Xóa sạch từ thừa và khoảng lặng",
                "Xuất video 9:16 Full HD 1080x1920"
            ]
        }
