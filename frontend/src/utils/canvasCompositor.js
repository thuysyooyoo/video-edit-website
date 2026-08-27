/**
 * 🎨 CANVAS COMPOSITOR 1080x1920 FULL HD (WYSIWYG CAPCUT ENGINE)
 * Module chuyên biệt vẽ toàn bộ các lớp trực tiếp từ trình duyệt:
 * - Khung hình video người nói (Tự động co về nửa dưới/trên khi có B-Roll để giữ trọn vẹn khuôn mặt)
 * - B-Roll hình ảnh/video thực tế kèm hiệu ứng chuyển động Ken Burns Slow Zoom (1.0x -> 1.06x)
 * - Thẻ tiêu đề Hook vàng gradient bo góc (Title Card)
 * - Logo thương hiệu góc trên kèm độ mờ đục (Brand Logo)
 * - Phụ đề Karaoke hoạt họa từ hiện tại (Active word highlight green/yellow)
 * - Nhãn dán chữ (Text Layers)
 */

import { getEmojiForWord } from './emojiEngine';

/**
 * 🔧 Chuyển đổi fontWeight từ tên CSS/Font Family sang giá trị Canvas 2D hợp lệ
 * Canvas 2D chỉ hiểu: 'normal', 'bold', hoặc số '100' - '900'
 * Nếu truyền 'Black', 'Heavy', 'ExtraBold' v.v. → Canvas sẽ REJECT toàn bộ ctx.font và dùng mặc định 10px!
 */
function mapFontWeightToCanvas(weight) {
  if (!weight) return '900';
  const w = String(weight).trim();
  // Nếu đã là số hợp lệ (100-900) thì giữ nguyên
  if (/^\d{3}$/.test(w)) return w;
  const map = {
    'Thin': '100', 'Hairline': '100',
    'ExtraLight': '200', 'UltraLight': '200',
    'Light': '300',
    'Regular': '400', 'normal': '400', 'Normal': '400',
    'Medium': '500',
    'SemiBold': '600', 'DemiBold': '600',
    'Bold': '700', 'bold': '700',
    'ExtraBold': '800', 'UltraBold': '800',
    'Black': '900', 'Heavy': '900', 'black': '900'
  };
  return map[w] || '900';
}

