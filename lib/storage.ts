import { isSession, type Session } from "./game.ts";

const SESSION = "pq_session";
const ATTEMPTS = "pq_attempts";
const MUTED = "pq_muted";

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage tidak tersedia (private mode dsb): game tetap jalan tanpa persistensi
  }
}

export function loadSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(get(SESSION) ?? "null");
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const saveSession = (s: Session | null) => set(SESSION, s && JSON.stringify(s));

export function loadAttempts(): number {
  const n = Number(get(ATTEMPTS));
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export const saveAttempts = (n: number) => set(ATTEMPTS, String(n));

export const loadMuted = () => get(MUTED) === "1";
export const saveMuted = (m: boolean) => set(MUTED, m ? "1" : "0");
