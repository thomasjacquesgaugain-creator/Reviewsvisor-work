import { useState, useEffect } from "react";
import { Etab, STORAGE_KEY, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export default function SaveEstablishmentButton({
  selected,
  disabled,
  onSaveSuccess,
}: {
  selected: Etab | null;
  disabled?: boolean;
  onSaveSuccess?: () => void;
}) {
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkVersion, setCheckVersion] = useState(0);

  // Fonction de vérification DB
  const checkIfSaved = async () => {
    if (!selected?.place_id) {
      setIsAlreadySaved(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAlreadySaved(false);
      return;
    }

    const { data } = await supabase
      .from("établissements")
      .select("place_id")
      .eq("user_id", user.id)
      .eq("place_id", selected.place_id)
      .maybeSingle();

    setIsAlreadySaved(!!data);
  };

  // Vérifier quand la sélection change OU quand la liste est mise à jour
  useEffect(() => {
    checkIfSaved();
  }, [selected?.place_id, checkVersion]);

  // Écouter les mises à jour de la liste (après ajout/suppression)
  useEffect(() => {
    const onListUpdated = () => {
      // Forcer une re-vérification depuis la DB
      setCheckVersion(v => v + 1);
    };
    window.addEventListener(EVT_LIST_UPDATED, onListUpdated);
    return () => window.removeEventListener(EVT_LIST_UPDATED, onListUpdated);
  }, []);

  async function handleSave() {
    if (!selected) return;

    // 1) Vérifier l'authentification
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info("Connectez-vous pour enregistrer un établissement.", { duration: 5000 });
      return;
    }

    // 2) Si déjà enregistré, informer l'utilisateur
    if (isAlreadySaved) {
      sonnerToast.info("Cet établissement est déjà enregistré.", { duration: 3000 });
      return;
    }

    setSaving(true);

    try {
      // 3) Sauvegarder dans la table établissements (source de vérité)
      const { error: etabError } = await supabase.from("établissements").upsert({
        user_id: user.id,
        place_id: selected.place_id,
        nom: selected.name,
        adresse: selected.address,
        telephone: selected.phone || null,
        type: "Restaurant"
      }, {
        onConflict: 'user_id,place_id',
        ignoreDuplicates: false
      });
      
      if (etabError) {
        console.error("Erreur sauvegarde établissements:", etabError);
        sonnerToast.error("Impossible d'enregistrer l'établissement");
        return;
      }

      // 4) Mettre à jour l'établissement actif dans localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));

      // 5) Notifier la liste de se recharger depuis la DB
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));

      // 6) Marquer comme enregistré
      setIsAlreadySaved(true);

      sonnerToast.success("Établissement enregistré", {
        description: "L'établissement a été ajouté à votre liste.",
        duration: 3000,
      });

      // 7) Notifier le parent pour reset la barre de recherche
      onSaveSuccess?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded px-4 py-3 disabled:opacity-50 transition-colors"
      onClick={handleSave}
      disabled={!selected || disabled || saving || isAlreadySaved}
      title={isAlreadySaved ? "Déjà enregistré" : "Enregistrer l'établissement"}
    >
      {saving ? "⏳ Enregistrement..." : isAlreadySaved ? "✅ Déjà enregistré" : "💾 Enregistrer l'établissement"}
    </button>
  );
}