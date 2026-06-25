import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/common/Modal';

const ModalContext = createContext(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Batal',
    showConfirmButton: true,
    showCancelButton: false,
  });

  const showModal = useCallback((config) => {
    setModalConfig({
      isOpen: true,
      title: config.title || 'Informasi',
      message: config.message || '',
      type: config.type || 'success',
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Batal',
      showConfirmButton: config.showConfirmButton !== false,
      showCancelButton: config.showCancelButton || false,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const success = useCallback((title, message, onConfirm, confirmText = 'OK') => {
    showModal({
      title,
      message,
      type: 'success',
      onConfirm,
      confirmText,
      showConfirmButton: true,
      showCancelButton: false,
    });
  }, [showModal]);

  const error = useCallback((title, message, onConfirm, confirmText = 'OK') => {
    showModal({
      title,
      message,
      type: 'error',
      onConfirm,
      confirmText,
      showConfirmButton: true,
      showCancelButton: false,
    });
  }, [showModal]);

  const info = useCallback((title, message, onConfirm, confirmText = 'OK') => {
    showModal({
      title,
      message,
      type: 'info',
      onConfirm,
      confirmText,
      showConfirmButton: true,
      showCancelButton: false,
    });
  }, [showModal]);

  const warning = useCallback((title, message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Batal') => {
    showModal({
      title,
      message,
      type: 'warning',
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      showConfirmButton: true,
      showCancelButton: true,
    });
  }, [showModal]);

  const confirm = useCallback((title, message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Tidak') => {
    showModal({
      title,
      message,
      type: 'warning',
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      showConfirmButton: true,
      showCancelButton: true,
    });
  }, [showModal]);

  return (
    <ModalContext.Provider value={{ 
      showModal, 
      closeModal, 
      success, 
      error, 
      warning, 
      info,
      confirm 
    }}>
      {children}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        showConfirmButton={modalConfig.showConfirmButton}
        showCancelButton={modalConfig.showCancelButton}
      />
    </ModalContext.Provider>
  );
};