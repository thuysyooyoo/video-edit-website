/**
 * 🎨 CAPTION STYLES & VIRAL PRESETS (SUPOCLIP & MRBEAST / HORMOZI INSPIRED)
 */

export const VIRAL_FONTS = [
  { id: 'Montserrat', name: 'Montserrat', desc: 'Chuẩn TikTok / Reels viral', category: 'Viral' },
  { id: 'Be Vietnam Pro', name: 'Be Vietnam Pro', desc: 'Chuẩn Tiếng Việt 100%', category: 'Tiếng Việt' },
  { id: 'Anton', name: 'Anton', desc: 'MrBeast Heavy Impact', category: 'Impact' },
  { id: 'Bebas Neue', name: 'Bebas Neue', desc: 'Alex Hormozi Tall', category: 'Impact' },
  { id: 'Archivo Black', name: 'Archivo Black', desc: 'Chữ dày dứt khoát', category: 'Bold' },
  { id: 'Poppins', name: 'Poppins', desc: 'Trẻ trung, hiện đại', category: 'Modern' },
  { id: 'Inter', name: 'Inter', desc: 'Tối giản, công nghệ', category: 'Minimal' },
  { id: 'Oswald', name: 'Oswald', desc: 'Thon cao thanh lịch', category: 'Tall' },
  { id: 'Outfit', name: 'Outfit', desc: 'Vlog / Fashion cao cấp', category: 'Modern' },
  { id: 'Kanit', name: 'Kanit', desc: 'Tương lai, thể thao', category: 'Dynamic' },
  { id: 'Righteous', name: 'Righteous', desc: 'Retro Cyberpunk', category: 'Special' },
  { id: 'Cinzel', name: 'Cinzel', desc: 'Điện ảnh, sang trọng', category: 'Cinematic' },
  { id: 'Bungee', name: 'Bungee', desc: 'Gaming, nổi bật', category: 'Special' },
  { id: 'Syne', name: 'Syne', desc: 'Nghệ thuật, sáng tạo', category: 'Modern' },
  { id: 'Luckiest Guy', name: 'Luckiest Guy', desc: 'Hoạt hình, vui nhộn', category: 'Fun' },
  { id: 'Fredoka', name: 'Fredoka', desc: 'Bo tròn dễ thương', category: 'Fun' },
  { id: 'Permanent Marker', name: 'Permanent Marker', desc: 'Chữ viết tay cá tính', category: 'Handwritten' },
  { id: 'Rubik', name: 'Rubik', desc: 'Chắc chắn, bo góc nhẹ', category: 'Modern' },
  { id: 'Russo One', name: 'Russo One', desc: 'Khỏe khoắn, dũng mãnh', category: 'Impact' },
  { id: 'Paytone One', name: 'Paytone One', desc: 'Nét đậm đặc trưng', category: 'Bold' },
  { id: 'Playfair Display', name: 'Playfair Display', desc: 'Kể chuyện, sâu lắng', category: 'Classic' },
  { id: 'Teko', name: 'Teko', desc: 'Siêu cao, tiêu đề mạnh', category: 'Tall' }
];

export const CAPTION_PRESETS = {
  'Karaoke Neon Green': {
    name: 'Karaoke Neon Green (MrBeast)',
    fontFamily: 'Montserrat',
    fontSize: 40,
    textColor: '#ffffff',
    highlightColor: '#22c55e',
    strokeColor: '#000000',
    strokeWidth: 8,
    effect: 'pop', // 'pop' | 'pill' | 'glow' | 'bounce'
    pillBgColor: null,
    glowColor: null,
    uppercase: true,
    shadowBlur: 14
  },
  'Alex Hormozi Pill-Box': {
    name: 'Alex Hormozi Pill-Box',
    fontFamily: 'Bebas Neue',
    fontSize: 44,
    textColor: '#ffffff',
    highlightColor: '#000000',
    strokeColor: '#000000',
    strokeWidth: 0,
    effect: 'pill',
    pillBgColor: '#facc15', // Nền vàng rực
    pillTextColor: '#000000', // Chữ đen
    pillRadius: 12,
    uppercase: true,
    shadowBlur: 10
  },
  'Cyberpunk Neon Glow': {
    name: 'Cyberpunk Neon Glow',
    fontFamily: 'Kanit',
    fontSize: 38,
    textColor: '#ffffff',
    highlightColor: '#00f0ff',
    strokeColor: '#090a0f',
    strokeWidth: 6,
    effect: 'glow',
    glowColor: '#00f0ff',
    glowIntensity: 25,
    uppercase: true,
    shadowBlur: 20
  },
  'Red Impact Warning': {
    name: 'Red Impact Warning',
    fontFamily: 'Anton',
    fontSize: 42,
    textColor: '#ffffff',
    highlightColor: '#ef4444',
    strokeColor: '#000000',
    strokeWidth: 9,
    effect: 'pop',
    pillBgColor: null,
    glowColor: '#ef4444',
    uppercase: true,
    shadowBlur: 16
  },
  'TikTok Classic Bold': {
    name: 'TikTok Classic Bold',
    fontFamily: 'Be Vietnam Pro',
    fontSize: 38,
    textColor: '#ffffff',
    highlightColor: '#fde047',
    strokeColor: '#000000',
    strokeWidth: 8,
    effect: 'pop',
    pillBgColor: null,
    uppercase: true,
    shadowBlur: 12
  },
  'Minimal Clean White': {
    name: 'Minimal Clean White',
    fontFamily: 'Inter',
    fontSize: 36,
    textColor: '#f8fafc',
    highlightColor: '#38bdf8',
    strokeColor: '#000000',
    strokeWidth: 4,
    effect: 'pop',
    pillBgColor: null,
    uppercase: false,
    shadowBlur: 8
  }
};
