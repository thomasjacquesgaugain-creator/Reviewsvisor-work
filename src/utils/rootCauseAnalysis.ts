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
  count: number;
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

/* ─────────────────────────────────────────────
   NLP HELPERS
───────────────────────────────────────────── */

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","are","was","were","be","been","have","has","had",
  "do","did","will","would","could","should","not","no","very","too",
  "so","just","get","got","its","it","this","that","they","them","their",
  "we","our","you","your","my","me","he","she","his","her","i","am",
  "up","out","about","than","then","also","even","all","any","more",
  "much","never","ever","only","still","same","such","over","after",
  "again","back","there","here","when","what","which","who","how",
  "why","where","if","as","us","one","two","been","into","during"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

/* ─────────────────────────────────────────────
   PROBLEM SYNONYM EXPANSION
   Expands problem tokens with semantically related
   English words so indirect reviews are captured
───────────────────────────────────────────── */

const PROBLEM_SYNONYMS: Record<string, string[]> = {
  // Hygiene & cleanliness
  hygiene:      ["dirty","filthy","unclean","disgusting","gross","grimy",
                 "unhygienic","contaminated","stain","stained","sticky",
                 "smell","smells","smelly","odor","odour","stench",
                 "cockroach","rat","mice","insect","pest","hair","mold",
                 "mould","trash","garbage","waste","bathroom","toilet",
                 "restroom","washroom","floor","table","plate","glass",
                 "utensil","kitchen","grease","greasy","residue"],
  cleanliness:  ["dirty","filthy","unclean","disgusting","gross","stain",
                 "sticky","smell","smelly","trash","messy","grimy"],

  // Service & wait
  service:      ["wait","waiting","slow","staff","rude","unhelpful",
                 "ignored","attitude","unprofessional","server","waiter",
                 "attentive","inattentive","helpless","useless"],
  wait:         ["slow","long","waiting","delay","delayed","forever",
                 "hours","queue","line","took","minutes","ages","eternity"],
  speed:        ["slow","fast","quick","delay","delayed","wait","long","sluggish"],
  attente:      ["slow","long","waiting","delay","queue","line","took","minutes"],

  // Food & product quality
  food:         ["taste","flavor","bland","cold","raw","overcooked",
                 "undercooked","stale","expired","fresh","quality",
                 "portion","small","wrong","missing","soggy","hard",
                 "burnt","chewy","dry","greasy","spicy","salty"],
  quality:      ["poor","bad","terrible","awful","mediocre","cheap",
                 "fake","defective","broken","damaged","wrong","inferior",
                 "substandard","disappointing","unacceptable"],

  // Pricing
  price:        ["expensive","overpriced","costly","cheap","value","worth",
                 "rip","ripoff","charged","billing","refund","fee","cost"],
  pricing:      ["expensive","overpriced","costly","value","worth",
                 "rip","ripoff","charged","billing","refund"],

  // Delivery & logistics
  delivery:     ["late","delayed","missing","wrong","damaged","lost",
                 "driver","courier","tracking","package","shipping",
                 "undelivered","returned","address"],

  // Staff & personnel
  staff:        ["rude","unprofessional","unhelpful","ignorant","arrogant",
                 "impolite","dismissive","lazy","incompetent","attitude",
                 "untrained","disrespectful","offensive","hostile"],
  personnel:    ["rude","unprofessional","unhelpful","attitude","untrained",
                 "dismissive","incompetent","disrespectful"],

  // Noise & environment
  noise:        ["loud","noisy","crowded","music","sound","quiet","disturbing"],
  environment:  ["dirty","crowded","noisy","dark","cold","hot","uncomfortable",
                 "small","parking","access","cramped","stuffy","unkempt"],

  // Technical / digital
  app:          ["crash","bug","error","slow","loading","freeze","broken",
                 "login","payment","update","glitch","down","unavailable"],
  website:      ["crash","bug","error","slow","loading","freeze","broken",
                 "login","payment","update","glitch","down","unavailable"],
  system:       ["crash","bug","error","slow","freeze","broken","down",
                 "unavailable","glitch","malfunction","offline"],
};

