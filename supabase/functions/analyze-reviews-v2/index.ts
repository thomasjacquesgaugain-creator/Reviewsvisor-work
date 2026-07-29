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
  // ─ Auto repair / mechanic-leaning canonical themes (kept generic enough to
  //   match across slightly different shop types — body shop, garage, tire shop) ─
  diagnostic_accuracy: ['diagnostic accuracy', 'misdiagnosis', 'correct diagnosis', 'diagnostic correct', 'mauvais diagnostic', 'diagnostic erroné', 'diagnostic errone'],
  repair_quality:      ['repair quality', 'repair correctness', 'qualité de la réparation', 'qualite de la reparation', 'mauvaise réparation', 'mauvaise reparation', 'workmanship'],
  parts_quality:       ['parts quality', 'genuine parts', 'pièces détachées', 'pieces detachees', 'qualité des pièces', 'qualite des pieces', 'oem parts'],
  turnaround_time:     ['turnaround time', 'repair time', 'délai de réparation', 'delai de reparation', 'temps de réparation', 'temps de reparation'],
  warranty_comeback:   ['warranty', 'comeback', 'garantie', 'même panne', 'meme panne', 'repeat issue', 'recurring problem'],
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
const UNIVERSAL_THEME_KEYS = new Set<string>([
  'cleanliness', 'price', 'wait_time', 'communication', 'after_sales', 'trust',
]);

type ThemeBucket = 'universal' | 'industry';

function classifyThemeBucket(canonicalKey: string): ThemeBucket {
  return UNIVERSAL_THEME_KEYS.has(canonicalKey) ? 'universal' : 'industry';
}
const UNIVERSAL_MATCH_KEYS = new Set<string>(['cleanliness', 'price', 'wait_time', 'communication', 'after_sales', 'trust']);

const UNIVERSAL_MATCH_DEFINITIONS = `
  cleanliness   → hygiene, tidiness, dirt, sanitation of the premises, product, or equipment
  price         → cost, value for money, feeling overcharged or underpriced — for the service/experience AS A WHOLE
  wait_time     → how long the customer waited to be served, seen, helped, or to receive their order/result
  communication → responsiveness, clarity, being kept informed, follow-up contact, reachability
  after_sales   → what happens AFTER the transaction: support, warranty handling, complaint resolution, follow-up
  trust         → honesty, reliability, feeling deceived, misled, or reassured by the business`;

function normalizeUniversalMatch(raw: unknown): string | null {
  const s = String(raw ?? '').toLowerCase().trim();
  return UNIVERSAL_MATCH_KEYS.has(s) ? s : null;
}
function classifyParetoIssues(items: any[]): any[] {
  return (items ?? []).map((item: any) => {
    const universalKey = normalizeUniversalMatch(item?.universal_match);
    if (universalKey) {
      return { ...item, key: universalKey, target_bucket: 'universal' as const };
    }
    return { ...item, key: resolveThemeKey(item?.theme ?? ''), target_bucket: 'industry' as const };
  });
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

function reconcileSentiment(item: any): 'positive' | 'mixed' | 'negative' {
  const pos = Number(item?.positive_count);
  const neg = Number(item?.negative_count);
  const hasCounts = Number.isFinite(pos) && Number.isFinite(neg) && (pos > 0 || neg > 0);

  if (hasCounts) {
    if (pos > 0 && neg === 0) return 'positive';
    if (neg > 0 && pos === 0) return 'negative';
    if (pos > 0 && neg > 0)   return 'mixed';
  }
  return normalizeSentiment(item?.sentiment);
}

function hasReliableCounts(item: any): boolean {
  const pos = Number(item?.positive_count);
  const neg = Number(item?.negative_count);
  return Number.isFinite(pos) && Number.isFinite(neg) && (pos > 0 || neg > 0);
}

function reconcileItemFields(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    ...(item.sentiment !== undefined && { sentiment: reconcileSentiment(item) }),
    ...(item.root_causes !== undefined && { root_causes: enforceRootCauses(item.root_causes) }),
  }));
}


function enforceKeys(bilingual: { en: any[]; fr: any[] }): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(bilingual?.en) ? bilingual.en : [];
  const frItems = Array.isArray(bilingual?.fr) ? bilingual.fr : [];

  const keyedEn = enItems.map((item) => ({ ...item, key: resolveThemeKey(item.theme ?? '') }));
  const keyedFr = frItems.map((item, i) => ({
    ...item,
    key: keyedEn[i]?.key ?? resolveThemeKey(item.theme ?? ''),
  }));

  return { en: reconcileItemFields(keyedEn), fr: reconcileItemFields(keyedFr) };
}

function reconcileThemeFields(bilingual: { en: any[]; fr: any[] }): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(bilingual?.en) ? bilingual.en : [];
  const frItems = Array.isArray(bilingual?.fr) ? bilingual.fr : [];
  return { en: reconcileItemFields(enItems), fr: reconcileItemFields(frItems) };
}

// ─── TOP ISSUES — KEY PERSISTENCE ACROSS RUNS ───────────────────────────────

