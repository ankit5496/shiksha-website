import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ROLE_HOME } from '@/services/authService';

/**
 * Guards a route tree by role. Unauthenticated users go to the login page (with the intended portal pre-selected);
 * authenticated users of another role are sent back to their own dashboard.
 */
export function ProtectedRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to={`/login?role=${roles[0]}&next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace state={{ denied: loc.pathname }} />;
  return <>{children}</>;
}
