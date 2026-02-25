"use server";

import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";


export const createTransaction = async (
  transaction: CreateTransactionProps,
  options: { headers?: Record<string, string> } = {}
) => {
  try {
    const data = await apiFetch<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        channel: 'online',
        category: 'Transfer',
        ...transaction,
      }),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return {
      success: true,
      message: "Tạo giao dịch thành công",
      data: parseStringify(data.transaction),
    };
  } catch (error: any) {
    console.error("[createTransaction ERROR]:", error);

    let message = "Lỗi hệ thống khi tạo giao dịch";

    if (error?.message) {
      message = error.message;
    }

    return {
      success: false,
      message,
    };
  }
};

export const getTransactionsByBankId = async ({ bankId }: { bankId: string }) => {
  const res = await apiFetch<{ transactions: Transaction[], total: number }>('/transactions', {
    // Query params lọc theo bankId (sender hoặc receiver)
    // BE nên hỗ trợ query ?bankId=... hoặc ?accountId=...
  });

  // Nếu BE trả mảng documents thay vì transactions, adjust ở đây
  return parseStringify({
    total: res.total,
    documents: res.transactions,
  });
};