function normalizeThemeText(theme: string): string {
  return String(theme ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function themeWordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalizeThemeText(a).split(' ').filter(Boolean));
  const wordsB = new Set(normalizeThemeText(b).split(' ').filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const TOP_ISSUE_MATCH_THRESHOLD = 0.5;

function reconcileTopIssueKeysWithPrevious(
  newTopIssues: { en: any[]; fr: any[] },
  previousTopIssuesEn: any[],
): { en: any[]; fr: any[] } {
  const newEn = Array.isArray(newTopIssues?.en) ? newTopIssues.en : [];
  const newFr = Array.isArray(newTopIssues?.fr) ? newTopIssues.fr : [];
  const previous = Array.isArray(previousTopIssuesEn) ? previousTopIssuesEn : [];

  if (previous.length === 0 || newEn.length === 0) return { en: newEn, fr: newFr };

  const usedPrevKeys = new Set<string>();
  const keyRemap = new Map<string, string>(); // this-run key -> reused previous key

  for (const issue of newEn) {
    const originalKey = issue.key;
    let bestMatch: any = null;
    let bestScore = 0;

    for (const prev of previous) {
      if (!prev?.key || usedPrevKeys.has(prev.key)) continue;

      if (prev.key === originalKey) { bestMatch = prev; bestScore = 1; break; }
      if (normalizeThemeText(prev.theme) === normalizeThemeText(issue.theme)) {
        bestMatch = prev; bestScore = 1; break;
      }

      const score = themeWordOverlap(prev.theme ?? '', issue.theme ?? '');
      if (score > bestScore && score >= TOP_ISSUE_MATCH_THRESHOLD) {
        bestScore = score;
        bestMatch = prev;
      }
    }

    if (bestMatch) {
      usedPrevKeys.add(bestMatch.key);
      keyRemap.set(originalKey, bestMatch.key);
      issue.key = bestMatch.key;
      console.log(`[reconcileTopIssueKeys] "${issue.theme}" matched previous "${bestMatch.theme}" (score ${bestScore.toFixed(2)}) — key reused: ${bestMatch.key}`);
    } else {
      console.log(`[reconcileTopIssueKeys] "${issue.theme}" is new — assigning fresh key: ${originalKey}`);
    }
  }

  const remappedFr = newFr.map((item: any) => {
    const reused = keyRemap.get(item.key);
    return reused ? { ...item, key: reused } : item;
  });

  return { en: newEn, fr: remappedFr };
}

// ─── PARETO → THEME ANALYSIS ALIGNMENT ──────────────────────────────────────

type ParetoIssueForPassA = {
  key: string;
  theme: string;
  count: number;
  target_bucket: ThemeBucket;
};
function tagParetoIssuesWithBucket(topIssuesEn: any[]): ParetoIssueForPassA[] {
  return (topIssuesEn ?? []).map((issue: any) => ({
    key: issue.key,
    theme: issue.theme,
    count: issue.count ?? 0,
    target_bucket: (issue.target_bucket === 'universal' || issue.target_bucket === 'industry')
      ? issue.target_bucket
      : classifyThemeBucket(issue.key),
  }));
}

const SENTIMENT_FALLBACK_BY_RANK: Array<'negative' | 'mixed'> = ['negative', 'negative', 'negative', 'mixed', 'mixed'];

function sentimentFallbackForRank(rankIndex: number): 'negative' | 'mixed' {
  return SENTIMENT_FALLBACK_BY_RANK[rankIndex] ?? (rankIndex < 3 ? 'negative' : 'mixed');
}

function buildAlignedThemeEntry(paretoIssue: any, existingEntry: any | null, rankIndex: number): any {
  const base = existingEntry
    ? { ...existingEntry }
    : {
        key: paretoIssue.key,
        theme: paretoIssue.theme,
        importance: 50,
        count: paretoIssue.count ?? 0,
        positive_count: 0,
        negative_count: paretoIssue.count ?? 0,
        what_it_means: '',
        evidence_quotes: [],
      };

  base.key = paretoIssue.key;
  base.theme = paretoIssue.theme;

  if (hasReliableCounts(base)) {
    base.sentiment = reconcileSentiment(base);
  } else {
    base.sentiment = sentimentFallbackForRank(rankIndex);
    console.log(
      `[curateThemeAnalysis] "${paretoIssue.theme}" (rank ${rankIndex + 1}) had no reliable ` +
      `positive/negative counts — using tier-default sentiment "${base.sentiment}" rather than ` +
      `inventing counts.`,
    );
  }

  return base;
}

const THEME_PARETO_SLICE_MAX = 4;

const THEME_POSITIVE_MIN = 2;
const THEME_POSITIVE_MAX = 3;

function strengthToThemeEntry(strengthItem: any): any {
  const count = Number(strengthItem?.count) || 0;
  return {
    key: strengthItem?.key,
    theme: strengthItem?.theme,
    sentiment: 'positive' as const,
    importance: strengthItem?.impact === 'dominant' ? 90 : strengthItem?.impact === 'high' ? 75 : 60,
    count,
    positive_count: count,
    negative_count: 0,
    what_it_means: strengthItem?.ai_synthesis ?? '',
    evidence_quotes: Array.isArray(strengthItem?.evidence) ? strengthItem.evidence : [],
  };
}
function curateThemeAnalysis(passAResult: any, paretoIssuesEn: any[], paretoIssuesFr: any[]): void {
  if (!Array.isArray(paretoIssuesEn) || paretoIssuesEn.length === 0) return;

  const paretoSliceEn = paretoIssuesEn.slice(0, THEME_PARETO_SLICE_MAX);
  const paretoSliceFr = (paretoIssuesFr ?? []).slice(0, THEME_PARETO_SLICE_MAX);

  const excludedParetoKeys = new Set(paretoIssuesEn.slice(THEME_PARETO_SLICE_MAX).map((i: any) => i.key));

  const universalEn = Array.isArray(passAResult?.themes_universal?.en) ? passAResult.themes_universal.en : [];
  const industryEn  = Array.isArray(passAResult?.themes_industry?.en)  ? passAResult.themes_industry.en  : [];
  const universalFr = Array.isArray(passAResult?.themes_universal?.fr) ? passAResult.themes_universal.fr : [];
  const industryFr  = Array.isArray(passAResult?.themes_industry?.fr)  ? passAResult.themes_industry.fr  : [];

  const byKeyEn = new Map([...universalEn, ...industryEn].map((t: any) => [t.key, t]));
  const byKeyFr = new Map([...universalFr, ...industryFr].map((t: any) => [t.key, t]));
  const frThemeByKey = new Map(paretoSliceFr.map((i: any) => [i.key, i.theme]));

  // ── Step 1: pin the top-slice Pareto issues (negative/mixed backbone) ──
  const pinnedUniversalEn: any[] = [];
  const pinnedIndustryEn: any[] = [];
  const pinnedUniversalFr: any[] = [];
  const pinnedIndustryFr: any[] = [];
  const pinnedKeys = new Set<string>();

  paretoSliceEn.forEach((paretoIssue: any, idx: number) => {
    const bucket: ThemeBucket = (paretoIssue.target_bucket === 'universal' || paretoIssue.target_bucket === 'industry')
      ? paretoIssue.target_bucket
      : classifyThemeBucket(paretoIssue.key);
    const existingEn = byKeyEn.get(paretoIssue.key) ?? null;
    const existingFr = byKeyFr.get(paretoIssue.key) ?? null;

    const alignedEn = buildAlignedThemeEntry(paretoIssue, existingEn, idx);
    const alignedFr = {
      ...(existingFr ?? alignedEn),
      key: paretoIssue.key,
      theme: frThemeByKey.get(paretoIssue.key) ?? existingFr?.theme ?? paretoIssue.theme,
      sentiment: alignedEn.sentiment,
      importance: alignedEn.importance,
      count: alignedEn.count,
      positive_count: alignedEn.positive_count,
      negative_count: alignedEn.negative_count,
    };

    if (bucket === 'universal') { pinnedUniversalEn.push(alignedEn); pinnedUniversalFr.push(alignedFr); }
    else { pinnedIndustryEn.push(alignedEn); pinnedIndustryFr.push(alignedFr); }
    pinnedKeys.add(paretoIssue.key);
  });

  // ── Step 2: curate the positive slice ───────────────────────────────────
  const byImportanceDesc = (a: any, b: any) => (Number(b.importance) || 0) - (Number(a.importance) || 0);

  const passAPositiveCandidates = [...universalEn, ...industryEn]
    .filter((t: any) => !pinnedKeys.has(t.key) && !excludedParetoKeys.has(t.key) && t.sentiment === 'positive')
    .sort(byImportanceDesc);

  const positiveEn: any[] = [];
  const positiveKeys = new Set<string>();
  for (const cand of passAPositiveCandidates) {
    if (positiveEn.length >= THEME_POSITIVE_MAX) break;
    positiveEn.push(cand);
    positiveKeys.add(cand.key);
  }

  if (positiveEn.length < THEME_POSITIVE_MIN) {
    const strengthEn = Array.isArray(passAResult?.top_strength?.en) ? passAResult.top_strength.en : [];
    const backfillCandidates = strengthEn
      .filter((s: any) => !pinnedKeys.has(s.key) && !positiveKeys.has(s.key))
      .sort((a: any, b: any) => (Number(b.count) || 0) - (Number(a.count) || 0));
    for (const s of backfillCandidates) {
      if (positiveEn.length >= THEME_POSITIVE_MAX) break;
      const entry = strengthToThemeEntry(s);
      positiveEn.push(entry);
      positiveKeys.add(entry.key);
      console.log(
        `[curateThemeAnalysis] Backfilled positive theme "${entry.theme}" from top_strength — ` +
        `Pass A didn't independently surface enough distinct positive themes.`,
      );
    }
  }

  if (positiveEn.length < THEME_POSITIVE_MIN) {
    console.warn(
      `[curateThemeAnalysis] Only found ${positiveEn.length} positive theme(s), below the ` +
      `${THEME_POSITIVE_MIN}-theme target — not fabricating praise unsupported by the reviews.`,
    );
  }

  const strengthFr = Array.isArray(passAResult?.top_strength?.fr) ? passAResult.top_strength.fr : [];
  const strengthFrByKey = new Map(strengthFr.map((s: any) => [s.key, s]));

  const positiveFr = positiveEn.map((enItem: any) => {
    const frTheme = byKeyFr.get(enItem.key);
    if (frTheme) return frTheme;
    const frStrength = strengthFrByKey.get(enItem.key);
    if (frStrength) return strengthToThemeEntry(frStrength);
    return { ...enItem };
  });

  const positiveUniversalEn: any[] = [];
  const positiveIndustryEn: any[] = [];
  const positiveUniversalFr: any[] = [];
  const positiveIndustryFr: any[] = [];

  positiveEn.forEach((item: any, idx: number) => {
    const naturalBucket: ThemeBucket = universalEn.some((t: any) => t.key === item.key)
      ? 'universal'
      : industryEn.some((t: any) => t.key === item.key)
        ? 'industry'
        : classifyThemeBucket(resolveThemeKey(item.theme ?? ''));
    if (naturalBucket === 'universal') { positiveUniversalEn.push(item); positiveUniversalFr.push(positiveFr[idx]); }
    else { positiveIndustryEn.push(item); positiveIndustryFr.push(positiveFr[idx]); }
  });

  const usedKeys = new Set([...pinnedKeys, ...positiveKeys]);
  const extraUniversalEn = universalEn.filter((t: any) => !usedKeys.has(t.key) && !excludedParetoKeys.has(t.key)).sort(byImportanceDesc);
  const extraIndustryEn  = industryEn.filter((t: any) => !usedKeys.has(t.key) && !excludedParetoKeys.has(t.key)).sort(byImportanceDesc);
  const extraUniversalFr = universalFr.filter((t: any) => !usedKeys.has(t.key) && !excludedParetoKeys.has(t.key));
  const extraIndustryFr  = industryFr.filter((t: any) => !usedKeys.has(t.key) && !excludedParetoKeys.has(t.key));

  passAResult.themes_universal = {
    en: [...pinnedUniversalEn, ...positiveUniversalEn, ...extraUniversalEn],
    fr: [...pinnedUniversalFr, ...positiveUniversalFr, ...extraUniversalFr],
  };
  passAResult.themes_industry = {
    en: [...pinnedIndustryEn, ...positiveIndustryEn, ...extraIndustryEn],
    fr: [...pinnedIndustryFr, ...positiveIndustryFr, ...extraIndustryFr],
  };
}

// ─── MISC HELPERS ────────────────────────────────────────────────────────────

function getUniversalThemes() {
  return {
    en: ['Cleanliness', 'Price', 'Wait Time', 'Communication', 'After-sales Service', 'Trust'],
    fr: ['Propreté', 'Prix', 'Attente', 'Communication', 'SAV', 'Confiance'],
  };
}


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

const KNOWN_SECTORS = new Set<BusinessType>(Object.keys(SECTOR_THEME_HINTS) as BusinessType[]);

function isKnownSector(type: string): type is BusinessType {
  return KNOWN_SECTORS.has(type as BusinessType);
}

function getSectorHints(businessType: string): { en: string[]; fr: string[] } | null {
  return isKnownSector(businessType) ? SECTOR_THEME_HINTS[businessType] : null;
}

function getCategoryContext(businessType: string): string | null {
  return isKnownSector(businessType) ? BUSINESS_CATEGORY_CONTEXT[businessType] : null;
}

function buildIndustryInstruction(businessType: string, businessTypeConfidence: number): string {

  if (businessTypeConfidence <= 0) {
    return `Do not invent industry-specific themes — focus on universal themes only.`;
  }

  const hints = getSectorHints(businessType);

  if (hints) {
    return `This business is a ${businessType}. Extract as many genuinely sector-specific
   themes as the reviews support — these are the heart of a useful analysis for
   this business type, more so than the universal themes.
   Prioritise themes from this list if they appear in the reviews:
   EN: ${hints.en.join(', ')}
   FR: ${hints.fr.join(', ')}
   Add additional sector-specific themes not in the list above if the reviews
   clearly mention something specific to how a ${businessType} operates.
   Aim for at least 3-4 qualifying industry themes (count ≥ 2) if the review
   content supports it — this directly determines whether top_issues can meet
   its sector-theme quota below.`;
  }

  return `This business is a ${businessType}. There is no predefined theme list for
   this exact business type. Do NOT default to generic, business-agnostic
   themes — instead, reason about what actually matters operationally for a
   ${businessType} and derive sector-specific themes directly from what
   reviewers discuss. For example, for an auto repair shop the meaningful
   sector themes would be things like diagnostic accuracy, repair
   correctness/comebacks, parts quality (genuine vs aftermarket), turnaround
   time, and quote/pricing transparency — NOT generic "service quality" or
   "price" alone. Apply the same kind of trade-specific thinking to whatever
   ${businessType} actually is.
   Extract as many genuinely sector-specific themes as the reviews support —
   these are the heart of a useful analysis for this business type, more so
   than the universal themes.
   Aim for at least 3-4 qualifying industry themes (count ≥ 2) if the review
   content supports it — this directly determines whether top_issues can meet
   its sector-theme quota below.`;
}

function buildCategoryContextBlock(businessType: string): string {
  const curated = getCategoryContext(businessType);
  if (curated) return curated;

  return `
    This business type ("${businessType}") has no predefined 5M definitions.
    Reason about each category specifically for how a ${businessType}
    actually operates — do not use generic, business-agnostic definitions.
    For example, for an auto repair shop:
      manpower    → technician skill, diagnostic accuracy, communication, honesty about needed work
      method      → intake/diagnostic process, quoting process, repair workflow, quality-check before handover
      machine     → diagnostic tools, lifts, specialized repair equipment, calibration tools
      material    → parts quality (OEM vs aftermarket), parts availability/sourcing, fluids/consumables
      environment → shop cleanliness, waiting area, safety, turnaround space
    Apply the same kind of trade-specific reasoning to derive manpower /
    method / machine / material / environment definitions for a
    ${businessType}, grounded only in what the reviews actually describe.`;
}

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


function sampleReviewTexts(rows: ReviewRow[], cap: number): string[] {
  const withText = rows.filter(r => !!r.text);
  if (withText.length <= cap) return withText.map(r => r.text!);

  const low  = withText.filter(r => (r.rating ?? 0) <= 2);
  const mid  = withText.filter(r => (r.rating ?? 0) === 3);
  const high = withText.filter(r => (r.rating ?? 0) >= 4);
  const total = withText.length;
  const takeLow  = Math.min(low.length,  Math.ceil(cap * (low.length  / total)) || low.length);
  const takeMid  = Math.min(mid.length,  Math.ceil(cap * (mid.length  / total)) || mid.length);
  const remaining = Math.max(0, cap - takeLow - takeMid);
  const takeHigh = Math.min(high.length, remaining);

  const pick = (arr: ReviewRow[], n: number) => arr.slice(0, n).map(r => r.text!);
  return [...pick(low, takeLow), ...pick(mid, takeMid), ...pick(high, takeHigh)];
}

function detectBusinessType(
  name: string,
  outscraperType?: string | null,
  reviewsTexts?: string[],
): { type: string; confidence: number; candidates: Array<{ type: string; confidence: number }>; source: 'places' | 'keywords' | 'manual' } {
  if (outscraperType) {
    return { type: outscraperType, confidence: 90, candidates: [{ type: outscraperType, confidence: 90 }], source: 'places' };
  }

  const combinedText = `${name} ${(reviewsTexts || []).join(' ')}`.toLowerCase();

  const keywords: Record<BusinessType, string[]> = {
    restaurant:       ['restaurant', 'diner', 'bistro', 'brasserie', 'cafe', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'eat', 'meal', 'dish'],
    salon_coiffure:   ['hairdresser', 'hair stylist', 'salon', 'barber', 'hair', 'coloring', 'cut', 'hairstyle'],
    salle_sport:      ['gym', 'fitness', 'sport', 'bodybuilding', 'crossfit', 'yoga', 'coach'],
    serrurier:        ['locksmith', 'locksmith service', 'repair', 'key', 'lock', 'emergency'],
    retail_chaussures:['shoe', 'shoes', 'sneaker', 'sneakers', 'store', 'shop'],
    institut_beaute:  ['beauty institute', 'beauty', 'esthetic', 'care', 'massage', 'hair removal'],
    autre:            [],
  };

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
- Never translate: keys, sentiment values, count/impact numbers, or any review quotes
- OUTPUT LANGUAGE IS INDEPENDENT OF INPUT LANGUAGE: the source reviews you
  are given may be written in French, English, or a mix of both — this has
  NO bearing on which language each branch must be written in. Every
  translatable field in the "en" branch MUST be written entirely in
  natural English, and every translatable field in the "fr" branch MUST be
  written entirely in natural French, regardless of what language the
  underlying reviews use. Before finalizing your answer, re-read every
  string you wrote into the "en" branch and confirm it contains no French
  words or phrasing — translate anything you find before responding.`;


// ─── PASS A — THEME EXTRACTION ───────────────────────────────────────────────

function buildConfirmedIssuesBlock(confirmedIssues: ParetoIssueForPassA[]): string {
  if (!confirmedIssues.length) return '';
  return `
CONFIRMED ISSUES (from the prioritized problem analysis already run on this
business's negative reviews) — these are NOT optional and NOT open to
re-interpretation:
${confirmedIssues.map(i =>
    `  - key: "${i.key}" | name: "${i.theme}" | must appear in: themes_${i.target_bucket}`
  ).join('\n')}

For EVERY confirmed issue listed above, your output MUST include one entry,
in the exact bucket indicated, that:
  • uses this EXACT "key" value (do not alter it, do not re-slugify it)
  • uses this EXACT "theme" name in English (translate naturally to French
    for the fr branch, but never rename, split, or merge the underlying
    problem — it must remain recognizably the same issue)
  • computes sentiment, importance, count, positive_count and negative_count
    from ALL reviews below (not just negative ones) — a confirmed issue may
    turn out "mixed" here even though it was raised only in negative reviews
    during the earlier pass, because you're now also counting praise
  • do NOT drop, rename, or silently merge any confirmed issue into another`;
}


async function analyzePassA(
  placeName: string,
  samples: string[],
  totalReviews: number,
  businessType: string,
  businessTypeConfidence: number,
  confirmedIssues: ParetoIssueForPassA[] = [],
) {
  const industryInstruction = buildIndustryInstruction(businessType, businessTypeConfidence);
  const confirmedIssuesBlock = buildConfirmedIssuesBlock(confirmedIssues);

  return callOpenAI([
    {
      role: "system",
      content: `You are a customer review analyst. Your job in this pass is (1) to find
the business's top strengths, and (2) to characterize an already-decided
list of issues using the full review set.
${SYSTEM_RULES}
${BILINGUAL_RULE}
Do NOT include any quotes or evidence in this pass — that is handled separately.
Do NOT discover new themes beyond the confirmed issues below — that is a
separate, dedicated step run after this one.`,
    },
    {
      role: "user",
      content: `Business: ${placeName}
Type: ${businessType} (confidence: ${businessTypeConfidence}%)
Total reviews: ${totalReviews}

Business activity is the PRIMARY context for this analysis.

Interpret every review using the vocabulary, services and customer expectations of this business type.

${industryInstruction}
${confirmedIssuesBlock}
Reviews (numbered, ${samples.length} total):
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

COUNTING RULE:
Go through each review and count how many mention each theme — directly or by implication.
"count" = exact number of reviews. Do not estimate.

For each confirmed issue: assign sentiment ("positive"|"mixed"|"negative"), importance (0–100),
count, positive_count, negative_count, computed from ALL reviews above (not just negative ones).
  • positive_count = number of reviews with a genuine positive mention of this theme.
  • negative_count = number of reviews with a genuine negative mention of this theme.
  • count = positive_count + negative_count (do not include neutral/no-opinion mentions).

SENTIMENT ASSIGNMENT (STRICT)

Assign sentiment independently for every confirmed issue using the review evidence.

• "positive" = almost all mentions of this theme are positive.
• "negative" = almost all mentions of this theme are negative.
• "mixed" = there are meaningful positive AND negative mentions of the same theme.

Do NOT use "mixed" as a default when uncertain. Do NOT classify a theme as
mixed because of one isolated opposite review.

Examples:
positive_count = 28, negative_count = 1  → Positive
positive_count = 17, negative_count = 2  → Positive
positive_count = 3,  negative_count = 14 → Negative
positive_count = 11, negative_count = 9  → Mixed
positive_count = 8,  negative_count = 7  → Mixed

Never change a confirmed issue's sentiment to hit some target distribution
— the sentiment must always be supported by the review counts, even if that
means several confirmed issues end up with the same sentiment.

RANKING RULE FOR top_strength:
  top_strength = 3–5 themes with the most positive mentions, sorted by count desc.
  • Find these independently from the full review set.
  • HARD EXCLUSION: a theme must NEVER appear in top_strength if its key or
    its underlying topic matches ANY confirmed issue listed above — even if
    that theme also has many positive mentions. Confirmed issues are already
    tracked as problems; they must not simultaneously be presented as a
    strength. If a confirmed issue is your best positive candidate, skip it
    and pick the next-best genuinely distinct positive theme instead.
  • When counts are similar, prefer the more sector-specific theme.
  • top_strength themes must have sentiment "positive".

Return this exact JSON shape (NO evidence_quotes or evidence arrays — leave them empty [], and themes_universal/themes_industry should contain ONLY one entry per confirmed issue above — no other themes). Note: every "theme" value in an "en" array must be written in English, and every "theme" value in a "fr" array must be written in French — this applies even to sector hint terms you were given in both languages above:
{
  "top_strength": {
    "en": [{ "key": "snake_case", "theme": "Name in English", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom en français", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "..." }]
  },
  "themes_universal": {
    "en": [{ "key": "snake_case", "theme": "Name in English", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "evidence_quotes": [] }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom en français", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "evidence_quotes": [] }]
  },
  "themes_industry": {
    "en": [{ "key": "snake_case", "theme": "Name in English", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "evidence_quotes": [] }],
    "fr": [{ "key": "same_key_as_en", "theme": "Nom en français", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "evidence_quotes": [] }]
  },
  "summary": {
    "en": { "one_liner": "...", "what_customers_love": [{ "theme": "...", "reason": "...", "count": 0 }], "what_customers_hate": [{ "theme": "...", "reason": "...", "count": 0 }] },
    "fr": { "one_liner": "...", "what_customers_love": [{ "theme": "...", "reason": "...", "count": 0 }], "what_customers_hate": [{ "theme": "...", "reason": "...", "count": 0 }] }
  }
}`,
    },
  ]);
}

// ─── TOP STRENGTH — GUARD AGAINST CONFIRMED-ISSUE COLLISION ─────────────────
// analyzePassA's prompt asks the model not to list a confirmed (Pareto)
// issue as a top_strength, but nothing enforces it — this is the code-level
// backstop, mirroring the confirmedKeySet filter already used in
// analyzeAdditionalThemes() below. Applied right after the Pass A call,
// before anything else (curateThemeAnalysis's backfill, etc.) reads
// top_strength.
function filterTopStrengthAgainstConfirmedIssues(
  topStrength: { en: any[]; fr: any[] } | undefined,
  confirmedIssues: ParetoIssueForPassA[],
): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(topStrength?.en) ? topStrength!.en : [];
  const frItems = Array.isArray(topStrength?.fr) ? topStrength!.fr : [];

  if (!confirmedIssues.length || !enItems.length) {
    return { en: enItems, fr: frItems };
  }

  const confirmedKeys = new Set(confirmedIssues.map((i) => i.key));
  const keptEn = enItems.filter((s: any) => !confirmedKeys.has(s?.key));
  const droppedEn = enItems.filter((s: any) => confirmedKeys.has(s?.key));

  if (droppedEn.length > 0) {
    console.warn(
      `[filterTopStrengthAgainstConfirmedIssues] Dropped ${droppedEn.length} ` +
      `top_strength item(s) that duplicated a confirmed issue: ` +
      `${droppedEn.map((s: any) => `"${s.theme}" (${s.key})`).join(', ')}`,
    );
  }

  const keptKeys = new Set(keptEn.map((s: any) => s.key));
  const keptFr = frItems.filter((s: any) => keptKeys.has(s?.key));

  return { en: keptEn, fr: keptFr };
}

// ─── TOP STRENGTH — TOP-UP TO A MINIMUM COUNT ───────────────────────────────
// filterTopStrengthAgainstConfirmedIssues() can legitimately shrink
// top_strength down to just 1-2 items when several of Pass A's positive
// picks collide with confirmed (Pareto) issues. Rather than shipping a
// thin list, backfill from the theme pools (which by this point also
// include Pass A2's additional-theme discoveries) — same top-up pattern
// used for top_issues via topUpTopIssuesTo5.
const TOP_STRENGTH_MIN = 3;

function themeToStrengthEntry(theme: any): any {
  const count = Number(theme?.positive_count ?? theme?.count) || 0;
  return {
    key: theme.key,
    theme: theme.theme,
    count,
    impact: count >= 10 ? 'high' : 'medium', // never "dominant" by default — that's reserved for Pass A's own top pick
    ai_synthesis: theme.what_it_means ?? '',
  };
}

function topUpTopStrength(
  topStrength: { en: any[]; fr: any[] },
  themesUniversal: { en: any[]; fr: any[] },
  themesIndustry: { en: any[]; fr: any[] },
  confirmedIssues: ParetoIssueForPassA[],
): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(topStrength?.en) ? topStrength.en : [];
  const frItems = Array.isArray(topStrength?.fr) ? topStrength.fr : [];

  if (enItems.length >= TOP_STRENGTH_MIN) {
    return { en: enItems, fr: frItems };
  }

  const confirmedKeys = new Set(confirmedIssues.map((i) => i.key));
  const existingKeys  = new Set(enItems.map((s: any) => s.key));

  const universalEn = Array.isArray(themesUniversal?.en) ? themesUniversal.en : [];
  const industryEn  = Array.isArray(themesIndustry?.en)  ? themesIndustry.en  : [];
  const universalFr = Array.isArray(themesUniversal?.fr) ? themesUniversal.fr : [];
  const industryFr  = Array.isArray(themesIndustry?.fr)  ? themesIndustry.fr  : [];

  const rankDesc = (a: any, b: any) =>
    (Number(b.positive_count ?? b.count) || 0) - (Number(a.positive_count ?? a.count) || 0);

  // Industry themes first (more useful/specific), then universal — same
  // ordering preference used elsewhere (e.g. topUpTopIssuesTo5).
  const candidates = [...industryEn, ...universalEn]
    .filter((t: any) => t.sentiment === 'positive' && !confirmedKeys.has(t.key) && !existingKeys.has(t.key))
    .sort(rankDesc);

  const needed = TOP_STRENGTH_MIN - enItems.length;
  const toAdd = candidates.slice(0, needed);

  if (toAdd.length > 0) {
    console.log(
      `[topUpTopStrength] Topping up top_strength from ${enItems.length} to ` +
      `${enItems.length + toAdd.length} using positive theme(s): ` +
      `${toAdd.map((t: any) => t.theme).join(', ')}`,
    );
  } else if (enItems.length < TOP_STRENGTH_MIN) {
    console.warn(
      `[topUpTopStrength] Only ${enItems.length} strength(s) and no further ` +
      `qualifying positive themes available to top up — shipping as-is. ` +
      `Positive review signal is genuinely thin for this business.`,
    );
  }

  const addedEn = toAdd.map(themeToStrengthEntry);

  const industryFrByKey  = new Map(industryFr.map((t: any) => [t.key, t]));
  const universalFrByKey = new Map(universalFr.map((t: any) => [t.key, t]));
  const addedFr = addedEn.map((enItem: any) => {
    const frTheme = industryFrByKey.get(enItem.key) ?? universalFrByKey.get(enItem.key);
    return frTheme ? themeToStrengthEntry(frTheme) : { ...enItem };
  });

  const combinedEn = [...enItems, ...addedEn].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));
  const combinedFr = [...frItems, ...addedFr].sort((a, b) => {
    const aCount = combinedEn.find((e) => e.key === a.key)?.count ?? 0;
    const bCount = combinedEn.find((e) => e.key === b.key)?.count ?? 0;
    return (Number(bCount) || 0) - (Number(aCount) || 0);
  });

  return { en: combinedEn, fr: combinedFr };
}

// ─── PASS A2 — DEDICATED NEW-THEME DISCOVERY ─────────────────────────────────


async function analyzeAdditionalThemes(
  samples: string[],
  confirmedIssues: ParetoIssueForPassA[],
  businessType: string,
  businessTypeConfidence: number,
): Promise<{ en: any[]; fr: any[] }> {
  if (!samples.length) return { en: [], fr: [] };

  const industryInstruction = buildIndustryInstruction(businessType, businessTypeConfidence);
  const alreadyCoveredList = confirmedIssues.length
    ? confirmedIssues.map(i => `  - "${i.theme}" (key: "${i.key}")`).join('\n')
    : '  (nothing yet covered)';

  const result = await callOpenAI([
    {
      role: "system",
      content: `You are a customer review analyst. Your ONLY job in this pass is to find
themes that are NOT already covered by an existing list — do not
re-describe, rename, split, or merge those already-covered issues.
${SYSTEM_RULES}
${BILINGUAL_RULE}
Do NOT include any quotes or evidence in this pass — that is handled separately.`,
    },
    {
      role: "user",
      content: `Business type: ${businessType} (confidence: ${businessTypeConfidence}%)
${industryInstruction}

ALREADY COVERED (do NOT repeat, rename, split, or merge these — find something else):
${alreadyCoveredList}

Reviews (numbered, ${samples.length} total):
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

TASK
Find 2 to 3 (up to 4 if clearly supported) DISTINCT themes from these
reviews that are genuinely separate topics from everything listed as
"ALREADY COVERED" above. Prefer themes with sentiment "positive" where the
reviews support it — genuine strengths customers praise that haven't been
captured yet — but include a genuinely distinct negative/mixed theme too if
that is what the reviews actually show and no additional positive topic
exists.

Do NOT:
  • restate an already-covered issue's positive or negative side under a new label
  • merge two already-covered issues into a "new" one
  • invent a theme not actually supported by at least 2 reviews

For each theme, compute:
  • positive_count = reviews with a genuine positive mention
  • negative_count = reviews with a genuine negative mention
  • count = positive_count + negative_count
  • sentiment: positive_count > 0 and negative_count = 0 → "positive";
    negative_count > 0 and positive_count = 0 → "negative"; both
    meaningfully present → "mixed" (never default to mixed out of
    uncertainty)
  • importance (0-100)
  • what_it_means: 1-2 sentences

UNIVERSAL_MATCH CLASSIFICATION (REQUIRED FOR EVERY THEME)
Classify each theme against this CLOSED, FIXED list of six universal
business concepts — concepts that apply the same way to ANY business:
${UNIVERSAL_MATCH_DEFINITIONS}
Set "universal_match" to the single closest code above ONLY if the theme is
fundamentally about that concept regardless of industry; otherwise "none".
When in doubt, choose "none". Never translate this field — it must be one
of the exact lowercase codes above, or the literal string "none".

Return ONLY this JSON. Note: "theme" in the "en" array must be the English
name (e.g. "Menu Variety"), and "theme" in the "fr" array must be the French
name (e.g. "Variété du menu") — do not swap them, even though the sector
hint lists above included both languages:
{
  "en": [{ "key": "snake_case", "theme": "Name in English", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "universal_match": "cleanliness|price|wait_time|communication|after_sales|trust|none", "evidence_quotes": [] }],
  "fr": [{ "key": "same_key_as_en", "theme": "Nom en français", "sentiment": "positive|mixed|negative", "importance": 0, "count": 0, "positive_count": 0, "negative_count": 0, "what_it_means": "...", "universal_match": "same_value_as_en", "evidence_quotes": [] }]
}`,
    },
  ]);

  if (!result?.en) return { en: [], fr: [] };

  const classifiedEnAll = classifyParetoIssues(result.en ?? []);
  const classifiedFrAll = (result.fr ?? []).map((item: any, i: number) => ({
    ...item,
    key: classifiedEnAll[i]?.key ?? resolveThemeKey(item?.theme ?? ''),
    target_bucket: classifiedEnAll[i]?.target_bucket ?? 'industry',
  }));

  // Belt-and-suspenders: drop anything that collided with a confirmed issue
  // key or repeated within this same response, even though the prompt
  // already instructs against it.
  const confirmedKeySet = new Set(confirmedIssues.map(i => i.key));
  const seenKeys = new Set<string>();
  const keepIdx: number[] = [];
  classifiedEnAll.forEach((item: any, i: number) => {
    if (confirmedKeySet.has(item.key) || seenKeys.has(item.key)) {
      console.log(`[analyzeAdditionalThemes] Dropping "${item.theme}" — duplicate of a confirmed issue or already seen in this response.`);
      return;
    }
    seenKeys.add(item.key);
    keepIdx.push(i);
  });

  const classifiedEn = keepIdx.map((i) => classifiedEnAll[i]);
  const classifiedFr = keepIdx.map((i) => classifiedFrAll[i]);

  return { en: reconcileItemFields(classifiedEn), fr: reconcileItemFields(classifiedFr) };
}

function mergeAdditionalThemesIntoPools(passAResult: any, additionalThemes: { en: any[]; fr: any[] }): void {
  const additionalEn = additionalThemes?.en ?? [];
  const additionalFr = additionalThemes?.fr ?? [];
  if (!additionalEn.length) return;

  const universalEn = Array.isArray(passAResult?.themes_universal?.en) ? passAResult.themes_universal.en : [];
  const industryEn  = Array.isArray(passAResult?.themes_industry?.en)  ? passAResult.themes_industry.en  : [];
  const universalFr = Array.isArray(passAResult?.themes_universal?.fr) ? passAResult.themes_universal.fr : [];
  const industryFr  = Array.isArray(passAResult?.themes_industry?.fr)  ? passAResult.themes_industry.fr  : [];

  additionalEn.forEach((item: any, idx: number) => {
    const bucket: ThemeBucket = (item.target_bucket === 'universal' || item.target_bucket === 'industry')
      ? item.target_bucket
      : classifyThemeBucket(item.key);
    const frItem = additionalFr[idx] ?? item;
    if (bucket === 'universal') { universalEn.push(item); universalFr.push(frItem); }
    else { industryEn.push(item); industryFr.push(frItem); }
  });

  passAResult.themes_universal = { en: universalEn, fr: universalFr };
  passAResult.themes_industry  = { en: industryEn,  fr: industryFr };
}

// ─── TOP ISSUES — DEDICATED PASS, INDEPENDENT OF THEME POOLS ────────────────


async function analyzeTopIssues(
  negativeTexts: string[],
  businessType: string,
  businessTypeConfidence: number,
) {
  if (!negativeTexts.length) {
    return { en: [], fr: [] };
  }

  const industryInstruction = buildIndustryInstruction(businessType, businessTypeConfidence);

  const result = await callOpenAI([
    {
      role: "system",
      content: `You are a customer review analyst identifying the most significant
problems a business should act on, based only on its negative reviews.
${SYSTEM_RULES}
${BILINGUAL_RULE}
Do NOT include any quotes or evidence in this pass — root-cause evidence is handled separately.`,
    },
    {
      role: "user",
      content: `Business type: ${businessType} (confidence: ${businessTypeConfidence}%)

Business activity is the PRIMARY context for this analysis.

Interpret every review using the vocabulary, services and customer expectations of this business type.

When naming Pareto issues:
• use industry-standard terminology
• describe the customer's observable problem
• avoid generic wording when a sector-specific term existsF

${industryInstruction}

NEGATIVE REVIEWS (${negativeTexts.length} total, rated 1–3 stars):
${negativeTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}

TASK
Go through these negative reviews yourself, from scratch, and identify the
most significant, recurring, operationally-fixable problems. Do this
directly from the review text — do not assume any particular theme list,
and do not limit yourself to generic complaint categories.

COUNT REQUIREMENT (hard constraint):
  • Return exactly 5 issues whenever the reviews support it.
  • Only return 4 if you genuinely cannot find a 5th distinct, multi-review
    problem — 4 is the floor, not a target. Never return fewer than 4.
  • Never return more than 5, and never return 3 or fewer. If the negative
    reviews only clearly support 2-3 distinct problems, broaden each issue
    slightly (e.g. group closely related complaints into one slightly
    broader issue, such as combining "cold food" and "slow plating" into a
    single "food quality on arrival" issue) so the list still reaches 4,
    rather than leaving real complaints in the reviews unrepresented.
  • Do not invent a problem that isn't in the reviews just to hit the
    count — broaden/merge real complaints first; only fall back to 4 if
    even broadening still can't produce a 5th genuinely distinct issue.PARETO ISSUE DEFINITION (VERY IMPORTANT)

A Pareto issue represents the CUSTOMER'S OBSERVABLE PROBLEM.

Describe WHAT customers experienced.

Do NOT describe WHY it happened.

Do NOT infer staff competence, management quality, training level, intentions, negligence or business practices unless customers explicitly complain about those subjects.

The Pareto issue must stay at the customer experience level.

Examples:

Hair Salon
✓ Unsatisfactory Hair Results
✓ Hair Colour Issues
✓ Appointment Management
✓ Long Waiting Times

NOT
✗ Incompetent Staff
✗ Poor Staff Training
✗ Unqualified Hairdresser

Restaurant
✓ Poor Service Quality
✓ Slow Service
✓ Food Temperature
✓ Incorrect Orders

NOT
✗ Incompetent Waiters
✗ Bad Kitchen Staff

Auto Repair
✓ Repair Not Resolved
✓ Repair Quality
✓ Diagnostic Accuracy
✓ Repair Delays

NOT
✗ Incompetent Mechanics

Pub / Bar
✓ Customer Behaviour
✓ Feeling of Insecurity
✓ Incident Management

NOT
✗ Dangerous Customers
✗ Unsafe Staff

LABEL STYLE RULES

Issue names must be:

• factual
• neutral
• observable
• business-oriented
• based directly on customer experience

Never use judgmental language.

Avoid labels like:

✗ incompetent
✗ terrible
✗ useless
✗ dishonest
✗ lazy
✗ unprofessional

Prefer neutral descriptions of the customer's experience.

Example:

✗ Incompetent Staff
✓ Poor Service Quality

✗ Bad Mechanic
✓ Repair Quality

✗ Dangerous Customers
✓ Customer Behaviour

✗ Bad Hairdresser
✓ Unsatisfactory Hair Results
  

SECTOR WEIGHTING (apply during selection, not as a quota):
${industryInstruction}
When multiple real problems are roughly similar in frequency/severity,
prefer the one that is more specific to how a ${businessType} actually
operates over a generic complaint (e.g. prefer a concrete sector-specific
problem actually present in the reviews over a generic "bad service" or
"too expensive" framing, if both are genuinely supported). Never invent a
sector-specific problem that isn't actually in the reviews just to satisfy
this preference — only weight among problems that are really there.

UNIVERSAL_MATCH CLASSIFICATION (REQUIRED FOR EVERY ISSUE)

Separately from everything above, classify each issue against this CLOSED,
FIXED list of six universal business concepts — concepts that apply the
same way to ANY business, regardless of industry:
${UNIVERSAL_MATCH_DEFINITIONS}

For each issue, set "universal_match" to:
  • the single closest code above (cleanliness | price | wait_time |
    communication | after_sales | trust) IF AND ONLY IF the issue is
    fundamentally and primarily about that concept, regardless of industry
  • "none" if the issue is fundamentally about something specific to how
    THIS ${businessType} delivers its actual product/service — the quality
    of the work performed, staff skill in performing the service itself,
    equipment used, ambiance, food/treatment/repair/product result, etc.

When in doubt between a universal fit and an industry-specific fit, choose
"none" — only tag universal_match when the issue would be described in
EXACTLY THE SAME WAY at a completely different type of business.

Examples:
  "Long Wait Times"        → wait_time
  "Slow to Respond"        → communication
  "High Prices"            → price
  "Dirty Facilities"       → cleanliness
  "Felt Deceived on Quote" → trust
  "No Follow-up After Repair" → after_sales
  "Food Quality"           → none  (specific to what a restaurant serves)
  "Unsatisfactory Hair Results" → none  (specific to what a salon delivers)
  "Noisy Environment"      → none  (ambiance is not one of the six concepts)
  "Poor Service Quality"   → none  (this is about how the service itself was performed, not one of the six)

Never translate "universal_match" — it must be one of the exact lowercase
codes above, or the literal string "none", identical in the EN and FR
branches for the same issue.

SELECTION RULES
  • Each issue must be something multiple reviewers actually complain about
    — not a single one-off complaint, unless it describes a severe incident.
  • "count" = number of distinct negative reviews that raise this problem.
    Count directly from the numbered reviews above — do not estimate.
  • Rank the final list by how much each issue matters operationally: a mix
    of how often the problem comes up AND how severe/damaging it sounds,
    not raw count alone.
  • impact: "dominant" for the single most damaging/frequent issue (use at
    most once), "high" for clearly significant issues, "medium" for the rest.
  • ai_synthesis: 1–2 sentences explaining what's actually going wrong and
    why it matters for this business, grounded in what reviewers said.

TITLE RULES (VERY IMPORTANT)
• "theme" must be a SHORT label only.
• Maximum 2-4 words (never more than 30 characters where possible).
• Do NOT describe the problem in a sentence.
• Do NOT include causes, explanations, or conjunctions.
• Think of it as a dashboard title.

Good examples:
✓ Slow Service
✓ Food Quality
✓ Long Wait Times
✓ Order Accuracy
✓ Staff Attitude
✓ High Prices
✓ Reservation Issues
✓ Cold Food
✓ Dirty Facilities
✓ Equipment Failures
✓ Poor Communication

Bad examples:
✗ Food quality and temperature were inconsistent
✗ Customers frequently complained about slow service during busy hours
✗ Staff were rude and inattentive
✗ Long waiting times before food arrived

Return ONLY this JSON. Note: "theme" in the "en" array must be the short
issue name in English, and "theme" in the "fr" array must be the short
issue name in French — this applies even to sector terminology you were
given in both languages above:
{
  "en": [{ "key": "snake_case", "theme": "Short issue name in English", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "...", "universal_match": "cleanliness|price|wait_time|communication|after_sales|trust|none" }],
  "fr": [{ "key": "same_key_as_en", "theme": "Nom court en français", "count": 0, "impact": "dominant|high|medium", "ai_synthesis": "...", "universal_match": "same_value_as_en" }]
}`,
    },
  ]);

  if (!result?.en) return { en: [], fr: [] };

  // Classify each issue's bucket + canonical key from the model's own
  // universal_match tag (semantic judgment), NOT from blind keyword
  // matching on the theme name — see classifyParetoIssues() above.
  const classifiedEn = classifyParetoIssues(result.en ?? []);
  const classifiedFr = (result.fr ?? []).map((item: any, i: number) => ({
    ...item,
    key: classifiedEn[i]?.key ?? resolveThemeKey(item?.theme ?? ''),
    target_bucket: classifiedEn[i]?.target_bucket ?? 'industry',
  }));

  const keyed = { en: reconcileItemFields(classifiedEn), fr: reconcileItemFields(classifiedFr) };
  return clampTopIssuesCount(keyed);
}
const TOP_ISSUES_MIN = 4;
const TOP_ISSUES_MAX = 5;

function impactRank(impact: unknown): number {
  if (impact === 'dominant') return 2;
  if (impact === 'high') return 1;
  return 0; // 'medium' or anything unrecognized
}

function clampTopIssuesCount(topIssues: { en: any[]; fr: any[] }): { en: any[]; fr: any[] } {
  const enItems = Array.isArray(topIssues?.en) ? topIssues.en : [];
  const frItems = Array.isArray(topIssues?.fr) ? topIssues.fr : [];

  if (enItems.length <= TOP_ISSUES_MAX) {
    if (enItems.length < TOP_ISSUES_MIN) {
      console.warn(
        `[clampTopIssuesCount] Only ${enItems.length} issue(s) extracted from ` +
        `negative reviews — below the ${TOP_ISSUES_MIN}-issue floor. Cannot ` +
        `fabricate additional issues that aren't in the reviews; shipping ` +
        `the list as-is. This usually means the negative review volume is ` +
        `genuinely thin for this business.`,
      );
    }
    return { en: enItems, fr: frItems };
  }

  // More than 5 — trim to the top 5 by impact tier, then count, desc.
  const sortedEn = [...enItems].sort((a, b) => {
    const impactDiff = impactRank(b.impact) - impactRank(a.impact);
    if (impactDiff !== 0) return impactDiff;
    return (Number(b.count) || 0) - (Number(a.count) || 0);
  });
  const keptEn = sortedEn.slice(0, TOP_ISSUES_MAX);
  const keptKeys = new Set(keptEn.map((i: any) => i.key));
  const keptFr = frItems.filter((i: any) => keptKeys.has(i.key));

  console.warn(
    `[clampTopIssuesCount] Model returned ${enItems.length} issues — trimmed ` +
    `to top ${TOP_ISSUES_MAX} by impact/count.`,
  );

  return { en: keptEn, fr: keptFr };
}

// ─── TOP-UP TO 5 ISSUES (HARD GUARANTEE) ────────────────────────────────────
function qualifiesForTopUp(theme: any): boolean {
  const sentiment = theme?.sentiment;
  const negCount = Number(theme?.negative_count);
  if (sentiment !== 'negative' && sentiment !== 'mixed') return false;
  return Number.isFinite(negCount) && negCount >= 2;
}

function themeToIssueShape(theme: any, bucket: ThemeBucket): any {
  const negCount = Number(theme.negative_count) || 0;
  return {
    key: theme.key,
    theme: theme.theme,
    count: negCount,
    impact: 'medium' as const, // re-ranked for display below; never "dominant" by default since it wasn't the model's own top pick
    ai_synthesis: theme.what_it_means ?? '',
    target_bucket: bucket,
  };
}

function topUpTopIssuesTo5(
  topIssues: { en: any[]; fr: any[] },
  themesIndustry: { en: any[]; fr: any[] },
  themesUniversal: { en: any[]; fr: any[] },
): { en: any[]; fr: any[] } {
  const issuesEn = Array.isArray(topIssues?.en) ? topIssues.en : [];
  const issuesFr = Array.isArray(topIssues?.fr) ? topIssues.fr : [];

  if (issuesEn.length >= TOP_ISSUES_MAX) {
    return { en: issuesEn, fr: issuesFr };
  }

  const existingKeys = new Set(issuesEn.map((i: any) => i.key));
  const industryEn  = Array.isArray(themesIndustry?.en)  ? themesIndustry.en  : [];
  const universalEn = Array.isArray(themesUniversal?.en) ? themesUniversal.en : [];
  const industryFr  = Array.isArray(themesIndustry?.fr)  ? themesIndustry.fr  : [];
  const universalFr = Array.isArray(themesUniversal?.fr) ? themesUniversal.fr : [];

  const rankDesc = (a: any, b: any) => (Number(b.negative_count) || 0) - (Number(a.negative_count) || 0);

  const candidateIndustry = industryEn
    .filter((t: any) => !existingKeys.has(t.key) && qualifiesForTopUp(t))
    .sort(rankDesc);
  const candidateUniversal = universalEn
    .filter((t: any) => !existingKeys.has(t.key) && qualifiesForTopUp(t))
    .sort(rankDesc);

  const needed = TOP_ISSUES_MAX - issuesEn.length;
  const candidateIndustryTagged  = candidateIndustry.map((t: any) => ({ theme: t, bucket: 'industry' as const }));
  const candidateUniversalTagged = candidateUniversal.map((t: any) => ({ theme: t, bucket: 'universal' as const }));
  const toAddTagged = [...candidateIndustryTagged, ...candidateUniversalTagged].slice(0, needed);

  if (toAddTagged.length > 0) {
    console.log(
      `[topUpTopIssuesTo5] Topping up top_issues from ${issuesEn.length} to ` +
      `${issuesEn.length + toAddTagged.length} using ${Math.min(toAddTagged.length, candidateIndustryTagged.length)} ` +
      `industry + ${Math.max(0, toAddTagged.length - candidateIndustryTagged.length)} universal theme(s).`,
    );
  } else if (issuesEn.length < TOP_ISSUES_MAX) {
    console.warn(
      `[topUpTopIssuesTo5] Only ${issuesEn.length} issue(s) and no further ` +
      `qualifying themes available to top up — shipping as-is. Negative ` +
      `review signal is genuinely thin for this business.`,
    );
  }

  const addedEn = toAddTagged.map(({ theme, bucket }) => themeToIssueShape(theme, bucket));
  const addedKeys = new Set(addedEn.map((i: any) => i.key));

  const industryFrByKey  = new Map(industryFr.map((t: any) => [t.key, t]));
  const universalFrByKey = new Map(universalFr.map((t: any) => [t.key, t]));
  const addedFr = addedEn.map((enItem: any) => {
    const frTheme = industryFrByKey.get(enItem.key) ?? universalFrByKey.get(enItem.key);
    return frTheme ? themeToIssueShape(frTheme, enItem.target_bucket) : { ...enItem };
  });

  // Combine and re-sort by count desc for display; re-assign "dominant" to
  // whichever single item now has the highest count (there should be
  // exactly one "dominant" — analyzeTopIssues' own prompt already enforces
  // this for its own items, and topped-up items default to "medium", so the
  // existing dominant item, if any, is preserved unless a topped-up item
  // genuinely has a higher count).
  const combinedEn = [...issuesEn, ...addedEn].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0));
  const combinedFr = [...issuesFr, ...addedFr].sort((a, b) => {
    const aCount = combinedEn.find((e) => e.key === a.key)?.count ?? 0;
    const bCount = combinedEn.find((e) => e.key === b.key)?.count ?? 0;
    return (Number(bCount) || 0) - (Number(aCount) || 0);
  });

  if (combinedEn.length > 0 && !combinedEn.some((i: any) => i.impact === 'dominant')) {
    combinedEn[0].impact = 'dominant';
    const frMatch = combinedFr.find((i: any) => i.key === combinedEn[0].key);
    if (frMatch) frMatch.impact = 'dominant';
  }

  return { en: combinedEn, fr: combinedFr };
}

// ─── PASS B — EVIDENCE EXTRACTION ────────────────────────────────────────────

type ThemeStub = { key: string; theme: string; sentiment?: string };

function toThemeStubs(items: any[]): ThemeStub[] {
  if (!Array.isArray(items)) return [];
  return items.map((i) => ({ key: i.key, theme: i.theme, ...(i.sentiment !== undefined && { sentiment: i.sentiment }) }));
}

function mergeQuotesIntoOriginal(original: any[], quoted: any[] | undefined, quoteField: string): any[] {
  const quotedByKey = new Map((quoted ?? []).map((q: any) => [q.key, q]));
  return (original ?? []).map((item: any) => {
    const match = quotedByKey.get(item.key);
    return { ...item, [quoteField]: Array.isArray(match?.[quoteField]) ? match[quoteField] : [] };
  });
}

async function analyzePassB(
  samples: string[],
  passAResult: any,
  businessType: string,
  businessTypeConfidence: number,
) {
  const themesUniversalEn = passAResult?.themes_universal?.en ?? [];
  const themesIndustryEn  = passAResult?.themes_industry?.en  ?? [];
  const topStrengthEn     = passAResult?.top_strength?.en     ?? [];

  const themesForQuotes = {
    themes_universal: toThemeStubs(themesUniversalEn),
    themes_industry:  toThemeStubs(themesIndustryEn),
    top_strength:     toThemeStubs(topStrengthEn),
  };

  const result = await callOpenAI([
    {
      role: "system",
      content: `You are extracting verbatim quotes from customer reviews to support pre-identified themes.
${SYSTEM_RULES}

Business type: ${businessType} (confidence: ${businessTypeConfidence}%)
Use this context to understand what each theme means for this sector:
${buildCategoryContextBlock(businessType)}

QUOTE RULES — these are absolute, no exceptions:
Q1. Every quote must be copied character-for-character from the numbered reviews below.
    Never paraphrase, shorten, summarize, or construct a quote.

Q2. Quotes are extracted once, in their original language. Do not translate
    anything — work only with the language each review is written in.

Q3. Sentiment matching for themes (evidence_quotes) — STRICT, no exceptions:
    - sentiment="positive" → quotes where the reviewer PRAISES this theme ONLY.
    - sentiment="negative" → quotes where the reviewer COMPLAINS about this
    - sentiment="mixed"    → the quote must itself contain BOTH an explicit
         positive element AND an explicit negative element about THIS SAME
         THEME, within one sentence or one tightly connected clause
         (e.g. joined by "but", "however", "mais", "cependant", "même si").
         STRICTLY FORBIDDEN for "mixed":
           ✗ A quote that is purely positive about the theme
           ✗ A quote that is purely negative about the theme
           ✗ Stitching together one positive quote + one separate negative
             quote (from the same or different reviews) to fake a mixed quote
           ✗ A quote about one theme combined with a quote about another
             theme, even if one is positive and one negative
         If, and only if, no single sentence/clause anywhere in the reviews
         satisfies this for a given mixed theme → evidence_quotes: [].
         A mixed theme with no qualifying quote MUST be left empty rather
         than filled with a one-sided quote. Do not relax this to "find
         something close enough."

Q4. top_strength evidence → praise quotes only, even from mixed reviews.
    Extract only the praise clause from original texts.

Q5. If no valid verbatim quote exists for a theme → empty array []. Never invent.

Before finalizing each "mixed" theme's evidence_quotes, re-check every
candidate quote against Q3 individually: does it, by itself, contain both a
positive element and a negative element about this exact theme? If you have
any doubt, leave it out rather than include a one-sided quote.

THEME MATCHING (MOST IMPORTANT)

Every extracted quote must satisfy BOTH conditions:

1. The quote must explicitly discuss the assigned theme.
2. The quote must match the required sentiment for that theme.

Theme relevance always has higher priority than sentiment.

Never choose a quote simply because it has the correct sentiment.

Examples

Theme: Food Quality
✓ "The steak was dry and tasteless."
✓ "The pizza was absolutely delicious."

✗ "The waiter was very friendly."
✗ "Beautiful atmosphere."

Theme: Service Speed
✓ "We waited over 40 minutes."
✓ "Food arrived within five minutes."

✗ "The burger was delicious."
✗ "Restaurant was clean."

If a quote is not primarily about the requested theme, it must never be used.



`,
    },
    {
      role: "user",
      content: `Reviews (numbered, ${samples.length} total):
${samples.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Themes to fill with quotes (key, theme, sentiment):
${JSON.stringify(themesForQuotes, null, 2)}

For each theme in themes_universal and themes_industry:
  →Fill evidence_quotes[] only with verbatim quotes that satisfy ALL of the following:

1. The quote is primarily about the assigned theme.
2. The quote supports the assigned sentiment.
3. The quote contains sufficient wording to clearly identify the theme.
4. If multiple candidate quotes exist, always choose the quote that is most specifically about the theme rather than a more general customer experience.
  → For "mixed" themes specifically: each quote must individually contain
    both a positive and a negative element about that theme — never a purely
    positive quote, never a purely negative quote, never two quotes stitched
    together. If none qualifies, evidence_quotes: [].

For each item in top_strength:
  → Fill evidence[] with praise-only verbatim quotes (rule Q4)

Return ONLY the key and the quotes array for each item — no other fields:
{
  "themes_universal": [{ "key": "...", "evidence_quotes": [] }],
  "themes_industry":  [{ "key": "...", "evidence_quotes": [] }],
  "top_strength":     [{ "key": "...", "evidence": [] }]
}`,
    },
  ]);

  if (!result) return null;

  // Reconstruct full bilingual shape: merge quotes back into the original
  // (full-field) EN items by key, then mirror the identical quote arrays
  // into FR — FR quotes are never translated, so there's nothing to ask the
  // model for here, just a structural copy keyed by the same `key`.
  const mergedUniversalEn = mergeQuotesIntoOriginal(themesUniversalEn, result.themes_universal, "evidence_quotes");
  const mergedIndustryEn  = mergeQuotesIntoOriginal(themesIndustryEn,  result.themes_industry,  "evidence_quotes");
  const mergedStrengthEn  = mergeQuotesIntoOriginal(topStrengthEn,     result.top_strength,     "evidence");

  const quotesByKeyUniversal = new Map(mergedUniversalEn.map((i: any) => [i.key, i.evidence_quotes]));
  const quotesByKeyIndustry  = new Map(mergedIndustryEn.map((i: any) => [i.key, i.evidence_quotes]));
  const evidenceByKeyStrength = new Map(mergedStrengthEn.map((i: any) => [i.key, i.evidence]));

  const mergedUniversalFr = (passAResult?.themes_universal?.fr ?? []).map((item: any) => ({
    ...item,
    evidence_quotes: quotesByKeyUniversal.get(item.key) ?? [],
  }));
  const mergedIndustryFr = (passAResult?.themes_industry?.fr ?? []).map((item: any) => ({
    ...item,
    evidence_quotes: quotesByKeyIndustry.get(item.key) ?? [],
  }));
  const mergedStrengthFr = (passAResult?.top_strength?.fr ?? []).map((item: any) => ({
    ...item,
    evidence: evidenceByKeyStrength.get(item.key) ?? [],
  }));

  return {
    themes_universal: { en: mergedUniversalEn, fr: mergedUniversalFr },
    themes_industry:  { en: mergedIndustryEn,  fr: mergedIndustryFr },
    top_strength:     { en: mergedStrengthEn,  fr: mergedStrengthFr },
  };
}

// ─── PASS C — ISHIKAWA ROOT CAUSES ───────────────────────────────────────────

async function analyzePassC(
  negativeTexts: string[],
  topIssues: { en: any[]; fr: any[] },
  businessType: string,
  businessTypeConfidence: number,
): Promise<{ en: any[]; fr: any[] }> {

  if (!topIssues?.en?.length) return topIssues;

  if (!negativeTexts.length) {
    return {
      en: topIssues.en.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
      fr: topIssues.fr.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
    };
  }

  // Every issue in top_issues gets the full Ishikawa workflow (no slicing
  // by count). top_issues is normally exactly 5 items (4 only on a genuine
  // shortfall — see clampTopIssuesCount) — this loop runs over whatever is
  // actually there rather than hard-assuming a count.
  const issuesForIshikawa = topIssues.en;
  const ishikawaKeys = new Set(issuesForIshikawa.map((i: any) => i.key));


  const issueList = issuesForIshikawa.map((issue: any) => ({
    key:   issue.key,
    theme: issue.theme,
    count: issue.count ?? 0,
  }));

  const result = await callOpenAI([
    {
      role: "system",
      content: `You are a root cause analyst using the Ishikawa (fishbone / 5M) method.
${SYSTEM_RULES}
${BILINGUAL_RULE}

You receive only negative reviews (rating 1–3), each numbered — these may be
written in French, English, or a mix of both. That has no bearing on your
output: every "causes" entry in the "en" branch must be written entirely in
English, and every "causes" entry in the "fr" branch must be written
entirely in French. "evidence" quotes are the one exception — always kept
verbatim in the review's original language, never translated, identical in
both branches (see R7 below).

Business type: ${businessType} (confidence: ${businessTypeConfidence}%)

5M CATEGORIES for a ${businessType} business — use these sector-specific definitions:
${buildCategoryContextBlock(businessType)}

Business type: ${businessType} (confidence: ${businessTypeConfidence}%)

5M CATEGORIES for a ${businessType} business — use these sector-specific definitions:
${buildCategoryContextBlock(businessType)}

IMPORTANT: Separate customer problems from root causes.

The issue describes WHAT customers experienced.
The Ishikawa root cause analysis explains WHY that issue occurred.

Never repeat the Pareto issue as a root cause.

Good examples:

Pareto Issue:
• Poor Service Quality

Possible Root Causes:
✓ No service quality checklist
✓ Orders are not verified before delivery
✓ Staff receive inconsistent onboarding
✓ Peak-hour staffing is insufficient

Not:
✗ Poor Service Quality
✗ Incompetent Staff

---

Pareto Issue:
• Unsatisfactory Hair Results

Possible Root Causes:
✓ Consultation process is inconsistent
✓ Colour application procedure is not standardized
✓ Junior stylists work without senior review

Not:
✗ Unsatisfactory Hair Results
✗ Bad Hairdresser

Always explain the operational reason behind the customer issue, not simply restate or rename the issue itself.

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
    // Model call failed/returned nothing usable — give every issue an empty
    // root_causes shape rather than leaving the field undefined downstream.
    return {
      en: topIssues.en.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
      fr: topIssues.fr.map(i => ({ ...i, root_causes: enforceRootCauses([]) })),
    };
  }

  const enItems: any[] = Array.isArray(raw.en) ? raw.en : [];
  const frItems: any[] = Array.isArray(raw.fr) ? raw.fr : [];

  // Lookup by key (not index) — defensive: even though all 5 issues are now
  // sent to the model, its response order isn't guaranteed to match input
  // order, so key-based lookup is still the correct approach.
  const enByKey = new Map(enItems.map((item: any) => [item.key, item]));
  const frByKey = new Map(frItems.map((item: any) => [item.key, item]));

  // ── EN: every issue is in ishikawaKeys now, so every issue gets the
  // model's root_causes. Falls back to an empty Ishikawa shape only if the
  // model's response happened to omit that specific key.
  const enforcedEn = topIssues.en.map((orig: any) => {
    if (!ishikawaKeys.has(orig.key)) {
      return { ...orig, root_causes: enforceRootCauses([]) };
    }
    const modelItem = enByKey.get(orig.key);
    return {
      ...orig,
      root_causes: enforceRootCauses(modelItem?.root_causes ?? []),
    };
  });

  // ── FR: same pattern + hard-mirror EN evidence[] into FR by category_key
  const enforcedFr = topIssues.fr.map((orig: any) => {
    if (!ishikawaKeys.has(orig.key)) {
      return { ...orig, root_causes: enforceRootCauses([]) };
    }
    const modelItem     = frByKey.get(orig.key);
    const enCounterpart = enforcedEn.find((e: any) => e.key === orig.key);

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
  businessType: string,
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
    let googlePlacesTypes: string | null = null;
    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments').select('name, types')
        .eq('place_id', place_id).eq('user_id', userId).maybeSingle();
      if (establishment?.name) establishmentName = establishment.name;
      if (establishment?.types) {
        googlePlacesTypes = establishment.types?.[outputLanguage] ?? null;
      }
    } catch (err) { console.warn('[analyze-reviews-v2] Establishment fetch error:', err); }
    console.log("the reviews are being fetched with langugage", outputLanguage);
    console.log("the reviews are being fetched with langugage", googlePlacesTypes);

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

    // Cap what actually gets interpolated into OpenAI prompts. Sending the
    // full (up to 300) review set into Pass A and again into Pass B is the
    // main driver of upstream payload-size errors. Stratified sampling keeps
    // the rating distribution representative so negative reviews aren't
    // crowded out by a flood of 5-star reviews when a place has many reviews.
    const PROMPT_REVIEW_CAP = 300;
    const promptSamples = sampleReviewTexts(rows, PROMPT_REVIEW_CAP);
    const negativeRows = rows.filter(r => r.text && (r.rating ?? 3) <= 3);
    const PROMPT_NEGATIVE_CAP = 300;
    const promptNegativeTexts = negativeRows.length <= PROMPT_NEGATIVE_CAP
      ? negativeTexts
      : sampleReviewTexts(negativeRows, PROMPT_NEGATIVE_CAP);
    if (promptSamples.length < sampleTexts.length) {
      console.log(`[analyze-reviews-v2] Capped prompt sample: ${promptSamples.length}/${sampleTexts.length} reviews sent to Pass A/B`);
    }
    if (promptNegativeTexts.length < negativeTexts.length) {
      console.log(`[analyze-reviews-v2] Capped negative sample: ${promptNegativeTexts.length}/${negativeTexts.length} reviews sent to Pass C`);
    }

    // ── Previous run's insight (for top_issues key persistence + notification diffing) ──
    const { data: existingInsight } = await supabaseAdmin
      .from('review_insights')
      .select('top_issues, top_praises, themes_universal, themes_industry, avg_rating')
      .eq('place_id', place_id).eq('user_id', userId).maybeSingle();

    const previousTopIssuesEn = Array.isArray((existingInsight as any)?.top_issues?.en)
      ? (existingInsight as any).top_issues.en
      : [];
    const rawTopIssues = await analyzeTopIssues(
      promptNegativeTexts, detection.type, detection.confidence,
    );
    const reconciledTopIssues = reconcileTopIssueKeysWithPrevious(
      rawTopIssues, previousTopIssuesEn,
    );
    const confirmedIssuesForPassA = tagParetoIssuesWithBucket(
      reconciledTopIssues.en.slice(0, THEME_PARETO_SLICE_MAX),
    );
    const [passAResult, additionalThemesResult] = await Promise.all([
      analyzePassA(
        establishmentName, promptSamples, rows.length,
        detection.type, detection.confidence,
        confirmedIssuesForPassA,
      ),
      analyzeAdditionalThemes(
        promptSamples, confirmedIssuesForPassA, detection.type, detection.confidence,
      ),
    ]);
    if (!passAResult) return json({ ok: false, error: "analysis_pass_a_failed" }, 500);

    // Guard: top_strength must never contain a theme also tracked as a
    // confirmed (Pareto) issue — the prompt asks for this but doesn't
    // enforce it, so this code-level filter is the real safety net. Must
    // run before curateThemeAnalysis (which backfills positive themes from
    // top_strength) so a filtered-out issue can never sneak back in there.
    passAResult.top_strength = filterTopStrengthAgainstConfirmedIssues(
      passAResult.top_strength,
      confirmedIssuesForPassA,
    );

    passAResult.top_issues = reconciledTopIssues;

    // Themes: keep the model-generated key as-is for anything NOT on the
    // Pareto list (no cross-run persistence needed there) — only reconcile
    // sentiment/root_causes for now. Pareto-sourced entries get force-
    // aligned right after this.
    if (passAResult.top_strength)     passAResult.top_strength     = reconcileThemeFields(passAResult.top_strength);
    if (passAResult.themes_universal) passAResult.themes_universal = reconcileThemeFields(passAResult.themes_universal);
    if (passAResult.themes_industry)  passAResult.themes_industry  = reconcileThemeFields(passAResult.themes_industry);

    // Fold Pass A2's genuinely new themes into the same pools, bucketed by
    // their own target_bucket — this is what actually feeds curateThemeAnalysis'
    // positive-candidate search below, instead of it having to fall back to
    // backfilling from top_strength every time.
    mergeAdditionalThemesIntoPools(passAResult, additionalThemesResult);

    // Backfill top_strength up to TOP_STRENGTH_MIN using positive themes
    // from the (now Pass A2-enriched) theme pools — guards against the
    // confirmed-issue collision filter above shrinking it too far.
    passAResult.top_strength = topUpTopStrength(
      passAResult.top_strength     ?? { en: [], fr: [] },
      passAResult.themes_universal ?? { en: [], fr: [] },
      passAResult.themes_industry  ?? { en: [], fr: [] },
      confirmedIssuesForPassA,
    );

    // ── STEP 3: Curate Theme Analysis from the top 3-4 Pareto issues
    // (identical key/name/bucket/rank, sentiment from real counts where
    // available) plus 2-3 positive themes — NOT the entire Pareto list, so
    // Theme Analysis reads as its own "how is this perceived" story rather
    // than mirroring Pareto's "what to prioritize" list.
    curateThemeAnalysis(passAResult, reconciledTopIssues.en, reconciledTopIssues.fr);

    // ── STEP 4: Top up Pareto to 5 issues if the negative-review-only scan
    // came up short, pulling from the now-aligned theme pools. Anything
    // pulled in here is copied directly from an existing theme entry, so it
    // is consistent by construction — same key/name in both modules.
    const toppedUpTopIssues = topUpTopIssuesTo5(
      passAResult.top_issues       ?? { en: [], fr: [] },
      passAResult.themes_industry  ?? { en: [], fr: [] },
      passAResult.themes_universal ?? { en: [], fr: [] },
    );

    // Re-run key reconciliation in case top-up introduced brand-new issues
    // that happen to match a historical one under a different key.
    passAResult.top_issues = reconcileTopIssueKeysWithPrevious(
      toppedUpTopIssues, previousTopIssuesEn,
    );

    // Re-run curation so a topped-up Pareto list is re-sliced/re-curated
    // consistently (top-up only affects the full Pareto answer set used
    // elsewhere; Theme Analysis still only ever pins the top slice of it).
    curateThemeAnalysis(passAResult, passAResult.top_issues.en, passAResult.top_issues.fr);

    // ── Pass B: evidence quotes ────────────────────────────────────────────
    const passBResult = await analyzePassB(
      promptSamples,
      passAResult,
      detection.type,
      detection.confidence,
    );

    if (passBResult?.themes_universal) passAResult.themes_universal = reconcileThemeFields(passBResult.themes_universal);
    if (passBResult?.themes_industry)  passAResult.themes_industry  = reconcileThemeFields(passBResult.themes_industry);
    if (passBResult?.top_strength)     passAResult.top_strength     = reconcileThemeFields(passBResult.top_strength);

    // ── Pass C: Ishikawa root causes (all top_issues) ──────────────────────
    // analyzePassC preserves each issue's incoming `key` unchanged (it only
    // adds root_causes), so the reconciled/aligned keys from above survive
    // intact — no enforceKeys() call needed/wanted here.
    const passCResult = await analyzePassC(
      promptNegativeTexts,
      passAResult.top_issues ?? { en: [], fr: [] },
      detection.type,
      detection.confidence,
    );
    passAResult.top_issues = passCResult;

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
      themes_industry:          detection.confidence > 0
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
        themes_industry:  detection.confidence > 0
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
      const topIssuesTagged = tagParetoIssuesWithBucket(passAResult?.top_issues?.en || []);

      const qualResp = await fetch(`${SUPABASE_URL}/functions/v1/qualitative-analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, placeId: place_id, reviews: sampleTexts,
          themesUniversal: passAResult?.themes_universal || { en: [], fr: [] },
          themesIndustry:  passAResult?.themes_industry  || { en: [], fr: [] },
          topIssues:       passAResult?.top_issues       || { en: [], fr: [] },
          topIssuesBuckets: topIssuesTagged,
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