"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { X, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onSuccess: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onSuccess, onClose }: QRScannerProps) => {
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = 'qr-reader';

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices.length === 0) {
          setHasCamera(false);
          return;
        }
        startScanner(devices[0].id);
      })
      .catch(() => setHasCamera(false));

    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = (cameraId: string) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerId);
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scannerRef.current
      .start(
        cameraId,
        config,
        (decodedText) => {
          onSuccess(decodedText);
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {});
          }
          onClose();
        },
        () => {}
      )
      .then(() => setIsScanning(true))
      .catch(() => setHasCamera(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-4">
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-4 text-lg font-semibold">Quét mã QR</h3>

        {hasCamera ? (
          <div className="overflow-hidden rounded-xl">
            <div id={scannerId} className="w-full" />
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-gray-50">
            <CameraOff className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500">Không tìm thấy camera</p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full"
          onClick={onClose}
        >
          Đóng
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;