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
  console.log(`[UPDATE-ADDON-QUANTITY] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json().catch(() => ({}));
    const { new_addon_quantity } = body;

    if (typeof new_addon_quantity !== 'number' || new_addon_quantity < 0) {
      throw new Error("Invalid new_addon_quantity");
    }

    logStep("Requested addon quantity update", { new_addon_quantity });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription", { subscriptionId: subscription.id });

    // Find existing addon item
    const addonItem = subscription.items.data.find(
      item => item.price.id === ADDITIONAL_ESTABLISHMENT_PRICE_ID
    );

    let updatedSubscription;

    if (new_addon_quantity === 0) {
      // Remove addon if exists
      if (addonItem) {
        updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [{ id: addonItem.id, deleted: true }],
          proration_behavior: 'create_prorations',
        });
        logStep("Removed addon item", { itemId: addonItem.id });
      } else {
        logStep("No addon to remove");
        updatedSubscription = subscription;
      }
    } else if (addonItem) {
      // Update existing addon quantity
      updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{ id: addonItem.id, quantity: new_addon_quantity }],
        proration_behavior: 'create_prorations',
      });
      logStep("Updated addon quantity", { itemId: addonItem.id, quantity: new_addon_quantity });
    } else {
      // Add new addon item
      updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{ price: ADDITIONAL_ESTABLISHMENT_PRICE_ID, quantity: new_addon_quantity }],
        proration_behavior: 'create_prorations',
      });
      logStep("Added new addon item", { quantity: new_addon_quantity });
    }

    // Calculate new total
    const mainItem = updatedSubscription.items.data.find(
      item => item.price.id !== ADDITIONAL_ESTABLISHMENT_PRICE_ID
    );
    const newAddonItem = updatedSubscription.items.data.find(
      item => item.price.id === ADDITIONAL_ESTABLISHMENT_PRICE_ID
    );

    const mainPrice = mainItem ? (mainItem.price.unit_amount || 0) / 100 : 0;
    const addonPrice = newAddonItem ? ((newAddonItem.price.unit_amount || 0) / 100) * (newAddonItem.quantity || 0) : 0;
    const totalMonthly = mainPrice + addonPrice;

    logStep("Subscription updated successfully", { 
      subscriptionId: updatedSubscription.id,
      addonQuantity: newAddonItem?.quantity || 0,
      totalMonthly
    });

    return new Response(JSON.stringify({
      success: true,
      subscription_id: updatedSubscription.id,
      addon_quantity: newAddonItem?.quantity || 0,
      total_monthly: totalMonthly,
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
