import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // 1. Save the token to localStorage
      localStorage.setItem('token', token);
      
      // 2. Set the token as a default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. Redirect to the dashboard after a short delay
      // NOTE: We are skipping the token verification step for now.
      setTimeout(() => navigate('/dashboard'), 1500);

    } else {
      // Handle the case where the token is missing from the URL
      console.error("Authentication failed: No token received.");
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  // Render a simple loading state
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="p-8 bg-card rounded-xl shadow-elevated border-border w-full max-w-md"
      >
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader2 className="w-16 h-16 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">Finalizing Login...</h2>
          <p className="text-muted-foreground">Please wait while we redirect you.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthSuccess;

