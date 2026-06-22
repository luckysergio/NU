// src/components/common/ActionButtons.jsx
import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";

const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  size = "md",
}) => {
  const buttonSizes = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {onView && (
        <button
          onClick={onView}
          className={`${buttonSizes[size]} text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
          title="Detail"
        >
          <Eye className={iconSizes[size]} />
        </button>
      )}
      {onEdit && canEdit && (
        <button
          onClick={onEdit}
          className={`${buttonSizes[size]} text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors`}
          title="Edit"
        >
          <Edit className={iconSizes[size]} />
        </button>
      )}
      {onDelete && canDelete && (
        <button
          onClick={onDelete}
          className={`${buttonSizes[size]} text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
          title="Hapus"
        >
          <Trash2 className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
