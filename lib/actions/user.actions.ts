import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";
import { setSession, clearSession, getSession } from "@/lib/session/session";

export const verifyFaceId = async (userId: number, faceDescriptor: string): Promise<FaceVerificationResult> => {
  try {
    const res = await apiFetch<FaceVerificationResult>('/biometric/face/verify', {
      method: 'POST',
      body: JSON.stringify({ userId, faceDescriptor }),
    });
    return parseStringify(res);
  } catch (error) {
    console.error("Face verification error:", error);
    return { 
      success: false, 
      error: "Verification failed", 
      fallbackAvailable: true 
    };
  }
};

// Các hàm khác giữ nguyên
export const signIn = async ({ email, password }: signInProps) => {
  const res = await apiFetch<{ user: User; accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);

  setSession({
    token: res.accessToken,
    userID: Number(res.user.userID ?? 0), 
  });

  return parseStringify({ user: res.user });
};

export const signUp = async (userData: SignUpParams) => {
  const res = await apiFetch<{ status: string; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }, false);

  return parseStringify(res);
};

export async function getLoggedInUser(): Promise<User | null> {
  try {
    const session = getSession();
    if (!session?.token) {
      return null;
    }

    const res = await apiFetch<{ user: User }>('/auth/me');
    return parseStringify(res.user);
  } catch (error) {
    console.error("getLoggedInUser error:", error);
    return null;
  }
}

export const logoutAccount = async () => {
  await apiFetch('/auth/logout', { method: 'POST' });
  clearSession();
  return true;
};

export const getUserInfo = async ({ userId }: getUserInfoProps): Promise<User | undefined> => {
  const res = await apiFetch<{ user: User }>(`/users/${userId}`);
  return parseStringify(res.user);
};

export const getBanks = async ({ userId }: getBanksProps) => {
  const res = await apiFetch<{ banks: Bank[] }>('/banks');
  return parseStringify(res.banks);
};

export const getBank = async ({ documentId }: getBankProps) => {
  const res = await apiFetch<{ bank: Bank }>(`/banks/${documentId}`);
  return parseStringify(res.bank);
};

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  const res = await apiFetch<{ bank: Bank }>(`/banks/account/${accountId}`);
  return parseStringify(res.bank);
};

export const createBankAccount = async (data: createBankAccountProps) => {
  const res = await apiFetch<{ account: Bank }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return parseStringify(res.account);
};