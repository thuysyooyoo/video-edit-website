import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Smartphone, Monitor, RotateCcw } from 'lucide-react';

export default function VideoPlayer({ clip, words = [], onTimeUpdate, currentTime, videoRef }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9'
  const [activeWord, setActiveWord] = useState(null);

  // When clip changes, update time bounds
  useEffect(() => {
    if (videoRef.current && clip) {
      videoRef.current.currentTime = clip.start_time;
      setIsPlaying(false);
    }
  }, [clip]);

  // Handle timeupdate to loop or stay within clip boundary & find active subtitle word
  const handleTimeUpdate = () => {
    if (!videoRef.current || !clip) return;
    const current = videoRef.current.currentTime;
    onTimeUpdate(current);

    // Auto-loop within clip bounds during preview
    if (current >= clip.end_time) {
      videoRef.current.currentTime = clip.start_time;
    }

    // Find active word for karaoke overlay
    const found = words.find(w => current >= w.start && current <= w.end);
    setActiveWord(found ? found.word : null);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (clip) {
        videoRef.current.currentTime = clip.start_time;
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !clip) return;
    const seekPercentage = parseFloat(e.target.value);
    const clipDuration = clip.end_time - clip.start_time;
    const newTime = clip.start_time + (seekPercentage / 100) * clipDuration;
    videoRef.current.currentTime = newTime;
  };

  // Calculate current progress relative to clip
  const clipDuration = clip ? clip.end_time - clip.start_time : 1;
  const clipProgress = clip ? Math.max(0, Math.min(100, ((currentTime - clip.start_time) / clipDuration) * 100)) : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-950 p-4 relative">
      {/* Aspect Ratio Switcher Bar */}
      <div className="mb-3 flex items-center gap-2 bg-dark-900/80 p-1.5 rounded-xl border border-dark-700/80 shadow-md">
        <button
          onClick={() => setAspectRatio('9:16')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            aspectRatio === '9:16'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16 Dọc (TikTok/Shorts)</span>
        </button>

        <button
          onClick={() => setAspectRatio('16:9')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            aspectRatio === '16:9'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9 Ngang (Gốc)</span>
        </button>
      </div>

      {/* Video Container Frame */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-black border border-dark-700/80 shadow-2xl transition-all duration-300 flex items-center justify-center ${
          aspectRatio === '9:16'
            ? 'w-[280px] sm:w-[320px] aspect-[9/16] ring-2 ring-brand-500/20'
            : 'w-full max-w-[640px] aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          src="http://127.0.0.1:8000/api/stream/source"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
          playsInline
        />

        {/* Live Karaoke Subtitle Preview Overlay */}
        <div className="absolute bottom-16 left-4 right-4 pointer-events-none text-center">
          {words.length > 0 && (
            <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl inline-block max-w-[90%] border border-white/10 shadow-lg">
              <p className="text-sm sm:text-base font-extrabold uppercase tracking-wide leading-relaxed text-white">
                {words
                  .filter(w => Math.abs(w.start - currentTime) <= 2.5)
                  .slice(0, 6)
                  .map((w, idx) => {
                    const isCurrent = currentTime >= w.start && currentTime <= w.end;
                    return (
                      <span
                        key={idx}
                        className={`mx-1 transition-all inline-block ${
                          isCurrent
                            ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] font-black'
                            : 'text-white/90'
                        }`}
                      >
                        {w.word}
                      </span>
                    );
                  })}
              </p>
            </div>
          )}
        </div>

        {/* Big Center Play Icon when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="w-full max-w-[640px] mt-4 bg-dark-900/90 border border-dark-700/80 rounded-2xl p-3 shadow-xl flex flex-col gap-2">
        {/* Progress Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            {formatTime(currentTime - (clip?.start_time || 0))}
          </span>

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={clipProgress || 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
          />

          <span className="text-xs font-mono text-slate-400">
            {formatTime(clip?.duration || 0)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current && clip) videoRef.current.currentTime = clip.start_time;
              }}
              title="Quay lại đầu clip"
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Clip: <strong>{clip?.title || "Chưa chọn"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
