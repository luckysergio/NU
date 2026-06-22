import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Alert = ({ type = 'error', message, onClose, autoClose = false, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let timer;
    if (autoClose && message && isVisible) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoClose, duration, message, isVisible]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!message || !isVisible) return null;

  const icons = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      title: 'Berhasil',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Gagal',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      title: 'Peringatan',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      title: 'Informasi',
    },
  };

  const config = icons[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`
        border-l-4 rounded-r-lg shadow-md mb-4
        transform transition-all duration-300 ease-out
        ${isLeaving ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${config.textColor}`}>
              {config.title}
            </p>
            <p className={`text-sm mt-0.5 ${config.textColor} opacity-90`}>
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className={`shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;