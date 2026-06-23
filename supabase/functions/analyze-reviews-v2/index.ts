import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

// ─── ISHIKAWA ────────────────────────────────────────────────────────────────

const ISHIKAWA_CATEGORY_KEYS = ['manpower', 'method', 'machine', 'material', 'environment'] as const;
type IshikawaCategoryKey = typeof ISHIKAWA_CATEGORY_KEYS[number];

const ISHIKAWA_NORMALIZE: Record<string, IshikawaCategoryKey> = {
  manpower: 'manpower', method: 'method', machine: 'machine', material: 'material', environment: 'environment',
  people: 'manpower', human: 'manpower', staff: 'manpower', workforce: 'manpower', personnel: 'manpower',
  process: 'method', procedure: 'method', workflow: 'method', system: 'method',
  equipment: 'machine', machinery: 'machine', tools: 'machine', technology: 'machine',
  materials: 'material', supplies: 'material', ingredients: 'material', inputs: 'material', resources: 'material',
  surroundings: 'environment', space: 'environment', location: 'environment', place: 'environment',
  facility: 'environment', facilities: 'environment', setting: 'environment',
  humain: 'manpower', humains: 'manpower', main_oeuvre: 'manpower',
  méthode: 'method', methode: 'method', machines: 'machine',
  matériau: 'material', materiau: 'material', matériaux: 'material', materiaux: 'material',
  matière: 'material', matiere: 'material',
  milieu: 'environment', environnement: 'environment',
};

function normalizeIshikawaKey(raw: unknown): IshikawaCategoryKey | null {
  const s = String(raw ?? '').toLowerCase().trim().replace(/[\s-]/g, '_');
  const result = ISHIKAWA_NORMALIZE[s] ?? ISHIKAWA_NORMALIZE[s.replace(/_/g, '')] ?? null;
  if (!result) console.warn(`[normalizeIshikawaKey] Unrecognized category_key "${raw}" — dropping.`);
  return result;
}

function enforceRootCauses(rootCauses: any[]): any[] {
  if (!Array.isArray(rootCauses)) return [];
  const seen = new Set<IshikawaCategoryKey>();
  const result: any[] = [];

  for (const entry of rootCauses) {
    const key = normalizeIshikawaKey(entry?.category_key);
    if (!key) continue;
    if (seen.has(key)) { console.warn(`[enforceRootCauses] Duplicate "${key}" — dropping.`); continue; }
    seen.add(key);
    result.push({ ...entry, category_key: key, label: key });
  }

  for (const key of ISHIKAWA_CATEGORY_KEYS) {
    if (!seen.has(key)) {
      result.push({ label: key, category: key, category_key: key, importance: 'monitor', confidence: 0, causes: [], evidence: [] });
    }
  }
  return result;
}

// ─── CORS / HELPERS ──────────────────────────────────────────────────────────

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

const SUPABASE_URL  = env("SB_URL");
const SERVICE_ROLE  = env("SB_SERVICE_ROLE_KEY");
const OPENAI_KEY    = env("OPENAI_API_KEY", "");
const APP_URL       = env("APP_URL", "https://reviewsvisor.com");

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ─── LANGUAGE / SLUG ─────────────────────────────────────────────────────────

