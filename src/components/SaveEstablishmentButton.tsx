import { Etab, STORAGE_KEY, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export default function SaveEstablishmentButton({
  selected,
  disabled,
}: {
  selected: Etab | null;
  disabled?: boolean;
}) {
  async function handleSave() {
    if (!selected) return;

    // 1) Vérifier l'authentification
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      sonnerToast.info("Connectez-vous pour enregistrer un établissement.", { duration: 5000 });
      return;
    }

    // 2) Sauvegarder dans la table établissements (source de vérité)
    // Upsert avec contrainte unique sur (user_id, place_id)
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

    // 3) Mettre à jour l'établissement actif dans localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));

    // 4) Notifier la liste de se recharger depuis la DB
    window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));

    sonnerToast.success("Établissement enregistré", {
      description: "L'établissement a été ajouté à votre liste.",
      duration: 3000,
    });
  }

  return (
    <button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-3 disabled:opacity-50"
      onClick={handleSave}
      disabled={!selected || disabled}
      title="Enregistrer l'établissement"
    >
      💾 Enregistrer l'établissement
    </button>
  );
}