// import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";

// export type ProbabilityLevel = "Probable" | "Possible" | "Occasionnelle";

// export interface RootCause {
//   description: string;
//   probability: ProbabilityLevel;
//   evidence?: string[]; // Verbatims ou mots-clés qui supportent cette cause
// }

// export interface RootCauseCategory {
//   name: string;
//   causes: RootCause[];
// }

// export interface RootCauseAnalysis {
//   problem: string;
//   categories: RootCauseCategory[];
//   summary: string;
// }

// /**
//  * Analyse les causes racines d'un problème donné à partir des données d'avis
//  */
// export function analyzeRootCauses(
//   problem: string,
//   themes: ThemeAnalysis[],
//   qualitative: QualitativeData,
//   paretoIssues: ParetoItem[],
//   reviews?: Review[]
// ): RootCauseAnalysis {
//   // Normaliser le nom du problème pour la recherche
//   const problemLower = problem.toLowerCase();
//   const isServiceAttente = problemLower.includes("service") || 
//                           problemLower.includes("attente") || 
//                           problemLower.includes("temps") ||
//                           problemLower.includes("lent");

//   // Extraire les verbatims et mots-clés pertinents
//   const relevantVerbatims: string[] = [];
//   const relevantKeywords: string[] = [];

//   // Chercher dans les thèmes
//   themes.forEach(theme => {
//     const themeLower = theme.theme.toLowerCase();
//     if (themeLower.includes("service") || themeLower.includes("attente") || themeLower.includes("temps")) {
//       relevantVerbatims.push(...(theme.verbatims || []));
//     }
//   });

//   // Chercher dans les mots-clés
//   const serviceKeywords = ['attente', 'longue', 'lent', 'serveur', 'service', 'staff', 'personnel', 'accueil', 'réservation'];
//   qualitative.topKeywords?.forEach(kw => {
//     if (serviceKeywords.some(sk => kw.word.toLowerCase().includes(sk))) {
//       relevantKeywords.push(kw.word);
//     }
//   });

//   // Chercher dans les verbatims clés
//   qualitative.keyVerbatims?.forEach(v => {
//     const textLower = v.text.toLowerCase();
//     if (serviceKeywords.some(sk => textLower.includes(sk)) && 
//         (v.sentiment === 'negative' || v.rating <= 3)) {
//       relevantVerbatims.push(v.text);
//     }
//   });

//   // Chercher dans les reviews bruts si disponibles
//   if (reviews) {
//     reviews.forEach(review => {
//       const textLower = review.texte.toLowerCase();
//       if (serviceKeywords.some(sk => textLower.includes(sk)) && review.note <= 3) {
//         relevantVerbatims.push(review.texte);
//       }
//     });
//   }

//   // Analyser les causes par catégorie Ishikawa
//   const categories: RootCauseCategory[] = [];

//   // 1. Main-d'œuvre
//   const workforceCauses: RootCause[] = [];
//   const workforceKeywords = ['serveur', 'staff', 'personnel', 'équipe', 'employé', 'serveuse'];
//   const workforceEvidence = relevantVerbatims.filter(v => 
//     workforceKeywords.some(kw => v.toLowerCase().includes(kw))
//   );

//   if (workforceEvidence.length > 0 || relevantKeywords.some(kw => workforceKeywords.some(wk => kw.includes(wk)))) {
//     // Manque de personnel
//     if (relevantVerbatims.some(v => v.toLowerCase().includes("manque") || v.toLowerCase().includes("peu"))) {
//       workforceCauses.push({
//         description: "Effectif insuffisant pour gérer l'affluence",
//         probability: "Probable",
//         evidence: workforceEvidence.slice(0, 2)
//       });
//     }
//     // Formation ou compétence
//     if (relevantVerbatims.some(v => v.toLowerCase().includes("inexpérimenté") || v.toLowerCase().includes("mal"))) {
//       workforceCauses.push({
//         description: "Formation ou compétences du personnel à améliorer",
//         probability: "Possible",
//         evidence: workforceEvidence.slice(0, 1)
//       });
//     }
//     // Absence ou rotation
//     if (relevantVerbatims.some(v => v.toLowerCase().includes("absent") || v.toLowerCase().includes("changement"))) {
//       workforceCauses.push({
//         description: "Rotation du personnel ou absences fréquentes",
//         probability: "Occasionnelle",
//         evidence: workforceEvidence.slice(0, 1)
//       });
//     }
//   }

