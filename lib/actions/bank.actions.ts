'use server';

import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";

export interface Account {
  id: string;
  accountId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  userId: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  status: string;
}

export const getAccounts = async ({ userId }: { userId: number | string }) => {
  try {
    const res = await apiFetch<{
      data: Account[];
      totalBanks: number;
      totalCurrentBalance: number;
    }>(`/users/${userId}/accounts`);

    return parseStringify({
      data: res.data || [],
      totalBanks: res.totalBanks || res.data?.length || 0,
      totalCurrentBalance: res.totalCurrentBalance || 0
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    return {
      data: [],
      totalBanks: 0,
      totalCurrentBalance: 0
    };
  }
};

export const getAccount = async ({ accountId }: { accountId: string }) => {
  try {
    const res = await apiFetch<{
      data: Account;
      transactions: Transaction[];
    }>(`/accounts/${accountId}`);

    return parseStringify({
      ...res.data,
      transactions: res.transactions || []
    });
  } catch (error) {
    console.error('Get account error:', error);
    return null;
  }
};

export const getInstitution = async ({ institutionId }: { institutionId: string }) => {
  try {
    const res = await apiFetch<{ institution: any }>(`/institutions/${institutionId}`);
    return parseStringify(res.institution);
  } catch (error) {
    console.error('Get institution error:', error);
    return null;
  }
};

export const getTransactions = async ({ accountId }: { accountId: string }) => {
  try {
    const res = await apiFetch<Transaction[]>(`/accounts/${accountId}/transactions`);
    return parseStringify(res);
  } catch (error) {
    console.error('Get transactions error:', error);
    return [];
  }
};

export const createBankAccount = async (data: {
  userId: number;
  name: string;
  type: string;
  balance?: number;
  currency?: string;
}) => {
  try {
    const res = await apiFetch<{ account: Account }>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseStringify(res.account);
  } catch (error) {
    console.error('Create bank account error:', error);
    throw error;
  }
};

export const deleteBankAccount = async ({ accountId }: { accountId: string }) => {
  try {
    await apiFetch(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Delete bank account error:', error);
    return false;
  }
};