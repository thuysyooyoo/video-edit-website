import os
import json
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import BASE_DIR, DOWNLOADS_DIR, OUTPUT_CLIPS_DIR, GEMINI_API_KEY, WHISPER_MODEL_SIZE
from backend.downloader import download_youtube_video, prepare_local_video
from backend.transcriber import Transcriber, transcribe_with_gemini, refine_transcript_with_gemini_thinking
from backend.text_cleaner import detect_filler_words_and_silence
from backend.viral_analyzer import analyze_viral_clips
from backend.video_processor import cut_video_segment, batch_export_clips, render_hd_vertical_clip
from backend.copilot_engine import CopilotEngine, AVAILABLE_MODELS

app = FastAPI(title="AI Video Editor API", version="1.0.0")

# CORS middleware for Electron / Vite React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time

RESULTS_FILE = OUTPUT_CLIPS_DIR / "pipeline_results.json"
PROJECTS_DIR = OUTPUT_CLIPS_DIR / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_INDEX_FILE = PROJECTS_DIR / "projects_index.json"

def _ensure_project_index():
    if not PROJECTS_INDEX_FILE.exists():
        index = []
        if RESULTS_FILE.exists():
            try:
                with open(RESULTS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                meta = data.get("video_metadata", {})
                title = meta.get("title", "Dự Án Đã Nạp")
                proj_id = f"proj_{int(time.time())}"
                proj_file = PROJECTS_DIR / f"{proj_id}.json"
                with open(proj_file, "w", encoding="utf-8") as pf:
                    json.dump(data, pf, ensure_ascii=False, indent=2)
                index.append({
                    "id": proj_id,
                    "title": title,
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "video_path": meta.get("video_path", ""),
                    "duration": meta.get("duration", 0),
                    "clip_count": len(data.get("viral_clips", [])),
                    "is_active": True
                })
            except Exception as e:
                print("Index migration notice:", e)
        with open(PROJECTS_INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

def _save_project_data(project_data: dict, is_active: bool = True) -> str:
    _ensure_project_index()
    meta = project_data.get("video_metadata", {})
    title = meta.get("title") or "Dự Án Video"
    safe_slug = re.sub(r'[^a-zA-Z0-9_]', '_', title)[:30]
    proj_id = f"proj_{int(time.time())}_{safe_slug}"
    
    # Lưu file dự án riêng biệt
    proj_file = PROJECTS_DIR / f"{proj_id}.json"
    with open(proj_file, "w", encoding="utf-8") as f:
        json.dump(project_data, f, ensure_ascii=False, indent=2)
        
    # Đồng thời lưu vào RESULTS_FILE để phục vụ Active Session
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(project_data, f, ensure_ascii=False, indent=2)

    # Cập nhật danh mục dự án
    try:
        with open(PROJECTS_INDEX_FILE, "r", encoding="utf-8") as f:
            index = json.load(f)
    except Exception:
        index = []

    for item in index:
        item["is_active"] = False

    index.insert(0, {
        "id": proj_id,
        "title": title,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "video_path": meta.get("video_path", ""),
        "duration": meta.get("duration", 0),
        "clip_count": len(project_data.get("viral_clips", [])),
        "is_active": True
    })

    with open(PROJECTS_INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    return proj_id

copilot_instance = CopilotEngine()

# State tracking for background video processing
current_job = {
    "status": "idle",
    "progress": 0,
    "stage": "",
    "message": "",
    "error": None
}

class ProcessRequest(BaseModel):
    input_source: str
    gemini_api_key: Optional[str] = None
    ai_engine: Optional[str] = "auto" # "auto" | "gemini" | "whisper"

class FaceTrackRequest(BaseModel):
    clip_id: Optional[int] = None
    start_time: float = 0.0
    end_time: float = 30.0
    manual_offset_x: float = 0.0

class TranscriptCutRequest(BaseModel):
    clip_id: int
    excluded_word_indices: List[int] = []
    excluded_pause_indices: List[int] = []
    custom_title: Optional[str] = None

class HdExportRequest(BaseModel):
    clip_id: int
    custom_title: Optional[str] = None
    title_card_image: Optional[str] = None
    brand_logo_image: Optional[str] = None
    title_config: Optional[Dict] = None
    caption_config: Optional[Dict] = None
    caption_preset: Optional[str] = 'hormozi'
    font_style: Optional[Dict] = None
    brand_config: Optional[Dict] = None
    text_layers: Optional[List[Dict]] = None
    sound_fx_markers: Optional[List[Dict]] = None
    auto_whoosh: bool = True
    auto_ding: bool = True
    brolls: Optional[List[Dict]] = None
    selected_bgm: Optional[str] = 'none'
    bgm_volume: int = 25
    excluded_word_indices: List[int] = []
    excluded_pause_indices: List[int] = []
    skip_intervals: Optional[List[Dict]] = None
    scenes: Optional[List[Dict]] = None

class CopilotChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict]] = []
    clip_context: Optional[Dict] = None
    model_name: Optional[str] = "gemini-3.7-flash"
    api_key: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "AI Video Editor Backend"}

