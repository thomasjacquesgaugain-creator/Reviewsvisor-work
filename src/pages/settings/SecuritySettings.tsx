import { useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Smartphone } from "lucide-react";

export function SecuritySettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setChangingPassword(true);
      
      // Update password via Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Mot de passe mis à jour avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Connexion & sécurité</h1>

      {/* Mot de passe */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Mot de passe</h2>
        </div>
        
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}>
            {changingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </Button>
        </form>
      </div>

      {/* Authentification à deux facteurs */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Smartphone className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Authentification à deux facteurs</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            L'authentification à deux facteurs (2FA) sera bientôt disponible pour renforcer la sécurité de votre compte.
          </p>
        </div>
      </div>

      {/* Sessions actives */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sessions actives</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Session actuelle</p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.email} • {navigator.userAgent.includes("Chrome") ? "Chrome" : "Navigateur"}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
