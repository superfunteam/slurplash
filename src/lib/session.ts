import type { AvatarId } from "@/shared/avatars";
import type { Role } from "@/shared/types";

export interface SavedSession {
  code: string;
  id: string;
  token: string;
  role: Role;
  name?: string;
  avatar?: AvatarId;
}

const KEY = "slurplash:session";
const HOST_KEY = "slurplash:host";

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: SavedSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode etc. */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function loadHostToken(code: string): string | null {
  try {
    const raw = localStorage.getItem(HOST_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[code] ?? null;
  } catch {
    return null;
  }
}

export function saveHostToken(code: string, token: string) {
  try {
    const raw = localStorage.getItem(HOST_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[code] = token;
    localStorage.setItem(HOST_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}