def _background_run_pipeline(input_source: str, gemini_api_key: Optional[str] = None, ai_engine: Optional[str] = "auto"):
    global current_job
    try:
        current_job["status"] = "processing"
        current_job["progress"] = 10
        current_job["stage"] = "Bước 1/5: Tải / Nạp video"
        current_job["message"] = "Đang kiểm tra và nạp dữ liệu media..."
        current_job["error"] = None

        cleaned_input = input_source.strip().strip('"').strip("'")
        if cleaned_input.startswith("http://") or cleaned_input.startswith("https://"):
            video_meta = download_youtube_video(cleaned_input)
        else:
            video_meta = prepare_local_video(cleaned_input)
        
        video_path = video_meta["video_path"]

        current_job["progress"] = 25
        current_job["stage"] = "Bước 2/5: Bóc băng AI"
        current_job["message"] = "Đang chuẩn bị bóc băng lời thoại..."

        transcript_result = None

        # 🎙️ BƯỚC 2: BÓC BĂNG BẰNG FASTER-WHISPER ACOUSTIC ENGINE (100% Không dùng Gemini nghe âm thanh)
        current_job["stage"] = "Bước 2/5: Bóc băng Faster-Whisper (Chuẩn Sóng Âm)"
        current_job["message"] = "Faster-Whisper đang nhận diện giọng nói và căn thời gian từng từ theo sóng âm..."

        def whisper_progress(pct, msg):
            current_job["progress"] = pct
            current_job["stage"] = f"Bước 2/5: Bóc băng Faster-Whisper ({pct}%)"
            current_job["message"] = msg

        transcriber = Transcriber(model_size=WHISPER_MODEL_SIZE)
        transcript_result = transcriber.transcribe(video_path, progress_callback=whisper_progress)

        current_job["progress"] = 65
        current_job["stage"] = "Bước 3/5: Lọc từ thừa & khoảng lặng"
        current_job["message"] = "Đang tự động phát hiện từ ậm ờ và khoảng lặng dài..."
        clean_result = detect_filler_words_and_silence(transcript_result["words"])

        is_audio = video_meta.get("is_audio_only", False) or video_meta.get("media_type") == "audio"
        
        if is_audio:
            # 🎙️ VỚI FILE GHI ÂM / AUDIO: Giữ trọn vẹn 100% thời lượng, BỎ BƯỚC CẮT XÉN
            current_job["progress"] = 90
            current_job["stage"] = "Bước 3/3: Khởi tạo Audio Studio"
            current_job["message"] = "Đang đồng bộ toàn bộ bản ghi âm vào Studio..."
            
            total_dur = transcript_result.get("duration") or video_meta.get("duration", 60.0)
            raw_t = video_meta.get("title", "Bản Ghi Âm")
            clean_title = re.sub(r'^(audio_)', '', raw_t)
            clean_title = re.sub(r'_[a-f0-9]{8}$', '', clean_title).replace('_', ' ').strip()
            
            full_clip = {
                "id": 1,
                "title": clean_title or "Bản Ghi Âm Voiceover",
                "start_time": 0.0,
                "end_time": round(total_dur, 2),
                "duration": round(total_dur, 2),
                "hook": (transcript_result.get("full_text", "")[:70] + "..."),
                "hook_score": 98,
                "hook_grade": "A+",
                "problem": "Bản ghi âm hoàn chỉnh",
                "engagement_score": 95,
                "engagement_grade": "A+",
                "solution": "Ghép B-Roll và hòa âm đa kênh",
                "value_score": 96,
                "value_grade": "A+",
                "shareability_score": 95,
                "shareability_grade": "A+",
                "overall_score": 96,
                "summary": "Toàn bộ bản ghi âm nguyên vẹn sẵn sàng dựng video",
                "video_path": video_path,
                "scenes": [
                    {
                        "id": 1,
                        "title": "Toàn bộ bản ghi âm",
                        "start_time": 0.0,
                        "end_time": round(total_dur, 2),
                        "duration": round(total_dur, 2),
                        "summary": transcript_result.get("full_text", "")[:100]
                    }
                ]
            }
            clips = [full_clip]
            exported_files = [video_path]
            api_warning = None
        else:
            # 🎬 VỚI VIDEO: Chạy phân tích AI để trích xuất các clip ngắn viral 1-4 phút
            current_job["progress"] = 75
            current_job["stage"] = "Bước 4/5: Phân tích Hook - Problem - Solution"
            current_job["message"] = "AI đang đánh giá độ viral và cấu trúc video 1-4 phút..."
            viral_results = analyze_viral_clips(transcript_result, api_key=gemini_api_key)
            clips = viral_results.get("clips", [])
            api_warning = viral_results.get("api_warning")

            current_job["progress"] = 90
            current_job["stage"] = "Bước 5/5: Xuất video clips"
            current_job["message"] = f"Đang xuất {len(clips)} clip viral..."
            exported_files = batch_export_clips(video_path, clips, lossless=True)

        results = {
            "video_metadata": video_meta,
            "transcript": transcript_result,
            "clean_result": clean_result,
            "viral_clips": clips,
            "exported_files": exported_files,
            "api_warning": api_warning
        }
        # Lưu an toàn vào kho dự án đa video (Không bao giờ ghi đè làm mất video cũ!)
        _save_project_data(results, is_active=True)

        current_job["status"] = "completed"
        current_job["progress"] = 100
        current_job["stage"] = "Hoàn tất!"
        current_job["message"] = f"Đã trích xuất thành công {len(clips)} clip viral!"
    except Exception as e:
        import traceback
        traceback.print_exc()
        current_job["status"] = "error"
        current_job["progress"] = 0
        current_job["stage"] = "Lỗi xử lý"
        current_job["message"] = f"Quá trình xử lý bị gián đoạn: {str(e)}"
        current_job["error"] = str(e)

