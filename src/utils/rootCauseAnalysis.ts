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
import i18n from "i18next";

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
  // English
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","is","are","was","were","be","been","have","has","had",
  "do","did","will","would","could","should","not","no","very","too",
  "so","just","get","got","its","it","this","that","they","them","their",
  "we","our","you","your","my","me","he","she","his","her","i","am",
  "up","out","about","than","then","also","even","all","any","more",
  "much","never","ever","only","still","same","such","over","after",
  "again","back","there","here","when","what","which","who","how",
  "why","where","if","as","us","one","two","into","during",

  // French
  "le","la","les","un","une","des","et","ou","mais","dans","sur","à",
  "au","aux","de","du","pour","par","avec","sans","sous","entre",
  "depuis","vers","chez","est","sont","était","étaient","être","été",
  "avoir","a","ont","avait","avaient","fait","faire","fera","serait",
  "pourrait","devrait","ne","pas","non","très","trop","si","juste",
  "obtenir","eu","ce","cet","cette","ces","cela","ça","ils","elles",
  "leur","leurs","nous","notre","nos","vous","votre","vos","mon","ma",
  "mes","moi","toi","ton","ta","tes","il","elle","son","sa","ses",
  "je","tu","suis","es","sommes","êtes","sont","plus","moins","jamais",
  "toujours","encore","même","tout","tous","toute","toutes","aucun",
  "aucune","quelque","quelques","après","avant","pendant","encore",
  "ici","là","quand","quoi","quel","quelle","quelles","qui","comment",
  "pourquoi","où","si","comme","nous","un","deux","dans","pendant"
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
    hygiene: [
    // English
    "dirty","filthy","unclean","disgusting","gross","grimy",
    "unhygienic","contaminated","stain","stained","sticky",
    "smell","smells","smelly","odor","odour","stench",
    "cockroach","rat","mice","insect","pest","hair","mold",
    "mould","trash","garbage","waste","bathroom","toilet",
    "restroom","washroom","floor","table","plate","glass",
    "utensil","kitchen","grease","greasy","residue",

    // French
    "sale","saleté","salee","salees","dégueulasse","dégoûtant",
    "malpropre","insalubre","contaminé","contamine","tache",
    "taché","tachée","collant","collante","odeur","mauvaise odeur",
    "puanteur","cafard","blatte","rat","souris","insecte","parasite",
    "cheveu","moisissure","poubelle","déchet","toilettes","wc",
    "lavabo","sol","table","assiette","verre","ustensile",
    "cuisine","graisse","gras","résidu","residu"
  ],

  cleanliness: [
    "dirty","filthy","unclean","disgusting","gross","stain",
    "sticky","smell","smelly","trash","messy","grimy",

    "sale","malpropre","dégueulasse","dégoûtant","taché",
    "collant","odeur","puant","poubelle","désordre","gras"
  ],

  // Service & wait
  service: [
    "wait","waiting","slow","staff","rude","unhelpful",
    "ignored","attitude","unprofessional","server","waiter",
    "attentive","inattentive","helpless","useless",

    "attente","lent","lente","personnel","impoli","désagréable",
    "ignoré","ignore","attitude","professionnel","serveur",
    "serveuse","inattentif","inutile","aucune aide",
    "service","accueil","médiocre","horrible"
  ],

  wait: [
    "slow","long","waiting","delay","delayed","forever",
    "hours","queue","line","took","minutes","ages","eternity",

    "lent","long","attente","retard","retardé","retarde",
    "heures","file","queue","minutes","éternité","beaucoup trop long"
  ],

  speed: [
    "slow","fast","quick","delay","delayed","wait","long","sluggish",

    "lent","rapide","vite","retard","attente","long","lenteur"
  ],

  attente: [
    "slow","long","waiting","delay","queue","line","took","minutes",

    "lent","attente","retard","queue","minutes","heures"
  ],

  // Food & product quality
  food: [
    "taste","flavor","bland","cold","raw","overcooked",
    "undercooked","stale","expired","fresh","quality",
    "portion","small","wrong","missing","soggy","hard",
    "burnt","chewy","dry","greasy","spicy","salty",

    "goût","gout","saveur","fade","froid","cru","trop cuit",
    "pas assez cuit","rassis","expiré","frais","qualité",
    "portion","petit","mauvais","manquant","mou","dur",
    "brûlé","sec","gras","épicé","salé"
  ],

  quality: [
    "poor","bad","terrible","awful","mediocre","cheap",
    "fake","defective","broken","damaged","wrong","inferior",
    "substandard","disappointing","unacceptable",

    "mauvais","terrible","horrible","médiocre","bon marché",
    "faux","défectueux","cassé","endommagé","inférieur",
    "décevant","inacceptable","qualité médiocre"
  ],

  // Pricing
  price: [
    "expensive","overpriced","costly","cheap","value","worth",
    "rip","ripoff","charged","billing","refund","fee","cost",

    "cher","trop cher","hors de prix","coûteux","pas cher",
    "valeur","prix","arnaque","facturé","facturation",
    "remboursement","frais","coût","surfacturé"
  ],

  pricing: [
    "expensive","overpriced","costly","value","worth",
    "rip","ripoff","charged","billing","refund",

    "cher","trop cher","coûteux","valeur","arnaque",
    "facturé","facturation","remboursement"
  ],

  // Delivery & logistics
  delivery: [
    "late","delayed","missing","wrong","damaged","lost",
    "driver","courier","tracking","package","shipping",
    "undelivered","returned","address",

    "retard","retardé","manquant","mauvais","endommagé",
    "perdu","livreur","courrier","suivi","colis",
    "livraison","non livré","retourné","adresse"
  ],

  // Staff & personnel
  staff: [
    "rude","unprofessional","unhelpful","ignorant","arrogant",
    "impolite","dismissive","lazy","incompetent","attitude",
    "untrained","disrespectful","offensive","hostile",

    "impoli","non professionnel","désagréable","ignorant",
    "arrogant","paresseux","incompétent","attitude",
    "mal formé","irrespectueux","offensant","hostile"
  ],

  personnel: [
    "rude","unprofessional","unhelpful","attitude","untrained",
    "dismissive","incompetent","disrespectful",

    "impoli","non professionnel","désagréable","attitude",
    "mal formé","incompétent","irrespectueux"
  ],

  // Noise & environment
  noise: [
    "loud","noisy","crowded","music","sound","quiet","disturbing",

    "bruyant","bruyante","bruit","bondé","musique",
    "son","calme","dérangeant"
  ],

  environment: [
    "dirty","crowded","noisy","dark","cold","hot","uncomfortable",
    "small","parking","access","cramped","stuffy","unkempt",

    "sale","bondé","bruyant","sombre","froid","chaud",
    "inconfortable","petit","parking","accès","étouffant",
    "mal entretenu"
  ],

  // Technical / digital
  app: [
    "crash","bug","error","slow","loading","freeze","broken",
    "login","payment","update","glitch","down","unavailable",

    "plantage","bug","erreur","lent","chargement","figé",
    "cassé","connexion","paiement","mise à jour",
    "panne","indisponible"
  ],

  website: [
    "crash","bug","error","slow","loading","freeze","broken",
    "login","payment","update","glitch","down","unavailable",

    "plantage","bug","erreur","lent","chargement","figé",
    "cassé","connexion","paiement","mise à jour",
    "panne","indisponible"
  ],

  system: [
    "crash","bug","error","slow","freeze","broken","down",
    "unavailable","glitch","malfunction","offline",

    "plantage","bug","erreur","lent","figé","cassé",
    "panne","indisponible","dysfonctionnement","hors ligne"
  ],

  // Added categories

  communication: [
    "no response","ignored","unclear","confusing","misleading",
    "lied","rude response","support","email","call",

    "aucune réponse","ignoré","pas clair","confus",
    "trompeur","mensonge","support","email","appel"
  ],

  payment: [
    "charged twice","double charge","refund","payment failed",
    "billing issue","overcharged","transaction","card declined",

    "double facturation","paiement refusé","remboursement",
    "problème de paiement","surfacturé","transaction",
    "carte refusée"
  ],

  booking: [
    "reservation","booking","cancelled","unavailable","full",
    "reschedule","confirmation","no show",

    "réservation","booking","annulé","indisponible",
    "complet","replanifier","confirmation","absence"
  ],

  maintenance: [
    "broken","damaged","leak","repair","maintenance","dirty",
    "air conditioning","heating","light","wifi",

    "cassé","endommagé","fuite","réparation","maintenance",
    "climatisation","chauffage","lumière","wifi"
  ],

  security: [
    "unsafe","dangerous","theft","stolen","security","fraud",
    "scam","suspicious",

    "dangereux","pas sûr","vol","volé","sécurité",
    "fraude","arnaque","suspect"
  ]
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
  match: string[];
  /** i18n key — resolved via t() at runtime */
  descriptionKey: string;
}

