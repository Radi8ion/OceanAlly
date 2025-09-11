import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Auth from "./pages/Auth";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import MyReports from "./pages/MyReports";
import AwarenessHub from "./pages/AwarenessHub";
import AdminDashboard from "./pages/AdminDashboard";
import "./i18n";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/report" element={<Layout><Report /></Layout>} />
          <Route path="/my-reports" element={<Layout><MyReports /></Layout>} />
          <Route path="/awareness" element={<Layout><AwarenessHub /></Layout>} />
          <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
          <Route path="/login" element={<Layout><Auth /></Layout>} />
          <Route path="/register" element={<Layout><Auth /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
