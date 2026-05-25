import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BillingInvoiceRow = {
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

type LocalSubscriptionRow = {
  provider_subscription_id: string | null;
  establishment?: { name?: string | null } | null;
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BILLING-REPORTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: user.email });
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const { data: dbSubscriptions, error: dbSubscriptionsError } = await supabaseClient
      .from("subscriptions")
      .select(`
        provider_subscription_id,
        establishment:establishment_id (
          name
        )
      `)
      .eq("user_id", user.id);

    if (dbSubscriptionsError) {
      logStep("Error loading local subscriptions", {
        message: dbSubscriptionsError.message,
      });
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const allowedSubscriptionIds = new Set(
      (dbSubscriptions || [])
        .map((row: LocalSubscriptionRow) => row.provider_subscription_id)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    );

    const subscriptionNameMap = new Map<string, string>();
    (dbSubscriptions || []).forEach((row: LocalSubscriptionRow) => {
      if (row.provider_subscription_id) {
        subscriptionNameMap.set(
          row.provider_subscription_id,
          row.establishment?.name ?? "Invoice",
        );
      }
    });

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });

    const filteredInvoices = invoices.data.filter((invoice: Stripe.Invoice) => {
      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id ??
            invoice.parent?.subscription_details?.subscription ??
            null;
      return !!subscriptionId && allowedSubscriptionIds.has(subscriptionId);
    });

    const rows: BillingInvoiceRow[] = filteredInvoices
      .map((invoice: Stripe.Invoice) => {
        const firstLine = invoice.lines.data[0];
        const planName =
          firstLine?.description ||
          invoice.description ||
          invoice.number ||
          "Invoice";

        return {
          invoice_id: invoice.id,
          invoice_number: invoice.number ?? null,
          status: invoice.status ?? "draft",
          amount_paid: invoice.amount_paid ?? 0,
          amount_due: invoice.amount_due ?? 0,
          currency: (invoice.currency ?? "eur").toUpperCase(),
          created_at: new Date(invoice.created * 1000).toISOString(),
          period_start: firstLine?.period?.start
            ? new Date(firstLine.period.start * 1000).toISOString()
            : null,
          period_end: firstLine?.period?.end
            ? new Date(firstLine.period.end * 1000).toISOString()
            : null,
          subscription_id:
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription?.id ??
                invoice.parent?.subscription_details?.subscription ??
                null,
          plan_name:
            subscriptionNameMap.get(
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : invoice.subscription?.id ??
                  invoice.parent?.subscription_details?.subscription ??
                  "",
            ) ?? planName,
          invoice_pdf_url: invoice.invoice_pdf ?? null,
          hosted_invoice_url: invoice.hosted_invoice_url ?? null,
        };
      })
      .sort(
        (a: BillingInvoiceRow, b: BillingInvoiceRow) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    return new Response(JSON.stringify({ invoices: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in billing-reports", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