/**
 * Returns the full expanded token set for a given problem string.
 * e.g. "hygiene" → ["hygiene", "dirty", "filthy", "smelly", ...]
 */
function expandProblemTokens(problemTokens: string[]): string[] {
  const expanded = new Set(problemTokens);
  problemTokens.forEach(token => {
    PROBLEM_SYNONYMS[token]?.forEach(syn => expanded.add(syn));
  });
  return [...expanded];
}

/**
 * Returns true if ANY expanded token appears in the review text.
 * Uses both tokenized words AND raw substring for multi-word signals.
 */
function isRelatedToProblem(expandedTokens: string[], text: string): boolean {
  const words = new Set(tokenize(text));
  const raw = normalize(text);
  return expandedTokens.some(token => words.has(token) || raw.includes(token));
}

/* ─────────────────────────────────────────────
   ISHIKAWA CATEGORY DEFINITIONS
   Each category has:
   - seeds: English words that signal this category
   - rules: specific cause descriptions triggered by
     matched keyword groups (from old version logic)
───────────────────────────────────────────── */

interface CategoryRule {
  match: string[];           // if ANY of these appear in evidence → use this description
  description: string;       // French cause description
}

interface CategoryDefinition {
  name: string;
  seeds: string[];
  rules: CategoryRule[];
  fallbackDescription: string;
}