// Helper vẽ hình chữ nhật bo góc (Rounded Rectangle)
export function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Helper ngắt dòng chữ tự động theo độ rộng khung (Word Wrap)
export function wrapText(ctx, text, maxWidth) {
  const words = (text || '').split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * 1. Vẽ khung hình Video người nói (Base Speaker Video Frame)
 * 🔥 Tự động tính toán khung chứa (Viewport) khi B-Roll Split bật để giữ trọn vẹn khuôn mặt nhân vật!
 */
export function drawVideoFrame(
  ctx, 
  videoElement, 
  videoLayout = 'fill', 
  activeBrollConfig = null,
  cropOffsetX = 0,
  zoomScale = 1.0,
  targetWidth = 1080, 
  targetHeight = 1920,
  options = {}
) {
  if (options?.isAudioOnly || (videoElement && videoElement.videoWidth === 0)) {
    // 🎙️ Dynamic Audio Waveform Background for Audio-to-Video Workflow (Khớp 100% Preview)
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    grad.addColorStop(0, '#0c0e18');
    grad.addColorStop(0.5, '#141729');
    grad.addColorStop(1, '#1f1738');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Ambient radial glow top-left and bottom-right
    const radial1 = ctx.createRadialGradient(200, 300, 20, 200, 300, 550);
    radial1.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    radial1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial1;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const radial2 = ctx.createRadialGradient(targetWidth - 200, targetHeight - 400, 20, targetWidth - 200, targetHeight - 400, 550);
    radial2.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
    radial2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial2;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // If B-Roll is NOT covering full screen, draw Center Badge & Waveform
    const bStyle = activeBrollConfig?.style;
    const isSplitTop = bStyle === 'split_50_50_top' || bStyle === 'split_30_70_top';
    const isSplitBottom = bStyle === 'split_50_50_bottom' || bStyle === 'split_30_70_bottom';

    let cardCenterY = targetHeight * 0.44;
    if (isSplitTop) {
      cardCenterY = targetHeight * (bStyle === 'split_30_70_top' ? 0.62 : 0.74);
    } else if (isSplitBottom) {
      cardCenterY = targetHeight * 0.24;
    }

    if (bStyle !== 'full_cover') {
      ctx.save();
      ctx.translate(targetWidth / 2, cardCenterY);

      // 1. Spinning dashed glow ring around badge
      ctx.save();
      const spinAngle = (options.currentTime || 0) * 0.8;
      ctx.rotate(spinAngle);
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 14]);
      ctx.beginPath();
      ctx.arc(0, 0, 115, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Center Gradient Badge
      const badgeSize = 170;
      const bHalf = badgeSize / 2;
      const badgeGrad = ctx.createLinearGradient(-bHalf, -bHalf, bHalf, bHalf);
      badgeGrad.addColorStop(0, '#6366f1');
      badgeGrad.addColorStop(0.5, '#9333ea');
      badgeGrad.addColorStop(1, '#ec4899');

      ctx.save();
      ctx.shadowColor = 'rgba(147, 51, 234, 0.55)';
      ctx.shadowBlur = 35;
      drawRoundedRect(ctx, -bHalf, -bHalf, badgeSize, badgeSize, 38);
      ctx.fillStyle = badgeGrad;
      ctx.fill();
      ctx.restore();

      // Inner Dark Box
      const innerSize = badgeSize - 10;
      const inHalf = innerSize / 2;
      drawRoundedRect(ctx, -inHalf, -inHalf, innerSize, innerSize, 34);
      ctx.fillStyle = '#0d0f19';
      ctx.fill();

      // Draw Microphone Icon
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.fillStyle = '#ec4899';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
      ctx.shadowBlur = 15;

      // Mic Body
      drawRoundedRect(ctx, -18, -35, 36, 50, 18);
      ctx.stroke();

      // Mic Stand Arc
      ctx.beginPath();
      ctx.arc(0, -10, 30, 0, Math.PI);
      ctx.stroke();

      // Mic Base Stem
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(0, 38);
      ctx.moveTo(-20, 38);
      ctx.lineTo(20, 38);
      ctx.stroke();
      ctx.restore();

      // 3. Pill Badge "AUDIO STUDIO • VOICEOVER"
      const pillY = bHalf + 45;
      drawRoundedRect(ctx, -155, pillY - 18, 310, 36, 18);
      ctx.fillStyle = 'rgba(30, 27, 75, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing Green Dot
      ctx.beginPath();
      ctx.arc(-120, pillY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
      ctx.fill();

      // Pill Text
      ctx.font = '900 13px "Montserrat", sans-serif';
      ctx.fillStyle = '#c7d2fe';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('AUDIO STUDIO • VOICEOVER', 8, pillY);

      // 4. Title Text
      const titleY = pillY + 45;
      ctx.font = '900 24px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      const displayTitle = (options.customTitle || 'audio story').toUpperCase();
      ctx.fillText(displayTitle, 0, titleY);

      // 5. 16 Dynamic Waveform Bars
      const waveY = titleY + 55;
      const barCount = 16;
      const barW = 14;
      const gap = 10;
      const totalW = barCount * barW + (barCount - 1) * gap;
      const startX = -totalW / 2;

      const baseHeights = [30, 55, 45, 70, 85, 55, 65, 75, 65, 50, 75, 55, 65, 40, 50, 35];
      for (let i = 0; i < barCount; i++) {
        const hMult = Math.sin(((options.currentTime || 0) * 8) + i * 0.45) * 0.45 + 0.65;
        const barH = Math.max(10, (baseHeights[i] || 50) * 0.85 * hMult);
        const bx = startX + i * (barW + gap);
        const by = waveY - barH / 2;

        const barGrad = ctx.createLinearGradient(0, by + barH, 0, by);
        barGrad.addColorStop(0, '#6366f1');
        barGrad.addColorStop(0.5, '#a855f7');
        barGrad.addColorStop(1, '#ec4899');
        ctx.fillStyle = barGrad;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
        ctx.shadowBlur = 8;
        drawRoundedRect(ctx, bx, by, barW, barH, 7);
        ctx.fill();
      }

      ctx.restore();
    }
    return;
  }

  if (!videoElement || videoElement.readyState < 2) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    return;
  }

  const vw = videoElement.videoWidth || 1920;
  const vh = videoElement.videoHeight || 1080;

  // Xác định vị trí khung hiển thị của Video người nói
  let boxX = 0;
  let boxY = 0;
  let boxW = targetWidth;
  let boxH = targetHeight;

  const bStyle = activeBrollConfig?.style;
  if (bStyle === 'split_50_50_top') {
    // B-Roll ở 50% trên -> Video người nói ở 50% dưới (960px)
    boxY = Math.round(targetHeight * 0.5);
    boxH = Math.round(targetHeight * 0.5);
  } else if (bStyle === 'split_50_50_bottom') {
    // B-Roll ở 50% dưới -> Video người nói ở 50% trên
    boxY = 0;
    boxH = Math.round(targetHeight * 0.5);
  } else if (bStyle === 'split_30_70_top') {
    // B-Roll ở 30% trên -> Video người nói ở 70% dưới
    boxY = Math.round(targetHeight * 0.3);
    boxH = Math.round(targetHeight * 0.7);
  } else if (bStyle === 'split_30_70_bottom') {
    // B-Roll ở 30% dưới -> Video người nói ở 70% trên
    boxY = 0;
    boxH = Math.round(targetHeight * 0.7);
  } else if (bStyle === 'full_cover') {
    // B-Roll che toàn bộ màn hình -> Không cần vẽ video nền
    return;
  }

  if (videoLayout === 'fit' && !activeBrollConfig) {
    // Fit chế độ giữ nguyên tỷ lệ
    const scale = Math.min(targetWidth / vw, targetHeight / vh);
    const sw = vw * scale;
    const sh = vh * scale;
    const sx = (targetWidth - sw) / 2;
    const sy = (targetHeight - sh) / 2;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(videoElement, 0, 0, vw, vh, sx, sy, sw, sh);
  } else {
    // Fill chế độ object-cover trong vùng boxW x boxH có hỗ trợ Face Tracking Pan & Dynamic Micro-Zoom
    const targetAspect = boxW / boxH;
    let baseCropW, baseCropH, cropX, cropY;

    if (vw / vh > targetAspect) {
      baseCropH = vh;
      baseCropW = vh * targetAspect;
      const baseCenter = (vw - baseCropW) / 2;
      const panShift = (cropOffsetX || 0) * vw;
      cropX = Math.max(0, Math.min(vw - baseCropW, baseCenter + panShift));
      cropY = 0;
    } else {
      baseCropW = vw;
      baseCropH = vw / targetAspect;
      cropX = 0;
      cropY = (vh - baseCropH) / 2;
    }

    // Áp dụng tỉ lệ Dynamic Micro-Zoom (1.0x -> 1.05x)
    const z = Math.max(1.0, zoomScale || 1.0);
    const cropW = baseCropW / z;
    const cropH = baseCropH / z;
    const finalCropX = cropX + (baseCropW - cropW) / 2;
    const finalCropY = cropY + (baseCropH - cropH) / 2;

    ctx.drawImage(videoElement, finalCropX, finalCropY, cropW, cropH, boxX, boxY, boxW, boxH);
  }
}

/**
 * Nhóm các từ thành từng câu/cụm từ cố định (Phrase Groups)
 * Giúp phụ đề đứng yên 1 vị trí cố định trên màn hình, từng từ chuyển màu highlight (Karaoke)
 * Không bị nhảy từ, giật cục hoặc trượt lung tung!
 */
export function getKaraokePhraseGroup(words = [], currentTime = 0, maxWords = 5) {
  if (!words || words.length === 0) return null;

  const groups = [];
  let currentGroup = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    currentGroup.push(w);

    const isPunctuationBreak = /[.?!,]$/.test((w.word || '').trim());
    const nextWord = words[i + 1];
    const isPauseBreak = nextWord && (nextWord.start - w.end) > 0.6;
    const isFull = currentGroup.length >= maxWords;

    if (isPunctuationBreak || isPauseBreak || isFull || i === words.length - 1) {
      groups.push({
        start: currentGroup[0].start,
        end: currentGroup[currentGroup.length - 1].end,
        words: currentGroup
      });
      currentGroup = [];
    }
  }

  // 1. Tìm nhóm đang phát tại currentTime (chính xác theo khoảng thời gian phát âm)
  let activeGroup = groups.find(g => currentTime >= (g.start - 0.05) && currentTime <= (g.end + 0.20));
  
  // 2. Nếu ở khoảng dừng ngắn (< 0.4s), giữ lại nhóm vừa nói xong để tránh nhấp nháy
  if (!activeGroup) {
    const recent = groups.slice().reverse().find(g => currentTime >= g.end && (currentTime - g.end) <= 0.4);
    if (recent) {
      activeGroup = recent;
    }
  }

  return activeGroup || null;
}

