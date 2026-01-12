// import React, { useEffect } from 'react';

// export const QRCodeDisplay: React.FC<{ text: string; size?: number; cellSize?: number; margin?: number }> = ({ text, size = 192, cellSize = 5, margin = 10 }) => {
//     const qrRef = React.useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         if (qrRef.current && text) {
//             qrRef.current.innerHTML = '';
//             try {
//                 const qr = (window as any).qrcode(0, 'L');
//                 qr.addData(text);
//                 qr.make();
//                 qrRef.current.innerHTML = qr.createImgTag(cellSize, margin);
//                 const img = qrRef.current.querySelector('img');
//                 if (img) {
//                     img.style.width = '100%';
//                     img.style.height = '100%';
//                     img.style.imageRendering = 'pixelated';
//                     img.classList.add('rounded-lg', 'bg-white');
//                 }
//             } catch (e) {
//                 console.error("QR Code generation failed:", e);
//                 if(qrRef.current) qrRef.current.innerText = "Could not generate QR code.";
//             }
//         }
//     }, [text, cellSize, margin]);

//     return <div ref={qrRef} style={{ width: `${size}px`, height: `${size}px` }} className="mx-auto bg-slate-200 rounded-lg flex items-center justify-center"></div>;
// };
import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type Props = {
  text: string;
  size?: number;
};

export const QRCodeDisplay: React.FC<Props> = ({ text, size = 192 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 1,
    }).catch(err => {
      console.error('QR Code generation failed:', err);
    });
  }, [text, size]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto bg-white rounded-lg"
    />
  );
};
