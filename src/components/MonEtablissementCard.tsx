import { useEffect, useState, useCallback } from "react";
import { Etab, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { Trash2, BarChart3, Download, ExternalLink, Star, Phone, Globe, MapPin, Building2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalyze } from "@/lib/runAnalyze";
import { toast as sonnerToast } from "sonner";
import { deleteAllReviews } from "@/services/reviewsService";
import { supabase } from "@/integrations/supabase/client";


export default function MonEtablissementCard() {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      // 3. Plus besoin de localStorage - la DB est la source de vérité

      // 4. Notifier la liste de se recharger depuis la DB
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));

      // 5. Toast rouge en bas à droite (même système que import)
      sonnerToast.error("L'établissement et tous ses avis ont été supprimés.", {
        duration: 5000,
      });

      // 6. Mettre à jour l'état local
      setEtab(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'établissement:', error);
      
      // Toast d'erreur rouge en bas à droite
      sonnerToast.error("Impossible de supprimer l'établissement. Veuillez réessayer.", {
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
        sonnerToast.success(`${result.counts?.collected || 0} avis analysés avec succès`, {
          duration: 5000,
        });
      } else {
        sonnerToast.error("Erreur lors de l'analyse", {
          duration: 5000,
        });
      }
    } catch (error) {
      sonnerToast.error("Une erreur inattendue s'est produite", {
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
        <span className="ml-2 text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!etab) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Sélectionner un établissement
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Grid des informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
        {/* Nom */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Nom</p>
          <p className="text-base font-medium text-foreground">{etab.name}</p>
        </div>

        {/* Note Google */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Note Google</p>
          {etab.rating ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium text-sm">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {etab.rating}
            </span>
          ) : (
            <p className="text-base text-muted-foreground">—</p>
          )}
        </div>

        {/* Adresse */}
        <div className="space-y-1 md:col-span-2">
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Adresse
          </p>
          <p className="text-base font-medium text-foreground">{etab.address}</p>
        </div>

        {/* Téléphone */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            Téléphone
          </p>
          <p className="text-base font-medium text-foreground">{etab.phone || "—"}</p>
        </div>

        {/* Site web */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Site web
          </p>
          {etab.website ? (
            <a 
              href={etab.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Ouvrir
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-base text-muted-foreground">—</p>
          )}
        </div>

        {/* Google Maps */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Google Maps</p>
          {etab.place_id ? (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.name)}&query_place_id=${encodeURIComponent(etab.place_id)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Voir la fiche
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : etab.address ? (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(etab.address)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-base font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Voir la fiche
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-base text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Footer avec place_id et actions */}
      <div className="border-t border-border mt-6 pt-4 flex items-center justify-between relative">
        {/* Icône building + place_id à gauche */}
        <div className="flex items-center gap-2 max-w-[40%]">
          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-mono truncate">
            place_id: {etab.place_id}
          </p>
        </div>

        {/* Bouton importer vos avis - centré */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto"
            title="Importer vos avis"
            data-testid="btn-import-avis"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* 2 icônes/actions à droite */}
        <div className="flex gap-1">
          {/* Bouton analyser établissement */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto disabled:opacity-50"
            title="Visuel des avis"
            data-testid="btn-analyser-etablissement"
          >
            <BarChart3 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* Bouton supprimer établissement */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteEstablishment}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto disabled:opacity-50"
            title="Supprimer l'établissement et tous ses avis"
          >
            <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}