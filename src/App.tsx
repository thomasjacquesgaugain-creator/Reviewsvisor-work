
import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import RequireGuest from "@/components/RequireGuest";
import { AppLayout } from "@/components/AppLayout";
import { loadCustomization } from "@/utils/theme";
import { diagnoseSupabaseStorage } from "@/utils/supabaseDiagnostics";
import { SettingsLayout } from "./components/settings/SettingsLayout";

const Accueil = lazy(() => import("./pages/Accueil"));
const Login = lazy(() => import("./pages/Login"));
const TableauDeBord = lazy(() => import("./pages/TableauDeBord"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Etablissement = lazy(() => import("./pages/Etablissement"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BillingSuccess = lazy(() => import("./pages/BillingSuccess"));
const BillingCancel = lazy(() => import("./pages/BillingCancel"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingSignup = lazy(() => import("./pages/OnboardingSignup"));
const MerciInscription = lazy(() => import("./pages/MerciInscription"));
const GoogleOAuthCallback = lazy(() => import("./pages/GoogleOAuthCallback"));
const Contact = lazy(() => import("./pages/Contact"));
const APropos = lazy(() => import("./pages/APropos"));
const Fonctionnalites = lazy(() => import("./pages/Fonctionnalites"));
const Aide = lazy(() => import("./pages/Aide"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Cgu = lazy(() => import("./pages/Cgu"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const PolitiqueCookies = lazy(() => import("./pages/PolitiqueCookies"));
const Inscription = lazy(() => import("./pages/Inscription"));
const Messages = lazy(() => import("./pages/Messages"));
const ProfileSettings = lazy(() => import("./pages/settings/ProfileSettings").then(m => ({ default: m.ProfileSettings })));
const SecuritySettings = lazy(() => import("./pages/settings/SecuritySettings").then(m => ({ default: m.SecuritySettings })));
const EstablishmentsSettings = lazy(() => import("./pages/settings/EstablishmentsSettings").then(m => ({ default: m.EstablishmentsSettings })));
const EstablishmentInfoSettings = lazy(() => import("./pages/settings/EstablishmentInfoSettings").then(m => ({ default: m.EstablishmentInfoSettings })));
const NotificationsSettings = lazy(() => import("./pages/settings/NotificationsSettings").then(m => ({ default: m.NotificationsSettings })));
const LanguageSettings = lazy(() => import("./pages/settings/LanguageSettings").then(m => ({ default: m.LanguageSettings })));
const BillingSettings = lazy(() => import("./pages/settings/BillingSettings").then(m => ({ default: m.BillingSettings })));
const BillingReports = lazy(() => import("./pages/settings/BillingReports").then(m => ({ default: m.BillingReports })));
const CustomizationSettings = lazy(() => import("./pages/settings/CustomizationSettings").then(m => ({ default: m.CustomizationSettings })));

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
    // Removed key in case of billing sucess to avoid redirection on billing/cancel page after successful payment
    // Laisser la page de succès tranquille et purger le flag
    if (location.pathname === "/billing/success") {
      sessionStorage.removeItem("stripeCheckoutStarted");
      return;
    }
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
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
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
            {/* <Route path="/abonnement" element={<Abonnement />} /> */}
            <Route path="/cgu" element={<Cgu />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/politique-cookies" element={<PolitiqueCookies />} />
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
            {/* <Route path="/creer-compte-preview" element={
              <RequireGuest>
                <CreerComptePreview />
              </RequireGuest>
            } /> */}
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
            {/* <Route path="/compte" element={
              <Protected>
                <Compte />
              </Protected>
            } /> */}
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
                <Messages />
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
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;