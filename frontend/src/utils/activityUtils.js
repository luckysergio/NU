/**
 * Format tanggal untuk input type="date"
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

/**
 * Format tanggal untuk tampilan (Indonesia locale)
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Format currency ke Rupiah (lengkap dengan symbol)
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  const num = parseFloat(amount);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("IDR", "Rp");
};

/**
 * Format number ke Rupiah (tanpa currency symbol)
 */
export const formatRupiah = (value) => {
  if (!value) return "";
  let number;
  if (typeof value === "string" && value.includes(".")) {
    number = value.split(".")[0];
  } else {
    number = value.toString();
  }
  const cleanNumber = number.replace(/\D/g, "");
  if (!cleanNumber) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(cleanNumber));
};

/**
 * Status options untuk select dropdown
 */
export const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

/**
 * Max photos constant
 */
export const MAX_PHOTOS = 5;

// ✅ Re-export JSX components dari file terpisah
export { getStatusBadge, getFileIcon } from "./ActivityComponents";