@app.post("/api/reset-job")
def reset_job_endpoint():
    global current_job
    current_job = {
        "status": "idle",
        "progress": 0,
        "stage": "Sẵn sàng",
        "message": "Hệ thống sẵn sàng.",
        "error": None
    }
    return {"success": True, "message": "Đã đặt lại trạng thái hệ thống."}

@app.post("/api/process")
def process_video_endpoint(req: ProcessRequest, background_tasks: BackgroundTasks):
    global current_job
    
    current_job = {
        "status": "processing",
        "progress": 5,
        "stage": "Khởi động",
        "message": "Đang khởi tạo tiến trình phân tích AI...",
        "error": None
    }
    background_tasks.add_task(_background_run_pipeline, req.input_source, req.gemini_api_key, req.ai_engine or "auto")
    return {"success": True, "message": "Đã bắt đầu tiến trình xử lý video."}

@app.post("/api/upload-audio")
async def upload_audio_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    gemini_api_key: Optional[str] = Form(None),
    ai_engine: Optional[str] = Form("auto")
):
    """
    🎙️ Tải lên file ghi âm / Podcast hoặc Voiceover trực tiếp từ máy tính / Microphone.
    AI Whisper / Gemini tự động chuyển đổi thành transcript từng từ để bắt đầu quy trình dựng video Audio-to-Video.
    """
    global current_job
    try:
        downloads_dir = BASE_DIR / "downloads"
        downloads_dir.mkdir(parents=True, exist_ok=True)
        
        orig_ext = Path(file.filename).suffix.lower() or ".mp3"
        safe_base = re.sub(r'[^\w\-_\.]', '_', Path(file.filename).stem)
        unique_id = os.urandom(4).hex()
        target_filename = f"audio_{safe_base}_{unique_id}{orig_ext}"
        target_path = downloads_dir / target_filename
        
        content = await file.read()
        with open(target_path, "wb") as f:
            f.write(content)
            
        current_job = {
            "status": "processing",
            "progress": 5,
            "stage": "Khởi động Audio",
            "message": f"Đã nạp file ghi âm: {file.filename}. Bắt đầu bóc băng kịch bản...",
            "error": None
        }
        background_tasks.add_task(_background_run_pipeline, str(target_path), gemini_api_key, ai_engine or "auto")
        return {
            "success": True,
            "message": "Đã nạp file ghi âm thành công!",
            "file_path": str(target_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import asyncio

@app.get("/api/job-status")
def get_job_status():
    return current_job

@app.get("/api/process-stream")
async def process_stream():
    """
    ⚡ PHIÊN 9: Server-Sent Events (SSE) stream realtime tiến trình bóc băng & phân tích Hook-Problem-Solution
    """
    async def event_generator():
        last_progress = -1
        while True:
            job_copy = dict(current_job)
            if job_copy["progress"] != last_progress or job_copy["status"] in ["completed", "error"]:
                last_progress = job_copy["progress"]
                yield f"data: {json.dumps(job_copy, ensure_ascii=False)}\n\n"
            if job_copy["status"] in ["completed", "error"]:
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/projects")
def list_projects_endpoint():
    """
    📂 Lấy danh sách tất cả các video / dự án đã từng nạp vào hệ thống (Không bao giờ mất video cũ).
    """
    _ensure_project_index()
    try:
        with open(PROJECTS_INDEX_FILE, "r", encoding="utf-8") as f:
            index = json.load(f)
        return {"projects": index}
    except Exception as e:
        return {"projects": []}

@app.post("/api/projects/switch/{project_id}")
def switch_project_endpoint(project_id: str):
    """
    🔄 Chuyển sang dự án video cũ để tiếp tục chỉnh sửa.
    """
    _ensure_project_index()
    proj_file = PROJECTS_DIR / f"{project_id}.json"
    if not proj_file.exists():
        raise HTTPException(status_code=404, detail=f"Không tìm thấy dự án {project_id}")

    try:
        with open(proj_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Ghi đè vào file session active
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Cập nhật is_active trong index
        with open(PROJECTS_INDEX_FILE, "r", encoding="utf-8") as f:
            index = json.load(f)

        for item in index:
            item["is_active"] = (item["id"] == project_id)

        with open(PROJECTS_INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)

        return {"success": True, "message": f"Đã chuyển sang dự án {project_id}", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects/save-current")
async def save_current_project_state(req: Request):
    """
    💾 Lưu trạng thái chỉnh sửa hiện tại (B-Roll, Subtitle, SFX) vào file dự án tương ứng.
    """
    try:
        body = await req.json()
        if not RESULTS_FILE.exists():
            raise HTTPException(status_code=404, detail="Chưa có dữ liệu session active")

        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            curr_data = json.load(f)

        # Cập nhật các trường chỉnh sửa
        if "viral_clips" in body:
            curr_data["viral_clips"] = body["viral_clips"]
        if "transcript" in body:
            curr_data["transcript"] = body["transcript"]

        # Lưu lại vào RESULTS_FILE
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(curr_data, f, ensure_ascii=False, indent=2)

        # Tìm dự án active trong index và lưu vào file dự án
        _ensure_project_index()
        with open(PROJECTS_INDEX_FILE, "r", encoding="utf-8") as f:
            index = json.load(f)

        active_proj = next((p for p in index if p.get("is_active")), None)
        if active_proj:
            proj_file = PROJECTS_DIR / f"{active_proj['id']}.json"
            with open(proj_file, "w", encoding="utf-8") as pf:
                json.dump(curr_data, pf, ensure_ascii=False, indent=2)

        return {"success": True, "message": "Đã lưu trạng thái dự án thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/copilot/models")
def get_available_copilot_models():
    """Lấy danh sách các Model AI mà người dùng có thể lựa chọn theo sở thích."""
    return {"models": AVAILABLE_MODELS}

@app.post("/api/copilot/chat")
def chat_with_copilot(req: CopilotChatRequest):
    """
    🤖 Endpoint AI Copilot Producer: Nhận lệnh tiếng Việt và trả về Action thực thi Studio.
    """
    res = copilot_instance.chat(
        user_message=req.message,
        history=req.history,
        clip_context=req.clip_context,
        model_name=req.model_name,
        api_key=req.api_key
    )
    return res

@app.get("/api/data")
def get_pipeline_data():
    """Lấy dữ liệu video, transcript và danh sách viral clips hiện tại."""
    if not RESULTS_FILE.exists():
        return {
            "has_data": False,
            "message": "Chưa có dự án nào được xử lý."
        }
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {
        "has_data": True,
        **data
    }

@app.get("/api/stream/source")
def stream_source_video(request: Request):
    """Stream video nguồn cho HTML5 video player hỗ trợ Range Requests."""
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy video")
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    video_path = data.get("video_metadata", {}).get("video_path")
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="File video gốc không tồn tại")
    
    return _range_stream_video(video_path, request)

@app.get("/api/stream/clip/{clip_id}")
def stream_clip_video(clip_id: int, request: Request):
    """Stream video của clip đã cắt."""
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu")
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    exported = data.get("exported_files", [])
    target = next((c for c in exported if c.get("clip_id") == clip_id), None)
    if not target or not os.path.exists(target["file_path"]):
        raise HTTPException(status_code=404, detail=f"Không tìm thấy clip #{clip_id}")
    
    return _range_stream_video(target["file_path"], request)

def _range_stream_video(file_path: str, request: Request):
    """Helper xử lý HTTP 206 Partial Content Range Stream cho cả Video và Audio."""
    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")
    
    ext = Path(file_path).suffix.lower()
    media_type = "audio/mpeg" if ext == ".mp3" else "audio/wav" if ext == ".wav" else "audio/mp4" if ext in [".m4a", ".aac"] else "audio/ogg" if ext == ".ogg" else "video/mp4"
    
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length, Content-Type",
    }
    
    if not range_header:
        def iter_file():
            with open(file_path, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    yield chunk
        return StreamingResponse(iter_file(), media_type=media_type, headers={"Content-Length": str(file_size), **cors_headers})
    
    range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
    if not range_match:
        raise HTTPException(status_code=416, detail="Invalid Range Header")
    
    start = int(range_match.group(1))
    end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
    content_length = (end - start) + 1
    
    def iter_range():
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = content_length
            while remaining > 0:
                chunk_size = min(1024 * 1024, remaining)
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk
                
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": media_type,
        **cors_headers
    }
    return StreamingResponse(iter_range(), status_code=206, headers=headers)

@app.post("/api/export-hd-clip")
def export_hd_vertical_video(req: HdExportRequest):
    """
    🔥 Xuất video 1080x1920 Full HD chuẩn 9:16 có Face Tracker, Phụ đề Karaoke ASS và Sound FX
    """
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu video")
        
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    video_path = data["video_metadata"]["video_path"]
    clips = data["viral_clips"]
    target_clip = next((c for c in clips if c["id"] == req.clip_id), None)
    if not target_clip:
        raise HTTPException(status_code=404, detail="Không tìm thấy clip")
        
    words = data["transcript"]["words"]
    title = req.custom_title or target_clip.get("title", f"clip_{req.clip_id}")
    safe_name = f"HD_9x16_clip_{req.clip_id}.mp4"
    out_file = str(OUTPUT_CLIPS_DIR / safe_name)

    clip_start = target_clip["start_time"]
    clip_end = target_clip["end_time"]
    if req.scenes and len(req.scenes) > 0:
        clip_start = req.scenes[0]["start_time"]
        clip_end = req.scenes[-1]["end_time"]
    
    try:
        render_hd_vertical_clip(
            input_path=video_path,
            output_path=out_file,
            start_time=clip_start,
            end_time=clip_end,
            words=words,
            hook_title=title,
            title_card_image=req.title_card_image,
            brand_logo_image=req.brand_logo_image,
            title_config=req.title_config,
            caption_config=req.caption_config,
            caption_preset=req.caption_preset,
            font_style=req.font_style,
            brand_config=req.brand_config,
            text_layers=req.text_layers,
            sound_fx_markers=req.sound_fx_markers,
            auto_whoosh=req.auto_whoosh,
            auto_ding=req.auto_ding,
            brolls=req.brolls,
            selected_bgm=req.selected_bgm,
            bgm_volume=req.bgm_volume,
            excluded_word_indices=req.excluded_word_indices,
            skip_intervals=req.skip_intervals,
            scenes=req.scenes
        )
        return {
            "success": True,
            "message": "Đã xuất video 9:16 Full HD 1080x1920 hoàn tất!",
            "file_path": out_file,
            "file_name": safe_name,
            "download_url": f"/api/download-clip/{safe_name}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/convert-webm-to-mp4")
async def convert_webm_to_mp4(
    file: UploadFile = File(...),
    custom_name: Optional[str] = Form(None)
):
    """
    ⚡ PHIÊN 1: Chuyển đổi siêu tốc video WebM (ghi từ browser canvas) sang chuẩn MP4 H.264 / AAC.
    Chuyển mã bằng libx264 với preset ultrafast để hoàn thành trong tích tắc và tối ưu dung lượng.
    """
    temp_dir = BASE_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    unique_id = os.urandom(4).hex()
    temp_webm_path = temp_dir / f"canvas_recording_{unique_id}.webm"
    
    # Ghi file WebM tải lên
    with open(temp_webm_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    safe_name = custom_name.strip() if custom_name and custom_name.strip() else f"WYSIWYG_HD_{unique_id}.mp4"
    if not safe_name.lower().endswith(".mp4"):
        safe_name += ".mp4"
    safe_name = re.sub(r'[^\w\-_\.]', '_', safe_name)
    
    out_mp4_path = OUTPUT_CLIPS_DIR / safe_name
    
    from backend.config import FFMPEG_PATH
    import subprocess
    
    # Chuyển đổi WebM sang MP4 (ultrafast H.264 + AAC 192k) Full HD giữ trọn vẹn 100% thời lượng
    cmd = [
        FFMPEG_PATH, "-y",
        "-i", str(temp_webm_path),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(out_mp4_path)
    ]
    
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        err_msg = res.stderr.decode("utf-8", errors="ignore")
        print(f"FFmpeg conversion error: {err_msg[-300:]}")
        raise HTTPException(status_code=500, detail=f"Không thể đóng gói MP4: {err_msg[-150:]}")
            
    # Dọn dẹp file tạm
    if temp_webm_path.exists():
        try:
            os.remove(temp_webm_path)
        except Exception:
            pass
            
    return {
        "success": True,
        "message": "Đã đóng gói video MP4 chuẩn Full HD thành công!",
        "file_name": safe_name,
        "file_path": str(out_mp4_path),
        "download_url": f"/api/download-clip/{safe_name}"
    }

@app.get("/api/download-clip/{file_name}")
def download_clip_file(file_name: str):
    """
    📥 PHIÊN 1: Tải trực tiếp file video từ thư mục output_clips về máy tính của người dùng.
    """
    safe_name = os.path.basename(file_name)
    target_file = OUTPUT_CLIPS_DIR / safe_name
    
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail=f"Không tìm thấy file {safe_name}")
        
    return FileResponse(
        path=str(target_file),
        filename=safe_name,
        media_type="video/mp4",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'}
    )

@app.post("/api/cut-custom-clip")
def cut_custom_clip_by_transcript(req: TranscriptCutRequest):
    """Text-based video editing cut."""
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu video")
        
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    video_path = data["video_metadata"]["video_path"]
    clips = data["viral_clips"]
    target_clip = next((c for c in clips if c["id"] == req.clip_id), None)
    if not target_clip:
        raise HTTPException(status_code=404, detail="Không tìm thấy clip gốc")
        
    all_words = data["transcript"]["words"]
    clip_words = [w for w in all_words if target_clip["start_time"] <= w["start"] and w["end"] <= target_clip["end_time"]]
    remaining_words = [w for idx, w in enumerate(clip_words) if idx not in req.excluded_word_indices]
    
    if not remaining_words:
        raise HTTPException(status_code=400, detail="Không thể xóa toàn bộ lời thoại của clip")
        
    keep_segments = []
    curr_seg = {"start": remaining_words[0]["start"], "end": remaining_words[0]["end"]}
    
    for i in range(1, len(remaining_words)):
        w = remaining_words[i]
        if w["start"] - curr_seg["end"] <= 0.25:
            curr_seg["end"] = w["end"]
        else:
            keep_segments.append(curr_seg)
            curr_seg = {"start": w["start"], "end": w["end"]}
    keep_segments.append(curr_seg)
    
    safe_title = f"custom_clip_{req.clip_id}"
    out_file = str(OUTPUT_CLIPS_DIR / f"{safe_title}.mp4")
    
    if len(keep_segments) == 1:
        cut_video_segment(video_path, out_file, keep_segments[0]["start"], keep_segments[0]["end"] + 0.3, lossless=False)
    else:
        temp_cut_files = []
        temp_dir = BASE_DIR / "temp"
        temp_dir.mkdir(exist_ok=True)
        
        for idx, seg in enumerate(keep_segments):
            seg_file = str(temp_dir / f"temp_seg_{idx}.mp4")
            cut_video_segment(video_path, seg_file, seg["start"], seg["end"], lossless=False)
            temp_cut_files.append(seg_file)
            
        concat_list_path = str(temp_dir / "concat_list.txt")
        with open(concat_list_path, "w", encoding="utf-8") as f:
            for seg_file in temp_cut_files:
                f.write(f"file '{seg_file}'\n")
                
        from backend.config import FFMPEG_PATH
        import subprocess
        cmd = [
            FFMPEG_PATH, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list_path,
            "-c", "copy",
            out_file
        ]
        subprocess.run(cmd, check=True)
        
    return {
        "success": True,
        "message": "Đã cắt và render video loại bỏ từ thừa & khoảng lặng thành công!",
        "file_path": out_file,
        "segments_count": len(keep_segments)
    }

# Mount static sound assets and user uploaded media assets
SOUNDS_DIR = BASE_DIR / "backend" / "assets" / "sounds"
if SOUNDS_DIR.exists():
    app.mount("/assets/sounds", StaticFiles(directory=str(SOUNDS_DIR)), name="sounds")

UPLOADS_DIR = BASE_DIR / "backend" / "assets" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/assets/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.post("/api/upload-media")
async def upload_custom_media(file: UploadFile = File(...)):
    """
    📁 Tải lên file B-Roll ảnh/video hoặc Logo thương hiệu để lưu trữ vĩnh viễn trên máy chủ.
    """
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    clean_name = re.sub(r'[^\w\-_]', '_', Path(file.filename).stem)[:40]
    unique_name = f"{clean_name}_{int(time.time())}{ext}"
    target_path = UPLOADS_DIR / unique_name
    
    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    is_video = ext in [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v"]
    is_audio = ext in [".mp3", ".wav", ".m4a", ".aac", ".ogg"]
    media_type = "video" if is_video else "audio" if is_audio else "image"
    
    return {
        "success": True,
        "filename": unique_name,
        "file_url": f"http://127.0.0.1:8000/assets/uploads/{unique_name}",
        "media_type": media_type
    }

class SaveDraftRequest(BaseModel):
    clip_id: Optional[int] = 1
    custom_title: Optional[str] = None
    transcript_words: Optional[List[Dict]] = None
    scenes: Optional[List[Dict]] = None
    brolls: Optional[List[Dict]] = None
    text_layers: Optional[List[Dict]] = None
    animated_stickers: Optional[List[Dict]] = None
    sound_fx_markers: Optional[List[Dict]] = None
    title_config: Optional[Dict] = None
    caption_config: Optional[Dict] = None
    brand_config: Optional[Dict] = None
    font_style: Optional[Dict] = None
    caption_preset: Optional[str] = None
    caption_effect: Optional[str] = None
    excluded_word_indices: Optional[List[int]] = None
    excluded_pause_indices: Optional[List[int]] = None
    aspect_ratio: Optional[str] = None
    video_layout: Optional[str] = None
    speech_enhance: Optional[bool] = None

@app.post("/api/save-draft")
def save_project_draft(req: SaveDraftRequest):
    """
    💾 Lưu Tạm Toàn Bộ Dự Án (Split scenes, B-Roll tải lên, Logo, Chữ, Phụ đề, Sound FX) vào ổ cứng máy chủ.
    """
    if not RESULTS_FILE.exists():
        return {"success": False, "message": "Chưa có dự án nào"}
    
    try:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        clips = data.get("viral_clips", [])
        target_clip = next((c for c in clips if c["id"] == req.clip_id), (clips[0] if clips else None))
        if target_clip:
            if req.custom_title:
                target_clip["title"] = req.custom_title
            if req.scenes:
                target_clip["scenes"] = req.scenes
            if req.brolls is not None:
                target_clip["brolls"] = req.brolls
            if req.sound_fx_markers is not None:
                target_clip["sound_fx_markers"] = req.sound_fx_markers
                
        if req.transcript_words and "transcript" in data:
            data["transcript"]["words"] = req.transcript_words
            
        data["editor_state"] = req.dict(exclude_none=True)
        
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return {"success": True, "message": "Đã lưu tạm dự án vào máy chủ an toàn"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/track-face")
def track_face_endpoint(req: FaceTrackRequest):
    """
    🎯 PHIÊN 7: Quét tọa độ khuôn mặt người nói và tính toán vị trí crop 9:16
    """
    if not RESULTS_FILE.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu video")
        
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    video_path = data["video_metadata"]["video_path"]
    from backend.face_tracker import SmartFaceTracker
    tracker = SmartFaceTracker()
    result = tracker.analyze_video_crop(
        video_path=video_path,
        start_time=req.start_time,
        end_time=req.end_time,
        manual_offset_x=req.manual_offset_x
    )
    return result

# Mount static React Frontend build directly
DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists() and (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        return FileResponse(
            str(DIST_DIR / "index.html"),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
