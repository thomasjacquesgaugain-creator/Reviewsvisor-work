/**
 * Edge Function: analyze-reviews-v2
 * Version: v2-auto-universal
 * 
 * Pipeline d'analyse en 2 passes :
 * - PASS A: Détection businessType + extraction thèmes universels + thèmes métier (si confidence >= 75)
 * - PASS B: Recommandations + reply templates
 * 
 * Format de sortie JSON strict validé par Zod
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

// Note: Pour Deno, on ne peut pas importer directement depuis src/
// On duplique les types et fonctions nécessaires ici
type BusinessType = 
  | 'restaurant' 
  | 'salon_coiffure' 
  | 'salle_sport' 
  | 'serrurier' 
  | 'retail_chaussures' 
  | 'institut_beaute' 
  | 'autre';

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

type OutputLanguage = 'fr' | 'en';

type IssueSummary = {
  theme: string;
  count?: number;
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
  return Deno.env.get(key) ??
         (key === "SUPABASE_URL" ? Deno.env.get("SB_URL") : undefined) ??
         (key === "SUPABASE_SERVICE_ROLE_KEY" ? Deno.env.get("SB_SERVICE_ROLE_KEY") : undefined) ??
         fallback;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");
// const OPENAI_KEY   = env("GOOGLE_PLACES_API_KEY");
const OPENAI_KEY   = env("OPENAI_API_KEY", "");
const APP_URL = env("APP_URL", "https://reviewsvisor.com");

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function normalizeLanguage(code: string | null | undefined): OutputLanguage {
  const normalized = String(code || '').trim().toLowerCase();

  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('fr')) return 'fr';

  return 'fr';
}

function getOutputLanguageName(language: OutputLanguage): string {
  return language === 'fr' ? 'French' : 'English';
}

function getLanguageInstruction(language: OutputLanguage): string {
  return `All output text values in the JSON must be in ${getOutputLanguageName(language)}. Keep JSON keys exactly as requested and do not translate the field names.`;
}

function getUniversalThemes(language: OutputLanguage): string[] {
  return language === 'fr'
    ? ['Accueil', 'Propreté', 'Prix', 'Attente', 'Communication', 'SAV', 'Confiance']
    : ['Cleanliness', 'Price', 'Wait Time', 'Communication', 'After-sales Service', 'Trust'];
}

function getFallbackSummaryOneLiner(language: OutputLanguage, establishmentName: string, reviewCount: number): string {
  return language === 'fr'
    ? `Analyse de ${reviewCount} avis pour ${establishmentName}`
    : `Analysis of ${reviewCount} reviews for ${establishmentName}`;
}

function normalizeIssues(raw: unknown): IssueSummary[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const issue = item as Record<string, unknown>;
      const theme = typeof issue.theme === "string" ? issue.theme.trim() : "";
      if (!theme) return null;

      const count = typeof issue.count === "number"
        ? issue.count
        : typeof issue.count === "string"
          ? Number(issue.count)
          : undefined;

      return {
        theme,
        count: Number.isFinite(count as number) ? (count as number) : undefined,
      };
    })
    .filter((item): item is IssueSummary => item !== null);
}


function shouldSendSignificantChangeNotification(
  previousAvgRating: number | null,
  currentAvgRating: number | null,
  previousIssues: IssueSummary[],
  currentIssues: IssueSummary[],
): { send: boolean; reason: "rating_drop" | "major_issue" | null } {
  const ratingDrop = (previousAvgRating ?? 0) - (currentAvgRating ?? 0);

  if (previousAvgRating !== null && currentAvgRating !== null && ratingDrop > 0) {
    return { send: true, reason: "rating_drop" };
  }
  const currentTop = currentIssues[0];
  if (currentTop) {
    const previousThemes = new Set(previousIssues.map((issue) => issue.theme.toLowerCase()));
    const isNewTheme = !previousThemes.has(currentTop.theme.toLowerCase());
    if (isNewTheme) {
      return { send: true, reason: "major_issue" };
    }
  }
  return { send: false, reason: null };
}

function buildAlertEmailHtml(input: {
  language: OutputLanguage;
  displayName: string;
  establishmentName: string;
  reportMonthName: string;
  previousAvg: number | null;
  currentAvg: number | null;
  ratingDrop: number;
  issues: IssueSummary[];
  reason: "rating_drop" | "major_issue";
}): string {
  const isFrench = input.language === "fr";
  const title = isFrench ? "Alerte de réputation" : "Reputation alert";
  const greeting = isFrench ? "Bonjour" : "Hi";
  const intro = isFrench
    ? "Un changement significatif a été détecté sur votre établissement."
    : "A significant change was detected for your establishment.";
  const ratingLabel = isFrench ? "Note moyenne" : "Average rating";
  const previousLabel = isFrench ? "Période précédente" : "Previous period";
  const currentLabel = isFrench ? "Période actuelle" : "Current period";
  const issuesLabel = isFrench ? "Points prioritaires" : "Top issues";
  const ctaLabel = isFrench ? "Voir le tableau de bord" : "Open dashboard";
  const reasonLabel = input.reason === "rating_drop"
    ? (isFrench ? "Baisse de note détectée" : "Rating drop detected")
    : (isFrench ? "Problème majeur détecté" : "Major issue detected");
  const previousDisplay = input.previousAvg !== null ? input.previousAvg.toFixed(1) : "N/A";
  const currentDisplay = input.currentAvg !== null ? input.currentAvg.toFixed(1) : "N/A";
  const issueItems = input.issues.length > 0
    ? input.issues.slice(0, 3).map((issue) => {
        const countSuffix = typeof issue.count === "number" ? ` (${issue.count})` : "";
        return `<li style="margin-bottom:8px;"><strong>${issue.theme}</strong>${countSuffix}</li>`;
      }).join("")
    : `<li style="color:#9CA3AF;">${isFrench ? "Aucun point prioritaire identifié." : "No top issues identified."}</li>`;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #2F6BFF 0%, #1E40AF 100%); color:#fff; padding:32px;">
          <h1 style="margin:0; font-size:24px; line-height:1.2;">${title}</h1>
          <p style="margin:8px 0 0 0; opacity:0.9;">${input.establishmentName} • ${input.reportMonthName}</p>
        </div>
        <div style="padding:32px; color:#1f2937;">
          <p style="margin:0 0 16px 0; font-size:16px;">${greeting} ${input.displayName},</p>
          <p style="margin:0 0 16px 0; font-size:16px; line-height:1.7;">${intro}</p>
          <div style="background:#f9fafb; border-radius:12px; padding:16px; margin-bottom:20px;">
            <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;">${reasonLabel}</p>
            <p style="margin:0; font-size:16px;">
              ${ratingLabel}: <strong>${previousLabel}</strong> ${previousDisplay} → <strong>${currentLabel}</strong> ${currentDisplay}
              ${input.reason === "rating_drop" ? `(${isFrench ? "baisse" : "drop"} ${input.ratingDrop.toFixed(1)})` : ""}
            </p>
          </div>
          <div style="background:#F9FAFB; border-radius:12px; padding:24px; margin-bottom:24px; border-left:4px solid #F59E0B;">
            <h2 style="color:#1F2937; font-size:18px; font-weight:700; margin:0 0 16px 0;">${issuesLabel}</h2>
            <ul style="margin:0; padding-left:20px; color:#374151; font-size:14px; line-height:1.8;">
              ${issueItems}
            </ul>
          </div>
          <div style="text-align:center;">
            <a href="${APP_URL}/tableau-de-bord" style="display:inline-block; background:#2F6BFF; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600;">
              ${ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendSignificantChangeNotification(input: {
  language: OutputLanguage;
  displayName: string;
  userEmail: string;
  establishmentName: string;
  reportMonthName: string;
  previousAvg: number | null;
  currentAvg: number | null;
  ratingDrop: number;
  issues: IssueSummary[];
  reason: "rating_drop" | "major_issue";
}) {
  const subject = input.language === "fr"
    ? `Alerte de réputation - ${input.establishmentName}`
    : `Reputation alert - ${input.establishmentName}`;

  const html = buildAlertEmailHtml(input);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify({
      to: [input.userEmail],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`send-email failed: ${response.status} ${errorText}`);
  }
}

// Détection businessType simplifiée (version Deno)
function detectBusinessType(
  name: string,
  googlePlacesTypes?: string[]| null,
  reviewsTexts?: string[]
): { type: BusinessType; confidence: number; candidates: Array<{type: BusinessType; confidence: number}>; source: 'places' | 'keywords' | 'manual' } {
  const combinedText = `${name} ${(reviewsTexts || []).join(' ')}`.toLowerCase();
  
  // Mapping Google Places
  const placesMapping: Record<string, BusinessType> = {
    'restaurant': 'restaurant', 'food': 'restaurant', 'cafe': 'restaurant',
    'hair_care': 'salon_coiffure', 'beauty_salon': 'salon_coiffure',
    'gym': 'salle_sport', 'health': 'salle_sport',
    'locksmith': 'serrurier',
    'shoe_store': 'retail_chaussures',
    'spa': 'institut_beaute'
  };

  // Keywords par type
  const keywords: Record<BusinessType, string[]> = {
    // restaurant: ['restaurant', 'resto', 'bistrot', 'brasserie', 'café', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'manger', 'repas', 'plat'],
    // salon_coiffure: ['coiffeur', 'coiffeuse', 'salon', 'barber', 'hair', 'cheveux', 'coloration', 'coupe', 'coiffure'],
    // salle_sport: ['gym', 'fitness', 'salle de sport', 'sport', 'musculation', 'crossfit', 'yoga', 'coach'],
    // serrurier: ['serrurier', 'serrurerie', 'dépannage', 'clé', 'verrou', 'serrure', 'urgence'],
    // retail_chaussures: ['chaussure', 'chaussures', 'sneaker', 'basket', 'magasin', 'boutique'],
    // institut_beaute: ['institut', 'beauté', 'beaute', 'esthétique', 'soin', 'massage', 'épilation'],
    // autre: []
      restaurant: ['restaurant', 'diner', 'bistro', 'brasserie', 'cafe', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'eat', 'meal', 'dish'],
      salon_coiffure: ['hairdresser', 'hair stylist', 'salon', 'barber', 'hair', 'hair', 'coloring', 'cut', 'hairstyle'],
      salle_sport: ['gym', 'fitness', 'gym', 'sport', 'bodybuilding', 'crossfit', 'yoga', 'coach'],
      serrurier: ['locksmith', 'locksmith service', 'repair', 'key', 'lock', 'lock', 'emergency'],
      retail_chaussures: ['shoe', 'shoes', 'sneaker', 'sneakers', 'store', 'shop'],
      institut_beaute: ['beauty institute', 'beauty', 'beauty', 'esthetic', 'care', 'massage', 'hair removal'],
      autre: []
  };

  // 1. Essayer Google Places
  if (googlePlacesTypes && googlePlacesTypes.length > 0) {
    for (const placeType of googlePlacesTypes) {
    const normalized = placeType.toLowerCase().replace(/\s+/g, '_');
    const mapped = placesMapping[normalized];
      if (mapped) {
        return {
          type: mapped,
          confidence: 90,
          candidates: [{ type: mapped, confidence: 90 }],
          source: 'places'
        };
      }
    }
  }

  // 2. Fallback keywords
  const scores: Record<BusinessType, number> = {
    restaurant: 0, salon_coiffure: 0, salle_sport: 0, serrurier: 0,
    retail_chaussures: 0, institut_beaute: 0, autre: 0
  };

  Object.entries(keywords).forEach(([type, words]) => {
    words.forEach(word => {
      if (combinedText.includes(word)) {
        scores[type as BusinessType] += name.toLowerCase().includes(word) ? 3 : 1;
      }
    });
  });

  const sorted = Object.entries(scores)
    .filter(([t]) => t !== 'autre')
    .map(([type, score]) => ({ type: type as BusinessType, score }))
    .sort((a, b) => b.score - a.score);

  if (sorted[0].score === 0) {
    return { type: 'autre', confidence: 0, candidates: [], source: 'keywords' };
  }

  const top = sorted[0];
  const confidence = Math.min(100, Math.round((top.score / 10) * 100));
  const candidates = sorted
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({ type: s.type, confidence: Math.min(100, Math.round((s.score / 10) * 100)) }));

  return { type: top.type, confidence, candidates, source: 'keywords' };
}

// Stats simples
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

// PASS A: Détection + extraction thèmes
async function analyzePassA(
  placeName: string,
  samples: string[],
  totalReviews: number,
  businessType: BusinessType,
  businessTypeConfidence: number,
  language: OutputLanguage
) {
  if (!OPENAI_KEY) {
    return null;
  }
console.log("language-language", language)
  const universalThemes = getUniversalThemes(language);
  const languageInstruction = getLanguageInstruction(language);
  const industryThemesHint = businessTypeConfidence >= 45 
    ? `\nAlso look for themes specific to the ${businessType} industry.`
    : '\nFocus only on universal themes and do not invent industry-specific themes.';

//   const prompt = [
//     { role: "system", content: `Tu es un analyste expert qui synthétise des avis clients en english.
// Tu dois extraire les thématiques UNIQUEMENT depuis le contenu réel des avis.
// Réponds exclusivement en JSON valide.` },
//     { role: "user", content:
// `Établissement: ${placeName}
// Type détecté: ${businessType} (confiance: ${businessTypeConfidence}%)
// Total d'avis analysés: ${totalReviews}

// Avis clients:
// ${samples.slice(0, 100).map((t,i)=>`${i+1}. ${t}`).join("\n")}

// INSTRUCTIONS:
// 1. Extrais les thèmes UNIVERSELS mentionnés: ${universalThemes.join(', ')}${industryThemesHint}
// 2. Pour chaque thème, détermine le sentiment (positive/mixed/negative) et l'importance (0-100)
// 3. Inclus 1-2 citations courtes comme preuve
// 4. Si confidence >= 75%, extrais aussi les thèmes spécifiques au secteur ${businessType}
// 5. Si confidence < 75%, ne liste QUE les thèmes universels

// Retourne ce JSON:
// {
//   "themes_universal": [
//     {
//       "theme": "Accueil",
//       "sentiment": "positive|mixed|negative",
//       "importance": 0-100,
//       "evidence_quotes": ["citation 1", "citation 2"],
//       "what_it_means": "Explication courte"
//     }
//   ],
//   "themes_industry": [
//     {
//       "theme": "Thème spécifique secteur",
//       "sentiment": "positive|mixed|negative",
//       "importance": 0-100,
//       "evidence_quotes": ["citation"],
//       "what_it_means": "Explication"
//     }
//   ],
//   "summary": {
//     "one_liner": "Résumé en une phrase",
//     "what_customers_love": ["point 1", "point 2"],
//     "what_customers_hate": ["point 1", "point 2"]
//   }
// }`
//     }
//   ];
const prompt = [
  { 
    role: "system", 
    content: `You are an expert analyst who synthesizes customer reviews.
You must extract themes ONLY from the actual content of the reviews.
Respond strictly with valid JSON.
${languageInstruction}` 
  },
  { 
    role: "user", 
    content:
`Business: ${placeName}
Detected type: ${businessType} (confidence: ${businessTypeConfidence}%)
Total reviews analyzed: ${totalReviews}

Customer reviews:
${samples.slice(0, 100).map((t,i)=>`${i+1}. ${t}`).join("\n")}

INSTRUCTIONS:
1. Extract the UNIVERSAL themes mentioned: ${universalThemes.join(', ')}${industryThemesHint}
2. For each theme, determine the sentiment (positive/mixed/negative) and importance (0–100)
3. Include 1–2 short quotes as evidence
4. If confidence >= 40%, also extract themes specific to the ${businessType} industry
5. If confidence < 75%, list ONLY universal themes
6. Reviews can be multilingual; analyze them as-is without translating the original review text
7. ${languageInstruction}

Return this JSON:
{
  "top_issues": [{"theme": "...", "count": X}, ...],
  "top_strength": [{"theme": "...", "count": X}, ...],
  "themes_universal": [
    {
      "theme": "Welcome",
      "sentiment": "positive|mixed|negative",
      "importance": 0-100,
      "evidence_quotes": ["quote 1", "quote 2"],
      "what_it_means": "Short explanation".
      "count": X,
    }
  ],
  "themes_industry": [
    {
      "theme": "Industry-specific theme",
      "sentiment": "positive|mixed|negative",
      "importance": 0-100,
      "evidence_quotes": ["quote"],
      "what_it_means": "Explanation",
      "count": X,
    }
  ],
  "summary": {
    "one_liner": "One-sentence summary",
    "what_customers_love": ["point 1", "point 2"],
    "what_customers_hate": ["point 1", "point 2"]
  }
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
    return JSON.parse(txt);
  } catch (err) {
    console.error('[analyzePassA] ❌ Erreur parsing:', err);
    return null;
  }
}

// PASS B: Recommandations + reply templates
async function analyzePassB(
  placeName: string,
  businessType: BusinessType,
  businessTypeConfidence: number,
  themesUniversal: any[],
  themesIndustry: any[],
  topIssues: any[],
  avgRating: number | null,
  language: OutputLanguage
) {
  if (!OPENAI_KEY) {
    return null;
  }

  const languageInstruction = getLanguageInstruction(language);

//   const prompt = [
//     { role: "system", content: `Tu es un consultant expert en amélioration de l'expérience client.
// Génère des recommandations actionnables et des templates de réponses adaptés au secteur.
// Réponds exclusivement en JSON valide.` },
//     { role: "user", content:
// `Établissement: ${placeName}
// Type: ${businessType} (confiance: ${businessTypeConfidence}%)
// Note moyenne: ${avgRating?.toFixed(1) || 'N/A'}

// Thèmes identifiés (universels): ${themesUniversal.map((t: any) => t.theme).join(', ')}
// ${themesIndustry.length > 0 ? `Thèmes métier: ${themesIndustry.map((t: any) => t.theme).join(', ')}` : ''}
// Problèmes prioritaires: ${topIssues.map((i: any) => i.theme || i).join(', ')}

// Génère:
// 1. Pain points priorisés (impact 0-100, ease 0-100, first_step concret)
// 2. Quick wins (7 jours) - actions rapides avec résultat attendu
// 3. Projets (30 jours) - actions plus structurées
// 4. Reply templates (positive/neutral/negative) adaptés au secteur ${businessType}

// Retourne ce JSON:
// {
//   "pain_points_prioritized": [
//     {
//       "issue": "Nom du problème",
//       "why_it_matters": "Pourquoi c'est important",
//       "impact": 0-100,
//       "ease": 0-100,
//       "first_step": "Première action concrète"
//     }
//   ],
//   "recommendations": {
//     "quick_wins_7_days": [
//       {
//         "title": "Titre action",
//         "details": "Détails",
//         "expected_result": "Résultat attendu",
//         "priority": 1-5
//       }
//     ],
//     "projects_30_days": [
//       {
//         "title": "Titre projet",
//         "details": "Détails",
//         "expected_result": "Résultat attendu",
//         "priority": 1-5
//       }
//     ]
//   },
//   "reply_templates": {
//     "positive": [
//       {
//         "title": "Titre template",
//         "reply": "Texte de réponse",
//         "use_when": "Quand utiliser"
//       }
//     ],
//     "neutral": [...],
//     "negative": [...]
//   }
// }`
//     }
//   ];
const prompt = [
  { 
    role: "system", 
    content: `You are an expert consultant in customer experience improvement.
Generate actionable recommendations and response templates tailored to the business sector.
Respond strictly with valid JSON.
${languageInstruction}` 
  },
  { 
    role: "user", 
    content:
`Business: ${placeName}
Type: ${businessType} (confidence: ${businessTypeConfidence}%)
Average rating: ${avgRating?.toFixed(1) || 'N/A'}

Identified themes (universal): ${themesUniversal.map((t: any) => t.theme).join(', ')}
${themesIndustry.length > 0 ? `Industry themes: ${themesIndustry.map((t: any) => t.theme).join(', ')}` : ''}
Priority issues: ${topIssues.map((i: any) => i.theme || i).join(', ')}

Generate:
1. Prioritized pain points (impact 0–100, ease 0–100, concrete first_step)
2. Quick wins (7 days) – fast actions with expected results
3. Projects (30 days) – more structured initiatives
4. Reply templates (positive/neutral/negative) adapted to the ${businessType} sector
5. ${languageInstruction}

Return this JSON:
{
  "pain_points_prioritized": [
    {
      "issue": "Problem name",
      "why_it_matters": "Why it matters",
      "impact": 0-100,
      "ease": 0-100,
      "first_step": "First concrete action"
    }
  ],
  "recommendations": {
    "quick_wins_7_days": [
      {
        "title": "Action title",
        "details": "Details",
        "expected_result": "Expected result",
        "priority": 1-5
      }
    ],
    "projects_30_days": [
      {
        "title": "Project title",
        "details": "Details",
        "expected_result": "Expected result",
        "priority": 1-5
      }
    ]
  },
  "reply_templates": {
    "positive": [
      {
        "title": "Template title",
        "reply": "Response text",
        "use_when": "When to use"
      }
    ],
    "neutral": [...],
    "negative": [...]
  }
}`
  }
];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: prompt
    })
  });

  const data = await resp.json();
  const txt = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(txt);
  } catch (err) {
    console.error('[analyzePassB] ❌ Erreur parsing:', err);
    return null;
  }
}

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

    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = userRecord.user?.email ?? "";
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, important_updates_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const firstName = userProfile?.first_name || userRecord.user?.user_metadata?.first_name || "";
    const lastName = userProfile?.last_name || userRecord.user?.user_metadata?.last_name || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || userEmail || "User";
    const importantUpdatesEnabled = userProfile?.important_updates_enabled === true;

    const { place_id, name, dryRun = false, language } = await req.json().catch(()=>({}));
    if (!place_id) return json({ ok:false, error:"missing_place_id" }, 400);
    const outputLanguage = normalizeLanguage(language);

    // Récupérer l'établissement pour obtenir Google Places types
    let establishmentName = name || 'Établissement';
    let googlePlacesTypes: string[] | null = null;
    
    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments')
        .select('name, types')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (establishment?.name) {
        console.log("setting ename")
        establishmentName = establishment.name;
      }
    
      if (establishment?.types) {
      googlePlacesTypes = Array.isArray(establishment.types)
    ? establishment.types
    : [establishment.types];
      console.log("googlePlacesTypes",typeof googlePlacesTypes);
      console.log("googlePlacesTypes", googlePlacesTypes);
      }
    } catch (err) {
      console.warn('[analyze-reviews-v2] Erreur récupération établissement:', err);
    }

    // Récupérer les avis
    const { data: reviewsData, error: reviewsErr } = await supabaseAdmin
      .from('reviews')
      .select('text, rating')
      .eq('place_id', place_id)
      .eq('user_id', userId)
      .limit(200);

    if (reviewsErr) throw new Error(`reviews_fetch_failed:${reviewsErr.message}`);
    const rows: ReviewRow[] = (reviewsData || []).map((r: any) => ({
      user_id: userId,
      place_id,
      source: "google" as const,
      remote_id: r.id || crypto.randomUUID(),
      rating: r.rating ?? null,
      text: r.text ?? null,
      language_code: null,
      published_at: null,
      author_name: null,
      author_url: null,
      author_photo_url: null,
      like_count: null,
    }));

    if (rows.length === 0) {
      return json({ ok: false, error: "no_reviews_found" }, 400);
    }

    // Stats
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    const reviewTexts = sampleTexts;
    console.log("sampleTexts-sampleTexts", sampleTexts)
    console.log("establishmentName-establishmentName", establishmentName)
    console.log("googlePlacesTypes-googlePlacesTypes", googlePlacesTypes)

    // Détection businessType
    const detection = detectBusinessType(establishmentName, googlePlacesTypes, reviewTexts);
    console.log(`[analyze-reviews-v2] Détection: ${detection.type} (${detection.confidence}%) via ${detection.source}`);

    // PASS A: Extraction thèmes
    const passAResult = await analyzePassA(
      establishmentName,
      sampleTexts,
      rows.length,
      detection.type,
      detection.confidence,
      outputLanguage
    );

    if (!passAResult) {
      return json({ ok: false, error: "analysis_pass_a_failed" }, 500);
    }

    // Préparer top_issues depuis les thèmes négatifs
    const negativeThemes = [
      ...(passAResult.themes_universal || []).filter((t: any) => t.sentiment === 'negative'),
      ...(passAResult.themes_industry || []).filter((t: any) => t.sentiment === 'negative')
    ].sort((a: any, b: any) => b.importance - a.importance).slice(0, 3);

    // PASS B: Recommandations + templates
    const passBResult = await analyzePassB(
      establishmentName,
      detection.type,
      detection.confidence,
      passAResult.themes_universal || [],
      passAResult.themes_industry || [],
      negativeThemes,
      stats.overall,
      outputLanguage
    );

    if (!passBResult) {
      return json({ ok: false, error: "analysis_pass_b_failed" }, 500);
    }

    // Assembler le résultat final
    const summaryData = passAResult.summary || {
      one_liner: getFallbackSummaryOneLiner(outputLanguage, establishmentName, rows.length),
      what_customers_love: [],
      what_customers_hate: []
    };

    const analysisResult = {
      analysis_language: outputLanguage,
      top_praises: passAResult.top_strength, 
      top_issues:passAResult.top_issues,
      business_type: detection.type,
      business_type_confidence: detection.confidence,
      business_type_candidates: detection.candidates,
      summary: summaryData,
      kpis: {
        avg_rating: stats.overall,
        total_reviews: stats.total,
        positive_ratio_estimate: stats.positive_pct,
        negative_ratio_estimate: stats.negative_pct
      },
      themes_universal: passAResult.themes_universal || [],
      themes_industry: detection.confidence >= 45 ? (passAResult.themes_industry || []) : [],
      pain_points_prioritized: passBResult.pain_points_prioritized || [],
      recommendations: passBResult.recommendations || {
        quick_wins_7_days: [],
        projects_30_days: []
      },
      reply_templates: passBResult.reply_templates || {
        positive: [],
        neutral: [],
        negative: []
      }
    };

    const previousInsight = dryRun ? null : await supabaseAdmin
      .from('review_insights')
      .select('avg_rating, top_issues, last_analyzed_at')
      .eq('user_id', userId)
      .eq('place_id', place_id)
      .maybeSingle();

    const previousAvgRating = previousInsight?.data?.avg_rating ?? null;
    const previousIssues = normalizeIssues(previousInsight?.data?.top_issues);
    const currentIssues = normalizeIssues(passAResult.top_issues);
    const notificationDecision = shouldSendSignificantChangeNotification(
      previousAvgRating,
      stats.overall,
      previousIssues,
      currentIssues,
    );

    // Sauvegarder dans review_insights (format v2)
    if (!dryRun) {
    const payload = {
      place_id,
      user_id: userId,
      last_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_type: detection.type,
      business_type_confidence: detection.confidence,
      business_type_candidates: detection.candidates,
        analysis_version: 'v2-auto-universal',
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        // Format v1 (rétrocompatibilité)
        themes: [
          ...(passAResult.themes_universal || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
          ...(passAResult.themes_industry || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) }))
        ],
        top_praises: passAResult.top_strength, 
        top_issues:passAResult.top_issues,
        // top_issues: negativeThemes.map((t: any, idx: number) => ({
        //   theme: t.theme,
        //   count: Math.round(t.importance / 10),
        //   severity: idx < 1 ? 'high' : 'medium'
        // })),
        // top_praises: [
        //   ...(passAResult.themes_universal || []).filter((t: any) => t.sentiment === 'positive'),
        //   ...(passAResult.themes_industry || []).filter((t: any) => t.sentiment === 'positive')
        // ].slice(0, 3).map((t: any) => ({
        //   theme: t.theme,
        //   count: Math.round(t.importance / 10)
        // })),
        
        summary: {
          analysis_language: outputLanguage,
          total: stats.total,
          by_rating: stats.by_rating,
          positive_pct: stats.positive_pct,
          negative_pct: stats.negative_pct,
          recommendations: (passBResult.recommendations?.quick_wins_7_days || []).slice(0, 3).map((r: any) => r.title)
        },
        // Format v2 (nouveau)
        themes_universal: passAResult.themes_universal || [],
        themes_industry: detection.confidence >= 45 ? (passAResult.themes_industry || []) : [],
        pain_points_prioritized: passBResult.pain_points_prioritized || [],
        recommendations_quick_wins: passBResult.recommendations?.quick_wins_7_days || [],
        recommendations_projects: passBResult.recommendations?.projects_30_days || [],
        reply_templates: passBResult.reply_templates || {},
        summary_one_liner: summaryData.one_liner || '',
        summary_what_customers_love: summaryData.what_customers_love || [],
        summary_what_customers_hate: summaryData.what_customers_hate || []
      };

      const { data: upsertedInsight, error: insightError } = await supabaseAdmin
        .from('review_insights')
        .upsert(payload, { onConflict: 'user_id,place_id' })
        .select('place_id, user_id, last_analyzed_at');

      if (insightError) {
        console.error("❌ UPSERT FAILED:", insightError);
      } else {
        console.log("✅ review_insights saved:", upsertedInsight);
      }

      // Mettre à jour l'établissement avec le businessType détecté
      if (
      importantUpdatesEnabled &&
      notificationDecision.send &&
      notificationDecision.reason &&
      userEmail
      ) {
        try {
          const reportLocale = outputLanguage === "fr" ? "fr-FR" : "en-US";
          const reportMonthName = new Intl.DateTimeFormat(reportLocale, {
            month: "long",
            year: "numeric",
          }).format(new Date());

          await sendSignificantChangeNotification({
            language: outputLanguage,
            displayName,
            userEmail,
            establishmentName,
            reportMonthName,
            previousAvg: previousAvgRating,
            currentAvg: stats.overall,
            ratingDrop: (previousAvgRating ?? 0) - (stats.overall ?? 0),
            issues: currentIssues,
            reason: notificationDecision.reason,
          });
          console.log('[analyze-reviews-v2] Significant change notification sent', {
            reason: notificationDecision.reason,
            userId,
            place_id,
          });
        } catch (notificationError) {
          console.error('[analyze-reviews-v2] Failed to send notification:', notificationError);
        }
      } else if (!importantUpdatesEnabled) {
        console.log('[analyze-reviews-v2] Important updates notifications disabled for user', {
          userId,
          place_id,
        });
      }

      await supabaseAdmin
        .from('establishments')
        .update({
          business_type: detection.type,
          business_type_confidence: detection.confidence,
          business_type_candidates: detection.candidates,
          business_type_source: detection.source,
          analysis_version: 'v2-auto-universal'
        })
        .eq('place_id', place_id)
        .eq('user_id', userId);
    }

    return json({
      ok: true,
      analysis_language: outputLanguage,
      analysis: analysisResult,
      counts: { collected: rows.length },
      dryRun
    });
  } catch (e) {
    console.error('[analyze-reviews-v2] Error:', e);
    return json({ ok:false, error: String(e?.message ?? e) }, 500);
  }
});
