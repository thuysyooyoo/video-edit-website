/**
 * 🚀 CONTEXTUAL EMOJIS ENGINE (SUPOCLIP INSPIRED)
 * Tự động phân tích từ khóa theo ngữ cảnh tiếng Việt & tiếng Anh để gắn Emoji sinh động vào phụ đề
 */

export const KEYWORD_EMOJI_DICT = {
  // 💰 Tài chính, Tiền bạc & Đầu tư
  'tiền': '💰', 'tiền bạc': '💵', 'usd': '💵', 'đô': '💵', 'vnd': '💵', 'triệu': '💸', 'tỷ': '🏦',
  'lãi': '📈', 'lợi nhuận': '📈', 'tăng': '📈', 'tăng trưởng': '🚀', 'đầu tư': '📊', 'chứng khoán': '📈',
  'giàu': '🤑', 'triệu phú': '🤑', 'tỷ phú': '👑', 'chi phí': '💳', 'tiết kiệm': '🪙', 'vàng': '🥇',
  'kim cương': '💎', 'bạc': '🥈', 'doanh thu': '💹', 'bán hàng': '🛒', 'mua': '🛍️', 'discount': '🏷️',
  'miễn phí': '🎁', 'quà': '🎁', 'thưởng': '🎉', 'hoa hồng': '🌹', 'lỗ': '📉', 'phá sản': '💥',
  'money': '💰', 'cash': '💵', 'dollar': '💵', 'rich': '🤑', 'profit': '📈', 'invest': '📊',

  // 🔥 Năng lượng, Cảm xúc & Sự thu hút
  'cháy': '🔥', 'hot': '🔥', 'nóng': '🔥', 'bùng nổ': '💥', 'nổ': '💥', 'đỉnh': '🔝', 'đỉnh cao': '🏔️',
  'siêu': '⚡', 'cực': '⚡', 'nhanh': '⚡', 'tốc độ': '🏎️', 'mạnh': '💪', 'khỏe': '🦾',
  'sốc': '😱', 'bất ngờ': '🤯', 'kinh ngạc': '😲', 'kinh hoàng': '😨', 'sợ': '😱', 'hoảng': '🏃‍♂️',
  'cười': '😂', 'hài': '🤣', 'vui': '😄', 'hạnh phúc': '🥰', 'buồn': '😢', 'khóc': '😭',
  'tức': '😡', 'giận': '🤬', 'điên': '🤪', 'điên rồ': '🤯', 'tuyệt vời': '✨', 'ảo': '🪄',
  'fire': '🔥', 'boom': '💥', 'shock': '😱', 'crazy': '🤪', 'magic': '🪄', 'wow': '😲',

  // 🏆 Chiến thắng, Mục tiêu & Thành công
  'thành công': '🏆', 'chiến thắng': '🥇', 'vô địch': '👑', 'top': '🔝', 'số 1': '🥇', 'thắng': '✌️',
  'mục tiêu': '🎯', 'kết quả': '📋', 'bí quyết': '🔑', 'chìa khóa': '🔑', 'mẹo': '💡', 'ý tưởng': '💡',
  'giải pháp': '🧩', 'chiến lược': '♟️', 'vượt qua': '🧗‍♂️', 'kỷ lục': '⭐', 'xuất sắc': '🌟',
  'win': '🏆', 'winner': '🥇', 'champion': '👑', 'target': '🎯', 'key': '🔑', 'idea': '💡',

  // 📦 Logistics, Hàng hóa & Doanh nghiệp
  'hàng': '📦', 'hàng hóa': '📦', 'kiện hàng': '📦', 'kho': '🏭', 'nhà kho': '🏭', 'vận chuyển': '🚚',
  'giao hàng': '🛵', 'xe tải': '🚛', 'tàu': '🚢', 'máy bay': '✈️', 'nhập khẩu': '📥', 'xuất khẩu': '📤',
  'hải quan': '🛂', 'thông quan': '✅', 'kiểm tra': '🔍', 'soi': '🔬', 'tiêu hủy': '🗑️', 'rác': '🗑️',
  'rủi ro': '🚨', 'nguy hiểm': '⚠️', 'cảnh báo': '🚨', 'chú ý': '👀', 'nghiêm ngặt': '🔒', 'quy định': '📜',
  'luật': '⚖️', 'phạt': '💸', 'công ty': '🏢', 'nhà xưởng': '🏗️', 'đối tác': '🤝', 'khách hàng': '👥',
  'package': '📦', 'warehouse': '🏭', 'shipping': '🚚', 'customs': '🛂', 'risk': '🚨', 'warning': '⚠️',

  // ⏰ Thời gian, Lịch trình & Hành động
  'thời gian': '⏰', 'giờ': '⏳', 'phút': '⏱️', 'giây': '⚡', 'ngay': '⚡', 'gấp': '🚨',
  'hôm nay': '📅', 'ngày mai': '🌅', 'quá khứ': '📜', 'tương lai': '🚀', 'bắt đầu': '🏁', 'kết thúc': '🛑',
  'dừng': '🛑', 'cấm': '🚫', 'hạn chế': '🚧', 'tiếp tục': '⏩', 'chậm': '🐢', 'lặp lại': '🔄',
  'time': '⏰', 'now': '⚡', 'stop': '🛑', 'start': '🏁', 'wait': '⏳',

  // 📱 Công nghệ, Mạng xã hội & Truyền thông
  'video': '🎬', 'clip': '📹', 'phim': '🍿', 'ảnh': '📸', 'camera': '📷', 'micro': '🎙️',
  'ai': '🤖', 'robot': '🤖', 'công nghệ': '💻', 'máy tính': '💻', 'điện thoại': '📱', 'mạng': '🌐',
  'tiktok': '🎵', 'youtube': '▶️', 'facebook': '📘', 'viral': '🔥', 'view': '👀', 'follow': '➕',
  'like': '👍', 'share': '📢', 'comment': '💬', 'sub': '🔔', 'chuông': '🔔', 'sao': '⭐'
};

// Loại bỏ dấu tiếng Việt để so sánh tìm kiếm từ khóa linh hoạt
export function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Tìm emoji phù hợp nhất cho 1 từ hoặc cụm từ
 */
export function getEmojiForWord(word) {
  if (!word) return null;
  const cleanWord = word.replace(/[.,!?;:"'(){}\[\]]/g, '').trim().toLowerCase();
  
  // 1. Tìm chính xác từ gốc
  if (KEYWORD_EMOJI_DICT[cleanWord]) {
    return KEYWORD_EMOJI_DICT[cleanWord];
  }

  // 2. Tìm không dấu
  const nonAccent = removeVietnameseAccents(cleanWord);
  for (const [key, emoji] of Object.entries(KEYWORD_EMOJI_DICT)) {
    if (removeVietnameseAccents(key) === nonAccent) {
      return emoji;
    }
  }

  // 3. Tìm chứa từ khóa
  if (cleanWord.length >= 3) {
    for (const [key, emoji] of Object.entries(KEYWORD_EMOJI_DICT)) {
      if (cleanWord.includes(key) || key.includes(cleanWord)) {
        return emoji;
      }
    }
  }

  return null;
}

/**
 * Gắn Emoji tự động vào mảng words của phụ đề
 */
export function attachEmojisToWords(words = []) {
  if (!words || !Array.isArray(words)) return [];

  return words.map((w, idx) => {
    const emoji = getEmojiForWord(w.word);
    return {
      ...w,
      emoji: emoji || null
    };
  });
}
