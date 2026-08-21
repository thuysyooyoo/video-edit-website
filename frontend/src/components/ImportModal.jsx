import React, { useState, useEffect } from 'react';
import { X, Video, HardDrive, Sparkles, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ImportModal({ isOpen, onClose, onProcessCompleted }) {
  const [sourceType, setSourceType] = useState('youtube'); // 'youtube' | 'local'
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=UImo1FhNuVQ');
  const [localPath, setLocalPath] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);

  // Poll job status when processing
  useEffect(() => {
    let interval = null;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/job-status');
          const data = await res.json();
          setJobStatus(data);

          if (data.status === 'completed') {
            setIsProcessing(false);
            clearInterval(interval);
            onProcessCompleted();
          } else if (data.status === 'error') {
            setIsProcessing(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isOpen) return null;

  const handleStartProcess = async () => {
    const input = sourceType === 'youtube' ? youtubeUrl : localPath;
    if (!input) return;

    setIsProcessing(true);
    setJobStatus({ status: 'processing', progress: 5, stage: 'Đang chuẩn bị...', message: 'Khởi động AI Engine...' });

    try {
      const res = await fetch('http://127.0.0.1:8000/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_source: input,
          gemini_api_key: apiKey || undefined
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        setJobStatus({ status: 'error', error: errData.detail || "Không thể khởi động tác vụ." });
        setIsProcessing(false);
      }
    } catch (err) {
      setJobStatus({ status: 'error', error: `Lỗi kết nối máy chủ: ${err.message}` });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-dark-900 border border-dark-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-glow" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Tạo Clip Viral Tự Động</h2>
              <p className="text-xs text-slate-400">Nhập video dài để AI tự động tìm & cắt clip 9:16 đắt giá nhất</p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Source Tabs */}
          {!isProcessing && (
            <>
              <div className="grid grid-cols-2 gap-2 bg-dark-950 p-1.5 rounded-2xl border border-dark-800">
                <button
                  onClick={() => setSourceType('youtube')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    sourceType === 'youtube'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-dark-850'
                  }`}
                >
                  <Video className="w-4 h-4 text-red-400" />
                  <span>Dán Link YouTube</span>
                </button>

                <button
                  onClick={() => setSourceType('local')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    sourceType === 'local'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-dark-850'
                  }`}
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>File Từ Máy Tính</span>
                </button>
              </div>

              {/* Input field */}
              {sourceType === 'youtube' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Đường dẫn YouTube URL:
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Đường dẫn file video trên máy (.mp4, .mov, .mkv):
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="D:\Videos\my_long_video.mp4"
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors font-mono"
                  />
                </div>
              )}

              {/* Optional Gemini Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Gemini API Key (Tùy chọn nếu đã lưu trong .env):</span>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand-glow hover:underline"
                  >
                    Lấy key miễn phí
                  </a>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Real-time Progress Bar & Stepper */}
          {isProcessing && jobStatus && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-500/20 border border-brand-500/40 mx-auto flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Loader2 className="w-7 h-7 text-brand-glow animate-spin" />
              </div>

              <div>
                <h3 className="font-bold text-white text-base">{jobStatus.stage}</h3>
                <p className="text-xs text-slate-400 mt-1">{jobStatus.message}</p>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-dark-950 rounded-full h-2.5 border border-dark-700 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>

              <span className="text-xs font-mono text-slate-400 font-bold">
                {jobStatus.progress}%
              </span>
            </div>
          )}

          {/* Error Message */}
          {jobStatus?.status === 'error' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{jobStatus.error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isProcessing && (
          <div className="p-6 border-t border-dark-700 bg-dark-950 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Hủy
            </button>

            <button
              onClick={handleStartProcess}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt Đầu Xử Lý AI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
