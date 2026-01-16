import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Building2, User, Globe, Check, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEY, EVT_SAVED, EVT_ESTABLISHMENT_UPDATED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { EstablishmentSelector, EstablishmentOption } from "@/components/EstablishmentSelector";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/i18n/config";
import { useSubscription } from "@/hooks/useSubscription";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { SubscriptionManagementModal } from "@/components/SubscriptionManagementModal";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

const Compte = () => {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const { user, displayName, refreshProfile } = useAuth();
  const { subscription } = useSubscription();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  // Détermine le plan actif de l'utilisateur
  const activePlan = subscription.subscribed && subscription.price_id
    ? subscriptionPlans.find(p => p.priceId === subscription.price_id)
    : null;
  const subscriptionName = activePlan ? activePlan.name : "Gratuit";

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
      // 1) Sauvegarder le profil utilisateur (prénom/nom)
      // Récupérer l'utilisateur actuel pour s'assurer qu'on a le bon ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error(t("account.mustBeLoggedIn"));
        return;
      }

      // Mise à jour du profil avec update simple (pas d'upsert)
      // Note: user_id est UNIQUE dans profiles, donc on utilise .eq("user_id", currentUser.id)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        })
        .eq("user_id", currentUser.id);

      if (profileError) {
        console.error('Erreur détaillée:', profileError);
        throw profileError;
      }

      // Rafraîchir le profil dans le contexte pour mettre à jour le displayName partout
      await refreshProfile();

      // Mettre à jour les états locaux pour refléter les changements immédiatement
      const newDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (newDisplayName) {
        // Le displayName sera mis à jour via refreshProfile, mais on peut aussi mettre à jour les états locaux
        setFirstName(firstName.trim());
        setLastName(lastName.trim());
      }

      // 2) Mettre à jour l'email si modifié
      const nextEmail = email.trim();
      if (nextEmail && nextEmail !== (currentUser.email || "")) {
        const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) {
          console.error('Erreur lors de la mise à jour de l\'email:', emailError);
          throw emailError;
        }
      }

      // 3) Update the selected establishment in Supabase
      // Utiliser la table "établissements" avec les colonnes "nom" et "adresse"
      if (selectedEstablishment?.id) {
        if (!import.meta.env.PROD) {
          console.log('[Compte] Tentative de mise à jour de l\'établissement:', {
            id: selectedEstablishment.id,
            nom: etabName,
            adresse: addr || null,
          });
        }

        const { data: updatedEst, error: estError } = await supabase
          .from("établissements")
          .update({
            nom: etabName,
            adresse: addr || null,
          })
          .eq("id", selectedEstablishment.id)
          .select("id, place_id, nom, adresse")
          .single();

        if (estError) {
          console.error('[Compte] Erreur lors de la mise à jour de l\'établissement:', {
            error: estError,
            message: estError.message,
            details: estError.details,
            hint: estError.hint,
            code: estError.code,
          });
          throw estError;
        }

        if (!import.meta.env.PROD) {
          console.log('[Compte] Établissement mis à jour avec succès:', updatedEst);
        }

        if (updatedEst) {
          const estData: EstablishmentOption = {
            id: updatedEst.id,
            place_id: updatedEst.place_id,
            name: updatedEst.nom,
            formatted_address: updatedEst.adresse ?? null,
          };
          setSelectedEstablishment(estData);

          // Mettre à jour les états locaux pour refléter les changements immédiatement
          setEtablissement(updatedEst.nom);
          setAdresse(updatedEst.adresse || "");

          // 4) Update localStorage for other components
          const localData = {
            place_id: updatedEst.place_id,
            name: updatedEst.nom,
            address: updatedEst.adresse || "",
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: localData }));
          window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));
        }
      } else {
        // Create new establishment if none selected
        const placeId = `manual_${currentUser.id}_${Date.now()}`;
        if (!import.meta.env.PROD) {
          console.log('[Compte] Tentative de création d\'un nouvel établissement:', {
            user_id: currentUser.id,
            place_id: placeId,
            nom: etabName,
            adresse: addr || null,
          });
        }

        const { data: newEst, error: createError } = await supabase
          .from("établissements")
          .insert({
            user_id: currentUser.id,
            place_id: placeId,
            nom: etabName,
            adresse: addr || null,
          })
          .select("id, place_id, nom, adresse")
          .single();

        if (createError) {
          console.error('[Compte] Erreur lors de la création de l\'établissement:', {
            error: createError,
            message: createError.message,
            details: createError.details,
            hint: createError.hint,
            code: createError.code,
          });
          throw createError;
        }

        if (!import.meta.env.PROD) {
          console.log('[Compte] Établissement créé avec succès:', newEst);
        }

        if (newEst) {
          const estData: EstablishmentOption = {
            id: newEst.id,
            place_id: newEst.place_id,
            name: newEst.nom,
            formatted_address: newEst.adresse ?? null,
          };
          setSelectedEstablishment(estData);

          // Mettre à jour les états locaux pour refléter les changements immédiatement
          setEtablissement(newEst.nom);
          setAdresse(newEst.adresse || "");

          // Update profile with current establishment using update (not upsert)
          await supabase
            .from("profiles")
            .update({ current_establishment_id: newEst.id })
            .eq("user_id", currentUser.id);

          const localData = {
            place_id: newEst.place_id,
            name: newEst.nom,
            address: newEst.adresse || "",
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: localData }));
          window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));
        }
      }

      toast.success(t("account.updateSuccess"));
    } catch (err: any) {
      console.error("[Compte] Erreur complète lors de la mise à jour du compte:", {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        stack: err?.stack,
      });
      toast.error(t("account.updateError"));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-violet-100">
      {/* Background with organic shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-violet-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10">
        <div className="p-6 md:p-10 flex justify-center">
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
              <p className="text-xl font-semibold text-foreground">{fullName || t("dashboard.user")}</p>
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

            {/* Abonnement */}
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.subscription")}</Label>
                <div className="mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (subscription.subscribed) {
                        setShowSubscriptionModal(true);
                      } else {
                        window.location.href = "/onboarding";
                      }
                    }}
                    className="whitespace-nowrap"
                  >
                    {subscription.subscribed ? t("account.manageSubscription") : t("subscription.choosePlan")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">{t("account.password")}</Label>
                <div className="mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                    className="whitespace-nowrap"
                  >
                    {t("account.changePassword")}
                  </Button>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit">
              {t("account.updateInfo")}
            </Button>
          </div>
        </form>

        {/* Modal de gestion d'abonnement */}
        {subscription.subscribed && (
          <SubscriptionManagementModal
            open={showSubscriptionModal}
            onOpenChange={setShowSubscriptionModal}
          />
        )}

        {/* Modal de modification du mot de passe */}
        <ChangePasswordModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
        />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compte;
