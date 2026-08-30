"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/shared/lib/domain";
import { apiClient } from "@/shared/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient<User>("GET", "/auth/me")
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient<{ user: User; access_token: string }>("POST", "/auth/login", { email, password });
    // Backend pose un cookie HttpOnly sur onrender.com (cross-site). Le proxy Next.js
    // sur vercel.app ne peut pas le lire → on pose une copie lisible sur vercel.app
    // pour que proxy.ts (decodeAccess) autorise /dashboard et /plan.
    if (data.access_token && typeof document !== "undefined") {
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `coachyosri_access=${data.access_token}; Path=/; Max-Age=900; SameSite=Lax${secure}`;
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient("POST", "/auth/logout");
    } catch {
      // serveur injoignable — on déconnecte quand même localement
    } finally {
      if (typeof document !== "undefined") {
        document.cookie = "coachyosri_access=; Path=/; Max-Age=0; SameSite=Lax";
      }
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}