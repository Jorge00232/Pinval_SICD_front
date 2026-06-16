import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession, type UserRole } from '../api/authApi';

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const session = getSession();

  if (!session?.accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
