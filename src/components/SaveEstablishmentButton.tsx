import { Etab, STORAGE_KEY, STORAGE_KEY_LIST, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
import { supabase } from "@/integrations/supabase/client";

export default function SaveEstablishmentButton({
  selected,
  disabled,
}: {
  selected: Etab | null;
  disabled?: boolean;
}) {
  async function handleSave() {
    if (!selected) return;

    // 1) Sauvegarde locale principale (pour "Mon Établissement")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

    // 2) Ajouter à la liste des établissements sauvegardés localement
    try {
      const existingList = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST) || "[]") as Etab[];
      const updatedList = existingList.filter(etab => etab.place_id !== selected.place_id);
      updatedList.push(selected);
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(updatedList));
      
      // Notifier la mise à jour de la liste
      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED, { detail: updatedList }));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la liste:", error);
    }

    // 3) Sauvegarde en base de données
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      // pas connecté : on garde localStorage et on informe
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
      alert("Établissement enregistré localement. Connecte-toi pour le lier à ton compte.");
      return;
    }

    // Sauvegarder l'établissement principal dans user_establishment
    const userEstabPayload = { user_id: user.id, ...selected };
    const { error: userEstabError } = await (supabase as any).from("user_establishment").upsert(userEstabPayload);
    
    // Sauvegarder aussi dans la table établissements pour la liste
    const etablissementPayload = {
      user_id: user.id,
      place_id: selected.place_id,
      nom: selected.name,
      adresse: selected.address,
      telephone: selected.phone || null,
      type: "Restaurant" // Type par défaut
    };
    const { error: etabError } = await (supabase as any).from("établissements").upsert(etablissementPayload);

    if (userEstabError || etabError) {
      console.error("Erreur sauvegarde:", { userEstabError, etabError });
      alert("Erreur sauvegarde distante. Conservé localement.");
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
      return;
    }

    // 4) Notifier toute l'app
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));

    // 5) Feedback de succès
    alert("Établissement enregistré avec succès!");
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