/**
 * 2. Vẽ B-Roll thực tế (B-Roll Layer)
 * 🔥 Tích hợp hiệu ứng Ken Burns Slow Zoom (1.0x -> 1.08x) tạo chuyển động điện ảnh mượt mà cho ảnh tĩnh!
 */
export function drawBrollLayer(
  ctx, 
  brollMediaElement, 
  brollConfig, 
  currentTime = 0,
  targetWidth = 1080, 
  targetHeight = 1920,
  clipStartTime = 0
) {
  if (!brollMediaElement || !brollConfig) return;

  const style = brollConfig.style || 'split_30_70_top';
  const mw = brollMediaElement.videoWidth || brollMediaElement.naturalWidth || brollMediaElement.width || 1920;
  const mh = brollMediaElement.videoHeight || brollMediaElement.naturalHeight || brollMediaElement.height || 1080;

  // Tính toán Ken Burns Zoom cho ảnh tĩnh
  const isStillImage = !brollMediaElement.videoWidth; // là Image element
  let zoomFactor = 1.0;
  
  // Tính mốc bắt đầu thực tế của B-Roll
  const relCurrentTime = currentTime >= clipStartTime ? (currentTime - clipStartTime) : currentTime;
  const bStart = brollConfig.start ?? 0;
  const bDur = Math.max(0.5, brollConfig.duration ?? (brollConfig.end ? brollConfig.end - brollConfig.start : 4));
  
  const timeInBroll = Math.max(0, relCurrentTime - bStart);
  const progress = Math.max(0, Math.min(1, timeInBroll / bDur));
  
  if (isStillImage) {
    // Zoom nhẹ điện ảnh từ 1.0x -> 1.08x với gia tốc mượt mà
    zoomFactor = 1.0 + 0.08 * Math.sin(progress * Math.PI / 2);
  }

  // Helper crop-cover vẽ media vào hình chữ nhật (dx, dy, dw, dh) có hỗ trợ Ken Burns
  const drawCover = (dx, dy, dw, dh) => {
    const targetRatio = dw / dh;
    let baseW, baseH;
    if (mw / mh > targetRatio) {
      baseH = mh;
      baseW = mh * targetRatio;
    } else {
      baseW = mw;
      baseH = mw / targetRatio;
    }

    // Áp dụng zoomFactor
    const sw = baseW / zoomFactor;
    const sh = baseH / zoomFactor;
    const sx = (mw - sw) / 2;
    const sy = (mh - sh) / 2;

    ctx.drawImage(brollMediaElement, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  if (style === 'split_30_70_top') {
    const brollH = Math.round(targetHeight * 0.3); // 576px
    drawCover(0, 0, targetWidth, brollH);

    // Viền chuyển tiếp mờ nghệ thuật (ambient feather seam)
    const grad = ctx.createLinearGradient(0, brollH - 25, 0, brollH + 25);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, brollH - 25, targetWidth, 50);

    // Đường chỉ vàng nhẹ
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, brollH);
    ctx.lineTo(targetWidth - 30, brollH);
    ctx.stroke();
  } else if (style === 'split_30_70_bottom') {
    const brollH = Math.round(targetHeight * 0.3);
    const startY = targetHeight - brollH;
    drawCover(0, startY, targetWidth, brollH);
    const grad = ctx.createLinearGradient(0, startY - 25, 0, startY + 25);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, startY - 25, targetWidth, 50);
  } else if (style === 'split_50_50_top') {
    const brollH = Math.round(targetHeight * 0.5); // 960px
    drawCover(0, 0, targetWidth, brollH);

    // Viền giữa 50/50
    const grad = ctx.createLinearGradient(0, brollH - 30, 0, brollH + 30);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, brollH - 30, targetWidth, 60);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, brollH);
    ctx.lineTo(targetWidth - 20, brollH);
    ctx.stroke();
  } else if (style === 'split_50_50_bottom') {
    const brollH = Math.round(targetHeight * 0.5);
    drawCover(0, brollH, targetWidth, brollH);
  } else if (style === 'pip') {
    const pw = 420;
    const ph = 280;
    const px = targetWidth - pw - 40;
    const py = 120;
    ctx.save();
    drawRoundedRect(ctx, px, py, pw, ph, 24);
    ctx.clip();
    drawCover(px, py, pw, ph);
    ctx.restore();

    // Viền PIP bo góc
    ctx.save();
    drawRoundedRect(ctx, px, py, pw, ph, 24);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  } else {
    // Full cover / Background
    drawCover(0, 0, targetWidth, targetHeight);
  }
}

/**
 * 3. Vẽ Thẻ Tiêu Đề Vàng / Neon / Pill (Title Card)
 */
