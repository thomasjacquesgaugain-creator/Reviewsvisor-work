import { Etab, STORAGE_KEY, EVT_SAVED } from "../types/etablissement";

export default function SaveEstablishmentButton({
  selected,
  disabled,
}: {
  selected: Etab | null;
  disabled?: boolean;
}) {
  async function handleSave() {
    if (!selected) return;

    // A) Persistance locale
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

    // B) (optionnel) Supabase (décommente si utilisé)
    // const { data, error } = await supabase
    //   .from("etablissements")
    //   .upsert(selected, { onConflict: "place_id" });
    // if (error) { alert(error.message); return; }

    // C) Notifier toute l'app (la carte se mettra à jour instantanément)
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));

    // D) petit feedback
    // toast.success("Établissement enregistré");
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