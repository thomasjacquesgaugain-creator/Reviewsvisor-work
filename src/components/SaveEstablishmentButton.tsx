import { Etab, STORAGE_KEY, STORAGE_KEY_LIST, EVT_SAVED, EVT_LIST_UPDATED } from "../types/etablissement";
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
    console.log("🔵 [SaveEstablishmentButton] handleSave called with selected:", selected);
    if (!selected) {
      console.log("❌ [SaveEstablishmentButton] No establishment selected");
      return;
    }

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

    // 3) Vérifier l'authentification
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      // pas connecté : on garde localStorage et on informe
      window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
      
      sonnerToast.info("Établissement enregistré localement. Connectez-vous pour le lier à votre compte.", {
        duration: 5000,
      });
      return;
    }

    // 4) Sauvegarder l'établissement principal dans user_establishment
    // Note: user_id est la clé primaire, donc upsert met à jour l'établissement principal de l'utilisateur
    const userEstabPayload = { user_id: user.id, ...selected };
    const { error: userEstabError } = await supabase.from("user_establishment").upsert(userEstabPayload);
    
    if (userEstabError) {
      console.error("❌ [SaveEstablishmentButton] Erreur sauvegarde user_establishment:", userEstabError);
      sonnerToast.error("Impossible d'enregistrer l'établissement", {
        description: "Veuillez réessayer.",
        duration: 5000,
      });
      return;
    }
    
    console.log("✅ [SaveEstablishmentButton] user_establishment saved successfully");

    // 5) Sauvegarder aussi dans la table établissements pour la liste
    // Note: contrainte unique sur (user_id, place_id) empêche les doublons
    const etablissementPayload = {
      user_id: user.id,
      place_id: selected.place_id,
      nom: selected.name,
      adresse: selected.address,
      telephone: selected.phone || null,
      type: "Restaurant"
    };
    const { error: etabError } = await supabase.from("établissements").upsert(etablissementPayload, {
      onConflict: 'user_id,place_id',
      ignoreDuplicates: false
    });
    
    if (etabError) {
      console.error("❌ [SaveEstablishmentButton] Erreur sauvegarde établissements:", etabError);
      sonnerToast.error("Impossible d'enregistrer l'établissement", {
        description: "Veuillez réessayer.",
        duration: 5000,
      });
      return;
    }
    
    console.log("✅ [SaveEstablishmentButton] établissements saved successfully");

    // 6) Succès : notifier l'app et afficher toast bleu de confirmation
    window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: selected }));
    
    console.log("✅ [SaveEstablishmentButton] SUCCESS - Showing success toast");
    sonnerToast("Établissement enregistré", {
      description: "Les informations ont bien été sauvegardées.",
      duration: 5000,
      classNames: {
        toast: "!bg-blue-600 !text-white !border !border-blue-700 !shadow-lg",
        title: "!text-white",
        description: "!text-blue-100",
      },
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