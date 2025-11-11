import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loading } from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized, verifyToken, tokens } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Verify token on mount if we have tokens
    if (tokens?.access && !isAuthenticated) {
      verifyToken();
    }
  }, [tokens, isAuthenticated, verifyToken]);

  // Show loading while auth is initializing or during other loading states
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
