import axios from 'axios';

/**
 * Creates a centralized, pre-configured Axios instance.
 */
const apiClient = axios.create({
  // Sets the base URL for all API requests.
  // Make sure this matches your backend server's address and port.
  baseURL: 'http://localhost:5000/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REMOVED: The old request interceptor that used localStorage.
 * * Clerk's frontend SDK manages session tokens automatically. We will now add the
 * 'Authorization' header dynamically at the time of the request using the
 * token provided by Clerk's `useAuth` hook. This is more secure and is the
 * standard practice when using Clerk.
 */

export default apiClient;
