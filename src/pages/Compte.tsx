import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Building2, User, Globe } from "lucide-react";
import { toast } from "sonner";
import { STORAGE_KEY, EVT_SAVED, EVT_ESTABLISHMENT_UPDATED } from "@/types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { EstablishmentSelector, EstablishmentOption } from "@/components/EstablishmentSelector";

const Compte = () => {
  const { user, displayName } = useAuth();

  // Selected establishment (from Supabase)
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentOption | null>(null);

  const nameParts = (displayName || "").split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [etablissement, setEtablissement] = useState("");
  const [adresse, setAdresse] = useState("");
  const [language, setLanguage] = useState("fr");

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
      toast.error("Vous devez être connecté pour modifier vos informations");
      return;
    }

    const etabName = etablissement.trim();
    const addr = adresse.trim();

    if (!etabName) {
      toast.error("Veuillez renseigner le nom de l'établissement");
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

      toast.success("Informations mises à jour");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du compte:", err);
      toast.error("Impossible de mettre à jour vos informations");
    }
  };

  return (
    <div className="p-6 md:p-10 flex justify-center bg-background min-h-screen">
      <div className="w-full max-w-4xl">
        {/* Header avec titre et sélecteur d'établissement */}
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-3xl font-semibold text-foreground">
            Informations personnelles
          </h1>
          <div className="mt-12">
            <EstablishmentSelector
              selectedEstablishment={selectedEstablishment}
              onSelect={handleEstablishmentSelect}
            />
          </div>
        </div>

        {/* AVATAR + NOM */}
        <div className="flex items-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold bg-primary/10 text-primary mr-6">
            {initials || "??"}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Compte</p>
            <p className="text-xl font-semibold text-foreground">{fullName || "Utilisateur"}</p>
            <p className="text-muted-foreground">{etablissement}</p>
          </div>
        </div>

        {/* FORMULAIRE 2 COLONNES AVEC ICÔNES */}
        <form onSubmit={handleSubmit} className="bg-card shadow rounded-xl p-6 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="w-full">
                <Label className="text-xs uppercase text-muted-foreground">Prénom</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">Nom</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">Email</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">Adresse du restaurant</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">Établissement</Label>
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
                <Label className="text-xs uppercase text-muted-foreground">Langue de l'interface</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit">
              Modifier mes informations
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Compte;
