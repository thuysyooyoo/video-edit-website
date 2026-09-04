import os
import yt_dlp
from pathlib import Path
from backend.config import DOWNLOADS_DIR, FFMPEG_DIR


def download_youtube_video(url: str, output_dir: Path = DOWNLOADS_DIR,
                           cookies_browser: str = None) -> dict:
    """
    Download video from YouTube URL at the highest available quality.
    
    Strategy:
    1. If cookies_browser specified (e.g. 'chrome'): use logged-in session for full HD.
    2. Try tv_embedded client for 1080p separate streams + FFmpeg merge.
    3. Fallback to android client for best available combined stream.
    
    Args:
        cookies_browser: Browser name to extract cookies from (e.g. 'chrome', 'edge', 'firefox').
                         This enables downloading videos that require authentication or are
                         restricted to logged-in users, and often unlocks higher quality formats.
    """
    output_template = str(output_dir / "%(id)s_%(title)s.%(ext)s")
    
    base_opts = {
        'outtmpl': output_template,
        'quiet': False,
        'no_warnings': True,
        'overwrites': True,
        'ffmpeg_location': FFMPEG_DIR,
        'merge_output_format': 'mp4',
    }
    
    # ── Attempt 1: With browser cookies (authenticated, full quality) ──
    if cookies_browser:
        ydl_opts = {
            **base_opts,
            'format': (
                'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/'
                'bestvideo[height<=1080]+bestaudio/'
                'best[ext=mp4]/best'
            ),
            'cookiesfrombrowser': (cookies_browser,),
        }
        print(f"[Downloader] Tải HD (cookies từ {cookies_browser}): {url}", flush=True)
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return _extract_and_return(ydl, url, output_dir)
        except Exception as e:
            print(f"[Downloader] ⚠️ Cookie auth thất bại ({e}). Thử cách khác...", flush=True)
    
    # ── Attempt 2: tv_embedded client (1080p without auth) ──
    ydl_opts = {
        **base_opts,
        'format': (
            '299+140/298+140/137+140/136+140/'
            '303+251/302+251/'
            'bestvideo[height<=1080]+bestaudio/'
            'best'
        ),
        'extractor_args': {'youtube': {'player_client': ['tv_embedded']}},
    }
    print(f"[Downloader] Tải video từ YouTube (thử HD 1080p): {url}", flush=True)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return _extract_and_return(ydl, url, output_dir)
    except Exception as e:
        print(f"[Downloader] ⚠️ HD không tải được ({e}). Dùng phương án dự phòng...", flush=True)
    
    # ── Attempt 3: android/ios fallback (best combined, may be 360p) ──
    ydl_opts = {
        **base_opts,
        'format': 'best[ext=mp4]/best',
        'extractor_args': {'youtube': {'player_client': ['android', 'ios']}},
    }
    print(f"[Downloader] Tải với phương án dự phòng (Android client)...", flush=True)
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = _extract_and_return(ydl, url, output_dir)
        height = result.get('height', 0)
        if isinstance(height, int) and height < 720:
            print(f"[Downloader] ⚠️ Chỉ tải được {height}p. Video này bị giới hạn chất lượng trên YouTube.", flush=True)
            print(f"[Downloader] 💡 Gợi ý: Dùng file video gốc từ máy tính để có chất lượng Full HD.", flush=True)
        return result


def _extract_and_return(ydl, url, output_dir):
    """Helper: extract info, download, and return metadata dict."""
    info = ydl.extract_info(url, download=True)
    filename = ydl.prepare_filename(info)
    
    if not os.path.exists(filename):
        video_id = info.get('id', '')
        for f in output_dir.iterdir():
            if video_id in f.name and f.suffix in ('.mp4', '.mkv', '.webm'):
                filename = str(f)
                break
    
    width = info.get('width', '?')
    height = info.get('height', '?')
    vcodec = info.get('vcodec', '?')
    fps = info.get('fps', '?')
    print(f"[Downloader] ✅ Tải thành công! Chất lượng: {width}x{height} @ {fps}fps, "
          f"Codec: {vcodec}", flush=True)
    
    return {
        "title": info.get("title", "Untitled"),
        "duration": info.get("duration", 0),
        "video_path": filename,
        "id": info.get("id", ""),
        "author": info.get("uploader", "Unknown"),
        "width": width,
        "height": height,
    }


def prepare_local_video(file_path: str) -> dict:
    """
    Validate local video/audio file and extract basic info and duration.
    """
    cleaned = file_path.strip().strip('"').strip("'")
    path = Path(cleaned)
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy file tại: {cleaned}")

    ext = path.suffix.lower()
    audio_extensions = {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma', '.opus'}
    is_audio = ext in audio_extensions

    duration = 0.0
    try:
        import subprocess
        import os
        from backend.config import FFMPEG_PATH, DOWNLOADS_DIR
        
        # ⚡ Tự động chuẩn hóa video về tốc độ khung hình cố định (CFR - 30fps)
        # Khắc phục triệt để lỗi lệch nhịp A/V (A/V Sync Drift) ở cuối các video dài quay bằng điện thoại/OBS
        if not is_audio:
            # 🧹 Dọn dẹp các file cfr_* cũ hơn 12 tiếng để tránh tích tụ file rác
            try:
                import time
                now_ts = time.time()
                for old_f in DOWNLOADS_DIR.glob("cfr_*"):
                    if old_f.is_file() and (now_ts - old_f.stat().st_mtime) > 12 * 3600:
                        try:
                            old_f.unlink()
                        except Exception:
                            pass
            except Exception:
                pass

            cfr_path = DOWNLOADS_DIR / f"cfr_{os.urandom(4).hex()}_{path.name}"
            print(f"\n[Downloader] ⚙️ Đang chuẩn hóa video về Constant Frame Rate (CFR 30fps) để chống lệch nhịp (Quá trình này chạy ngầm siêu tốc)...", flush=True)
            try:
                cmd = [
                    FFMPEG_PATH, "-y", "-i", str(path.resolve()),
                    "-vsync", "cfr", "-r", "30",
                    "-c:v", "libx264", "-crf", "23", "-preset", "ultrafast",
                    "-c:a", "copy",
                    str(cfr_path)
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                path = cfr_path
                print(f"[Downloader] ✅ Chuẩn hóa CFR thành công: {path.name}", flush=True)
            except Exception as e:
                print(f"[Downloader] ⚠️ Lỗi chuẩn hóa CFR ({e}). Bỏ qua, tiếp tục dùng video gốc.", flush=True)

        # Use ffprobe/ffmpeg to get duration
        cmd = [
            FFMPEG_PATH, "-i", str(path.resolve())
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="ignore")
        import re
        dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", res.stderr)
        if dur_match:
            hours, mins, secs = dur_match.groups()
            duration = int(hours) * 3600 + int(mins) * 60 + float(secs)
    except Exception as e:
        print(f"[Downloader] Could not extract duration: {e}")

    return {
        "title": path.stem,
        "duration": duration,
        "video_path": str(path.resolve()),
        "id": path.stem,
        "author": "File Ghi Âm" if is_audio else "Local File",
        "is_audio_only": is_audio,
        "media_type": "audio" if is_audio else "video"
    }
