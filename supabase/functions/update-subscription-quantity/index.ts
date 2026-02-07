import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADDITIONAL_ESTABLISHMENT_PRICE_ID = "price_1ShiPzGkt979eNWBSDapH7aJ";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPDATE-SUBSCRIPTION-QUANTITY] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json().catch(() => ({}));
    const newQuantity = typeof body.new_quantity === "number" ? body.new_quantity : undefined;
    if (newQuantity === undefined || newQuantity < 0) {
      throw new Error("new_quantity is required and must be a non-negative number");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ success: false, error: "No Stripe customer found for this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      return new Response(
        JSON.stringify({ success: true, message: "No active subscription to update" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id });

    const extraItem = subscription.items.data.find(
      (item) => item.price.id === ADDITIONAL_ESTABLISHMENT_PRICE_ID
    );

    if (newQuantity === 0) {
      if (extraItem) {
        logStep("Removing extra establishment item", { itemId: extraItem.id });
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: extraItem.id, deleted: true }],
          proration_behavior: "create_prorations",
        });
      }
    } else {
      if (extraItem) {
        logStep("Updating quantity", { from: extraItem.quantity, to: newQuantity });
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: extraItem.id, quantity: newQuantity }],
          proration_behavior: "create_prorations",
        });
      } else {
        logStep("Adding extra establishment item", { quantity: newQuantity });
        await stripe.subscriptions.update(subscription.id, {
          items: [{ price: ADDITIONAL_ESTABLISHMENT_PRICE_ID, quantity: newQuantity }],
          proration_behavior: "create_prorations",
        });
      }
    }

    logStep("Update complete", { new_quantity: newQuantity });
    return new Response(JSON.stringify({ success: true, new_quantity: newQuantity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
