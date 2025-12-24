import { supabase } from "@/integrations/supabase/client";

export const STRIPE_PUBLIC_KEY = "pk_live_51S0PSRGkt979eNWBtbxPd6e8SJM9ZYEIhvlwJ4uibz46iiCUc8zL8ZLsgPzKBx0WMLyg9u6ZWMZhWtJOKEIBnLa300kGR8bI0w";

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

export const STRIPE_PRODUCTS = {
  pro: {
    product_id: "prod_TP61gPRU9UTdMY",
    price_id: "price_1SSJ0sGkt979eNWBhN9cZmG2",
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
