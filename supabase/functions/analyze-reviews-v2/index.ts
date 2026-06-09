/**
 * Edge Function: analyze-reviews-v2
 * Version: v2-auto-universal
 *
 * Pipeline d'analyse en 2 passes :
 * - PASS A: Détection businessType + extraction thèmes universels + thèmes métier (si confidence >= 75)
 * - PASS B: Recommandations + reply templates
 *
 * Format de sortie JSON strict validé par Zod
 *
 * Changes vs previous version:
 * - CANONICAL_THEME_KEYS dictionary: keys are resolved from a hardcoded map,
 *   AI-generated keys are never trusted → consistent keys across re-runs
 * - normalizeSentiment(): sentiment values are always English (positive/mixed/negative)
 *   even on FR items — AI translations like "positif"/"mixte"/"négatif" are normalized
 * - enforceKeys() updated: uses resolveThemeKey() + normalizeSentiment() on every item
 * - getLanguageInstruction() updated: explicitly tells AI not to translate sentiment
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

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

const SUPABASE_URL = env("SB_URL");
const SERVICE_ROLE = env("SB_SERVICE_ROLE_KEY");
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .trim();
}

// ─── CANONICAL KEY DICTIONARY ────────────────────────────────────────────────
// Single source of truth for theme keys.
// AI-generated keys are NEVER trusted — always resolved through this map.
//
// ORDERING RULE — specific before generic, always:
//   "service_quality" must be listed BEFORE "service"
//   "food_presentation" must be listed BEFORE "food_quality"
//   "food_quality" must be listed BEFORE "food"
// The resolver picks the longest matching variant, so ordering here is a
// documentation aid — but keep specific entries above generic ones anyway
// for readability and to avoid future mistakes.
//
// When a theme falls through to slugify(), a console.warn is emitted.
// Use those logs to grow this dictionary over time.

const CANONICAL_THEME_KEYS: Record<string, string[]> = {
  // ── Universal themes ──────────────────────────────────────────────────────
  cleanliness:            ['cleanliness', 'clean', 'hygiene', 'hygiène', 'propreté', 'proprete', 'sanitation'],
  price:                  ['price', 'pricing', 'cost', 'value for money', 'prix', 'tarif', 'tarifs', 'rapport qualité prix', 'rapport qualite prix'],
  wait_time:              ['wait time', 'waiting time', 'attente', "temps d'attente", 'temps attente', 'délai', 'delai', 'queue'],
  communication:          ['communication', 'responsiveness', 'réactivité', 'reactivite', 'contact'],
  after_sales:            ['after-sales service', 'after sales service', 'after-sales', 'after sales', 'sav', 'service après vente', 'service apres vente', 'après vente', 'apres vente', 'follow-up'],
  trust:                  ['trust', 'confiance', 'reliability', 'fiabilité', 'fiabilite', 'honesty', 'honnêteté', 'honnetete'],

  // ── Restaurant — price variants (specific before generic price) ───────────
  service_price:          ['service price', 'service cost', 'service charge', 'prix du service', 'coût du service', 'cout du service'],
  food_price:             ['food price', 'food cost', 'prix des plats', 'prix de la nourriture', 'coût des plats', 'cout des plats'],
  drink_price:            ['drink price', 'drinks price', 'prix des boissons', 'prix des drinks'],

  // ── Restaurant — food variants (specific before generic food_quality) ─────
  food_presentation:      ['food presentation', 'dish presentation', 'plating', 'dressage', 'présentation des plats', 'presentation des plats', 'présentation plat'],
  food_temperature:       ['food temperature', 'cold dish', 'cold food', 'cold dishes', 'plat froid', 'plats froids', 'nourriture froide', 'température des plats', 'temperature des plats'],
  food_quality:           ['food quality', 'cuisine quality', 'dish quality', 'qualité des plats', 'qualite des plats', 'qualité cuisine', 'qualite cuisine', 'taste', 'flavor', 'flavour', 'goût', 'gout', 'food', 'dish', 'dishes', 'meal', 'cuisine', 'plats'],
  food_variety:           ['food variety', 'menu variety', 'menu choice', 'variété des plats', 'variete des plats', 'choix des plats'],

  // ── Restaurant — service variants (specific before generic service) ────────
  service_speed:          ['service speed', 'slow service', 'fast service', 'speed of service', 'vitesse du service', 'rapidité du service', 'rapidite du service', 'service lent', 'service rapide'],
  service_quality:        ['service quality', 'quality of service', 'qualité du service', 'qualite du service'],
  service_attitude:       ['service attitude', 'rude staff', 'unfriendly staff', 'rude waiter', 'impoli', 'attitude du personnel', 'comportement personnel', 'unfriendly'],
  service:                ['service', 'staff', 'server', 'waiter', 'personnel', 'équipe', 'equipe', 'team', 'serveur', 'serveuse'],

  // ── Restaurant — other ────────────────────────────────────────────────────
  noise_level:            ['noise level', 'noise', 'noisy', 'loud', 'bruit', 'bruyant', 'niveau sonore'],
  ambiance:               ['ambiance', 'atmosphere', 'décor', 'decor', 'vibe', 'setting', 'environment', 'cadre'],
  portions:               ['portions', 'portion size', 'quantity', 'quantité', 'quantite'],
  menu_variety:           ['menu variety', 'menu', 'choice', 'options', 'variety', 'variété', 'variete', 'selection', 'carte'],
  reservation:            ['reservation', 'booking', 'réservation', 'table booking'],

  // ── Salon coiffure — specific before generic ──────────────────────────────
  hair_color_result:      ['color result', 'colour result', 'résultat couleur', 'resultat couleur', 'résultat coloration', 'resultat coloration', 'color outcome'],
  hair_cut_result:        ['haircut result', 'cut result', 'résultat coupe', 'resultat coupe', 'résultat de coupe'],
  hair_quality:           ['hair quality', 'hair condition', 'qualité des cheveux', 'qualite des cheveux', 'état des cheveux', 'etat des cheveux', 'hair result', 'résultat coiffure', 'resultat coiffure', 'hairstyle', 'haircut', 'coupe', 'cut'],
  colorist:               ['coloring service', 'colouring service', 'color service', 'coloration service', 'highlights', 'balayage', 'teinture', 'coloring', 'colouring', 'coloration', 'couleur'],
  stylist_skill:          ['stylist skill', 'hairdresser skill', 'stylist expertise', 'technique coiffeur', 'expertise coiffeur', 'savoir-faire coiffeur', 'stylist', 'hairdresser', 'coiffeur', 'coiffeuse', 'skill', 'expertise', 'technique', 'savoir-faire'],
  appointment:            ['appointment availability', 'prise de rendez-vous', 'appointment', 'availability', 'disponibilité', 'disponibilite', 'rendez-vous', 'rdv', 'schedule', 'booking'],

  // ── Salle de sport — specific before generic ──────────────────────────────
  equipment_quality:      ['equipment quality', 'machine quality', 'qualité des équipements', 'qualite des equipements', 'qualité des machines', 'qualite des machines', 'état des machines', 'etat des machines'],
  equipment_variety:      ['equipment variety', 'machine variety', 'variété des équipements', 'variete des equipements', 'choix des machines'],
  equipment:              ['equipment', 'machines', 'gear', 'matériel', 'materiel', 'appareil', 'appareils', 'équipements', 'equipements'],
  coaching_quality:       ['coaching quality', 'trainer quality', 'qualité du coaching', 'qualite du coaching', 'qualité des coachs', 'qualite des coachs'],
  coaching:               ['coaching', 'coach', 'trainer', 'personal trainer', 'instructor', 'entraîneur', 'entraineur', 'cours', 'classes'],
  facilities:             ['facilities', 'locker room', 'showers', 'vestiaires', 'douches', 'changing room', 'sanitaires'],
  crowd:                  ['crowd', 'crowded', 'busy', 'affluence', 'monde', 'fréquentation', 'frequentation', 'surpeuplé', 'surpeuple'],

  // ── Institut beauté — specific before generic ─────────────────────────────
  treatment_result:       ['treatment result', 'résultat soin', 'resultat soin', 'résultat du soin', 'resultat du soin', 'résultat traitement', 'resultat traitement'],
  treatment_quality:      ['treatment quality', 'qualité du soin', 'qualite du soin', 'qualité des soins', 'qualite des soins', 'qualité traitement', 'treatment', 'soin', 'soins', 'facial', 'massage'],
  waxing:                 ['waxing', 'epilation', 'épilation', 'hair removal', 'cire'],
  nail_service:           ['nail service', 'nail art', 'manicure', 'pedicure', 'manucure', 'pédicure', 'pedicure', 'nails', 'nail', 'ongles'],

  // ── Serrurier ─────────────────────────────────────────────────────────────
  response_time:          ['response time', 'intervention time', 'délai intervention', 'delai intervention', 'rapidité intervention', 'rapidite intervention', 'emergency response', 'urgence'],
  pricing_clarity:        ['pricing clarity', 'transparent pricing', 'prix transparents', 'transparence prix', 'devis', 'quote', 'invoice', 'facture'],
  professionalism:        ['professionalism', 'professional', 'professionnalisme', 'sérieux', 'serieux', 'seriousness'],

  // ── Retail chaussures ─────────────────────────────────────────────────────
  product_variety:        ['product variety', 'product selection', 'stock variety', 'stock', 'choix', 'collection', 'range', 'assortiment'],
  fit_comfort:            ['fit and comfort', 'fit comfort', 'comfort fit', 'fit', 'comfort', 'confort', 'taille', 'fitting', 'pointure'],
  staff_knowledge:        ['staff knowledge', 'advice quality', 'knowledgeable staff', 'conseil', 'conseils', 'expertise vendeur'],
};

// ─── REVERSE LOOKUP MAP ───────────────────────────────────────────────────────
// Built once at module load. Maps every variant → canonical key.

const THEME_TO_KEY: Map<string, string> = new Map();
for (const [key, variants] of Object.entries(CANONICAL_THEME_KEYS)) {
  for (const variant of variants) {
    THEME_TO_KEY.set(variant.toLowerCase().trim(), key);
  }
}

/**
 * Resolves any AI-generated theme string to a stable canonical key.
 *
 * Resolution order:
 *   1. Exact match against THEME_TO_KEY
 *   2. Partial match — sorted by variant length DESC so the most specific
 *      variant always wins over a shorter generic one.
 *   3. slugify() fallback — logs a warning for dictionary growth.
 */
