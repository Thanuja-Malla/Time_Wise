import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeBadge({
  value,
  height = 40,
  width = 1.5,
  displayValue = true,
  fontSize = 12
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
          background: '#ffffff',
          lineColor: '#1e293b'
        });
      } catch (err) {
        console.error('JsBarcode rendering error:', err);
      }
    }
  }, [value, height, width, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className="inline-flex flex-col items-center bg-white p-1 rounded border border-slate-200 shadow-2xs">
      <svg ref={svgRef} className="max-w-full h-auto" />
    </div>
  );
}
