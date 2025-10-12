import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthProvider";
import { Toaster } from "sonner";
import Protected from "@/components/Protected";
import Accueil from "./pages/Accueil";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TableauDeBord from "./pages/TableauDeBord";
import Dashboard from "./pages/Dashboard";
import Etablissement from "./pages/Etablissement";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "z-[9999]" }} />
        <Routes>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;