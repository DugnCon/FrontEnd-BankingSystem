import { getSession } from '../session/session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    let token: string | null = null;

    
    if (typeof window !== 'undefined') {
      const session = getSession();
      token = session?.token || null;
    } 

    else {
      try {
        const { cookies } = await import('next/headers');
        token = cookies().get('auth_token')?.value || null;
      } catch (err) {
        
        console.warn('Cannot read cookies on server:', err);
      }
    }

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
 

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',   
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    const error: ApiError = {
      message: data?.message || `Lỗi ${response.status}: ${response.statusText}`,
      status: response.status,
      code: data?.code,
    };
    throw error;
  }

  return data as T;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return (err as ApiError).message || 'Đã xảy ra lỗi không xác định';
  }
  return 'Đã xảy ra lỗi';
}