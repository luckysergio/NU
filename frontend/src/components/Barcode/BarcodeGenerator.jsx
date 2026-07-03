import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeGenerator = ({ 
  value, 
  width = 2,
  height = 60,
  format = "CODE128",
  displayValue = true,
  fontSize = 14,
  margin = 10,
  className = "",
  onClick = null
}) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: margin,
          background: "#ffffff",
          lineColor: "#000000",
          textAlign: "center",
          textPosition: "bottom",
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [value, width, height, format, displayValue, fontSize, margin]);

  if (!value) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-4 ${className}`}>
        <span className="text-gray-400 text-sm">No Barcode</span>
      </div>
    );
  }

  return (
    <svg 
      ref={barcodeRef} 
      className={`${className} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    />
  );
};

export default BarcodeGenerator;