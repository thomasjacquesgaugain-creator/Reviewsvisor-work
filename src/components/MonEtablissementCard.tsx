import { useEffect, useState, useCallback } from "react";
import { Etab, EVT_SAVED, EVT_LIST_UPDATED, EVT_ESTABLISHMENT_UPDATED, STORAGE_KEY } from "../types/etablissement";
import { BarChart3, Download, ExternalLink, Star, Phone, Globe, MapPin, Building2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalyze } from "@/lib/runAnalyze";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface MonEtablissementCardProps {
  onAddClick?: () => void;
}

export default function MonEtablissementCard({ onAddClick }: MonEtablissementCardProps) {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  // Charger l'établissement actif depuis la DB (source de vérité)
  const loadActiveEstablishment = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEtab(null);
        setIsLoading(false);
        return;
      }

      // Récupérer l'établissement actif depuis la DB
      const { data, error } = await supabase
        .from("établissements")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Erreur chargement établissement actif:", error);
        setEtab(null);
      } else if (data) {
        // Mapper les données DB vers le type Etab
        setEtab({
          place_id: data.place_id,
          name: data.nom,
          address: data.adresse || "",
          phone: data.telephone || undefined,
          website: data.website || undefined,
          url: data.google_maps_url || undefined,
          rating: data.rating || undefined,
          lat: data.lat || null,
          lng: data.lng || null,
        });
      } else {
        setEtab(null);
      }
    } catch (err) {
      console.error("Erreur chargement établissement actif:", err);
      setEtab(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1) Au mount, charger depuis la DB
  useEffect(() => {
    loadActiveEstablishment();
  }, [loadActiveEstablishment]);

  // 2) Se mettre à jour quand on clique "Enregistrer" ou qu'on sélectionne un autre
  useEffect(() => {
    const onSaved = () => {
      // Recharger depuis la DB pour avoir les données persistées
      loadActiveEstablishment();
    };
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, [loadActiveEstablishment]);

  // 3) Écouter les changements d'auth (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadActiveEstablishment();
      } else if (event === 'SIGNED_OUT') {
        setEtab(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadActiveEstablishment]);

  // Fonction pour analyser l'établissement
  const handleAnalyze = async () => {
    if (!etab?.place_id) return;

    setIsAnalyzing(true);
    try {
      const result = await runAnalyze({
        place_id: etab.place_id,
        name: etab.name,
        address: etab.address
      });

      if (result.ok) {
        sonnerToast.success(t("establishment.reviewsAnalyzedSuccessCount", { count: result.counts?.collected || 0 }), {
          duration: 5000,
        });
      } else {
        sonnerToast.error(t("establishment.analysisErrorOccurred"), {
          duration: 5000,
        });
      }
    } catch (error) {
      sonnerToast.error(t("establishment.unexpectedErrorOccurred"), {
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  // Fonction pour ouvrir la recherche (utilise la prop du parent)
  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    }
  };

  if (!etab) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[180px]">
        <button
          onClick={handleAddClick}
          className="cursor-pointer bg-card border border-dashed border-border rounded-lg p-3 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md hover:bg-accent/10 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 min-h-[80px]"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{t("establishment.add")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pt-6 px-6 pb-2">
      {/* Grid des informations */}
      <div className="space-y-0">
        {/* Ligne 1 (desktop): Nom | Note Google | Site web */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-10">
          {/* Nom */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{t("establishment.nameLabel")}</p>
            <p className="text-base font-medium text-foreground">{etab.name}</p>
          </div>

          {/* Note Google */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{t("establishment.googleRating")}</p>
            {etab.rating ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium text-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {etab.rating}
              </span>
            ) : (
              <p className="text-base text-muted-foreground">—</p>
            )}
          </div>

          {/* Site web */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t("establishment.website")}
            </p>
            {etab.website ? (
              <a
                href={etab.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("establishment.websiteOpen")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-base text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Ligne 2 (desktop): Adresse | Google Maps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-10">
          {/* Adresse */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {t("establishment.address")}
            </p>
            <p className="text-base font-medium text-foreground">{etab.address}</p>
          </div>

          <div className="hidden md:block" />

          {/* Google Maps */}
          <div className="space-y-1 md:col-start-3 md:pt-10">
            <p className="text-sm text-muted-foreground font-medium">{t("establishment.googleMaps")}</p>
            {etab.place_id ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.name)}&query_place_id=${encodeURIComponent(etab.place_id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("establishment.viewListing")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : etab.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("establishment.viewListing")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p className="text-base text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Ligne 3 (desktop): Téléphone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-10">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {t("establishment.phone")}
            </p>
            <p className="text-base font-medium text-foreground">{etab.phone || "—"}</p>
          </div>
        </div>
      </div>

      {/* Ligne du bas: place_id | Importer | Visuel | Supprimer */}
      <div className="border-t border-border mt-4 pt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {/* place_id à gauche */}
        <div className="flex items-center gap-2 md:w-1/3 md:max-w-[320px]">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-mono truncate">
            {t("establishment.placeId")}: {etab.place_id}
          </p>
        </div>

        {/* Importer au centre */}
        <div className="flex md:flex-1 md:justify-center">
          <button
            type="button"
            className="inline-flex px-4 py-3 h-auto w-44 flex-col items-center justify-center gap-1 rounded-lg border border-blue-600 bg-blue-600 text-white shadow-sm"
            title={t("establishment.importReviews")}
            data-testid="btn-import-avis"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-medium">Importer vos avis</span>
          </button>
        </div>

        {/* Visuel à droite */}
        <div className="flex md:w-1/3 md:justify-end">
          <button
            type="button"
            className="inline-flex px-4 py-3 h-auto w-44 flex-col items-center justify-center gap-1 rounded-lg border border-blue-600 bg-blue-600 text-white shadow-sm"
            title={t("establishment.visualReviews")}
            data-testid="btn-analyser-etablissement"
            data-place-id={etab.place_id}
            data-name={etab.name}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] font-medium">Visuel des avis</span>
          </button>
        </div>
      </div>
    </div>
  );
}