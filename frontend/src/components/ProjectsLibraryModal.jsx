import React, { useState, useEffect } from 'react';
import { Folder, Film, Clock, CheckCircle2, ChevronRight, X, Play, RefreshCw, Trash2 } from 'lucide-react';
import { listProjectsFromVault, loadProjectFromVault, deleteProjectFromVault } from '../utils/projectVault';

export default function ProjectsLibraryModal({ isOpen, onClose, onSwitchProject }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // 1. Đọc từ IndexedDB Vault
      const vaultList = await listProjectsFromVault();
      setProjects(vaultList || []);
    } catch (e) {
      console.error("Fetch projects error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (proj) => {
    setSwitchingId(proj.id);
    try {
      const fullProj = await loadProjectFromVault(proj.id);
      if (fullProj && onSwitchProject) {
        onSwitchProject(fullProj);
      }
      onClose();
    } catch (e) {
      console.error("Switch project error:", e);
      alert("Không thể nạp dự án này: " + e.message);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleDelete = async (e, projId) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này khỏi kho lưu trữ?")) {
      try {
        await deleteProjectFromVault(projId);
        setProjects(prev => prev.filter(p => p.id !== projId));
      } catch (err) {
        alert("Lỗi khi xóa dự án: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-sans">
      <div className="bg-[#11121a] border border-[#262a3d] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#202334] flex items-center justify-between bg-[#161826]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Kho Lưu Trữ Dự Án (Browser Vault)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {projects.length} Dự Án
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Toàn bộ video và kịch bản được lưu trữ an toàn trong IndexedDB của trình duyệt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchProjects} 
              title="Làm mới danh sách"
              className="p-2 rounded-xl bg-[#1f2233] text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-[#1f2233] text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">Chưa có dự án nào trong kho lưu trữ.</p>
              <p className="text-xs text-slate-500">Mỗi khi bạn nạp và chỉnh sửa video, dự án sẽ tự động được lưu an toàn tại đây.</p>
            </div>
          ) : (
            projects.map((proj) => {
              const isSwitching = switchingId === proj.id;
              const title = proj.customTitle || proj.video_metadata?.title || proj.title || 'Dự Án Không Tên';
              const dateStr = proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong';

              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelect(proj)}
                  className="p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group bg-[#161826] hover:bg-[#202336] border-[#25283a] hover:border-indigo-500/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 bg-[#22253a] text-slate-300 group-hover:text-white group-hover:bg-indigo-600 transition">
                      🎬
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                          {title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                        <span>🕒 {dateStr}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">{proj.viral_clips?.length || 1} Phân Cảnh</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3 flex items-center gap-2">
                    {isSwitching ? (
                      <span className="text-xs text-indigo-400 font-semibold animate-pulse">Đang nạp...</span>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleDelete(e, proj.id)}
                          title="Xóa dự án này"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-1.5 rounded-xl bg-[#22253a] group-hover:bg-indigo-600 group-hover:text-white text-slate-300 text-xs font-bold transition flex items-center gap-1">
                          <span>Mở Edit</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
