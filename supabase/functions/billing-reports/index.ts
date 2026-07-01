import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "Content-Disposition",
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

type BillingPaymentMethod = {
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  cardholder_name: string | null;
  funding: string | null;
  country: string | null;
};

type BillingInformation = {
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

type LocalSubscriptionRow = {
  provider_subscription_id: string | null;
  establishment?: { name?: string | null } | null;
};

type BillingReportsRequest = {
  format?: "json" | "zip";
  invoice_ids?: string[];
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BILLING-REPORTS] ${step}${detailsStr}`);
};

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "invoice";
}

function formatTaxPercentage(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function getInvoiceTaxDisplay(invoices: Stripe.Invoice[]) {
  for (const invoice of invoices) {
    const invoiceWithTax = invoice as Stripe.Invoice & {
      total_taxes?: Array<{
        tax_rate_details?: {
          tax_rate?: string | Stripe.TaxRate | null;
        } | null;
      }>;
      account_country?: string | null;
    };
    const totalTax = invoiceWithTax.total_taxes?.[0];
    const taxRate = totalTax?.tax_rate_details?.tax_rate;
    const taxRateObject =
      taxRate && typeof taxRate === "object" ? taxRate : null;
    const fallbackTaxRate = invoiceWithTax.default_tax_rates?.[0] ?? null;
    const rate = taxRateObject ?? fallbackTaxRate;
    const country =
      rate?.country ?? invoiceWithTax.customer_address?.country ?? invoiceWithTax.account_country ?? null;
    const percentage =
      rate?.effective_percentage ?? rate?.percentage ?? null;

    if (country && typeof percentage === "number") {
      return `${country.toUpperCase()} • ${formatTaxPercentage(percentage)} %`;
    }
  }

  return null;
}

async function readRequestBody(req: Request): Promise<BillingReportsRequest> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  return await req.json().catch(() => ({}));
}

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
    const body = await readRequestBody(req);
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
      return new Response(JSON.stringify({
        invoices: [],
        payment_method: null,
        billing_information: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Found customer", { customerId });

    const defaultPaymentMethodId =
      typeof customer.invoice_settings.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method?.id ?? null;

    const stripePaymentMethod = defaultPaymentMethodId
      ? await stripe.paymentMethods.retrieve(defaultPaymentMethodId)
      : (
          await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
            limit: 1,
          })
        ).data[0] ?? null;

    const card = stripePaymentMethod?.card ?? null;
    const paymentMethod: BillingPaymentMethod | null =
      stripePaymentMethod && card
        ? {
            brand: card.brand ?? null,
            last4: card.last4 ?? null,
            exp_month: card.exp_month ?? null,
            exp_year: card.exp_year ?? null,
            cardholder_name: stripePaymentMethod.billing_details?.name ?? customer.name ?? null,
            funding: card.funding ?? null,
            country: card.country ?? null,
          }
        : null;

    const taxIds = await stripe.customers.listTaxIds(customerId, { limit: 10 });
    const billingInformation: BillingInformation = {
      business_name: customer.business_name ?? null,
      name: customer.name ?? null,
      email: customer.email ?? user.email ?? null,
      currency: customer.currency?.toUpperCase() ?? null,
      tax_exempt: customer.tax_exempt ?? null,
      tax_display: null,
      tax_ids: taxIds.data
        .map((taxId) => taxId.value)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
      address: customer.address
        ? {
            line1: customer.address.line1 ?? null,
            line2: customer.address.line2 ?? null,
            postal_code: customer.address.postal_code ?? null,
            city: customer.address.city ?? null,
            state: customer.address.state ?? null,
            country: customer.address.country ?? null,
          }
        : null,
    };

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
      return new Response(JSON.stringify({
        invoices: [],
        payment_method: paymentMethod,
        billing_information: billingInformation,
      }), {
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
      expand: ["data.total_taxes.tax_rate_details.tax_rate"],
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

    billingInformation.tax_display = getInvoiceTaxDisplay(filteredInvoices);

    if (body.format === "zip") {
      const requestedInvoiceIds = new Set(
        (body.invoice_ids || [])
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0),
      );
      const invoicesForZip = rows.filter((invoice) => {
        if (requestedInvoiceIds.size > 0 && !requestedInvoiceIds.has(invoice.invoice_id)) {
          return false;
        }

        return !!(invoice.invoice_pdf_url || invoice.hosted_invoice_url);
      });

      if (invoicesForZip.length === 0) {
        return new Response(JSON.stringify({ error: "No downloadable invoices found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      const zip = new JSZip();

      await Promise.all(
        invoicesForZip.map(async (invoice) => {
          const invoiceUrl = invoice.invoice_pdf_url || invoice.hosted_invoice_url;
          if (!invoiceUrl) return;

          const response = await fetch(invoiceUrl);
          if (!response.ok) {
            throw new Error(`Unable to download invoice ${invoice.invoice_id}`);
          }

          const contentType = response.headers.get("content-type") || "";
          const extension =
            contentType.includes("pdf") || invoice.invoice_pdf_url ? "pdf" :
            contentType.includes("html") ? "html" :
            "bin";
          const invoiceDate = invoice.created_at.slice(0, 10);
          const invoiceName = sanitizeFileName(invoice.invoice_number || invoice.invoice_id);
          const establishmentName = sanitizeFileName(invoice.plan_name || "subscription");

          zip.file(
            `${invoiceDate}-${invoiceName}-${establishmentName}.${extension}`,
            await response.arrayBuffer(),
          );
        }),
      );

      const zipBytes = await zip.generateAsync({ type: "uint8array" });

      return new Response(zipBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="reviewsvisor-invoices-${new Date().toISOString().slice(0, 10)}.zip"`,
        },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      invoices: rows,
      payment_method: paymentMethod,
      billing_information: billingInformation,
    }), {
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
