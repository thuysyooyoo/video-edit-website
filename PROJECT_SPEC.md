# THÔNG TIN VÀ YÊU CẦU DỰ ÁN: AI VIDEO EDITOR (OPUS CLIP CLONE)

## 📌 Tổng Quan Dự Án
Ứng dụng Desktop chuyên dụng để tự động cắt ghép, tạo các video clip ngắn chuẩn 9:16 (TikTok / YouTube Shorts / Facebook Reels) từ các video dài (Podcast, vlogs, phỏng vấn, bài giảng...). Ứng dụng tích hợp trí tuệ nhân tạo (AI) để tự động hóa toàn bộ quá trình biên tập.

---

## 🛠️ Công Nghệ Phát Triển
* **Giao diện Desktop (Frontend):** Electron + React.js + Tailwind CSS + Lucide Icons (Giao diện chuẩn Dark Theme hiện đại tương tự Opus Clip / CapCut).
* **Động cơ AI & Xử lý Video (Backend Sidecar):** Python 3.10+
  * **Tải Video YouTube:** `yt-dlp`
  * **Bóc băng tiếng ra chữ (STT):** `faster-whisper` (Local AI offline, miễn phí, chính xác từng từ).
  * **Lọc từ thừa & Khoảng lặng:** Python Slicer Engine (Cắt bỏ các từ `ậm ờ`, `à`, `ừm`, `uh`, `um` và các khoảng lặng không cần thiết).
  * **Phân tích Viral & Highlights:** Google Gemini Flash API (Phân tích kịch bản, chấm điểm Hook Score, gợi ý tiêu đề & tóm tắt).
  * **Căn giữa khung hình 9:16:** `OpenCV` / `MediaPipe` (Tự động nhận diện khuôn mặt người đang nói).
  * **Biên tập & Render Video:** `FFmpeg` (Ghép clip, gắn phụ đề Karaoke nhảy chữ, chèn hiệu ứng âm thanh & B-roll).

---

## 📋 Quyết Định Kỹ Thuật & Yêu Cầu Tính Năng

### 1. Nguồn Video Đầu Vào
* **File Cục Bộ:** Kéo thả các file video `.mp4`, `.mov`, `.mkv` từ máy tính.
* **Link YouTube:** Dán đường dẫn video YouTube để hệ thống tự tải về và xử lý.

### 2. Biên Tập Video Bằng Lời Thoại (Transcript-Based Video Editing)
* Bóc băng lời thoại chính xác đến từng từ kèm timestamp.
* Tự động xóa từ ậm ờ và khoảng lặng kéo dài.
* Cho phép chỉnh sửa chữ trong văn bản, khi người dùng xóa từ/dòng nào thì đoạn video tương ứng tự động cắt theo.

### 3. Đánh Giá Điểm Viral & Trích Xuất Clip Dài Thành Ngắn
* AI tự động cắt video dài thành nhiều Clip ngắn đắt giá (15s - 60s).
* Chấm điểm **Hook Score** (độ thu hút 3 giây đầu), giải thích lý do gợi ý và đặt tiêu đề thu hút cho từng clip.

### 4. Bố Cục Video 9:16 (Layouts)
* **Auto Speaker Focus:** Tự động crop 9:16 tập trung vào gương mặt người nói.
* **Split Screen:** Màn hình chia đôi (Nửa trên người nói, nửa dưới video phụ/B-roll).

### 5. Phụ Đề Karaoke & Hiệu Ứng
* Phụ đề động Karaoke (nhảy từng từ) với hiệu ứng sáng màu + tự động chèn Emoji ngữ cảnh.
* Tự động chèn hiệu ứng âm thanh (Sound FX: Whoosh, Pop, Ding) khi chuyển cảnh.
* Tự động gợi ý & chèn hình ảnh/video B-roll minh họa câu thoại.

---

## 🚀 Lộ Trình 4 Phiên Làm Việc (Phases)
1. **Phiên 1:** Xây dựng lõi Python AI Engine (Tải video, Faster-Whisper, Gemini Viral Analysis, FFmpeg Base Engine).
2. **Phiên 2:** Thiết kế Giao diện Electron + React và xây dựng Trình biên tập Lời thoại (Transcript-Based Editor).
3. **Phiên 3:** Tích hợp Auto Speaker Crop 9:16, Subtitle Karaoke Styling, Sound FX & Batch Export.
4. **Phiên 4:** Kiểm thử toàn diện end-to-end, tối ưu hiệu năng và định hướng mở rộng AI Chat Copilot (Opus Producer).
