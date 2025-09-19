import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SignedOut,RedirectToSignIn } from "@clerk/clerk-react";
import { useAuth, SignIn, SignUp, SignedIn } from "@clerk/clerk-react";
import AuthSync from "./pages/AuthSync";
// Layout and Page Components
import Layout from "./components/Layout";
import RoleProtectedRoute from "./pages/RoleProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import ProfilePage from "./pages/Profile"; // Import the ProfilePage component
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import VerificationDashboard from "./pages/VerificationDashboard";
import LiveFeeds from "./pages/LiveFeeds"; // Import the LiveFeeds component
import Analysis from "./pages/Analysis"; // Import the Analysis component

// Import the ChatbotOverlay component
import ChatbotOverlay from "./pages/ChatbotOverlay";

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
          <Route path="/about" element={<Layout><About /></Layout>} />
          
          {/* Clerk Authentication Routes - NOW with Layout (Navbar) */}
          <Route 
            path="/login/*" 
            element={
              <Layout>
                <div className="flex justify-center items-center min-h-[calc(100vh-80px)] py-8">
                  <SignIn path="/login" signUpUrl="/register" fallbackRedirectUrl="/dashboard"/>
                </div>
              </Layout>
            } 
          />
          <Route 
            path="/register/*" 
            element={
              <Layout>
                <div className="flex justify-center items-center min-h-[calc(100vh-80px)] py-8">
                  <SignUp path="/register" signInUrl="/login" fallbackRedirectUrl="/dashboard"/>
                </div>
              </Layout>
            }
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <Layout><Dashboard /></Layout>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/live-feeds" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <Layout><LiveFeeds /></Layout>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/report" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <Layout><Report /></Layout>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <Layout><ProfilePage /></Layout>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          
          {/* Admin Only Routes */}
          <Route 
            path="/admin/analysis" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <RoleProtectedRoute roles={['admin']}>
                      <Layout><Analysis /></Layout>
                    </RoleProtectedRoute>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/admin/verify" 
            element={
              <>
                <SignedIn>
                  <AuthSync>
                    <RoleProtectedRoute roles={['official', 'admin']}>
                      <Layout><VerificationDashboard /></Layout>
                    </RoleProtectedRoute>
                  </AuthSync>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          
          {/* Catch-all Not Found Route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
        
        <ChatbotOverlay />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;