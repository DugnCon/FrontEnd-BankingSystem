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
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi tạo mã QR");
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
    if (!qrData?.qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrData.qrDataUrl;
    link.download = `qrcode-${qrData.accountNumber || 'my-qr'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                {qrData.qrDataUrl ? (
                  <Image
                    src={qrData.qrDataUrl}
                    alt="QR Code nhận tiền"
                    width={200}
                    height={200}
                    className="w-48 h-48 object-contain"
                    priority
                  />
                ) : (
                  <p className="text-red-500 text-center py-4">
                    Không tải được hình QR
                  </p>
                )}
              </div>

              <div className="space-y-2 text-center">
                <p className="font-semibold text-lg">{qrData.accountName || 'Chưa có tên'}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-gray-600 font-mono">
                    {qrData.accountNumber || 'Chưa có số TK'}
                  </p>
                  {qrData.accountNumber && (
                    <button
                      onClick={handleCopy}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500">{qrData.bankName || 'Chưa có ngân hàng'}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  disabled={!qrData.qrDataUrl}
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