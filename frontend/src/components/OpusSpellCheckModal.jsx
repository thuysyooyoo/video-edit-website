import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  CheckCheck, 
  AlertCircle, 
  Loader2, 
  Edit3, 
  ArrowRight, 
  RefreshCw,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { checkTranscriptSpelling } from '../utils/aiSpellCheckerClient';

export default function OpusSpellCheckModal({
  isOpen,
  onClose,
  words = [],
  onApplyCorrections,
  apiKey = '',
  selectedModel = 'gemini-2.5-flash',
  onSeekWord
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  // Tự động quét chính tả khi mở modal
  useEffect(() => {
    if (isOpen) {
      handleScanSpelling();
    } else {
      setCorrections([]);
      setErrorMsg('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleScanSpelling = async () => {
    if (!words || words.length === 0) {
      setErrorMsg("Không có dữ liệu lời thoại (transcript) để kiểm tra.");
      return;
    }
    const currentApiKey = apiKey || localStorage.getItem('opus_gemini_api_key') || '';
    if (!currentApiKey.trim()) {
      setErrorMsg("Vui lòng cung cấp Gemini API Key trong thanh TopBar hoặc thiết lập để sử dụng AI Sửa Chính Tả.");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStatusMessage('Đang phân tích ngữ cảnh toàn bộ câu chuyện và dò lỗi chính tả...');

    try {
      const results = await checkTranscriptSpelling(words, currentApiKey.trim(), selectedModel);
      setCorrections(results);
      if (results.length === 0) {
        setStatusMessage('Tuyệt vời! AI không phát hiện lỗi chính tả hoặc nghe nhầm nào trong kịch bản.');
      } else {
        setStatusMessage(`Đã phát hiện ${results.length} từ / cụm từ cần hiệu đính ngữ cảnh.`);
      }
    } catch (err) {
      console.error("Spell check error:", err);
      setErrorMsg(err.message || 'Lỗi khi gọi AI kiểm tra chính tả.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật text chỉnh sửa tay cho từng mục
  const handleCustomTextChange = (id, newText) => {
    setCorrections(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, customText: newText };
      }
      return c;
    }));
  };

  // Đổi trạng thái chấp nhận (Accept)
  const handleToggleAccept = (id) => {
    setCorrections(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'accepted' ? 'pending' : 'accepted' };
      }
      return c;
    }));
  };

  // Bỏ qua (Skip/Reject)
  const handleReject = (id) => {
    setCorrections(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: 'rejected' };
      }
      return c;
    }));
  };

  // Chấp nhận tất cả
  const handleAcceptAll = () => {
    setCorrections(prev => prev.map(c => ({
      ...c,
      status: 'accepted'
    })));
  };

  // Áp dụng các từ đã được chấp nhận vào transcript
  const handleApply = () => {
    const acceptedList = corrections.filter(c => c.status === 'accepted');
    if (acceptedList.length === 0) {
      onClose();
      return;
    }

    if (onApplyCorrections) {
      onApplyCorrections(acceptedList);
    }
    onClose();
  };

  if (!isOpen) return null;

  const acceptedCount = corrections.filter(c => c.status === 'accepted').length;
  const pendingCount = corrections.filter(c => c.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#11131e] border border-[#262a3f] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ── HEADER ── */}
        <div className="p-4 sm:p-5 border-b border-[#1f2233] bg-[#141624] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 fill-current text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Sửa Chính Tả & Thuật Ngữ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-normal">
                  1-to-1 Word Replacement
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động phát hiện lỗi chính tả & thuật ngữ, bảo toàn 100% mốc thời gian sóng âm gốc
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1e2235] hover:bg-[#282d47] text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Status / Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200">{statusMessage}</p>
              <p className="text-xs text-slate-500">Đang sử dụng mô hình {selectedModel} để phân tích ngữ cảnh tiếng Việt...</p>
            </div>
          ) : corrections.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-[#161826] rounded-xl border border-[#212538] p-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Không phát hiện lỗi chính tả</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Tất cả các từ trong kịch bản đều chuẩn xác theo ngữ cảnh câu chuyện.
              </p>
              <button
                onClick={handleScanSpelling}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#202438] hover:bg-[#2b304c] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Quét lại toàn bộ</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-[#1f2233]">
                <span>Phát hiện <strong className="text-yellow-400 font-mono font-bold">{corrections.length}</strong> từ cần sửa:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Chọn tất cả ({corrections.length})</span>
                  </button>
                  <button
                    onClick={handleScanSpelling}
                    title="Quét lại"
                    className="p-1 rounded hover:bg-[#202438] text-slate-400 hover:text-white transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Danh sách các thẻ sửa từ */}
              <div className="space-y-3">
                {corrections.map((item, idx) => {
                  const isAccepted = item.status === 'accepted';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAccepted 
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : isRejected
                          ? 'bg-slate-900/40 border-[#222536] opacity-40'
                          : 'bg-[#161826] border-[#25293d] hover:border-[#353b56]'
                      }`}
                    >
                      {/* Top: Word Comparison & Editable Input */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">#{idx + 1}</span>
                          
                          {/* Từ gốc */}
                          <span className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/40 text-xs font-mono font-bold line-through">
                            {item.originalText}
                          </span>

                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

                          {/* Từ gợi ý / Ô nhập tùy chỉnh */}
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleCustomTextChange(item.id, e.target.value)}
                              placeholder="Nhập từ thay thế..."
                              className="px-2.5 py-1 rounded-lg bg-[#0d0e17] border border-indigo-500/40 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-indigo-400 w-36 sm:w-44"
                            />
                            <Edit3 className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAccept(item.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                              isAccepted
                                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                                : 'bg-[#222638] hover:bg-[#2d334d] text-slate-200 hover:text-white border border-[#313650]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAccepted ? 'Đã chọn' : 'Chấp nhận'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(item.id)}
                            title="Bỏ qua từ này"
                            className="p-1.5 rounded-lg bg-[#1a1c2a] hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 border border-transparent hover:border-rose-800/40 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Context & Reason */}
                      <div className="mt-2 pt-2 border-t border-[#1f2233] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <p className="text-slate-300 italic truncate max-w-md">
                          "{item.context}"
                        </p>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                          {item.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 border-t border-[#1f2233] bg-[#141624] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {acceptedCount > 0 ? (
              <span className="text-emerald-400 font-semibold">
                Sẽ áp dụng sửa <strong className="font-mono font-bold">{acceptedCount}</strong> từ
              </span>
            ) : (
              <span>Chưa chọn từ nào để sửa</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1c1f2e] hover:bg-[#272b40] text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Hủy
            </button>

            <button
              type="button"
              disabled={acceptedCount === 0}
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>Áp Dụng ({acceptedCount}) Từ Đã Chọn</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
