// Create a new file: pages/AuthSuccess.tsx

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Save the token
      localStorage.setItem('token', token);
      
      // 2. Set token for future axios requests (optional but good practice)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. You could also fetch user data here if needed, or just redirect
      // For simplicity, we'll just redirect.

      alert('Login successful!'); // Or use a more elegant toast notification
      
      // 4. Redirect to the dashboard
      navigate('/dashboard');
    } else {
      // Handle error case where token is not present
      alert('Authentication failed. Please try again.');
      navigate('/login'); // Redirect back to login
    }
  }, [searchParams, navigate]);

  // Render a loading state while processing
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Finalizing your login, please wait...</p>
    </div>
  );
};

export default AuthSuccess;