function normalizeLanguage(code: string | null | undefined): OutputLanguage {
  const n = String(code || '').trim().toLowerCase();
  if (n.startsWith('en')) return 'en';
  if (n.startsWith('fr')) return 'fr';
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

// ─── CANONICAL THEME KEYS ────────────────────────────────────────────────────

const CANONICAL_THEME_KEYS: Record<string, string[]> = {
  cleanliness:       ['cleanliness', 'clean', 'hygiene', 'hygiène', 'propreté', 'proprete', 'sanitation'],
  price:             ['price', 'pricing', 'cost', 'value for money', 'prix', 'tarif', 'tarifs', 'rapport qualité prix', 'rapport qualite prix'],
  wait_time:         ['wait time', 'waiting time', 'attente', "temps d'attente", 'temps attente', 'délai', 'delai', 'queue'],
  communication:     ['communication', 'responsiveness', 'réactivité', 'reactivite', 'contact'],
  after_sales:       ['after-sales service', 'after sales service', 'after-sales', 'after sales', 'sav', 'service après vente', 'service apres vente', 'après vente', 'apres vente', 'follow-up'],
  trust:             ['trust', 'confiance', 'reliability', 'fiabilité', 'fiabilite', 'honesty', 'honnêteté', 'honnetete'],
  service_price:     ['service price', 'service cost', 'service charge', 'prix du service', 'coût du service', 'cout du service'],
  food_price:        ['food price', 'food cost', 'prix des plats', 'prix de la nourriture', 'coût des plats', 'cout des plats'],
  drink_price:       ['drink price', 'drinks price', 'prix des boissons', 'prix des drinks'],
  food_presentation: ['food presentation', 'dish presentation', 'plating', 'dressage', 'présentation des plats', 'presentation des plats', 'présentation plat'],
  food_temperature:  ['food temperature', 'cold dish', 'cold food', 'cold dishes', 'plat froid', 'plats froids', 'nourriture froide', 'température des plats', 'temperature des plats'],
  food_quality:      ['food quality', 'cuisine quality', 'dish quality', 'qualité des plats', 'qualite des plats', 'qualité cuisine', 'qualite cuisine', 'taste', 'flavor', 'flavour', 'goût', 'gout', 'food', 'dish', 'dishes', 'meal', 'cuisine', 'plats'],
  food_variety:      ['food variety', 'menu variety', 'menu choice', 'variété des plats', 'variete des plats', 'choix des plats'],
  service_speed:     ['service speed', 'slow service', 'fast service', 'speed of service', 'vitesse du service', 'rapidité du service', 'rapidite du service', 'service lent', 'service rapide'],
  service_quality:   ['service quality', 'quality of service', 'qualité du service', 'qualite du service'],
  service_attitude:  ['service attitude', 'rude staff', 'unfriendly staff', 'rude waiter', 'impoli', 'attitude du personnel', 'comportement personnel', 'unfriendly'],
  service:           ['service', 'staff', 'server', 'waiter', 'personnel', 'équipe', 'equipe', 'team', 'serveur', 'serveuse'],
  noise_level:       ['noise level', 'noise', 'noisy', 'loud', 'bruit', 'bruyant', 'niveau sonore'],
  ambiance:          ['ambiance', 'atmosphere', 'décor', 'decor', 'vibe', 'setting', 'environment', 'cadre'],
  portions:          ['portions', 'portion size', 'quantity', 'quantité', 'quantite'],
  menu_variety:      ['menu variety', 'menu', 'choice', 'options', 'variety', 'variété', 'variete', 'selection', 'carte'],
  reservation:       ['reservation', 'booking', 'réservation', 'table booking'],
  hair_color_result: ['color result', 'colour result', 'résultat couleur', 'resultat couleur', 'résultat coloration', 'resultat coloration', 'color outcome'],
  hair_cut_result:   ['haircut result', 'cut result', 'résultat coupe', 'resultat coupe', 'résultat de coupe'],
  hair_quality:      ['hair quality', 'hair condition', 'qualité des cheveux', 'qualite des cheveux', 'état des cheveux', 'etat des cheveux', 'hair result', 'résultat coiffure', 'resultat coiffure', 'hairstyle', 'haircut', 'coupe', 'cut'],
  colorist:          ['coloring service', 'colouring service', 'color service', 'coloration service', 'highlights', 'balayage', 'teinture', 'coloring', 'colouring', 'coloration', 'couleur'],
  stylist_skill:     ['stylist skill', 'hairdresser skill', 'stylist expertise', 'technique coiffeur', 'expertise coiffeur', 'savoir-faire coiffeur', 'stylist', 'hairdresser', 'coiffeur', 'coiffeuse', 'skill', 'expertise', 'technique', 'savoir-faire'],
  appointment:       ['appointment availability', 'prise de rendez-vous', 'appointment', 'availability', 'disponibilité', 'disponibilite', 'rendez-vous', 'rdv', 'schedule', 'booking'],
  equipment_quality: ['equipment quality', 'machine quality', 'qualité des équipements', 'qualite des equipements', 'qualité des machines', 'qualite des machines', 'état des machines', 'etat des machines'],
  equipment_variety: ['equipment variety', 'machine variety', 'variété des équipements', 'variete des equipements', 'choix des machines'],
  equipment:         ['equipment', 'machines', 'gear', 'matériel', 'materiel', 'appareil', 'appareils', 'équipements', 'equipements'],
  coaching_quality:  ['coaching quality', 'trainer quality', 'qualité du coaching', 'qualite du coaching', 'qualité des coachs', 'qualite des coachs'],
  coaching:          ['coaching', 'coach', 'trainer', 'personal trainer', 'instructor', 'entraîneur', 'entraineur', 'cours', 'classes'],
  facilities:        ['facilities', 'locker room', 'showers', 'vestiaires', 'douches', 'changing room', 'sanitaires'],
  crowd:             ['crowd', 'crowded', 'busy', 'affluence', 'monde', 'fréquentation', 'frequentation', 'surpeuplé', 'surpeuple'],
  treatment_result:  ['treatment result', 'résultat soin', 'resultat soin', 'résultat du soin', 'resultat du soin', 'résultat traitement', 'resultat traitement'],
  treatment_quality: ['treatment quality', 'qualité du soin', 'qualite du soin', 'qualité des soins', 'qualite des soins', 'qualité traitement', 'treatment', 'soin', 'soins', 'facial', 'massage'],
  waxing:            ['waxing', 'epilation', 'épilation', 'hair removal', 'cire'],
  nail_service:      ['nail service', 'nail art', 'manicure', 'pedicure', 'manucure', 'pédicure', 'pedicure', 'nails', 'nail', 'ongles'],
  response_time:     ['response time', 'intervention time', 'délai intervention', 'delai intervention', 'rapidité intervention', 'rapidite intervention', 'emergency response', 'urgence'],
  pricing_clarity:   ['pricing clarity', 'transparent pricing', 'prix transparents', 'transparence prix', 'devis', 'quote', 'invoice', 'facture'],
  professionalism:   ['professionalism', 'professional', 'professionnalisme', 'sérieux', 'serieux', 'seriousness'],
  product_variety:   ['product variety', 'product selection', 'stock variety', 'stock', 'choix', 'collection', 'range', 'assortiment'],
  fit_comfort:       ['fit and comfort', 'fit comfort', 'comfort fit', 'fit', 'comfort', 'confort', 'taille', 'fitting', 'pointure'],
  staff_knowledge:   ['staff knowledge', 'advice quality', 'knowledgeable staff', 'conseil', 'conseils', 'expertise vendeur'],
};

const THEME_TO_KEY: Map<string, string> = new Map();
for (const [key, variants] of Object.entries(CANONICAL_THEME_KEYS)) {
  for (const variant of variants) THEME_TO_KEY.set(variant.toLowerCase().trim(), key);
}

function resolveThemeKey(theme: string): string {
  const normalized = theme.toLowerCase().trim();
  const exact = THEME_TO_KEY.get(normalized);
  if (exact) return exact;

  const matches: Array<{ key: string; variantLength: number }> = [];
  for (const [variant, key] of THEME_TO_KEY.entries()) {
    if (normalized.includes(variant) || variant.includes(normalized)) {
      matches.push({ key, variantLength: variant.length });
    }
  }
  if (matches.length > 0) {
    matches.sort((a, b) => b.variantLength - a.variantLength);
    return matches[0].key;
  }

  const fallback = slugify(theme);
  return fallback;
}

// ─── SENTIMENT ───────────────────────────────────────────────────────────────

const SENTIMENT_NORMALIZE: Record<string, 'positive' | 'mixed' | 'negative'> = {
  positive: 'positive', mixed: 'mixed', negative: 'negative',
  positif: 'positive', positifve: 'positive', mixte: 'mixed',
  négatif: 'negative', negatif: 'negative', positivo: 'positive',
  negativo: 'negative', mixto: 'mixed',
};

function normalizeSentiment(raw: unknown): 'positive' | 'mixed' | 'negative' {
  const s = String(raw ?? '').toLowerCase().trim();
  const result = SENTIMENT_NORMALIZE[s];
  if (!result) console.warn(`[normalizeSentiment] Unrecognized "${raw}" — defaulting to "mixed".`);
  return result ?? 'mixed';
}

function enforceKeys(bilingual: { en: any[]; fr: any[] }): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(bilingual?.en) ? bilingual.en : [];
  const frItems = Array.isArray(bilingual?.fr) ? bilingual.fr : [];

  const keyedEn = enItems.map((item) => ({
    ...item,
    key: resolveThemeKey(item.theme ?? ''),
    ...(item.sentiment !== undefined && { sentiment: normalizeSentiment(item.sentiment) }),
    ...(item.root_causes !== undefined && { root_causes: enforceRootCauses(item.root_causes) }),
  }));

  const keyedFr = frItems.map((item, i) => ({
    ...item,
    key: keyedEn[i]?.key ?? resolveThemeKey(item.theme ?? ''),
    ...(item.sentiment !== undefined && { sentiment: normalizeSentiment(item.sentiment) }),
    ...(item.root_causes !== undefined && { root_causes: enforceRootCauses(item.root_causes) }),
  }));

  return { en: keyedEn, fr: keyedFr };
}

// ─── LOCKED KEYS ─────────────────────────────────────────────────────────────

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
      if (item.theme) locked[item.theme.toLowerCase().trim()] = item.key;
      locked[item.key.toLowerCase().trim()] = item.key;
      const variants = CANONICAL_THEME_KEYS[item.key];
      if (Array.isArray(variants)) {
        for (const v of variants) locked[v.toLowerCase().trim()] = item.key;
      }
    }
  }
  return locked;
}

// ─── MISC HELPERS ────────────────────────────────────────────────────────────

function getUniversalThemes() {
  return {
    en: ['Cleanliness', 'Price', 'Wait Time', 'Communication', 'After-sales Service', 'Trust'],
    fr: ['Propreté', 'Prix', 'Attente', 'Communication', 'SAV', 'Confiance'],
  };
}

// ─── SECTOR-SPECIFIC THEME HINTS ─────────────────────────────────────────────
// Used in Pass A to tell the model what kinds of industry-specific themes to
// look for per business type, and more importantly what themes are meaningful
// enough to surface in top_issues / top_strength.

