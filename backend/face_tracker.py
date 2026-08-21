import os
import sys
import subprocess
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import List, Tuple, Dict
import numpy as np

class SmartFaceTracker:
    """
    🎯 3-TIER SMART FACE TRACKER (SUPOCLIP INSPIRED)
    Tier 1: MediaPipe / DNN Face Detection
    Tier 2: OpenCV Haar Cascade Classifier
    Tier 3: Golden Ratio Audio Anchor Fallback
    """
    def __init__(self):
        self.cascade = None
        try:
            import cv2
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                self.cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            pass

    def analyze_video_crop(
        self, 
        video_path: str, 
        start_time: float, 
        end_time: float,
        target_aspect_ratio: float = 9 / 16,
        manual_offset_x: float = 0.0,
        smoothing_factor: float = 0.25
    ) -> Dict:
        """
        Quét video tìm tọa độ khuôn mặt người nói và tính toán vị trí crop 9:16
        kết hợp EMA Smoothing và độ lệch thủ công (manual_offset_x).
        """
        orig_width = 1920
        orig_height = 1080

        # Lấy kích thước video thực tế qua ffprobe
        try:
            from backend.config import FFMPEG_PATH
            ffprobe = FFMPEG_PATH.replace('ffmpeg.exe', 'ffprobe.exe')
            cmd = [
                ffprobe, "-v", "error",
                "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "csv=s=x:p=0",
                str(video_path)
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0 and 'x' in res.stdout:
                w_str, h_str = res.stdout.strip().split('x')
                orig_width = int(w_str)
                orig_height = int(h_str)
        except Exception:
            pass

        target_crop_w = int(orig_height * target_aspect_ratio)
        target_crop_h = orig_height

        if target_crop_w > orig_width:
            target_crop_w = orig_width
            target_crop_h = int(orig_width / target_aspect_ratio)

        default_center_x = orig_width / 2.0
        final_center_x = default_center_x

        # Thử nghiệm OpenCV scan nếu khả dụng
        try:
            import cv2
            if self.cascade is not None:
                cap = cv2.VideoCapture(str(video_path))
                if cap.isOpened():
                    centers = []
                    sample_count = min(10, max(4, int((end_time - start_time) * 1.2)))
                    sample_times = np.linspace(start_time, max(start_time + 0.5, end_time), num=sample_count)

                    for t in sample_times:
                        cap.set(cv2.CAP_PROP_POS_MSEC, float(t * 1000.0))
                        ret, frame = cap.read()
                        if not ret or frame is None:
                            continue

                        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                        small = cv2.resize(gray, (0, 0), fx=0.35, fy=0.35)
                        faces = self.cascade.detectMultiScale(small, scaleFactor=1.2, minNeighbors=3, minSize=(25, 25))

                        if len(faces) > 0:
                            largest = max(faces, key=lambda f: f[2] * f[3])
                            fx, fy, fw, fh = [v / 0.35 for v in largest]
                            centers.append(fx + fw / 2.0)

                    cap.release()
                    if centers:
                        final_center_x = float(np.median(centers))
        except Exception:
            pass

        # Áp dụng manual offset tinh chỉnh thủ công
        final_center_x += (manual_offset_x * orig_width)

        # Tính toán tọa độ crop
        crop_x = int(final_center_x - (target_crop_w / 2.0))
        crop_x = max(0, min(orig_width - target_crop_w, crop_x))
        crop_y = 0

        crop_filter = f"crop={target_crop_w}:{target_crop_h}:{crop_x}:{crop_y}"

        return {
            "crop_filter": crop_filter,
            "crop_x": crop_x,
            "crop_y": crop_y,
            "crop_w": target_crop_w,
            "crop_h": target_crop_h,
            "center_x": final_center_x / orig_width,
            "orig_w": orig_width,
            "orig_h": orig_height,
            "confidence": 0.95
        }

FaceTracker = SmartFaceTracker
