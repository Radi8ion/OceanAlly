import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Define the shape of the user object
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
}

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// The AuthProvider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // You should verify the token with your backend for security
          // For this example, we'll decode and assume it's valid if not expired
          const decoded: { id: string, name: string, email: string, role: User['role'], exp: number } = jwtDecode(token);
          if (decoded.exp * 1000 > Date.now()) {
            setUser({ _id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
            // Set token for all future axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            // Token is expired
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded: { id: string, name: string, email: string, role: User['role'] } = jwtDecode(token);
    setUser({ _id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// The custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
