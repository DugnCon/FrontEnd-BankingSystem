"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScanLine, X, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { decodeQRCode } from '@/lib/actions/qr.actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface QRScannerButtonProps {
  onScanSuccess?: (data: any) => void;
}

const QRScannerButton = ({ onScanSuccess }: QRScannerButtonProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const scannerId = 'qr-scanner';

  const startScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setHasCamera(false);
        return;
      }

      const qrScanner = new Html5Qrcode(scannerId);
      setScanner(qrScanner);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrScanner.start(
        devices[0].id,
        config,
        async (decodedText) => {
          if (processing) return;
          
          setProcessing(true);
          await qrScanner.stop();
          setIsScanning(false);

          try {
            const result = await decodeQRCode(decodedText);
            if (result.success) {
              toast.success("Quét mã QR thành công");
              
              if (onScanSuccess) {
                onScanSuccess(result.data);
              } else {
                // Mặc định: chuyển đến trang payment với data từ QR
                const params = new URLSearchParams();
                if (result.data.receiverId) {
                  params.set('receiverId', result.data.receiverId);
                }
                if (result.data.accountNumber) {
                  params.set('accountNumber', result.data.accountNumber);
                }
                if (result.data.accountName) {
                  params.set('accountName', result.data.accountName);
                }
                
                router.push(`/payment?${params.toString()}`);
              }
              
              setOpen(false);
            } else {
              toast.error(result.message || "Mã QR không hợp lệ");
              setProcessing(false);
              startScanner();
            }
          } catch (error) {
            toast.error("Lỗi xử lý mã QR");
            setProcessing(false);
            startScanner();
          }
        },
        () => {}
      );

      setIsScanning(true);
    } catch (error) {
      setHasCamera(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  const handleClose = async () => {
    if (scanner && isScanning) {
      await scanner.stop().catch(() => {});
    }
    setScanner(null);
    setIsScanning(false);
    setProcessing(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="flex items-center gap-2"
      >
        <ScanLine className="h-5 w-5" />
        Quét mã QR
      </Button>

      <Dialog open={open} onOpenChange={(open: any) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {processing ? "Đang xử lý..." : "Quét mã QR"}
            </DialogTitle>
          </DialogHeader>

          {hasCamera ? (
            <div className="relative overflow-hidden rounded-xl">
              <div id={scannerId} className="w-full" />
              {processing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
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
            className="mt-2 w-full"
            onClick={handleClose}
            disabled={processing}
          >
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QRScannerButton;