//   if (workforceCauses.length === 0 && workforceEvidence.length > 0) {
//     workforceCauses.push({
//       description: "Problèmes liés au personnel de service",
//       probability: "Possible",
//       evidence: workforceEvidence.slice(0, 1)
//     });
//   }

//   if (workforceCauses.length > 0) {
//     categories.push({ name: "Main-d'œuvre", causes: workforceCauses });
//   }

//   // 2. Processus
//   const processCauses: RootCause[] = [];
//   const processKeywords = ['processus', 'organisation', 'gestion', 'planning', 'réservation'];
//   const processEvidence = relevantVerbatims.filter(v => 
//     processKeywords.some(kw => v.toLowerCase().includes(kw)) ||
//     v.toLowerCase().includes("réservation") ||
//     v.toLowerCase().includes("planning")
//   );

//   // Problèmes de réservation
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("réservation") || v.toLowerCase().includes("booking"))) {
//     processCauses.push({
//       description: "Système de réservation inefficace ou surbooking",
//       probability: "Probable",
//       evidence: processEvidence.filter(v => v.toLowerCase().includes("réservation")).slice(0, 2)
//     });
//   }

//   // Organisation du service
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("organisation") || v.toLowerCase().includes("chaos"))) {
//     processCauses.push({
//       description: "Organisation du service à optimiser",
//       probability: "Probable",
//       evidence: processEvidence.slice(0, 2)
//     });
//   }

//   // Gestion des files d'attente
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("file") || v.toLowerCase().includes("queue"))) {
//     processCauses.push({
//       description: "Absence ou mauvaise gestion des files d'attente",
//       probability: "Possible",
//       evidence: processEvidence.slice(0, 1)
//     });
//   }

//   if (processCauses.length === 0 && (relevantVerbatims.length > 0 || relevantKeywords.length > 0)) {
//     processCauses.push({
//       description: "Processus de service à revoir",
//       probability: "Possible",
//       evidence: relevantVerbatims.slice(0, 1)
//     });
//   }

//   if (processCauses.length > 0) {
//     categories.push({ name: "Processus", causes: processCauses });
//   }

//   // 3. Méthodes de service
//   const methodCauses: RootCause[] = [];
//   const methodEvidence = relevantVerbatims.filter(v => 
//     v.toLowerCase().includes("méthode") ||
//     v.toLowerCase().includes("façon") ||
//     v.toLowerCase().includes("manière")
//   );

//   // Service trop lent
//   if (relevantKeywords.includes("lent") || relevantVerbatims.some(v => v.toLowerCase().includes("lent"))) {
//     methodCauses.push({
//       description: "Rythme de service trop lent",
//       probability: "Probable",
//       evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("lent")).slice(0, 2)
//     });
//   }

//   // Priorisation des tables
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("priorité") || v.toLowerCase().includes("oubli"))) {
//     methodCauses.push({
//       description: "Mauvaise priorisation ou oubli de certaines tables",
//       probability: "Possible",
//       evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("priorité") || v.toLowerCase().includes("oubli")).slice(0, 1)
//     });
//   }

//   // Coordination entre équipes
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("coordination") || v.toLowerCase().includes("communication"))) {
//     methodCauses.push({
//       description: "Manque de coordination entre les équipes",
//       probability: "Occasionnelle",
//       evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("coordination") || v.toLowerCase().includes("communication")).slice(0, 1)
//     });
//   }

//   if (methodCauses.length === 0 && relevantKeywords.includes("lent")) {
//     methodCauses.push({
//       description: "Méthodes de service à optimiser",
//       probability: "Possible",
//       evidence: relevantVerbatims.slice(0, 1)
//     });
//   }

//   if (methodCauses.length > 0) {
//     categories.push({ name: "Méthodes de service", causes: methodCauses });
//   }

//   // 4. Outils & systèmes
//   const toolsCauses: RootCause[] = [];
//   const toolsKeywords = ['système', 'outil', 'logiciel', 'technologie', 'caisse', 'commande'];
//   const toolsEvidence = relevantVerbatims.filter(v => 
//     toolsKeywords.some(kw => v.toLowerCase().includes(kw))
//   );

//   // Système de commande
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("commande") || v.toLowerCase().includes("order"))) {
//     toolsCauses.push({
//       description: "Système de prise de commande inefficace ou lent",
//       probability: "Possible",
//       evidence: toolsEvidence.filter(v => v.toLowerCase().includes("commande")).slice(0, 1)
//     });
//   }

//   // Outils de gestion
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("caisse") || v.toLowerCase().includes("paiement"))) {
//     toolsCauses.push({
//       description: "Problèmes avec les outils de caisse ou de paiement",
//       probability: "Occasionnelle",
//       evidence: toolsEvidence.filter(v => v.toLowerCase().includes("caisse") || v.toLowerCase().includes("paiement")).slice(0, 1)
//     });
//   }

//   if (toolsCauses.length === 0 && toolsEvidence.length > 0) {
//     toolsCauses.push({
//       description: "Outils ou systèmes à améliorer",
//       probability: "Occasionnelle",
//       evidence: toolsEvidence.slice(0, 1)
//     });
//   }

//   if (toolsCauses.length > 0) {
//     categories.push({ name: "Outils & systèmes", causes: toolsCauses });
//   }

//   // 5. Contexte & affluence
//   const contextCauses: RootCause[] = [];
//   const contextKeywords = ['affluence', 'plein', 'bondé', 'week-end', 'soir', 'rush', 'pic'];
//   const contextEvidence = relevantVerbatims.filter(v => 
//     contextKeywords.some(kw => v.toLowerCase().includes(kw))
//   );

//   // Pic d'affluence
//   if (relevantVerbatims.some(v => contextKeywords.some(kw => v.toLowerCase().includes(kw)))) {
//     contextCauses.push({
//       description: "Gestion difficile des pics d'affluence (week-ends, soirs)",
//       probability: "Probable",
//       evidence: contextEvidence.slice(0, 2)
//     });
//   }

//   // Capacité d'accueil
//   if (relevantVerbatims.some(v => v.toLowerCase().includes("capacité") || v.toLowerCase().includes("trop petit"))) {
//     contextCauses.push({
//       description: "Capacité d'accueil insuffisante pour la demande",
//       probability: "Possible",
//       evidence: contextEvidence.filter(v => v.toLowerCase().includes("capacité") || v.toLowerCase().includes("petit")).slice(0, 1)
//     });
//   }

//   if (contextCauses.length === 0 && (relevantVerbatims.length > 0 || relevantKeywords.length > 0)) {
//     contextCauses.push({
//       description: "Contexte d'affluence non anticipé",
//       probability: "Possible",
//       evidence: relevantVerbatims.slice(0, 1)
//     });
//   }

//   if (contextCauses.length > 0) {
//     categories.push({ name: "Contexte & affluence", causes: contextCauses });
//   }

//   // Si aucune catégorie n'a été identifiée, créer des causes génériques basées sur les données
//   if (categories.length === 0) {
//     if (relevantVerbatims.length > 0 || relevantKeywords.length > 0) {
//       categories.push({
//         name: "Processus",
//         causes: [{
//           description: "Problèmes de service ou d'attente identifiés dans les avis",
//           probability: "Possible",
//           evidence: relevantVerbatims.slice(0, 2)
//         }]
//       });
//     }
//   }

//   // Générer la synthèse
//   const probableCauses = categories.flatMap(cat => 
//     cat.causes.filter(c => c.probability === "Probable")
//   );
//   const possibleCauses = categories.flatMap(cat => 
//     cat.causes.filter(c => c.probability === "Possible")
//   );

//   let summary = "";
//   if (probableCauses.length > 0) {
//     const mainCause = probableCauses[0];
//     summary = `Les causes dominantes du problème "${problem}" sont principalement liées à ${mainCause.description.toLowerCase()}, avec des contributions probables de ${probableCauses.slice(1).map(c => c.description.toLowerCase()).join(" et ")}.`;
//   } else if (possibleCauses.length > 0) {
//     summary = `Les causes probables du problème "${problem}" semblent être liées à ${possibleCauses[0].description.toLowerCase()}, nécessitant une analyse plus approfondie pour confirmer.`;
//   } else {
//     summary = `L'analyse des avis suggère que le problème "${problem}" peut avoir plusieurs origines, nécessitant une investigation plus approfondie sur le terrain.`;
//   }

//   return {
//     problem,
//     categories,
//     summary
//   };
// }



//----------------------------------------------------------------------------------------------------------------
import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";

export type ProbabilityLevel = "Probable" | "Possible" | "Occasionnelle";

export interface RootCause {
  description: string;
  probability: ProbabilityLevel;
  evidence?: string[];
}

export interface RootCauseCategory {
  name: string;
  causes: RootCause[];
}

export interface RootCauseAnalysis {
  problem: string;
  categories: RootCauseCategory[];
  summary: string;
}

/* ---------------- HELPERS ---------------- */

// ─── Helpers ────────────────────────────────────────────────────────────────
/**
 * Expands a problem token set with semantically related English words.
 * This ensures reviews using synonyms or indirect language still get matched.
 */
const PROBLEM_SYNONYMS: Record<string, string[]> = {
  // Hygiene & cleanliness
  "hygiene":     ["dirty", "filthy", "unclean", "disgusting", "gross", "grimy",
                  "unhygienic", "contaminated", "bacteria", "mold", "mould",
                  "stain", "stained", "sticky", "smell", "smells", "smelly",
                  "odor", "odour", "stench", "cockroach", "rat", "mice",
                  "insect", "pest", "hair", "trash", "garbage", "waste",
                  "toilet", "bathroom", "restroom", "washroom", "floor",
                  "table", "plate", "glass", "utensil", "kitchen"],
  "cleanliness": ["dirty", "filthy", "unclean", "disgusting", "gross",
                  "stain", "sticky", "smell", "smelly", "trash", "messy"],

  // Service & wait time
  "service":     ["wait", "waiting", "slow", "staff", "rude", "unhelpful",
                  "ignored", "attitude", "unprofessional", "server", "waiter"],
  "wait":        ["slow", "long", "waiting", "delay", "delayed", "forever",
                  "hours", "queue", "line", "took", "minutes"],
  "speed":       ["slow", "fast", "quick", "delay", "delayed", "wait", "long"],

  // Food quality
  "food":        ["taste", "flavor", "bland", "cold", "raw", "overcooked",
                  "undercooked", "stale", "expired", "fresh", "quality",
                  "portion", "small", "wrong", "missing"],
  "quality":     ["poor", "bad", "terrible", "awful", "mediocre", "cheap",
                  "fake", "defective", "broken", "damaged", "wrong"],

  // Pricing
  "price":       ["expensive", "overpriced", "costly", "cheap", "value",
                  "worth", "rip", "ripoff", "charged", "billing", "refund"],
  "pricing":     ["expensive", "overpriced", "costly", "cheap", "value",
                  "worth", "rip", "ripoff", "charged", "billing", "refund"],

  // Delivery
  "delivery":    ["late", "delayed", "missing", "wrong", "damaged", "lost",
                  "driver", "courier", "tracking", "package", "shipping"],

  // Staff
  "staff":       ["rude", "unprofessional", "unhelpful", "ignorant", "arrogant",
                  "impolite", "dismissive", "lazy", "incompetent", "attitude"],

  // Noise & environment
  "noise":       ["loud", "noisy", "crowded", "music", "sound", "quiet"],
  "environment": ["dirty", "crowded", "noisy", "dark", "cold", "hot",
                  "uncomfortable", "small", "parking", "access"],

  // Technical / app issues
  "app":         ["crash", "bug", "error", "slow", "loading", "freeze",
                  "broken", "login", "payment", "update"],
  "website":     ["crash", "bug", "error", "slow", "loading", "freeze",
                  "broken", "login", "payment", "update", "down"],
};

/**
 * Expands problem tokens with synonyms for broader review matching.
 */
function expandProblemTokens(problemTokens: string[]): string[] {
  const expanded = new Set(problemTokens);
  problemTokens.forEach(token => {
    PROBLEM_SYNONYMS[token]?.forEach(syn => expanded.add(syn));
  });
  return [...expanded];
}

const STOPWORDS = new Set([
  // English stopwords
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "did", "will", "would", "could", "should",
  "not", "no", "very", "too", "so", "just", "get", "got", "its", "it",
  "this", "that", "they", "them", "their", "we", "our", "you", "your",
  "my", "me", "he", "she", "his", "her", "i", "am", "up", "out", "about",
  "than", "then", "also", "even", "all", "any", "been", "more", "much",
  "never", "ever", "only", "still", "same", "such", "over", "after",
  "again", "back", "there", "here", "when", "what", "which", "who",
  "how", "why", "where", "if", "as", "us",
  // French stopwords (for category names / descriptions — not matched against reviews)
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en",
  "est", "pas", "plus", "tres", "bien", "bon", "mauvais", "trop"
]);

/**
 * Tokenise a string into lowercase words, stripping punctuation and stopwords.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Returns a relevance score (0–1) between problem tokens and a review text.
 * Bonus for direct substring match.
 */
function relevanceScore(problemTokens: string[], text: string): number {
  const textTokens = new Set(tokenize(text));
  const matches = problemTokens.filter(t => textTokens.has(t)).length;
  const directMatch = text.toLowerCase().includes(problemTokens.join(" ")) ? 0.3 : 0;
  return matches / Math.max(problemTokens.length, 1) + directMatch;
}

/**
 * Returns true if a review is negative (rating ≤ 3).
 */
function isNegative(review: Review): boolean {
  return review.note <= 3;
}

/**
 * Returns true if a text is related to the problem.
 */
function isRelatedToProblem(problemTokens: string[], text: string): boolean {
  const expandedTokens = expandProblemTokens(problemTokens);
  return relevanceScore(expandedTokens, text) >= 0.15;
}
// ─── Ishikawa Category Builders (English seeds, French labels) ───────────────

const ISHIKAWA_CATEGORIES = [
  {
    name: "Main-d'œuvre",
    seeds: [
      // Staff behavior & attitude
      "staff", "employee", "employees", "worker", "workers", "team", "agent",
      "manager", "supervisor", "representative", "rep", "associate", "cashier",
      "waiter", "waitress", "server", "driver", "technician", "consultant",
      // Negative descriptors
      "rude", "unprofessional", "unhelpful", "incompetent", "unfriendly",
      "impolite", "ignorant", "arrogant", "dismissive", "lazy", "untrained",
      "inexperienced", "careless", "indifferent",
      // Action words
      "ignored", "refused", "yelled", "lied", "mislead", "forgot",
      "attitude", "behavior", "manner", "training", "knowledge",
    ],
  },
  {
    name: "Processus",
    seeds: [
      // Process & flow
      "process", "procedure", "system", "queue", "line", "wait", "waiting",
      "delay", "delayed", "slow", "booking", "reservation", "appointment",
      "scheduling", "dispatch", "tracking", "confirmation", "approval",
      "verification", "checkout", "checkin", "onboarding", "registration",
      // Outcome words
      "stuck", "confused", "lost", "pending", "unresolved", "backlog",
      "bottleneck", "inefficient", "disorganized", "chaotic", "complicated",
    ],
  },
  {
    name: "Méthodes",
    seeds: [
      // Methods & practices
      "method", "approach", "policy", "protocol", "standard", "practice",
      "guideline", "rule", "instruction", "communication", "coordination",
      "response", "follow", "followup", "escalation", "handling", "priority",
      "workflow",
      // Negative signals
      "inconsistent", "unclear", "confusing", "misleading", "wrong",
      "incorrect", "outdated", "inadequate", "poor", "lack", "missing",
      "no response", "ignored", "unacknowledged",
    ],
  },
  {
    name: "Outils & systèmes",
    seeds: [
      // Technology
      "app", "application", "website", "site", "platform", "software",
      "system", "tool", "machine", "device", "terminal", "kiosk",
      "payment", "checkout", "interface", "portal", "dashboard",
      // Issues
      "bug", "crash", "error", "glitch", "broken", "not working",
      "down", "unavailable", "offline", "slow", "loading", "freeze",
      "failed", "malfunction", "outdated", "update",
    ],
  },
  {
    name: "Environnement",
    seeds: [
      // Physical environment
      "place", "location", "store", "shop", "restaurant", "branch",
      "outlet", "facility", "parking", "access", "entrance", "space",
      "area", "room", "table", "seat", "seating", "floor",
      // Conditions
      "dirty", "unclean", "noisy", "crowded", "packed", "small", "dark",
      "hot", "cold", "smelly", "messy", "disorganized", "unsafe",
      "uncomfortable", "broken", "maintenance", "hygiene", "cleanliness",
      "hours", "open", "closed", "busy", "rush",
    ],
  },
  {
    name: "Produit / Service",
    seeds: [
      // Product/service quality
      "product", "item", "order", "food", "meal", "dish", "drink",
      "service", "quality", "quality", "taste", "flavor", "portion",
      "size", "quantity", "packaging", "delivery", "shipping",
      // Issues
      "wrong", "missing", "damaged", "expired", "stale", "cold",
      "overpriced", "expensive", "cheap", "value", "waste", "refund",
      "return", "exchange", "complaint", "defective", "fake", "counterfeit",
      "false", "inaccurate", "description", "expectation",
    ],
  },
];

function buildCategory(
  categoryDef: { name: string; seeds: string[] },
  problemTokens: string[],          // original — used for description generation
  relevantTexts: string[]
): RootCauseCategory | null {
  const expandedTokens = expandProblemTokens(problemTokens); // ← use expanded for scoring

  const categoryEvidence = relevantTexts.filter(text => {
    const rawText = text.toLowerCase();
    return categoryDef.seeds.some(seed =>
      tokenize(text).includes(seed) || rawText.includes(seed)
    );
  });

  if (categoryEvidence.length === 0) return null;

  const scored = categoryEvidence
    .map(text => ({ text, score: relevanceScore(expandedTokens, text) })) // ← expanded
    .sort((a, b) => b.score - a.score);


  const probability: ProbabilityLevel =
    scored.length >= 3 ? "Probable" :
    scored.length >= 2 ? "Possible" : "Occasionnelle";

  const matchedSeeds = categoryDef.seeds.filter(seed =>
    categoryEvidence.some(text =>
      tokenize(text).includes(seed) || text.toLowerCase().includes(seed)
    )
  );

  const topSeeds = matchedSeeds.slice(0, 3).join(", ");
  const description = generateCauseDescription(categoryDef.name, topSeeds, problemTokens);

  return {
    name: categoryDef.name,
    causes: [
      {
        description,
        probability,
        evidence: scored.slice(0, 2).map(s => s.text),
      },
    ],
  };
}

/**
 * Generates a French cause description from English matched signals.
 */
function generateCauseDescription(
  categoryName: string,
  matchedSeeds: string,
  problemTokens: string[]
): string {
  const problem = problemTokens.join(" ");
  const descriptionMap: Record<string, string> = {
    "Main-d'œuvre":      `Personnel impliqué dans le problème de "${problem}" (signaux : ${matchedSeeds})`,
    "Processus":         `Dysfonctionnement du processus lié à "${problem}" (signaux : ${matchedSeeds})`,
    "Méthodes":          `Méthodes inadaptées contribuant au problème "${problem}" (signaux : ${matchedSeeds})`,
    "Outils & systèmes": `Outils ou systèmes défaillants autour de "${problem}" (signaux : ${matchedSeeds})`,
    "Environnement":     `Facteurs environnementaux aggravant "${problem}" (signaux : ${matchedSeeds})`,
    "Produit / Service": `Qualité du produit/service en cause pour "${problem}" (signaux : ${matchedSeeds})`,
  };
  return descriptionMap[categoryName] ?? `Cause identifiée dans "${categoryName}" pour le problème "${problem}"`;
}

// ─── Main exported function ──────────────────────────────────────────────────

export function analyzeRootCauses(
  problem: string,
  themes: ThemeAnalysis[],
  qualitative: QualitativeData,
  paretoIssues: ParetoItem[],
  reviews?: Review[]
): RootCauseAnalysis {

  // 1. Tokenise the problem dynamically

  const problemTokens = tokenize(problem);

  // ── Step 1: Collect ALL text sources ──────────────────────────────────────
  const allTexts: string[] = [];

  if (reviews && reviews.length > 0) {
    reviews.forEach(r => {
      if (r.texte?.trim()) allTexts.push(r.texte.trim());
    });
  }

  qualitative.keyVerbatims?.forEach(v => {
    if (v.text?.trim()) allTexts.push(v.text.trim());
  });

  themes.forEach(t => {
    t.verbatims?.forEach(v => {
      if (v?.trim()) allTexts.push(v.trim());
    });
  });

  qualitative.topKeywords?.forEach(kw => {
    if (kw.word?.trim()) allTexts.push(kw.word.trim());
  });

  // Deduplicate
  const uniqueTexts = [...new Set(allTexts)];

  // ── Step 2: Filter NEGATIVE texts only ────────────────────────────────────
  const negativeTexts = uniqueTexts.filter(text => {
    const matchingReview = reviews?.find(r => r.texte?.trim() === text);
    if (matchingReview) return isNegative(matchingReview);

    const matchingVerbatim = qualitative.keyVerbatims?.find(v => v.text?.trim() === text);
    if (matchingVerbatim) {
      return matchingVerbatim.sentiment === "negative" || matchingVerbatim.rating <= 3;
    }

    return true; // Keep theme verbatims and keywords (no rating info)
  });

  // ── Step 3: Filter texts RELATED to the problem ───────────────────────────
  const relevantTexts = negativeTexts.filter(text =>
    isRelatedToProblem(problemTokens, text)
  );

  // Fallback: if too few relevant texts, use all negative texts
  const textsForAnalysis = relevantTexts.length >= 2 ? relevantTexts : negativeTexts;

  // ── Step 4: Ishikawa category analysis ────────────────────────────────────
  const categories: RootCauseCategory[] = ISHIKAWA_CATEGORIES
    .map(catDef => buildCategory(catDef, problemTokens, textsForAnalysis))
    .filter((cat): cat is RootCauseCategory => cat !== null);

  // ── Step 5: Fallback if nothing matched ───────────────────────────────────
  if (categories.length === 0 && textsForAnalysis.length > 0) {
    categories.push({
      name: "Processus",
      causes: [{
        description: `Problème lié à "${problem}" identifié dans les avis négatifs`,
        probability: "Possible",
        evidence: textsForAnalysis.slice(0, 2),
      }],
    });
  }

  // ── Step 6: Build French summary ──────────────────────────────────────────
  const probableCauses = categories.flatMap(cat =>
    cat.causes.filter(c => c.probability === "Probable")
  );
  const possibleCauses = categories.flatMap(cat =>
    cat.causes.filter(c => c.probability === "Possible")
  );

  let summary = "";
  if (probableCauses.length > 0) {
    const main = probableCauses[0];
    const others = probableCauses.slice(1).map(c => c.description.toLowerCase()).join(" et ");
    summary = `Les causes dominantes du problème "${problem}" sont principalement liées à ${main.description.toLowerCase()}${others ? `, avec des contributions de ${others}` : ""}.`;
  } else if (possibleCauses.length > 0) {
    summary = `Les causes probables du problème "${problem}" semblent liées à ${possibleCauses[0].description.toLowerCase()}, nécessitant une analyse plus approfondie.`;
  } else {
    summary = `L'analyse des avis suggère que le problème "${problem}" peut avoir plusieurs origines — une investigation terrain complémentaire est recommandée.`;
  }

  return { problem, categories, summary };
}