function resolveThemeKey(theme: string): string {
  const normalized = theme.toLowerCase().trim();

  // 1. Exact match
  const exact = THEME_TO_KEY.get(normalized);
  if (exact) return exact;

  // 2. Partial match — collect ALL matches, pick longest variant
  const partialMatches: Array<{ key: string; variantLength: number }> = [];
  for (const [variant, key] of THEME_TO_KEY.entries()) {
    if (normalized.includes(variant) || variant.includes(normalized)) {
      partialMatches.push({ key, variantLength: variant.length });
    }
  }

  if (partialMatches.length > 0) {
    // Longest variant = most specific match wins
    partialMatches.sort((a, b) => b.variantLength - a.variantLength);
    return partialMatches[0].key;
  }

  // 3. Fallback: slugify
  const fallback = slugify(theme);
  console.warn(
    `[resolveThemeKey] No canonical key for theme "${theme}" → fallback slug: "${fallback}". ` +
    `Add to CANONICAL_THEME_KEYS to pin this permanently.`
  );
  return fallback;
}

// ─── SENTIMENT NORMALIZATION ─────────────────────────────────────────────────
const SENTIMENT_NORMALIZE: Record<string, 'positive' | 'mixed' | 'negative'> = {
  positive:   'positive',
  mixed:      'mixed',
  negative:   'negative',
  positif:    'positive',
  positifve:  'positive',
  mixte:      'mixed',
  négatif:    'negative',
  negatif:    'negative',
  positivo:   'positive',
  negativo:   'negative',
  mixto:      'mixed',
};

