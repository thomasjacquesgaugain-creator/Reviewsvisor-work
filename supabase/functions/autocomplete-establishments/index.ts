import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GoogleAutocompletePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
};

type GoogleAutocompleteResponse = {
  status: string;
  error_message?: string;
  predictions?: GoogleAutocompletePrediction[];
};

type GoogleFindPlaceCandidate = {
  place_id: string;
  name?: string;
  formatted_address?: string;
};

type GoogleFindPlaceResponse = {
  status: string;
  error_message?: string;
  candidates?: GoogleFindPlaceCandidate[];
};

function parseLang(req: Request, explicit?: string | null): string {
  const raw = (explicit || req.headers.get("accept-language") || "en").trim();
  return raw.split(",")[0].split("-")[0] || "en";
}

function toSuggestionFromPrediction(p: GoogleAutocompletePrediction) {
  return {
    description: p.description,
    place_id: p.place_id,
    structured: p.structured_formatting ?? {
      main_text: p.description,
      secondary_text: "",
    },
  };
}

function toSuggestionFromCandidate(c: GoogleFindPlaceCandidate) {
  const main = c.name || c.formatted_address || "";
  const secondary = c.name ? (c.formatted_address || "") : "";
  const description = [c.name, c.formatted_address].filter(Boolean).join(" — ") || main;

  return {
    description,
    place_id: c.place_id,
    structured: {
      main_text: main,
      secondary_text: secondary,
    },
    __source: "fallback",
  };
}

async function fetchGoogleJson<T>(url: URL): Promise<T> {
  const res = await fetch(url.toString());
  const data = await res.json();
  return data as T;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);

    // Accept both query params (GET) and JSON body (POST via supabase.functions.invoke)
    let body: any = null;
    if (req.method !== "GET") {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    const input =
      body?.input ||
      url.searchParams.get("input") ||
      url.searchParams.get("q") ||
      url.searchParams.get("query");

    const sessionToken = body?.sessionToken || url.searchParams.get("sessionToken") || undefined;
    const lang = parseLang(req, body?.lang || url.searchParams.get("lang"));

    if (!input || String(input).trim().length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleMapsApiKey = Deno.env.get("CLE_API_GOOGLE_MAPS");
    if (!googleMapsApiKey) {
      console.error("CLE_API_GOOGLE_MAPS not found");
      return new Response(JSON.stringify({ error: "Google Maps API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[autocomplete-establishments]", {
      userId: user.id,
      input,
      lang,
      hasSessionToken: Boolean(sessionToken),
    });

    // 1) Primary: Google Places Autocomplete (worldwide)
    const autoUrl = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    autoUrl.searchParams.set("input", String(input));

    // IMPORTANT: no region / components / bounds / strictbounds / locationbias
    // IMPORTANT: keep language but no region
    autoUrl.searchParams.set("language", lang);
    if (sessionToken) autoUrl.searchParams.set("sessiontoken", String(sessionToken));
    autoUrl.searchParams.set("key", googleMapsApiKey);

    const autoData = await fetchGoogleJson<GoogleAutocompleteResponse>(autoUrl);

    // Google returns 200 even for errors, so we must check autoData.status
    if (autoData.status !== "OK" && autoData.status !== "ZERO_RESULTS") {
      console.error("[autocomplete-establishments] Google autocomplete error", {
        status: autoData.status,
        error_message: autoData.error_message,
      });

      return new Response(
        JSON.stringify({
          error: "Google Places error",
          status: autoData.status,
          error_message: autoData.error_message,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const predictions = autoData.predictions ?? [];
    if (autoData.status === "OK" && predictions.length > 0) {
      const suggestions = predictions.map(toSuggestionFromPrediction);
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Fallback: Find Place From Text (robust for queries like "Bagatelle Dubai")
    const findUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    findUrl.searchParams.set("input", String(input));
    findUrl.searchParams.set("inputtype", "textquery");
    findUrl.searchParams.set("fields", "place_id,name,formatted_address");
    findUrl.searchParams.set("language", lang);
    findUrl.searchParams.set("key", googleMapsApiKey);

    const findData = await fetchGoogleJson<GoogleFindPlaceResponse>(findUrl);

    if (findData.status !== "OK" && findData.status !== "ZERO_RESULTS") {
      console.error("[autocomplete-establishments] Google findplace error", {
        status: findData.status,
        error_message: findData.error_message,
      });

      return new Response(
        JSON.stringify({
          error: "Google Places error",
          status: findData.status,
          error_message: findData.error_message,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const candidates = findData.candidates ?? [];
    const suggestions = candidates.map(toSuggestionFromCandidate);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in autocomplete-establishments function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
