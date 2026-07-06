import React from "react";
import {
  Paperclip,
  FileText,
  FileImage,
  FileArchive,
  CheckCircle,
  XCircle,
  FileCheck,
} from "lucide-react";

/**
 * Get icon berdasarkan tipe file
 */
export const getFileIcon = (fileName, fileType) => {
  if (!fileName) return <Paperclip className="w-4 h-4" />;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <FileImage className="w-4 h-4 text-green-500" />;
  if (["doc", "docx"].includes(ext))
    return <FileText className="w-4 h-4 text-blue-500" />;
  if (["xls", "xlsx"].includes(ext))
    return <FileArchive className="w-4 h-4 text-green-600" />;
  return <Paperclip className="w-4 h-4 text-gray-400" />;
};

/**
 * Get status badge component
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="w-3 h-3" />
          Selesai
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Dibatalkan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          <FileCheck className="w-3 h-3" />
          Draft
        </span>
      );
  }
};