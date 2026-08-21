import React, { useState, useEffect } from 'react';
import { Scissors, Trash2, RotateCcw, Sparkles, Check, Play, FileText, Download } from 'lucide-react';

const COMMON_FILLERS = [
  'à', 'ừm', 'ừ', 'ờ', 'hả', 'kiểu như', 'ý là', 'thì là', 'như là',
  'uh', 'um', 'uhh', 'umm', 'like', 'basically', 'actually'
];

export default function TranscriptEditor({ clip, words = [], currentTime, onSeekWord }) {
  const [excludedIndices, setExcludedIndices] = useState(new Set());
  const [isRendering, setIsRendering] = useState(false);
  const [renderMessage, setRenderMessage] = useState(null);

  // Filter words belonging to current clip
  const clipWords = words.filter(
    w => clip && w.start >= clip.start_time - 0.2 && w.end <= clip.end_time + 0.5
  );

  // Reset exclusions when clip changes
  useEffect(() => {
    setExcludedIndices(new Set());
    setRenderMessage(null);
  }, [clip]);

  // Toggle single word exclusion
  const toggleWord = (index) => {
    const next = new Set(excludedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExcludedIndices(next);
  };

  // 1-Click: Auto remove all filler words
  const handleAutoCutFillers = () => {
    const next = new Set(excludedIndices);
    clipWords.forEach((w, idx) => {
      const clean = w.word.toLowerCase().replace(/[.,!?\"']/g, '').trim();
      if (COMMON_FILLERS.includes(clean)) {
        next.add(idx);
      }
    });
    setExcludedIndices(next);
  };

  // Reset
  const handleReset = () => {
    setExcludedIndices(new Set());
    setRenderMessage(null);
  };

  // Calculate new duration after word deletions
  const keptWords = clipWords.filter((_, idx) => !excludedIndices.has(idx));
  const estimatedDuration = keptWords.length > 0
    ? (keptWords[keptWords.length - 1].end - keptWords[0].start).toFixed(1)
    : 0;
  const cutDuration = (clip ? (clip.duration - estimatedDuration) : 0).toFixed(1);

  // Apply cuts and call Backend to render custom clip
  const handleApplyCuts = async () => {
    if (!clip || excludedIndices.size === 0) return;
    setIsRendering(true);
    setRenderMessage(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/cut-custom-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clip.id,
          excluded_word_indices: Array.from(excludedIndices)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRenderMessage({ type: 'success', text: `✅ Đã render clip mới thành công! (Lưu tại: ${data.file_path})` });
      } else {
        setRenderMessage({ type: 'error', text: `❌ Lỗi: ${data.detail || "Không thể render"}` });
      }
    } catch (err) {
      setRenderMessage({ type: 'error', text: `❌ Lỗi kết nối backend: ${err.message}` });
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-700/80 p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dark-700/80">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-glow" />
            <h2 className="font-bold text-white text-base">Text-Based Video Editor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click vào từ để nhảy video, hoặc <strong className="text-rose-400">click để xóa từ = cắt video tự động</strong>
          </p>
        </div>

        {/* Duration badge */}
        <div className="flex items-center gap-2 text-xs bg-dark-800 px-3 py-1.5 rounded-xl border border-dark-700">
          <span className="text-slate-400">Thời lượng:</span>
          <strong className="text-white">{estimatedDuration}s</strong>
          {excludedIndices.size > 0 && (
            <span className="text-rose-400 font-semibold text-[11px]">
              (-{cutDuration}s đã cắt)
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex items-center gap-2 my-3">
        <button
          onClick={handleAutoCutFillers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Tự Động Xóa Từ Âm Ờ (à, ừm...)</span>
        </button>

        {excludedIndices.size > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white text-xs font-medium border border-dark-700 transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục</span>
          </button>
        )}
      </div>

      {/* Interactive Transcript Words Area */}
      <div className="flex-1 overflow-y-auto pr-2 py-2 bg-dark-950/60 p-4 rounded-2xl border border-dark-700/60 leading-loose text-sm select-none">
        {clipWords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Chưa có lời thoại cho đoạn này.
          </div>
        ) : (
          clipWords.map((w, idx) => {
            const isExcluded = excludedIndices.has(idx);
            const isCurrent = currentTime >= w.start && currentTime <= w.end;

            return (
              <span
                key={idx}
                onClick={() => toggleWord(idx)}
                onDoubleClick={() => onSeekWord(w.start)}
                title={`[${w.start.toFixed(1)}s - ${w.end.toFixed(1)}s] Double click: Nhảy video | 1 Click: Xóa/Khôi phục`}
                className={`inline-block px-1 py-0.5 mx-0.5 my-1 rounded-md cursor-pointer transition-all duration-75 text-sm font-medium ${
                  isExcluded
                    ? 'word-excluded opacity-30 line-through bg-rose-500/10 text-rose-400'
                    : isCurrent
                    ? 'bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/50 font-bold scale-105 shadow-sm'
                    : 'text-slate-200 hover:bg-brand-500/20 hover:text-white'
                }`}
              >
                {w.word}
              </span>
            );
          })
        )}
      </div>

      {/* Status / Render Alert */}
      {renderMessage && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-medium border ${
            renderMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {renderMessage.text}
        </div>
      )}

      {/* Bottom Action: Apply Cuts & Render */}
      <div className="mt-4 pt-3 border-t border-dark-700/80 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Đã xóa: <strong className="text-rose-400">{excludedIndices.size}</strong> từ
        </div>

        <button
          onClick={handleApplyCuts}
          disabled={isRendering || excludedIndices.size === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            excludedIndices.size > 0 && !isRendering
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-95'
              : 'bg-dark-800 text-slate-500 border border-dark-700 cursor-not-allowed'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>{isRendering ? 'Đang Render Cắt Video...' : 'Cắt Video Theo Lời Thoại'}</span>
        </button>
      </div>
    </div>
  );
}
