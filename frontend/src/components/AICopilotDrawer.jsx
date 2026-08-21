import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  ChevronDown, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  RotateCcw,
  Sliders,
  Cpu
} from 'lucide-react';

export default function AICopilotDrawer({
  isOpen = false,
  onClose,
  clip,
  fontStyle,
  soundFxCount = 0,
  onExecuteAction,
  selectedModel = 'gemini-3.7-flash',
  setSelectedModel
}) {
  const [availableModels, setAvailableModels] = useState([
    { id: 'gemini-3.7-flash', name: '⚡ Gemini 3.7 Flash', desc: 'Mới nhất & Siêu tốc' },
    { id: 'gemini-2.5-pro', name: '🧠 Gemini 2.5 Pro', desc: 'Lý luận sâu & Viết kịch bản' },
    { id: 'gemini-2.5-flash', name: '⚡ Gemini 2.5 Flash', desc: 'Cân bằng hiệu năng' },
    { id: 'gemini-2.0-flash', name: '🚀 Gemini 2.0 Flash', desc: 'Mô hình chuẩn' }
  ]);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Xin chào! Tôi là **AI Video Producer Copilot**. Bạn có thể yêu cầu tôi bằng tiếng Việt: *viết lại tiêu đề Hook viral*, *đổi màu chữ neon*, *tự động hòa âm Sound FX*, hoặc *xuất clip 1080x1920* nhé!',
      actions: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState([
    '🎯 Viết lại 3 tiêu đề Hook viral 99/100',
    '✂️ Xóa sạch từ thừa và khoảng lặng',
    '🎨 Đổi kiểu chữ sang Xanh Neon TikTok',
    '🎵 Tự động tạo Sound FX & Ducking',
    '⚡ Xuất video 9:16 Full HD 1080x1920'
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch available models from backend
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/copilot/models');
        if (res.ok) {
          const json = await res.json();
          if (json.models && json.models.length > 0) {
            setAvailableModels(json.models);
          }
        }
      } catch (err) {}
    };
    fetchModels();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          model_name: selectedModel,
          clip_context: {
            title: clip?.title,
            start_time: clip?.start_time,
            end_time: clip?.end_time,
            duration: clip?.duration,
            hook_score: clip?.hook_score,
            font_style: fontStyle,
            sound_fx_count: soundFxCount
          }
        })
      });

      const resJson = await res.json();
      const botMsgId = `bot_${Date.now()}`;

      const botMsg = {
        id: botMsgId,
        role: 'assistant',
        text: resJson.message || 'Đã thực hiện xong yêu cầu của bạn!',
        actions: resJson.actions || [],
        modelUsed: resJson.model_used || selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);

      if (resJson.quick_suggestions && resJson.quick_suggestions.length > 0) {
        setQuickSuggestions(resJson.quick_suggestions);
      }

      // Execute actions in Studio
      if (resJson.actions && resJson.actions.length > 0 && onExecuteAction) {
        resJson.actions.forEach((act) => {
          onExecuteAction(act);
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Lỗi kết nối: ${err.message}. Đang chạy chế độ offline fallback.`,
          actions: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-13 bottom-0 w-[420px] bg-[#0c0d14] border-l border-[#24273c] shadow-2xl z-50 flex flex-col font-sans select-none animate-slide-left">
      {/* ── HEADER: Title & Close Button ── */}
      <div className="p-3.5 bg-[#12131e] border-b border-[#222538] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <span>AI Producer Copilot</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                PRODUCER
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Điều khiển Studio bằng ngôn ngữ tự nhiên</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#1f2233] text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── MODEL SELECTOR BAR (NƠI ĐỔI MODEL AI NÓI CHUYỆN) ── */}
      <div className="px-3.5 py-2.5 bg-[#10111d] border-b border-[#22263d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="text-[11px] font-bold text-white">Đổi Mô Hình AI:</div>
            <div className="text-[9px] text-slate-400">Chọn model bạn thích để nói chuyện</div>
          </div>
        </div>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
          className="bg-[#181a28] border border-indigo-500/40 text-indigo-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm hover:border-indigo-400 transition-colors"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id} className="bg-[#12131e] text-white">
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── CHAT MESSAGES CONTAINER ── */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-[#1e2030] border border-[#2f334d] flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 rounded-2xl leading-relaxed text-xs ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-md'
                    : 'bg-[#161724] border border-[#26293f] text-slate-200 rounded-tl-xs'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>

              {/* Action Badges Render */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-1 pt-1">
                  {msg.actions.map((act, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {act.type === 'set_title' && `Đã đổi tiêu đề: "${act.title}"`}
                        {act.type === 'update_font' && `Đã cập nhật Font & Màu Highlight`}
                        {act.type === 'cleanup_speech' && `Đã xóa từ thừa & khoảng dừng`}
                        {act.type === 'run_auto_mix' && `Đã kích hoạt Tự Động Hòa Âm AI`}
                        {act.type === 'export_hd' && `Đã kích hoạt Render 1080x1920 HD`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[9px] text-slate-500 px-1 font-mono">{msg.timestamp}</div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-xl bg-[#1e2030] border border-[#2f334d] flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 bg-[#161724] border border-[#26293f] rounded-2xl rounded-tl-xs flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>AI Producer đang suy nghĩ và điều khiển Studio...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── QUICK SUGGESTIONS ── */}
      <div className="p-2.5 bg-[#0e0f18] border-t border-[#1c1f30] space-y-1.5">
        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400 fill-current" />
          <span>Gợi ý lệnh nhanh:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickSuggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sug)}
              className="px-2.5 py-1 rounded-lg bg-[#181a26] hover:bg-[#23263a] border border-[#272b40] text-[10px] font-medium text-slate-300 hover:text-white transition-all active:scale-95"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUT BOX ── */}
      <div className="p-3 bg-[#12131e] border-t border-[#222538] flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ra lệnh cho AI Producer (VD: Đổi tiêu đề, đổi màu neon...)"
          className="flex-1 bg-[#181a26] border border-[#292e44] text-white placeholder-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
        />
        <button
          disabled={!inputMessage.trim() || isLoading}
          onClick={() => handleSendMessage()}
          className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-40 shrink-0"
        >
          <Send className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
