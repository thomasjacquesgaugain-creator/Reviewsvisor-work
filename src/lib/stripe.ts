import { supabase } from "@/integrations/supabase/client";

export const STRIPE_PUBLIC_KEY =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)?.trim() || "";

export type SubscriptionStatus = {
  subscribed: boolean;
  product_id?: string | null;
  price_id?: string | null;
  subscription_end?: string | null;
  total_establishments?: number;
  additional_establishments?: number;
  billed_additional_establishments?: number;
  billing_sync_needed?: boolean;
  source?: 'stripe' | 'creator_bypass';
  creator_bypass?: boolean;
};

// Aligné avec src/config/subscriptionPlans.ts (plan par défaut = Pro annuel engagement)
export const STRIPE_PRODUCTS = {
  pro: {
    product_id: "prod_TP61gPRU9UTdMY",
    price_id:
      (import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL as string)?.trim() ||
      "price_1SZT7tGkt979eNWB0MF2xczP",
    name: "Abonnement Pro",
    price: "14,99€/mois",
  },
};

export async function checkSubscription(): Promise<SubscriptionStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<SubscriptionStatus>("check-subscription");

    if (error) {
      console.error("Error checking subscription:", error);
      return { subscribed: false };
    }

    return data || { subscribed: false };
  } catch (err) {
    console.error("Error checking subscription:", err);
    return { subscribed: false };
  }
}

export async function createCheckoutSession(email?: string): Promise<string | null> {
  try {
    const body = email ? { email } : {};
    const { data, error } = await supabase.functions.invoke<{ url: string }>("create-checkout", {
      body,
    });

    if (error) {
      console.error("Error creating checkout session:", error);
      throw new Error(error.message);
    }

    return data?.url || null;
  } catch (err) {
    console.error("Error creating checkout session:", err);
    throw err;
  }
}

export async function createCustomerPortalSession(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{ url: string }>("customer-portal");

    if (error) {
      console.error("Error creating portal session:", error);
      throw new Error(error.message);
    }

    return data?.url || null;
  } catch (err) {
    console.error("Error creating portal session:", err);
    throw err;
  }
}

/** Met à jour la quantité d'établissements supplémentaires facturés dans Stripe (après suppression d'un établissement). */
export async function updateSubscriptionQuantity(newQuantity: number): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
      "update-subscription-quantity",
      { body: { new_quantity: newQuantity } }
    );

    if (error) {
      console.error("Error updating subscription quantity:", error);
      throw new Error(error.message);
    }

    return { success: data?.success ?? false };
  } catch (err) {
    console.error("Error updating subscription quantity:", err);
    throw err;
  }
}