function normalizeSentiment(raw: unknown): 'positive' | 'mixed' | 'negative' {
  const s = String(raw ?? '').toLowerCase().trim();
  const result = SENTIMENT_NORMALIZE[s];
  if (!result) {
    console.warn(`[normalizeSentiment] Unrecognized sentiment value "${raw}" — defaulting to "mixed".`);
  }
  return result ?? 'mixed';
}

/**
 * Enforces stable keys and normalized sentiment on all bilingual arrays.
 * - Keys resolved from CANONICAL_THEME_KEYS (AI key field ignored)
 * - FR keys always mirrored from EN by index
 * - sentiment normalized to English on ALL items in both EN and FR
 */
function enforceKeys(bilingual: { en: any[]; fr: any[] }): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(bilingual?.en) ? bilingual.en : [];
  const frItems = Array.isArray(bilingual?.fr) ? bilingual.fr : [];

  const keyedEn = enItems.map((item) => ({
    ...item,
    key: resolveThemeKey(item.theme ?? ''),
    ...(item.sentiment !== undefined && { sentiment: normalizeSentiment(item.sentiment) }),
  }));

  const keyedFr = frItems.map((item, i) => ({
    ...item,
    key: keyedEn[i]?.key ?? resolveThemeKey(item.theme ?? ''),
    ...(item.sentiment !== undefined && { sentiment: normalizeSentiment(item.sentiment) }),
  }));

  return { en: keyedEn, fr: keyedFr };
}

// ─── LOCKED KEYS BUILDER ─────────────────────────────────────────────────────
/**
 * Builds a theme→key map from previously saved review_insights data.
 * Covers top_issues, top_praises, themes_universal, themes_industry.
 * This map is passed to analyzePassA and injected into the prompt as
 * frozen constraints — the AI cannot change keys that already exist.
 */
function buildLockedKeys(existingInsight: any): Record<string, string> {
  const locked: Record<string, string> = {};

  const sources = [
    existingInsight?.top_issues?.en,
    existingInsight?.top_praises?.en,
    existingInsight?.themes_universal?.en,
    existingInsight?.themes_industry?.en,
  ];

  for (const arr of sources) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item?.key) continue;

      // Index by theme display name (original behavior)
      if (item.theme) {
        locked[item.theme.toLowerCase().trim()] = item.key;
      }
      locked[item.key.toLowerCase().trim()] = item.key;
      const variants = CANONICAL_THEME_KEYS[item.key];
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          locked[variant.toLowerCase().trim()] = item.key;
        }
      }
    }
  }

  return locked;
}

function getUniversalThemes(): { en: string[]; fr: string[] } {
  return {
    en: ['Cleanliness', 'Price', 'Wait Time', 'Communication', 'After-sales Service', 'Trust'],
    fr: ['Propreté', 'Prix', 'Attente', 'Communication', 'SAV', 'Confiance'],
  };
}

function getFallbackSummaryOneLiner(establishmentName: string, reviewCount: number): { en: string; fr: string } {
  return {
    en: `Analysis of ${reviewCount} reviews for ${establishmentName}`,
    fr: `Analyse de ${reviewCount} avis pour ${establishmentName}`,
  };
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
    body: JSON.stringify({ to: [input.userEmail], subject, html }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`send-email failed: ${response.status} ${errorText}`);
  }
}