export function drawTitleCard(ctx, titleConfig, customTitle, targetWidth = 1080, targetHeight = 1920) {
  if (!titleConfig || titleConfig.visible === false) return;

  const posX = (titleConfig.pos?.x ?? 50) / 100 * targetWidth;
  const posY = (titleConfig.pos?.y ?? 10) / 100 * targetHeight;
  const scale = (titleConfig.scale ?? 100) / 100;
  const boxWidth = ((titleConfig.boxWidth ?? 280) * 3.4) * scale;
  const paddingY = ((titleConfig.paddingY ?? 6) * 3.5) * scale;
  const style = titleConfig.style || 'gradient_gold';
  const text = (customTitle || "TIÊU ĐỀ VIRAL CLIP").toUpperCase();

  ctx.save();
  ctx.translate(posX, posY);

  // Font setup with full Vietnamese glyph support
  const fontSize = Math.round(36 * scale * 1.1);
  ctx.font = `900 ${fontSize}px "Montserrat", "Be Vietnam Pro", "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTextWidth = boxWidth - 60;
  const lines = wrapText(ctx, text, maxTextWidth);
  const lineHeight = fontSize * 1.3;
  const boxHeight = lines.length * lineHeight + paddingY * 2 + 10;
  const rx = -boxWidth / 2;
  const ry = -boxHeight / 2;

  // Vẽ nền thẻ tiêu đề theo phong cách
  if (style === 'gradient_gold') {
    // Nền vàng Gradient Amber
    const grad = ctx.createLinearGradient(rx, ry, rx + boxWidth, ry + boxHeight);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(0.5, '#fde047');
    grad.addColorStop(1, '#f59e0b');

    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;

    drawRoundedRect(ctx, rx, ry, boxWidth, boxHeight, 28);
    ctx.fillStyle = grad;
    ctx.fill();

    // Viền vàng sáng
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Chữ màu đen in đậm
    ctx.fillStyle = '#000000';
  } else if (style === 'neon_cyber') {
    // Nền đen viền xanh Neon
    drawRoundedRect(ctx, rx, ry, boxWidth, boxHeight, 28);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 25;
    ctx.fill();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#6ee7b7';
  } else if (style === 'yellow_impact') {
    // 🌟 Nền đen viền vàng rực rỡ + Chữ vàng tươi nổi bật
    drawRoundedRect(ctx, rx, ry, boxWidth, boxHeight, 28);
    ctx.fillStyle = 'rgba(10, 12, 20, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fill();

    ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
  } else if (style === 'minimal') {
    // Nền đen mờ tối giản
    drawRoundedRect(ctx, rx, ry, boxWidth, boxHeight, 24);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 16;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
  } else {
    // Pill White mặc định
    drawRoundedRect(ctx, rx, ry, boxWidth, boxHeight, 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.fillStyle = '#000000';
  }

  // Vẽ các dòng chữ
  const startTextY = ry + paddingY + (lineHeight / 2) + 5;
  for (let i = 0; i < lines.length; i++) {
    const ly = startTextY + i * lineHeight;
    ctx.fillText(lines[i], 0, ly);
  }

  ctx.restore();
}

/**
 * 4. Vẽ Logo Thương Hiệu (Brand Logo)
 */
export function drawBrandLogo(ctx, brandConfig, logoImgElement, targetWidth = 1080, targetHeight = 1920) {
  if (!brandConfig || brandConfig.showLogo !== true) return;

  const posX = (brandConfig.pos?.x ?? 82) / 100 * targetWidth;
  const posY = (brandConfig.pos?.y ?? 6) / 100 * targetHeight;
  const opacity = (brandConfig.logoOpacity ?? 90) / 100;

  ctx.save();
  ctx.translate(posX, posY);
  ctx.globalAlpha = opacity;

  if (logoImgElement && (logoImgElement.complete || logoImgElement.naturalWidth > 0)) {
    const lw = (brandConfig.logoWidth || brandConfig.logoSize || 65) * 3.5;
    const lh = brandConfig.logoHeight ? brandConfig.logoHeight * 3.5 : (lw * (logoImgElement.naturalHeight / (logoImgElement.naturalWidth || 1)));
    ctx.drawImage(logoImgElement, -lw / 2, -lh / 2, lw, lh);
  } else {
    // Badge Logo Text mặc định ("OPUS STUDIO" hoặc "E")
    const text = (brandConfig.logoText || 'OPUS STUDIO').toUpperCase();
    const fontSize = Math.round((brandConfig.logoSize || 65) * 0.6);
    ctx.font = `900 ${fontSize}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tw = ctx.measureText(text).width + 40;
    const th = fontSize * 1.6 + 16;
    const rx = -tw / 2;
    const ry = -th / 2;

    drawRoundedRect(ctx, rx, ry, tw, th, 16);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

/**
 * 5. Vẽ Phụ Đề Karaoke Chuyển Động Chuẩn (Đồng Dạng 1:1 Bố Cục Không Gian 1080p, Active Word Pop/Glow, Không nhảy từ)
 */
export function drawKaraokeCaptions(
  ctx, 
  words = [], 
  captionConfig = {}, 
  fontStyle = {}, 
  currentTime = 0, 
  targetWidth = 1080, 
  targetHeight = 1920
) {
  if (!words || words.length === 0 || captionConfig.visible === false) return;

  // Lấy cụm từ cố định (Phrase Group) theo câu/nhóm tự nhiên
  const group = getKaraokePhraseGroup(words, currentTime, 5);
  if (!group || !group.words || group.words.length === 0) return;

  const activePhrase = group.words;

  // 📐 TỌA ĐỘ & TỶ LỆ BỐ CỤC KHÔNG GIAN ĐỒNG DẠNG (Spatial Coordinate & Proportion System)
  const posX = (parseFloat(captionConfig.pos?.x) || 50) / 100 * targetWidth;
  const posY = (parseFloat(captionConfig.pos?.y) || 84) / 100 * targetHeight;
  const rawScale = parseFloat(captionConfig.scale) || 100;
  const scale = rawScale / 100;
  const rawFontFamily = fontStyle.fontFamily || 'Montserrat';
  const cleanFontFamily = rawFontFamily.replace(/['"]/g, '');
  const fontWeight = mapFontWeightToCanvas(fontStyle.fontWeight) || '900';

  // 🌟 Cỡ chữ chuẩn viral 1080p (To rõ, sắc nét, chiếm 65-80% bề ngang khung hình)
  const rawFontSize = parseFloat(fontStyle.fontSize) || 40;
  let baseFontSize = Math.round(rawFontSize * 2.5 * scale);
  if (isNaN(baseFontSize) || baseFontSize < 68) baseFontSize = Math.max(68, Math.round(40 * 2.5 * scale)); // Safe fallback

  const textColor = fontStyle.textColor || '#ffffff';
  const highlightColor = fontStyle.highlightColor || '#22c55e';
  const effect = fontStyle.effect || captionConfig.effect || 'pop'; // 'pop' | 'pill' | 'glow'
  const isUppercase = fontStyle.isUppercase !== false && fontStyle.uppercase !== false;
  const showEmoji = fontStyle.aiEmoji === true || captionConfig.aiEmoji === true;
  
  // Xác định độ dày viền an toàn: giới hạn tối đa 10% cỡ chữ để không bao giờ bị nghẹt nét chữ
  const rawStrokeWidth = fontStyle.strokeWidth !== undefined ? parseFloat(fontStyle.strokeWidth) : (fontStyle.hasStroke === false ? 0 : 6);
  const strokeColor = fontStyle.strokeColor || '#000000';
  const maxSafeStroke = Math.round(baseFontSize * 0.10);
  const scaledStrokeWidth = (rawStrokeWidth && !isNaN(rawStrokeWidth) && rawStrokeWidth > 0) ? Math.min(maxSafeStroke, Math.max(2, Math.round(rawStrokeWidth * 1.2 * scale))) : 0;

  ctx.save();
  ctx.translate(posX, posY);

  // ÉP BUỘC CHUỖI FONT CỰC KỲ CHUẨN XÁC ĐỂ TRÁNH TRÌNH DUYỆT TỪ CHỐI (FALLBACK 10px)
  ctx.font = `${fontWeight} ${baseFontSize}px "${cleanFontFamily}", "Be Vietnam Pro", "Inter", "Segoe UI", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Đo đạc kích thước từng từ
  let spaceWidth = ctx.measureText(' ').width;
  const wordMetrics = activePhrase.map(w => {
    let cleanWord = (w.word || '').trim().replace(/^["']+|["']+$/g, '');
    const rawText = isUppercase ? cleanWord.toUpperCase() : cleanWord;
    const isCurrent = currentTime >= (Number(w.start) - 0.05) && currentTime <= (Number(w.end) + 0.05);
    const emoji = (showEmoji && isCurrent) ? (w.emoji || getEmojiForWord(cleanWord)) : null;
    return {
      text: rawText,
      width: ctx.measureText(rawText).width,
      isCurrent,
      emoji
    };
  });

  let rawTotalWidth = wordMetrics.reduce((sum, item) => sum + item.width, 0) + (wordMetrics.length - 1) * spaceWidth;
  
  // 📐 Thuật toán Auto-Fit Safe Margin: Nếu cụm từ quá dài (> 960px), tự động co nhẹ cỡ chữ vừa khít khung hình
  const maxAllowedWidth = targetWidth - 120;
  if (rawTotalWidth > maxAllowedWidth) {
    const autoFitRatio = Math.max(0.70, maxAllowedWidth / rawTotalWidth);
    baseFontSize = Math.round(baseFontSize * autoFitRatio);
    ctx.font = `${fontWeight} ${baseFontSize}px "${cleanFontFamily}", "Be Vietnam Pro", "Inter", "Segoe UI", sans-serif`;
    spaceWidth = ctx.measureText(' ').width;
    wordMetrics.forEach(item => {
      item.width = ctx.measureText(item.text).width;
    });
    rawTotalWidth = wordMetrics.reduce((sum, item) => sum + item.width, 0) + (wordMetrics.length - 1) * spaceWidth;
  }

  let currX = -rawTotalWidth / 2;

  // Vẽ từng từ trong cụm từ
  for (const item of wordMetrics) {
    ctx.save();
    const wordCenterX = currX + item.width / 2;

    if (item.isCurrent) {
      // 🌟 HIỆU ỨNG TỪ ĐANG PHÁT (ACTIVE WORD)
      
      if (effect === 'pill') {
        // 💊 Hiệu ứng Pill-Box: Hộp nền vàng/đỏ bo góc ôm từ
        const pillPadX = 20 * scale;
        const pillPadY = 10 * scale;
        const pillW = item.width + pillPadX * 2;
        const pillH = baseFontSize * 1.35 + pillPadY * 2;
        const pillX = currX - pillPadX;
        const pillY = -pillH / 2;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 4;
        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 18 * scale);
        ctx.fillStyle = fontStyle.pillBgColor || '#facc15';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = fontStyle.pillTextColor || '#000000';
        ctx.fillText(item.text, currX, 0);

      } else if (effect === 'glow') {
        // ✨ Hiệu ứng Cyberpunk Neon Glow
        ctx.translate(wordCenterX, 0);
        ctx.scale(1.16, 1.16);
        ctx.translate(-wordCenterX, 0);

        ctx.shadowColor = fontStyle.glowColor || highlightColor || '#00f0ff';
        ctx.shadowBlur = 28;

        if (scaledStrokeWidth > 0) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = scaledStrokeWidth * 1.3;
          ctx.lineJoin = 'round';
          ctx.strokeText(item.text, currX, 0);
        }

        ctx.fillStyle = highlightColor || '#00f0ff';
        ctx.fillText(item.text, currX, 0);

      } else {
        // 💥 Hiệu ứng Word-Pop / Mặc định (Tôn trọng fontStyle của người dùng)
        const isHighlightActive = fontStyle.hasHighlight !== false;
        
        if (isHighlightActive) {
          ctx.translate(wordCenterX, 0);
          ctx.scale(1.20, 1.20);
          ctx.translate(-wordCenterX, 0);
        }

        if (scaledStrokeWidth > 0) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = scaledStrokeWidth * 1.2;
          ctx.lineJoin = 'round';
          ctx.strokeText(item.text, currX, 0);
        }

        if (fontStyle.hasShadow !== false && scaledStrokeWidth === 0) {
          ctx.shadowColor = fontStyle.shadowColor || 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 14;
        }

        ctx.fillStyle = isHighlightActive ? highlightColor : textColor;
        ctx.fillText(item.text, currX, 0);
      }

      // 😃 Vẽ Emoji sinh động phía trên từ đang phát nếu bật aiEmoji
      if (item.emoji) {
        ctx.save();
        ctx.font = `${Math.round(baseFontSize * 0.95)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(item.emoji, wordCenterX, -baseFontSize * 0.65);
        ctx.restore();
      }

    } else {
      // ⚪ TỪ XUNG QUANH (INACTIVE WORDS)
      if (scaledStrokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = scaledStrokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(item.text, currX, 0);
      }

      if (fontStyle.hasShadow !== false && scaledStrokeWidth === 0) {
        ctx.shadowColor = fontStyle.shadowColor || 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.fillStyle = textColor;
      ctx.fillText(item.text, currX, 0);
    }

    ctx.restore();
    currX += item.width + spaceWidth;
  }

  ctx.restore();
}

/**
 * 6. Vẽ Nhãn Dán Chữ Tùy Biến (Custom Text Layers) - Có hỗ trợ mốc bắt đầu (startTime) & thời lượng (duration)
 */
export function drawSingleTextLayer(ctx, tl, currentTime = 0, clipStartTime = 0, targetWidth = 1080, targetHeight = 1920) {
  const textObj = typeof tl === 'string' ? { text: tl, pos: { x: 50, y: 50 }, scale: 100, style: 'plain' } : tl;
  if (!textObj || !textObj.text) return;
  if (textObj.visible === false) return;

  const relTime = currentTime >= clipStartTime ? (currentTime - clipStartTime) : currentTime;
  const tStart = textObj.startTime ?? 0;
  const tDur = textObj.duration ?? 999;
  if (currentTime > 0 && (relTime < (tStart - 0.05) || relTime > (tStart + tDur + 0.05))) {
    return;
  }

  const posX = (textObj.pos?.x ?? 50) / 100 * targetWidth;
  const posY = (textObj.pos?.y ?? 50) / 100 * targetHeight;
  const scale = (textObj.scale ?? 100) / 100;
  const rawFontSize = textObj.fontSize || 42;
  const fontSize = Math.round(rawFontSize * scale * 1.05);
  const fontFamily = textObj.fontFamily || 'Montserrat';
  const fontWeight = mapFontWeightToCanvas(textObj.fontWeight);
  const displayText = textObj.isUppercase ? textObj.text.toUpperCase() : textObj.text;

  // Calculate In / Out Animation Progress
  let animAlpha = 1.0;
  let animOffsetX = 0;
  let animOffsetY = 0;
  let animScaleMult = 1.0;
  let textToDraw = displayText;

  const animInType = textObj.animIn || 'pop';
  const animInDur = textObj.animInDuration ?? 0.35;
  const animOutType = textObj.animOut || 'fade_out';
  const animOutDur = textObj.animOutDuration ?? 0.35;

  const timeSinceStart = relTime - tStart;
  const timeUntilEnd = (tStart + tDur) - relTime;

  if (currentTime > 0) {
    // 1. Entrance (In) Animation
    if (timeSinceStart < animInDur && animInType !== 'none') {
      const p = Math.max(0, Math.min(1, timeSinceStart / animInDur));
      if (animInType === 'pop') {
        const bounce = p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15;
        animScaleMult = Math.max(0, bounce);
        animAlpha = Math.min(1, p * 1.5);
      } else if (animInType === 'fade_in') {
        animAlpha = p;
      } else if (animInType === 'slide_up') {
        animOffsetY = (1 - p) * 50;
        animAlpha = p;
      } else if (animInType === 'slide_left') {
        animOffsetX = -(1 - p) * 60;
        animAlpha = p;
      } else if (animInType === 'typewriter') {
        const charCount = Math.max(1, Math.floor(p * displayText.length));
        textToDraw = displayText.slice(0, charCount);
      } else if (animInType === 'bounce') {
        animScaleMult = Math.sin(p * Math.PI * 1.5);
        animAlpha = p;
      }
    }
    // 2. Exit (Out) Animation
    else if (timeUntilEnd < animOutDur && animOutType !== 'none') {
      const p = Math.max(0, Math.min(1, (animOutDur - timeUntilEnd) / animOutDur));
      if (animOutType === 'fade_out') {
        animAlpha = 1 - p;
      } else if (animOutType === 'zoom_out') {
        animScaleMult = Math.max(0, 1 - p * 0.8);
        animAlpha = 1 - p;
      } else if (animOutType === 'slide_down') {
        animOffsetY = p * 50;
        animAlpha = 1 - p;
      } else if (animOutType === 'slide_right') {
        animOffsetX = p * 60;
        animAlpha = 1 - p;
      }
    }
  }

  if (animAlpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, animAlpha));
  ctx.translate(posX + animOffsetX, posY + animOffsetY);
  if (animScaleMult !== 1.0) {
    ctx.scale(animScaleMult, animScaleMult);
  }
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textMetrics = ctx.measureText(textToDraw);
  const textW = textMetrics.width;
  const textH = fontSize * 1.2;

  if (textObj.style === 'neon_tag') {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    drawRoundedRect(ctx, -textW / 2 - 20, -textH / 2 - 8, textW + 40, textH + 16, 24);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.fillText(textToDraw, 0, 0);
  } else if (textObj.style === 'gradient_badge') {
    const grad = ctx.createLinearGradient(-textW / 2, 0, textW / 2, 0);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#f43f5e');
    grad.addColorStop(1, '#f59e0b');

    ctx.save();
    ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
    ctx.shadowBlur = 20;
    drawRoundedRect(ctx, -textW / 2 - 24, -textH / 2 - 10, textW + 48, textH + 20, 20);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(textToDraw, 0, 0);
  } else if (textObj.style === 'callout_box') {
    ctx.fillStyle = 'rgba(18, 20, 31, 0.92)';
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 18;
    drawRoundedRect(ctx, -textW / 2 - 22, -textH / 2 - 10, textW + 44, textH + 20, 20);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#3b4263';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(textToDraw, 0, 0);
  } else {
    const strokeW = textObj.strokeWidth !== undefined ? textObj.strokeWidth : 6;
    if (strokeW > 0) {
      ctx.strokeStyle = textObj.strokeColor || '#000000';
      ctx.lineWidth = strokeW;
      ctx.lineJoin = 'round';
      ctx.strokeText(textToDraw, 0, 0);
    }

    if (textObj.hasShadow !== false) {
      ctx.shadowColor = textObj.shadowColor || 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
    }

    ctx.fillStyle = textObj.textColor || textObj.color || (textObj.style === 'yellow_impact' ? '#facc15' : '#ffffff');
    ctx.fillText(textToDraw, 0, 0);
  }

  ctx.restore();
}

export function drawTextLayers(ctx, textLayers = [], currentTime = 0, clipStartTime = 0, targetWidth = 1080, targetHeight = 1920) {
  if (!textLayers || textLayers.length === 0) return;
  for (const tl of textLayers) {
    drawSingleTextLayer(ctx, tl, currentTime, clipStartTime, targetWidth, targetHeight);
  }
}

/**
 * 7. Vẽ Animation Đồ Họa Động (Animated Callouts & Stickers)
 */
export function drawSingleAnimatedSticker(ctx, stk, currentTime = 0, clipStartTime = 0, targetWidth = 1080, targetHeight = 1920) {
  if (!stk || stk.visible === false) return;

  const relTime = Math.max(0, currentTime - clipStartTime);
  const sStart = stk.startTime ?? 0;
  const sDur = stk.duration ?? 4;
  if (relTime < sStart || relTime > (sStart + sDur)) return;

  const dt = relTime - sStart;
  const posX = (stk.pos?.x ?? 50) / 100 * targetWidth;
  const posY = (stk.pos?.y ?? 50) / 100 * targetHeight;
  const scale = (stk.scale ?? 100) / 100;
  const r = Math.round(55 * scale * 1.5);

  const timeSinceStkStart = relTime - sStart;
  const timeUntilStkEnd = (sStart + sDur) - relTime;
  let stkAlpha = 1.0;
  let stkScaleMult = 1.0;

  if (timeSinceStkStart < 0.35) {
    const p = Math.max(0, Math.min(1, timeSinceStkStart / 0.35));
    const bounce = p < 0.7 ? (p / 0.7) * 1.2 : 1.2 - ((p - 0.7) / 0.3) * 0.2;
    stkScaleMult = Math.max(0, bounce);
    stkAlpha = Math.min(1, p * 1.5);
  } else if (timeUntilStkEnd < 0.35) {
    const p = Math.max(0, Math.min(1, (0.35 - timeUntilStkEnd) / 0.35));
    stkScaleMult = Math.max(0, 1 - p * 0.6);
    stkAlpha = 1 - p;
  }

  if (stkAlpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = stkAlpha;
  ctx.translate(posX, posY);
  if (stkScaleMult !== 1.0) {
    ctx.scale(stkScaleMult, stkScaleMult);
  }

  if (stk.type === 'circle_red') {
    const pulse = 1.0 + Math.sin(dt * 5) * 0.04;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    const progress = Math.min(1.0, dt / 0.5);
    const angle = progress * Math.PI * 2.1;
    ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + angle);
    ctx.stroke();

  } else if (stk.type === 'check_green') {
    const bounce = dt < 0.4 ? Math.min(1.2, dt / 0.3 * 1.2) : (1.0 + Math.sin(dt * 3) * 0.03);
    ctx.scale(bounce, bounce);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 6 * scale;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, 0);
    ctx.lineTo(-r * 0.1, r * 0.35);
    ctx.lineTo(r * 0.45, -r * 0.35);
    ctx.stroke();

  } else if (stk.type === 'arrow_red' || stk.type === 'arrow_yellow') {
    const bob = Math.sin(dt * 6) * 12;
    ctx.translate(bob, 0);
    const arrowColor = stk.type === 'arrow_red' ? '#ef4444' : '#facc15';

    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = arrowColor;
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 0.5, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r * 0.1, -r * 0.4);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(r * 0.1, r * 0.4);
    ctx.stroke();

  } else if (stk.type === 'cross_red') {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.4);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.4, -r * 0.4);
    ctx.lineTo(-r * 0.4, r * 0.4);
    ctx.stroke();

  } else if (stk.type === 'star_sparkle') {
    const spin = dt * 1.5;
    const pulse = 1.0 + Math.sin(dt * 4) * 0.15;
    ctx.rotate(spin);
    ctx.scale(pulse, pulse);

    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 24;

    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fill();

  } else if (stk.type === 'question_mark') {
    const bob = Math.sin(dt * 5) * 8;
    ctx.translate(0, bob);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(r * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 0);

  } else if (stk.type === 'focus_box_red') {
    const pulse = 1.0 + Math.sin(dt * 5) * 0.03;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 8 * scale;
    ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
    ctx.shadowBlur = 16;
    drawRoundedRect(ctx, -r * 1.3, -r * 0.9, r * 2.6, r * 1.8, 20);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawAnimatedStickers(ctx, animatedStickers = [], currentTime = 0, clipStartTime = 0, targetWidth = 1080, targetHeight = 1920) {
  if (!animatedStickers || animatedStickers.length === 0) return;
  for (const stk of animatedStickers) {
    drawSingleAnimatedSticker(ctx, stk, currentTime, clipStartTime, targetWidth, targetHeight);
  }
}

/**
 * 8.5. Vẽ Hiệu Ứng Chuyển Cảnh Transition Overlay (Flash White, Glitch, Zoom In, Blur, Fade Black, Circle Wipe)
 * 🔥 Đồng bộ 100% độ mượt mà và cảm giác điện ảnh như trên bản Preview!
 */
export function drawTransitionOverlay(ctx, effect = 'none', targetWidth = 1080, targetHeight = 1920, progress = 0) {
  if (!effect || effect === 'none' || progress <= 0) return;

  ctx.save();
  const clampedProg = Math.max(0, Math.min(1, progress));

  if (effect === 'blur') {
    // 🌫️ Hiệu ứng Blur Overlay: Lớp phủ mờ nhẹ 10% đen giống hệt bg-black/10 trong Preview
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

  } else if (effect === 'fade_black') {
    // 🖤 Hiệu ứng Fade Black: Màn hình đen 100% giống hệt bg-black trong Preview
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

  } else if (effect === 'flash_white') {
    // ⚡ Hiệu ứng Flash White: Chớp sáng rực rỡ trắng rồi tan dần
    const flashAlpha = Math.pow(clampedProg, 1.2) * 0.95;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

  } else if (effect === 'zoom_in') {
    // 🔍 Hiệu ứng Zoom In: Vòng sóng viền neon 9:16 phóng to tạo điểm nhấn
    const r = Math.max(80, targetWidth * 0.5 * (1.15 - clampedProg * 0.6) * 1.4);
    ctx.strokeStyle = `rgba(129, 140, 248, ${clampedProg * 0.85})`;
    ctx.lineWidth = Math.max(6, 28 * clampedProg);
    ctx.shadowColor = 'rgba(99, 102, 241, 0.9)';
    ctx.shadowBlur = 32;
    ctx.beginPath();
    ctx.arc(targetWidth / 2, targetHeight / 2, r, 0, Math.PI * 2);
    ctx.stroke();

  } else if (effect === 'glitch') {
    // 👾 Hiệu ứng Glitch Cyber: Sóng nhiễu màu tím xanh
    ctx.fillStyle = `rgba(99, 102, 241, ${clampedProg * 0.35})`;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const sliceY = (Math.sin(clampedProg * 18) * 0.5 + 0.5) * targetHeight;
    ctx.fillStyle = `rgba(236, 72, 153, ${clampedProg * 0.3})`;
    ctx.fillRect(0, sliceY - 50, targetWidth, 100);

  } else if (effect === 'circle_wipe') {
    // ⭕ Hiệu ứng Circle Wipe quét mở rộng vòng tròn
    const wipeRadius = Math.max(0, (1 - clampedProg) * targetHeight * 0.85);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(0, 0, targetWidth, targetHeight);
    ctx.arc(targetWidth / 2, targetHeight / 2, wipeRadius, 0, Math.PI * 2, true);
    ctx.fill();

  } else if (effect === 'flat_slide') {
    // ⬅️ Hiệu ứng Trượt màn che đen
    const slideW = (1 - clampedProg) * targetWidth;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, slideW, targetHeight);
  }

  ctx.restore();
}

