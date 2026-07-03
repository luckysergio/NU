// src/components/QRCode/QRCodeGenerator.jsx
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode } from 'lucide-react';

const QRCodeGenerator = ({ 
  value, 
  size = 128,
  level = "H", // L, M, Q, H
  includeMargin = true,
  bgColor = "#ffffff",
  fgColor = "#000000",
  className = "",
  onClick = null,
  showLabel = false,
  label = "Scan QR Code"
}) => {
  if (!value) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-1" />
          <span className="text-gray-400 text-xs">No QR Code</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`bg-white p-3 rounded-xl shadow-md border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        onClick={onClick}
      >
        <QRCodeCanvas
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
          bgColor={bgColor}
          fgColor={fgColor}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-2">{label}</p>
      )}
    </div>
  );
};

export default QRCodeGenerator;