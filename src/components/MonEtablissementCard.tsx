import { useEffect, useState, useCallback } from "react";
import { Etab, EVT_SAVED, EVT_LIST_UPDATED, EVT_ESTABLISHMENT_UPDATED, STORAGE_KEY } from "../types/etablissement";
import { Trash2, BarChart3, Download, ExternalLink, Star, Phone, Globe, MapPin, Building2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalyze } from "@/lib/runAnalyze";
import { toast as sonnerToast } from "sonner";
import { deleteAllReviews } from "@/services/reviewsService";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface MonEtablissementCardProps {
  onAddClick?: () => void;
}

export default function MonEtablissementCard({ onAddClick }: MonEtablissementCardProps) {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Fonction pour supprimer l'établissement et tous ses avis
  const handleDeleteEstablishment = async () => {
    if (!etab?.place_id) return;

    setIsDeleting(true);
    try {
      // 1. Supprimer tous les avis associés
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

      // 3. Nettoyer les données localStorage associées à cet établissement
      try {
        // Nettoyer les avis validés dans localStorage
        const validatedReviewsKey = `validatedReviews_${etab.place_id}`;
        localStorage.removeItem(validatedReviewsKey);
        
        // Nettoyer les actions de checklist
        const checklistKey = `checklist_actions_${etab.place_id}`;
        localStorage.removeItem(checklistKey);
        
        // Nettoyer les actions complétées
        const completedKey = `checklist_completed_${etab.place_id}`;
        localStorage.removeItem(completedKey);
        
        // RÈGLE CRITIQUE : Supprimer le backup createTime seulement lors de la suppression de l'établissement
        const reviewsBackupKey = `reviews_backup_${etab.place_id}`;
        localStorage.removeItem(reviewsBackupKey);
      } catch (error) {
        console.warn('Erreur lors du nettoyage localStorage:', error);
      }

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
          // Nettoyer le localStorage pour que useCurrentEstablishment retourne null
          localStorage.removeItem(STORAGE_KEY);
          // Notifier que l'établissement a été supprimé
          window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: null }));
        }
      } else {
        setEtab(null);
        // Nettoyer le localStorage pour que useCurrentEstablishment retourne null
        localStorage.removeItem(STORAGE_KEY);
        // Notifier que l'établissement a été supprimé
        window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: null }));
      }

      // 5. Notifier la liste de se recharger depuis la DB et forcer la mise à jour immédiate
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));
      
      // Notifier aussi que l'établissement a été supprimé pour fermer les modals
      window.dispatchEvent(new CustomEvent(EVT_ESTABLISHMENT_UPDATED));

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
    <div className="p-6">
      {/* Grid des informations */}
      <div className="space-y-5">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
          {/* Adresse */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {t("establishment.address")}
            </p>
            <p className="text-base font-medium text-foreground">{etab.address}</p>
          </div>

          {/* Google Maps */}
          <div className="space-y-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
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
      <div className="border-t border-border mt-6 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* place_id à gauche */}
        <div className="flex items-center gap-2 md:max-w-[35%]">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-mono truncate">
            {t("establishment.placeId")}: {etab.place_id}
          </p>
        </div>

        {/* Importer + Visuel au milieu */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-4 h-auto w-44 flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white/70 text-blue-600 shadow-sm hover:shadow-md hover:bg-white hover:text-blue-700"
            title={t("establishment.importReviews")}
            data-testid="btn-import-avis"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs font-medium text-gray-700">Importer vos avis</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="p-4 h-auto w-44 flex flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white/70 text-blue-600 shadow-sm hover:shadow-md hover:bg-white hover:text-blue-700"
            title={t("establishment.visualReviews")}
            data-testid="btn-analyser-etablissement"
            data-place-id={etab.place_id}
            data-name={etab.name}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium text-gray-700">Visuel des avis</span>
          </Button>
        </div>

        {/* Supprimer à droite */}
        <div className="flex md:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteEstablishment}
            disabled={isDeleting}
            className="h-auto p-0 text-red-600 hover:text-red-700 hover:bg-transparent disabled:opacity-50 [&_svg]:size-6"
            title={t("establishment.deleteEstablishmentAndReviews")}
          >
            <Trash2 className={`${isDeleting ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}