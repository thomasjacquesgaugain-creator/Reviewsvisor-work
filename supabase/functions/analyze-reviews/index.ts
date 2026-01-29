// supabase/functions/analyze-reviews/index.ts
// Deno Edge Function (TypeScript)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

type ReviewRow = {
  user_id: string | null;
  place_id: string;
  source: "google";
  remote_id: string;
  rating: number | null;
  text: string | null;
  language_code: string | null;
  published_at: string | null;
  author_name: string | null;
  author_url: string | null;
  author_photo_url: string | null;
  like_count: number | null;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function env(key: string, fallback = "") {
  // compat anciennes/ nouvelles variables
  return Deno.env.get(key) ??
         (key === "SUPABASE_URL" ? Deno.env.get("SB_URL") : undefined) ??
         (key === "SUPABASE_SERVICE_ROLE_KEY" ? Deno.env.get("SB_SERVICE_ROLE_KEY") : undefined) ??
         fallback;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");
const GOOGLE_KEY   = env("GOOGLE_PLACES_API_KEY");
const OPENAI_KEY   = env("OPENAI_API_KEY", "");

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Google Places API v1 - list all reviews with pagination
async function fetchAllGoogleReviews(placeId: string) {
  if (!GOOGLE_KEY) throw new Error("missing_google_key");

  // Places API v1 nécessite le nom de ressource: places/{placeId}
  const id = encodeURIComponent(placeId.replace(/^places\//, ""));
  const base = `https://places.googleapis.com/v1/places/${id}/reviews`;
  const headers: HeadersInit = {
    "X-Goog-Api-Key": GOOGLE_KEY,
    // on liste les champs utiles (field mask obligatoire en v1)
    "X-Goog-FieldMask":
      "reviews.name,reviews.rating,reviews.text.text,reviews.publishTime," +
      "reviews.authorAttribution.displayName,reviews.authorAttribution.uri," +
      "reviews.authorAttribution.photoUri,nextPageToken",
  };

  let pageToken = "";
  const out: any[] = [];

  for (let i = 0; i < 100; i++) { // garde-fou
    const url = new URL(base);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const r = await fetch(url.toString(), { headers });
    if (!r.ok) {
      const errorText = await r.text();
      console.error('Google Places API error:', { status: r.status, body: errorText, timestamp: new Date().toISOString() });
      
      // Return generic errors to client
      if (r.status === 429) {
        throw new Error('Limite de requêtes Google atteinte. Veuillez réessayer plus tard.');
      }
      if (r.status === 401 || r.status === 403) {
        throw new Error('Authentification Google échouée. Veuillez reconnecter votre compte.');
      }
      if (r.status === 404) {
        throw new Error('Établissement introuvable.');
      }
      throw new Error('Échec de la récupération des avis. Veuillez réessayer.');
    }
    const j = await r.json();
    const reviews = j.reviews ?? [];
    out.push(...reviews);

    pageToken = j.nextPageToken ?? "";
    if (!pageToken) break;

    // la v1 impose parfois une petite pause
    await new Promise(res => setTimeout(res, 900));
  }

  return out;
}



// Simple agrégateur (note moyenne, %)
function computeStats(rows: ReviewRow[]) {
  const ratings = rows.map(r => r.rating ?? 0).filter(n => n > 0);
  const total = rows.length;
  const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length) : null;

  const pos = rows.filter(r => (r.rating ?? 0) >= 4).length;
  const neg = rows.filter(r => (r.rating ?? 0) <= 2).length;
  const positive_pct = total ? Math.round((pos / total) * 100) : 0;
  const negative_pct = total ? Math.round((neg / total) * 100) : 0;

  const by_rating: Record<string, number> = {};
  for (let i=1;i<=5;i++) by_rating[i] = rows.filter(r => (r.rating ?? 0) === i).length;

  return { total, by_rating, positive_pct, negative_pct, overall: avg };
}

// Fonction de fallback dynamique : extrait les thématiques depuis le texte des avis
function extractDynamicThemesFromText(rows: ReviewRow[]) {
  // Mots à ignorer (stop words français)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que',
    'ce', 'cette', 'ces', 'se', 'ne', 'pas', 'plus', 'très', 'trop', 'aussi', 'bien', 'même', 'tout',
    'tous', 'toute', 'toutes', 'avec', 'sans', 'pour', 'par', 'sur', 'dans', 'vers', 'chez', 'sous',
    'est', 'sont', 'était', 'étaient', 'être', 'avoir', 'fait', 'faire', 'faites', 'fait', 'faire',
    'a', 'ont', 'avait', 'avaient', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'si', 'comme', 'alors', 'après', 'avant'
  ]);

  // Extraire tous les mots significatifs des avis
  const wordCounts: Record<string, number> = {};
  const bigramCounts: Record<string, number> = {};
  
  for (const row of rows) {
    const text = (row.text ?? '').toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ') // Garder seulement lettres et espaces
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w)); // Mots de plus de 3 caractères
    
    // Compter les mots individuels
    for (const word of text) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
    
    // Compter les bigrammes (paires de mots consécutifs)
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = `${text[i]} ${text[i + 1]}`;
      bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
    }
  }

  // Regrouper les mots similaires et créer des thématiques
  const themes: Array<{ theme: string; count: number }> = [];
  const processed = new Set<string>();
  
  // Chercher les bigrammes fréquents d'abord (ex: "coupe cheveux", "service client")
  const sortedBigrams = Object.entries(bigramCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  for (const [bigram, count] of sortedBigrams) {
    const words = bigram.split(' ');
    if (!words.some(w => processed.has(w))) {
      // Capitaliser la première lettre de chaque mot
      const theme = bigram.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      themes.push({ theme, count });
      words.forEach(w => processed.add(w));
    }
  }
  
  // Ajouter les mots individuels fréquents qui n'ont pas été traités
  const sortedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count >= 3 && !processed.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7 - themes.length);
  
  for (const [word, count] of sortedWords) {
    const theme = word.charAt(0).toUpperCase() + word.slice(1);
    themes.push({ theme, count });
  }
  
  return themes.slice(0, 7);
}

