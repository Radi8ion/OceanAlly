import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create the API client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
 // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Only try to get token if we're in a browser environment
      if (typeof window !== 'undefined' && window.Clerk) {
        // Wait for Clerk to be ready
        await window.Clerk.load();
        
        // Get the current session and token
        const session = window.Clerk.session;
        if (session) {
          const token = await session.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to get Clerk token:', error);
      // Don't throw here - continue with request without token
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
      });

      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login or refresh token
          console.error('Authentication failed - redirecting to login');
          if (typeof window !== 'undefined' && window.Clerk) {
            // Sign out the user
            await window.Clerk.signOut();
            // Redirect to sign in
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Access forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error(`HTTP Error ${error.response.status}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No response received:', {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Add type declaration for window.Clerk
declare global {
  interface Window {
    Clerk: any;
  }
}

export default apiClient;