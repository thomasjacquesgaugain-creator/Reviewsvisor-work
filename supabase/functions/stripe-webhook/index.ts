import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Processing event", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        if (session.customer && session.subscription) {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const customerEmail = session.customer_details?.email;

          logStep("Creating/updating subscription record", {
            customerId,
            subscriptionId,
            email: customerEmail,
          });

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Store in subscriptions table (without user_id for now)
          const { error: insertError } = await supabaseClient
            .from("subscriptions")
            .upsert({
              provider: "stripe",
              provider_customer_id: customerId,
              provider_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "provider_subscription_id"
            });

          if (insertError) {
            logStep("Error upserting subscription", { error: insertError });
          } else {
            logStep("Subscription record created/updated");
          }

          // Try to link to user if email exists
          if (customerEmail) {
            const { data: userData } = await supabaseClient.auth.admin.listUsers();
            const user = userData?.users?.find(u => u.email === customerEmail);
            
            if (user) {
              logStep("Found matching user, linking subscription", { userId: user.id });
              
              await supabaseClient
                .from("subscriptions")
                .update({ user_id: user.id })
                .eq("provider_subscription_id", subscriptionId);
              
              await supabaseClient
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("user_id", user.id);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        await supabaseClient
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscription.id);

        logStep("Subscription updated in database");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        await supabaseClient
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscription.id);

        logStep("Subscription marked as canceled");
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
