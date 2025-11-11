import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    if (!priceId) throw new Error("STRIPE_PRICE_ID is not set");

    logStep("Stripe keys verified", { 
      priceIdPreview: priceId?.substring(0, 10) + "...",
      priceIdLength: priceId?.length 
    });

    const { email } = await req.json();
    if (!email) throw new Error("Email is required");

    logStep("Creating subscription for email", { email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create subscription with incomplete payment
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
    });

    logStep("Subscription created", { subscriptionId: subscription.id });

    // Get client secret from payment or setup intent with robust fallbacks
    const latestInvoiceRaw = subscription.latest_invoice as any;
    const invoiceId = typeof latestInvoiceRaw === 'string' ? latestInvoiceRaw : latestInvoiceRaw?.id;

    logStep("Invoice reference", { hasInvoice: !!latestInvoiceRaw, invoiceId });

    let paymentIntent: Stripe.PaymentIntent | undefined =
      latestInvoiceRaw && typeof latestInvoiceRaw.payment_intent !== 'string'
        ? (latestInvoiceRaw.payment_intent as Stripe.PaymentIntent)
        : undefined;

    let setupIntent: Stripe.SetupIntent | undefined =
      typeof subscription.pending_setup_intent !== 'string'
        ? (subscription.pending_setup_intent as Stripe.SetupIntent)
        : undefined;

    logStep("Initial intents", {
      hasPaymentIntent: !!paymentIntent,
      hasSetupIntent: !!setupIntent,
    });

    // Fallback 1: Explicitly retrieve the invoice and expand the payment_intent
    if (!paymentIntent && invoiceId) {
      try {
        const retrievedInvoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ["payment_intent"],
        } as any);
        logStep("Retrieved invoice from API", { retrievedInvoiceId: retrievedInvoice.id });
        if (retrievedInvoice && typeof (retrievedInvoice as any).payment_intent !== 'string') {
          paymentIntent = (retrievedInvoice as any).payment_intent as Stripe.PaymentIntent;
          logStep("PaymentIntent found via retrieved invoice", { paymentIntentId: paymentIntent?.id, status: paymentIntent?.status });
        }
      } catch (e) {
        logStep("Failed retrieving invoice for PI", { message: (e as Error).message });
      }
    }

    // Fallback 2: List payment intents for the customer and match by invoice
    if (!paymentIntent && invoiceId) {
      try {
        const pis = await stripe.paymentIntents.list({ customer: customerId, limit: 10 });
        paymentIntent = pis.data.find((pi) => {
          const inv = pi.invoice as string | undefined;
          return inv === invoiceId;
        });
        if (paymentIntent) {
          logStep("PaymentIntent matched via list", { paymentIntentId: paymentIntent.id, status: paymentIntent.status });
        }
      } catch (e) {
        logStep("Failed listing PaymentIntents", { message: (e as Error).message });
      }
    }

    // Fallback 3: Re-retrieve subscription to get pending_setup_intent
    if (!paymentIntent && !setupIntent) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscription.id, { expand: ["pending_setup_intent"] } as any);
        if (typeof sub.pending_setup_intent !== 'string') {
          setupIntent = sub.pending_setup_intent as Stripe.SetupIntent;
          logStep("SetupIntent found via subscription retrieve", { setupIntentId: setupIntent?.id, status: setupIntent?.status });
        }
      } catch (e) {
        logStep("Failed retrieving subscription for SetupIntent", { message: (e as Error).message });
      }
    }

    // Fallback 4: Create a SetupIntent to collect a payment method if none exists
    if (!paymentIntent && !setupIntent) {
      try {
        const createdSetupIntent = await stripe.setupIntents.create({
          customer: customerId,
          usage: "off_session",
          payment_method_types: ["card"],
          metadata: {
            subscription_id: subscription.id,
            invoice_id: invoiceId || "",
          },
        });
        setupIntent = createdSetupIntent;
        logStep("Created SetupIntent as fallback", { setupIntentId: setupIntent.id, status: setupIntent.status });
      } catch (e) {
        logStep("Failed creating SetupIntent fallback", { message: (e as Error).message });
      }
    }

    const clientSecret = paymentIntent?.client_secret || setupIntent?.client_secret;
    if (!clientSecret) {
      throw new Error("Failed to get client_secret from payment or setup intent (after fallbacks)");
    }

    logStep("Client secret resolved successfully");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Upsert subscription in database
    const { error: dbError } = await supabaseClient
      .from("subscriptions")
      .upsert({
        email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "stripe_subscription_id",
      });

    if (dbError) {
      logStep("Database error", { error: dbError });
    } else {
      logStep("Subscription saved to database");
    }

    return new Response(
      JSON.stringify({
        clientSecret,
        subscriptionId: subscription.id,
        customerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
