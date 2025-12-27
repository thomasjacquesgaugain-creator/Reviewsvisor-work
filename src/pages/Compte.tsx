import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Building2, User, Globe, Check } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEY, EVT_SAVED, EVT_ESTABLISHMENT_UPDATED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { EstablishmentSelector, EstablishmentOption } from "@/components/EstablishmentSelector";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/config";

const Compte = () => {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const { user, displayName } = useAuth();

  // Selected establishment (from Supabase)
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentOption | null>(null);

  const nameParts = (displayName || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [etablissement, setEtablissement] = useState("");
  const [adresse, setAdresse] = useState("");

  // Load current establishment from Supabase on mount (source de vérité = DB)
  useEffect(() => {
    const loadCurrentEstablishment = async () => {
      if (!user) return;

      try {
        // 1) établissement actif si présent
        const { data: activeRows, error: activeError } = await supabase
          .from("établissements")
          .select("id, place_id, nom, adresse")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (activeError) throw activeError;

        let row = activeRows?.[0] ?? null;

        // 2) fallback: le plus récent
        if (!row) {
          const { data: recentRows, error: recentError } = await supabase
            .from("établissements")
            .select("id, place_id, nom, adresse")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1);

          if (recentError) throw recentError;
          row = recentRows?.[0] ?? null;
        }

        if (row) {
          const estData: EstablishmentOption = {
            id: row.id,
            place_id: row.place_id,
            name: row.nom,
            formatted_address: row.adresse ?? null,
          };

          setSelectedEstablishment(estData);
          setEtablissement(estData.name || "");
          setAdresse(estData.formatted_address || "");
        } else {
          setSelectedEstablishment(null);
        }
      } catch (err) {
        console.warn("Could not load current establishment:", err);
      }
    };

    loadCurrentEstablishment();
  }, [user]);

  // Handle establishment selection change
  const handleEstablishmentSelect = (est: EstablishmentOption) => {
    setSelectedEstablishment(est);
    setEtablissement(est.name || "");
    setAdresse(est.formatted_address || "");
  };

  // Listen for establishment changes from other pages (source de vérité = DB)
  useEffect(() => {
    const handleUpdate = () => {
      if (!user) return;

      (async () => {
        try {
          const { data: activeRows, error: activeError } = await supabase
            .from("établissements")
            .select("id, place_id, nom, adresse")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(1);

          if (activeError) throw activeError;

          let row = activeRows?.[0] ?? null;

          if (!row) {
            const { data: recentRows, error: recentError } = await supabase
              .from("établissements")
              .select("id, place_id, nom, adresse")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1);

            if (recentError) throw recentError;
            row = recentRows?.[0] ?? null;
          }

          if (row) {
            const estData: EstablishmentOption = {
              id: row.id,
              place_id: row.place_id,
              name: row.nom,
              formatted_address: row.adresse ?? null,
            };

            setSelectedEstablishment(estData);
            setEtablissement(estData.name || "");
            setAdresse(estData.formatted_address || "");
          } else {
            setSelectedEstablishment(null);
          }
        } catch (err) {
          console.warn("Could not reload establishment:", err);
        }
      })();
    };

    window.addEventListener(EVT_ESTABLISHMENT_UPDATED, handleUpdate as EventListener);

    return () => {
      window.removeEventListener(EVT_ESTABLISHMENT_UPDATED, handleUpdate as EventListener);
    };
  }, [user]);

  const fullName = `${firstName} ${lastName}`.trim();

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("account.mustBeLoggedIn"));
      return;
    }

    const etabName = etablissement.trim();
    const addr = adresse.trim();

    if (!etabName) {
      toast.error(t("account.fillEstablishmentName"));
      return;
    }

    try {
      // 1) Sauvegarder le profil utilisateur (prénom/nom + display_name)
      const computedFullName = `${firstName} ${lastName}`.trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            display_name: computedFullName || null,
          },
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      // 2) Mettre à jour l'email si modifié
      const nextEmail = email.trim();
      if (nextEmail && nextEmail !== (user.email || "")) {
        const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) throw emailError;
      }

      // 3) Update the selected establishment in Supabase
      if (selectedEstablishment?.id) {
        const { data: updatedEst, error: estError } = await supabase
          .from("establishments")
          .update({
            name: etabName,
            formatted_address: addr || null,
          })
          .eq("id", selectedEstablishment.id)
          .select("id, place_id, name, formatted_address")
          .single();

        if (estError) throw estError;

        if (updatedEst) {
          setSelectedEstablishment(updatedEst as EstablishmentOption);

          // 4) Update localStorage for other components
          const localData = {
            place_id: updatedEst.place_id,
            name: updatedEst.name,
            address: updatedEst.formatted_address || "",
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: localData }));
          window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));
        }
      } else {
        // Create new establishment if none selected
        const placeId = `manual_${user.id}_${Date.now()}`;
        const { data: newEst, error: createError } = await supabase
          .from("establishments")
          .insert({
            user_id: user.id,
            place_id: placeId,
            name: etabName,
            formatted_address: addr || null,
            source: "manual",
          })
          .select("id, place_id, name, formatted_address")
          .single();

        if (createError) throw createError;

        if (newEst) {
          setSelectedEstablishment(newEst as EstablishmentOption);

          // Update profile with current establishment
          await supabase
            .from("profiles")
            .upsert({ user_id: user.id, current_establishment_id: newEst.id }, { onConflict: "user_id" });

          const localData = {
            place_id: newEst.place_id,
            name: newEst.name,
            address: newEst.formatted_address || "",
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: localData }));
          window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));
        }
      }

      toast.success(t("account.updateSuccess"));
    } catch (err) {
      console.error("Erreur lors de la mise à jour du compte:", err);
      toast.error(t("account.updateError"));
    }
  };

  return (
    <div className="p-6 md:p-10 flex justify-center bg-background min-h-screen">
      <div className="w-full max-w-4xl">
        {/* Header avec titre */}
        <h1 className="text-3xl font-semibold text-foreground mb-8">
          {t("account.title")}
        </h1>

        {/* AVATAR + NOM + SÉLECTEUR ÉTABLISSEMENT */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold bg-primary/10 text-primary mr-6">
              {initials || "??"}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("nav.account")}</p>
              <p className="text-xl font-semibold text-foreground">{fullName || "Utilisateur"}</p>
              <p className="text-muted-foreground">{etablissement}</p>
            </div>
          </div>
          <EstablishmentSelector
            selectedEstablishment={selectedEstablishment}
            onSelect={handleEstablishmentSelect}
          />
        </div>

        {/* FORMULAIRE 2 COLONNES AVEC ICÔNES */}
        <form onSubmit={handleSubmit} className="bg-card shadow rounded-xl p-6 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.firstName")}</Label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Nom */}
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.lastName")}</Label>
                <Input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Adresse resto */}
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.establishmentAddress")}</Label>
                <Input
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Établissement */}
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.establishment")}</Label>
                <Input
                  type="text"
                  value={etablissement}
                  onChange={(e) => setEtablissement(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Langue */}
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.interfaceLanguage")}</Label>
                <Select value={lang} onValueChange={(value) => setLang(value as SupportedLanguage)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {SUPPORTED_LANGUAGES.map((code) => (
                      <SelectItem key={code} value={code}>
                        <span className="flex items-center gap-2">
                          {LANGUAGE_FLAGS[code]} {LANGUAGE_LABELS[code]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit">
              {t("account.updateInfo")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Compte;
