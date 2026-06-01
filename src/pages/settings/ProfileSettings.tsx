import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateProfile, logSupabaseError } from "@/services/profileService";
import { EditableField } from "@/components/settings/EditableField";
import { ProfilePhotoUploader } from "@/components/settings/ProfilePhotoUploader";
import { toast } from "sonner";
import { validatePhoneNumber, formatPhoneNumber } from "@/utils/phoneValidation";
import { formatAddress } from "@/utils/addressFormatting";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      toast.success(t("settings.personalInformation.validation.firstNameUpdated"));
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
      toast.success(t("settings.personalInformation.validation.lastNameUpdated"));
    } catch (err) {
      logSupabaseError("ProfileSettings (save last name)", err);
      toast.error("Erreur lors de la mise à jour");
      throw err;
    }
  };

  // const handleSaveDisplayName = async (value: string) => {
  //   if (!user) return;

  //   try {
  //     const { error } = await supabase
  //       .from("profiles")
  //       .upsert({
  //         user_id: user.id,
  //         display_name: value,
  //       }, {
  //         onConflict: "user_id",
  //       });

  //     if (error) throw error;
      
  //     setDisplayNameState(value);
  //     await refreshProfile();
  //     toast.success("Nom d'affichage mis à jour");
  //   } catch (err) {
  //     logSupabaseError("ProfileSettings (save display name)", err);
  //     toast.error("Erreur lors de la mise à jour");
  //     throw err;
  //   }
  // };

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
      toast.success(t("settings.personalInformation.validation.phoneNumberUpdated"));
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
      toast.success(t("settings.personalInformation.validation.addressUpdated"));
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
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">{t("settings.personalInformation.title")}</h1>
      {loadError && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-6" role="alert">
          {loadError}
        </p>
      )}
      {!loadError && <div className="mb-8" />}

      {/* Photo de profil */}
      <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">{t("settings.personalInformation.profilePicture")}</label>
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
          label={t("settings.personalInformation.firstName")}
          value={firstName}
          onSave={handleSaveFirstName}
          placeholder={t("settings.personalInformation.placeholder.firstName")}
        />
        <EditableField
          label={t("settings.personalInformation.lastName")}
          value={lastName}
          onSave={handleSaveLastName}
          placeholder={t("settings.personalInformation.placeholder.lastName")}
        />
        <EditableField
          label={t("settings.personalInformation.displayName")}
          value={displayNameState}
          // onSave={handleSaveDisplayName}
          // placeholder={t("settings.personalInformation.placeholder.displayName")}
        />
        <EditableField
          label={t("settings.personalInformation.phoneNumber")}
          value={phone ? formatPhoneNumber(phone) : ""}
          onSave={handleSavePhone}
          placeholder="+33123456789"
          type="tel"
          emptyLabel={t("settings.personalInformation.placeholder.informationNotProvided")}
        />
        <EditableField
          label={t("settings.personalInformation.mailingAddress")}
          value={postalAddress ? formatAddress(postalAddress) : ""}
          onSave={handleSavePostalAddress}
          placeholder="1 Cr de la Bôve, 56100 Lorient"
          type="textarea"
          emptyLabel={t("settings.personalInformation.placeholder.informationNotProvided")}
        />
        <div className="flex items-start justify-between py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t("settings.personalInformation.email")}</label>
            <div className="text-sm text-gray-900 dark:text-slate-100">{user?.email}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("settings.personalInformation.placeholder.emailNotChanged")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
