import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  login: (email: string, password: string, role?: Role) => Promise<User>;
  logout: () => void;
  /** parent: currently selected child */
  activeStudentId: string | null;
  setActiveStudentId: (id: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.restore());
  const [activeStudentId, setActive] = useState<string | null>(() => {
    const u = authService.restore();
    return u?.studentId ?? u?.studentIds?.[0] ?? null;
  });

  const login = useCallback(async (email: string, password: string, role?: Role) => {
    const s = await authService.login(email, password, role);
    setUser(s.user);
    setActive(s.user.studentId ?? s.user.studentIds?.[0] ?? null);
    return s.user;
  }, []);

  const logout = useCallback(() => { authService.logout(); setUser(null); setActive(null); }, []);

  const value = useMemo(() => ({ user, login, logout, activeStudentId, setActiveStudentId: setActive }), [user, login, logout, activeStudentId]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
