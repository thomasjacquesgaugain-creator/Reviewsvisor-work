import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs
const ADDITIONAL_ESTABLISHMENT_PRICE_ID = "price_1ShiPzGkt979eNWBSDapH7aJ";
const DEFAULT_PLAN_PRICE_ID = "price_1SSJ0sGkt979eNWBhN9cZmG2"; // Pro plan

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const body = await req.json().catch(() => ({}));
    const { priceId, establishments_count } = body;
    
    // Use provided priceId or default
    const mainPriceId = priceId || DEFAULT_PLAN_PRICE_ID;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Count user's establishments from database if not provided
    let totalEstablishments = establishments_count;
    if (totalEstablishments === undefined) {
      const { count, error: countError } = await supabaseClient
        .from("establishments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (countError) {
        logStep("Error counting establishments", { error: countError.message });
        totalEstablishments = 0;
      } else {
        totalEstablishments = count || 0;
      }
    }

    const additionalEstablishments = Math.max(0, totalEstablishments - 1);
    logStep("Establishment count", { total: totalEstablishments, additional: additionalEstablishments });

    // Get or create Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check if already has active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        logStep("User already has active subscription", { subscriptionId: subscriptions.data[0].id });
        return new Response(JSON.stringify({ 
          error: "Already subscribed",
          has_subscription: true,
          subscription_id: subscriptions.data[0].id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://reviewsvisor.fr";
    
    // Build line items: main subscription + additional establishments if any
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: mainPriceId,
        quantity: 1,
      },
    ];
    
    // Add additional establishments line item if needed
    if (additionalEstablishments > 0) {
      lineItems.push({
        price: ADDITIONAL_ESTABLISHMENT_PRICE_ID,
        quantity: additionalEstablishments,
      });
      logStep("Adding additional establishments to checkout", { quantity: additionalEstablishments });
    }

    // Check if this is an engagement plan (14-day trial)
    const isEngagementPlan = mainPriceId === "price_1SZT7tGkt979eNWB0MF2xczP";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "subscription",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      allow_promotion_codes: false,
      ...(isEngagementPlan && { subscription_data: { trial_period_days: 14 } }),
      success_url: `${origin}/etablissement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/etablissement?canceled=true`,
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      lineItemsCount: lineItems.length,
      additionalEstablishments
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      establishments_count: totalEstablishments,
      additional_establishments: additionalEstablishments
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});