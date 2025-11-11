import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = {
  subscribed: boolean;
  product_id?: string | null;
  subscription_end?: string | null;
};

export const STRIPE_PRODUCTS = {
  pro: {
    product_id: "prod_TP61gPRU9UTdMY",
    price_id: "price_1SSHpnGkt979eNWBKvpEzYwT",
    name: "Abonnement Pro",
    price: "29€/mois",
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

export async function createCheckoutSession(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke<{ url: string }>("create-checkout");

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