/**
 * 🌟 HÀM TỔNG HỢP: VẼ HOÀN CHỈNH 1 KHUNG HÌNH (RENDER COMPOSITED FRAME)
 * 🔥 Hỗ trợ Đầy Đủ Thứ Tự Sắp Xếp Đè Lớp Toàn Diện (layerOrder) giữa TẤT CẢ các loại lớp!
 */
export function renderCompositedFrame(ctx, options = {}) {
  const {
    videoElement,
    videoLayout = 'fill',
    activeBrollMediaElement = null,
    activeBrollConfig = null,
    titleConfig = null,
    customTitle = '',
    isTitleVisible = false,
    brandConfig = null,
    logoImgElement = null,
    words = [],
    captionConfig = null,
    fontStyle = null,
    textLayers = [],
    animatedStickers = [],
    currentTransitionEffect = 'none',
    transitionProgress = 0,
    currentTime = 0,
    clipStartTime = 0,
    layerOrder = null,
    targetWidth = 1080,
    targetHeight = 1920
  } = options;

  // 1. Xóa khung hình sạch
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // 2. Đăng ký các hàm vẽ cho từng thành phần (Layer Registry)
  const isTransitionBlur = currentTransitionEffect === 'blur' && transitionProgress > 0;
  const blurAmountPx = isTransitionBlur ? Math.round(transitionProgress * 32) : 0;

  const drawMap = {
    'layer_base_video': () => {
      if (isTransitionBlur && blurAmountPx > 0) {
        ctx.save();
        ctx.filter = `blur(${blurAmountPx}px)`;
        drawVideoFrame(ctx, videoElement, videoLayout, activeBrollConfig, options.cropOffsetX || 0, options.zoomScale || 1.0, targetWidth, targetHeight, options);
        ctx.restore();
      } else {
        drawVideoFrame(ctx, videoElement, videoLayout, activeBrollConfig, options.cropOffsetX || 0, options.zoomScale || 1.0, targetWidth, targetHeight, options);
      }
    },
    'layer_broll': () => {
      if (activeBrollMediaElement && activeBrollConfig) {
        if (isTransitionBlur && blurAmountPx > 0) {
          ctx.save();
          ctx.filter = `blur(${blurAmountPx}px)`;
          drawBrollLayer(ctx, activeBrollMediaElement, activeBrollConfig, currentTime, targetWidth, targetHeight, clipStartTime);
          ctx.restore();
        } else {
          drawBrollLayer(ctx, activeBrollMediaElement, activeBrollConfig, currentTime, targetWidth, targetHeight, clipStartTime);
        }
      }
    },
    'layer_transitions': () => {
      if (currentTransitionEffect && currentTransitionEffect !== 'none' && transitionProgress > 0) {
        drawTransitionOverlay(ctx, currentTransitionEffect, targetWidth, targetHeight, transitionProgress);
      }
    },
    'layer_captions': () => {
      // BUG #2 + #4 FIX: Filter excluded words using local index matching clip scope
      const excludedSet = options.excludedWordIndices || new Set();
      const clipEndTime = clipStartTime + (options.clipDuration || 999999);
      const rawClipWords = (words || []).filter(w => w.start >= (clipStartTime - 0.2) && w.end <= (clipEndTime + 0.5));
      const clipWords = rawClipWords.filter((w, localIdx) => !excludedSet.has(localIdx));
      drawKaraokeCaptions(ctx, clipWords, captionConfig || {}, fontStyle || {}, currentTime, targetWidth, targetHeight);
    },
    'layer_title': () => {
      if (isTitleVisible && titleConfig?.visible !== false) {
        drawTitleCard(ctx, titleConfig, customTitle, targetWidth, targetHeight);
      }
    },
    'layer_logo': () => {
      if (brandConfig && brandConfig.showLogo === true) {
        drawBrandLogo(ctx, brandConfig, logoImgElement, targetWidth, targetHeight);
      }
    }
  };

  // Đăng ký từng Text Layer riêng lẻ
  (textLayers || []).forEach((tl, idx) => {
    const textId = (tl && tl.id) ? tl.id : `tl_${idx}`;
    drawMap[textId] = () => drawSingleTextLayer(ctx, tl, currentTime, clipStartTime, targetWidth, targetHeight);
  });

  // Đăng ký từng Animated Sticker riêng lẻ
  (animatedStickers || []).forEach((stk, idx) => {
    const stkId = (stk && stk.id) ? stk.id : `stk_${idx}`;
    drawMap[stkId] = () => drawSingleAnimatedSticker(ctx, stk, currentTime, clipStartTime, targetWidth, targetHeight);
  });

  // 3. Quyết định thứ tự thực thi vẽ từ ĐÁY [0] lên ĐỈNH [N]
  let executionOrder = [];
  if (Array.isArray(layerOrder) && layerOrder.length > 0) {
    executionOrder = [...layerOrder];
    if (!executionOrder.includes('layer_base_video')) {
      executionOrder.unshift('layer_base_video');
    }
    // Bổ sung các layer chưa có trong danh sách order
    Object.keys(drawMap).forEach(key => {
      if (!executionOrder.includes(key)) {
        executionOrder.push(key);
      }
    });
  } else {
    // Thứ tự mặc định an toàn:
    // Base Video ➔ B-Roll ➔ Captions ➔ Transitions ➔ Title ➔ Logo ➔ Text ➔ Stickers
    executionOrder = [
      'layer_base_video',
      'layer_broll',
      'layer_captions',
      'layer_transitions',
      'layer_title',
      'layer_logo',
      ...(textLayers || []).map((tl, i) => (tl && tl.id) ? tl.id : `tl_${i}`),
      ...(animatedStickers || []).map((stk, i) => (stk && stk.id) ? stk.id : `stk_${i}`)
    ];
  }

  // 4. Vẽ tuần tự theo thứ tự lớp (Layer nào ở trên sẽ đè lên layer ở dưới!)
  for (const layerId of executionOrder) {
    if (typeof drawMap[layerId] === 'function') {
      drawMap[layerId]();
    }
  }
}