function detectBusinessType(
  name: string,
  googlePlacesTypes?: string[] | null,
  reviewsTexts?: string[]
): { type: BusinessType; confidence: number; candidates: Array<{type: BusinessType; confidence: number}>; source: 'places' | 'keywords' | 'manual' } {
  const combinedText = `${name} ${(reviewsTexts || []).join(' ')}`.toLowerCase();

  const placesMapping: Record<string, BusinessType> = {
    'restaurant': 'restaurant', 'food': 'restaurant', 'cafe': 'restaurant',
    'hair_care': 'salon_coiffure', 'beauty_salon': 'salon_coiffure',
    'gym': 'salle_sport', 'health': 'salle_sport',
    'locksmith': 'serrurier',
    'shoe_store': 'retail_chaussures',
    'spa': 'institut_beaute'
  };

  const keywords: Record<BusinessType, string[]> = {
    restaurant: ['restaurant', 'diner', 'bistro', 'brasserie', 'cafe', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'eat', 'meal', 'dish'],
    salon_coiffure: ['hairdresser', 'hair stylist', 'salon', 'barber', 'hair', 'coloring', 'cut', 'hairstyle'],
    salle_sport: ['gym', 'fitness', 'sport', 'bodybuilding', 'crossfit', 'yoga', 'coach'],
    serrurier: ['locksmith', 'locksmith service', 'repair', 'key', 'lock', 'emergency'],
    retail_chaussures: ['shoe', 'shoes', 'sneaker', 'sneakers', 'store', 'shop'],
    institut_beaute: ['beauty institute', 'beauty', 'esthetic', 'care', 'massage', 'hair removal'],
    autre: []
  };

  if (googlePlacesTypes && googlePlacesTypes.length > 0) {
    for (const placeType of googlePlacesTypes) {
      const normalized = placeType.toLowerCase().replace(/\s+/g, '_');
      const mapped = placesMapping[normalized];
      if (mapped) {
        return { type: mapped, confidence: 90, candidates: [{ type: mapped, confidence: 90 }], source: 'places' };
      }
    }
  }

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

function computeStats(rows: ReviewRow[]) {
  const ratings = rows.map(r => r.rating ?? 0).filter(n => n > 0);
  const total = rows.length;
  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : null;
  const pos = rows.filter(r => (r.rating ?? 0) >= 4).length;
  const neg = rows.filter(r => (r.rating ?? 0) <= 2).length;
  const positive_pct = total ? Math.round((pos / total) * 100) : 0;
  const negative_pct = total ? Math.round((neg / total) * 100) : 0;
  const by_rating: Record<string, number> = {};
  for (let i = 1; i <= 5; i++) by_rating[i] = rows.filter(r => (r.rating ?? 0) === i).length;
  return { total, by_rating, positive_pct, negative_pct, overall: avg };
}

// ─── LANGUAGE INSTRUCTION ────────────────────────────────────────────────────
function getLanguageInstruction(): string {
  return `
Generate BOTH English and French content.

IMPORTANT RULES:
- DO NOT create root keys named "en" or "fr"
- Keep all JSON field names exactly as provided
- Each field must internally contain { "en": ..., "fr": ... }
- The key in top_issues.fr[N] MUST be identical to top_issues.en[N].key
- The key in top_strength.fr[N] MUST be identical to top_strength.en[N].key
- Keys are NEVER translated — they are always English snake_case
- sentiment values MUST always be in English: "positive", "mixed", or "negative"
  DO NOT translate sentiment to French — "positif", "mixte", "négatif" are WRONG

- Translate ONLY generated analysis content (theme names, descriptions, what_it_means, etc.)
- Keep evidence_quotes in original review language
- sentiment, importance, and count values should remain equivalent across EN and FR
`;
}

// ─── PASS A ─────────────────────────────────────────────────────────────────
async function analyzePassA(
  placeName: string,
  samples: string[],
  totalReviews: number,
  businessType: BusinessType,
  businessTypeConfidence: number,
  lockedKeys: Record<string, string> = {},  // ← frozen keys from previous run
) {
  if (!OPENAI_KEY) return null;

  const universalThemes = getUniversalThemes();
  const languageInstruction = getLanguageInstruction();
  const industryThemesHint = businessTypeConfidence >= 45
    ? `\nAlso extract 3–6 themes specific to the ${businessType} industry — these are REQUIRED when confidence >= 45%.`
    : '\nFocus only on universal themes and do not invent industry-specific themes.';

  // ─── Build locked keys instruction ────────────────────────────────────────
  // If this place_id has been analyzed before, the existing theme→key pairs
  // are injected here as hard constraints. The AI MUST reuse these exact keys
  // for the same themes — it cannot rename, reslug, or change them.
  const lockedKeysInstruction = Object.keys(lockedKeys).length > 0
    ? `
  LOCKED THEME KEYS — FROZEN, do NOT change under any circumstances:
  ${Object.entries(lockedKeys)
      // Deduplicate: only show theme display names, skip key→key entries
      .filter(([variant, key]) => variant !== key)
      .map(([theme, key]) => `- theme "${theme}" → key MUST be "${key}"`)
      .join("\n")}
  `
    : '';

  const prompt = [
    {
      role: "system",
      content: `You are an expert analyst who synthesizes customer reviews.
You must extract themes ONLY from the actual content of the reviews.
Respond strictly with valid JSON.
${languageInstruction}`,
    },
    {
      role: "user",
      content:
`Business: ${placeName}
Detected type: ${businessType} (confidence: ${businessTypeConfidence}%)
Total reviews analyzed: ${totalReviews}

Customer reviews:
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

${lockedKeysInstruction}

COUNTING RULE — MANDATORY:
You are shown exactly ${samples.length} reviews above, numbered 1 to ${samples.length}.
For each theme, go through the reviews one by one and count how many explicitly mention it.
"count" = the number of reviews that directly OR indirectly relate to this theme.
Include reviews where the theme is implied, not just explicitly stated.
Minimum count for inclusion: 2 reviews
This is not an estimate. Count directly from the list above.
Minimum count for inclusion: 2 reviews.

INSTRUCTIONS:
1. Extract ALL relevant UNIVERSAL themes found in the reviews:
   EN: ${universalThemes.en.join(', ')}
   FR: ${universalThemes.fr.join(', ')}
   Only include a theme if at least 2 reviews mention it.

2. ${industryThemesHint}

3. For each theme, determine the sentiment (positive/mixed/negative) and importance (0–100)

4. Include 1–2 short quotes as evidence (in the original review language)

5. ${languageInstruction}
6. Do strictly follow the counting rules 

IMPORTANT:
- Every theme MUST contain a stable "key"
- The key MUST ALWAYS be in English snake_case
- The SAME key MUST be used in both English and French versions
- If the theme appears in the LOCKED THEME KEYS above, use the locked key — no exceptions
- Example:
  EN -> { "key": "wait_time", "theme": "Wait Time" }
  FR -> { "key": "wait_time", "theme": "Temps d'attente" }
- sentiment MUST always be one of: "positive", "mixed", "negative" — NEVER translate

ROOT CAUSE ANALYSIS (TOP ISSUES ONLY)

For every issue returned in top_issues, perform an evidence-based root cause analysis using the Ishikawa (5M) framework.

Allowed category_key values: workforce | methods | equipment | materials | environment

Category selection rules:
- workforce → staffing levels, responsiveness, professionalism, training, attitude
- methods → workflow problems, scheduling, coordination failures, operational bottlenecks
- equipment → broken equipment, slow systems, malfunctioning tools, technical failures
- materials → products, ingredients, food quality, freshness, stock availability
- environment → cleanliness, noise, layout, temperature, atmosphere, seating, parking

STRICT RULES:
- NEVER include a category without supporting review evidence
- NEVER generate more than 3 categories
- NEVER generate empty categories
- A category with weak or missing evidence MUST be omitted
- Generate 1 card if only one category is strongly supported
- Generate 2 cards if two are strongly supported
- Generate 3 cards only if three are strongly supported
- Cards ranked: dominant → secondary → monitor

Each root cause card must contain: label, importance, category, category_key, causes (2–3), evidence (1–3 real quotes)

QUANTITY REQUIREMENTS:
- top_issues: 3–5 items, sorted by count descending
- top_strength: 3–5 items, sorted by count descending
- themes_universal: all universal themes found (typically 4–7)
- themes_industry: 3–6 industry-specific themes (REQUIRED if confidence >= 45%)

Return EXACTLY this JSON shape:
{
  "top_issues": {
    "en": [
      {
        "key": "<stable_slug_in_english_snake_case>",
        "theme": "<theme>",
        "count": <number>,
        "impact": "<dominant|high|medium>",
        "ai_synthesis": "<summary of the issue and likely causes>",
        "root_causes": [
          {
            "label": "Dominant Cause",
            "importance": "dominant",
            "category": "<display category>",
            "category_key": "<workforce|methods|equipment|materials|environment>",
            "causes": ["<specific cause>", "<specific cause>"],
            "evidence": ["<review quote>", "<review quote>"]
          }
        ]
      }
    ],
    "fr": [
      {
        "key": "<same key as EN — MUST match exactly>",
        "theme": "<translated theme>",
        "count": <number>,
        "impact": "<dominant|high|medium>",
        "ai_synthesis": "<translated synthesis>",
        "root_causes": [
          {
            "label": "Dominant Cause",
            "importance": "dominant",
            "category": "<display category>",
            "category_key": "<workforce|methods|equipment|materials|environment>",
            "causes": ["<specific cause>", "<specific cause>"],
            "evidence": ["<review quote>", "<review quote>"]
          }
        ]
      }
    ]
  },
  "top_strength": {
    "en": [{ "key": "<slug>", "theme": "<theme>", "count": <number> }],
    "fr": [{ "key": "<same key as EN>", "theme": "<theme>", "count": <number> }]
  },
  "themes_universal": {
    "en": [{ "theme": "<name>", "sentiment": "<positive|mixed|negative>", "importance": <0-100>, "evidence_quotes": ["<quote>"], "what_it_means": "<explanation>", "count": <number> }],
    "fr": [{ "theme": "<nom>", "sentiment": "<positive|mixed|negative>", "importance": <0-100>, "evidence_quotes": ["<citation>"], "what_it_means": "<explication>", "count": <number> }]
  },
  "themes_industry": {
    "en": [{ "theme": "<name>", "sentiment": "<positive|mixed|negative>", "importance": <0-100>, "evidence_quotes": ["<quote>"], "what_it_means": "<explanation>", "count": <number> }],
    "fr": [{ "theme": "<nom>", "sentiment": "<positive|mixed|negative>", "importance": <0-100>, "evidence_quotes": ["<citation>"], "what_it_means": "<explication>", "count": <number> }]
  },
  "summary": {
    "en": {
      "one_liner": "One-sentence summary",
      "what_customers_love": [
        { "theme": "<exact theme from top_strength.en[N].theme>", "reason": "<why from what_it_means>", "count": <from top_strength.en[N].count> }
      ],
      "what_customers_hate": [
        { "theme": "<exact theme from top_issues.en[N].theme>", "reason": "<why from what_it_means>", "count": <from top_issues.en[N].count> }
      ]
    },
    "fr": {
      "one_liner": "Résumé en une phrase",
      "what_customers_love": [
        { "theme": "<thème exact de top_strength.fr[N].theme>", "reason": "<pourquoi>", "count": <count> }
      ],
      "what_customers_hate": [
        { "theme": "<thème exact de top_issues.fr[N].theme>", "reason": "<pourquoi>", "count": <count> }
      ]
    }
  }
}`,
    },
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: prompt,
    }),
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

// ─── PASS B ─────────────────────────────────────────────────────────────────
async function analyzePassB(
  placeName: string,
  businessType: BusinessType,
  businessTypeConfidence: number,
  themesUniversal: { en: any[]; fr: any[] },
  themesIndustry: { en: any[]; fr: any[] },
  topIssues: { en: any[]; fr: any[] },
  avgRating: number | null,
) {
  if (!OPENAI_KEY) return null;

  const languageInstruction = getLanguageInstruction();

  const prompt = [
    {
      role: "system",
      content: `You are an expert consultant in customer experience improvement.
Generate actionable recommendations and response templates tailored to the business sector.
Respond ONLY with valid JSON — no markdown, no preamble.
${languageInstruction}`,
    },
    {
      role: "user",
      content:
`Business: ${placeName}
Type: ${businessType} (confidence: ${businessTypeConfidence}%)
Average rating: ${avgRating?.toFixed(1) || 'N/A'}

Universal themes (EN): ${(themesUniversal?.en || []).map((t: any) => t.theme).join(', ') || 'None'}
Universal themes (FR): ${(themesUniversal?.fr || []).map((t: any) => t.theme).join(', ') || 'Aucun'}

Industry themes (EN): ${(themesIndustry?.en || []).map((t: any) => t.theme).join(', ') || 'None'}
Industry themes (FR): ${(themesIndustry?.fr || []).map((t: any) => t.theme).join(', ') || 'Aucun'}

Priority issues (EN): ${(topIssues?.en || []).map((t: any) => t.theme).join(', ') || 'None'}
Priority issues (FR): ${(topIssues?.fr || []).map((t: any) => t.theme).join(', ') || 'Aucun'}

Generate:
1. Prioritized pain points (impact 0–100, ease 0–100, concrete first_step)
2. Quick wins (7 days) – fast actions with expected results
3. Projects (30 days) – more structured initiatives
4. Reply templates (positive/neutral/negative) adapted to the ${businessType} sector
5. ${languageInstruction}

Return EXACTLY this JSON shape:
{
  "pain_points_prioritized": {
    "en": [{ "issue": "Problem name", "why_it_matters": "Why it matters", "impact": 80, "ease": 60, "first_step": "First concrete action" }],
    "fr": [{ "issue": "Nom du problème", "why_it_matters": "Pourquoi cela compte", "impact": 80, "ease": 60, "first_step": "Première action concrète" }]
  },
  "recommendations": {
    "en": {
      "quick_wins_7_days": [{ "title": "Action title", "details": "Details", "expected_result": "Expected result", "priority": 1 }],
      "projects_30_days":  [{ "title": "Project title", "details": "Details", "expected_result": "Expected result", "priority": 1 }]
    },
    "fr": {
      "quick_wins_7_days": [{ "title": "Titre action", "details": "Détails", "expected_result": "Résultat attendu", "priority": 1 }],
      "projects_30_days":  [{ "title": "Titre projet", "details": "Détails", "expected_result": "Résultat attendu", "priority": 1 }]
    }
  },
  "reply_templates": {
    "en": {
      "positive": [{ "title": "Template title", "reply": "Response text", "use_when": "When to use" }],
      "neutral":  [{ "title": "Template title", "reply": "Response text", "use_when": "When to use" }],
      "negative": [{ "title": "Template title", "reply": "Response text", "use_when": "When to use" }]
    },
    "fr": {
      "positive": [{ "title": "Titre template", "reply": "Texte de réponse", "use_when": "Quand utiliser" }],
      "neutral":  [{ "title": "Titre template", "reply": "Texte de réponse", "use_when": "Quand utiliser" }],
      "negative": [{ "title": "Titre template", "reply": "Texte de réponse", "use_when": "Quand utiliser" }]
    }
  }
}`,
    },
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: prompt,
    }),
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

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
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

    const { place_id, name, dryRun = false, language } = await req.json().catch(() => ({}));
    if (!place_id) return json({ ok: false, error: "missing_place_id" }, 400);

    const outputLanguage = normalizeLanguage(language);

    let establishmentName = name || 'Établissement';
    let googlePlacesTypes: string[] | null = null;

    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments')
        .select('name, types')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (establishment?.name) establishmentName = establishment.name;
      if (establishment?.types) {
        googlePlacesTypes = Array.isArray(establishment.types)
          ? establishment.types
          : [establishment.types];
      }
    } catch (err) {
      console.warn('[analyze-reviews-v2] Erreur récupération établissement:', err);
    }

    const { data: reviewsData, error: reviewsErr } = await supabaseAdmin
      .from('reviews')
      .select('text, rating')
      .eq('place_id', place_id)
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .limit(300);

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

    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean);

    const detection = detectBusinessType(establishmentName, googlePlacesTypes, sampleTexts);
    console.log(`[analyze-reviews-v2] Détection: ${detection.type} (${detection.confidence}%) via ${detection.source}`);

    // ─── Fetch existing insight to build locked keys ──────────────────────
    // This runs BEFORE analyzePassA so existing theme→key pairs can be
    // injected into the prompt as frozen constraints.
    // On first run: returns null → lockedKeys is empty → no constraints.
    // On re-runs: returns saved data → keys are locked → no drift.
    const { data: existingInsight } = await supabaseAdmin
      .from('review_insights')
      .select('top_issues, top_praises, themes_universal, themes_industry')
      .eq('place_id', place_id)
      .eq('user_id', userId)
      .maybeSingle();

    const lockedKeys = buildLockedKeys(existingInsight);
    const lockedKeyCount = Object.keys(lockedKeys).length;
    console.log(`[analyze-reviews-v2] Locked keys: ${lockedKeyCount} theme(s) frozen from previous run`);

    // ─── Pass A ───────────────────────────────────────────────────────────
    const passAResult = await analyzePassA(
      establishmentName,
      sampleTexts,
      rows.length,
      detection.type,
      detection.confidence,
      lockedKeys,              // ← injected here
    );

    if (!passAResult) {
      return json({ ok: false, error: "analysis_pass_a_failed" }, 500);
    }
    console.log("pass a result" ,passAResult)
    // ─── Enforce stable keys + normalize sentiment ────────────────────────
    if (passAResult.top_issues)      passAResult.top_issues      = enforceKeys(passAResult.top_issues);
    if (passAResult.top_strength)    passAResult.top_strength    = enforceKeys(passAResult.top_strength);
    if (passAResult.themes_universal) passAResult.themes_universal = enforceKeys(passAResult.themes_universal);
    if (passAResult.themes_industry)  passAResult.themes_industry  = enforceKeys(passAResult.themes_industry);

    // ─── Pass B ───────────────────────────────────────────────────────────
    const passBResult = await analyzePassB(
      establishmentName,
      detection.type,
      detection.confidence,
      { en: passAResult?.themes_universal?.en || [], fr: passAResult?.themes_universal?.fr || [] },
      { en: passAResult?.themes_industry?.en  || [], fr: passAResult?.themes_industry?.fr  || [] },
      { en: passAResult?.top_issues?.en       || [], fr: passAResult?.top_issues?.fr       || [] },
      stats.overall,
    );

    if (!passBResult) {
      return json({ ok: false, error: "analysis_pass_b_failed" }, 500);
    }

    // ─── Summary ──────────────────────────────────────────────────────────
    const fallbackOneLiner = getFallbackSummaryOneLiner(establishmentName, rows.length);
    const summaryData = {
      en: {
        one_liner:           passAResult?.summary?.en?.one_liner           || fallbackOneLiner.en,
        what_customers_love: passAResult?.summary?.en?.what_customers_love || [],
        what_customers_hate: passAResult?.summary?.en?.what_customers_hate || [],
      },
      fr: {
        one_liner:           passAResult?.summary?.fr?.one_liner           || fallbackOneLiner.fr,
        what_customers_love: passAResult?.summary?.fr?.what_customers_love || [],
        what_customers_hate: passAResult?.summary?.fr?.what_customers_hate || [],
      },
    };

    // ─── Final analysis object ────────────────────────────────────────────
    const analysisResult = {
      business_type:            detection.type,
      business_type_confidence: detection.confidence,
      business_type_candidates: detection.candidates,

      top_praises: passAResult?.top_strength || { en: [], fr: [] },
      top_issues:  passAResult?.top_issues   || { en: [], fr: [] },

      summary: summaryData,

      themes_universal: passAResult?.themes_universal || { en: [], fr: [] },
      themes_industry:  detection.confidence >= 45
        ? (passAResult?.themes_industry || { en: [], fr: [] })
        : { en: [], fr: [] },

      pain_points_prioritized: passBResult?.pain_points_prioritized || { en: [], fr: [] },

      recommendations: passBResult?.recommendations || {
        en: { quick_wins_7_days: [], projects_30_days: [] },
        fr: { quick_wins_7_days: [], projects_30_days: [] },
      },

      reply_templates: passBResult?.reply_templates || {
        en: { positive: [], neutral: [], negative: [] },
        fr: { positive: [], neutral: [], negative: [] },
      },

      kpis: {
        avg_rating:              stats.overall,
        total_reviews:           stats.total,
        positive_ratio_estimate: stats.positive_pct,
        negative_ratio_estimate: stats.negative_pct,
      },
    };

    // ─── Notification logic ───────────────────────────────────────────────
    // Re-use the already-fetched existingInsight (no extra DB call needed)
    const previousAvgRating = dryRun ? null : (existingInsight as any)?.avg_rating ?? null;
    const previousIssues = normalizeIssues(
      (existingInsight as any)?.top_issues?.en || (existingInsight as any)?.top_issues || []
    );
    const currentIssues = normalizeIssues(passAResult?.top_issues?.en || []);

    // Fetch avg_rating separately if needed (existingInsight select above didn't include it)
    let prevAvgForNotif = previousAvgRating;
    if (!dryRun && existingInsight) {
      const { data: ratingRow } = await supabaseAdmin
        .from('review_insights')
        .select('avg_rating')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .maybeSingle();
      prevAvgForNotif = ratingRow?.avg_rating ?? null;
    }

    const notificationDecision = shouldSendSignificantChangeNotification(
      prevAvgForNotif,
      stats.overall,
      previousIssues,
      currentIssues,
    );

    // ─── Persist ──────────────────────────────────────────────────────────
    if (!dryRun) {
      const payload = {
        place_id,
        user_id:          userId,
        last_analyzed_at: new Date().toISOString(),
        updated_at:       new Date().toISOString(),
        business_type:            detection.type,
        business_type_confidence: detection.confidence,
        business_type_candidates: detection.candidates,
        analysis_version: 'v2-auto-universal',
        total_count:      stats.total,
        avg_rating:       stats.overall,
        positive_ratio:   stats.positive_pct / 100,

        // Flat legacy themes array (retro-compat — uses EN branch)
        themes: [
          ...(passAResult?.themes_universal?.en || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
          ...(passAResult?.themes_industry?.en  || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
        ],

        top_praises:      passAResult?.top_strength || { en: [], fr: [] },
        top_issues:       passAResult?.top_issues   || { en: [], fr: [] },

        summary:          summaryData,

        themes_universal: passAResult?.themes_universal || { en: [], fr: [] },
        themes_industry:  detection.confidence >= 45
          ? (passAResult?.themes_industry || { en: [], fr: [] })
          : { en: [], fr: [] },

        pain_points_prioritized: passBResult?.pain_points_prioritized || { en: [], fr: [] },

        recommendations_quick_wins: {
          en: passBResult?.recommendations?.en?.quick_wins_7_days || [],
          fr: passBResult?.recommendations?.fr?.quick_wins_7_days || [],
        },
        recommendations_projects: {
          en: passBResult?.recommendations?.en?.projects_30_days || [],
          fr: passBResult?.recommendations?.fr?.projects_30_days || [],
        },

        reply_templates: passBResult?.reply_templates || {
          en: { positive: [], neutral: [], negative: [] },
          fr: { positive: [], neutral: [], negative: [] },
        },

        summary_one_liner: {
          en: summaryData.en.one_liner,
          fr: summaryData.fr.one_liner,
        },
        summary_what_customers_love: {
          en: summaryData.en.what_customers_love,
          fr: summaryData.fr.what_customers_love,
        },
        summary_what_customers_hate: {
          en: summaryData.en.what_customers_hate,
          fr: summaryData.fr.what_customers_hate,
        },
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

      if (
        importantUpdatesEnabled &&
        notificationDecision.send &&
        notificationDecision.reason &&
        userEmail
      ) {
        try {
          const reportLocale = outputLanguage === "fr" ? "fr-FR" : "en-US";
          const reportMonthName = new Intl.DateTimeFormat(reportLocale, {
            month: "long", year: "numeric",
          }).format(new Date());

          await sendSignificantChangeNotification({
            language:          outputLanguage,
            displayName,
            userEmail,
            establishmentName,
            reportMonthName,
            previousAvg:  prevAvgForNotif,
            currentAvg:   stats.overall,
            ratingDrop:   (prevAvgForNotif ?? 0) - (stats.overall ?? 0),
            issues:       currentIssues,
            reason:       notificationDecision.reason,
          });
          console.log('[analyze-reviews-v2] Significant change notification sent', {
            reason: notificationDecision.reason, userId, place_id,
          });
        } catch (notificationError) {
          console.error('[analyze-reviews-v2] Failed to send notification:', notificationError);
        }
      } else if (!importantUpdatesEnabled) {
        console.log('[analyze-reviews-v2] Important updates notifications disabled for user', { userId, place_id });
      }

      await supabaseAdmin
        .from('establishments')
        .update({
          business_type:            detection.type,
          business_type_confidence: detection.confidence,
          business_type_candidates: detection.candidates,
          business_type_source:     detection.source,
          analysis_version:         'v2-auto-universal',
        })
        .eq('place_id', place_id)
        .eq('user_id', userId);
    }

    return json({
      ok: true,
      analysis_language: outputLanguage,
      analysis: analysisResult,
      counts: { collected: rows.length },
      dryRun,
    });

  } catch (e) {
    console.error('[analyze-reviews-v2] Error:', e);
    return json({ ok: false, error: String((e as any)?.message ?? e) }, 500);
  }
});