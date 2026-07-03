// src/components/QRCode/QRCodeScanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle, QrCode, Upload, Image, Smartphone, Laptop } from 'lucide-react';

const QRCodeScanner = ({ 
  isOpen, 
  onClose, 
  onScanSuccess,
  onScanError,
  onUploadQR
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState('scan');
  const [isMobile, setIsMobile] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const scannerInstanceRef = useRef(null);
  const isMountedRef = useRef(true);
  const isClosingRef = useRef(false);
  const scannerContainerRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  // Deteksi perangkat
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth;
      
      const isMobileDeviceDetected = isMobileDevice || (hasTouch && screenWidth < 1024);
      
      setIsMobile(isMobileDeviceDetected);
      
      if (isOpen) {
        if (isMobileDeviceDetected) {
          setMode('scan');
        } else {
          setMode('upload');
        }
      }
    };

    checkDevice();

    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileDeviceDetected = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
      ) || (hasTouch && screenWidth < 1024);
      
      setIsMobile(isMobileDeviceDetected);
      
      if (isOpen && !isClosingRef.current) {
        if (isMobileDeviceDetected && mode !== 'scan') {
          setMode('scan');
        } else if (!isMobileDeviceDetected && mode !== 'upload') {
          setMode('upload');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    isMountedRef.current = true;
    isClosingRef.current = false;
    
    return () => {
      isMountedRef.current = false;
      if (!isClosingRef.current) {
        stopScanner();
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && mode === 'scan' && isMountedRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current && !isClosingRef.current) {
          startScanner();
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      if (!isClosingRef.current) {
        stopScanner();
      }
    }
  }, [isOpen, mode]);

  const startScanner = async () => {
    if (isClosingRef.current || !isMountedRef.current) return;
    
    try {
      setScanning(true);
      setError(null);
      setDebugInfo('Menginisialisasi kamera...');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung kamera');
      }

      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        if (isMountedRef.current) {
          setPermission(permissionStatus.state);
          setDebugInfo(`Status izin: ${permissionStatus.state}`);
        }

        if (permissionStatus.state === 'denied') {
          throw new Error('Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.');
        }
      } catch (permError) {
        console.warn('Permissions API not supported:', permError);
        setDebugInfo('Permissions API tidak didukung, melanjutkan...');
      }

      const scannerElement = document.getElementById('qr-scanner');
      if (!scannerElement) {
        throw new Error('Scanner element not found');
      }

      if (scannerInstanceRef.current) {
        try {
          await scannerInstanceRef.current.stop();
          await scannerInstanceRef.current.clear();
        } catch (e) {}
        scannerInstanceRef.current = null;
      }

      setDebugInfo('Membuat instance scanner...');
      const scanner = new Html5Qrcode('qr-scanner');
      scannerInstanceRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      setDebugInfo('Memulai scanner...');
      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log('✅ QR Code detected:', decodedText);
          setDebugInfo(`✅ QR Code terdeteksi: ${decodedText}`);
          
          if (isMountedRef.current && !isClosingRef.current) {
            if (onScanSuccess) {
              onScanSuccess(decodedText);
            }
            handleClose();
          }
        },
        (errorMessage) => {
          // Ignore scan errors
          if (errorMessage && errorMessage.includes('qr')) {
            setDebugInfo(`Scanning... ${new Date().toLocaleTimeString()}`);
          }
        }
      );

      if (isMountedRef.current) {
        setScanning(false);
        setDebugInfo('✅ Scanner siap, menunggu QR Code...');
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setDebugInfo(`❌ Error: ${err.message}`);
      if (isMountedRef.current) {
        setError(err.message || 'Gagal memulai scanner');
        setScanning(false);
      }
    }
  };

  const stopScanner = async () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    
    try {
      if (scannerInstanceRef.current) {
        try {
          await scannerInstanceRef.current.stop();
        } catch (stopErr) {}
        try {
          await scannerInstanceRef.current.clear();
        } catch (clearErr) {}
        scannerInstanceRef.current = null;
      }
    } catch (err) {} finally {
      if (isMountedRef.current) {
        setScanning(false);
      }
      isClosingRef.current = false;
    }
  };

  const handleClose = () => {
    if (isClosingRef.current) return;
    
    const closeNow = () => {
      if (isMountedRef.current) {
        setScanning(false);
        setError(null);
        onClose();
      }
      isClosingRef.current = false;
    };
    
    if (scannerInstanceRef.current) {
      isClosingRef.current = true;
      scannerInstanceRef.current.stop()
        .catch(() => {})
        .finally(() => {
          if (scannerInstanceRef.current) {
            scannerInstanceRef.current.clear()
              .catch(() => {})
              .finally(() => {
                scannerInstanceRef.current = null;
                closeNow();
              });
          } else {
            closeNow();
          }
        });
    } else {
      closeNow();
    }
  };

  // PERBAIKAN: handleUploadQR menggunakan file object langsung
  const handleUploadQR = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file harus PNG, JPG, JPEG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setDebugInfo('Memproses upload gambar...');

    try {
      // PERBAIKAN: Gunakan file object langsung, bukan data URL
      const uploadScanner = new Html5Qrcode('qr-upload-scanner');
      
      setDebugInfo('Membaca QR Code dari gambar...');
      const decodedText = await uploadScanner.scanFile(file, true);
      
      console.log('✅ QR Code from image:', decodedText);
      setDebugInfo(`✅ QR Code dari gambar: ${decodedText}`);
      
      if (decodedText && isMountedRef.current) {
        if (onUploadQR) {
          onUploadQR(decodedText);
        } else if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
        handleClose();
      } else {
        setError('Tidak ada QR Code yang terdeteksi dari gambar');
      }
    } catch (err) {
      console.error('Error decoding QR:', err);
      setDebugInfo(`❌ Error: ${err.message}`);
      if (isMountedRef.current) {
        setError('Gagal membaca QR Code dari gambar. Pastikan gambar berisi QR Code yang valid.');
        if (onScanError) {
          onScanError(err);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
      event.target.value = '';
    }
  };

  const switchToScan = () => {
    if (isClosingRef.current) return;
    setMode('scan');
    setError(null);
    setDebugInfo('');
  };

  const switchToUpload = () => {
    if (isClosingRef.current) return;
    const stopAndSwitch = async () => {
      if (scannerInstanceRef.current) {
        try {
          await scannerInstanceRef.current.stop();
          await scannerInstanceRef.current.clear();
        } catch (e) {}
        scannerInstanceRef.current = null;
      }
      if (isMountedRef.current) {
        setMode('upload');
        setScanning(false);
        setError(null);
        setDebugInfo('');
      }
    };
    stopAndSwitch();
  };

  if (!isOpen) return null;

  const getDeviceRecommendation = () => {
    if (isMobile) {
      return {
        icon: <Smartphone className="w-4 h-4" />,
        text: 'Mode default: Scan Kamera (Mobile)'
      };
    } else {
      return {
        icon: <Laptop className="w-4 h-4" />,
        text: 'Mode default: Upload Gambar (Desktop)'
      };
    }
  };

  const recommendation = getDeviceRecommendation();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="relative bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">Scan QR Code</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-10">
            <p className="text-emerald-100 text-xs">
              {mode === 'scan' ? 'Arahkan kamera ke QR Code anggota' : 'Upload gambar QR Code anggota'}
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white">
              {recommendation.icon}
              <span className="hidden sm:inline">{recommendation.text}</span>
              <span className="sm:hidden">{isMobile ? '📱' : '💻'}</span>
            </span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={switchToScan}
            className={`flex-1 py-3 text-sm font-medium transition-colors duration-200 ${
              mode === 'scan'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Scan Kamera
            {isMobile && mode === 'scan' && (
              <span className="ml-1 text-[10px] text-emerald-400">✓ Recommended</span>
            )}
          </button>
          <button
            onClick={switchToUpload}
            className={`flex-1 py-3 text-sm font-medium transition-colors duration-200 ${
              mode === 'upload'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload Gambar
            {!isMobile && mode === 'upload' && (
              <span className="ml-1 text-[10px] text-emerald-400">✓ Recommended</span>
            )}
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  if (mode === 'scan' && isMountedRef.current) {
                    startScanner();
                  }
                }}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : mode === 'scan' ? (
            <div>
              <div 
                id="qr-scanner" 
                ref={scannerContainerRef}
                className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden relative"
              >
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-white animate-spin mx-auto" />
                      <p className="text-white text-sm mt-2">Mengaktifkan kamera...</p>
                    </div>
                  </div>
                )}
                {!scanning && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                    <div className="text-center text-white/50">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Kamera siap</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Menunggu scan QR Code...</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Pastikan QR Code berada dalam kotak scanner
                </p>
                {!isMobile && (
                  <p className="text-xs text-amber-600 mt-2">
                    💡 Tips: Jika kesulitan scan, gunakan mode "Upload Gambar"
                  </p>
                )}
                {debugInfo && (
                  <p className="text-xs text-gray-400 mt-2 truncate max-w-full">
                    🔍 {debugInfo}
                  </p>
                )}
              </div>

              {permission === 'denied' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    🔴 Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-gray-600 mb-2">Upload gambar QR Code</p>
              <p className="text-xs text-gray-400 mb-4">
                Format: PNG, JPG, JPEG, WEBP • Max: 5MB
              </p>

              <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition-colors duration-200">
                <Upload className="w-4 h-4" />
                {uploading ? 'Memproses...' : 'Pilih Gambar'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleUploadQR}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span className="text-sm text-gray-600">Memproses gambar...</span>
                </div>
              )}

              {isMobile && (
                <p className="text-xs text-amber-600 mt-4">
                  💡 Tips: Gunakan mode "Scan Kamera" untuk hasil lebih cepat di mobile
                </p>
              )}
              {debugInfo && (
                <p className="text-xs text-gray-400 mt-2 truncate max-w-full">
                  🔍 {debugInfo}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Hidden element for upload scanner */}
      <div id="qr-upload-scanner" style={{ display: 'none' }}></div>
    </div>
  );
};

export default QRCodeScanner;