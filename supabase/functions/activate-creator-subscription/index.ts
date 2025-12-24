import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlist des emails créateurs - vérification stricte côté serveur
const CREATOR_BYPASS_EMAILS = ["thomas.jacquesgaugain@gmail.com"];

// Product keys stables mappés vers les configurations
const PRODUCT_CONFIGS: Record<string, { 
  type: 'pro' | 'addon';
  planKey?: string;
  addonField?: string;
}> = {
  "pro_1499_12m": { type: 'pro', planKey: 'pro_1499_12m' },
  "pro_2499_monthly": { type: 'pro', planKey: 'pro_2499_monthly' },
  "addon_multi_etablissements_499": { type: 'addon', addonField: 'addon_multi_etablissements' },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-CREATOR-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ⚠️ CRITICAL: Server-side email verification
    if (!CREATOR_BYPASS_EMAILS.includes(user.email.toLowerCase())) {
      logStep("SECURITY: Non-creator attempted bypass", { email: user.email });
      throw new Error("Unauthorized: Creator bypass not available for this account");
    }
    
    logStep("Creator bypass authorized", { email: user.email });

    // Parse request body
    const body = await req.json();
    const { productKey } = body;
    
    if (!productKey || typeof productKey !== 'string') {
      throw new Error("Missing or invalid productKey");
    }
    
    const config = PRODUCT_CONFIGS[productKey];
    if (!config) {
      throw new Error(`Invalid productKey: ${productKey}`);
    }
    
    logStep("Product key validated", { productKey, config });

    // Calculate period end (30 days from now)
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);
    const periodEndISO = periodEnd.toISOString();

    // Build upsert data based on product type
    let upsertData: Record<string, any> = {
      user_id: user.id,
      source: 'creator_bypass',
      updated_at: new Date().toISOString(),
    };

    if (config.type === 'pro') {
      upsertData.pro_plan_key = config.planKey;
      upsertData.pro_status = 'active';
      upsertData.pro_current_period_end = periodEndISO;
      logStep("Activating pro plan", { planKey: config.planKey, periodEnd: periodEndISO });
    } else if (config.type === 'addon') {
      upsertData.addon_multi_etablissements_status = 'active';
      upsertData.addon_multi_etablissements_period_end = periodEndISO;
      // Increment quantity for each addon activation
      logStep("Activating addon", { periodEnd: periodEndISO });
    }

    // Upsert into user_entitlements
    const { data: entitlement, error: upsertError } = await supabaseClient
      .from('user_entitlements')
      .upsert(upsertData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (upsertError) {
      logStep("Upsert error", { error: upsertError });
      throw new Error(`Failed to update entitlements: ${upsertError.message}`);
    }

    // If addon, we need to increment the qty (upsert doesn't handle increment well)
    if (config.type === 'addon') {
      const { data: currentData } = await supabaseClient
        .from('user_entitlements')
        .select('addon_multi_etablissements_qty')
        .eq('user_id', user.id)
        .single();
      
      const currentQty = currentData?.addon_multi_etablissements_qty || 0;
      
      await supabaseClient
        .from('user_entitlements')
        .update({ 
          addon_multi_etablissements_qty: currentQty + 1,
          addon_multi_etablissements_status: 'active',
          addon_multi_etablissements_period_end: periodEndISO,
        })
        .eq('user_id', user.id);
      
      logStep("Addon qty incremented", { newQty: currentQty + 1 });
    }

    // Fetch final state
    const { data: finalEntitlement, error: fetchError } = await supabaseClient
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      logStep("Fetch error after upsert", { error: fetchError });
    }

    logStep("Activation complete", { entitlement: finalEntitlement });

    return new Response(JSON.stringify({
      success: true,
      message: "Activé (mode créateur)",
      productKey,
      entitlement: finalEntitlement,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
