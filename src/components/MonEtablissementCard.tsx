import { useEffect, useState } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AnalyzeEstablishmentButton } from "./AnalyzeEstablishmentButton";

export default function MonEtablissementCard() {
  const [etab, setEtab] = useState<Etab | null>(null);

  // A) Au montage : essayer Supabase (si connecté), sinon localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await (supabase as any)
          .from("user_establishment")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && data && !error) {
          const { user_id, updated_at, ...rest } = data as any;
          setEtab(rest as Etab);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rest)); // cache local
          return;
        }
      }
      // fallback local
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!cancelled && raw) setEtab(JSON.parse(raw));
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // B) Se mettre à jour instantanément après un "Enregistrer"
  useEffect(() => {
    const onSaved = (e: any) => setEtab(e.detail as Etab);
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);

  // C) Écouter les changements d'authentification
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "SIGNED_IN" || _event === "TOKEN_REFRESHED") {
        // recharger depuis Supabase (tu peux factoriser load() dans un hook)
        // ici, un simple reload propre :
        window.location.reload();
      }
    });
    return () => sub.subscription.unsubscribe();
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
      
      {/* Bouton analyser établissement au milieu en bas */}
      <div className="flex justify-center mt-4">
        <AnalyzeEstablishmentButton 
          place_id={etab.place_id} 
          name={etab.name} 
          address={etab.address} 
        />
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