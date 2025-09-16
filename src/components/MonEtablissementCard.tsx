import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";
import { Trash2, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalyze } from "@/lib/runAnalyze";
import { useToast } from "@/hooks/use-toast";


export default function MonEtablissementCard() {
  const [etab, setEtab] = useState<Etab | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

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

  // Fonction pour oublier l'établissement
  const handleForgetEstablishment = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEtab(null);
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
        toast({
          title: "Analyse terminée",
          description: `${result.counts?.collected || 0} avis analysés avec succès`,
        });
      } else {
        toast({
          title: "Erreur d'analyse",
          description: "Erreur lors de l'analyse",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
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
          title="Analyser cet établissement"
        >
          <BarChart3 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </Button>
        
        {/* Bouton oublier établissement */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForgetEstablishment}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
          title="Oublier cet établissement"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}