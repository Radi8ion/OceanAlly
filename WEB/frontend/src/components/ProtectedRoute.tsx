import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: Array<'citizen' | 'official' | 'admin'>;
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You can replace this with a beautiful loading spinner component
    return <div>Loading...</div>;
  }

  if (!user) {
    // User is not logged in, redirect them to the login page.
    // Pass the current location so we can redirect them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // User is logged in but does not have the required role.
    // Redirect them to a "not authorized" page or the dashboard.
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // User is authenticated and has the required role (if any), so render the component.
  return children;
};

export default ProtectedRoute;
