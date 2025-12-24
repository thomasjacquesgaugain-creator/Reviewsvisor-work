import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADDITIONAL_ESTABLISHMENT_PRICE_ID = "price_1ShiPzGkt979eNWBSDapH7aJ";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-ESTABLISHMENT-QUANTITY] ${step}${detailsStr}`);
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

    // Count user's establishments from database
    const { count: establishmentCount, error: countError } = await supabaseClient
      .from("establishments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw new Error(`Error counting establishments: ${countError.message}`);
    
    const totalEstablishments = establishmentCount || 0;
    const additionalEstablishments = Math.max(0, totalEstablishments - 1);
    logStep("Establishment count", { total: totalEstablishments, additional: additionalEstablishments });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No active subscription found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No active subscription found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id });

    // Find if there's already an item for additional establishments
    const additionalItem = subscription.items.data.find(
      item => item.price.id === ADDITIONAL_ESTABLISHMENT_PRICE_ID
    );

    if (additionalEstablishments === 0) {
      // No additional establishments needed
      if (additionalItem) {
        // Remove the item from subscription
        logStep("Removing additional establishment item", { itemId: additionalItem.id });
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: additionalItem.id, deleted: true }],
          proration_behavior: "create_prorations",
        });
      }
      logStep("No additional establishments needed");
    } else {
      // Need additional establishments
      if (additionalItem) {
        // Update quantity
        if (additionalItem.quantity !== additionalEstablishments) {
          logStep("Updating quantity", { from: additionalItem.quantity, to: additionalEstablishments });
          await stripe.subscriptions.update(subscription.id, {
            items: [{ id: additionalItem.id, quantity: additionalEstablishments }],
            proration_behavior: "create_prorations",
          });
        } else {
          logStep("Quantity already correct", { quantity: additionalEstablishments });
        }
      } else {
        // Add new item for additional establishments
        logStep("Adding additional establishment item", { quantity: additionalEstablishments });
        await stripe.subscriptions.update(subscription.id, {
          items: [{ price: ADDITIONAL_ESTABLISHMENT_PRICE_ID, quantity: additionalEstablishments }],
          proration_behavior: "create_prorations",
        });
      }
    }

    logStep("Update complete", { 
      totalEstablishments, 
      additionalEstablishments,
      additionalCost: additionalEstablishments * 4.99
    });

    return new Response(JSON.stringify({ 
      success: true,
      total_establishments: totalEstablishments,
      additional_establishments: additionalEstablishments,
      additional_monthly_cost: additionalEstablishments * 4.99
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
