import React, { createContext, useContext } from "react";
import Swal from "sweetalert2";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const success = (title, message, onConfirm) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#059669",
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm();
      }
    });
  };

  const error = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "error",
      confirmButtonText: "Coba Lagi",
      confirmButtonColor: "#DC2626",
    });
  };

  const warning = (title, message, onConfirm) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6B7280",
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm();
      }
    });
  };

  const info = (title, message) => {
    Swal.fire({
      title: title,
      text: message,
      icon: "info",
      confirmButtonText: "Mengerti",
      confirmButtonColor: "#3B82F6",
    });
  };

  return (
    <ModalContext.Provider value={{ success, error, warning, info }}>
      {children}
    </ModalContext.Provider>
  );
};
