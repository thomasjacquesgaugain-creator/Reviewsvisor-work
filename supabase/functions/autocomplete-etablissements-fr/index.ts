import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalise un résultat API RE (data.gouv) pour l'autocomplete
function mapItem(it: any) {
  const nom =
    it.nom_raison_sociale ||
    it.enseigne ||
    it.nom_complet ||
    it.nom_usuel ||
    it.siege?.nom_raison_sociale ||
    "Établissement";
  const et = it.etablissement_siege || it.siege || it.etablissement || {};
  const adr =
    et.libelle_commune
      ? [et.numero_voie, et.type_voie, et.libelle_voie, et.code_postal, et.libelle_commune]
          .filter(Boolean)
          .join(" ")
      : it.libelle_commune;
  return {
    id: it.siret || it.siren || it.id || `${nom}-${adr}`,
    label: nom,
    secondary: [adr, it.activite_principale].filter(Boolean).join(" · "),
    siret: it.siret || null,
    siren: it.siren || null,
    commune: et.libelle_commune || it.libelle_commune || null,
    code_postal: et.code_postal || null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ""
    
    if (!q.trim()) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // API officielle: https://recherche-entreprises.api.gouv.fr
    const apiUrl = new URL("https://recherche-entreprises.api.gouv.fr/search");
    apiUrl.searchParams.set("q", q);                  // texte: nom, enseigne, siret, etc.
    apiUrl.searchParams.set("page", "1");
    apiUrl.searchParams.set("per_page", "8");         // 8 suggestions
    apiUrl.searchParams.set("etat", "A");             // actifs
    apiUrl.searchParams.set("precision", "etablissement"); // on veut des établissements

    console.log('Calling API:', apiUrl.toString())

    const response = await fetch(apiUrl.toString(), {
      headers: { 
        "accept": "application/json", 
        "accept-language": "fr",
        "User-Agent": "AnalytiqueApp/1.0"
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`API gouv error ${response.status}: ${text}`)
      return new Response(
        JSON.stringify({ error: `API gouv ${response.status}: ${text}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json();
    console.log('API response:', data)

    const items = (data.results || []).map(mapItem);
    
    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})