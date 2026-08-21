import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import List, Dict, Optional

def format_ass_time(seconds: float) -> str:
    """Format seconds as ASS timestamp: H:MM:SS.cc"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours}:{minutes:02d}:{secs:05.2f}"

def color_to_ass_hex(hex_str: str, default: str = "&H00FFFFFF") -> str:
    """Convert #RRGGBB to ASS &H00BBGGRR format."""
    clean = hex_str.replace("#", "").strip()
    if len(clean) == 6:
        r, g, b = clean[0:2], clean[2:4], clean[4:6]
        return f"&H00{b}{g}{r}"
    elif len(clean) == 8:
        r, g, b = clean[0:2], clean[2:4], clean[4:6]
        return f"&H00{b}{g}{r}"
    return default

def generate_ass_subtitles(
    words: List[Dict],
    start_time: float,
    end_time: float,
    output_ass_path: str,
    hook_title: Optional[str] = None,
    title_config: Optional[Dict] = None,
    caption_config: Optional[Dict] = None,
    caption_preset: Optional[str] = 'hormozi',
    font_style: Optional[Dict] = None,
    brand_config: Optional[Dict] = None,
    text_layers: Optional[List[Dict]] = None,
    excluded_word_indices: Optional[List[int]] = None,
    has_title_card_image: bool = False,
    has_brand_logo_image: bool = False
) -> str:
    """
    🔥 WYSIWYG SUBTITLE & OVERLAY GENERATOR (Chuẩn 1080x1920 Full HD):
    - Đốt Tiêu đề Hook theo đúng Style (Pill White, Neon, Gradient Gold, Yellow Impact, Minimal), vị trí và thời lượng.
    - Đốt Phụ đề theo đúng Preset (Hormozi, MrBeast, Karaoke, Cyberpunk), Font, Cỡ, Màu sắc, Vị trí kéo thả.
    - Đốt các Nhãn dán Chữ (Text Layers) đúng vị trí và Style.
    - Đốt Watermark Logo thương hiệu.
    - Lọc bỏ 100% các từ đã bị xóa / gạch bỏ (excluded_word_indices).
    """
    font_style = font_style or {}
    title_config = title_config or {}
    caption_config = caption_config or {}
    brand_config = brand_config or {}
    text_layers = text_layers or []
    excluded_set = set(excluded_word_indices or [])

    font_family = font_style.get("fontFamily", "Montserrat")
    base_font_size = font_style.get("fontSize", 40)
    caption_scale = (caption_config.get("scale", 100)) / 100.0
    actual_font_size = int(base_font_size * 2.2 * caption_scale)

    text_color = color_to_ass_hex(font_style.get("textColor", "#FFFFFF"), "&H00FFFFFF")
    stroke_color = color_to_ass_hex(font_style.get("strokeColor", "#000000"), "&H00000000")
    stroke_width = font_style.get("strokeWidth", 8)
    highlight_color = color_to_ass_hex(font_style.get("highlightColor", "#04f827"), "&H0027F804")
    is_uppercase = font_style.get("isUppercase", True)

    # Subtitle Position (Default x: 50%, y: 84% -> 540, 1612)
    cap_pos = caption_config.get("pos", {"x": 50, "y": 84})
    sub_x = int((cap_pos.get("x", 50) / 100.0) * 1080)
    sub_y = int((cap_pos.get("y", 84) / 100.0) * 1920)

    # Hook Title Position (Default x: 50%, y: 10% -> 540, 192)
    title_pos = title_config.get("pos", {"x": 50, "y": 10})
    title_x = int((title_pos.get("x", 50) / 100.0) * 1080)
    title_y = int((title_pos.get("y", 10) / 100.0) * 1920)

    title_scale = (title_config.get("scale", 100)) / 100.0
    title_font_size = int(50 * title_scale)
    title_style_type = title_config.get("style", "pill_white")
    title_start_offset = float(title_config.get("startTime", 0.0))
    title_duration = float(title_config.get("duration", 6.0))
    title_visible = title_config.get("visible", True)

    ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubtitleStyle,{font_family},{actual_font_size},{text_color},&H000000FF,{stroke_color},&H80000000,-1,0,0,0,100,100,1,0,1,{stroke_width},2,5,40,40,200,1
