import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/shared/lib/api-client";
import type { Session, User } from "@/shared/lib/domain";
import { clearSession, setSession } from "@/shared/lib/session";
import { clearToken, getToken, setToken } from "@/shared/lib/token";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider non monté");
  },
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const me = await apiClient<User>("GET", "/auth/me");
        if (mounted) {
          setUser(me);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          await clearToken();
          await clearSession();
          setUser(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        const res = await apiClient<{ user: User; session: Session; access_token: string }>(
          "POST",
          "/auth/login",
          { email, password },
        );
        await setToken(res.access_token);
        await setSession(res.session);
        setUser(res.user);
        return res.user;
      },
      async logout() {
        try {
          await apiClient("POST", "/auth/logout");
        } catch {
          // serveur injoignable — on déconnecte quand même localement
        } finally {
          await clearToken();
          await clearSession();
          setUser(null);
        }
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}