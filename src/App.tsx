import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import { AppLayout } from "@/components/AppLayout";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import TableauDeBord from "./pages/TableauDeBord";
import Dashboard from "./pages/Dashboard";
import Etablissement from "./pages/Etablissement";
import NotFound from "./pages/NotFound";
import DebugEnv from "./pages/DebugEnv";
import DebugReviews from "./pages/DebugReviews";
import DebugInsights from "./pages/DebugInsights";
import DebugPage from "./pages/Debug";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import Onboarding from "./pages/Onboarding";
import OnboardingSignup from "./pages/OnboardingSignup";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "z-[9999]" }} />
        <AppLayout>
          <Routes>
            <Route path="/accueil" element={<Accueil />} />
            <Route path="/" element={<Navigate to="/accueil" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tableau-de-bord" element={
              <Protected>
                <TableauDeBord />
              </Protected>
            } />
            <Route path="/dashboard" element={
              <Protected>
                <Dashboard />
              </Protected>
            } />
            <Route path="/etablissement" element={
              <Protected>
                <Etablissement />
              </Protected>
            } />
            <Route path="/debug/env" element={
              <Protected>
                <DebugEnv />
              </Protected>
            } />
            <Route path="/debug/reviews" element={
              <Protected>
                <DebugReviews />
              </Protected>
            } />
            <Route path="/debug/insights" element={
              <Protected>
                <DebugInsights />
              </Protected>
            } />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/billing/success" element={<BillingSuccess />} />
            <Route path="/billing/cancel" element={<BillingCancel />} />
            <Route path="/api/auth/callback/google" element={<GoogleOAuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/onboarding/signup" element={<OnboardingSignup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;