interface CategoryDefinition {
  /** i18n key for the category name */
  nameKey: string;
  seeds: string[];
  rules: CategoryRule[];
  /** i18n key used when no specific rule matches */
  fallbackKey: string;
}

const ISHIKAWA_CATEGORIES: CategoryDefinition[] = [
  {
    nameKey: "rootCause.categories.workforce.name",
    seeds: [
    // English
      "staff","employee","employees","worker","workers","team","agent","manager",
      "supervisor","representative","associate","cashier","waiter","waitress",
      "server","driver","technician","consultant","crew","attendant",
      "rude","unprofessional","unhelpful","incompetent","unfriendly","impolite",
      "ignorant","arrogant","dismissive","lazy","untrained","inexperienced",
      "careless","indifferent","disrespectful","hostile","offensive",
      "ignored","refused","yelled","lied","forgot","attitude","behavior","training",

      // French
      "personnel","employé","employée","employés","travailleur","travailleurs",
      "équipe","agent","gérant","manager","superviseur","représentant",
      "associé","caissier","caissière","serveur","serveuse","chauffeur",
      "technicien","consultant","équipage","préposé","assistant",

      "impoli","désagréable","non professionnel","inutile","incompétent",
      "pas aimable","malpoli","ignorant","arrogant","méprisant",
      "paresseux","mal formé","inexpérimenté","négligent","indifférent",
      "irrespectueux","hostile","offensant",

      "ignoré","refusé","crié","menti","oublié",
      "attitude","comportement","formation","accueil","service client"
    ],
    rules: [
  {
        match: [
      // English
      "rude","impolite","arrogant","disrespectful","hostile","offensive","yelled",

      // French
      "impoli","malpoli","arrogant","irrespectueux","hostile",
      "offensant","crié","désagréable","méprisant"
    ],
        descriptionKey: "rootCause.categories.workforce.causes.disrespectful"
      },
      {
       match: [
      // English
      "unprofessional","untrained","inexperienced","incompetent","useless",

      // French
      "non professionnel","mal formé","inexpérimenté",
      "incompétent","inutile","pas qualifié"
    ],
        descriptionKey: "rootCause.categories.workforce.causes.untrained"
      },
      {
        match: [
      // English
      "ignored","unhelpful","dismissive","indifferent","careless","forgot",

      // French
      "ignoré","sans aide","méprisant","indifférent",
      "négligent","oublié","pas attentif","aucune assistance"
    ],
        descriptionKey: "rootCause.categories.workforce.causes.inattentive"
      },
      {
        match: [
      // English
      "shortage","few staff","understaffed","not enough staff","one person",

      // French
      "manque de personnel","pas assez de personnel",
      "sous-effectif","une seule personne","effectif réduit"
      ],
        descriptionKey: "rootCause.categories.workforce.causes.understaffed"
      },
    ],
    fallbackKey: "rootCause.categories.workforce.fallback"
  },
  {
    nameKey: "rootCause.categories.process.name",
    seeds: [
      // English
      "process","procedure","queue","line","wait","waiting","delay","delayed",
      "slow","booking","reservation","appointment","scheduling","dispatch",
      "tracking","confirmation","approval","verification","checkout","checkin",
      "onboarding","registration","stuck","pending","unresolved","backlog",
      "bottleneck","inefficient","disorganized","chaotic","complicated","order",
      "refund","return","exchange","complaint",

      // French
      "processus","procédure","procedure","file","queue","attente","retard",
      "retardé","lent","réservation","booking","rendez-vous","planification",
      "expédition","suivi","confirmation","approbation","vérification",
      "paiement","enregistrement","inscription","bloqué","en attente",
      "non résolu","retard accumulé","goulot","inefficace","désorganisé",
      "chaotique","compliqué","commande","remboursement","retour",
      "échange","plainte","réclamation"
    ],

    rules: [
      {
        match: [
          // English
          "wait","waiting","queue","line","long time","ages","forever","hours","minutes",

          // French
          "attente","longue attente","file","queue","des heures",
          "minutes","éternité","trop long","beaucoup trop long"
        ],
        descriptionKey: "rootCause.categories.process.causes.waitTime"
      },

      {
        match: [
          // English
          "reservation","booking","appointment","overbooked","surbooking",

          // French
          "réservation","booking","rendez-vous",
          "surréservation","surbooké","complet"
        ],
        descriptionKey: "rootCause.categories.process.causes.booking"
      },

      {
        match: [
          // English
          "delay","delayed","late","slow","took long","pending","unresolved",

          // French
          "retard","retardé","en retard","lent",
          "a pris longtemps","en attente","non résolu"
        ],
        descriptionKey: "rootCause.categories.process.causes.delays"
      },

      {
        match: [
          // English
          "refund","return","exchange","complaint","unresolved","ignored",

          // French
          "remboursement","retour","échange",
          "plainte","réclamation","non résolu","ignoré"
        ],
        descriptionKey: "rootCause.categories.process.causes.complaints"
      },

      {
        match: [
          // English
          "disorganized","chaotic","complicated","confusing","no system",

          // French
          "désorganisé","chaotique","compliqué",
          "confus","pas de système","mal organisé"
        ],
        descriptionKey: "rootCause.categories.process.causes.disorganized"
      }
    ],
    fallbackKey: "rootCause.categories.process.fallback"
  },
  {
    nameKey: "rootCause.categories.methods.name",
   seeds: [
      // English
      "method","approach","policy","protocol","standard","practice","guideline",
      "rule","instruction","communication","coordination","response","followup",
      "escalation","handling","priority","workflow","inconsistent","unclear",
      "confusing","misleading","wrong","incorrect","outdated","inadequate","poor",
      "lack","missing","no response","unacknowledged","priority","forgot",

      // French
      "méthode","approche","politique","protocole","standard","pratique",
      "directive","règle","instruction","communication","coordination",
      "réponse","suivi","escalade","gestion","priorité","flux de travail",
      "incohérent","pas clair","confus","trompeur","mauvais","incorrect",
      "obsolète","inadéquat","faible","manque","manquant","aucune réponse",
      "ignoré","non reconnu","oublié"
    ],

    rules: [
      {
        match: [
          // English
          "coordination","communication","team","internal","between",

          // French
          "coordination","communication","équipe",
          "interne","entre","manque de communication"
        ],
        descriptionKey: "rootCause.categories.methods.causes.coordination"
      },

      {
        match: [
          // English
          "inconsistent","different","every time","sometimes","depends",

          // French
          "incohérent","différent","à chaque fois",
          "parfois","ça dépend","pas constant"
        ],
        descriptionKey: "rootCause.categories.methods.causes.inconsistent"
      },

      {
        match: [
          // English
          "no response","ignored","unacknowledged","followup","never heard",

          // French
          "aucune réponse","ignoré","sans réponse",
          "non reconnu","suivi","jamais eu de réponse"
        ],
        descriptionKey: "rootCause.categories.methods.causes.noFollowUp"
      },

      {
        match: [
          // English
          "priority","forgot","skipped","missed","overlooked",

          // French
          "priorité","oublié","ignoré","manqué",
          "négligé","passé à côté"
        ],
        descriptionKey: "rootCause.categories.methods.causes.badPriority"
      }
    ],
    fallbackKey: "rootCause.categories.methods.fallback"
  },
  {
    nameKey: "rootCause.categories.tools.name",
    seeds: [
      // English
      "app","application","website","site","platform","software","system","tool",
      "machine","device","terminal","kiosk","payment","checkout","interface",
      "portal","dashboard","bug","crash","error","glitch","broken","not working",
      "down","unavailable","offline","loading","freeze","failed","malfunction",
      "outdated","update","pos","register","scanner","printer",

      // French
      "application","appli","site","site web","plateforme","logiciel","système",
      "outil","machine","appareil","terminal","borne","paiement","caisse",
      "interface","portail","tableau de bord","bug","plantage","erreur",
      "problème","cassé","ne fonctionne pas","en panne","indisponible",
      "hors ligne","chargement","figé","échec","dysfonctionnement",
      "obsolète","mise à jour","scanner","imprimante","logiciel ancien"
    ],

    rules: [
      {
        match: [
          // English
          "bug","crash","error","glitch","freeze","not working","broken","malfunction",

          // French
          "bug","plantage","erreur","problème","figé",
          "ne fonctionne pas","cassé","dysfonctionnement",
          "bloqué","panne"
        ],
        descriptionKey: "rootCause.categories.tools.causes.crashes"
      },

      {
        match: [
          // English
          "payment","billing","checkout","transaction","charged","refund",

          // French
          "paiement","facturation","caisse","transaction",
          "facturé","remboursement","double facturation",
          "paiement refusé"
        ],
        descriptionKey: "rootCause.categories.tools.causes.payment"
      },

      {
        match: [
          // English
          "slow","loading","down","unavailable","offline","lag",

          // French
          "lent","chargement","en panne","indisponible",
          "hors ligne","latence","ralenti"
        ],
        descriptionKey: "rootCause.categories.tools.causes.performance"
      },

      {
        match: [
          // English
          "outdated","old","update","obsolete","legacy",

          // French
          "obsolète","ancien","vieille version",
          "mise à jour","dépassé","logiciel ancien"
        ],
        descriptionKey: "rootCause.categories.tools.causes.outdated"
      }
    ],
    fallbackKey: "rootCause.categories.tools.fallback"
  },
  {
    nameKey: "rootCause.categories.environment.name",
    seeds: [
      // English
      "place","location","store","shop","restaurant","branch","outlet","facility",
      "parking","access","entrance","space","area","room","table","seat","seating",
      "floor","dirty","unclean","filthy","disgusting","gross","grimy","unhygienic",
      "contaminated","stain","sticky","smell","smells","smelly","odor","stench",
      "cockroach","rat","mice","insect","pest","hair","mold","trash","garbage",
      "noisy","crowded","packed","small","dark","hot","cold","uncomfortable",
      "broken","maintenance","hygiene","cleanliness","hours","busy","rush",
      "bathroom","toilet","restroom","washroom","grease","greasy",

      // French
      "endroit","lieu","magasin","boutique","restaurant","succursale",
      "point de vente","établissement","parking","accès","entrée",
      "espace","zone","salle","table","siège","place assise","sol",
      "sale","malpropre","dégueulasse","dégoûtant","gras","insalubre",
      "contaminé","tache","collant","odeur","mauvaise odeur","puanteur",
      "cafard","rat","souris","insecte","parasite","cheveu",
      "moisissure","poubelle","déchet","bruyant","bondé","plein",
      "petit","sombre","chaud","froid","inconfortable","cassé",
      "maintenance","hygiène","propreté","heures","occupé","rush",
      "toilettes","wc","lavabo","graisse","graisseux","étouffant"
    ],

    rules: [
      {
        match: [
          // English
          "dirty","filthy","unclean","disgusting","gross","grimy","unhygienic",
          "stain","sticky","mold","grease","greasy","residue",

          // French
          "sale","malpropre","dégueulasse","dégoûtant","gras",
          "insalubre","tache","collant","moisissure","graisse",
          "graisseux","résidu"
        ],
        descriptionKey: "rootCause.categories.environment.causes.cleanliness"
      },

      {
        match: [
          // English
          "smell","smells","smelly","odor","odour","stench",

          // French
          "odeur","mauvaise odeur","puanteur","ça sent mauvais",
          "odorant","malodorant"
        ],
        descriptionKey: "rootCause.categories.environment.causes.odor"
      },

      {
        match: [
          // English
          "cockroach","rat","mice","insect","pest","hair","contaminated","bacteria",

          // French
          "cafard","blatte","rat","souris","insecte",
          "parasite","cheveu","contaminé","bactérie"
        ],
        descriptionKey: "rootCause.categories.environment.causes.pests"
      },

      {
        match: [
          // English
          "noisy","loud","noise","music","disturbing",

          // French
          "bruyant","bruyante","bruit","musique","dérangeant",
          "trop de bruit"
        ],
        descriptionKey: "rootCause.categories.environment.causes.noise"
      },

      {
        match: [
          // English
          "crowded","packed","full","busy","rush","small","cramped",

          // French
          "bondé","plein","occupé","rush","petit",
          "serré","étroit","surpeuplé"
        ],
        descriptionKey: "rootCause.categories.environment.causes.overcrowded"
      },

      {
        match: [
          // English
          "cold","hot","temperature","stuffy","ventilation","air",

          // French
          "froid","chaud","température","étouffant",
          "ventilation","air","climatisation"
        ],
        descriptionKey: "rootCause.categories.environment.causes.temperature"
      },

      {
        match: [
          // English
          "parking","access","location","entrance","find","hard to",

          // French
          "parking","accès","emplacement","entrée",
          "difficile à trouver","introuvable","mal situé"
        ],
        descriptionKey: "rootCause.categories.environment.causes.access"
      }
    ],
    fallbackKey: "rootCause.categories.environment.fallback"
  },
  {
    nameKey: "rootCause.categories.product.name",
    seeds: [
      // English
      "product","item","order","food","meal","dish","drink","service","quality",
      "taste","flavor","portion","size","quantity","packaging","delivery",
      "shipping","wrong","missing","damaged","expired","stale","cold","overpriced",
      "expensive","cheap","value","waste","defective","fake","inaccurate",
      "description","expectation","bland","raw","overcooked","undercooked",
      "soggy","hard","burnt","chewy","dry","spicy","salty",

      // French
      "produit","article","commande","nourriture","repas","plat","boisson",
      "service","qualité","goût","saveur","portion","taille","quantité",
      "emballage","livraison","expédition","mauvais","manquant","endommagé",
      "expiré","rassis","froid","trop cher","cher","bon marché","valeur",
      "gaspillage","défectueux","faux","inexact","description","attente",
      "fade","cru","trop cuit","pas assez cuit","mou","dur","brûlé",
      "caoutchouteux","sec","épicé","salé"
    ],

    rules: [
      {
        match: [
          // English
          "cold","warm","temperature","not hot","lukewarm","reheated",

          // French
          "froid","tiède","température","pas chaud",
          "réchauffé","chauffé"
        ],
        descriptionKey: "rootCause.categories.product.causes.temperature"
      },

      {
        match: [
          // English
          "bland","tasteless","flavor","taste","bad taste","awful","terrible",

          // French
          "fade","sans goût","goût","saveur",
          "mauvais goût","horrible","immangeable","dégoûtant"
        ],
        descriptionKey: "rootCause.categories.product.causes.taste"
      },

      {
        match: [
          // English
          "wrong","missing","incorrect","not what","different","expected",

          // French
          "mauvais","manquant","incorrect","différent",
          "pas ce que j'ai commandé","pas attendu","erreur"
        ],
        descriptionKey: "rootCause.categories.product.causes.wrongOrder"
      },

      {
        match: [
          // English
          "small","portion","tiny","not enough","quantity","size",

          // French
          "petit","portion","minuscule","pas assez",
          "quantité","taille","trop petit"
        ],
        descriptionKey: "rootCause.categories.product.causes.portions"
      },

      {
        match: [
          // English
          "overpriced","expensive","costly","not worth","value","rip",

          // French
          "trop cher","cher","coûteux","pas rentable",
          "pas la peine","valeur","arnaque"
        ],
        descriptionKey: "rootCause.categories.product.causes.pricing"
      },

      {
        match: [
          // English
          "stale","expired","old","fresh","freshness","raw","undercooked",

          // French
          "rassis","expiré","vieux","frais","fraîcheur",
          "cru","pas assez cuit"
        ],
        descriptionKey: "rootCause.categories.product.causes.freshness"
      },

      {
        match: [
          // English
          "damaged","broken","defective","leaking","packaging",

          // French
          "endommagé","cassé","défectueux","fuite",
          "emballage","abîmé"
        ],
        descriptionKey: "rootCause.categories.product.causes.damaged"
      }
    ],
    fallbackKey: "rootCause.categories.product.fallback"
  },
];

