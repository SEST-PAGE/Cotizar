import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, getSession, login as dbLogin, logout as dbLogout, createUser } from "../db/database";

interface AuthCtx {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (data: Omit<User, "id" | "createdAt" | "role">) => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s) setUser(s);
  }, []);

  const login = async (email: string, pass: string) => {
    const u = dbLogin(email, pass);
    setUser(u);
  };

  const logout = () => {
    dbLogout();
    setUser(null);
  };

  const register = async (data: Omit<User, "id" | "createdAt" | "role">) => {
    const u = createUser(data);
    setUser(u);
    const { login: l } = await import("../db/database");
    l(u.email, u.password);
  };

  return <AuthContext.Provider value={{ user, login, logout, register }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
