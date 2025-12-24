import { supabase } from "@/integrations/supabase/client";

export type EstablishmentBillingResult = {
  success: boolean;
  total_establishments?: number;
  additional_establishments?: number;
  additional_monthly_cost?: number;
  error?: string;
};

/**
 * Updates the Stripe subscription quantity for additional establishments
 * Call this function after any establishment is added or removed
 */
export async function syncEstablishmentBilling(): Promise<EstablishmentBillingResult> {
  try {
    const { data, error } = await supabase.functions.invoke<EstablishmentBillingResult>(
      "update-establishment-quantity"
    );

    if (error) {
      console.error("Error syncing establishment billing:", error);
      return { success: false, error: error.message };
    }

    return data || { success: false, error: "No response from server" };
  } catch (err) {
    console.error("Error syncing establishment billing:", err);
    return { success: false, error: String(err) };
  }
}