/* ─────────────────────────────────────────────
   PROBABILITY HELPER
   Maps count → i18n key, then resolves via t()
───────────────────────────────────────────── */

function getProbabilityKey(count: number): string {
  if (count >= 5) return "rootCause.probability.probable";
  if (count >= 3) return "rootCause.probability.possible";
  return "rootCause.probability.occasional";
}

/**
 * Maps the resolved translated probability string back to the
 * ProbabilityLevel type so the rest of the app stays compatible.
 * We keep the internal enum in French (matching the original type)
 * and use t() only for display.
 */
function getProbabilityLevel(count: number): ProbabilityLevel {
  if (count >= 5) return "Probable";
  if (count >= 3) return "Possible";
  return "Occasionnelle";
}

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
  const t = i18n.t.bind(i18n); 
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

      causes.push({
        description: t(rule.descriptionKey),
        probability: getProbabilityLevel(count),
        evidence: ruleEvidence.slice(0, 3),
        count
      });
    }

    if (causes.length === 0 && categoryEvidence.length > 0) {
      const count = categoryEvidence.length;
      causes.push({
        description: t(categoryDef.fallbackKey),
        probability: getProbabilityLevel(count),
        evidence: categoryEvidence.slice(0, 3),
        count
      });
    }

    if (causes.length > 0) {
      finalCategories.push({
        name: t(categoryDef.nameKey),
        causes
      });
    }
  }

  /* ── STEP 6: Global fallback ── */
  if (finalCategories.length === 0 && textsForAnalysis.length > 0) {
    finalCategories.push({
      name: t("rootCause.categories.process.name"),
      causes: [{
        description: t("rootCause.summary.globalFallback", { problem }),
        probability: "Possible",
        evidence: textsForAnalysis.slice(0, 3),
        count: textsForAnalysis.length
      }]
    });
  }

  /* ── STEP 7: Build localised summary ── */
  const allCauses = finalCategories.flatMap(c => c.causes).sort((a, b) => b.count - a.count);
  const probableCauses = allCauses.filter(c => c.probability === "Probable");
  const possibleCauses = allCauses.filter(c => c.probability === "Possible");

  let summary = "";
  if (probableCauses.length > 0) {
    const main = probableCauses[0];
    const otherDescriptions = probableCauses
      .slice(1)
      .map(c => c.description.toLowerCase())
      .join(t("rootCause.summary.and"));

    summary = otherDescriptions
      ? t("rootCause.summary.dominantWithOthers", {
          problem,
          main: main.description.toLowerCase(),
          others: otherDescriptions
        })
      : t("rootCause.summary.dominant", {
          problem,
          main: main.description.toLowerCase()
        });

  } else if (possibleCauses.length > 0) {
    summary = t("rootCause.summary.possible", {
      problem,
      cause: possibleCauses[0].description.toLowerCase()
    });
  } else if (allCauses.length > 0) {
    summary = t("rootCause.summary.occasional", {
      problem,
      cause: allCauses[0].description.toLowerCase()
    });
  } else {
    summary = t("rootCause.summary.noData", { problem });
  }

  return { problem, categories: finalCategories, summary };
}