const SECTOR_THEME_HINTS: Record<BusinessType, { en: string[]; fr: string[] }> = {
  restaurant: {
    en: ['Food Quality', 'Food Temperature', 'Food Presentation', 'Portions', 'Food Variety',
         'Service Speed', 'Service Attitude', 'Service Quality', 'Noise Level', 'Ambiance',
         'Food Price', 'Drink Price', 'Reservation'],
    fr: ['Qualité des plats', 'Température des plats', 'Présentation des plats', 'Portions', 'Variété des plats',
         'Rapidité du service', 'Attitude du personnel', 'Qualité du service', 'Niveau sonore', 'Ambiance',
         'Prix des plats', 'Prix des boissons', 'Réservation'],
  },
  salon_coiffure: {
    en: ['Hair Quality', 'Hair Cut Result', 'Hair Color Result', 'Stylist Skill', 'Colorist',
         'Appointment', 'Service Price', 'Service Quality', 'Service Attitude'],
    fr: ['Qualité des cheveux', 'Résultat de coupe', 'Résultat coloration', 'Compétence du coiffeur', 'Coloration',
         'Rendez-vous', 'Prix du service', 'Qualité du service', 'Attitude du personnel'],
  },
  salle_sport: {
    en: ['Equipment Quality', 'Equipment Variety', 'Coaching Quality', 'Coaching', 'Facilities',
         'Crowd', 'Cleanliness', 'Service Price'],
    fr: ['Qualité des équipements', 'Variété des équipements', 'Qualité du coaching', 'Coaching', 'Vestiaires',
         'Affluence', 'Propreté', 'Prix du service'],
  },
  serrurier: {
    en: ['Response Time', 'Pricing Clarity', 'Professionalism', 'Trust', 'After-sales Service', 'Communication'],
    fr: ['Délai d\'intervention', 'Transparence des prix', 'Professionnalisme', 'Confiance', 'SAV', 'Communication'],
  },
  retail_chaussures: {
    en: ['Product Variety', 'Fit & Comfort', 'Staff Knowledge', 'Service Attitude', 'Price', 'Cleanliness'],
    fr: ['Variété des produits', 'Confort et taille', 'Conseil vendeur', 'Attitude du personnel', 'Prix', 'Propreté'],
  },
  institut_beaute: {
    en: ['Treatment Quality', 'Treatment Result', 'Waxing', 'Nail Service', 'Service Price',
         'Service Attitude', 'Appointment', 'Cleanliness'],
    fr: ['Qualité des soins', 'Résultat du soin', 'Épilation', 'Manucure / Ongles', 'Prix du service',
         'Attitude du personnel', 'Rendez-vous', 'Propreté'],
  },
  autre: {
    en: ['Service Quality', 'Service Attitude', 'Price', 'Communication', 'Professionalism', 'Wait Time'],
    fr: ['Qualité du service', 'Attitude du personnel', 'Prix', 'Communication', 'Professionnalisme', 'Attente'],
  },
};

function getFallbackSummaryOneLiner(name: string, count: number) {
  return {
    en: `Analysis of ${count} reviews for ${name}`,
    fr: `Analyse de ${count} avis pour ${name}`,
  };
}

function normalizeIssues(raw: unknown): IssueSummary[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== "object") return null;
    const issue = item as Record<string, unknown>;
    const theme = typeof issue.theme === "string" ? issue.theme.trim() : "";
    if (!theme) return null;
    const count = typeof issue.count === "number" ? issue.count
      : typeof issue.count === "string" ? Number(issue.count) : undefined;
    return { theme, count: Number.isFinite(count as number) ? (count as number) : undefined };
  }).filter((item): item is IssueSummary => item !== null);
}

function computeStats(rows: ReviewRow[]) {
  const ratings = rows.map(r => r.rating ?? 0).filter(n => n > 0);
  const total = rows.length;
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const pos = rows.filter(r => (r.rating ?? 0) >= 4).length;
  const neg = rows.filter(r => (r.rating ?? 0) <= 2).length;
  const by_rating: Record<string, number> = {};
  for (let i = 1; i <= 5; i++) by_rating[i] = rows.filter(r => (r.rating ?? 0) === i).length;
  return {
    total, by_rating,
    positive_pct: total ? Math.round((pos / total) * 100) : 0,
    negative_pct: total ? Math.round((neg / total) * 100) : 0,
    overall: avg,
  };
}

function detectBusinessType(
  name: string,
  googlePlacesTypes?: string[] | null,
  reviewsTexts?: string[],
): { type: BusinessType; confidence: number; candidates: Array<{ type: BusinessType; confidence: number }>; source: 'places' | 'keywords' | 'manual' } {
  const combinedText = `${name} ${(reviewsTexts || []).join(' ')}`.toLowerCase();

  const placesMapping: Record<string, BusinessType> = {
    restaurant: 'restaurant', food: 'restaurant', cafe: 'restaurant',
    hair_care: 'salon_coiffure', beauty_salon: 'salon_coiffure',
    gym: 'salle_sport', health: 'salle_sport',
    locksmith: 'serrurier', shoe_store: 'retail_chaussures', spa: 'institut_beaute',
  };

  const keywords: Record<BusinessType, string[]> = {
    restaurant:       ['restaurant', 'diner', 'bistro', 'brasserie', 'cafe', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'eat', 'meal', 'dish'],
    salon_coiffure:   ['hairdresser', 'hair stylist', 'salon', 'barber', 'hair', 'coloring', 'cut', 'hairstyle'],
    salle_sport:      ['gym', 'fitness', 'sport', 'bodybuilding', 'crossfit', 'yoga', 'coach'],
    serrurier:        ['locksmith', 'locksmith service', 'repair', 'key', 'lock', 'emergency'],
    retail_chaussures:['shoe', 'shoes', 'sneaker', 'sneakers', 'store', 'shop'],
    institut_beaute:  ['beauty institute', 'beauty', 'esthetic', 'care', 'massage', 'hair removal'],
    autre:            [],
  };

  if (googlePlacesTypes?.length) {
    for (const t of googlePlacesTypes) {
      const mapped = placesMapping[t.toLowerCase().replace(/\s+/g, '_')];
      if (mapped) return { type: mapped, confidence: 90, candidates: [{ type: mapped, confidence: 90 }], source: 'places' };
    }
  }

  const scores: Record<BusinessType, number> = {
    restaurant: 0, salon_coiffure: 0, salle_sport: 0, serrurier: 0,
    retail_chaussures: 0, institut_beaute: 0, autre: 0,
  };

  Object.entries(keywords).forEach(([type, words]) => {
    words.forEach(word => {
      if (combinedText.includes(word)) scores[type as BusinessType] += name.toLowerCase().includes(word) ? 3 : 1;
    });
  });

  const sorted = Object.entries(scores)
    .filter(([t]) => t !== 'autre')
    .map(([type, score]) => ({ type: type as BusinessType, score }))
    .sort((a, b) => b.score - a.score);

  if (sorted[0].score === 0) return { type: 'autre', confidence: 0, candidates: [], source: 'keywords' };

  const top = sorted[0];
  const confidence = Math.min(100, Math.round((top.score / 10) * 100));
  const candidates = sorted
    .filter(s => s.score > 0).slice(0, 3)
    .map(s => ({ type: s.type, confidence: Math.min(100, Math.round((s.score / 10) * 100)) }));

  return { type: top.type, confidence, candidates, source: 'keywords' };
}

// ─── OPENAI CALL WRAPPER ─────────────────────────────────────────────────────

async function callOpenAI(messages: any[], temperature = 0.2, model = "gpt-4o-mini"): Promise<any | null> {
  if (!OPENAI_KEY) return null;
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  const data = await resp.json();
  const txt = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(txt);
  } catch (err) {
    return null;
  }
}

// ─── SHARED CONSTANTS ────────────────────────────────────────────────────────

const SYSTEM_RULES = `OUTPUT RULES (apply to every pass):
- Respond with valid JSON only — no markdown, no preamble
- All field names exactly as specified
- Keys: always English snake_case, identical in EN and FR branches
- sentiment: always one of "positive" | "mixed" | "negative" — never translate
- Quotes: verbatim from source reviews, never translated, FR branch = identical to EN branch`;

