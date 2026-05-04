import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ViewProvider, useView } from "@/context/ViewContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./layouts/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import History from "./pages/dashboard/History";
import Blocked from "./pages/dashboard/Blocked";
import ScreenTime from "./pages/dashboard/ScreenTime";
import Alerts from "./pages/dashboard/Alerts";
import Focus from "./pages/dashboard/Focus";
import AIAssistant from "./pages/dashboard/AIAssistant";
import MultiChild from "./pages/dashboard/MultiChild";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import ChildDashboard from "./pages/ChildDashboard";
import SafetyScanner from "./pages/dashboard/SafetyScanner";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
  </div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRouter() {
  const { view } = useView();
  if (view === "child") return <ChildDashboard />;
  return <DashboardLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ViewProvider>
          <TooltipProvider>
            <Sonner />
            <HotToaster position="top-right" toastOptions={{
              style: { borderRadius: '14px', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' },
            }} />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>}>
                  <Route index element={<Overview />} />
                  <Route path="history" element={<History />} />
                  <Route path="blocked" element={<Blocked />} />
                  <Route path="screen-time" element={<ScreenTime />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="focus" element={<Focus />} />
                  <Route path="ai" element={<AIAssistant />} />
                  <Route path="children" element={<MultiChild />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="scanner" element={<SafetyScanner />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ViewProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
