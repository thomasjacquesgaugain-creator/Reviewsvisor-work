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

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1SseJlGkt979eNWBoFcKFjFZ": "pro_1499_12m",
  "price_1SseK2Gkt979eNWBgrF3GcCU": "pro_2499_monthly",
  "price_1SseKdGkt979eNWBOA5fiM2f": "addon_etablissement",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
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
    logStep("Webhook signature verification failed", { error: err.message });
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  logStep("Event received", { type: event.type });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id });

      // Récupérer les metadata
      const metadata = session.metadata || {};
      const pendingUserEmail = metadata.pending_user_email;
      const pendingUserFirstName = metadata.pending_user_firstName;
      const pendingUserLastName = metadata.pending_user_lastName;
      const pendingUserCompany = metadata.pending_user_company;
      const pendingUserAddress = metadata.pending_user_address;
      const pendingUserPassword = metadata.pending_user_password;

      logStep("Metadata received", { metadata });
      logStep("Pending user data", { 
        email: pendingUserEmail, 
        firstName: pendingUserFirstName,
        hasPassword: !!pendingUserPassword 
      });

      // Récupérer l'abonnement pour avoir le price_id
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const planKey = PRICE_TO_PLAN[priceId] || "pro_2499_monthly";

      logStep("Subscription details", { subscriptionId, priceId, planKey });

      let userId: string;

      if (pendingUserEmail && pendingUserPassword) {
        // Créer le compte utilisateur avec les metadata pour le trigger
        logStep("Creating new user", { email: pendingUserEmail });

        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: pendingUserEmail,
          password: pendingUserPassword,
          email_confirm: true,
          user_metadata: {
            first_name: pendingUserFirstName || '',
            last_name: pendingUserLastName || '',
            display_name: `${pendingUserFirstName || ''} ${pendingUserLastName || ''}`.trim(),
            company: pendingUserCompany || '',
          },
        });

        if (createUserError) {
          logStep("Error creating user", { error: createUserError.message });
          throw new Error(`Failed to create user: ${createUserError.message}`);
        }

        userId = newUser.user.id;
        logStep("User created successfully", { userId });

        // Envoyer l'email de bienvenue (non bloquant)
        logStep("Sending welcome email", { email: pendingUserEmail });
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            email: pendingUserEmail,
            firstName: pendingUserFirstName || '',
            lastName: pendingUserLastName || '',
          }),
        }).then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            logStep("Error sending welcome email", { error: data.error || response.statusText });
          } else {
            logStep("Welcome email sent successfully", { data });
          }
        }).catch((err) => {
          logStep("Error calling send-welcome-email", { error: err.message });
        });

        // Le profil est créé automatiquement par le trigger handle_new_user
        // On met juste à jour les entitlements

      } else {
        // Utilisateur déjà connecté - récupérer via customer email
        const customerEmail = session.customer_email || session.customer_details?.email;
        logStep("Looking up existing user", { email: customerEmail });

        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === customerEmail);

        if (!user) {
          logStep("User not found", { email: customerEmail });
          throw new Error("User not found");
        }

        userId = user.id;
      }

      // Créer/mettre à jour les entitlements
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      const { error: entitlementError } = await supabaseAdmin
        .from("user_entitlements")
        .upsert({
          user_id: userId,
          source: "stripe",
          pro_plan_key: planKey,
          pro_status: "active",
          pro_current_period_end: periodEnd,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (entitlementError) {
        logStep("Error updating entitlements", { error: entitlementError.message });
      }

      // Créer/mettre à jour l'entrée dans subscriptions
      const { error: subscriptionError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: userId,
          email: pendingUserEmail || session.customer_email || session.customer_details?.email,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: periodEnd,
          created_at: new Date(subscription.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_subscription_id" });

      if (subscriptionError) {
        logStep("Error creating subscription record", { error: subscriptionError.message });
      }

      logStep("Entitlements and subscription updated", { userId, planKey });
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

      // Mettre à jour le statut
      const { error } = await supabaseAdmin
        .from("user_entitlements")
        .update({
          pro_status: subscription.status === "active" ? "active" : "inactive",
          pro_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        logStep("Error updating subscription status", { error: error.message });
      }

      // Mettre à jour aussi la table subscriptions
      const { error: subscriptionUpdateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (subscriptionUpdateError) {
        logStep("Error updating subscription record", { error: subscriptionUpdateError.message });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription deleted", { subscriptionId: subscription.id });

      const { error } = await supabaseAdmin
        .from("user_entitlements")
        .update({
          pro_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        logStep("Error updating canceled subscription", { error: error.message });
      }

      // Mettre à jour aussi la table subscriptions
      const { error: subscriptionDeleteError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (subscriptionDeleteError) {
        logStep("Error updating canceled subscription record", { error: subscriptionDeleteError.message });
      }
    }

  } catch (error) {
    logStep("Error processing webhook", { error: error.message });
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
