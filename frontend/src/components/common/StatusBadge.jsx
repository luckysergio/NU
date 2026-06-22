import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const StatusBadge = ({
  isActive,
  activeText = "Aktif",
  inactiveText = "Tidak Aktif",
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  if (isActive) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-emerald-100 text-emerald-700 ${sizeClasses[size]}`}
      >
        <CheckCircle className="w-3 h-3" />
        {activeText}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium bg-gray-100 text-gray-700 ${sizeClasses[size]}`}
    >
      <XCircle className="w-3 h-3" />
      {inactiveText}
    </span>
  );
};

export default StatusBadge;
