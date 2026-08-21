import argparse
import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.downloader import download_youtube_video, prepare_local_video
from backend.transcriber import Transcriber
from backend.text_cleaner import detect_filler_words_and_silence
from backend.viral_analyzer import analyze_viral_clips
from backend.video_processor import batch_export_clips
from backend.config import OUTPUT_CLIPS_DIR


def run_pipeline(video_input: str, gemini_api_key: str = None):
    print("=" * 60, flush=True)
    print("🚀 AI VIDEO EDITOR PIPELINE (OPUS CLIP CLONE)", flush=True)
    print("=" * 60, flush=True)

    # ── Step 1: Download or load video ──────────────────────────
    if video_input.startswith("http://") or video_input.startswith("https://"):
        print(f"\n[Bước 1/5] Tải video từ YouTube URL: {video_input}", flush=True)
        video_meta = download_youtube_video(video_input)
    else:
        print(f"\n[Bước 1/5] Nạp file video cục bộ: {video_input}", flush=True)
        video_meta = prepare_local_video(video_input)

    video_path = video_meta["video_path"]
    print(f"-> Video sẵn sàng tại: {video_path}", flush=True)

    # ── Step 2: Speech-to-Text ──────────────────────────────────
    print("\n[Bước 2/5] Đang bóc băng lời thoại bằng Faster-Whisper...", flush=True)
    transcriber = Transcriber(model_size="small")
    transcript_result = transcriber.transcribe(video_path)

    n_segments = len(transcript_result['segments'])
    n_words = len(transcript_result['words'])
    duration = transcript_result.get('duration', 0)
    print(f"-> Hoàn tất! {n_segments} phân đoạn, {n_words} từ, "
          f"thời lượng: {duration:.0f}s", flush=True)

    # ── Step 3: Filter filler words & silence ───────────────────
    print("\n[Bước 3/5] Đang lọc từ ậm ờ (à, ừm...) & khoảng lặng...", flush=True)
    clean_result = detect_filler_words_and_silence(transcript_result["words"])

    # ── Step 4: AI Viral Analysis (Hook-Problem-Solution) ───────
    print("\n[Bước 4/5] Đang phân tích Clip Viral (Hook → Problem → Solution)...", flush=True)
    viral_results = analyze_viral_clips(transcript_result, api_key=gemini_api_key)

    clips = viral_results.get("clips", [])
    print(f"\n🎯 DANH SÁCH {len(clips)} CLIP VIRAL CHẤT LƯỢNG CAO:", flush=True)
    print("-" * 60, flush=True)
    for c in clips:
        print(f"\n  📹 Clip #{c.get('id')} — Score: {c.get('hook_score')}/100 | "
              f"{c.get('duration')}s ({c.get('start_time')}s → {c.get('end_time')}s)",
              flush=True)
        print(f"     Tiêu đề: {c.get('title')}", flush=True)
        if c.get('hook') and c['hook'] != "(Cần Gemini API để phân tích)":
            print(f"     🪝 Hook: {c.get('hook')}", flush=True)
            print(f"     ❗ Problem: {c.get('problem')}", flush=True)
            print(f"     ✅ Solution: {c.get('solution')}", flush=True)
        print(f"     Tóm tắt: {c.get('summary')}", flush=True)

    # ── Step 5: Export clips (lossless quality) ─────────────────
    print(f"\n[Bước 5/5] Xuất {len(clips)} clip (giữ nguyên chất lượng gốc)...",
          flush=True)
    exported_files = batch_export_clips(video_path, clips, lossless=True)

    print("\n" + "=" * 60, flush=True)
    print("✅ XUẤT THÀNH CÔNG!", flush=True)
    print("=" * 60, flush=True)
    for f in exported_files:
        print(f"  🎬 Clip #{f['clip_id']} ({f['hook_score']} điểm): {f['file_path']}",
              flush=True)

    print(f"\n📂 Thư mục output: {OUTPUT_CLIPS_DIR}", flush=True)

    # Save pipeline results as JSON for later use by the UI
    results = {
        "video_metadata": video_meta,
        "transcript": transcript_result,
        "clean_result": clean_result,
        "viral_clips": clips,
        "exported_files": exported_files
    }
    results_path = OUTPUT_CLIPS_DIR / "pipeline_results.json"
    with open(results_path, "w", encoding="utf-8") as fp:
        json.dump(results, fp, ensure_ascii=False, indent=2)
    print(f"💾 Kết quả pipeline đã lưu tại: {results_path}", flush=True)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Video Editor CLI Pipeline")
    parser.add_argument("--input", type=str, required=True,
                        help="Đường dẫn file video local hoặc Link YouTube")
    parser.add_argument("--api-key", type=str, default=None,
                        help="Gemini API Key (khuyến nghị dùng để có kết quả tốt nhất)")

    args = parser.parse_args()
    run_pipeline(args.input, gemini_api_key=args.api_key)
