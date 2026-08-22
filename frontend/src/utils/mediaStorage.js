/**
 * 💾 INDEXEDDB MEDIA STORAGE (100% Client-Side Pure Browser DB)
 * Lưu trữ file video/audio gốc (Blob/File) trực tiếp trong trình duyệt (hỗ trợ nhiều GB).
 * Đảm bảo khi F5 hoặc Ctrl+F5, video vẫn được khôi phục nguyên vẹn 100%, không bao giờ mất hình!
 */

const DB_NAME = 'OpusStudioMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaToIndexedDB(key, fileOrBlob) {
  if (!fileOrBlob) return false;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileOrBlob, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[IndexedDB Warning] Không thể lưu file vào IndexedDB:', e);
    return false;
  }
}

export async function getMediaFromIndexedDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[IndexedDB Warning] Không thể đọc file từ IndexedDB:', e);
    return null;
  }
}

export async function clearMediaFromIndexedDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    return false;
  }
}