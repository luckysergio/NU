// src/utils/storageUrl.js

const getBaseUrl = () => {
  // Gunakan VITE_BASE_URL terlebih dahulu jika ada
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }
  
  // Jika tidak ada, ambil dari VITE_API_URL dan hapus /api
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return "http://localhost:8000";
  
  // Hapus /api dari URL jika ada
  let baseUrl = apiUrl.replace(/\/api$/, "");
  // Hapus juga /api/ jika ada di akhir
  baseUrl = baseUrl.replace(/\/api\/$/, "");
  return baseUrl;
};

const getStorageUrl = () => {
  // Gunakan VITE_STORAGE_URL jika ada
  if (import.meta.env.VITE_STORAGE_URL) {
    return import.meta.env.VITE_STORAGE_URL;
  }
  return `${getBaseUrl()}/storage`;
};

/**
 * Mendapatkan URL lengkap untuk file storage
 * @param {string} path - Path file (contoh: activities/photos/foto.jpg)
 * @returns {string} URL lengkap
 */
export const getStoragePath = (path) => {
  if (!path) return "";
  // Hapus prefix /storage/ jika sudah ada di path
  let cleanPath = path;
  if (cleanPath.startsWith('/storage/')) {
    cleanPath = cleanPath.substring(9); // Hapus '/storage/'
  }
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8); // Hapus 'storage/'
  }
  // Hapus juga prefix api/storage/ jika ada
  if (cleanPath.startsWith('api/storage/')) {
    cleanPath = cleanPath.substring(12);
  }
  if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4);
  }
  
  const storageUrl = getStorageUrl();
  return `${storageUrl}/${cleanPath}`;
};

/**
 * Mendapatkan URL untuk foto kegiatan
 * @param {object} photo - Object foto dengan property file_path
 * @returns {string} URL lengkap
 */
export const getPhotoUrl = (photo) => {
  if (!photo || !photo.file_path) return "";
  return getStoragePath(photo.file_path);
};

/**
 * Mendapatkan URL untuk file absensi
 * @param {object} attendance - Object attendance dengan property file_path
 * @returns {string} URL lengkap
 */
export const getAttendanceUrl = (attendance) => {
  if (!attendance || !attendance.file_path) return "";
  return getStoragePath(attendance.file_path);
};

export default {
  getStoragePath,
  getPhotoUrl,
  getAttendanceUrl,
  getBaseUrl,
  getStorageUrl,
};