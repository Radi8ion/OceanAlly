import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/api";
import React from "react";

// Define the User type to match your backend's Mongoose model.
// This gives you type safety and autocompletion.
interface User {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
  // Add any other fields from your User model here
}

/**
 * This is the function that react-query will call to fetch data.
 * It handles getting the token from Clerk and making the authenticated API call.
 * @param getToken - The `getToken` function from Clerk's `useAuth` hook.
 * @returns The user data from your backend database.
 */
const fetchAndSyncUser = async (getToken: () => Promise<string | null>): Promise<User> => {
  const token = await getToken();
  if (!token) {
    throw new Error("User is not authenticated. Cannot fetch token.");
  }

  const response = await apiClient.get('/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.data.success || !response.data.user) {
    throw new Error("Failed to sync user data from the backend.");
  }

  // The backend API returns an object like { success: true, user: {...} }
  return response.data.user;
};


/**
 * AuthSync Component
 * This component's main job is to call your `/me` endpoint after login.
 * It uses react-query to fetch, cache, and manage the state of the user data.
 * It will only render its children (your protected pages) after the user
 * has been successfully fetched and synced.
 */
const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // Use react-query to fetch and cache the user data from your backend.
  const { data: user, isLoading, isError, error } = useQuery<User, Error>({
    // The query will only execute if Clerk has loaded and the user is signed in.
    enabled: isLoaded && isSignedIn,
    queryKey: ['me'], // This is the unique key for caching this data.
    queryFn: () => fetchAndSyncUser(getToken),
    staleTime: 15 * 60 * 1000, // Cache data for 15 minutes before considering it stale.
    // cacheTime: 60 * 60 * 1000, // Keep inactive data in the cache for 1 hour.
    retry: 1, // Retry a failed request once before showing an error.
  });

  // While Clerk is initializing or we are fetching the user, show a loading screen.
  if (isLoading || !isLoaded) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <p className="text-lg text-gray-700">Syncing user session...</p>
      </div>
    );
  }

  // If there was an error fetching the user from your backend.
  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50">
        <p className="text-lg font-semibold text-red-700">Authentication Sync Failed</p>
        <p className="text-sm text-red-600 mt-2">{error.message}</p>
      </div>
    );
  }

  // If the user is loaded, signed in, and we have their synced data, render the protected content.
  if (isSignedIn && user) {
    return <>{children}</>;
  }
  
  // This is a fallback case. If <SignedIn> is used correctly in App.tsx,
  // this state should not be reachable.
  return (
     <div className="flex justify-center items-center h-screen">
       <p>Redirecting to login...</p>
    </div>
  )
};

export default AuthSync;
