import * as SecureStore from "expo-secure-store";
import type { Session } from "./domain";

const SESSION_KEY = "coachyosri_session";

export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
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
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
