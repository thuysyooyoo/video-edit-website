import React from 'react';

/**
 * 🌟 ANIMATED STICKER ITEM COMPONENT
 * Renders high-quality hand-drawn SVG animations with smooth keyframe loops:
 * - circle_red: Khoanh tròn đỏ vẽ tay động (chuẩn theo ảnh đính kèm)
 * - check_green: Nút tick xanh động
 * - arrow_red: Mũi tên đỏ chỉ động
 * - arrow_yellow: Mũi tên vàng chỉ động
 * - cross_red: Dấu X đỏ gạch chéo
 * - star_sparkle: Ngôi sao lấp lánh
 * - question_mark: Dấu hỏi chấm động
 * - focus_box_red: Khung viền đỏ nhấp nháy
 */

export const ANIMATION_PRESETS = [
  {
    id: 'circle_red',
    name: 'Khoanh Tròn Đỏ (Hand-drawn Circle)',
    category: 'Nhấn mạnh',
    desc: 'Khoanh vùng đối tượng vẽ tay nhấp nháy',
    sound: { name: 'Whoosh Swish', file: 'whoosh.wav' },
    thumb: '⭕',
    previewColor: '#ef4444'
  },
  {
    id: 'check_green',
    name: 'Nút Tick Xanh (Green Checkmark)',
    category: 'Thành công',
    desc: 'Nét tick xanh nảy lên nổi bật',
    sound: { name: 'Ding Bell Ting', file: 'ding.wav' },
    thumb: '✅',
    previewColor: '#22c55e'
  },
  {
    id: 'arrow_red',
    name: 'Mũi Tên Đỏ Chỉ (Red Curved Arrow)',
    category: 'Chỉ hướng',
    desc: 'Mũi tên cong vẽ tay nhún nhảy',
    sound: { name: 'Whoosh Fast', file: 'whoosh.wav' },
    thumb: '🏹',
    previewColor: '#ef4444'
  },
  {
    id: 'arrow_yellow',
    name: 'Mũi Tên Vàng Neon (Yellow Arrow)',
    category: 'Chỉ hướng',
    desc: 'Mũi tên vàng neon phát sáng',
    sound: { name: 'Whoosh Fast', file: 'whoosh.wav' },
    thumb: '👉',
    previewColor: '#eab308'
  },
  {
    id: 'cross_red',
    name: 'Dấu X Đỏ Cảnh Báo (Red Cross)',
    category: 'Cảnh báo',
    desc: 'Gạch chéo đỏ sai luật / cảnh báo',
    sound: { name: 'Thud Error Hit', file: 'whoosh.wav' },
    thumb: '❌',
    previewColor: '#dc2626'
  },
  {
    id: 'star_sparkle',
    name: 'Ngôi Sao Lấp Lánh (Sparkle Star)',
    category: 'Điểm nhấn',
    desc: 'Ngôi sao vàng xoay nhẹ và thở sáng',
    sound: { name: 'Chime Sparkle', file: 'ding.wav' },
    thumb: '⭐',
    previewColor: '#facc15'
  },
  {
    id: 'question_mark',
    name: 'Dấu Hỏi Chấm (Question Mark)',
    category: 'Vấn đề',
    desc: 'Dấu hỏi lơ lửng cho đoạn thắc mắc',
    sound: { name: 'Pop Plop', file: 'ding.wav' },
    thumb: '❓',
    previewColor: '#38bdf8'
  },
  {
    id: 'focus_box_red',
    name: 'Khung Vuông Nhấp Nháy (Red Focus Box)',
    category: 'Nhấn mạnh',
    desc: 'Khung bo góc đỏ thu hút chú ý',
    sound: { name: 'Whoosh Fast', file: 'whoosh.wav' },
    thumb: '🔲',
    previewColor: '#f43f5e'
  }
];

export default function AnimatedStickerItem({ type, scale = 100, isPlaying = true }) {
  const scaledSize = Math.round(110 * (scale / 100));

  switch (type) {
    case 'circle_red':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]"
            style={{
              animation: isPlaying ? 'handCirclePulse 1.4s ease-in-out infinite' : 'none'
            }}
          >
            {/* Hand-drawn organic circular path */}
            <path
              d="M 50 10 
                 C 74 8, 92 26, 92 50 
                 C 92 75, 73 92, 48 92 
                 C 24 92, 8 74, 9 49 
                 C 10 24, 28 8, 54 9 
                 C 78 10, 89 28, 87 46"
              fill="none"
              stroke="#ef4444"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="300"
              strokeDashoffset="0"
              style={{
                animation: isPlaying ? 'drawCircleStroke 0.6s ease-out forwards' : 'none'
              }}
            />
          </svg>
        </div>
      );

    case 'check_green':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]"
            style={{
              animation: isPlaying ? 'popBounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none'
            }}
          >
            {/* Green Circle Badge */}
            <circle cx="50" cy="50" r="42" fill="#22c55e" stroke="#15803d" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            {/* Checkmark */}
            <path
              d="M 28 50 L 43 66 L 72 32"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'arrow_red':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
            style={{
              animation: isPlaying ? 'arrowBob 1s ease-in-out infinite' : 'none'
            }}
          >
            {/* Curved hand-drawn arrow */}
            <path
              d="M 15 25 C 25 65, 55 75, 75 60"
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Arrow Head */}
            <path
              d="M 60 45 L 80 62 L 60 78"
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'arrow_yellow':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_12px_rgba(234,179,8,0.9)]"
            style={{
              animation: isPlaying ? 'arrowBob 1s ease-in-out infinite' : 'none'
            }}
          >
            <path
              d="M 20 50 L 68 50"
              fill="none"
              stroke="#facc15"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 50 30 L 78 50 L 50 70"
              fill="none"
              stroke="#facc15"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'cross_red':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]"
            style={{
              animation: isPlaying ? 'popBounceIn 0.4s ease-out forwards' : 'none'
            }}
          >
            {/* Red X Badge */}
            <circle cx="50" cy="50" r="42" fill="#dc2626" stroke="#991b1b" strokeWidth="4" />
            <path
              d="M 32 32 L 68 68"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 68 32 L 32 68"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    case 'star_sparkle':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]"
            style={{
              animation: isPlaying ? 'starSparkle 2s ease-in-out infinite' : 'none'
            }}
          >
            <path
              d="M 50 5 
                 Q 50 40, 95 50 
                 Q 50 50, 50 95 
                 Q 50 50, 5 50 
                 Q 50 50, 50 5 Z"
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <circle cx="50" cy="50" r="6" fill="#ffffff" />
          </svg>
        </div>
      );

    case 'question_mark':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize, height: scaledSize }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{
              animation: isPlaying ? 'arrowBob 1.2s ease-in-out infinite' : 'none'
            }}
          >
            <circle cx="50" cy="50" r="42" fill="#0284c7" stroke="#0369a1" strokeWidth="4" />
            <text
              x="50"
              y="62"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="48"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              ?
            </text>
          </svg>
        </div>
      );

    case 'focus_box_red':
      return (
        <div className="relative flex items-center justify-center select-none pointer-events-none" style={{ width: scaledSize * 1.3, height: scaledSize }}>
          <svg
            viewBox="0 0 130 100"
            className="w-full h-full drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
            style={{
              animation: isPlaying ? 'handCirclePulse 1.2s ease-in-out infinite' : 'none'
            }}
          >
            <rect
              x="8"
              y="8"
              width="114"
              height="84"
              rx="16"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="5"
              strokeDasharray="12 6"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
}
