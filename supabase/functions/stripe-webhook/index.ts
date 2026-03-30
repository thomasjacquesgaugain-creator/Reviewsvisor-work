import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);


function getPriceToPlanMap(): Record<string, string> {
  return {
    [Deno.env.get("STRIPE_PRICE_BASIC_ANNUAL") ?? ""]: "basic_annual",
    [Deno.env.get("STRIPE_PRICE_BASIC_MONTHLY") ?? ""]: "basic_monthly",
    [Deno.env.get("STRIPE_PRICE_STANDARD_ANNUAL") ?? ""]: "standard_annual",
    [Deno.env.get("STRIPE_PRICE_STANDARD_MONTHLY") ?? ""]: "standard_monthly",
    [Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") ?? ""]: "pro_annual",
    [Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? ""]: "pro_monthly",
    [Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL") ?? ""]: "premium_annual",
    [Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") ?? ""]: "premium_monthly",
  };
}

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : "");
};

async function getUserIdFromSubscription(subscriptionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    logStep("Error loading subscription row", { error: error.message, subscriptionId });
    return null;
  }

  return data?.user_id ?? null;
}

serve(async (req) => {
  console.log("🔥 FUNCTION HIT", req.method, req.url);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Webhook signature verification failed", { error: message });
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  logStep("Event received", { type: event.type });

  try {
   if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep("Checkout session completed", { sessionId: session.id });

  // Only keep establishment metadata — no more pendingUser fields needed
  const metadata = session.metadata || {};
  const pendingEtabPlaceId   = metadata.pending_etab_place_id || null;
  const pendingEtabName      = metadata.pending_etab_name || null;
  const pendingEtabAddress   = metadata.pending_etab_address || null;
  const pendingEtabPhone     = metadata.pending_etab_phone || null;
  const pendingEtabWebsite   = metadata.pending_etab_website || null;
  const pendingEtabRating    = metadata.pending_etab_rating || null;
  const pendingEtabLat       = metadata.pending_etab_lat || null;
  const pendingEtabLng       = metadata.pending_etab_lng || null;
  const pendingEtabType      = metadata.pending_etab_type || null;

  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id || "";
  const PRICE_TO_PLAN = getPriceToPlanMap();
  const planKey = PRICE_TO_PLAN[priceId] || "basic_monthly";

  logStep("Subscription details", { subscriptionId, priceId, planKey });

  // Resolve user — they already exist since signup creates the account
  const customerEmail = session.customer_email || session.customer_details?.email;
  logStep("Looking up user by email", { email: customerEmail });

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const user = existingUsers.users.find((u) => u.email === customerEmail);

  if (!user) {
    logStep("User not found", { email: customerEmail });
    return new Response(JSON.stringify({ received: true, warning: "user_not_found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const userId = user.id;
  logStep("User resolved", { userId });

  const periodEnd = new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString();

  // Update entitlements
  const { error: entitlementError } = await supabaseAdmin
    .from("user_entitlements")
    .upsert(
      {
        user_id: userId,
        source: "stripe",
        pro_plan_key: planKey,
        pro_status: "active",
        pro_current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (entitlementError) {
    logStep("Error updating entitlements", { error: entitlementError.message });
  }

  // Update subscriptions table
  const { error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id: userId,
      plan_code: planKey,
      provider: "stripe",
      provider_customer_id: String(session.customer || ""),
      provider_subscription_id: subscriptionId,
      status: subscription.status,
      current_period_start: new Date(subscription.items.data[0]?.current_period_start * 1000).toISOString(),
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      created_at: new Date(subscription.created * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
  if (subscriptionError) {
    logStep("Error creating subscription record", { error: subscriptionError.message });
  }

  // Save pending establishment if present in metadata
  if (pendingEtabPlaceId) {
    logStep("Saving pending establishment", { placeId: pendingEtabPlaceId, userId });
    const { error: etabError } = await supabaseAdmin
      .from("establishments")
      .upsert(
        {
          user_id: userId,
          place_id: pendingEtabPlaceId,
          nom: pendingEtabName || null,
          name: pendingEtabName || null,
          formatted_address: pendingEtabAddress || null,
          phone: pendingEtabPhone || null,
          website: pendingEtabWebsite || null,
          rating: pendingEtabRating ? parseFloat(pendingEtabRating) : null,
          lat: pendingEtabLat ? parseFloat(pendingEtabLat) : null,
          lng: pendingEtabLng ? parseFloat(pendingEtabLng) : null,
          types: pendingEtabType || null,
        },
        { onConflict: "user_id,place_id", ignoreDuplicates: false }
      );
    if (etabError) {
      logStep("Error saving establishment", { error: etabError.message });
    } else {
      logStep("Establishment saved", { placeId: pendingEtabPlaceId });
    }
  }

  logStep("Checkout processed", { userId, planKey });
}

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

      const resolvedUserId = await getUserIdFromSubscription(subscription.id);
      if (!resolvedUserId) {
        logStep("No subscription row found for update", { subscriptionId: subscription.id });
      } else {
        const { error } = await supabaseAdmin
          .from("user_entitlements")
          .update({
            pro_status: subscription.status === "active" ? "active" : "inactive",
            pro_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", resolvedUserId);

        if (error) {
          logStep("Error updating subscription status", { error: error.message });
        }
      }

      const { error: subscriptionUpdateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.items.data[0]?.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("provider_subscription_id", subscription.id);

      if (subscriptionUpdateError) {
        logStep("Error updating subscription record", { error: subscriptionUpdateError.message });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription deleted", { subscriptionId: subscription.id });

      const resolvedUserId = await getUserIdFromSubscription(subscription.id);
      if (!resolvedUserId) {
        logStep("No subscription row found for delete", { subscriptionId: subscription.id });
      } else {
        const { error } = await supabaseAdmin
          .from("user_entitlements")
          .update({
            pro_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", resolvedUserId);

        if (error) {
          logStep("Error updating canceled subscription", { error: error.message });
        }
      }

      const { error: subscriptionDeleteError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("provider_subscription_id", subscription.id);

      if (subscriptionDeleteError) {
        logStep("Error updating canceled subscription record", { error: subscriptionDeleteError.message });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("Error processing webhook", { error: message });
    return new Response(`Webhook Error: ${message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
