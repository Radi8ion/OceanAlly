import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

// Ensure the User type is consistent with AuthSync.tsx
interface User {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
}

interface RoleProtectedRouteProps {
  roles: Array<'citizen' | 'official' | 'admin'>;
  children: React.ReactNode;
}

/**
 * RoleProtectedRoute Component
 * This component protects routes that should only be accessible to specific roles.
 * It reads the user data from the react-query cache (which was populated by AuthSync)
 * and checks if the user's role is in the list of allowed roles.
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ roles, children }) => {
  const { toast } = useToast();

  // Get the user data from the cache using the same query key ('me').
  // This will NOT trigger a new network request if the data is already in the cache.
  const { data: user, isLoading, isSuccess } = useQuery<User, Error>({
    queryKey: ['me'],
  });

  // While react-query is retrieving the user from cache, show a loading state.
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <p>Verifying permissions...</p>
        </div>
      );
  }

  // If data is successfully loaded and the user's role is permitted, render the page.
  if (isSuccess && user && roles.includes(user.role)) {
    return <>{children}</>;
  }

  // If the user is not authorized, redirect them to the dashboard and show a toast.
  // We use a useEffect to ensure the toast is only called once when the component decides to redirect.
  React.useEffect(() => {
    if (isSuccess && (!user || !roles.includes(user.role))) {
      toast({
        title: "Access Denied",
        description: "You do not have the necessary permissions to view this page.",
        variant: "destructive",
      });
    }
  }, [isSuccess, user, roles, toast]);
  
  // The Navigate component from react-router-dom handles the redirect.
  // The `replace` prop prevents this unauthorized page from being in the browser history.
  return <Navigate to="/dashboard" replace />;
};

export default RoleProtectedRoute;