const BILINGUAL_RULE = `BILINGUAL OUTPUT:
- Generate both "en" and "fr" branches for every field
- Translate only: theme names, descriptions, ai_synthesis, what_it_means, first_step, titles, reasons
- Never translate: keys, sentiment values, count/impact numbers, or any review quotes`;

// ─── BUSINESS TYPE CATEGORY CONTEXT ──────────────────────────────────────────
// Used in Pass B and Pass C to give the model sector-specific lens for each
// of the 5M Ishikawa categories. Without this, the model applies generic
// descriptions that miss the real operational meaning for that business type.

const BUSINESS_CATEGORY_CONTEXT: Record<BusinessType, string> = {
  restaurant: `
    manpower    → kitchen staff skill, waiter attentiveness, order accuracy, service attitude, chef consistency
    method      → order flow, kitchen-to-table handoff, reservation handling, table turn process, billing process
    machine     → kitchen equipment (ovens, fryers, grills), POS system, coffee machines, refrigeration
    material    → ingredient freshness, sourcing quality, food temperature on arrival, portion consistency
    environment → noise level, table spacing, cleanliness, lighting, ambiance, toilet condition`,

  salon_coiffure: `
    manpower    → stylist technique, colourist skill, consultation quality, punctuality, listening to client requests
    method      → appointment scheduling, service sequencing, colour process timing, patch test procedures
    machine     → hairdryers, colour processing equipment, styling tools condition, wash basins
    material    → product quality (dyes, treatments, shampoos), product freshness, brands used
    environment → salon cleanliness, waiting area comfort, music/noise level, privacy, ventilation`,

  salle_sport: `
    manpower    → coach expertise, trainer attentiveness, staff helpfulness, class instructor quality
    method      → class scheduling, membership onboarding, equipment booking system, peak hour management
    machine     → cardio machines, weight equipment, condition and maintenance, broken equipment response time
    material    → consumables (towels, cleaning supplies), water/refreshment availability, product vending
    environment → cleanliness, locker rooms, showers, temperature, crowding, ventilation`,

  serrurier: `
    manpower    → technician skill, punctuality, professionalism, honesty, communication clarity
    method      → dispatch process, quote accuracy, job completion verification, invoicing transparency
    machine     → tools condition, drilling equipment, key-cutting machines, diagnostic tools
    material    → lock quality, replacement parts sourcing, parts availability
    environment → worksite safety, tidiness after job, respect for client property`,

  retail_chaussures: `
    manpower    → staff product knowledge, fitting assistance quality, sales attitude, availability on floor
    method      → stock management, returns/exchange process, checkout flow, size availability process
    machine     → POS system, payment terminals, stock lookup systems
    material    → shoe quality, stock condition, sizing accuracy, packaging
    environment → store layout, cleanliness, fitting area comfort, lighting, changing room availability`,

  institut_beaute: `
    manpower    → therapist technique, consultation depth, hygiene standards, punctuality, aftercare advice quality
    method      → treatment sequencing, appointment management, consent/patch test process, upsell pressure
    machine     → treatment equipment condition (lasers, wax heaters, facial machines, steamers)
    material    → product quality (waxes, creams, serums, oils), product freshness, brand transparency
    environment → room cleanliness, ambiance, temperature, privacy, music, scent`,

  autre: `
    manpower    → staff skill, behaviour, attentiveness, communication, professionalism
    method      → process flow, sequencing, coordination, handoffs, service delivery steps
    machine     → tools, equipment, devices, technology used to deliver the service
    material    → input quality, product condition, sourcing, consumables
    environment → physical space, cleanliness, layout, atmosphere, comfort`,
};

// ─── PASS A — THEME EXTRACTION ───────────────────────────────────────────────
// KEY CHANGE: top_issues and top_strength are now ranked from the COMBINED
// pool of universal + industry themes. The model is explicitly told to prefer
// sector-specific themes over generic ones when counts are equal, so a
// restaurant's top issue will be "Food Temperature" not just "Service".

async function analyzePassA(
  placeName: string,
  samples: string[],
  totalReviews: number,
  businessType: BusinessType,
  businessTypeConfidence: number,
  lockedKeys: Record<string, string> = {},
) {
  const universal = getUniversalThemes();
  const sectorHints = SECTOR_THEME_HINTS[businessType] ?? SECTOR_THEME_HINTS['autre'];

  const industryInstruction = businessTypeConfidence >= 45
    ? `Also extract themes specific to the ${businessType} sector. Prioritise themes from this list if they appear in the reviews:
   EN: ${sectorHints.en.join(', ')}
   FR: ${sectorHints.fr.join(', ')}
   You may add additional sector-specific themes not in the list above if the reviews clearly mention them.`
    : `Do not invent industry-specific themes — focus on universal themes only.`;

  const lockedKeysBlock = Object.keys(lockedKeys).length > 0
    ? `LOCKED KEYS — reuse these exact keys for the same themes, no changes allowed:\n` +
      Object.entries(lockedKeys)
        .filter(([variant, key]) => variant !== key)
        .map(([theme, key]) => `  "${theme}" → "${key}"`)
        .join("\n")
    : '';

  return callOpenAI([
    {
      role: "system",
      content: `You are a customer review analyst. Extract themes and classify them.
${SYSTEM_RULES}
${BILINGUAL_RULE}
Do NOT include any quotes or evidence in this pass — that is handled separately.`,
    },
    {
      role: "user",
      content: `Business: ${placeName}
Type: ${businessType} (confidence: ${businessTypeConfidence}%)
Total reviews: ${totalReviews}

Reviews (numbered, ${samples.length} total):
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

${lockedKeysBlock}

COUNTING RULE:
Go through each review and count how many mention each theme — directly or by implication.
"count" = exact number of reviews. Do not estimate. Minimum 2 to include a theme.

STEP 1 — EXTRACT ALL THEMES
Extract two sets of themes (minimum count ≥ 2 for each):

Universal themes — always check these six:
  EN: ${universal.en.join(', ')}
  FR: ${universal.fr.join(', ')}

${industryInstruction}

For each theme found: assign sentiment ("positive"|"mixed"|"negative"), importance (0–100), count.

STEP 2 — RANK top_issues AND top_strength FROM THE COMBINED POOL
top_issues  = 3–5 themes with the most negative mentions, sorted by count desc.
top_strength = 3–5 themes with the most positive mentions, sorted by count desc.

RANKING RULES FOR top_issues / top_strength:
  • Draw from ALL themes found in Step 1 — both universal and industry-specific.
  • When two themes have similar counts, PREFER the more sector-specific one.
    Example: a restaurant with equal counts for "Service" and "Food Temperature"
    → "Food Temperature" wins because it is specific and actionable for this sector.
  • Do NOT default to generic themes ("Service", "Food", "Staff") if a more
    specific theme ("Service Speed", "Food Quality", "Stylist Skill") has equal
    or higher count. Generic themes are only used when no specific theme fits.
  • Each theme in top_issues must have sentiment "negative" or "mixed".
  • Each theme in top_strength must have sentiment "positive" or "mixed".

Return this exact JSON shape (NO evidence_quotes or evidence arrays — leave them empty []):
{
  "top_issues": {
    "en": [{ "key": "snake_case", "theme": "Name", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }]
  },
  "top_strength": {
    "en": [{ "key": "snake_case", "theme": "Name", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }]
  },
  "themes_universal": {
    "en": [{ "key": "snake_case", "theme": "Name", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "what_it_means": "...", "evidence_quotes": [] }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "what_it_means": "...", "evidence_quotes": [] }]
  },
  "themes_industry": {
    "en": [{ "key": "snake_case", "theme": "Name", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "what_it_means": "...", "evidence_quotes": [] }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "what_it_means": "...", "evidence_quotes": [] }]
  },
  "summary": {
    "en": { "one_liner": "...", "what_customers_love": [{ "theme": "...", "reason": "...", "count": 0 }], "what_customers_hate": [{ "theme": "...", "reason": "...", "count": 0 }] },
    "fr": { "one_liner": "...", "what_customers_love": [{ "theme": "...", "reason": "...", "count": 0 }], "what_customers_hate": [{ "theme": "...", "reason": "...", "count": 0 }] }
  }
}`,
    },
  ]);
}

