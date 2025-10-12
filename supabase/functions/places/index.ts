import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "content-type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers });

  const key = Deno.env.get("GOOGLE_MAPS_API_KEY") || Deno.env.get("GOOGLE_MAPS_KEY");
  if (!key) {
    console.error("Missing GOOGLE_MAPS_API_KEY");
    return new Response(JSON.stringify({ error: "Missing GOOGLE_MAPS_API_KEY" }), { status: 500, headers });
  }

  const type = url.searchParams.get("type");
  const base = "https://maps.googleapis.com/maps/api/place";
  let target = "";

  if (type === "autocomplete") {
    const input = url.searchParams.get("input") ?? "";
    const sessiontoken = url.searchParams.get("sessiontoken") ?? crypto.randomUUID();
    const params = new URLSearchParams({
      input,
      types: "establishment",
      language: "fr",
      components: "country:fr",
      key,
      sessiontoken,
    });
    target = `${base}/autocomplete/json?${params}`;
    console.log("Autocomplete request for:", input);
  } else if (type === "details") {
    const place_id = url.searchParams.get("place_id") ?? "";
    const params = new URLSearchParams({
      place_id,
      language: "fr",
      fields: "place_id,name,formatted_address,international_phone_number,website,rating,user_ratings_total,geometry/location,url",
      key,
    });
    target = `${base}/details/json?${params}`;
    console.log("Details request for place_id:", place_id);
  } else {
    return new Response(JSON.stringify({ error: "Invalid type parameter. Use 'autocomplete' or 'details'" }), { status: 400, headers });
  }

  try {
    const resp = await fetch(target);
    const data = await resp.json();
    
    if (!resp.ok) {
      console.error("Google Places API error:", data);
      return new Response(JSON.stringify(data), { status: resp.status, headers });
    }
    
    console.log(`Request successful, status: ${data.status}`);
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (e) {
    console.error("Error in places function:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
});
