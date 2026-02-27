"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { generateMyQRCode } from '@/lib/actions/qr.actions';
import Image from 'next/image';
import { toast } from 'sonner';

const MyQRButton = () => {
  const [open, setOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      const result = await generateMyQRCode();
      if (result.success) {
        setQrData(result);
      } else {
        toast.error(result.message || "Không thể tạo mã QR");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo mã QR");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadQRCode();
  };

  const handleCopy = () => {
    if (qrData?.accountNumber) {
      navigator.clipboard.writeText(qrData.accountNumber);
      setCopied(true);
      toast.success("Đã copy số tài khoản");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrData?.qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrData.qrDataUrl;
      link.download = `qrcode-${qrData.accountNumber}.png`;
      link.click();
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
      >
        <QrCode className="h-5 w-5" />
        Mã QR của tôi
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code nhận tiền</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-xl border">
                {qrData.qrDataUrl && (
                  <Image 
                    src={qrData.qrDataUrl} 
                    alt="QR Code" 
                    width={200} 
                    height={200}
                    className="w-48 h-48"
                  />
                )}
              </div>

              <div className="space-y-2 text-center">
                <p className="font-semibold text-lg">{qrData.accountName}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-gray-600 font-mono">{qrData.accountNumber}</p>
                  <button onClick={handleCopy} className="text-blue-600 hover:text-blue-700">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500">{qrData.bankName}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Tải xuống
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyQRButton;