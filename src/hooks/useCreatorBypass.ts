import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";

// Allowlist - doit correspondre exactement à celle de l'Edge Function
const CREATOR_BYPASS_EMAILS = ["thomas.jacquesgaugain@gmail.com"];

// Product keys stables
export const PRODUCT_KEYS = {
  PRO_1499_12M: "pro_1499_12m",
  PRO_2499_MONTHLY: "pro_2499_monthly", 
  ADDON_MULTI_ETABLISSEMENTS: "addon_multi_etablissements_499",
} as const;

export type ProductKey = typeof PRODUCT_KEYS[keyof typeof PRODUCT_KEYS];

export function useCreatorBypass() {
  const { user } = useAuth();

  // Check if current user is a creator (client-side check for UI optimization only)
  const isCreator = useCallback(() => {
    if (!user?.email) return false;
    return CREATOR_BYPASS_EMAILS.includes(user.email.toLowerCase());
  }, [user?.email]);

  // Activate a product via creator bypass
  const activateCreatorSubscription = useCallback(async (productKey: ProductKey): Promise<{ success: boolean; error?: string }> => {
    try {
      // Client-side pre-check (real security is server-side)
      if (!isCreator()) {
        return { success: false, error: "Non autorisé" };
      }

      const { data, error } = await supabase.functions.invoke("activate-creator-subscription", {
        body: { productKey },
      });

      if (error) {
        console.error("[useCreatorBypass] Edge function error:", error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        toast.success("Activé (mode créateur)");
        return { success: true };
      } else {
        return { success: false, error: data?.error || "Erreur inconnue" };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inattendue";
      console.error("[useCreatorBypass] Unexpected error:", err);
      return { success: false, error: errorMessage };
    }
  }, [isCreator]);

  return {
    isCreator,
    activateCreatorSubscription,
    PRODUCT_KEYS,
  };
}
