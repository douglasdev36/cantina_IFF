import { IS_LOCAL_DB } from '@/config/env';

const BASE_URL = (import.meta.env.VITE_LOCAL_AUTH_URL as string) || 'http://localhost:4000';
const TOKEN_KEY = 'LOCAL_AUTH_TOKEN';
const USER_KEY = 'LOCAL_AUTH_USER';
export const AUTH_EVENT = 'LOCAL_AUTH_CHANGED';

function emitAuthChange() {
  try {
    const user = getUser();
    const token = getToken();
    const detail = { user, token };
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail }));
  } catch {
    // ignore
  }
}

type LocalUser = { id: string; email: string; full_name: string; role: 'user' | 'admin_normal' | 'super_admin' };

export async function loginLocal(email: string, password: string): Promise<LocalUser> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Falha no login local');
  }
  const data = await res.json();
  setSession(data.token, data.user);
  return data.user as LocalUser;
}

export async function meLocal(): Promise<LocalUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.user) {
    setUser(data.user);
    return data.user as LocalUser;
  }
  return null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): LocalUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: LocalUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function setUser(user: LocalUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitAuthChange();
}

export const isLocalMode = IS_LOCAL_DB;