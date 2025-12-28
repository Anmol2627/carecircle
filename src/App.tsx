import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { DemoModeToggle } from "@/components/demo/DemoModeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShakeToAlert } from "@/hooks/useShakeToAlert";
import Index from "./pages/Index";
import MapPage from "./pages/MapPage";
import CirclePage from "./pages/CirclePage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to enable shake-to-alert when user is authenticated
const ShakeToAlertWrapper = () => {
  const { user } = useAuth();
  useShakeToAlert({ 
    enabled: !!user,
    onShakeDetected: () => {
      console.log('Shake detected - SOS triggered');
    }
  });
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoModeProvider>
        <ShakeToAlertWrapper />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
              <Route path="/circle" element={<ProtectedRoute><CirclePage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {/* DEMO MODE - Can be removed when demo mode is removed */}
          <DemoModeToggle />
        </TooltipProvider>
      </DemoModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
