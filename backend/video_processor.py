import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import FFMPEG_PATH, OUTPUT_CLIPS_DIR, BASE_DIR
from backend.face_tracker import FaceTracker
from backend.subtitle_generator import generate_ass_subtitles
from backend.audio_mixer import build_sound_fx_audio_filter

def cut_video_segment(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    lossless: bool = False
) -> str:
    """Cắt video/audio nhanh từng đoạn."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    duration = max(0.5, end_time - start_time)
    
    ext = Path(input_path).suffix.lower()
    is_audio = ext in {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.opus'}
    
    if is_audio:
        # Tạo container MP4 nền tối 1080x1920 + kênh âm thanh để phát mượt mà trên trình duyệt
        cmd = [
            FFMPEG_PATH, "-y",
            "-f", "lavfi", "-i", "color=c=0x10121d:s=1080x1920:r=30",
            "-ss", str(start_time),
            "-i", input_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output_path
        ]
    elif lossless:
        cmd = [
            FFMPEG_PATH, "-y",
            "-ss", str(start_time),
            "-i", input_path,
            "-t", str(duration),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            output_path
        ]
    else:
        cmd = [
            FFMPEG_PATH, "-y",
            "-ss", str(start_time),
            "-i", input_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-avoid_negative_ts", "make_zero",
            output_path
        ]
        
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return output_path

import base64
import urllib.request

def save_base64_image(data_uri: str, target_path: str) -> Optional[str]:
    """Lưu chuỗi ảnh base64 data URI thành file PNG chuẩn."""
    if not data_uri:
        return None
    try:
        if "," in data_uri:
            data_uri = data_uri.split(",", 1)[1]
        img_bytes = base64.b64decode(data_uri)
        Path(target_path).parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(img_bytes)
        return target_path
    except Exception as e:
        print(f"Error saving base64 image to {target_path}: {e}")
        return None

def prepare_broll_media(media_src: str, temp_dir: Path, idx: int, start_time: float) -> Optional[str]:
    """Tải hoặc chuẩn bị file B-Roll (ảnh / video) từ URL hoặc local path."""
    if not media_src:
        return None
    try:
        if media_src.startswith("data:"):
            ext = ".png" if "image/png" in media_src else ".jpg"
            target_path = str(temp_dir / f"broll_{idx}_{int(start_time)}{ext}")
            return save_base64_image(media_src, target_path)
        elif media_src.startswith("http://") or media_src.startswith("https://"):
            ext = ".mp4" if any(media_src.lower().endswith(v) for v in ['.mp4', '.mov', '.webm', '.mkv']) else ".jpg"
            target_path = str(temp_dir / f"broll_{idx}_{int(start_time)}{ext}")
            if not os.path.exists(target_path):
                req = urllib.request.Request(
                    media_src,
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, timeout=15) as resp, open(target_path, 'wb') as f:
                    f.write(resp.read())
            return target_path
        elif os.path.exists(media_src):
            return media_src
    except Exception as e:
        print(f"Warning: Failed to prepare B-Roll media {media_src}: {e}")
    return None

def compute_kept_intervals(
    start_time: float,
    end_time: float,
    words: Optional[List[Dict]] = None,
    excluded_word_indices: Optional[List[int]] = None,
    skip_intervals: Optional[List[Dict]] = None
) -> List[tuple]:
    """
    Tính toán danh sách các khoảng thời gian được giữ lại (kept intervals) sau khi cắt bỏ các từ thừa/khoảng lặng.
    Ưu tiên dùng skip_intervals trực tiếp từ frontend nếu có.
    """
    skips = []
    if skip_intervals:
        for sk in skip_intervals:
            s = float(sk.get("start", 0.0))
            e = float(sk.get("end", 0.0))
            if e > s:
                skips.append({"start": s, "end": e})
    elif excluded_word_indices and words:
        clip_words = [w for w in words if w.get("start", 0) >= start_time - 0.2 and w.get("end", 0) <= end_time + 0.5]
        if clip_words:
            excluded_set = set(excluded_word_indices)
            excluded_list = sorted([idx for idx in excluded_set if 0 <= idx < len(clip_words)])
            if excluded_list:
                chunk_start = excluded_list[0]
                chunk_end = excluded_list[0]
                for i in range(1, len(excluded_list)):
                    if excluded_list[i] == chunk_end + 1:
                        chunk_end = excluded_list[i]
                    else:
                        s_time = clip_words[chunk_start]["start"]
                        next_idx = chunk_end + 1
                        e_time = clip_words[next_idx]["start"] if next_idx < len(clip_words) else clip_words[chunk_end]["end"] + 0.2
                        skips.append({"start": s_time, "end": e_time})
                        chunk_start = excluded_list[i]
                        chunk_end = excluded_list[i]
                s_time = clip_words[chunk_start]["start"]
                next_idx = chunk_end + 1
                e_time = clip_words[next_idx]["start"] if next_idx < len(clip_words) else clip_words[chunk_end]["end"] + 0.2
                skips.append({"start": s_time, "end": e_time})

    if not skips:
        return [(start_time, end_time)]

    # Sắp xếp và hợp nhất các khoảng skip nằm trong [start_time, end_time]
    skips = sorted(skips, key=lambda x: x["start"])
    merged_skips = []
    for sk in skips:
        s_s = max(start_time, min(end_time, sk["start"]))
        s_e = max(start_time, min(end_time, sk["end"]))
        if s_e <= s_s:
            continue
        if not merged_skips:
            merged_skips.append({"start": s_s, "end": s_e})
        else:
            last = merged_skips[-1]
            if s_s <= last["end"] + 0.05:
                last["end"] = max(last["end"], s_e)
            else:
                merged_skips.append({"start": s_s, "end": s_e})

    kept = []
    curr = start_time
    for sk in merged_skips:
        if sk["start"] > curr + 0.08:
            kept.append((curr, sk["start"]))
        curr = max(curr, sk["end"])
    if curr < end_time - 0.08:
        kept.append((curr, end_time))

    return kept if kept else [(start_time, end_time)]

def map_time_to_cut_timeline(orig_time: float, kept_intervals: List[tuple]) -> float:
    """Ánh xạ thời gian gốc sang mốc thời gian của video đã cắt nối."""
    cumulative = 0.0
    for s_i, e_i in kept_intervals:
        if orig_time < s_i:
            return cumulative
        elif s_i <= orig_time <= e_i:
            return cumulative + (orig_time - s_i)
        cumulative += (e_i - s_i)
    return cumulative

def render_hd_vertical_clip(
    input_path: str,
    output_path: str,
    start_time: float,
    end_time: float,
    words: List[Dict],
    hook_title: Optional[str] = None,
    title_card_image: Optional[str] = None,
    brand_logo_image: Optional[str] = None,
    title_config: Optional[Dict] = None,
    caption_config: Optional[Dict] = None,
    caption_preset: Optional[str] = 'hormozi',
    font_style: Optional[Dict] = None,
    brand_config: Optional[Dict] = None,
    text_layers: Optional[List[Dict]] = None,
    sound_fx_markers: Optional[List[Dict]] = None,
    auto_whoosh: bool = True,
    auto_ding: bool = True,
    brolls: Optional[List[Dict]] = None,
    selected_bgm: Optional[str] = 'none',
    bgm_volume: int = 25,
    excluded_word_indices: Optional[List[int]] = None,
    skip_intervals: Optional[List[Dict]] = None,
    scenes: Optional[List[Dict]] = None
) -> str:
    """
    🔥 PHIÊN 3 FLAGSHIP WYSIWYG HD 9:16 RENDER ENGINE (DOM Snapshot + B-Roll + Subtitle Overlay):
    - Cắt bỏ vật lý 100% các đoạn từ thừa, khoảng lặng đã gạch bỏ trên transcript (Text-Based Video Cut).
    - Nhận diện khuôn mặt người nói & Auto-Crop 9:16 (Face Tracker).
    - Ghép chuẩn xác B-Rolls theo đúng phân đoạn thời gian và tỷ lệ hiển thị.
    - Đè ảnh Snapshot Đồ họa Thẻ Tiêu đề Hook (khớp 100% màu vàng gradient, bo góc, bóng đổ, font).
    - Đè ảnh Snapshot Logo thương hiệu với độ mờ đục (Opacity) 100% như Preview.
    - Đốt phụ đề Karaoke ASS chuẩn font, màu sắc, vị trí, preset và loại bỏ từ đã cắt.
    - Đốt Nhãn dán Chữ (Text Layers) đúng vị trí và Style.
    - Tự động / Thủ công hòa âm Sound FX & BGM Nhạc nền.
    - Xuất video Full HD chuẩn 1080x1920 siêu tốc và sắc nét tuyệt đối.
    """
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    temp_dir = BASE_DIR / "temp"
    temp_dir.mkdir(exist_ok=True)

    # 1. Tính toán các khoảng cắt vật lý (Kept Intervals)
    kept_intervals = compute_kept_intervals(start_time, end_time, words, excluded_word_indices, skip_intervals)
    total_duration = max(1.0, sum(e - s for s, e in kept_intervals))

    # 2. Face Tracker 9:16 Crop
    try:
        tracker = FaceTracker()
        crop_data = tracker.analyze_video_crop(input_path, start_time, end_time)
        crop_filter = crop_data["crop_filter"]
    except Exception as e:
        print(f"FaceTracker warning: {e}. Fallback to center crop.")
        crop_filter = "crop=ih*9/16:ih:(iw-ih*9/16)/2:0"

    # 3. Xử lý ảnh Snapshot Đồ họa (Title Card & Brand Logo)
    title_config = title_config or {}
    brand_config = brand_config or {}

    title_card_path = None
    if title_card_image:
        title_card_path = save_base64_image(
            title_card_image,
            str(temp_dir / f"title_card_{int(start_time)}.png")
        )

    brand_logo_path = None
    if brand_logo_image:
        brand_logo_path = save_base64_image(
            brand_logo_image,
            str(temp_dir / f"brand_logo_{int(start_time)}.png")
        )
    elif brand_config.get("showLogo") and brand_config.get("logoUrl") and os.path.exists(str(brand_config.get("logoUrl"))):
        brand_logo_path = str(brand_config.get("logoUrl"))

    # 4. Chuẩn bị danh sách B-Rolls với mốc thời gian ánh xạ sau khi cắt
    broll_inputs = []
    for b_idx, broll in enumerate(brolls or []):
        media_src = broll.get("fileUrl") or broll.get("imageUrl") or broll.get("videoUrl")
        local_path = prepare_broll_media(media_src, temp_dir, b_idx, start_time)
        if local_path and os.path.exists(local_path):
            is_vid = broll.get("mediaType") == "video" or local_path.lower().endswith(('.mp4', '.mov', '.webm', '.mkv'))
            raw_b_start = float(broll.get("start", 0.0))
            raw_b_end = float(broll.get("end", raw_b_start + float(broll.get("duration", 4.0))))
            
            # Ánh xạ sang mốc thời gian video sau khi cắt
            b_abs_start = raw_b_start if raw_b_start >= start_time else (start_time + raw_b_start)
            b_abs_end = raw_b_end if raw_b_end >= start_time else (start_time + raw_b_end)
            
            b_rel_start = map_time_to_cut_timeline(b_abs_start, kept_intervals)
            b_rel_end = map_time_to_cut_timeline(b_abs_end, kept_intervals)
            b_rel_end = max(b_rel_start + 0.5, b_rel_end)
            b_dur = b_rel_end - b_rel_start
            b_style = broll.get("style", "split_30_70_top")

            broll_inputs.append({
                "path": local_path,
                "is_video": is_vid,
                "start": b_rel_start,
                "end": b_rel_end,
                "dur": b_dur,
                "style": b_style,
                "trim_start": float(broll.get("videoTrimStart", 0.0))
            })

    # 5. Ánh xạ danh sách từ thoại sang video đã cắt
    clip_words = [w for w in words if w.get("start", 0) >= start_time - 0.2 and w.get("end", 0) <= end_time + 0.5]
    excluded_set = set(excluded_word_indices or [])
    mapped_words = []
    for idx, w in enumerate(clip_words):
        if idx not in excluded_set:
            new_s = map_time_to_cut_timeline(w["start"], kept_intervals)
            new_e = map_time_to_cut_timeline(w["end"], kept_intervals)
            if new_e > new_s:
                mapped_words.append({
                    "word": w["word"],
                    "start": new_s,
                    "end": new_e,
                    "score": w.get("score", 1.0)
                })

    # 6. Generate ASS Subtitles & Text Layers
    ass_path = str(temp_dir / f"subs_{int(start_time)}.ass")
    generate_ass_subtitles(
        words=mapped_words,
        start_time=0.0,
        end_time=total_duration,
        output_ass_path=ass_path,
        hook_title=hook_title,
        title_config=title_config,
        caption_config=caption_config,
        caption_preset=caption_preset,
        font_style=font_style,
        brand_config=brand_config,
        text_layers=text_layers,
        excluded_word_indices=[],
        has_title_card_image=bool(title_card_path),
        has_brand_logo_image=bool(brand_logo_path)
    )

    # Escape path for FFmpeg filter on Windows
    escaped_ass_path = ass_path.replace("\\", "/").replace(":", "\\:")

    # 7. Sound FX & BGM Audio Mixing
    keywords_times = [w["start"] for w in mapped_words if len(w["word"]) >= 5]
    audio_fx_data = build_sound_fx_audio_filter(
        clip_start_time=0.0,
        clip_end_time=total_duration,
        sound_fx_markers=sound_fx_markers or [],
        auto_whoosh=auto_whoosh,
        auto_ding=auto_ding,
        keywords_timestamps=keywords_times,
        selected_bgm=selected_bgm,
        bgm_volume=bgm_volume
    )

    # 8. Assemble FFmpeg Inputs & FilterGraph
    cmd = [
        FFMPEG_PATH, "-y",
        "-ss", str(start_time),
        "-i", input_path,
        "-t", str(end_time - start_time)
    ]

    current_input_idx = 1
    title_input_idx = None
    if title_card_path:
        cmd.extend(["-loop", "1", "-i", title_card_path])
        title_input_idx = current_input_idx
        current_input_idx += 1

    logo_input_idx = None
    if brand_logo_path:
        cmd.extend(["-loop", "1", "-i", brand_logo_path])
        logo_input_idx = current_input_idx
        current_input_idx += 1

    for b_item in broll_inputs:
        if b_item["is_video"]:
            cmd.extend(["-ss", str(b_item["trim_start"]), "-i", b_item["path"]])
        else:
            cmd.extend(["-loop", "1", "-i", b_item["path"]])
        b_item["input_idx"] = current_input_idx
        current_input_idx += 1

    fx_files = audio_fx_data.get("fx_files", [])
    fx_start_input_idx = current_input_idx
    for fx in fx_files:
        cmd.extend(["-i", fx["path"]])
        current_input_idx += 1

    # Build Complex Filter for Video and Audio
    filter_parts = []
    
    if len(kept_intervals) > 1:
        # Cắt vật lý từng phân đoạn được giữ lại
        for i, (s_i, e_i) in enumerate(kept_intervals):
            rel_s = round(s_i - start_time, 3)
            rel_e = round(e_i - start_time, 3)
            filter_parts.append(f"[0:v]trim=start={rel_s}:end={rel_e},setpts=PTS-STARTPTS[v_seg_{i}]")
            filter_parts.append(f"[0:a]atrim=start={rel_s}:end={rel_e},asetpts=PTS-STARTPTS[a_seg_{i}]")
        
        concat_inputs = "".join(f"[v_seg_{i}][a_seg_{i}]" for i in range(len(kept_intervals)))
        filter_parts.append(f"{concat_inputs}concat=n={len(kept_intervals)}:v=1:a=1[v_cut][a_cut]")
        filter_parts.append(f"[v_cut]{crop_filter},scale=1080:1920:flags=bicubic[v_base]")
        curr_v = "v_base"
        curr_a_base = "[a_cut]"
    else:
        filter_parts.append(f"[0:v]{crop_filter},scale=1080:1920:flags=bicubic[v_base]")
        curr_v = "v_base"
        curr_a_base = "[0:a]"

    # Overlay B-Rolls
    for b_item in broll_inputs:
        b_idx = b_item["input_idx"]
        b_label = f"broll_scaled_{b_idx}"
        out_v = f"v_broll_{b_idx}"
        style = b_item["style"]
        b_start = b_item["start"]
        b_end = b_item["end"]

        if style == 'split_30_70_top':
            filter_parts.append(f"[{b_idx}:v]scale=1080:576:force_original_aspect_ratio=increase,crop=1080:576[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=0:y=0:enable='between(t,{b_start},{b_end})'[{out_v}]")
        elif style == 'split_30_70_bottom':
            filter_parts.append(f"[{b_idx}:v]scale=1080:576:force_original_aspect_ratio=increase,crop=1080:576[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=0:y=1344:enable='between(t,{b_start},{b_end})'[{out_v}]")
        elif style == 'split_50_50_top':
            filter_parts.append(f"[{b_idx}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=0:y=0:enable='between(t,{b_start},{b_end})'[{out_v}]")
        elif style == 'split_50_50_bottom':
            filter_parts.append(f"[{b_idx}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=0:y=960:enable='between(t,{b_start},{b_end})'[{out_v}]")
        elif style == 'pip':
            filter_parts.append(f"[{b_idx}:v]scale=440:300:force_original_aspect_ratio=increase,crop=440:300[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=600:y=120:enable='between(t,{b_start},{b_end})'[{out_v}]")
        else: # full_cover / background
            filter_parts.append(f"[{b_idx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[{b_label}]")
            filter_parts.append(f"[{curr_v}][{b_label}]overlay=repeatlast=1:eof_action=repeat:x=0:y=0:enable='between(t,{b_start},{b_end})'[{out_v}]")

        curr_v = out_v

    # Overlay Brand Logo Snapshot (Đúng Opacity mờ đục chuẩn Preview)
    if logo_input_idx is not None:
        l_pos = brand_config.get("pos", {"x": 82, "y": 6})
        lx = max(0, min(1080, int((l_pos.get("x", 82) / 100.0) * 1080)))
        ly = max(0, min(1920, int((l_pos.get("y", 6) / 100.0) * 1920)))
        logo_opacity = max(0.1, min(1.0, float(brand_config.get("logoOpacity", 90)) / 100.0))
        filter_parts.append(f"[{logo_input_idx}:v]format=rgba,colorchannelmixer=aa={logo_opacity}[logo_opacity_stream]")
        filter_parts.append(f"[{curr_v}][logo_opacity_stream]overlay=repeatlast=1:eof_action=repeat:x={lx}-w/2:y={ly}-h/2[v_logo]")
        curr_v = "v_logo"

    # Overlay Title Card Snapshot
    if title_input_idx is not None:
        t_pos = title_config.get("pos", {"x": 50, "y": 10})
        tx = max(0, min(1080, int((t_pos.get("x", 50) / 100.0) * 1080)))
        ty = max(0, min(1920, int((t_pos.get("y", 10) / 100.0) * 1920)))
        raw_t_start = float(title_config.get("startTime", 0.0))
        raw_t_dur = float(title_config.get("duration", 6.0))
        t_abs_start = raw_t_start if raw_t_start >= start_time else (start_time + raw_t_start)
        t_abs_end = t_abs_start + raw_t_dur
        t_start = map_time_to_cut_timeline(t_abs_start, kept_intervals)
        t_end = map_time_to_cut_timeline(t_abs_end, kept_intervals)
        t_end = max(t_start + 1.0, t_end)
        filter_parts.append(f"[{curr_v}][{title_input_idx}:v]overlay=repeatlast=1:eof_action=repeat:x={tx}-w/2:y={ty}-h/2:enable='between(t,{t_start},{t_end})'[v_title]")
        curr_v = "v_title"

    # Burn Subtitles
    filter_parts.append(f"[{curr_v}]subtitles='{escaped_ass_path}'[v_out]")

    # Audio Mix
    if fx_files:
        filter_parts.append(f"{curr_a_base}volume=1.0[main_a]")
        amix_inputs = "[main_a]"
        for idx, fx in enumerate(fx_files):
            delay = fx["time_ms"]
            label = f"fx_{idx}"
            audio_idx = fx_start_input_idx + idx
            filter_parts.append(f"[{audio_idx}:a]adelay={delay}|{delay},volume=0.75[{label}]")
            amix_inputs += f"[{label}]"

        filter_parts.append(f"{amix_inputs}amix=inputs={len(fx_files)+1}:duration=first:dropout_transition=1[out_a]")
        curr_a = "[out_a]"
    else:
        filter_parts.append(f"{curr_a_base}volume=1.0[out_a]")
        curr_a = "[out_a]"

    full_filter_complex = ";".join(filter_parts)

    cmd.extend([
        "-filter_complex", full_filter_complex,
        "-map", "[v_out]",
        "-map", curr_a,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "fastdecode",
        "-threads", "0",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", str(total_duration),
        output_path
    ])

    print("Running Ultra-Fast HD Vertical Render Pipeline...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)
    if res.returncode != 0:
        err_msg = res.stderr.decode("utf-8", errors="ignore")
        print("FFmpeg Error:", err_msg)
        raise RuntimeError(f"FFmpeg HD render failed: {err_msg[-300:]}")

    return output_path

def batch_export_clips(
    video_path: str,
    clips: List[Dict],
    lossless: bool = False
) -> List[Dict]:
    results = []
    for clip in clips:
        clip_id = clip.get("id", 1)
        safe_title = f"clip_{clip_id}_{clip.get('duration', 30)}s"
        out_file = str(OUTPUT_CLIPS_DIR / f"{safe_title}.mp4")
        
        cut_video_segment(
            input_path=video_path,
            output_path=out_file,
            start_time=clip["start_time"],
            end_time=clip["end_time"],
            lossless=lossless
        )
        results.append({
            "clip_id": clip_id,
            "title": clip.get("title", f"Clip #{clip_id}"),
            "file_path": out_file,
            "duration": clip.get("duration", 0)
        })
    return results
