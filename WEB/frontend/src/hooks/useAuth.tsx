import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Define the shape of the user object
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'official' | 'admin';
  firstName?: string;
  lastName?: string;
  phone?: string;
  organization?: string;
  location?: string;
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

  // Function to fetch user data from API
  const fetchUserData = async (token: string) => {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('http://localhost:5000/api/v1/auth/me');
      console.log('API Response:', response);
      
      // The API returns { success: true, user: { ... } }
      if (response.data.success && response.data.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode token to check expiration
          const decoded: any = jwtDecode(token);
          console.log('JWT payload:', decoded);
          
          if (decoded.exp * 1000 > Date.now()) {
            // Token is valid, fetch user data from API
            const userData = await fetchUserData(token);
            console.log('Fetched user data:', userData);
            
            if (userData) {
              setUser({
                _id: userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                organization: userData.organization,
                location: userData.location
              });
            } else {
              // Failed to fetch user data
              console.log('Failed to fetch user data, removing token');
              localStorage.removeItem('token');
              delete axios.defaults.headers.common['Authorization'];
            }
          } else {
            console.log('Token is expired');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token: string) => {
    console.log('Login called with token');
    localStorage.setItem('token', token);
    
    try {
      // Fetch user data after login
      const userData = await fetchUserData(token);
      console.log('Login - Fetched user data:', userData);
      
      if (userData) {
        setUser({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          organization: userData.organization,
          location: userData.location
        });
      } else {
        console.error('Failed to fetch user data during login');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Error during login:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
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