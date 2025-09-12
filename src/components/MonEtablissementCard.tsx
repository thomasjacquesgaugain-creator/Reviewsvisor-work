import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";

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

  if (!etab) {
    return (
      <div className="text-neutral-500">
        Aucun établissement sélectionné. Utilisez l'autocomplétion ci-dessus pour en choisir un.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div><strong>Nom :</strong> {etab.name}</div>
      <div><strong>Adresse :</strong> {etab.address}</div>
      <div><strong>Téléphone :</strong> {etab.phone || "—"}</div>
      <div><strong>Site web :</strong> {etab.website ? <a href={etab.website} target="_blank">Ouvrir</a> : "—"}</div>
      <div><strong>Note Google :</strong> {etab.rating ?? "—"}</div>
      <div><strong>Google Maps :</strong> {etab.url ? <a href={etab.url} target="_blank">Voir la fiche</a> : "—"}</div>
      <div className="text-xs text-neutral-500"><strong>place_id :</strong> {etab.place_id}</div>
    </div>
  );
}