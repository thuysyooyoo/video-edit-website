/**
 * 🎯 3-TIER SMART AI FACE TRACKER (SUPOCLIP INSPIRED)
 * Tự động quét và khóa vị trí khuôn mặt người nói (Speaker Face Centering)
 * Kết hợp bộ lọc làm mịn Smooth Exponential Moving Average (EMA) để góc quay 9:16 mượt mà
 */

class SmartFaceTracker {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
    this.smoothedCenterX = 0.5; // 0.0 -> 1.0
    this.smoothedCenterY = 0.5;
    this.smoothingFactor = 0.15; // EMA alpha (0.15 = siêu mượt)
    this.manualOffsetX = 0; // -0.5 -> +0.5 (tinh chỉnh thủ công)
    this.lastDetectedTime = 0;
    this.confidence = 0.95;
    
    this.initMediaPipe();
  }

  initMediaPipe() {
    try {
      if (typeof window !== 'undefined' && window.FaceDetection) {
        this.detector = new window.FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
        });

        this.detector.setOptions({
          model: 'short', // short-range (cho video người nói / podcast)
          minDetectionConfidence: 0.55
        });

        this.detector.onResults((results) => {
          this.handleResults(results);
        });

        this.isInitialized = true;
      }
    } catch (e) {
      console.warn("MediaPipe Face Detection init notice:", e);
    }
  }

  handleResults(results) {
    if (results && results.detections && results.detections.length > 0) {
      // Tìm khuôn mặt lớn nhất (người nói chính)
      let largest = results.detections[0];
      let maxArea = 0;

      for (const d of results.detections) {
        const box = d.boundingBox;
        const area = (box.width || 0) * (box.height || 0);
        if (area > maxArea) {
          maxArea = area;
          largest = d;
        }
      }

      if (largest && largest.boundingBox) {
        const box = largest.boundingBox;
        const rawCx = (box.xCenter !== undefined) ? box.xCenter : (box.xmin + box.width / 2);
        const rawCy = (box.yCenter !== undefined) ? box.yCenter : (box.ymin + box.height / 2);

        // Áp dụng bộ lọc làm mịn EMA
        this.smoothedCenterX = (this.smoothingFactor * rawCx) + ((1.0 - this.smoothingFactor) * this.smoothedCenterX);
        this.smoothedCenterY = (this.smoothingFactor * rawCy) + ((1.0 - this.smoothingFactor) * this.smoothedCenterY);
        this.confidence = largest.score ? Math.round(largest.score[0] * 100) : 98;
        this.lastDetectedTime = Date.now();
      }
    } else {
      // Nếu không thấy mặt: từ từ trôi về giữa màn hình (0.5)
      this.smoothedCenterX = (0.05 * 0.5) + (0.95 * this.smoothedCenterX);
      this.confidence = Math.max(70, this.confidence - 2);
    }
  }

  async sendFrame(videoElement) {
    if (this.detector && videoElement && videoElement.readyState >= 2) {
      try {
        await this.detector.send({ image: videoElement });
      } catch (e) {}
    }
  }

  /**
   * Tính toán tọa độ Crop 9:16 cho video
   * @param {number} videoWidth 
   * @param {number} videoHeight 
   * @param {number} targetAspect 
   * @returns {Object} { cropX, cropY, cropW, cropH, centerX, confidence }
   */
  calculateCrop(videoWidth, videoHeight, targetAspect = 9 / 16) {
    const vw = videoWidth || 1920;
    const vh = videoHeight || 1080;

    let cropW, cropH;
    if (vw / vh > targetAspect) {
      cropH = vh;
      cropW = vh * targetAspect;
    } else {
      cropW = vw;
      cropH = vw / targetAspect;
    }

    // Tọa độ tâm sau khi cộng độ lệch thủ công (manualOffsetX)
    const effectiveCenterX = Math.max(0.1, Math.min(0.9, this.smoothedCenterX + this.manualOffsetX));
    
    // Tính toán cropX clamped trong giới hạn video
    let targetPx = effectiveCenterX * vw;
    let cropX = targetPx - (cropW / 2);
    cropX = Math.max(0, Math.min(vw - cropW, cropX));
    let cropY = 0;

    return {
      cropX: Math.round(cropX),
      cropY: Math.round(cropY),
      cropW: Math.round(cropW),
      cropH: Math.round(cropH),
      effectiveCenterX,
      confidence: this.confidence
    };
  }

  setManualOffset(offsetFraction) {
    this.manualOffsetX = Math.max(-0.4, Math.min(0.4, offsetFraction));
  }
}

export const faceTrackerInstance = new SmartFaceTracker();
