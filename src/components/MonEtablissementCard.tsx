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

<<<<<<< HEAD
  // Fonction pour supprimer l'établissement et tous ses avis
  // ⚠️ PROTECTION DES DONNÉES ⚠️
  // Cette fonction supprime l'établissement ET tous ses avis
  const handleDeleteEstablishment = async () => {
    if (!etab?.place_id) return;

    // ⚠️ PROTECTION 4: Confirmation explicite avec avertissement sur les avis
    const confirmed = window.confirm(
      `⚠️ ATTENTION - ACTION IRRÉVERSIBLE ⚠️\n\n` +
      `Vous êtes sur le point de supprimer:\n` +
      `- L'établissement "${etab.name}"\n` +
      `- TOUS les avis associés à cet établissement\n\n` +
      `Cette action est irréversible.\n\n` +
      `Un backup automatique des avis sera créé avant suppression.\n\n` +
      `Êtes-vous ABSOLUMENT sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      console.log('[PROTECTION DONNÉES] ✅ Suppression de l\'établissement annulée par l\'utilisateur');
      return;
    }

    setIsDeleting(true);
    try {
      // ⚠️ PROTECTION 5: Backup automatique via deleteAllReviews (déjà protégé)
      console.warn('[PROTECTION DONNÉES] ⚠️ Suppression de l\'établissement et de ses avis confirmée');
      
      // 1. Supprimer tous les avis associés (avec backup automatique)
      await deleteAllReviews(etab.place_id);

      // 2. Supprimer l'établissement de la base de données
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        // IMPORTANT: la liste "Établissements enregistrés" est basée sur la table "établissements".
        // On supprime donc ici dans la/les tables réellement utilisées.
        await supabase
          .from("établissements")
          .delete()
          .eq("user_id", user.user.id)
          .eq("place_id", etab.place_id);

        // Établissement principal (1 par utilisateur)
        await supabase
          .from("user_establishment")
          .delete()
          .eq("user_id", user.user.id);

        // Ancienne table (compat) si jamais utilisée ailleurs
        await supabase
          .from("establishments")
          .delete()
          .eq("user_id", user.user.id)
          .eq("place_id", etab.place_id);
      }

      // 3. Plus besoin de localStorage - la DB est la source de vérité

      // 4. Vérifier s'il reste d'autres établissements et sélectionner le premier
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: remainingEstablishments } = await supabase
          .from("établissements")
          .select("place_id, nom, adresse, lat, lng, telephone, website, google_maps_url, rating")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (remainingEstablishments && remainingEstablishments.length > 0) {
          // Sélectionner automatiquement le premier établissement restant
          const firstRemaining = remainingEstablishments[0];
          
          // Marquer comme actif
          await supabase
            .from("établissements")
            .update({ is_active: true })
            .eq("user_id", currentUser.id)
            .eq("place_id", firstRemaining.place_id);

          // Mapper vers le format Etab
          const newEtab: Etab = {
            place_id: firstRemaining.place_id,
            name: firstRemaining.nom,
            address: firstRemaining.adresse || "",
            phone: firstRemaining.telephone || undefined,
            website: firstRemaining.website || undefined,
            url: firstRemaining.google_maps_url || undefined,
            rating: firstRemaining.rating || undefined,
            lat: firstRemaining.lat || null,
            lng: firstRemaining.lng || null,
          };

          // Mettre à jour localStorage pour synchroniser avec useCurrentEstablishment
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newEtab));
          
          // Notifier les autres composants
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: newEtab }));
          
          // Mettre à jour l'état local avec le nouvel établissement
          setEtab(newEtab);
          
          sonnerToast.success(`"${firstRemaining.nom}" a été sélectionné automatiquement`, {
            duration: 3000,
          });
        } else {
          // Aucun établissement restant, afficher le bouton d'ajout
          setEtab(null);
        }
      } else {
        setEtab(null);
      }

      // 5. Notifier la liste de se recharger depuis la DB
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));

      // 6. Toast de confirmation
      sonnerToast.error(t("establishment.establishmentAndReviewsDeleted"), {
        duration: 5000,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'établissement:', error);
      
      // Toast d'erreur rouge en bas à droite
      sonnerToast.error(t("establishment.cannotDeleteEstablishment"), {
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

=======
>>>>>>> e0be592c1178c86765a09159995a9cf3184789bc
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