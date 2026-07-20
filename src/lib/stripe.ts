import { supabase } from "@/integrations/supabase/client";

export const STRIPE_PUBLIC_KEY =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)?.trim() || "";

export type SubscriptionStatus = {
  subscribed: boolean;
  product_id?: string | null;
  price_id?: string | null;
  plan_key?: string | null;
  subscription_end?: string | null;
  subscriptions?: {
    subscription_id:      string;
    status:               string;
    plan_price_id:        string | null;
    period_start:         string | null;
    period_end:           string | null;
    cancel_at_period_end: boolean;
    latest_invoice_pdf_url?: string | null;
    latest_invoice_hosted_url?: string | null;
    establishment_name?: string;

  }[];
  total_establishments?: number;
  additional_establishments?: number;
  billed_additional_establishments?: number;
  billing_sync_needed?: boolean;
  source?: "stripe" | "creator_bypass" | "admin_bypass";
  creator_bypass?: boolean;
};

type SubscriptionRow = NonNullable<SubscriptionStatus["subscriptions"]>[number];

type SubscriptionMappingRow = {
  provider_subscription_id: string | null;
  establishment?: { name?: string | null } | { name?: string | null }[] | null;
};

export type BillingInvoice = {
  invoice_id: string;
  invoice_number: string | null;
  status: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  subscription_id: string | null;
  plan_name: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
};

export type BillingPaymentMethod = {
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  cardholder_name: string | null;
  funding: string | null;
  country: string | null;
};

export type BillingInformation = {
  business_name: string | null;
  name: string | null;
  email: string | null;
  currency: string | null;
  tax_exempt: string | null;
  tax_display: string | null;
  tax_ids: string[];
  address: {
    line1: string | null;
    line2: string | null;
    postal_code: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
};

export type BillingReportsResponse = {
  invoices: BillingInvoice[];
  payment_method: BillingPaymentMethod | null;
  billing_information: BillingInformation | null;
};

function getFileNameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const match = header.match(/filename="([^"]+)"/i);
  return match?.[1] || null;
}

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
    const { data, error } = await supabase.functions.invoke<SubscriptionStatus>(
      "check-subscription"
    );

    if (error) {
      console.error("Error checking subscription:", error);
      return { subscribed: false };
    }

    if (!data || !data.subscriptions?.length) {
      return data || { subscribed: false };
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return data;

    const { data: dbSubs, error: dbError } = await supabase
      .from("subscriptions")
      .select(`
        provider_subscription_id,
        establishment:establishment_id (
          name
        )
      `)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Error fetching subscription mapping:", dbError);
      return data;
    }

    const map: Record<string, string> = {};

    (dbSubs || []).forEach((row: SubscriptionMappingRow) => {
      const establishment = Array.isArray(row.establishment)
        ? row.establishment[0]
        : row.establishment;

      if (row.provider_subscription_id) {
        map[row.provider_subscription_id] =
          establishment?.name ?? "—";
      }
    });

    const enrichedSubscriptions = data.subscriptions.map((sub: SubscriptionRow) => ({
      ...sub,
      establishment_name: map[sub.subscription_id] ?? "—",
    }));

    return {
      ...data,
      subscriptions: enrichedSubscriptions,
    };
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

export async function getBillingReports(): Promise<BillingReportsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<BillingReportsResponse>(
      "billing-reports",
    );

    if (error) {
      console.error("Error loading billing invoices:", error);
      throw new Error(error.message);
    }

    return {
      invoices: data?.invoices ?? [],
      payment_method: data?.payment_method ?? null,
      billing_information: data?.billing_information ?? null,
    };
  } catch (err) {
    console.error("Error loading billing invoices:", err);
    throw err;
  }
}

export async function listBillingInvoices(): Promise<BillingInvoice[]> {
  const reports = await getBillingReports();
  return reports.invoices;
}

export async function downloadBillingInvoicesZip(
  invoiceIds?: string[],
  language?: string,
): Promise<{ blob: Blob; fileName: string | null }> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.access_token) {
    throw new Error(sessionError?.message || "Authentication required");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
  const response = await fetch(`${supabaseUrl}/functions/v1/billing-reports`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionData.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "zip",
      invoice_ids: invoiceIds,
      language,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Download failed with status ${response.status}`,
    );
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(
      response.headers.get("Content-Disposition"),
    ),
  };
}

export async function downloadBillingInvoicePdf(
  invoiceId: string,
  language?: string,
): Promise<{ blob: Blob; fileName: string | null }> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.access_token) {
    throw new Error(sessionError?.message || "Authentication required");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
  const response = await fetch(`${supabaseUrl}/functions/v1/billing-reports`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionData.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "pdf",
      invoice_ids: [invoiceId],
      language,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.error || `Download failed with status ${response.status}`,
    );
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(
      response.headers.get("Content-Disposition"),
    ),
  };
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

export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
    }>("cancel-subscription-by-id", {
      body: { subscription_id: subscriptionId },
    });

    if (error) {
      console.error("Error cancelling subscription:", error);
      throw new Error(error.message);
    }

    return { success: data?.success ?? false };
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    throw err;
  }
}
