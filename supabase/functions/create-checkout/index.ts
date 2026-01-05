import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price ID for additional establishments (4.99€/month each)
const ADDITIONAL_ESTABLISHMENT_PRICE_ID = "price_1ShiPzGkt979eNWBSDapH7aJ";

// Admin email for bypass
const ADMIN_EMAIL = "thomas.jacquesgaugain@gmail.com";

// Map priceId to productKey for admin bypass
const PRICE_ID_TO_PRODUCT_KEY: Record<string, string> = {
  "price_1SZT7tGkt979eNWB0MF2xczP": "pro_1499_12m", // Pro engagement
  "price_1SXnCbGkt979eNWBttiTM124": "pro_2499_monthly", // Pro flexible
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    // Get email from request body (for non-authenticated users) or from auth
    const body = await req.json().catch(() => ({}));
    const emailFromBody = body.email;
    const priceIdFromBody = body.priceId;
    
    let userEmail = emailFromBody;
    let customerId: string | undefined;
    let userId: string | undefined;
    
    // Try to get authenticated user if available
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        if (data.user?.email) {
          userEmail = data.user.email;
          userId = data.user.id;
          logStep("User authenticated", { email: userEmail, userId });
        }
      } catch (e) {
        logStep("No valid auth, proceeding as guest");
      }
    }

    // Validate email format if provided
    if (userEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        logStep("Invalid email format", { email: userEmail });
        return new Response(JSON.stringify({ error: "Format d'email invalide" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      
      // Block disposable email domains
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'temp-mail.org'];
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();
      if (emailDomain && disposableDomains.includes(emailDomain)) {
        logStep("Disposable email blocked", { domain: emailDomain });
        return new Response(JSON.stringify({ error: "Les adresses email temporaires ne sont pas autorisées" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    // Use priceId from request body, fallback to env variable
    const priceId = priceIdFromBody || Deno.env.get("STRIPE_PRICE_ID");
    if (!priceId) {
      logStep("ERROR: No priceId provided and STRIPE_PRICE_ID not found in environment");
      throw new Error("priceId is required");
    }
    
    logStep("Config verified", { priceId, hasEmail: !!userEmail });
    
    const origin = req.headers.get("origin") || Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://reviewsvisor.fr";
    
    // ======= ADMIN BYPASS =======
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && userId) {
      logStep("Admin bypass detected", { email: userEmail, priceId });
      
      const productKey = PRICE_ID_TO_PRODUCT_KEY[priceId];
      if (!productKey) {
        logStep("ERROR: Unknown priceId for admin bypass", { priceId });
        throw new Error("PriceId non reconnu pour le bypass admin");
      }
      
      // Activate subscription directly
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      const periodEndISO = periodEnd.toISOString();
      
      const planKey = productKey === "pro_1499_12m" ? "pro_1499_12m" : "pro_2499_monthly";
      
      // Check if user already has an entitlement record
      const { data: existingEntitlement } = await supabaseClient
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const upsertData: Record<string, any> = {
        user_id: userId,
        source: 'admin_bypass',
        pro_plan_key: planKey,
        pro_status: 'active',
        pro_current_period_end: periodEndISO,
        updated_at: new Date().toISOString(),
      };
      
      if (existingEntitlement) {
        const { error: updateError } = await supabaseClient
          .from('user_entitlements')
          .update(upsertData)
          .eq('user_id', userId);
        
        if (updateError) {
          throw new Error(`Failed to update entitlements: ${updateError.message}`);
        }
      } else {
        const insertData = {
          ...upsertData,
          addon_multi_etablissements_status: 'inactive',
          addon_multi_etablissements_qty: 0,
        };
        
        const { error: insertError } = await supabaseClient
          .from('user_entitlements')
          .insert(insertData);
        
        if (insertError) {
          throw new Error(`Failed to insert entitlements: ${insertError.message}`);
        }
      }
      
      logStep("Admin subscription activated", { userId, productKey, periodEnd: periodEndISO });
      
      // Return success URL instead of Stripe checkout URL
      const successUrl = `${origin}/success?session_id=admin_bypass_${Date.now()}`;
      return new Response(JSON.stringify({ url: successUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Count user's establishments if authenticated
    let additionalEstablishments = 0;
    if (userId) {
      const { count: establishmentCount, error: countError } = await supabaseClient
        .from("establishments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      
      if (countError) {
        logStep("Error counting establishments", { error: countError.message });
      } else {
        const totalEstablishments = establishmentCount || 0;
        additionalEstablishments = Math.max(0, totalEstablishments - 1);
        logStep("Establishment count", { total: totalEstablishments, additional: additionalEstablishments });
      }
    }
    
    // Check if customer already exists (only if we have an email)
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        logStep("No customer found, will create in checkout");
      }
    } else {
      logStep("No email provided, Stripe Checkout will collect it");
    }

    // Determine if trial should be applied (only for pro-engagement plan)
    const isEngagementPlan = priceId === "price_1SZT7tGkt979eNWB0MF2xczP";
    
    // Build line items: main subscription + additional establishments if any
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ];
    
    // Add additional establishments line item if user has more than 1 establishment
    if (additionalEstablishments > 0) {
      lineItems.push({
        price: ADDITIONAL_ESTABLISHMENT_PRICE_ID,
        quantity: additionalEstablishments,
      });
      logStep("Adding additional establishments to checkout", { quantity: additionalEstablishments });
    }
    
    const cancelUrl = `${origin}/billing/cancel`;
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    
    logStep("Creating checkout session", { 
      cancelUrl, 
      successUrl, 
      origin,
      lineItemsCount: lineItems.length,
      additionalEstablishments
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: lineItems,
      mode: "subscription",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      allow_promotion_codes: false,
      locale: "fr",
      ...(isEngagementPlan && { subscription_data: { trial_period_days: 14 } }),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      cancelUrl: cancelUrl,
      successUrl: successUrl,
      lineItemsCount: lineItems.length,
      additionalEstablishments
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