// ─── PASS B — EVIDENCE EXTRACTION ────────────────────────────────────────────
// Receives businessType + businessTypeConfidence so the model can judge
// quote relevance through the correct sector lens.

async function analyzePassB(
  samples: string[],
  passAResult: any,
  businessType: BusinessType,
  businessTypeConfidence: number,
) {
  const themesForQuotes = {
    themes_universal: passAResult?.themes_universal ?? { en: [], fr: [] },
    themes_industry:  passAResult?.themes_industry  ?? { en: [], fr: [] },
    top_strength:     passAResult?.top_strength     ?? { en: [], fr: [] },
  };

  return callOpenAI([
    {
      role: "system",
      content: `You are extracting verbatim quotes from customer reviews to support pre-identified themes.
${SYSTEM_RULES}

Business type: ${businessType} (confidence: ${businessTypeConfidence}%)
Use this context to understand what each theme means for this sector:
${BUSINESS_CATEGORY_CONTEXT[businessType] ?? BUSINESS_CATEGORY_CONTEXT['autre']}

QUOTE RULES — these are absolute, no exceptions:
Q1. Every quote must be copied character-for-character from the numbered reviews below.
    Never paraphrase, shorten, summarize, or construct a quote.

Q2. Never translate quotes — ever.
    A French review stays French. An English review stays English.
    The FR branch of every theme must contain the EXACT SAME quotes as the EN branch.
    Identical. Character for character. Not a translation — a copy.

Q3. Sentiment matching for themes (evidence_quotes):
    - sentiment="positive" → quotes where reviewer PRAISES this theme only
    - sentiment="negative" → quotes where reviewer COMPLAINS about this theme only
    - sentiment="mixed"    → quotes containing BOTH praise AND complaint in the SAME sentence
                             If no such quote exists → evidence_quotes: []
                             Do NOT combine one positive + one negative quote

Q4. top_strength evidence → praise quotes only, even from mixed reviews.
    Extract only the praise clause.

Q5. If no valid verbatim quote exists for a theme → empty array []. Never invent.`,
    },
    {
      role: "user",
      content: `Reviews (numbered, ${samples.length} total):
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Themes to fill with quotes:
${JSON.stringify(themesForQuotes, null, 2)}

For each theme in themes_universal and themes_industry:
  → Fill evidence_quotes[] with verbatim quotes matching the theme's sentiment (rule Q3)
  → EN and FR branches get identical quote arrays

For each item in top_strength:
  → Fill evidence[] with praise-only verbatim quotes (rule Q4)
  → EN and FR branches get identical quote arrays

Return this exact JSON shape with the same items, just with quotes added:
{
  "themes_universal": { "en": [...], "fr": [...] },
  "themes_industry":  { "en": [...], "fr": [...] },
  "top_strength":     { "en": [...], "fr": [...] }
}`,
    },
  ]);
}

// ─── PASS C — ISHIKAWA ROOT CAUSES ───────────────────────────────────────────

