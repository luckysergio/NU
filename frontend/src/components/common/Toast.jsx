import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Tambahkan style hanya sekali
const addToastStyles = () => {
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes shrink {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};

// Panggil sekali di luar komponen
addToastStyles();

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
      title: 'Berhasil!',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Gagal!',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500',
      title: 'Peringatan!',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
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
        fixed top-5 right-5 z-50 max-w-sm w-full
        transition-all duration-300 ease-out
        ${isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
    >
      <div
        className={`
          rounded-lg shadow-lg border ${config.borderColor} ${config.bgColor}
          overflow-hidden
        `}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${config.textColor}`}>
                {config.title}
              </p>
              <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div
          className={`h-1 ${config.iconColor} bg-opacity-30`}
          style={{
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

export default Toast;