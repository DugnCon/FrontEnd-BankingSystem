import { parseStringify } from "../utils";
import { apiFetch } from "@/lib/api/http";
import { setSession, clearSession, getSession } from "@/lib/session/session";
// Types cho face enrollment
export interface FaceEnrollmentResult {
  success: boolean;
  message?: string;
  error?: string;
  qualityScore?: number;
  embeddingsCount?: number;
}

export interface FaceQualityMetrics {
  sharpness: number;      // 0-100
  brightness: number;     // 0-100
  faceSize: number;       // pixels
  facePosition: { x: number; y: number };
  angle: { roll: number; pitch: number; yaw: number };
  isBlurred: boolean;
  isWellLit: boolean;
  isFrontal: boolean;
  isFaceVisible: boolean;
}

export interface LivenessCheckResult {
  passed: boolean;
  action: string;
  confidence: number;
}

export interface FaceEnrollmentPayload {
  userId: number;
  embeddings: string[];           // Mảng các face descriptor đã encode base64
  qualityMetrics: FaceQualityMetrics[];
  livenessResults: LivenessCheckResult[];
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    timestamp: number;
  };
}
/**
 * Gửi dữ liệu đăng ký khuôn mặt lên backend
 * Chỉ gửi embeddings (đã encode) + metadata, KHÔNG gửi ảnh gốc
 */
export const enrollFace = async (payload: FaceEnrollmentPayload): Promise<FaceEnrollmentResult> => {
  try {
    const res = await apiFetch<FaceEnrollmentResult>('/biometric/face/enroll', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseStringify(res);
  } catch (error) {
    console.error("Face enrollment error:", error);
    return { 
      success: false, 
      error: "Enrollment failed. Please try again." 
    };
  }
};

/**
 * Kiểm tra trạng thái đăng ký khuôn mặt của user
 */
export const checkFaceEnrollmentStatus = async (userId: number): Promise<{
  isEnrolled: boolean;
  enrolledAt?: string;
  qualityScore?: number;
}> => {
  try {
    const res = await apiFetch<{
      isEnrolled: boolean;
      enrolledAt?: string;
      qualityScore?: number;
    }>(`/biometric/face/status/${userId}`);
    return parseStringify(res);
  } catch (error) {
    console.error("Check enrollment status error:", error);
    return { isEnrolled: false };
  }
};

/**
 * Xóa dữ liệu khuôn mặt đã đăng ký
 */
export const deleteFaceEnrollment = async (userId: number): Promise<{ success: boolean }> => {
  try {
    const res = await apiFetch<{ success: boolean }>(`/biometric/face/${userId}`, {
      method: 'DELETE',
    });
    return parseStringify(res);
  } catch (error) {
    console.error("Delete face enrollment error:", error);
    return { success: false };
  }
};

/**
 * Cập nhật face descriptor (nếu cần)
 */
export const updateFaceEnrollment = async (
  userId: number, 
  embeddings: string[]
): Promise<FaceEnrollmentResult> => {
  try {
    const res = await apiFetch<FaceEnrollmentResult>(`/biometric/face/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ embeddings }),
    });
    return parseStringify(res);
  } catch (error) {
    console.error("Update face enrollment error:", error);
    return { success: false, error: "Update failed" };
  }
};

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

export const getUserInfor = async ({ userId }: getUserInfoProps): Promise<User | undefined> => {
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

export const getBankByAccountId = async ({ accountID }: getBankByAccountIdProps) => {
  const res = await apiFetch<{ bank: Bank }>(`/banks/account/${accountID}`);
  return parseStringify(res.bank);
};

export const createBankAccount = async (data: createBankAccountProps) => {
  const res = await apiFetch<{ account: Bank }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return parseStringify(res.account);
};