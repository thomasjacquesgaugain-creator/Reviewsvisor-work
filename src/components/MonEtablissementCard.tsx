import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";
import { Trash2, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalyze } from "@/lib/runAnalyze";
import { toast as sonnerToast } from "sonner";
import { deleteAllReviews } from "@/services/reviewsService";
import { supabase } from "@/integrations/supabase/client";


export default function MonEtablissementCard() {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1) Lire ce qui est déjà enregistré (au chargement)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEtab(JSON.parse(raw));
    } catch {}
  }, []);

  // 2) Se mettre à jour instantanément quand on clique "Enregistrer"
  useEffect(() => {
    const onSaved = (e: any) => setEtab(e.detail as Etab);
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);

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
        await supabase
          .from('establishments')
          .delete()
          .eq('user_id', user.user.id)
          .eq('place_id', etab.place_id);
      }

      // 3. Supprimer du localStorage
      localStorage.removeItem(STORAGE_KEY);

      // 4. Toast rouge en bas à droite (même système que import)
      sonnerToast.error("L'établissement et tous ses avis ont été supprimés.", {
        duration: 5000,
      });

      // 5. Mettre à jour l'état local
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

  if (!etab) {
    return (
      <div className="text-neutral-500">
        Aucun établissement sélectionné. Utilisez l'autocomplétion ci-dessus pour en choisir un.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-2">
        <div><strong>Nom :</strong> {etab.name}</div>
        <div><strong>Adresse :</strong> {etab.address}</div>
        <div><strong>Téléphone :</strong> {etab.phone || "—"}</div>
        <div><strong>Site web :</strong> {etab.website ? <a href={etab.website} target="_blank">Ouvrir</a> : "—"}</div>
        <div><strong>Note Google :</strong> {etab.rating ?? "—"}</div>
        <div><strong>Google Maps :</strong> {etab.url ? <a href={etab.url} target="_blank">Voir la fiche</a> : "—"}</div>
        <div className="text-xs text-neutral-500"><strong>place_id :</strong> {etab.place_id}</div>
      </div>
      
      {/* Icône importer vos avis au centre-bas */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
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
      
      {/* Icônes en bas à droite */}
      <div className="absolute bottom-0 right-0 flex gap-1">
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
  );
}