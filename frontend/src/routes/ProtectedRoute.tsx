import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function RoleRoute({
  allowed,
  children,
}: {
  allowed: UserRole;
  children: React.ReactNode;
}) {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role !== allowed) {
    return <Navigate to={role === 'hr' ? '/hr' : '/apply'} replace />;
  }

  return <>{children}</>;
}
