const ATTEMPT_KEY = 'login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 phút

interface AttemptData {
  count: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

export function canAttemptLogin(): { allowed: boolean; remainingTime?: number; remainingAttempts: number } {
  const now = Date.now();
  const rawData = localStorage.getItem(ATTEMPT_KEY);
  const data: AttemptData = rawData ? JSON.parse(rawData) : { count: 0, lastAttempt: now };

  if (data.lockoutUntil && now < data.lockoutUntil) {
    return { allowed: false, remainingTime: Math.ceil((data.lockoutUntil - now) / 60000), remainingAttempts: 0 };
  }

  // Reset nếu quá 1 giờ không thử
  if (now - data.lastAttempt > 60 * 60 * 1000) {
    data.count = 0;
  }

  return { allowed: data.count < MAX_ATTEMPTS, remainingAttempts: MAX_ATTEMPTS - data.count };
}

export function recordFailedAttempt(): void {
  const now = Date.now();
  const rawData = localStorage.getItem(ATTEMPT_KEY);
  const data: AttemptData = rawData ? JSON.parse(rawData) : { count: 0, lastAttempt: now };

  data.count += 1;
  data.lastAttempt = now;

  if (data.count >= MAX_ATTEMPTS) {
    data.lockoutUntil = now + LOCKOUT_DURATION_MS;
  }

  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
}

export function resetLoginAttempts(): void {
  localStorage.removeItem(ATTEMPT_KEY);
}