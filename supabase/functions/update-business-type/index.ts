/**
 * Edge Function: update-business-type
 * Endpoint pour override manuel du businessType
 * PATCH /update-business-type
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function env(key: string, fallback = "") {
  return Deno.env.get(key) ??
         (key === "SUPABASE_URL" ? Deno.env.get("SB_URL") : undefined) ??
         (key === "SUPABASE_SERVICE_ROLE_KEY" ? Deno.env.get("SB_SERVICE_ROLE_KEY") : undefined) ??
         fallback;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const VALID_BUSINESS_TYPES = [
  'restaurant',
  'salon_coiffure',
  'salle_sport',
  'serrurier',
  'retail_chaussures',
  'institut_beaute',
  'autre'
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
      } catch {}
    }

    if (!userId) {
      return json({ ok: false, error: "authentication_required" }, 401);
    }

    const { place_id, business_type } = await req.json().catch(()=>({}));
    
    if (!place_id) {
      return json({ ok: false, error: "missing_place_id" }, 400);
    }

    if (!business_type || !VALID_BUSINESS_TYPES.includes(business_type)) {
      return json({ ok: false, error: "invalid_business_type" }, 400);
    }

    // Mettre à jour dans establishments
    const { error: updateError1 } = await supabaseAdmin
      .from('establishments')
      .update({
        business_type,
        business_type_confidence: 100, // Override manuel = 100%
        business_type_source: 'manual',
        analysis_version: 'v2-auto-universal'
      })
      .eq('place_id', place_id)
      .eq('user_id', userId);

    // Mettre à jour dans établissements aussi
    const { error: updateError2 } = await supabaseAdmin
      .from('établissements')
      .update({
        business_type,
        business_type_confidence: 100,
        business_type_source: 'manual',
        analysis_version: 'v2-auto-universal'
      })
      .eq('place_id', place_id)
      .eq('user_id', userId);

    if (updateError1 && updateError2) {
      return json({ ok: false, error: "update_failed", details: updateError1.message }, 500);
    }

    return json({
      ok: true,
      business_type,
      business_type_confidence: 100,
      business_type_source: 'manual'
    });
  } catch (e) {
    console.error('[update-business-type] Error:', e);
    return json({ ok: false, error: String(e?.message ?? e) }, 500);
  }
});