const ISHIKAWA_CATEGORIES: CategoryDefinition[] = [
  {
    name: "Main-d'œuvre",
    seeds: [
      "staff","employee","employees","worker","workers","team","agent","manager",
      "supervisor","representative","associate","cashier","waiter","waitress",
      "server","driver","technician","consultant","crew","attendant",
      "rude","unprofessional","unhelpful","incompetent","unfriendly","impolite",
      "ignorant","arrogant","dismissive","lazy","untrained","inexperienced",
      "careless","indifferent","disrespectful","hostile","offensive",
      "ignored","refused","yelled","lied","forgot","attitude","behavior","training"
    ],
    rules: [
      {
        match: ["rude","impolite","arrogant","disrespectful","hostile","offensive","yelled"],
        description: "Comportement irrespectueux ou impoli du personnel envers les clients"
      },
      {
        match: ["unprofessional","untrained","inexperienced","incompetent","useless"],
        description: "Manque de formation ou compétences insuffisantes du personnel"
      },
      {
        match: ["ignored","unhelpful","dismissive","indifferent","careless","forgot"],
        description: "Personnel inattentif ou négligent vis-à-vis des demandes clients"
      },
      {
        match: ["shortage","few staff","understaffed","not enough staff","one person"],
        description: "Effectif insuffisant pour gérer la demande"
      },
    ],
    fallbackDescription: "Problèmes liés au comportement ou aux compétences du personnel"
  },
  {
    name: "Processus",
    seeds: [
      "process","procedure","queue","line","wait","waiting","delay","delayed",
      "slow","booking","reservation","appointment","scheduling","dispatch",
      "tracking","confirmation","approval","verification","checkout","checkin",
      "onboarding","registration","stuck","pending","unresolved","backlog",
      "bottleneck","inefficient","disorganized","chaotic","complicated","order",
      "refund","return","exchange","complaint"
    ],
    rules: [
      {
        match: ["wait","waiting","queue","line","long time","ages","forever","hours","minutes"],
        description: "Temps d'attente excessif dû à une mauvaise gestion des flux"
      },
      {
        match: ["reservation","booking","appointment","overbooked","surbooking"],
        description: "Système de réservation inefficace ou surbooking"
      },
      {
        match: ["delay","delayed","late","slow","took long","pending","unresolved"],
        description: "Délais de traitement trop longs ou non respectés"
      },
      {
        match: ["refund","return","exchange","complaint","unresolved","ignored"],
        description: "Processus de réclamation ou retour mal géré"
      },
      {
        match: ["disorganized","chaotic","complicated","confusing","no system"],
        description: "Organisation du service à revoir — processus peu clairs"
      },
    ],
    fallbackDescription: "Dysfonctionnement dans le processus de service"
  },
  {
    name: "Méthodes",
    seeds: [
      "method","approach","policy","protocol","standard","practice","guideline",
      "rule","instruction","communication","coordination","response","followup",
      "escalation","handling","priority","workflow","inconsistent","unclear",
      "confusing","misleading","wrong","incorrect","outdated","inadequate","poor",
      "lack","missing","no response","unacknowledged","priority","forgot"
    ],
    rules: [
      {
        match: ["coordination","communication","team","internal","between"],
        description: "Manque de coordination entre les équipes de service"
      },
      {
        match: ["inconsistent","different","every time","sometimes","depends"],
        description: "Pratiques de service incohérentes selon les situations"
      },
      {
        match: ["no response","ignored","unacknowledged","followup","never heard"],
        description: "Absence de suivi ou de réponse aux demandes clients"
      },
      {
        match: ["priority","forgot","skipped","missed","overlooked"],
        description: "Mauvaise priorisation ou oubli de certaines demandes"
      },
    ],
    fallbackDescription: "Méthodes de travail inadaptées impactant la qualité du service"
  },
  {
    name: "Outils & systèmes",
    seeds: [
      "app","application","website","site","platform","software","system","tool",
      "machine","device","terminal","kiosk","payment","checkout","interface",
      "portal","dashboard","bug","crash","error","glitch","broken","not working",
      "down","unavailable","offline","loading","freeze","failed","malfunction",
      "outdated","update","pos","register","scanner","printer"
    ],
    rules: [
      {
        match: ["bug","crash","error","glitch","freeze","not working","broken","malfunction"],
        description: "Pannes ou dysfonctionnements des outils technologiques"
      },
      {
        match: ["payment","billing","checkout","transaction","charged","refund"],
        description: "Problèmes avec les systèmes de paiement ou de facturation"
      },
      {
        match: ["slow","loading","down","unavailable","offline","lag"],
        description: "Performances insuffisantes des systèmes ou applications"
      },
      {
        match: ["outdated","old","update","obsolete","legacy"],
        description: "Outils obsolètes ne répondant plus aux besoins opérationnels"
      },
    ],
    fallbackDescription: "Outils ou systèmes défaillants impactant le service"
  },
  {
    name: "Environnement",
    seeds: [
      "place","location","store","shop","restaurant","branch","outlet","facility",
      "parking","access","entrance","space","area","room","table","seat","seating",
      "floor","dirty","unclean","filthy","disgusting","gross","grimy","unhygienic",
      "contaminated","stain","sticky","smell","smells","smelly","odor","stench",
      "cockroach","rat","mice","insect","pest","hair","mold","trash","garbage",
      "noisy","crowded","packed","small","dark","hot","cold","uncomfortable",
      "broken","maintenance","hygiene","cleanliness","hours","busy","rush",
      "bathroom","toilet","restroom","washroom","grease","greasy"
    ],
    rules: [
      {
        match: ["dirty","filthy","unclean","disgusting","gross","grimy","unhygienic",
                "stain","sticky","mold","grease","greasy","residue"],
        description: "Manque de propreté ou d'hygiène des locaux et équipements"
      },
      {
        match: ["smell","smells","smelly","odor","odour","stench"],
        description: "Problèmes d'odeurs désagréables affectant l'expérience client"
      },
      {
        match: ["cockroach","rat","mice","insect","pest","hair","contaminated","bacteria"],
        description: "Présence de nuisibles ou contamination — problème d'hygiène critique"
      },
      {
        match: ["noisy","loud","noise","music","disturbing"],
        description: "Environnement sonore perturbant l'expérience client"
      },
      {
        match: ["crowded","packed","full","busy","rush","small","cramped"],
        description: "Capacité d'accueil insuffisante lors des pics d'affluence"
      },
      {
        match: ["cold","hot","temperature","stuffy","ventilation","air"],
        description: "Conditions de confort thermique ou d'aération insuffisantes"
      },
      {
        match: ["parking","access","location","entrance","find","hard to"],
        description: "Accessibilité ou localisation difficile pour les clients"
      },
    ],
    fallbackDescription: "Facteurs environnementaux dégradant l'expérience client"
  },
  {
    name: "Produit / Service",
    seeds: [
      "product","item","order","food","meal","dish","drink","service","quality",
      "taste","flavor","portion","size","quantity","packaging","delivery",
      "shipping","wrong","missing","damaged","expired","stale","cold","overpriced",
      "expensive","cheap","value","waste","defective","fake","inaccurate",
      "description","expectation","bland","raw","overcooked","undercooked",
      "soggy","hard","burnt","chewy","dry","spicy","salty"
    ],
    rules: [
      {
        match: ["cold","warm","temperature","not hot","lukewarm","reheated"],
        description: "Produits servis à mauvaise température"
      },
      {
        match: ["bland","tasteless","flavor","taste","bad taste","awful","terrible"],
        description: "Qualité gustative ou sensorielle insuffisante du produit"
      },
      {
        match: ["wrong","missing","incorrect","not what","different","expected"],
        description: "Commande incorrecte ou non conforme à la description"
      },
      {
        match: ["small","portion","tiny","not enough","quantity","size"],
        description: "Portions ou quantités insuffisantes par rapport au prix"
      },
      {
        match: ["overpriced","expensive","costly","not worth","value","rip"],
        description: "Rapport qualité-prix insuffisant aux yeux des clients"
      },
      {
        match: ["stale","expired","old","fresh","freshness","raw","undercooked"],
        description: "Problèmes de fraîcheur ou de cuisson des produits"
      },
      {
        match: ["damaged","broken","defective","leaking","packaging"],
        description: "Produits endommagés ou emballage défectueux à la livraison"
      },
    ],
    fallbackDescription: "Qualité du produit ou service non conforme aux attentes clients"
  },
];

