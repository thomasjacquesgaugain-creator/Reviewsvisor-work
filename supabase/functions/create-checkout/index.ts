import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs LIVE (prod) — source unique côté backend pour mapping et addon
const LIVE_PRICE = {
  proEngagement: "price_1SZT7tGkt979eNWB0MF2xczP",
  proFlexible: "price_1SXnCbGkt979eNWBttiTM124",
  addon: "price_1ShiPzGkt979eNWBSDapH7aJ",
};

/** Price IDs TEST depuis les secrets Supabase (STRIPE_PRICE_*_TEST). Jamais de placeholder. */
function getTestPriceIds(): { proEngagement: string; proFlexible: string; addon: string } {
  return {
    proEngagement: Deno.env.get("STRIPE_PRICE_ENGAGEMENT_TEST") ?? "",
    proFlexible: Deno.env.get("STRIPE_PRICE_FLEXIBLE_TEST") ?? "",
    addon: Deno.env.get("STRIPE_PRICE_ADDON_TEST") ?? "",
  };
}

/** Construit LIVE_TO_TEST uniquement pour les IDs TEST configurés (non vides). */
function buildLiveToTest(): Record<string, string> {
  const test = getTestPriceIds();
  const map: Record<string, string> = {};
  if (test.proEngagement) map[LIVE_PRICE.proEngagement] = test.proEngagement;
  if (test.proFlexible) map[LIVE_PRICE.proFlexible] = test.proFlexible;
  if (test.addon) map[LIVE_PRICE.addon] = test.addon;
  return map;
}

/** Map priceId → productKey pour admin bypass (LIVE + TEST si configurés). */
function buildPriceIdToProductKey(): Record<string, string> {
  const test = getTestPriceIds();
  const map: Record<string, string> = {
    [LIVE_PRICE.proEngagement]: "pro_1499_12m",
    [LIVE_PRICE.proFlexible]: "pro_2499_monthly",
  };
  if (test.proEngagement) map[test.proEngagement] = "pro_1499_12m";
  if (test.proFlexible) map[test.proFlexible] = "pro_2499_monthly";
  return map;
}

const ADMIN_EMAIL = "thomas.jacquesgaugain@gmail.com";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

/** Retourne le mode Stripe (TEST ou LIVE) sans logger la clé. */
function getStripeMode(): "TEST" | "LIVE" {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  return key.startsWith("sk_test_") ? "TEST" : "LIVE";
}

