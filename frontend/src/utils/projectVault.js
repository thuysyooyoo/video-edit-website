/**
 * 🗄️ INDEXEDDB PROJECT VAULT (100% Client-Side Pure Storage)
 * Lưu trữ không giới hạn dự án, file video/âm thanh blob và cấu hình chỉnh sửa trong trình duyệt
 */

const DB_NAME = 'OpusAIStudioVault';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_MEDIA = 'media_blobs';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * 💾 Lưu dự án vào IndexedDB
 */
export async function saveProjectToVault(projectData) {
  const db = await openDatabase();
  const projectId = projectData.id || `proj_${Date.now()}`;
  const now = new Date().toISOString();

  // 1. Nếu có file media gốc (Blob/File), lưu riêng vào store media
  if (projectData.mediaFile instanceof Blob) {
    const mediaTx = db.transaction(STORE_MEDIA, 'readwrite');
    const mediaStore = mediaTx.objectStore(STORE_MEDIA);
    await new Promise((resolve, reject) => {
      const req = mediaStore.put({
        id: `media_${projectId}`,
        blob: projectData.mediaFile,
        name: projectData.video_metadata?.title || 'Media File',
        type: projectData.mediaFile.type
      });
      req.onsuccess = resolve;
      req.onerror = reject;
    });
  }

  // 2. Lưu thông tin dự án
  const projectRecord = {
    ...projectData,
    id: projectId,
    updatedAt: now,
    createdAt: projectData.createdAt || now,
    // Không lưu blob URL (vì blob URL mất hiệu lực khi F5), chỉ lưu cờ có media
    hasStoredMedia: !!projectData.mediaFile
  };

  delete projectRecord.mediaFile; // Tách riêng để tối ưu truy vấn danh sách

  const tx = db.transaction(STORE_PROJECTS, 'readwrite');
  const store = tx.objectStore(STORE_PROJECTS);
  await new Promise((resolve, reject) => {
    const req = store.put(projectRecord);
    req.onsuccess = resolve;
    req.onerror = reject;
  });

  return projectRecord;
}

/**
 * 📂 Tải một dự án từ IndexedDB kèm khôi phục Blob URL
 */
export async function loadProjectFromVault(projectId) {
  const db = await openDatabase();

  // 1. Đọc metadata dự án
  const tx = db.transaction(STORE_PROJECTS, 'readonly');
  const store = tx.objectStore(STORE_PROJECTS);
  const project = await new Promise((resolve, reject) => {
    const req = store.get(projectId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });

  if (!project) return null;

  // 2. Khôi phục Media Blob nếu có
  if (project.hasStoredMedia) {
    const mediaTx = db.transaction(STORE_MEDIA, 'readonly');
    const mediaStore = mediaTx.objectStore(STORE_MEDIA);
    const mediaRecord = await new Promise((resolve) => {
      const req = mediaStore.get(`media_${projectId}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (mediaRecord && mediaRecord.blob) {
      const freshBlobUrl = URL.createObjectURL(mediaRecord.blob);
      project.mediaFile = mediaRecord.blob;
      if (project.video_metadata) {
        project.video_metadata.blob_url = freshBlobUrl;
        project.video_metadata.video_path = freshBlobUrl;
      }
    }
  }

  return project;
}

/**
 * 📋 Lấy danh sách toàn bộ dự án đã lưu
 */
export async function listProjectsFromVault() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_PROJECTS, 'readonly');
  const store = tx.objectStore(STORE_PROJECTS);

  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      // Sắp xếp dự án mới nhất lên đầu
      list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      resolve(list);
    };
    req.onerror = reject;
  });
}

/**
 * 🗑️ Xóa dự án khỏi IndexedDB
 */
export async function deleteProjectFromVault(projectId) {
  const db = await openDatabase();

  const tx = db.transaction([STORE_PROJECTS, STORE_MEDIA], 'readwrite');
  tx.objectStore(STORE_PROJECTS).delete(projectId);
  tx.objectStore(STORE_MEDIA).delete(`media_${projectId}`);

  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}
