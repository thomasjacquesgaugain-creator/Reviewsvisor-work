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
    const functionName = "activate-creator-subscription";
    const functionUrl = `https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/${functionName}`;
    
    console.log(`[useCreatorBypass] Starting call to ${functionName}`, { productKey, url: functionUrl });
    
    try {
      // Client-side pre-check (real security is server-side)
      if (!isCreator()) {
        console.warn("[useCreatorBypass] Client-side creator check failed");
        return { success: false, error: "Non autorisé" };
      }

      // Get current session for auth header
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("[useCreatorBypass] Session error:", sessionError);
        toast.error("Erreur: Session non disponible");
        return { success: false, error: "Session non disponible" };
      }
      
      console.log("[useCreatorBypass] Session valid, invoking edge function...");

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { productKey },
      });

      console.log("[useCreatorBypass] Edge function response:", { data, error });

      if (error) {
        console.error("[useCreatorBypass] Edge function error:", {
          name: error.name,
          message: error.message,
          context: error.context,
          stack: error.stack,
        });
        
        // Try to extract more info from the error
        const errorDetails = error.context?.message || error.message || "Erreur inconnue";
        toast.error(`Erreur abonnement: ${errorDetails}`);
        return { success: false, error: errorDetails };
      }

      if (data?.success) {
        console.log("[useCreatorBypass] Activation successful", data);
        toast.success("Activé (mode créateur)");
        return { success: true };
      } else {
        const errorMsg = data?.error || "Erreur inconnue";
        console.warn("[useCreatorBypass] Activation failed:", errorMsg);
        toast.error(`Erreur: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inattendue";
      console.error("[useCreatorBypass] Unexpected error:", {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });
      toast.error(`Erreur inattendue: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }, [isCreator]);

  return {
    isCreator,
    activateCreatorSubscription,
    PRODUCT_KEYS,
  };
}
