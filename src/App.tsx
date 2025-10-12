import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Auth from "./pages/Auth";
import TableauDeBord from "./pages/TableauDeBord";
import Dashboard from "./pages/Dashboard";
import Etablissement from "./pages/Etablissement";
import NotFound from "./pages/NotFound";
import DebugEnv from "./pages/DebugEnv";
import DebugReviews from "./pages/DebugReviews";
import DebugInsights from "./pages/DebugInsights";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "z-[9999]" }} />
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
          <Route path="/accueil" element={<Accueil />} />
          <Route path="/" element={<Navigate to="/accueil" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;