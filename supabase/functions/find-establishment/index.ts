import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, city } = await req.json()
    if (!name || !city) {
      return new Response(
        JSON.stringify({ error: "name & city required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GOOGLE_KEY = Deno.env.get('GOOGLE_MAPS_KEY')
    
    // 1) Geocode city
    let loc = null
    let ll = null
    
    if (GOOGLE_KEY) {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&language=fr&key=${GOOGLE_KEY}`
      )
      const geo = await geoResponse.json()
      loc = geo?.results?.[0]?.geometry?.location
      ll = loc ? `${loc.lat},${loc.lng}` : null
    }

    const results: any[] = []

    // Helper pour pousser un résultat normalisé
    const pushG = (r: any, src: string) => results.push({
      source: src,
      place_id: r.place_id,
      name: r.name || r.formatted_address,
      formatted_address: r.formatted_address || r.vicinity || r.name,
      location: r.geometry?.location || null,
      score: r.rating || 0
    })

    // 2) Google Find Place (textquery + locationbias)
    if (GOOGLE_KEY) {
      const fpURL = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json")
      fpURL.searchParams.set("input", `${name} ${city}`)
      fpURL.searchParams.set("inputtype", "textquery")
      fpURL.searchParams.set("fields", "place_id,name,formatted_address,geometry,rating")
      fpURL.searchParams.set("language", "fr")
      if (ll) fpURL.searchParams.set("locationbias", `circle:30000@${ll}`) // 30km
      fpURL.searchParams.set("key", GOOGLE_KEY)
      
      const fpResponse = await fetch(fpURL.toString())
      const fp = await fpResponse.json()
      ;(fp?.candidates || []).forEach((c: any) => pushG(c, "google_findplace"))
    }

    // 3) Google Text Search (fallback)
    if (GOOGLE_KEY && results.length === 0) {
      const tsURL = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      tsURL.searchParams.set("query", `${name} ${city}`)
      if (ll) {
        tsURL.searchParams.set("location", ll)
        tsURL.searchParams.set("radius", "40000")
      }
      tsURL.searchParams.set("language", "fr")
      tsURL.searchParams.set("key", GOOGLE_KEY)
      
      const tsResponse = await fetch(tsURL.toString())
      const ts = await tsResponse.json()
      ;(ts?.results || []).slice(0, 8).forEach((r: any) => pushG(r, "google_textsearch"))
    }

    // 4) Nominatim (fallback open data)
    if (results.length === 0) {
      const nomURL = new URL("https://nominatim.openstreetmap.org/search")
      nomURL.searchParams.set("q", `${name} ${city}`)
      nomURL.searchParams.set("format", "json")
      nomURL.searchParams.set("addressdetails", "1")
      nomURL.searchParams.set("limit", "8")
      nomURL.searchParams.set("extratags", "1")
      nomURL.searchParams.set("countrycodes", "fr")
      
      const nomResponse = await fetch(nomURL.toString(), {
        headers: { "User-Agent": "AnalytiqueApp/1.0" }
      })
      const nom = await nomResponse.json()
      
      nom.forEach((x: any) => results.push({
        source: "osm",
        osm_id: x.osm_id,
        name: x.display_name.split(",")[0],
        formatted_address: x.display_name,
        location: { lat: parseFloat(x.lat), lng: parseFloat(x.lon) },
        place_id: null,
        score: 0
      }))
    }

    // 5) Retour
    if (results.length === 0) {
      return new Response(
        JSON.stringify({ 
          results: [], 
          message: "Aucun résultat — essaye une variante du nom ou ajoute l'arrondissement/CP." 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: "server_error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})