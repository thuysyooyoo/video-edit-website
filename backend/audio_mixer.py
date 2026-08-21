import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import List, Dict, Optional
from backend.config import BASE_DIR

SOUNDS_DIR = BASE_DIR / "backend" / "assets" / "sounds"

def build_sound_fx_audio_filter(
    clip_start_time: float,
    clip_end_time: float,
    sound_fx_markers: List[Dict],
    auto_whoosh: bool = True,
    auto_ding: bool = True,
    keywords_timestamps: Optional[List[float]] = None,
    selected_bgm: Optional[str] = 'none',
    bgm_volume: int = 25
) -> Dict:
    """
    Xây dựng chuỗi FFmpeg audio inputs và complex filtergraph để hòa âm Sound FX & BGM:
    - Auto Whoosh tại các điểm chuyển ý (đầu clip và mỗi 15-20s nếu có ngắt quãng)
    - Auto Ding/Pop tại các từ khóa nổi bật
    - Manual Sound FX markers do người dùng tự chèn
    - Background Music (BGM) loop & volume
    """
    events = []
    
    # 1. Manual Markers
    for marker in (sound_fx_markers or []):
        rel_time = marker.get("time", 0.0)
        file_name = marker.get("file", "whoosh.wav")
        events.append({"time": rel_time, "file": file_name})
        
    # 2. Auto Whoosh (at 0.2s after start)
    if auto_whoosh:
        events.append({"time": 0.2, "file": "whoosh.wav"})
        
    # 3. Auto Ding at keyword timestamps
    if auto_ding and keywords_timestamps:
        for kw_time in keywords_timestamps[:3]: # Max 3 dings per clip to avoid spam
            rel_kw = kw_time - clip_start_time
            if 0.5 <= rel_kw <= (clip_end_time - clip_start_time - 0.5):
                events.append({"time": rel_kw, "file": "ding.wav"})
                
    # Sort events by time
    events.sort(key=lambda e: e["time"])
    
    fx_files = []
    for idx, ev in enumerate(events):
        sound_path = SOUNDS_DIR / ev["file"]
        if sound_path.exists():
            fx_files.append({"index": idx + 1, "path": str(sound_path), "time_ms": int(ev["time"] * 1000)})
            
    return {
        "fx_files": fx_files,
        "has_fx": len(fx_files) > 0,
        "bgm": selected_bgm if selected_bgm != 'none' else None,
        "bgm_volume": max(0.05, min(1.0, (bgm_volume / 100.0) * 0.35))
    }
