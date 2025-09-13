import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MonEtablissementCard() {
  const [etab, setEtab] = useState<Etab | null>(null);

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
      
      {/* Icône oublier établissement en bas à droite */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForgetEstablishment}
        className="absolute bottom-0 right-0 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
        title="Oublier cet établissement"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}