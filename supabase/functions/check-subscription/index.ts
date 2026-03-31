import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// const ADDITIONAL_ESTABLISHMENT_PRICE_ID = "price_1ShiPzGkt979eNWBSDapH7aJ";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Count user's establishments
    const { count: establishmentCount, error: countError } = await supabaseClient
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      logStep("Error counting establishments", { message: countError.message });
    }

    const totalEstablishments = establishmentCount || 0;
    const additionalEstablishments = Math.max(0, totalEstablishments - 1);
    logStep("Establishment count", { total: totalEstablishments, additional: additionalEstablishments });

    // // ======= CHECK USER_ENTITLEMENTS FIRST (creator bypass) =======
    // const { data: entitlement, error: entitlementError } = await supabaseClient
    //   .from("user_entitlements")
    //   .select("*")
    //   .eq("user_id", user.id)
    //   .single();

    // if (entitlement && entitlement.pro_status === 'active') {
    //   const now = new Date();
    //   const periodEnd = entitlement.pro_current_period_end ? new Date(entitlement.pro_current_period_end) : null;
      
    //   // Check if still valid
    //   if (!periodEnd || periodEnd > now) {
    //     logStep("Creator bypass entitlement active", { 
    //       planKey: entitlement.pro_plan_key,
    //       source: entitlement.source,
    //       periodEnd: entitlement.pro_current_period_end
    //     });
        
    //     // Map plan key to price_id for frontend compatibility (aligné avec subscriptionPlans.ts LIVE)
    //     let priceId = null;
    //     // change live ids with test ids for testing in dev
    //     if (entitlement.pro_plan_key === 'pro_1499_12m') {
    //       priceId = 'price_1SseJlGkt979eNWBoFcKFjFZ';
    //     } else if (entitlement.pro_plan_key === 'pro_2499_monthly') {
    //       priceId = 'price_1SseK2Gkt979eNWBgrF3GcCU';
    //     }

    //     return new Response(JSON.stringify({
    //       subscribed: true,
    //       product_id: null,
    //       price_id: priceId,
    //       subscription_end: entitlement.pro_current_period_end,
    //       total_establishments: totalEstablishments,
    //       additional_establishments: additionalEstablishments,
    //       billed_additional_establishments: entitlement.addon_multi_etablissements_qty || 0,
    //       billing_sync_needed: false,
    //       source: entitlement.source,
    //       creator_bypass: entitlement.source === 'creator_bypass',
    //     }), {
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //       status: 200,
    //     });
    //   }
    // }

    // ======= FALLBACK TO STRIPE CHECK =======
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 10 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        total_establishments: totalEstablishments,
        additional_establishments: additionalEstablishments
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 100,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    const parsedSubscriptions = await Promise.all(
      subscriptions.data.map(async (sub: Stripe.Subscription) => {
        const fullSubscription = await stripe.subscriptions.retrieve(sub.id, {
          expand: ["latest_invoice"],
        });
        const latestInvoice = fullSubscription.latest_invoice;
        const latestInvoiceObject =
          typeof latestInvoice === "object" && latestInvoice !== null
            ? latestInvoice
            : null;

        return {
          subscription_id: fullSubscription.id,
          status: fullSubscription.status,
          plan_price_id: fullSubscription.items.data[0]?.price?.id ?? null,
          period_start: fullSubscription.items.data[0]?.current_period_start
            ? new Date(fullSubscription.items.data[0].current_period_start * 1000).toISOString()
            : null,
          period_end: fullSubscription.items.data[0]?.current_period_end
            ? new Date(fullSubscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: fullSubscription.cancel_at_period_end,
          latest_invoice_pdf_url: latestInvoiceObject?.invoice_pdf ?? null,
          latest_invoice_hosted_url: latestInvoiceObject?.hosted_invoice_url ?? null,
        };
      })
    );

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscriptions: parsedSubscriptions,
      // product_id: productId,
      // price_id: priceId,
      // subscription_end: subscriptionEnd,
      // total_establishments: totalEstablishments,
      // additional_establishments: additionalEstablishments,
      // billed_additional_establishments: billedAdditionalEstablishments,
      // billing_sync_needed: hasActiveSub && billedAdditionalEstablishments !== additionalEstablishments,
      source: 'stripe',
      creator_bypass: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
