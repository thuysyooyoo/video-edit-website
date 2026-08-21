import React, { useState } from 'react';
import { X, Layout, Clock, Sparkles, Trash2, Check, Zap, Film } from 'lucide-react';

export default function BrollEditModal({
  isOpen,
  onClose,
  broll,
  onUpdateBroll,
  onDeleteBroll,
  clipDuration = 60
}) {
  if (!isOpen || !broll) return null;

  const [style, setStyle] = useState(broll.style || 'split_50_50_top');
  const [start, setStart] = useState(broll.start !== undefined ? broll.start : 0);
  const [end, setEnd] = useState(broll.end !== undefined ? broll.end : (broll.start + 4));
  const [enterTransition, setEnterTransition] = useState(broll.enterTransition || 'zoom_in');

  const styleOptions = [
    { id: 'split_50_50_top', name: 'Chia Đôi 50:50 (B-Roll Trên / Video Dưới)', desc: 'Hòa trộn chuyển sắc mềm mại ở đường tiếp giáp' },
    { id: 'split_50_50_bottom', name: 'Chia Đôi 50:50 (Video Trên / B-Roll Dưới)', desc: 'Hòa trộn chuyển sắc mềm mại ở đường tiếp giáp' },
    { id: 'split_30_70_top', name: 'Tỉ Lệ 30:70 (B-Roll 30% Trên / Video 70% Dưới)', desc: 'B-Roll 30% ở đỉnh với viền chuyển tiếp êm' },
    { id: 'split_30_70_bottom', name: 'Tỉ Lệ 30:70 (Video 70% Trên / B-Roll 30% Dưới)', desc: 'B-Roll 30% ở đáy với viền chuyển tiếp êm' },
    { id: 'full_cover', name: 'Toàn Màn Hình (100% Full Cut)', desc: 'B-Roll che toàn bộ màn hình, phụ đề vẫn ở trên' },
    { id: 'background', name: 'Làm Nền Nhân Vật (Tách Người AI)', desc: 'Bóc tách cơ thể người nói và đặt B-Roll phía sau' },
    { id: 'pip', name: 'Picture-in-Picture (Góc Trên Phải)', desc: 'Khung video B-Roll nhỏ bo góc đổ bóng nổi bật' },
  ];

  const transitionOptions = [
    { id: 'zoom_in', name: 'Zoom In Punch (Mặc định)', desc: 'Phóng to đột ngột giật gân, cuốn hút người xem' },
    { id: 'fade_in', name: 'Fade In Dissolve', desc: 'Mờ dần vào mềm mại, tự nhiên' },
    { id: 'slide_up', name: 'Smooth Slide Up', desc: 'Trượt từ dưới lên thanh lịch' },
    { id: 'flash_white', name: 'Flash White Impact', desc: 'Chớp sáng điện ảnh mạnh mẽ' },
    { id: 'glitch', name: 'Glitch Cyber', desc: 'Nhiễu sóng kỹ thuật số hiện đại' },
    { id: 'none', name: 'Không Hiệu Ứng (Hard Cut)', desc: 'Cắt thẳng liền mạch không có chuyển cảnh' },
  ];

  const handleSave = () => {
    const s = Math.max(0, parseFloat(start) || 0);
    const e = Math.max(s + 0.5, parseFloat(end) || (s + 4));
    onUpdateBroll({
      ...broll,
      style,
      start: Math.round(s * 10) / 10,
      end: Math.round(e * 10) / 10,
      duration: Math.round((e - s) * 10) / 10,
      enterTransition
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-sans">
      <div className="bg-[#11121a] border border-[#262a3d] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#202334] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Chỉnh Sửa B-Roll
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {broll.title || 'B-Roll'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Tùy chỉnh phong cách, thời lượng và hiệu ứng vào trực tiếp từ Timeline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#1a1c29] text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[68vh] text-xs">
          {/* 1. Timing Adjustments */}
          <div className="p-3.5 bg-[#161824] border border-[#262a3d] rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-white pb-1 border-b border-[#202334]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Thời Lượng & Mốc Thời Gian (Giây)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Bắt đầu từ giây:</label>
                <input
                  type="number"
                  step="0.2"
                  min="0"
                  max={clipDuration}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-[#0d0e15] border border-[#282b3d] text-white rounded-xl px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Kết thúc ở giây:</label>
                <input
                  type="number"
                  step="0.2"
                  min="0"
                  max={clipDuration}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full bg-[#0d0e15] border border-[#282b3d] text-white rounded-xl px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Tổng thời lượng hiển thị: <strong className="text-amber-400">{Math.max(0, end - start).toFixed(1)}s</strong>
            </div>
          </div>

          {/* 2. Enter Transition (Hiệu ứng lúc vào) */}
          <div className="p-3.5 bg-[#161824] border border-[#262a3d] rounded-2xl space-y-2">
            <div className="flex items-center justify-between font-bold text-white pb-1 border-b border-[#202334]">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Hiệu Ứng Lúc Vào (Enter Transition)</span>
              </div>
              <span className="text-[10px] text-amber-300 font-mono font-semibold">Tự động chèn</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {transitionOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEnterTransition(opt.id)}
                  className={`p-2 rounded-xl text-left transition-all border flex items-center justify-between ${
                    enterTransition === opt.id
                      ? 'bg-amber-950/60 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                      : 'bg-[#10121a] hover:bg-[#1b1e2c] border-[#23273a] text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-bold text-[11px] truncate">{opt.name}</div>
                  </div>
                  {enterTransition === opt.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Display Style */}
          <div className="p-3.5 bg-[#161824] border border-[#262a3d] rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-white pb-1 border-b border-[#202334]">
              <Layout className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phong Cách Hiển Thị B-Roll</span>
            </div>

            <div className="space-y-1.5">
              {styleOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                    style === opt.id
                      ? 'bg-indigo-950/60 border border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                      : 'bg-[#10121a] hover:bg-[#1b1e2c] border border-[#23273a] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{opt.name}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                  {style === opt.id && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#202334] bg-[#0c0d14] flex items-center justify-between">
          <button
            onClick={() => {
              if (onDeleteBroll) onDeleteBroll(broll.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-800/40 text-rose-300 text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa B-Roll Này</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1e2130] text-slate-300 hover:text-white font-bold text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 active:scale-95 transition-all"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
