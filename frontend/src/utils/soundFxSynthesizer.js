/**
 * 🔊 WEB AUDIO SOUND FX SYNTHESIZER & SOUND LIBRARY (SUPOCLIP INSPIRED)
 * Tự động phát âm thanh Sound FX qua file hoặc tự tổng hợp sóng âm (Oscillator) chuẩn xác 100%
 */

export const EXTENDED_SOUND_FX = [
  { id: 'whoosh', name: 'Whoosh Fast Swoosh', category: 'Chuyển cảnh', file: 'whoosh.wav', duration: '0.25s', desc: 'Âm thanh lướt gió nhanh khi chuyển ý' },
  { id: 'ding', name: 'Ding Bling Sparkle', category: 'Điểm nhấn', file: 'ding.wav', duration: '0.35s', desc: 'Âm thanh leng keng khi có ý tưởng hay' },
  { id: 'pop', name: 'Pop Bubble Subtitle', category: 'Hiện chữ', file: 'pop.wav', duration: '0.10s', desc: 'Tiếng nổ bong bóng nhẹ khi từ khóa xuất hiện' },
  { id: 'cash', name: 'Cash Register Cha-Ching', category: 'Tiền bạc', file: 'cash.wav', duration: '0.45s', desc: 'Tiếng máy đếm tiền / lợi nhuận tăng' },
  { id: 'coin', name: 'Coin Collect Sparkle', category: 'Thưởng', file: 'coin.wav', duration: '0.20s', desc: 'Tiếng nhặt đồng xu may mắn' },
  { id: 'glitch', name: 'Cyber Glitch Noise', category: 'Công nghệ', file: 'glitch.wav', duration: '0.30s', desc: 'Âm thanh nhiễu sóng kỹ thuật số' },
  { id: 'boom', name: 'Cinematic Hit Impact', category: 'Tác động mạnh', file: 'boom.wav', duration: '0.60s', desc: 'Âm trầm điện ảnh cho phân đoạn kịch tính' },
  { id: 'camera', name: 'Camera Shutter Click', category: 'Chụp ảnh', file: 'camera.wav', duration: '0.08s', desc: 'Tiếng chụp ảnh ghi lại khoảnh khắc' },
  { id: 'vine_boom', name: 'Viral Dramatic Boom', category: 'Meme/Kịch tính', file: 'vine_boom.wav', duration: '0.50s', desc: 'Âm thanh kịch tính viral meme' },
  { id: 'bell', name: 'Attention Bell Ring', category: 'Chú ý', file: 'bell.wav', duration: '0.40s', desc: 'Tiếng chuông gõ tạo sự tập trung cao' }
];

/**
 * Tổng hợp âm thanh bằng Web Audio API khi không có file audio cục bộ
 */
export function synthesizeSoundFx(fxId, audioCtx = null, destination = null) {
  try {
    const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const dest = destination || ctx.destination;
    const now = ctx.currentTime;

    if (fxId === 'whoosh') {
      // White noise sweeping through bandpass filter
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.3);

    } else if (fxId === 'ding' || fxId === 'bell') {
      // High sine chime with harmonics
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2093, now); // C7
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(4186, now); // C8

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);

    } else if (fxId === 'pop') {
      // Bubble pop: fast pitch drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.1);

    } else if (fxId === 'coin' || fxId === 'cash') {
      // 2-tone bright arpeggio
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.35);

    } else if (fxId === 'boom' || fxId === 'vine_boom') {
      // Sub bass boom drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.55);

    } else {
      // Default click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.warn("Synthesizer error:", e);
  }
}

/**
 * Phát âm thanh Sound FX (Thử nạp file trước, nếu lỗi thì tự động tổng hợp Web Audio)
 */
export function playSoundFxEffect(fxId, audioCtx = null, destination = null) {
  try {
    const audio = new Audio(`/assets/sounds/${fxId}.wav`);
    audio.crossOrigin = 'anonymous';
    audio.play().catch(() => {
      // Fallback synthesizer
      synthesizeSoundFx(fxId, audioCtx, destination);
    });
  } catch (e) {
    synthesizeSoundFx(fxId, audioCtx, destination);
  }
}
