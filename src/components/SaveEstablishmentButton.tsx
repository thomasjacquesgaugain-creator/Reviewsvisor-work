import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";
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

    // 1) Sauvegarde locale (fallback hors-ligne)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

    // 2) Sauvegarde par utilisateur
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      // pas connecté : on garde localStorage et on informe
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
      alert("Établissement enregistré localement. Connecte-toi pour le lier à ton compte.");
      return;
    }

    const payload = { user_id: user.id, ...selected };
    const { error } = await (supabase as any).from("user_establishment").upsert(payload); // PK = user_id
    if (error) {
      console.error(error);
      alert("Erreur sauvegarde distante. Conservé localement.");
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
      return;
    }

    // C) Notifier toute l'app (la carte se mettra à jour instantanément)
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));

    // D) Feedback de succès
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