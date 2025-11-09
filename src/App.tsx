import { useEffect } from "react";
import { useLocation, useNavigate, BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Draggable from "react-draggable";

import Index from "./pages/Index";
import CompactDashboard from "./pages/CompactDashboard";
import PairAddressInput from "./components/Pairinput";
import NotFound from "./pages/NotFound";

// Initialize React Query
const queryClient = new QueryClient();

// Detect environment
const appMode = import.meta.env.VITE_APP_MODE;
const isExtension =
  appMode === "extension" || window.location.protocol === "chrome-extension:";

// Pick appropriate router
const Router = isExtension ? HashRouter : BrowserRouter;

// Handle routing inside extension popup
const RouteRedirector = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isExtension && location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <RouteRedirector>
          <Routes>
            {/* Default route */}
            <Route
              path="/"
              element={
                isExtension ? <CompactDashboard /> : <Index />
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={isExtension ? <CompactDashboard /> : <Index />}
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteRedirector>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
