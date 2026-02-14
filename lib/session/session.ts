export interface Session {
  token: string;
  userID: number;
  expiresAt?: number;
}

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

// Helper đọc cookie (dùng cho cả client & server)
function getCookie(name: string): string | null {
  if (typeof window !== 'undefined') {
    // Client-side
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  } else {
    // Server-side (Next.js)
    const { cookies } = require('next/headers');
    return cookies().get(name)?.value || null;
  }
}

// Helper set cookie (client-side)
function setCookie(name: string, value: string, days = 7) {
  if (typeof window === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

export function getSession(): Session | null {
  const token = getCookie(TOKEN_KEY);
  const userIDStr = getCookie(USER_ID_KEY);

  if (!token || !userIDStr) return null;

  return {
    token,
    userID: Number(userIDStr),
  };
}

export function setSession(session: Session): void {
  // Client-side: lưu localStorage + cookie
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_ID_KEY, session.userID.toString());
  }

  // Set cookie (server cũng đọc được)
  setCookie(TOKEN_KEY, session.token);
  setCookie(USER_ID_KEY, session.userID.toString());
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }

  // Xóa cookie
  setCookie(TOKEN_KEY, '', -1);
  setCookie(USER_ID_KEY, '', -1);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}