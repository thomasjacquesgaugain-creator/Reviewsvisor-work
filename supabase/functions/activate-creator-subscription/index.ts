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
    const upsertData: Record<string, any> = {
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
      // For addon, we just set the status - qty will be handled by increment
      upsertData.addon_multi_etablissements_status = 'active';
      upsertData.addon_multi_etablissements_period_end = periodEndISO;
      logStep("Activating addon", { periodEnd: periodEndISO });
    }

    // Check if user already has an entitlement record
    const { data: existingEntitlement } = await supabaseClient
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingEntitlement) {
      // Update existing record
      const updateData: Record<string, any> = {
        source: 'creator_bypass',
        updated_at: new Date().toISOString(),
      };

      if (config.type === 'pro') {
        updateData.pro_plan_key = config.planKey;
        updateData.pro_status = 'active';
        updateData.pro_current_period_end = periodEndISO;
      } else if (config.type === 'addon') {
        // Increment addon qty
        updateData.addon_multi_etablissements_status = 'active';
        updateData.addon_multi_etablissements_period_end = periodEndISO;
        updateData.addon_multi_etablissements_qty = (existingEntitlement.addon_multi_etablissements_qty || 0) + 1;
        logStep("Incrementing addon qty", { 
          oldQty: existingEntitlement.addon_multi_etablissements_qty || 0,
          newQty: updateData.addon_multi_etablissements_qty
        });
      }

      const { error: updateError } = await supabaseClient
        .from('user_entitlements')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update entitlements: ${updateError.message}`);
      }
    } else {
      // Insert new record
      const insertData: Record<string, any> = {
        user_id: user.id,
        source: 'creator_bypass',
        pro_status: 'inactive',
        addon_multi_etablissements_status: 'inactive',
        addon_multi_etablissements_qty: 0,
      };

      if (config.type === 'pro') {
        insertData.pro_plan_key = config.planKey;
        insertData.pro_status = 'active';
        insertData.pro_current_period_end = periodEndISO;
      } else if (config.type === 'addon') {
        insertData.addon_multi_etablissements_status = 'active';
        insertData.addon_multi_etablissements_period_end = periodEndISO;
        insertData.addon_multi_etablissements_qty = 1;
      }

      const { error: insertError } = await supabaseClient
        .from('user_entitlements')
        .insert(insertData);

      if (insertError) {
        throw new Error(`Failed to insert entitlements: ${insertError.message}`);
      }
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
