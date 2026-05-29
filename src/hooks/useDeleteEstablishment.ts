import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { cancelSubscription } from "@/lib/stripe";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { useAuth } from "@/contexts/AuthProvider";
import { EVT_LIST_UPDATED } from "@/types/etablissement";

interface UseDeleteEstablishmentOptions {
  /** Called after a successful deletion — use to refresh local lists, navigate away, etc. */
  onSuccess?: (deletedId: string) => void;
  /** Called if deletion fails (after the error toast has already been shown). */
  onError?: (error: unknown) => void;
}

export function useDeleteEstablishment(options: UseDeleteEstablishmentOptions = {}) {
  const { onSuccess, onError } = options;
  const { user } = useAuth();
  const { activePlaceId, setActivePlace } = useEstablishmentStore();
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Delete an establishment by its DB `id` (preferred) or its `place_id` as fallback.
   * Also cancels the linked Stripe subscription before removing the row.
   */
  const deleteEstablishment = async (
    establishmentId: string,
    placeId: string,
    fallbackForActivePlace?: {
      place_id: string;
      name: string;
      formatted_address: string;
      lat: number;
      lng: number;
      phone?: string;
      website?: string;
      rating?: number;
    } | null
  ) => {
    if (!user) return;

    const deletingKey = establishmentId ?? placeId;
    setDeletingId(deletingKey);

    try {
      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("provider_subscription_id")
        .eq("establishment_id", establishmentId)
        .maybeSingle() as any;

      if (subError) throw subError;

      if (sub?.provider_subscription_id) {
        try {
          await cancelSubscription(sub.provider_subscription_id);
        } catch (err) {
          console.error("Stripe cancel failed:", err);
          toast.error("Erreur lors de l'annulation de l'abonnement. Suppression annulée.");
          return;
        }
      }

      let query = supabase.from("establishments").delete().eq("user_id", user.id);
      query = establishmentId
        ? query.eq("id", establishmentId)
        : query.eq("place_id", placeId);

      const { error } = await query;
      if (error) throw error;

      if (activePlaceId === placeId && fallbackForActivePlace) {
        await setActivePlace(fallbackForActivePlace.place_id, fallbackForActivePlace);
      }

      window.dispatchEvent(new CustomEvent(EVT_LIST_UPDATED));
      toast.success(t("settings.establishmentAndAccess.establishmentClosed"));
      onSuccess?.(deletingKey);
    } catch (error: unknown) {
      console.error("Error deleting establishment:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
      onError?.(error);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    deleteEstablishment,
    deletingId,
    isDeleting: deletingId !== null,
  };
}