/* ─────────────────────────────────────────────
   MAIN FUNCTION
───────────────────────────────────────────── */

export function analyzeRootCauses(
  problem: string,
  themes: ThemeAnalysis[],
  qualitative: QualitativeData,
  paretoIssues: ParetoItem[],
  reviews?: Review[]
): RootCauseAnalysis {

  /* ── STEP 1: Collect all texts from all sources ── */
  const allTexts: string[] = [];

  reviews?.forEach(r => { if (r.texte?.trim()) allTexts.push(r.texte.trim()); });
  qualitative.keyVerbatims?.forEach(v => { if (v.text?.trim()) allTexts.push(v.text.trim()); });
  themes.forEach(t => t.verbatims?.forEach(v => { if (v?.trim()) allTexts.push(v.trim()); }));
  qualitative.topKeywords?.forEach(kw => { if (kw.word?.trim()) allTexts.push(kw.word.trim()); });

  const uniqueTexts = [...new Set(allTexts)];

  /* ── STEP 2: Filter NEGATIVE reviews only ── */
  const negativeTexts = uniqueTexts.filter(text => {
    const matchingReview = reviews?.find(r => r.texte?.trim() === text);
    if (matchingReview) return matchingReview.note <= 3;

    const matchingVerbatim = qualitative.keyVerbatims?.find(v => v.text?.trim() === text);
    if (matchingVerbatim) {
      return matchingVerbatim.sentiment === "negative" || matchingVerbatim.rating <= 3;
    }

    return true; // theme verbatims and keywords kept by default
  });

  /* ── STEP 3: Expand problem tokens with synonyms ── */
  const problemTokens = tokenize(problem);
  const expandedTokens = expandProblemTokens(problemTokens);

  /* ── STEP 4: Filter reviews RELATED to the problem ── */
  const relevantTexts = negativeTexts.filter(text =>
    isRelatedToProblem(expandedTokens, text)
  );

  // Fallback: if too few matched, use all negative texts
  const textsForAnalysis = relevantTexts.length >= 2 ? relevantTexts : negativeTexts;

  /* ── STEP 5: Build Ishikawa categories ── */
  const finalCategories: RootCauseCategory[] = [];

  for (const categoryDef of ISHIKAWA_CATEGORIES) {
    // Find evidence texts that match this category's seeds
    const categoryEvidence = textsForAnalysis.filter(text => {
      const raw = normalize(text);
      const words = new Set(tokenize(text));
      return categoryDef.seeds.some(seed => words.has(seed) || raw.includes(seed));
    });

    if (categoryEvidence.length === 0) continue;

    // Within this category's evidence, apply business rules to find specific causes
    const causes: RootCause[] = [];

    for (const rule of categoryDef.rules) {
      // Find evidence texts that match this specific rule
      const ruleEvidence = categoryEvidence.filter(text => {
        const raw = normalize(text);
        const words = new Set(tokenize(text));
        return rule.match.some(keyword => words.has(keyword) || raw.includes(keyword));
      });

      if (ruleEvidence.length === 0) continue;

      const count = ruleEvidence.length;
      const probability: ProbabilityLevel =
        count >= 5 ? "Probable" :
        count >= 3 ? "Possible" :
        "Occasionnelle";

      causes.push({
        description: rule.description,
        probability,
        evidence: ruleEvidence.slice(0, 3),
        count
      });
    }

    // If no rules matched but category has evidence → use fallback description
    if (causes.length === 0 && categoryEvidence.length > 0) {
      const count = categoryEvidence.length;
      causes.push({
        description: categoryDef.fallbackDescription,
        probability: count >= 5 ? "Probable" : count >= 3 ? "Possible" : "Occasionnelle",
        evidence: categoryEvidence.slice(0, 3),
        count
      });
    }

    if (causes.length > 0) {
      finalCategories.push({ name: categoryDef.name, causes });
    }
  }

  /* ── STEP 6: Global fallback ── */
  if (finalCategories.length === 0 && textsForAnalysis.length > 0) {
    finalCategories.push({
      name: "Processus",
      causes: [{
        description: `Problème lié à "${problem}" identifié dans les avis négatifs`,
        probability: "Possible",
        evidence: textsForAnalysis.slice(0, 3),
        count: textsForAnalysis.length
      }]
    });
  }

  /* ── STEP 7: Build French summary ── */
  const allCauses = finalCategories.flatMap(c => c.causes).sort((a, b) => b.count - a.count);
  const probableCauses = allCauses.filter(c => c.probability === "Probable");
  const possibleCauses = allCauses.filter(c => c.probability === "Possible");

  let summary = "";
  if (probableCauses.length > 0) {
    const main = probableCauses[0];
    const others = probableCauses.slice(1).map(c => c.description.toLowerCase()).join(" et ");
    summary = `Les causes dominantes du problème "${problem}" sont principalement liées à ${main.description.toLowerCase()}${others ? `, avec des contributions de ${others}` : ""}.`;
  } else if (possibleCauses.length > 0) {
    summary = `Les causes probables du problème "${problem}" semblent liées à ${possibleCauses[0].description.toLowerCase()}, nécessitant une analyse plus approfondie.`;
  } else if (allCauses.length > 0) {
    summary = `Des causes occasionnelles ont été identifiées pour "${problem}" : ${allCauses[0].description.toLowerCase()}.`;
  } else {
    summary = `L'analyse des avis ne permet pas de déterminer une cause claire pour "${problem}" — une investigation terrain est recommandée.`;
  }

  return { problem, categories: finalCategories, summary };
}