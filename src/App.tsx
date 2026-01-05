import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import RequireGuest from "@/components/RequireGuest";
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
import CreerComptePreview from "./pages/CreerComptePreview";
import MerciInscription from "./pages/MerciInscription";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback";
import Contact from "./pages/Contact";
import APropos from "./pages/APropos";
import Fonctionnalites from "./pages/Fonctionnalites";
import Aide from "./pages/Aide";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import ForgotPassword from "./pages/ForgotPassword";
import Abonnement from "./pages/Abonnement";
import Compte from "./pages/Compte";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't scroll to top if there's a hash (anchor) in the URL
    if (!location.hash) {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, [location.pathname, location.hash]);

  return null;
};

// Composant global pour détecter le retour depuis Stripe
const StripeReturnDetector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne vérifier que si on n'est pas déjà sur la page d'annulation
    if (location.pathname !== "/billing/cancel") {
      console.log("Checking stripe return");
      if (sessionStorage.getItem("stripeCheckoutStarted") === "true") {
        sessionStorage.removeItem("stripeCheckoutStarted");
        navigate("/billing/cancel");
      }
    }
  }, [location.pathname, navigate]);

  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <StripeReturnDetector />
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "z-[9999]" }} />
        <AppLayout>
          <Routes>
            {/* Public routes - redirect to dashboard if authenticated */}
            <Route path="/" element={
              <RequireGuest>
                <Accueil />
              </RequireGuest>
            } />
            <Route path="/accueil" element={<Navigate to="/" replace />} />
            <Route path="/login" element={
              <RequireGuest>
                <Login />
              </RequireGuest>
            } />
            <Route path="/connexion" element={
              <RequireGuest>
                <Login />
              </RequireGuest>
            } />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/fonctionnalites" element={<Fonctionnalites />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/abonnement" element={
              <RequireGuest>
                <Abonnement />
              </RequireGuest>
            } />
            <Route path="/onboarding" element={
              <RequireGuest>
                <Onboarding />
              </RequireGuest>
            } />
            <Route path="/onboarding/signup" element={
              <RequireGuest>
                <OnboardingSignup />
              </RequireGuest>
            } />
            <Route path="/creer-compte-preview" element={
              <RequireGuest>
                <CreerComptePreview />
              </RequireGuest>
            } />
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
            <Route path="/compte" element={
              <Protected>
                <Compte />
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
            <Route path="/merci-inscription" element={<MerciInscription />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;