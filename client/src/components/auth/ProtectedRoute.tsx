import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'USER',
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, refreshUser } = useAuthStore();

  useEffect(() => {
    // If not authenticated but we have a stored user, try to refresh
    if (!isAuthenticated && !isLoading) {
      refreshUser();
    }
  }, [isAuthenticated, isLoading, refreshUser]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (user && requiredRole) {
    const roleHierarchy = { USER: 1, ADMIN: 2 };
    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      // Redirect to unauthorized page or dashboard
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for role-based protection
 */
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: UserRole
) {
  return function RoleProtectedComponent(props: T) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