async function analyzePassC(
  negativeTexts: string[],
  topIssues: { en: any[]; fr: any[] },
  businessType: BusinessType,
  businessTypeConfidence: number,
): Promise<{ en: any[]; fr: any[] }> {

  if (!topIssues?.en?.length) return topIssues;

  if (!negativeTexts.length) {
    return {
      en: topIssues.en.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
      fr: topIssues.fr.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
    };
  }

  const issueList = topIssues.en.map((issue: any) => ({
    key:   issue.key,
    theme: issue.theme,
    count: issue.count ?? 0,
  }));

  const result = await callOpenAI([
    {
      role: "system",
      content: `You are a root cause analyst using the Ishikawa (fishbone / 5M) method.
${SYSTEM_RULES}

You receive only negative reviews (rating 1–3), each numbered.
Business type: ${businessType} (confidence: ${businessTypeConfidence}%)

5M CATEGORIES for a ${businessType} business — use these sector-specific definitions:
${BUSINESS_CATEGORY_CONTEXT[businessType] ?? BUSINESS_CATEGORY_CONTEXT['autre']}

The category_key values you must use are always these exact strings:
  manpower | method | machine | material | environment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5-PHASE WORKFLOW — run ALL 5 phases per issue before the next
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1 › QUOTE EXTRACTION
  Scan every numbered review for complaints about the current issue.
  For each matching review:
    → Copy the complaint sentence verbatim — character for character
    → Mixed review (praise + complaint): copy only the complaint clause
  Store as a private list: [ (review_number, verbatim_quote), … ]
  This list is the ONLY source allowed in evidence[]. Nothing else. Ever.

PHASE 2 › CATEGORY MAPPING
  For every Phase 1 quote, ask: which 5M categories does this complaint implicate?
  Categories are NOT mutually exclusive — one quote can support several.
  Use the sector-specific 5M definitions above when mapping.
  Never let the issue name bias the mapping:
    "Food Quality"   ≠ automatically Material
    "Service Speed"  ≠ automatically Method only
    "Wait Time"      ≠ automatically Method only

PHASE 3 › CAUSE GENERATION
  For each category with at least one supporting quote:
    → Write a specific operational cause directly inferable from the evidence
    → Explain WHY, not THAT
    → Use the sector context: a cause for a ${businessType} should reflect
       how that specific type of business operates

  ✓ GOOD (specific, evidence-driven, sector-aware):
      restaurant/method:   "No expediter role to check dish temperature before table delivery"
      salon/manpower:      "Junior colourists apply permanent dye without senior sign-off"
      gym/machine:         "Preventive maintenance schedule not followed — broken equipment stays in service"

  ✗ BAD (generic — not allowed without explicit mention in a quote):
      "Staff lacks training"       ← only if training is literally mentioned
      "Low quality ingredients"    ← only if freshness/sourcing is literally mentioned
      "Poor management"            ← never acceptable

  Zero supporting quotes → causes: [], evidence: [], confidence: 0, importance: "monitor"

PHASE 4 › CONFIDENCE SCORING
  Calibrate strictly to number of unique supporting quotes:
    0 quotes   → confidence: 0
    1 quote    → confidence: 35–50
    2 quotes   → confidence: 50–65
    3–5 quotes → confidence: 65–80
    6+ quotes  → confidence: 80–100
  Never assign confidence ≥ 80 with fewer than 6 quotes.
  Never assign confidence > 0 with 0 quotes.

PHASE 5 › IMPORTANCE RANKING
  Per issue, among all 5 categories:
    most quotes  → importance: "dominant"   (exactly one per issue)
    any quotes   → importance: "secondary"  (all others with evidence)
    zero quotes  → importance: "monitor"
  "dominant" must appear exactly once per issue.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  R1. Exactly 5 root_cause objects per issue — one per 5M key.
  R2. evidence[] = verbatim Phase 1 quotes only. Never paraphrase.
  R3. One quote may appear in multiple categories if justified.
  R4. confidence must match the Phase 4 bracket exactly.
  R5. "dominant" appears exactly once per issue.
  R6. FR causes[] = translated from EN causes[].
  R7. FR evidence[] = IDENTICAL to EN evidence[], character for character. NEVER translate.
  R8. Empty category: causes: [], evidence: [], confidence: 0, importance: "monitor".
  R9. Never invent a quote. If no valid quote exists → empty array.`,
    },
    {
      role: "user",
      content: `NEGATIVE REVIEWS (${negativeTexts.length} total, all rated 1–3 stars):
${negativeTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}

ISSUES TO ANALYZE:
${JSON.stringify(issueList, null, 2)}

Run all 5 phases for each issue in order. Do not skip Phase 1.

Return ONLY this JSON — no prose, no markdown:
{
  "top_issues": {
    "en": [
      {
        "key":   "<from input — do not change>",
        "theme": "<from input — do not change>",
        "count": <from input — do not change>,
        "root_causes": [
          {
            "label":        "manpower",
            "category":     "manpower",
            "category_key": "manpower",
            "importance":   "dominant | secondary | monitor",
            "confidence":   <0–100>,
            "causes":   ["<specific operational cause for a ${businessType}>"],
            "evidence": ["<verbatim quote from reviews above>"]
          },
          {
            "label":        "method",
            "category":     "method",
            "category_key": "method",
            "importance":   "dominant | secondary | monitor",
            "confidence":   <0–100>,
            "causes":   ["<specific operational cause>"],
            "evidence": ["<verbatim quote>"]
          },
          {
            "label":        "machine",
            "category":     "machine",
            "category_key": "machine",
            "importance":   "dominant | secondary | monitor",
            "confidence":   <0–100>,
            "causes":   [],
            "evidence": []
          },
          {
            "label":        "material",
            "category":     "material",
            "category_key": "material",
            "importance":   "dominant | secondary | monitor",
            "confidence":   <0–100>,
            "causes":   [],
            "evidence": []
          },
          {
            "label":        "environment",
            "category":     "environment",
            "category_key": "environment",
            "importance":   "dominant | secondary | monitor",
            "confidence":   <0–100>,
            "causes":   [],
            "evidence": []
          }
        ]
      }
    ],
    "fr": [
      {
        "key":   "<same as EN>",
        "theme": "<translated to French>",
        "count": <same as EN>,
        "root_causes": [
          {
            "label":        "manpower",
            "category":     "manpower",
            "category_key": "manpower",
            "importance":   "<same as EN>",
            "confidence":   <same as EN>,
            "causes":   ["<French translation of EN cause>"],
            "evidence": ["<IDENTICAL verbatim quote as EN — never translate>"]
          },
          {
            "label":        "method",
            "category":     "method",
            "category_key": "method",
            "importance":   "<same as EN>",
            "confidence":   <same as EN>,
            "causes":   ["<French translation of EN cause>"],
            "evidence": ["<IDENTICAL verbatim quote as EN>"]
          },
          {
            "label":        "machine",
            "category":     "machine",
            "category_key": "machine",
            "importance":   "<same as EN>",
            "confidence":   <same as EN>,
            "causes":   [],
            "evidence": []
          },
          {
            "label":        "material",
            "category":     "material",
            "category_key": "material",
            "importance":   "<same as EN>",
            "confidence":   <same as EN>,
            "causes":   [],
            "evidence": []
          },
          {
            "label":        "environment",
            "category":     "environment",
            "category_key": "environment",
            "importance":   "<same as EN>",
            "confidence":   <same as EN>,
            "causes":   [],
            "evidence": []
          }
        ]
      }
    ]
  }
}`,
    },
  ]);

  // ── Shape guard: model may return { top_issues:{en,fr} } or {en,fr} directly
  const raw = result?.top_issues ?? result;
  if (!raw?.en) {
    return topIssues;
  }

  const enItems: any[] = Array.isArray(raw.en) ? raw.en : [];
  const frItems: any[] = Array.isArray(raw.fr) ? raw.fr : [];

  // ── EN: spread original Pass A fields first — model only contributes root_causes
  const enforcedEn = topIssues.en.map((orig: any, idx: number) => {
    const modelItem = enItems[idx];
    return {
      ...orig,
      root_causes: enforceRootCauses(modelItem?.root_causes ?? []),
    };
  });

  // ── FR: same pattern + hard-mirror EN evidence[] into FR by category_key
  const enforcedFr = topIssues.fr.map((orig: any, idx: number) => {
    const modelItem     = frItems[idx];
    const enCounterpart = enforcedEn[idx];

    const frCauses: any[] = enforceRootCauses(modelItem?.root_causes ?? []);

    const mirrored = frCauses.map((frCause: any) => {
      const enCause = enCounterpart?.root_causes?.find(
        (ec: any) => ec.category_key === frCause.category_key,
      );
      return {
        ...frCause,
        evidence: enCause?.evidence ?? frCause.evidence ?? [],
      };
    });

    return {
      ...orig,
      root_causes: mirrored,
    };
  });

  return { en: enforcedEn, fr: enforcedFr };
}

// ─── PASS D — RECOMMENDATIONS ────────────────────────────────────────────────

async function analyzePassD(
  placeName: string,
  businessType: BusinessType,
  businessTypeConfidence: number,
  themesUniversal: { en: any[]; fr: any[] },
  themesIndustry: { en: any[]; fr: any[] },
  topIssues: { en: any[]; fr: any[] },
  avgRating: number | null,
) {
  return callOpenAI([
    {
      role: "system",
      content: `You are a customer experience consultant generating actionable recommendations.
${SYSTEM_RULES}
${BILINGUAL_RULE}`,
    },
    {
      role: "user",
      content: `Business: ${placeName}
Type: ${businessType} (confidence: ${businessTypeConfidence}%)
Average rating: ${avgRating?.toFixed(1) || 'N/A'}

Universal themes: ${(themesUniversal?.en || []).map((t: any) => t.theme).join(', ') || 'None'}
Industry themes:  ${(themesIndustry?.en  || []).map((t: any) => t.theme).join(', ') || 'None'}
Priority issues:  ${(topIssues?.en       || []).map((t: any) => t.theme).join(', ') || 'None'}

Generate:
1. pain_points_prioritized: ranked issues with impact (0–100), ease (0–100), and a concrete first_step
2. quick_wins_7_days: fast actions achievable in 7 days with expected results
3. projects_30_days: structured initiatives for 30-day horizon
4. reply_templates: positive / neutral / negative response templates for the ${businessType} sector

Return this exact JSON shape:
{
  "pain_points_prioritized": {
    "en": [{ "issue": "...", "why_it_matters": "...", "impact": 80, "ease": 60, "first_step": "..." }],
    "fr": [{ "issue": "...", "why_it_matters": "...", "impact": 80, "ease": 60, "first_step": "..." }]
  },
  "recommendations": {
    "en": {
      "quick_wins_7_days": [{ "title": "...", "details": "...", "expected_result": "...", "priority": 1 }],
      "projects_30_days":  [{ "title": "...", "details": "...", "expected_result": "...", "priority": 1 }]
    },
    "fr": {
      "quick_wins_7_days": [{ "title": "...", "details": "...", "expected_result": "...", "priority": 1 }],
      "projects_30_days":  [{ "title": "...", "details": "...", "expected_result": "...", "priority": 1 }]
    }
  },
  "reply_templates": {
    "en": {
      "positive": [{ "title": "...", "reply": "...", "use_when": "..." }],
      "neutral":  [{ "title": "...", "reply": "...", "use_when": "..." }],
      "negative": [{ "title": "...", "reply": "...", "use_when": "..." }]
    },
    "fr": {
      "positive": [{ "title": "...", "reply": "...", "use_when": "..." }],
      "neutral":  [{ "title": "...", "reply": "...", "use_when": "..." }],
      "negative": [{ "title": "...", "reply": "...", "use_when": "..." }]
    }
  }
}`,
    },
  ], 0.3);
}

