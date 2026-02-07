
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import RequireGuest from "@/components/RequireGuest";
import { AppLayout } from "@/components/AppLayout";
import { loadCustomization } from "@/utils/theme";
import { diagnoseSupabaseStorage } from "@/utils/supabaseDiagnostics";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import TableauDeBord from "./pages/TableauDeBord";
import Dashboard from "./pages/Dashboard";
import Etablissement from "./pages/Etablissement";
import NotFound from "./pages/NotFound";
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
import Inscription from "./pages/Inscription";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { ProfileSettings } from "./pages/settings/ProfileSettings";
import { SecuritySettings } from "./pages/settings/SecuritySettings";
import { EstablishmentsSettings } from "./pages/settings/EstablishmentsSettings";
import { EstablishmentInfoSettings } from "./pages/settings/EstablishmentInfoSettings";
import { NotificationsSettings } from "./pages/settings/NotificationsSettings";
import { LanguageSettings } from "./pages/settings/LanguageSettings";
import { BillingSettings } from "./pages/settings/BillingSettings";
import { BillingReports } from "./pages/settings/BillingReports";
import { CustomizationSettings } from "./pages/settings/CustomizationSettings";

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
  // Initialiser le thème au chargement (backup si main.tsx n'a pas fonctionné)
  useEffect(() => {
    loadCustomization();
  }, []);

  // Diagnostic Supabase Storage (dev uniquement)
  useEffect(() => {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDev) {
      // Attendre un peu pour que Supabase soit initialisé
      setTimeout(() => {
        diagnoseSupabaseStorage();
      }, 1000);
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <StripeReturnDetector />
        <Toaster 
          position="bottom-right" 
          richColors 
          closeButton 
          expand={true}
          visibleToasts={5}
          gap={10}
          toastOptions={{ 
            className: "z-[9999]",
            style: {
              position: 'relative',
            }
          }} 
        />
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
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/inscription" element={
              <RequireGuest>
                <Inscription />
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
            <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="/settings/profile" element={
              <Protected>
                <SettingsLayout>
                  <ProfileSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/security" element={
              <Protected>
                <SettingsLayout>
                  <SecuritySettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/establishments" element={
              <Protected>
                <SettingsLayout>
                  <EstablishmentsSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/establishment-info" element={
              <Protected>
                <SettingsLayout>
                  <EstablishmentInfoSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/notifications" element={
              <Protected>
                <SettingsLayout>
                  <NotificationsSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/language" element={
              <Protected>
                <SettingsLayout>
                  <LanguageSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/billing" element={
              <Protected>
                <SettingsLayout>
                  <BillingSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/billing/reports" element={
              <Protected>
                <SettingsLayout>
                  <BillingReports />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/settings/customization" element={
              <Protected>
                <SettingsLayout>
                  <CustomizationSettings />
                </SettingsLayout>
              </Protected>
            } />
            <Route path="/messages" element={
              <Protected>
                <div className="p-8">
                  <h1 className="text-2xl font-semibold mb-4">Messages</h1>
                  <p className="text-gray-500">Cette fonctionnalité sera bientôt disponible.</p>
                </div>
              </Protected>
            } />
            <Route path="/etablissement" element={
              <Protected>
                <Etablissement />
              </Protected>
            } />
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