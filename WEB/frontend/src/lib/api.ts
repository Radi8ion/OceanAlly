import axios from 'axios';

/**
 * Creates a centralized, pre-configured Axios instance.
 * This is the standard way to handle API requests in a project.
 */
const apiClient = axios.create({
  // Sets the base URL for all API requests.
  // This means you don't have to type '/api/v1' for every call.
  baseURL: 'http://localhost:5000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor
 * * This function runs BEFORE each request is sent.
 * It retrieves the auth token from localStorage and adds it to the request headers.
 * This way, you don't have to manually add the token in every component.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // If the token exists, add it to the Authorization header.
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handles errors that occur during the request setup.
    return Promise.reject(error);
  }
);

export default apiClient;