Style: HookPillWhite,Montserrat,{title_font_size},&H00000000,&H000000FF,&H00FFFFFF,&H40000000,-1,0,0,0,100,100,1,0,1,16,4,5,40,40,160,1
Style: HookNeonCyber,Montserrat,{title_font_size},&H0027F804,&H000000FF,&H00000000,&H0027F804,-1,0,0,0,100,100,1,0,1,8,6,5,40,40,160,1
Style: HookGradientGold,Montserrat,{title_font_size},&H00000000,&H000000FF,&H0000D7FF,&H000055AA,-1,0,0,0,100,100,1,0,1,12,5,5,40,40,160,1
Style: HookYellowImpact,Impact,{int(title_font_size * 1.15)},&H0000E5FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,1,0,1,14,5,5,40,40,160,1
Style: HookMinimal,Montserrat,{title_font_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,4,2,5,40,40,160,1
Style: TextStickerHeader,Montserrat,46,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,8,3,5,40,40,100,1
Style: TextStickerNeon,Montserrat,40,&H0027F804,&H000000FF,&H00000000,&H0027F804,-1,0,0,0,100,100,1,0,1,6,4,5,40,40,100,1
Style: TextStickerBadge,Montserrat,42,&H00000000,&H000000FF,&H0000D7FF,&H000055AA,-1,0,0,0,100,100,1,0,1,8,4,5,40,40,100,1
Style: TextStickerCallout,Montserrat,36,&H00E0E0E0,&H000000FF,&H00202020,&H80000000,0,0,0,0,100,100,1,0,1,6,2,5,40,40,100,1
Style: TextStickerYellow,Impact,52,&H0000E5FF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,1,0,1,12,4,5,40,40,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []

    # 1. Top Hook Headline Bar (Only fallback to ASS if not rendered as PNG Image Overlay)
    if hook_title and title_visible and not has_title_card_image:
        clean_title = hook_title.upper() if is_uppercase else hook_title
        h_start = format_ass_time(title_start_offset)
        h_end = format_ass_time(title_start_offset + title_duration)

        style_map = {
            "pill_white": ("HookPillWhite", f"{{\\an5\\pos({title_x}, {title_y})\\bord14\\3c&H00FFFFFF&\\c&H00000000&\\shad3\\4c&H40000000&}}"),
            "neon_cyber": ("HookNeonCyber", f"{{\\an5\\pos({title_x}, {title_y})\\bord8\\3c&H0027F804&\\c&H0027F804&\\shad4\\4c&H0027F804&}}"),
            "gradient_gold": ("HookGradientGold", f"{{\\an5\\pos({title_x}, {title_y})\\bord14\\3c&H0000D7FF&\\c&H00000000&\\shad3}}"),
            "yellow_impact": ("HookYellowImpact", f"{{\\an5\\pos({title_x}, {title_y})\\bord14\\3c&H00000000&\\c&H0000E5FF&\\shad4}}"),
            "minimal": ("HookMinimal", f"{{\\an5\\pos({title_x}, {title_y})\\bord4\\3c&H00000000&\\c&H00FFFFFF&\\shad2}}")
        }

        chosen_style, tag_prefix = style_map.get(title_style_type, style_map["pill_white"])
        events.append(f"Dialogue: 2,{h_start},{h_end},{chosen_style},,0,0,0,,{tag_prefix}{clean_title}")

    # 2. Text Layers (Stickers)
    for idx, tl in enumerate(text_layers):
        if not tl or not tl.get("text"):
            continue
        tl_text = tl["text"].upper() if is_uppercase else tl["text"]
        tl_pos = tl.get("pos", {"x": 50, "y": 60 + idx * 8})
        tx = int((tl_pos.get("x", 50) / 100.0) * 1080)
        ty = int((tl_pos.get("y", 60) / 100.0) * 1920)
        tl_style = tl.get("style", "header")

        tl_style_map = {
            "header": ("TextStickerHeader", f"{{\\an5\\pos({tx}, {ty})\\c&H00FFFFFF&\\bord8\\3c&H00000000&}}"),
            "neon_tag": ("TextStickerNeon", f"{{\\an5\\pos({tx}, {ty})\\c&H0027F804&\\bord6\\3c&H00000000&\\shad3\\4c&H0027F804&}}"),
            "gradient_badge": ("TextStickerBadge", f"{{\\an5\\pos({tx}, {ty})\\c&H00000000&\\bord8\\3c&H0000D7FF&}}"),
            "callout_box": ("TextStickerCallout", f"{{\\an5\\pos({tx}, {ty})\\c&H00FFFFFF&\\bord6\\3c&H00181818&}}"),
            "yellow_impact": ("TextStickerYellow", f"{{\\an5\\pos({tx}, {ty})\\c&H0000E5FF&\\bord12\\3c&H00000000&}}")
        }
        st_name, st_tag = tl_style_map.get(tl_style, tl_style_map["header"])
        events.append(f"Dialogue: 2,{format_ass_time(0.0)},{format_ass_time(max(1.0, end_time - start_time))},{st_name},,0,0,0,,{st_tag}{tl_text}")

    # 3. Brand Logo Watermark Text (Only fallback if not rendered as PNG Image Overlay)
    if brand_config and brand_config.get("showLogo", False) and not has_brand_logo_image:
        logo_text = (brand_config.get("logoText") or "").strip()
        if logo_text:
            l_pos = brand_config.get("pos", {"x": 82, "y": 6})
            lx = int((l_pos.get("x", 82) / 100.0) * 1080)
            ly = int((l_pos.get("y", 6) / 100.0) * 1920)
            events.append(f"Dialogue: 2,{format_ass_time(0.0)},{format_ass_time(max(1.0, end_time - start_time))},TextStickerHeader,,0,0,0,,{{\\an5\\pos({lx}, {ly})\\c&H60FFFFFF&\\bord4\\3c&H60000000&}}{logo_text.upper() if is_uppercase else logo_text}")

    # 4. Subtitles / Captions (Filter out excluded words)
    is_caption_visible = caption_config.get("visible", True)
    if is_caption_visible:
        # Lọc ra các từ thuộc clip hiện tại và loại trừ các từ người dùng đã gạch bỏ
        clip_words = []
        for word_idx, w in enumerate(words):
            if w["start"] >= start_time - 0.2 and w["end"] <= end_time + 0.5:
                if word_idx not in excluded_set:
                    clip_words.append(w)

        chunk_size = 4
        if caption_preset == 'mrbeast':
            chunk_size = 3
        elif caption_preset == 'one_word':
            chunk_size = 1

        for i in range(0, len(clip_words), chunk_size):
            chunk = clip_words[i:i + chunk_size]
            if not chunk:
                continue

            chunk_start = max(0.0, chunk[0]["start"] - start_time)
            chunk_end = max(chunk_start + 0.5, chunk[-1]["end"] - start_time)

            # For each word in chunk, highlight it while active
            for active_idx, active_word in enumerate(chunk):
                w_start = max(0.0, active_word["start"] - start_time)
                w_end = max(w_start + 0.15, active_word["end"] - start_time)

                line_parts = []
                for idx, w in enumerate(chunk):
                    w_text = w["word"].upper() if is_uppercase else w["word"]
                    if idx == active_idx:
                        # Highlight active word with preset effect
                        if caption_preset == 'mrbeast':
                            line_parts.append(f"{{\\c&H0000E5FF&\\t(0,80,\\fscx125\\fscy125)}}{w_text}{{\\rSubtitleStyle}}")
                        elif caption_preset == 'cyberpunk':
                            line_parts.append(f"{{\\c&H00FFFF00&\\3c&H00FF00FF&\\t(0,80,\\fscx115\\fscy115)}}{w_text}{{\\rSubtitleStyle}}")
                        else: # Hormozi / Default
                            line_parts.append(f"{{\\c{highlight_color}\\t(0,80,\\fscx118\\fscy118)}}{w_text}{{\\rSubtitleStyle}}")
                    else:
                        line_parts.append(w_text)

                line_text = " ".join(line_parts)
                events.append(f"Dialogue: 1,{format_ass_time(w_start)},{format_ass_time(w_end)},SubtitleStyle,,0,0,0,,{{\\an5\\pos({sub_x}, {sub_y})}}{line_text}")

    full_ass_content = ass_header + "\n".join(events) + "\n"

    Path(output_ass_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(full_ass_content)

    return output_ass_path
