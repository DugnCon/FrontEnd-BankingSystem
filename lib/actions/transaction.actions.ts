"use server";

import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";

export const createTransaction = async (transaction: CreateTransactionProps) => {
  const res = await apiFetch<{ transaction: Transaction }>('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      channel: 'online',
      category: 'Transfer',
      ...transaction,
    }),
  });

  return parseStringify(res.transaction);
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