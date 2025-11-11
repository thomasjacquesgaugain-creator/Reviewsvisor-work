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
      },
      expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
    });

    logStep("Subscription created", { subscriptionId: subscription.id });

    // Get client secret from payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    logStep("Invoice retrieved", { 
      hasInvoice: !!invoice,
      invoiceId: invoice?.id 
    });
    
    const paymentIntent = invoice && typeof (invoice as any).payment_intent !== 'string'
      ? (invoice as any).payment_intent as Stripe.PaymentIntent
      : undefined;
    const setupIntent = typeof subscription.pending_setup_intent !== 'string'
      ? subscription.pending_setup_intent as Stripe.SetupIntent
      : undefined;

    logStep("PaymentIntent/SetupIntent status", {
      hasPaymentIntent: !!paymentIntent,
      paymentIntentId: paymentIntent?.id,
      paymentIntentStatus: paymentIntent?.status,
      hasSetupIntent: !!setupIntent,
      setupIntentId: setupIntent?.id,
      setupIntentStatus: setupIntent?.status,
    });
    
    const clientSecret = paymentIntent?.client_secret || setupIntent?.client_secret;
    if (!clientSecret) {
      throw new Error("Failed to get client_secret from payment or setup intent");
    }
    
    logStep("Client secret retrieved successfully");

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