// ─── NOTIFICATION HELPERS ─────────────────────────────────────────────────────

function shouldSendSignificantChangeNotification(
  previousAvgRating: number | null,
  currentAvgRating: number | null,
  previousIssues: IssueSummary[],
  currentIssues: IssueSummary[],
): { send: boolean; reason: "rating_drop" | "major_issue" | null } {
  if (previousAvgRating !== null && currentAvgRating !== null &&
      (previousAvgRating - currentAvgRating) > 0) {
    return { send: true, reason: "rating_drop" };
  }
  const currentTop = currentIssues[0];
  if (currentTop) {
    const previousThemes = new Set(previousIssues.map(i => i.theme.toLowerCase()));
    if (!previousThemes.has(currentTop.theme.toLowerCase())) {
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
  const fr = input.language === "fr";
  const title = fr ? "Alerte de réputation" : "Reputation alert";
  const greeting = fr ? "Bonjour" : "Hi";
  const intro = fr
    ? "Un changement significatif a été détecté sur votre établissement."
    : "A significant change was detected for your establishment.";
  const ratingLabel    = fr ? "Note moyenne" : "Average rating";
  const previousLabel  = fr ? "Période précédente" : "Previous period";
  const currentLabel   = fr ? "Période actuelle" : "Current period";
  const issuesLabel    = fr ? "Points prioritaires" : "Top issues";
  const ctaLabel       = fr ? "Voir le tableau de bord" : "Open dashboard";
  const reasonLabel    = input.reason === "rating_drop"
    ? (fr ? "Baisse de note détectée" : "Rating drop detected")
    : (fr ? "Problème majeur détecté" : "Major issue detected");
  const prevDisplay    = input.previousAvg !== null ? input.previousAvg.toFixed(1) : "N/A";
  const currDisplay    = input.currentAvg  !== null ? input.currentAvg.toFixed(1)  : "N/A";
  const issueItems     = input.issues.length > 0
    ? input.issues.slice(0, 3)
        .map(i => `<li style="margin-bottom:8px;"><strong>${i.theme}</strong>${typeof i.count === "number" ? ` (${i.count})` : ""}</li>`)
        .join("")
    : `<li style="color:#9CA3AF;">${fr ? "Aucun point prioritaire identifié." : "No top issues identified."}</li>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#2F6BFF 0%,#1E40AF 100%);color:#fff;padding:32px;">
          <h1 style="margin:0;font-size:24px;">${title}</h1>
          <p style="margin:8px 0 0;opacity:.9;">${input.establishmentName} • ${input.reportMonthName}</p>
        </div>
        <div style="padding:32px;color:#1f2937;">
          <p>${greeting} ${input.displayName},</p>
          <p>${intro}</p>
          <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">${reasonLabel}</p>
            <p style="margin:0;">${ratingLabel}: <strong>${previousLabel}</strong> ${prevDisplay} → <strong>${currentLabel}</strong> ${currDisplay}
              ${input.reason === "rating_drop" ? `(${fr ? "baisse" : "drop"} ${input.ratingDrop.toFixed(1)})` : ""}
            </p>
          </div>
          <div style="background:#F9FAFB;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid #F59E0B;">
            <h2 style="font-size:18px;margin:0 0 16px;">${issuesLabel}</h2>
            <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;">${issueItems}</ul>
          </div>
          <div style="text-align:center;">
            <a href="${APP_URL}/tableau-de-bord" style="display:inline-block;background:#2F6BFF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
              ${ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>`;
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
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE}` },
    body: JSON.stringify({ to: [input.userEmail], subject, html }),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`send-email failed: ${resp.status} ${err}`);
  }
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
      } catch {}
    }
    if (!userId) return json({ ok: false, error: "authentication_required" }, 401);

    // ── User info ──────────────────────────────────────────────────────────
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userEmail = userRecord.user?.email ?? "";
    const { data: userProfile } = await supabaseAdmin
      .from('profiles').select('first_name, last_name, important_updates_enabled')
      .eq('user_id', userId).maybeSingle();

    const firstName = userProfile?.first_name || userRecord.user?.user_metadata?.first_name || "";
    const lastName  = userProfile?.last_name  || userRecord.user?.user_metadata?.last_name  || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || userEmail || "User";
    const importantUpdatesEnabled = userProfile?.important_updates_enabled === true;

    // ── Request params ─────────────────────────────────────────────────────
    const { place_id, name, dryRun = false, language } = await req.json().catch(() => ({}));
    if (!place_id) return json({ ok: false, error: "missing_place_id" }, 400);
    const outputLanguage = normalizeLanguage(language);

    // ── Establishment ──────────────────────────────────────────────────────
    let establishmentName = name || 'Établissement';
    let googlePlacesTypes: string[] | null = null;
    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments').select('name, types')
        .eq('place_id', place_id).eq('user_id', userId).maybeSingle();
      if (establishment?.name) establishmentName = establishment.name;
      if (establishment?.types) {
        googlePlacesTypes = Array.isArray(establishment.types) ? establishment.types : [establishment.types];
      }
    } catch (err) { console.warn('[analyze-reviews-v2] Establishment fetch error:', err); }

    // ── Reviews ────────────────────────────────────────────────────────────
    const { data: reviewsData, error: reviewsErr } = await supabaseAdmin
      .from('reviews').select('text, rating')
      .eq('place_id', place_id).eq('user_id', userId)
      .order('published_at', { ascending: false }).limit(300);
    if (reviewsErr) throw new Error(`reviews_fetch_failed:${reviewsErr.message}`);

    const rows: ReviewRow[] = (reviewsData || []).map((r: any) => ({
      user_id: userId, place_id, source: "google" as const,
      remote_id: r.id || crypto.randomUUID(),
      rating: r.rating ?? null, text: r.text ?? null,
      language_code: null, published_at: null, author_name: null,
      author_url: null, author_photo_url: null, like_count: null,
    }));
    if (rows.length === 0) return json({ ok: false, error: "no_reviews_found" }, 400);

    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean);
    const negativeTexts = rows
      .filter(r => r.text && (r.rating ?? 3) <= 3)
      .map(r => r.text!);
    console.log(`[analyze-reviews-v2] ${negativeTexts.length}/${rows.length} negative reviews (rating <= 3) for Pass C`);
    const detection = detectBusinessType(establishmentName, googlePlacesTypes, sampleTexts);
    console.log(`[analyze-reviews-v2] Business type: ${detection.type} (${detection.confidence}%) via ${detection.source}`);

    // ── Locked keys from previous run ──────────────────────────────────────
    const { data: existingInsight } = await supabaseAdmin
      .from('review_insights')
      .select('top_issues, top_praises, themes_universal, themes_industry, avg_rating')
      .eq('place_id', place_id).eq('user_id', userId).maybeSingle();

    const lockedKeys = buildLockedKeys(existingInsight);

    // ── Pass A: theme extraction ───────────────────────────────────────────
    const passAResult = await analyzePassA(
      establishmentName, sampleTexts, rows.length,
      detection.type, detection.confidence, lockedKeys,
    );
    if (!passAResult) return json({ ok: false, error: "analysis_pass_a_failed" }, 500);

    if (passAResult.top_issues)       passAResult.top_issues       = enforceKeys(passAResult.top_issues);
    if (passAResult.top_strength)     passAResult.top_strength     = enforceKeys(passAResult.top_strength);
    if (passAResult.themes_universal) passAResult.themes_universal = enforceKeys(passAResult.themes_universal);
    if (passAResult.themes_industry)  passAResult.themes_industry  = enforceKeys(passAResult.themes_industry);

    // ── Pass B: evidence quotes ────────────────────────────────────────────
    const passBResult = await analyzePassB(
      sampleTexts,
      passAResult,
      detection.type,
      detection.confidence,
    );

    if (passBResult?.themes_universal) passAResult.themes_universal = enforceKeys(passBResult.themes_universal);
    if (passBResult?.themes_industry)  passAResult.themes_industry  = enforceKeys(passBResult.themes_industry);
    if (passBResult?.top_strength)     passAResult.top_strength     = enforceKeys(passBResult.top_strength);

    // ── Pass C: Ishikawa root causes ───────────────────────────────────────
    const passCResult = await analyzePassC(
      negativeTexts,
      passAResult.top_issues ?? { en: [], fr: [] },
      detection.type,
      detection.confidence,
    );
    passAResult.top_issues = enforceKeys(passCResult);

    // ── Pass D: recommendations ────────────────────────────────────────────
    const passDResult = await analyzePassD(
      establishmentName, detection.type, detection.confidence,
      { en: passAResult?.themes_universal?.en || [], fr: passAResult?.themes_universal?.fr || [] },
      { en: passAResult?.themes_industry?.en  || [], fr: passAResult?.themes_industry?.fr  || [] },
      { en: passAResult?.top_issues?.en       || [], fr: passAResult?.top_issues?.fr       || [] },
      stats.overall,
    );
    if (!passDResult) return json({ ok: false, error: "analysis_pass_d_failed" }, 500);

    // ── Summary ────────────────────────────────────────────────────────────
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

    // ── Final analysis object ──────────────────────────────────────────────
    const analysisResult = {
      business_type:            detection.type,
      business_type_confidence: detection.confidence,
      business_type_candidates: detection.candidates,
      top_praises:              passAResult?.top_strength      || { en: [], fr: [] },
      top_issues:               passAResult?.top_issues        || { en: [], fr: [] },
      summary:                  summaryData,
      themes_universal:         passAResult?.themes_universal  || { en: [], fr: [] },
      themes_industry:          detection.confidence >= 45
        ? (passAResult?.themes_industry || { en: [], fr: [] })
        : { en: [], fr: [] },
      pain_points_prioritized:  passDResult?.pain_points_prioritized || { en: [], fr: [] },
      recommendations:          passDResult?.recommendations || {
        en: { quick_wins_7_days: [], projects_30_days: [] },
        fr: { quick_wins_7_days: [], projects_30_days: [] },
      },
      reply_templates:          passDResult?.reply_templates || {
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

    // ── Notification ───────────────────────────────────────────────────────
    const prevAvg        = (existingInsight as any)?.avg_rating ?? null;
    const previousIssues = normalizeIssues((existingInsight as any)?.top_issues?.en || []);
    const currentIssues  = normalizeIssues(passAResult?.top_issues?.en || []);
    const notificationDecision = shouldSendSignificantChangeNotification(
      prevAvg, stats.overall, previousIssues, currentIssues,
    );

    // ── Persist ────────────────────────────────────────────────────────────
    if (!dryRun) {
      const payload = {
        place_id, user_id: userId,
        last_analyzed_at: new Date().toISOString(),
        updated_at:       new Date().toISOString(),
        business_type:            detection.type,
        business_type_confidence: detection.confidence,
        business_type_candidates: detection.candidates,
        analysis_version: 'v2-auto-universal',
        total_count:  stats.total,
        avg_rating:   stats.overall,
        positive_ratio: stats.positive_pct / 100,
        themes: [
          ...(passAResult?.themes_universal?.en || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
          ...(passAResult?.themes_industry?.en  || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
        ],
        top_praises:      passAResult?.top_strength    || { en: [], fr: [] },
        top_issues:       passAResult?.top_issues      || { en: [], fr: [] },
        summary:          summaryData,
        themes_universal: passAResult?.themes_universal || { en: [], fr: [] },
        themes_industry:  detection.confidence >= 45
          ? (passAResult?.themes_industry || { en: [], fr: [] })
          : { en: [], fr: [] },
        pain_points_prioritized: passDResult?.pain_points_prioritized || { en: [], fr: [] },
        recommendations_quick_wins: {
          en: passDResult?.recommendations?.en?.quick_wins_7_days || [],
          fr: passDResult?.recommendations?.fr?.quick_wins_7_days || [],
        },
        recommendations_projects: {
          en: passDResult?.recommendations?.en?.projects_30_days || [],
          fr: passDResult?.recommendations?.fr?.projects_30_days || [],
        },
        reply_templates: passDResult?.reply_templates || {
          en: { positive: [], neutral: [], negative: [] },
          fr: { positive: [], neutral: [], negative: [] },
        },
        summary_one_liner:           { en: summaryData.en.one_liner,           fr: summaryData.fr.one_liner           },
        summary_what_customers_love: { en: summaryData.en.what_customers_love, fr: summaryData.fr.what_customers_love },
        summary_what_customers_hate: { en: summaryData.en.what_customers_hate, fr: summaryData.fr.what_customers_hate },
      };

      const { data: upsertedInsight, error: insightError } = await supabaseAdmin
        .from('review_insights')
        .upsert(payload, { onConflict: 'user_id,place_id' })
        .select('place_id, user_id, last_analyzed_at');

      if (insightError) console.error("❌ UPSERT FAILED:", insightError);
      else console.log("✅ review_insights saved:", upsertedInsight);

      const qualResp = await fetch(`${SUPABASE_URL}/functions/v1/qualitative-analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, placeId: place_id, reviews: sampleTexts,
          themesUniversal: passAResult?.themes_universal || { en: [], fr: [] },
          themesIndustry:  passAResult?.themes_industry  || { en: [], fr: [] },
        }),
      });
      if (!qualResp.ok) throw new Error("qualitative-analysis failed");

      if (importantUpdatesEnabled && notificationDecision.send && notificationDecision.reason && userEmail) {
        try {
          const locale = outputLanguage === "fr" ? "fr-FR" : "en-US";
          const reportMonthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date());
          await sendSignificantChangeNotification({
            language: outputLanguage, displayName, userEmail, establishmentName, reportMonthName,
            previousAvg: prevAvg, currentAvg: stats.overall,
            ratingDrop: (prevAvg ?? 0) - (stats.overall ?? 0),
            issues: currentIssues, reason: notificationDecision.reason,
          });
          console.log('[analyze-reviews-v2] Notification sent', { reason: notificationDecision.reason, userId, place_id });
        } catch (notifErr) {
          console.error('[analyze-reviews-v2] Notification failed:', notifErr);
        }
      }

      await supabaseAdmin.from('establishments').update({
        business_type:            detection.type,
        business_type_confidence: detection.confidence,
        business_type_candidates: detection.candidates,
        business_type_source:     detection.source,
        analysis_version:         'v2-auto-universal',
      }).eq('place_id', place_id).eq('user_id', userId);
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