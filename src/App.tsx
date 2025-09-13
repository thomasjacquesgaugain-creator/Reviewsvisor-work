import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { AuthProvider } from "@/contexts/AuthProvider";
import AuthGate from "@/components/AuthGate";
import Protected from "@/components/Protected";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import TableauDeBord from "./pages/TableauDeBord";
import Dashboard from "./pages/Dashboard";
import Etablissement from "./pages/Etablissement";
import Debug from "./pages/Debug";
import EnvDebug from "./pages/EnvDebug";
import ReviewsDebug from "./pages/ReviewsDebug";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        console.debug('maps loaded app', typeof (window as any).google !== 'undefined');
      })
      .catch((e) => {
        console.error('Erreur de chargement Google Maps:', e);
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthGate>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={
                  <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="w-full max-w-4xl">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h2 className="text-2xl font-bold text-foreground">Créer un compte</h2>
                          <SignUpForm />
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-2xl font-bold text-foreground">Se connecter</h2>
                          <SignInForm />
                        </div>
                      </div>
                    </div>
                  </div>
                } />
                <Route path="/accueil" element={
                  <Protected>
                    <Accueil />
                  </Protected>
                } />
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
                <Route path="/debug" element={<Debug />} />
                <Route path="/debug/env" element={<EnvDebug />} />
                <Route path="/debug/reviews" element={<ReviewsDebug />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