/** Réponse JSON d'erreur standardisée. */
function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return new Response(
    JSON.stringify({ ok: false, code, message, ...(details && { details }) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeMode = getStripeMode();
  logStep("Stripe mode", { mode: stripeMode });

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
    const { priceId: priceIdFromBody, pendingUser } = body;
    
    let userEmail = emailFromBody;
    let customerId: string | undefined;
    let userId: string | undefined;
    
    // Si pendingUser existe, utiliser son email
    if (pendingUser?.email) {
      userEmail = pendingUser.email;
      logStep("Using pendingUser email", { email: userEmail });
    }
    
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
        return errorResponse("INVALID_EMAIL", "Format d'email invalide", 400);
      }

      // Block disposable email domains
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'temp-mail.org'];
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();
      if (emailDomain && disposableDomains.includes(emailDomain)) {
        logStep("Disposable email blocked", { domain: emailDomain });
        return errorResponse("DISPOSABLE_EMAIL", "Les adresses email temporaires ne sont pas autorisées", 400);
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY is not set");
      return errorResponse("CONFIG_ERROR", "STRIPE_SECRET_KEY is not set", 500);
    }

    // Use priceId from request body, fallback to env variable
    let priceId = (priceIdFromBody || Deno.env.get("STRIPE_PRICE_ID"))?.trim();
    if (!priceId || typeof priceId !== "string") {
      logStep("ERROR: priceId missing or invalid", { hasPriceIdFromBody: !!priceIdFromBody });
      return errorResponse("PRICE_ID_MISSING", "priceId introuvable", 400);
    }
    if (priceId.includes("REPLACE")) {
      logStep("ERROR: priceId is placeholder", { priceId });
      return errorResponse(
        "PRICE_ID_INVALID",
        "Le price ID est un placeholder. Configurez les variables d'environnement Stripe (voir docs/STRIPE_TEST_LIVE.md).",
        400
      );
    }

    const LIVE_TO_TEST = buildLiveToTest();
    const PRICE_ID_TO_PRODUCT_KEY = buildPriceIdToProductKey();

    // Bonus : en mode TEST, si on reçoit un priceId LIVE, le remplacer par le TEST correspondant
    if (stripeMode === "TEST" && LIVE_TO_TEST[priceId]) {
      const testPriceId = LIVE_TO_TEST[priceId];
      logStep("LIVE priceId replaced by TEST mapping", { from: priceId, to: testPriceId });
      priceId = testPriceId;
    }

    logStep("Inputs", {
      userId: userId ?? "anonymous",
      hasEmail: !!userEmail,
      emailDomain: userEmail ? userEmail.replace(/^[^@]+@/, "***@") : null,
      priceId,
      stripeMode,
    });

    const testPriceIds = getTestPriceIds();
    const additionalEstablishmentPriceId = stripeMode === "TEST" ? testPriceIds.addon : LIVE_PRICE.addon;
    
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

    // Determine if trial should be applied (only for pro-annual engagement plan)
    const isEngagementPlan =
      priceId === LIVE_PRICE.proEngagement || priceId === testPriceIds.proEngagement;

    // Build line items: main subscription + additional establishments if any
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (additionalEstablishments > 0 && additionalEstablishmentPriceId) {
      lineItems.push({
        price: additionalEstablishmentPriceId,
        quantity: additionalEstablishments,
      });
      logStep("Adding additional establishments to checkout", { quantity: additionalEstablishments });
    } else if (additionalEstablishments > 0 && stripeMode === "TEST" && !testPriceIds.addon) {
      logStep("Skipping addon line item: STRIPE_PRICE_ADDON_TEST not set", { additionalEstablishments });
    }
    
    const cancelUrl = `${origin}/billing/cancel`;
    const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    
    logStep("Creating checkout session", { 
      cancelUrl, 
      successUrl, 
      origin,
      lineItemsCount: lineItems.length,
      additionalEstablishments
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail || undefined,
        line_items: lineItems,
        mode: "subscription",
        payment_method_types: ["card"],
        billing_address_collection: "auto",
        allow_promotion_codes: false,
        locale: "fr",
        metadata: pendingUser ? {
          pending_user_email: pendingUser.email,
          pending_user_firstName: pendingUser.firstName,
          pending_user_lastName: pendingUser.lastName,
          pending_user_company: pendingUser.establishmentName || pendingUser.company,
          pending_user_address: pendingUser.address,
          pending_user_password: pendingUser.password,
          ...(pendingUser.establishmentType && { pending_user_establishment_type: pendingUser.establishmentType }),
        } : undefined,
        subscription_data: {
          metadata: pendingUser ? {
            pending_user_email: pendingUser.email,
            pending_user_firstName: pendingUser.firstName,
            pending_user_lastName: pendingUser.lastName,
            pending_user_company: pendingUser.establishmentName || pendingUser.company,
            pending_user_address: pendingUser.address,
            pending_user_password: pendingUser.password,
            ...(pendingUser.establishmentType && { pending_user_establishment_type: pendingUser.establishmentType }),
          } : undefined,
          ...(isEngagementPlan && { trial_period_days: 14 }),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } catch (stripeErr: unknown) {
      const err = stripeErr as { message?: string; type?: string; code?: string };
      const msg = err?.message ?? String(stripeErr);
      const isMismatch =
        msg.toLowerCase().includes("similar object exists in live mode") ||
        msg.toLowerCase().includes("no such price") ||
        msg.toLowerCase().includes("resource_missing");
      if (isMismatch) {
        logStep("MISMATCH_TEST_LIVE", { stripeMode, priceId });
        const userMessage =
          stripeMode === "TEST"
            ? "Ce prix est en mode Live. Utilisez des price_id Test (Dashboard Stripe → mode Test) ou une clé sk_test_*."
            : "Ce prix est en mode Test. Utilisez des price_id Live ou une clé sk_live_*.";
        return errorResponse("MISMATCH_TEST_LIVE", userMessage, 400, {
          stripeMode,
          hint: "Vérifiez que les price_id correspondent au mode de STRIPE_SECRET_KEY (sk_test_ vs sk_live_).",
        });
      }
      logStep("STRIPE_ERROR", { message: msg, type: err?.type, code: err?.code });
      return errorResponse("STRIPE_ERROR", msg, 400, { type: err?.type, code: err?.code });
    }

    logStep("Checkout session created", {
      sessionId: session.id,
      hasUrl: !!session.url,
      lineItemsCount: lineItems.length,
      additionalEstablishments,
    });

    return new Response(JSON.stringify({ ok: true, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const err = error as Error;
    const errorMessage = err?.message ?? String(error);
    logStep("ERROR", { message: errorMessage });
    return errorResponse("CHECKOUT_ERROR", errorMessage, 500);
  }
});
