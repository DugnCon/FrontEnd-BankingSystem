'use server';

import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";

export interface Account {
  accountID: string | number;
  userID: number;
  name: string;
  type: string;
  currentBalance: number;
  currency: string;
}

export interface Transaction {
  accountID: string | number;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  status: string;
}

export interface FullAccount {
  availableBalance: number;
  currentBalance: number;
  officialName: string;
  mask: string;
  institutionId: string;
  name: string;
  type: string;
  subtype: string;
  shareableId: string;
}

export const checkAccounts = async () => {
  try {
    const res = await apiFetch<{
      hasAccounts: boolean;
      totalBanks: number;
      totalCurrentBalance: number;
      accounts: Account[];
    }>('/my/accounts/check');

    return parseStringify({
      hasAccounts: res.hasAccounts || false,
      totalBanks: res.totalBanks || 0,
    });
  } catch (error) {
    console.error('Check accounts error:', error);
    return {
      hasAccounts: false,
      totalBanks: 0,
      totalCurrentBalance: 0,
      accounts: []
    };
  }
};

export const getAccounts = async () => {
  try {
    const res = await apiFetch<{
      data: Account[];
      totalBanks: number;
      totalCurrentBalance: number;
    }>('/my/accounts');

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

export const getTransactionHistory = async ({
  accountId,
  limit = 20,
}: {
  accountId: string | number | undefined;
  limit?: number;
}) => {
  if (!accountId) {
    return { transactions: [] };
  }

  try {
    const res = await apiFetch<{
      transactions: Transaction[];
    }>(`/accounts/${accountId}/history?limit=${limit}`);

    const transactions = Array.isArray(res.transactions) ? res.transactions : [];

    const cleanTransactions = transactions.map((tx) => ({
      ...tx,
      description: tx.description ?? '',
      type: tx.type ?? 'unknown',
    }));

    return parseStringify({
      transactions: cleanTransactions,
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    return { transactions: [] };
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

export const createFullBankAccount = async (data: {
  userId: string;
  name: string;
  officialName?: string;
  type: string;
  subtype: string;
  mask: string;
  institutionId?: string;
  availableBalance: number;
  currentBalance: number;
}) => {
  try {
    const accountData = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      availableBalance: data.availableBalance,
      currentBalance: data.currentBalance,
      officialName: data.officialName || data.name,
      mask: data.mask,
      institutionId: data.institutionId || 'MANUAL',
      name: data.name,
      type: data.type,
      subtype: data.subtype,
      shareableId: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const res = await apiFetch<{ account: FullAccount }>('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify({
        ...accountData,
        userId: data.userId,
      }),
    });

    return parseStringify(res.account);
  } catch (error) {
    console.error('Create full bank account error:', error);
    throw error;
  }
};

export const getFullAccounts = async ({ userId }: { userId: string }) => {
  try {
    const res = await apiFetch<FullAccount[]>(`/bank-accounts/user/${userId}`);
    return parseStringify(res);
  } catch (error) {
    console.error('Get full accounts error:', error);
    return [];
  }
};

export const deleteFullBankAccount = async ({ accountId }: { accountId: string }) => {
  try {
    await apiFetch(`/bank-accounts/${accountId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Delete full bank account error:', error);
    return false;
  }
};

export const updateFullBankAccount = async ({
  accountId,
  data,
}: {
  accountId: string;
  data: Partial<FullAccount>;
}) => {
  try {
    const res = await apiFetch<FullAccount>(`/bank-accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return parseStringify(res);
  } catch (error) {
    console.error('Update full bank account error:', error);
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