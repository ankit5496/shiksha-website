import type { Role, Session, User } from '@/types';
import { DATA_MODE, DEMO_PASSWORD } from './config';
import { http, tokenStore } from './http';
import { mockDb } from './mockDb';

const SESSION_KEY = 'sps-session';

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  office: '/office',
  parent: '/parent',
  teacher: '/teacher',
  student: '/student',
};

export const DEMO_ACCOUNTS: { role: Role; label: string; email: string }[] = [
  { role: 'parent', label: 'Parent', email: 'parent@schooldemo.com' },
  { role: 'student', label: 'Student', email: 'student@schooldemo.com' },
  { role: 'teacher', label: 'Teacher', email: 'teacher@schooldemo.com' },
  { role: 'office', label: 'Office Staff', email: 'office@schooldemo.com' },
  { role: 'admin', label: 'Admin', email: 'admin@schooldemo.com' },
];

export const authService = {
  async login(email: string, password: string, expectedRole?: Role): Promise<Session> {
    let session: Session;
    if (DATA_MODE === 'api') {
      session = await http<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role: expectedRole }) });
    } else {
      await new Promise((r) => setTimeout(r, 450));
      const user = mockDb.all('users').find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || password !== DEMO_PASSWORD) throw new Error('Invalid email or password.');
      if (expectedRole && user.role !== expectedRole) throw new Error(`This account does not have access to the ${expectedRole} portal.`);
      session = { user, token: `demo.${btoa(user.id)}.${Date.now()}` };
    }
    tokenStore.set(session.token);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session.user)); } catch { /* ignore */ }
    return session;
  },

  logout() {
    tokenStore.set(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  },

  restore(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw && tokenStore.get() ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  },
};
