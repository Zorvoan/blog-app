import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  loginUser,
  registerUser,
  updateUser,
  loadSession,
  saveSession,
  clearSession,
  getUserById,
} from "@/lib/auth";
import type { User, Session } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: {
    display_name?: string;
    bio?: string;
    avatar_color?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setLoading(false);
      return;
    }
    getUserById(session.userId)
      .then((u) => {
        if (u) setUser(u);
        else clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const u = await loginUser(identifier, password);
    setUser(u);
    saveSession({ userId: u.id, username: u.username });
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const u = await registerUser(username, email, password);
      setUser(u);
      saveSession({ userId: u.id, username: u.username });
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: {
      display_name?: string;
      bio?: string;
      avatar_color?: string;
    }) => {
      if (!user) return;
      const updated = await updateUser(user.id, updates);
      setUser(updated);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
