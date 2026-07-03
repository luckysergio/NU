// src/components/Barcode/BarcodeScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle } from 'lucide-react';

const BarcodeScanner = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  onScanError 
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError(null);

      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung kamera');
      }

      // Check camera permission
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      setPermission(permissionStatus.state);

      if (permissionStatus.state === 'denied') {
        throw new Error('Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.');
      }

      const scanner = new Html5Qrcode('barcode-scanner');
      scannerInstanceRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // Success callback
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
          stopScanner();
          onClose();
        },
        (errorMessage) => {
          // Error callback - ignore for now
          // console.warn('Scan error:', errorMessage);
        }
      );

      setScanning(false);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Gagal memulai scanner');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerInstanceRef.current) {
        await scannerInstanceRef.current.stop();
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
    setScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">Scan Barcode</h3>
            </div>
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Body */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div>
              <div 
                id="barcode-scanner" 
                className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden relative"
              >
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
                      <p className="text-white text-sm mt-2">Mengaktifkan kamera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Arahkan kamera ke barcode anggota
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">Scanning...</span>
                </div>
              </div>

              {permission === 'denied' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    🔴 Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;