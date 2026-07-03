// src/utils/storageUrl.js

/**
 * Mendapatkan base URL dari environment
 * @returns {string} Base URL
 */
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

/**
 * Mendapatkan storage URL dari environment
 * @returns {string} Storage URL
 */
const getStorageUrl = () => {
  // Gunakan VITE_STORAGE_URL jika ada
  if (import.meta.env.VITE_STORAGE_URL) {
    return import.meta.env.VITE_STORAGE_URL;
  }
  return `${getBaseUrl()}/storage`;
};

/**
 * Membersihkan path dari prefix yang tidak diinginkan
 * @param {string} path - Path yang akan dibersihkan
 * @returns {string} Path yang sudah dibersihkan
 */
const cleanPath = (path) => {
  if (!path) return "";
  
  let clean = path;
  
  // Jika path sudah berupa URL lengkap (http atau https)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  
  // Hapus prefix /storage/ jika ada
  if (clean.startsWith('/storage/')) {
    clean = clean.substring(9);
  }
  
  // Hapus prefix storage/ jika ada
  if (clean.startsWith('storage/')) {
    clean = clean.substring(8);
  }
  
  // Hapus prefix api/storage/ jika ada
  if (clean.startsWith('api/storage/')) {
    clean = clean.substring(12);
  }
  
  // Hapus prefix api/ jika ada
  if (clean.startsWith('api/')) {
    clean = clean.substring(4);
  }
  
  // Hapus prefix public/ jika ada (dari Laravel)
  if (clean.startsWith('public/')) {
    clean = clean.substring(7);
  }
  
  // Hapus leading slash
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  
  // Pastikan tidak ada double slash
  clean = clean.replace(/\/\/+/g, '/');
  
  return clean;
};

/**
 * Mendapatkan URL lengkap untuk file storage
 * @param {string} path - Path file (contoh: activities/photos/foto.jpg)
 * @returns {string} URL lengkap
 */
export const getStoragePath = (path) => {
  if (!path) return "";
  
  // Jika path sudah berupa URL lengkap (http atau https)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const cleaned = cleanPath(path);
  const storageUrl = getStorageUrl();
  
  // Pastikan tidak ada double slash antara storageUrl dan cleaned
  const base = storageUrl.replace(/\/$/, '');
  
  // PERBAIKAN: Jika storageUrl tidak mengandung /storage, tambahkan
  let finalUrl;
  if (base.endsWith('/storage') || base.includes('/storage')) {
    finalUrl = `${base}/${cleaned}`;
  } else {
    finalUrl = `${base}/storage/${cleaned}`;
  }
  
  // Hapus double slash (tapi jangan hapus ://)
  finalUrl = finalUrl.replace(/([^:]\/)\/+/g, "$1");
  
  return finalUrl;
};

/**
 * Mendapatkan URL untuk foto kegiatan
 * @param {object|string} photo - Object foto dengan property file_path atau string path
 * @returns {string} URL lengkap
 */
export const getPhotoUrl = (photo) => {
  if (!photo) return "";
  
  // Jika photo adalah string (path langsung)
  if (typeof photo === 'string') {
    return getStoragePath(photo);
  }
  
  // Jika photo adalah object dengan file_path
  if (photo.file_path) {
    return getStoragePath(photo.file_path);
  }
  
  return "";
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

/**
 * Mendapatkan URL untuk file sertifikat
 * @param {string} filePath - Path file sertifikat
 * @returns {string} URL lengkap
 */
export const getCertificateFileUrl = (filePath) => {
  if (!filePath) return "";
  return getStoragePath(filePath);
};

/**
 * Mendapatkan URL untuk foto anggota
 * @param {string} fotoPath - Path foto anggota
 * @returns {string} URL lengkap
 */
export const getAnggotaFotoUrl = (fotoPath) => {
  if (!fotoPath) return "";
  return getStoragePath(fotoPath);
};

/**
 * Mendapatkan URL untuk file secara umum
 * @param {string} path - Path file
 * @param {string} type - Tipe file (optional)
 * @returns {string} URL lengkap
 */
export const getFileUrl = (path, type = '') => {
  if (!path) return "";
  
  // Jika sudah URL lengkap
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  return getStoragePath(path);
};

export default {
  getStoragePath,
  getPhotoUrl,
  getAttendanceUrl,
  getCertificateFileUrl,
  getAnggotaFotoUrl,
  getFileUrl,
  getBaseUrl,
  getStorageUrl,
};