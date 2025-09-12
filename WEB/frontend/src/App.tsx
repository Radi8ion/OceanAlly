import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ResetPassword from "./pages/ResetPassword";
// Layout and Page Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Auth from "./pages/Auth";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import VerificationDashboard from "./pages/VerificationDashboard";
import AuthSuccess from './pages/AuthSuccess';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Auth /></Layout>} />
          <Route path="/register" element={<Layout><Auth /></Layout>} />
          <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute>
                <Layout><Report /></Layout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/verify"
            element={
              <ProtectedRoute roles={['official', 'admin']}>
                <Layout><VerificationDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all Not Found Route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
