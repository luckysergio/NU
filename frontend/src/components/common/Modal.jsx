import React, { useEffect, useRef } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Batal',
  showConfirmButton = true,
  showCancelButton = false,
  isLoading = false,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isLoading]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    if (isLoading) {
      return (
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100">
          <svg className="w-8 h-8 text-green-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
      );
    }

    switch (type) {
      case 'success':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-yellow-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        );
      case 'info':
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-100">
            <InformationCircleIcon className="h-8 w-8 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    if (isLoading) {
      return 'bg-gray-400 cursor-not-allowed text-white';
    }

    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25';
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/25';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/25';
      case 'info':
        return 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25';
      default:
        return 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25';
    }
  };

  const getTitleColor = () => {
    if (isLoading) {
      return 'text-green-700';
    }

    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-green-700';
    }
  };

  const handleConfirm = () => {
    if (isLoading) return;
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (isLoading) return;
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (isLoading) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderMessage = () => {
    if (!message) return null;
    
    if (isLoading) {
      return (
        <div className="w-full text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      );
    }
    
    const isHTML = /<[a-z][\s\S]*>/i.test(message);
    
    if (isHTML) {
      return (
        <div 
          className="w-full text-sm text-gray-600 text-center leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      );
    }
    
    return (
      <p className="text-sm text-gray-600 text-center leading-relaxed">
        {message}
      </p>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

        <div 
          ref={modalRef}
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-md animate-fadeIn"
        >
          {/* Close Button - TIDAK ADA SAMA SEKALI */}
          {/* Icon X dihilangkan total */}

          <div className="px-6 pt-6 pb-4">
            <div className="flex flex-col items-center">
              {getIcon()}

              <h3 className={`mt-4 text-xl font-bold text-center ${getTitleColor()}`}>
                {title}
              </h3>

              {renderMessage()}
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3 justify-center">
            {showCancelButton && !isLoading && (
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              >
                {cancelText}
              </button>
            )}
            {showConfirmButton && (
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${getButtonStyles()}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            )}
          </div>

          {/* Decorative element - NU themed gradient bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-green-600 via-emerald-500 to-green-600" />

          {/* NU Decorative Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0L100 50L50 100L0 50L50 0Z" fill="#059669" />
              <circle cx="50" cy="50" r="25" fill="#10B981" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;