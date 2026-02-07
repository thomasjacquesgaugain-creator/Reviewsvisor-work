import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateProfile, logSupabaseError } from "@/services/profileService";
import { EditableField } from "@/components/settings/EditableField";
import { ProfilePhotoUploader } from "@/components/settings/ProfilePhotoUploader";
import { toast } from "sonner";
import { validatePhoneNumber, formatPhoneNumber } from "@/utils/phoneValidation";
import { formatAddress } from "@/utils/addressFormatting";

function trimStr(v: unknown): string {
  return (v ?? "").toString().trim();
}

export function ProfileSettings() {
  const { user, displayName, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayNameState, setDisplayNameState] = useState("");
  const [phone, setPhone] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setLoadError(null);

    const profile = await getOrCreateProfile(supabase, user);

    if (!profile) {
      setLoadError("Impossible de charger le profil");
      toast.error("Erreur lors du chargement du profil");
      const meta = user.user_metadata ?? {};
      const metaFirst = trimStr(meta.first_name ?? meta.given_name);
      const metaLast = trimStr(meta.last_name ?? meta.family_name);
      const metaDisplay =
        trimStr(meta.display_name ?? meta.name ?? meta.full_name) ||
        (metaFirst || metaLast ? `${metaFirst} ${metaLast}`.trim() : "");
      setFirstName(metaFirst);
      setLastName(metaLast);
      setDisplayNameState(metaDisplay || (user.email?.split("@")[0] ?? ""));
      setPhone("");
      setPostalAddress("");
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    const meta = user.user_metadata ?? {};
    const metaFirst = trimStr(meta.first_name ?? meta.given_name);
    const metaLast = trimStr(meta.last_name ?? meta.family_name);
    const metaDisplay =
      trimStr(meta.display_name ?? meta.name ?? meta.full_name) ||
      (metaFirst || metaLast ? `${metaFirst} ${metaLast}`.trim() : "");

    setFirstName(trimStr(profile.first_name) || metaFirst);
    setLastName(trimStr(profile.last_name) || metaLast);
    setDisplayNameState(
      trimStr(profile.display_name) || metaDisplay || (metaFirst || metaLast ? `${metaFirst} ${metaLast}`.trim() : "")
    );
    setPhone(trimStr(profile.phone));
    setPostalAddress(trimStr(profile.postal_address));
    setAvatarUrl(profile.avatar_url ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleSaveFirstName = async (value: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          first_name: value,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      setFirstName(value);
      await refreshProfile();
      toast.success("Prénom mis à jour");
    } catch (err) {
      logSupabaseError("ProfileSettings (save first name)", err);
      toast.error("Erreur lors de la mise à jour");
      throw err;
    }
  };

  const handleSaveLastName = async (value: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          last_name: value,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      setLastName(value);
      await refreshProfile();
      toast.success("Nom mis à jour");
    } catch (err) {
      logSupabaseError("ProfileSettings (save last name)", err);
      toast.error("Erreur lors de la mise à jour");
      throw err;
    }
  };

  const handleSaveDisplayName = async (value: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: value,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      setDisplayNameState(value);
      await refreshProfile();
      toast.success("Nom d'affichage mis à jour");
    } catch (err) {
      logSupabaseError("ProfileSettings (save display name)", err);
      toast.error("Erreur lors de la mise à jour");
      throw err;
    }
  };

  const handleSavePhone = async (value: string) => {
    if (!user) return;
    
    // Validation
    const validation = validatePhoneNumber(value);
    if (!validation.valid) {
      toast.error(validation.error || "Format de numéro invalide");
      throw new Error(validation.error);
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          phone: value.trim() || null,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      setPhone(value.trim());
      toast.success("Numéro de téléphone mis à jour");
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message?.includes("Format")) {
        throw err;
      }
      logSupabaseError("ProfileSettings (save phone)", err);
      toast.error("Erreur lors de la mise à jour du numéro");
      throw err;
    }
  };

  const handleSavePostalAddress = async (value: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          postal_address: value.trim() || null,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
      
      setPostalAddress(value.trim());
      toast.success("Adresse postale mise à jour");
    } catch (err) {
      logSupabaseError("ProfileSettings (save postal address)", err);
      toast.error("Erreur lors de la mise à jour de l'adresse");
      throw err;
    }
  };

  const handleAvatarUpdated = async (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    await refreshProfile();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h1>
      {loadError && (
        <p className="text-sm text-amber-600 mb-6" role="alert">
          {loadError}
        </p>
      )}
      {!loadError && <div className="mb-8" />}

      {/* Photo de profil */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-4">Photo de profil</label>
        {user && (
          <ProfilePhotoUploader
            userId={user.id}
            currentAvatarUrl={avatarUrl}
            displayName={displayName}
            onAvatarUpdated={handleAvatarUpdated}
          />
        )}
      </div>

      {/* Champs éditables */}
      <div className="space-y-0">
        <EditableField
          label="Prénom"
          value={firstName}
          onSave={handleSaveFirstName}
          placeholder="Votre prénom"
        />
        <EditableField
          label="Nom"
          value={lastName}
          onSave={handleSaveLastName}
          placeholder="Votre nom"
        />
        <EditableField
          label="Nom d'affichage"
          value={displayNameState}
          onSave={handleSaveDisplayName}
          placeholder="Nom affiché publiquement"
        />
        <EditableField
          label="Numéro de téléphone"
          value={phone ? formatPhoneNumber(phone) : ""}
          onSave={handleSavePhone}
          placeholder="+33123456789"
          type="tel"
          emptyLabel="Information non fournie"
        />
        <EditableField
          label="Adresse postale"
          value={postalAddress ? formatAddress(postalAddress) : ""}
          onSave={handleSavePostalAddress}
          placeholder="1 Cr de la Bôve, 56100 Lorient"
          type="textarea"
          emptyLabel="Information non fournie"
        />
        <div className="flex items-start justify-between py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <div className="text-sm text-gray-900">{user?.email}</div>
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>
        </div>
      </div>
    </div>
  );
}
