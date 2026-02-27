"use server";

import { apiFetch } from "@/lib/api/http";
import { parseStringify } from "../utils";

export const generateMyQRCode = async () => {
  try {
    const response = await apiFetch<{ 
      qrCode: string; 
      qrDataUrl: string; 
      accountNumber: string;
      accountName: string;
      bankName: string;
      expiresIn: number;
    }>('/qr/my-qr', {
      method: 'GET',
    });

    return parseStringify({
      success: true,
      qrCode: response.qrCode,
      qrDataUrl: response.qrDataUrl,
      accountNumber: response.accountNumber,
      accountName: response.accountName,
      bankName: response.bankName,
      expiresIn: response.expiresIn,
    });
  } catch (error: any) {
    console.error("[generateMyQRCode ERROR]:", error);
    return {
      success: false,
      message: error?.message || "Không thể tạo mã QR",
    };
  }
};

export const decodeQRCode = async (qrData: string) => {
  try {
    const response = await apiFetch<{
      receiverId: string | number;
      accountNumber: string;
      accountName: string;
      bankName: string;
      expiresAt: string;
    }>('/qr/decode', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });

    return parseStringify({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("[decodeQRCode ERROR]:", error);
    return {
      success: false,
      message: error?.message || "Mã QR không hợp lệ hoặc đã hết hạn",
    };
  }
};