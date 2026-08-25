import type { Session } from "./domain";
import { storageGet, storageRemove, storageSet } from "./storage";

const SESSION_KEY = "9awi_session";

export async function getSession(): Promise<Session | null> {
  const raw = await storageGet(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s.userId && s.role) return s;
    return null;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  await storageSet(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await storageRemove(SESSION_KEY);
}