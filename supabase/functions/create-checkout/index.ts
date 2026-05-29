import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getPriceIds() {
  return {
    basicAnnual:     Deno.env.get("STRIPE_PRICE_BASIC_ANNUAL") ?? "",
    basicMonthly:    Deno.env.get("STRIPE_PRICE_BASIC_MONTHLY") ?? "",
    standardAnnual:  Deno.env.get("STRIPE_PRICE_STANDARD_ANNUAL") ?? "",
    standardMonthly: Deno.env.get("STRIPE_PRICE_STANDARD_MONTHLY") ?? "",
    proAnnual:       Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") ?? "",
    proMonthly:      Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "",
    premiumAnnual:   Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL") ?? "",
    premiumMonthly:  Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") ?? "",
    addon:           Deno.env.get("STRIPE_PRICE_ADDON") ?? "",
  };
}

function buildPriceIdToProductKey(): Record<string, string> {
  const prices = getPriceIds();
  return {
    [prices.basicAnnual]: "basic_annual",
    [prices.basicMonthly]: "basic_monthly",
    [prices.standardAnnual]: "standard_annual",
    [prices.standardMonthly]: "standard_monthly",
    [prices.proAnnual]: "pro_annual",
    [prices.proMonthly]: "pro_monthly",
    [prices.premiumAnnual]: "premium_annual",
    [prices.premiumMonthly]: "premium_monthly",
  };
}

const ADMIN_EMAIL = "thomas.jacquesgaugain@gmail.com";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

function getStripeMode(): "TEST" | "LIVE" {
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  return key.startsWith("sk_test_") ? "TEST" : "LIVE";
}

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

function safeMetaStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).slice(0, 500);
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

    const body = await req.json().catch(() => ({}));
    console.log("body----->", body)
    const emailFromBody = body.email;
    const { priceId: priceIdFromBody,language, pendingUser, pendingEstablishment } = body;

    let userEmail = emailFromBody;
    let customerId: string | undefined;
    let userId: string | undefined;

    if (pendingUser?.email) {
      userEmail = pendingUser.email;
      logStep("Using pendingUser email", { email: userEmail });
    }

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

    if (userEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return errorResponse("INVALID_EMAIL", "Format d'email invalide", 400);
      }
      const disposableDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'temp-mail.org'];
      const emailDomain = userEmail.split('@')[1]?.toLowerCase();
      if (emailDomain && disposableDomains.includes(emailDomain)) {
        return errorResponse("DISPOSABLE_EMAIL", "Les adresses email temporaires ne sont pas autorisées", 400);
      }
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return errorResponse("CONFIG_ERROR", "STRIPE_SECRET_KEY is not set", 500);
    }

    let priceId = (priceIdFromBody || Deno.env.get("STRIPE_PRICE_ID"))?.trim();
    if (!priceId || typeof priceId !== "string") {
      return errorResponse("PRICE_ID_MISSING", "priceId introuvable", 400);
    }
    if (priceId.includes("REPLACE")) {
      return errorResponse("PRICE_ID_INVALID", "Le price ID est un placeholder.", 400);
    }

    // const LIVE_TO_TEST = buildLiveToTest();
    const PRICE_ID_TO_PRODUCT_KEY = buildPriceIdToProductKey();

    // if (stripeMode === "TEST" && LIVE_TO_TEST[priceId]) {
    //   const testPriceId = LIVE_TO_TEST[priceId];
    //   logStep("LIVE priceId replaced by TEST mapping", { from: priceId, to: testPriceId });
    //   priceId = testPriceId;
    // }

    logStep("Inputs", {
      userId: userId ?? "anonymous",
      hasEmail: !!userEmail,
      priceId,
      stripeMode,
      hasPendingEstablishment: !!pendingEstablishment,
    });

    const additionalEstablishmentPriceId = getPriceIds().addon;
    const origin = req.headers.get("origin") || Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://reviewsvisor.fr";

    // ======= ADMIN BYPASS =======
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && userId) {
      logStep("Admin bypass detected", { email: userEmail, priceId });

      const productKey = PRICE_ID_TO_PRODUCT_KEY[priceId];
      if (!productKey) {
        throw new Error("PriceId non reconnu pour le bypass admin");
      }

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);
      const periodEndISO = periodEnd.toISOString();

      const { data: existingEntitlement } = await supabaseClient
        .from('user_entitlements')
        .select('*')
        .eq('user_id', userId)
        .single();

      const upsertData: Record<string, any> = {
        user_id: userId,
        source: 'admin_bypass',
        pro_plan_key: productKey,
        pro_status: 'active',
        pro_current_period_end: periodEndISO,
        updated_at: new Date().toISOString(),
      };

      if (existingEntitlement) {
        await supabaseClient.from('user_entitlements').update(upsertData).eq('user_id', userId);
      } else {
        await supabaseClient.from('user_entitlements').insert({
          ...upsertData,
          addon_multi_etablissements_status: 'inactive',
          addon_multi_etablissements_qty: 0,
        });
      }

      // Admin bypass: also save the establishment immediately (no webhook needed)
      if (pendingEstablishment?.place_id && userId) {
        logStep("Admin bypass: saving establishment directly", { place_id: pendingEstablishment.place_id });
        await supabaseClient.from("establishments").upsert(
          {
            user_id: userId,
            place_id: pendingEstablishment.place_id,
            nom: pendingEstablishment.name,
            name: pendingEstablishment.name,
            formatted_address: pendingEstablishment.address,
            phone: pendingEstablishment.phone || null,
            website: pendingEstablishment.website || null,
            rating: pendingEstablishment.rating || null,
            lat: pendingEstablishment.lat || null,
            lng: pendingEstablishment.lng || null,
            types: pendingEstablishment.type_etablissement || null,
          },
          { onConflict: "user_id,place_id", ignoreDuplicates: false }
        );
      }

      const successUrl = `${origin}/billing/success?session_id=admin_bypass_${Date.now()}`;
      return new Response(JSON.stringify({ url: successUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Count existing establishments (for addon line items)
    // let additionalEstablishments = 0;
    // if (userId) {
    //   const { count: establishmentCount } = await supabaseClient
    //     .from("establishments")
    //     .select("*", { count: "exact", head: true })
    //     .eq("user_id", userId);
    //   const totalEstablishments = establishmentCount || 0;
    //   additionalEstablishments = Math.max(0, totalEstablishments - 1);
    //   logStep("Establishment count", { total: totalEstablishments, additional: additionalEstablishments });
    // }

    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    // if (additionalEstablishments > 0 && additionalEstablishmentPriceId) {
    //   lineItems.push({ price: additionalEstablishmentPriceId, quantity: additionalEstablishments });
    //   logStep("Adding additional establishments", { quantity: additionalEstablishments });
    // }

    const cancelUrl = `${origin}/billing/cancel`;
    const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;

    // Build metadata for both pendingUser (account creation) and pendingEstablishment (save after payment)
    const sessionMetadata: Record<string, string> = {};
    const subscriptionMetadata: Record<string, string> = {};

    if (pendingUser) {
      const puMeta = {
        pending_user_email: safeMetaStr(pendingUser.email),
        pending_user_firstName: safeMetaStr(pendingUser.firstName),
        pending_user_lastName: safeMetaStr(pendingUser.lastName),
        pending_user_company: safeMetaStr(pendingUser.establishmentName || pendingUser.company),
        pending_user_address: safeMetaStr(pendingUser.address),
        pending_user_password: safeMetaStr(pendingUser.password),
        ...(pendingUser.establishmentType && {
          pending_user_establishment_type: safeMetaStr(pendingUser.establishmentType),
        }),
      };
      Object.assign(sessionMetadata, puMeta);
      Object.assign(subscriptionMetadata, puMeta);
    }

    if (pendingEstablishment) {
      const etabMeta = {
        pending_etab_place_id:   safeMetaStr(pendingEstablishment.place_id),
        pending_etab_name:       safeMetaStr(pendingEstablishment.name),
        pending_etab_address:    safeMetaStr(pendingEstablishment.address),
        pending_etab_phone:      safeMetaStr(pendingEstablishment.phone),
        pending_etab_website:    safeMetaStr(pendingEstablishment.website),
        pending_etab_rating:     safeMetaStr(pendingEstablishment.rating),
        pending_etab_lat:        safeMetaStr(pendingEstablishment.lat),
        pending_etab_lng:        safeMetaStr(pendingEstablishment.lng),
        pending_etab_type:       safeMetaStr(pendingEstablishment.type_etablissement),
        pending_etab_user_id:    safeMetaStr(userId),
      };
      Object.assign(sessionMetadata, etabMeta);
      Object.assign(subscriptionMetadata, etabMeta);
      logStep("Pending establishment added to metadata", { place_id: pendingEstablishment.place_id });
    }

    let session;
    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode: "subscription",
        automatic_tax: { enabled: true },
        billing_address_collection: "auto",
        payment_method_types: ["card"],
        allow_promotion_codes: false,
        locale: language?language:'fr',
        metadata:
          Object.keys(sessionMetadata).length > 0 ? sessionMetadata : undefined,
        subscription_data: {
          metadata:
            Object.keys(subscriptionMetadata).length > 0
              ? subscriptionMetadata
              : undefined,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      };

      if (customerId) {
        sessionParams.customer = customerId;

        sessionParams.customer_update = {
          address: "auto",
        };
      } else {
        sessionParams.customer_email = userEmail || undefined;
      }

      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr: unknown) {
      const err = stripeErr as {
        message?: string;
        type?: string;
        code?: string;
      };
      const msg = err?.message ?? String(stripeErr);
      const isMismatch =
        msg.toLowerCase().includes("similar object exists in live mode") ||
        msg.toLowerCase().includes("no such price") ||
        msg.toLowerCase().includes("resource_missing");
      if (isMismatch) {
        const userMessage =
          stripeMode === "TEST"
            ? "Ce prix est en mode Live. Utilisez des price_id Test."
            : "Ce prix est en mode Test. Utilisez des price_id Live.";
        return errorResponse("MISMATCH_TEST_LIVE", userMessage, 400, {
          stripeMode,
        });
      }
      return errorResponse("STRIPE_ERROR", msg, 400, {
        type: err?.type,
        code: err?.code,
      });
    }

    logStep("Checkout session created", { sessionId: session.id, hasUrl: !!session.url });

    return new Response(JSON.stringify({ ok: true, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const err = error as Error;
    logStep("ERROR", { message: err?.message ?? String(error) });
    return errorResponse("CHECKOUT_ERROR", err?.message ?? String(error), 500);
  }
});