// Résumé IA avec extraction dynamique depuis le contenu réel des avis
async function summarizeWithOpenAI(placeName: string, samples: string[], totalReviews: number) {
  if (!OPENAI_KEY) {
    return { top_issues: [], top_strengths: [], themes: [], recommendations: [], detected_type: null };
  }
  
  const prompt = [
    { role: "system", content: `Tu es un analyste expert qui synthétise des avis clients en français. 
Tu dois extraire les thématiques UNIQUEMENT depuis le contenu réel des avis, sans utiliser de catégories prédéfinies.
Adapte-toi au type d'établissement détecté dans les avis.
Réponds exclusivement en JSON valide.` },
    { role: "user", content:
`Établissement: ${placeName}
Total d'avis analysés: ${totalReviews}

Avis clients:
${samples.slice(0, 100).map((t,i)=>`${i+1}. ${t}`).join("\n")}

INSTRUCTIONS IMPORTANTES:
1. Analyse ces avis et identifie le TYPE d'établissement (restaurant, salon de coiffure, salle de sport, magasin, etc.)
2. Extrais les 5-7 thématiques les plus mentionnées DIRECTEMENT depuis le contenu des avis
3. N'utilise PAS de catégories génériques prédéfinies - utilise uniquement les thèmes réellement évoqués par les clients
4. Adapte les thématiques au type d'établissement détecté

Exemples de thématiques selon le type:
- Salon de coiffure: Coupe, Coloration, Brushing, Coiffeur/Coiffeuse, Accueil, Salon, Conseils...
- Restaurant: Cuisine, Service, Ambiance, Plats, Desserts, Portions...
- Salle de sport: Équipements, Coachs, Cours, Vestiaires, Horaires, Abonnement...
- Magasin: Produits, Conseils, Choix, Disponibilité, Vendeurs...

Retourne ce JSON:
{
  "detected_type": "type d'établissement détecté",
  "top_issues": [{"theme": "...", "count": X}, ...],
  "top_strengths": [{"theme": "...", "count": X}, ...],
  "themes": [{"theme": "Thématique extraite des avis", "count": X}, ...],
  "recommendations": ["...", "...", "..."]
}`
    }
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: prompt
    })
  });

  const data = await resp.json();
  const txt = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const j = JSON.parse(txt);
    const themes = (j.themes ?? []).slice(0, 7);
    console.log(`[summarizeWithOpenAI] ✅ Thématiques extraites dynamiquement:`, themes.map((t: any) => t.theme || t));
    console.log(`[summarizeWithOpenAI] Type détecté: ${j.detected_type || 'non spécifié'}`);
    
    return {
      top_issues: (j.top_issues ?? []).slice(0, 3),
      top_strengths: (j.top_strengths ?? []).slice(0, 3),
      themes: themes,
      recommendations: (j.recommendations ?? []).slice(0, 3),
      detected_type: j.detected_type || null
    };
  } catch (err) {
    console.error('[summarizeWithOpenAI] ❌ Erreur parsing réponse IA:', err);
    console.error('[summarizeWithOpenAI] Réponse brute:', txt.substring(0, 500));
    return { top_issues: [], top_strengths: [], themes: [], recommendations: [], detected_type: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // SECURITY: Require authentication
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
      } catch {}
    }

    // Reject unauthenticated requests
    if (!userId) {
      return json({ ok: false, error: "authentication_required" }, 401);
    }

    const { place_id, name, dryRun = false } = await req.json().catch(()=>({}));
    if (!place_id) return json({ ok:false, error:"missing_place_id" }, 400);

    // Récupération du nom d'établissement depuis la BDD si disponible
    let establishmentName = name || 'Établissement';
    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments')
        .select('name')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (establishment?.name) {
        establishmentName = establishment.name;
      } else {
        // Si pas dans establishments, essayer établissements
        const { data: etab } = await supabaseAdmin
          .from('établissements')
          .select('nom')
          .eq('place_id', place_id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (etab?.nom) {
          establishmentName = etab.nom;
        }
      }
    } catch (err) {
      console.warn('[analyze-reviews] Erreur récupération établissement, utilisation du nom fourni:', err);
    }

    // 1) Récupération des avis Google (avec fallback BDD en cas d'échec)
    let rows: ReviewRow[] = [];
    let fetchedFrom: "google" | "database" = "google";
    try {
      const gReviews = await fetchAllGoogleReviews(place_id);
      // 2) Map en rows pour upsert
      rows = gReviews.map((r: any) => {
        // r.name ressemble à: "places/ChIJ.../reviews/abc123"
        const remote_id = String(r.name ?? "").split("/").pop() ?? crypto.randomUUID();
        return {
          user_id: userId,
          place_id,
          source: "google",
          remote_id,
          rating: r.rating ?? null,
          text: r.text?.text ?? null,
          language_code: null,
          published_at: r.publishTime ?? null,
          author_name: r.authorAttribution?.displayName ?? null,
          author_url: r.authorAttribution?.uri ?? null,
          author_photo_url: r.authorAttribution?.photoUri ?? null,
          like_count: null,
        };
      });
    } catch (err) {
      console.warn("google_fetch_failed, fallback to database:", err);
      fetchedFrom = "database";
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("reviews")
        .select("user_id, place_id, source, source_review_id, rating, text, language, published_at, author, url")
        .eq("place_id", place_id)
        .eq("user_id", userId ?? "00000000-0000-0000-0000-000000000000");
      if (exErr) throw new Error(`fallback_select_failed:${exErr.message}`);
      rows = (existing ?? []).map((r: any) => ({
        user_id: r.user_id,
        place_id: r.place_id,
        source: (r.source ?? "google"),
        remote_id: r.source_review_id ?? crypto.randomUUID(),
        rating: r.rating ?? null,
        text: r.text ?? null,
        language_code: r.language ?? null,
        published_at: r.published_at ?? null,
        author_name: r.author ?? null,
        author_url: r.url ?? null,
        author_photo_url: null,
        like_count: null,
      }));

      // Deuxième fallback: utiliser reviews_raw si aucune review en table reviews
      if (!rows.length) {
        const { data: rawRows, error: rawErr } = await supabaseAdmin
          .from("reviews_raw")
          .select("place_id, rating, text, reviewed_at, author, source_ref, hash")
          .eq("place_id", place_id);
        if (rawErr) throw new Error(`fallback_raw_select_failed:${rawErr.message}`);
        rows = (rawRows ?? []).map((r: any) => ({
          user_id: userId,
          place_id: r.place_id,
          source: "google",
          remote_id: r.source_ref ?? r.hash ?? crypto.randomUUID(),
          rating: r.rating ?? null,
          text: r.text ?? null,
          language_code: null,
          published_at: r.reviewed_at ?? null,
          author_name: r.author ?? null,
          author_url: null,
          author_photo_url: null,
          like_count: null,
        }));
      }
    }

    // 3) Upsert (service role, RLS bypass) uniquement si on a récupéré Google
    if (!dryRun && rows.length && fetchedFrom === "google") {
      const { error } = await supabaseAdmin.from("reviews")
        .upsert(rows, { onConflict: "source,remote_id" })
        .select("id");
      if (error) throw new Error(`upsert_failed:${error.message}`);
    }

    // 4) Stats + IA avec extraction dynamique
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    console.log(`[analyze-reviews] Appel IA pour ${establishmentName}, ${rows.length} avis, ${sampleTexts.length} textes`);
    const summary = await summarizeWithOpenAI(establishmentName, sampleTexts, rows.length);
    console.log(`[analyze-reviews] Résultat IA - themes: ${summary?.themes?.length || 0}, issues: ${summary?.top_issues?.length || 0}, type détecté: ${summary?.detected_type || 'non spécifié'}`);
    
    // Utiliser les résultats de l'IA ou le fallback dynamique
    const themesComputed = (summary?.themes && summary.themes.length)
      ? summary.themes
      : (() => {
          console.warn(`[analyze-reviews] ⚠️ IA n'a pas généré de thématiques, utilisation du fallback dynamique`);
          return extractDynamicThemesFromText(rows);
        })();
    
    console.log(`[analyze-reviews] Thématiques finales (${themesComputed.length}):`, themesComputed.map((t: any) => t.theme || t));
    
    // Utiliser les résultats de l'IA pour issues, strengths et recommendations
    const issuesComputed = summary?.top_issues && summary.top_issues.length > 0 
      ? summary.top_issues 
      : [];
    const strengthsComputed = summary?.top_strengths && summary.top_strengths.length > 0
      ? summary.top_strengths
      : [];
    const recsComputed = summary?.recommendations && summary.recommendations.length > 0
      ? summary.recommendations
      : ["Collectez plus d'avis pour des recommandations plus précises."];

    if (!dryRun) {
      const payload = {
        place_id,
        user_id: userId, // Authentication now required - no fallback
        last_analyzed_at: new Date().toISOString(),
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        top_issues: (issuesComputed || []).map((issue: any, idx: number) => ({
          theme: issue.theme || issue,
          count: issue.count || issue.mentions || 0,
          severity: idx < 1 ? 'high' : 'medium' 
        })),
        top_praises: (strengthsComputed || []).map((strength: any) => ({ 
          theme: strength.theme || strength.strength || strength,
          count: strength.count || strength.mentions || 0
        })),
        themes: themesComputed.map((theme: any) => ({
          theme: theme.theme,
          count: theme.count || 0
        })),
        summary: {
          total: stats.total,
          by_rating: stats.by_rating,
          positive_pct: stats.positive_pct,
          negative_pct: stats.negative_pct,
          recommendations: recsComputed
        }
      };

      // Upsert manuel sans contrainte unique (update si existe, sinon insert)
      const { data: existsRows, error: existsErr } = await supabaseAdmin
        .from('review_insights')
        .select('place_id')
        .eq('place_id', place_id)
        .eq('user_id', payload.user_id)
        .limit(1);
      if (existsErr) throw new Error(`insights_select_failed:${existsErr.message}`);

      if (existsRows && existsRows.length > 0) {
        const { error } = await supabaseAdmin
          .from('review_insights')
          .update(payload)
          .eq('place_id', place_id)
          .eq('user_id', payload.user_id);
        if (error) throw new Error(`insights_update_failed:${error.message}`);
      } else {
        const { error } = await supabaseAdmin
          .from('review_insights')
          .insert(payload);
        if (error) throw new Error(`insights_insert_failed:${error.message}`);
      }
    }

    return json({
      ok: true,
      counts: { collected: rows.length, google: rows.length, yelp: 0 },
      g_meta: { rating: stats.overall, total: stats.total },
      dryRun
    });
  } catch (e) {
    return json({ ok:false, error: String(e?.message ?? e) }, 500);
  }
});