import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";

export type ProbabilityLevel = "Probable" | "Possible" | "Occasionnelle";

export interface RootCause {
  description: string;
  probability: ProbabilityLevel;
  evidence?: string[]; // Verbatims ou mots-clés qui supportent cette cause
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

/**
 * Analyse les causes racines d'un problème donné à partir des données d'avis
 */
export function analyzeRootCauses(
  problem: string,
  themes: ThemeAnalysis[],
  qualitative: QualitativeData,
  paretoIssues: ParetoItem[],
  reviews?: Review[]
): RootCauseAnalysis {
  // Normaliser le nom du problème pour la recherche
  const problemLower = problem.toLowerCase();
  const isServiceAttente = problemLower.includes("service") || 
                          problemLower.includes("attente") || 
                          problemLower.includes("temps") ||
                          problemLower.includes("lent");

  // Extraire les verbatims et mots-clés pertinents
  const relevantVerbatims: string[] = [];
  const relevantKeywords: string[] = [];

  // Chercher dans les thèmes
  themes.forEach(theme => {
    const themeLower = theme.theme.toLowerCase();
    if (themeLower.includes("service") || themeLower.includes("attente") || themeLower.includes("temps")) {
      relevantVerbatims.push(...(theme.verbatims || []));
    }
  });

  // Chercher dans les mots-clés
  const serviceKeywords = ['attente', 'longue', 'lent', 'serveur', 'service', 'staff', 'personnel', 'accueil', 'réservation'];
  qualitative.topKeywords?.forEach(kw => {
    if (serviceKeywords.some(sk => kw.word.toLowerCase().includes(sk))) {
      relevantKeywords.push(kw.word);
    }
  });

  // Chercher dans les verbatims clés
  qualitative.keyVerbatims?.forEach(v => {
    const textLower = v.text.toLowerCase();
    if (serviceKeywords.some(sk => textLower.includes(sk)) && 
        (v.sentiment === 'negative' || v.rating <= 3)) {
      relevantVerbatims.push(v.text);
    }
  });

  // Chercher dans les reviews bruts si disponibles
  if (reviews) {
    reviews.forEach(review => {
      const textLower = review.texte.toLowerCase();
      if (serviceKeywords.some(sk => textLower.includes(sk)) && review.note <= 3) {
        relevantVerbatims.push(review.texte);
      }
    });
  }

  // Analyser les causes par catégorie Ishikawa
  const categories: RootCauseCategory[] = [];

  // 1. Main-d'œuvre
  const workforceCauses: RootCause[] = [];
  const workforceKeywords = ['serveur', 'staff', 'personnel', 'équipe', 'employé', 'serveuse'];
  const workforceEvidence = relevantVerbatims.filter(v => 
    workforceKeywords.some(kw => v.toLowerCase().includes(kw))
  );

  if (workforceEvidence.length > 0 || relevantKeywords.some(kw => workforceKeywords.some(wk => kw.includes(wk)))) {
    // Manque de personnel
    if (relevantVerbatims.some(v => v.toLowerCase().includes("manque") || v.toLowerCase().includes("peu"))) {
      workforceCauses.push({
        description: "Effectif insuffisant pour gérer l'affluence",
        probability: "Probable",
        evidence: workforceEvidence.slice(0, 2)
      });
    }
    // Formation ou compétence
    if (relevantVerbatims.some(v => v.toLowerCase().includes("inexpérimenté") || v.toLowerCase().includes("mal"))) {
      workforceCauses.push({
        description: "Formation ou compétences du personnel à améliorer",
        probability: "Possible",
        evidence: workforceEvidence.slice(0, 1)
      });
    }
    // Absence ou rotation
    if (relevantVerbatims.some(v => v.toLowerCase().includes("absent") || v.toLowerCase().includes("changement"))) {
      workforceCauses.push({
        description: "Rotation du personnel ou absences fréquentes",
        probability: "Occasionnelle",
        evidence: workforceEvidence.slice(0, 1)
      });
    }
  }

  if (workforceCauses.length === 0 && workforceEvidence.length > 0) {
    workforceCauses.push({
      description: "Problèmes liés au personnel de service",
      probability: "Possible",
      evidence: workforceEvidence.slice(0, 1)
    });
  }

  if (workforceCauses.length > 0) {
    categories.push({ name: "Main-d'œuvre", causes: workforceCauses });
  }

  // 2. Processus
  const processCauses: RootCause[] = [];
  const processKeywords = ['processus', 'organisation', 'gestion', 'planning', 'réservation'];
  const processEvidence = relevantVerbatims.filter(v => 
    processKeywords.some(kw => v.toLowerCase().includes(kw)) ||
    v.toLowerCase().includes("réservation") ||
    v.toLowerCase().includes("planning")
  );

  // Problèmes de réservation
  if (relevantVerbatims.some(v => v.toLowerCase().includes("réservation") || v.toLowerCase().includes("booking"))) {
    processCauses.push({
      description: "Système de réservation inefficace ou surbooking",
      probability: "Probable",
      evidence: processEvidence.filter(v => v.toLowerCase().includes("réservation")).slice(0, 2)
    });
  }

  // Organisation du service
  if (relevantVerbatims.some(v => v.toLowerCase().includes("organisation") || v.toLowerCase().includes("chaos"))) {
    processCauses.push({
      description: "Organisation du service à optimiser",
      probability: "Probable",
      evidence: processEvidence.slice(0, 2)
    });
  }

  // Gestion des files d'attente
  if (relevantVerbatims.some(v => v.toLowerCase().includes("file") || v.toLowerCase().includes("queue"))) {
    processCauses.push({
      description: "Absence ou mauvaise gestion des files d'attente",
      probability: "Possible",
      evidence: processEvidence.slice(0, 1)
    });
  }

  if (processCauses.length === 0 && (relevantVerbatims.length > 0 || relevantKeywords.length > 0)) {
    processCauses.push({
      description: "Processus de service à revoir",
      probability: "Possible",
      evidence: relevantVerbatims.slice(0, 1)
    });
  }

  if (processCauses.length > 0) {
    categories.push({ name: "Processus", causes: processCauses });
  }

  // 3. Méthodes de service
  const methodCauses: RootCause[] = [];
  const methodEvidence = relevantVerbatims.filter(v => 
    v.toLowerCase().includes("méthode") ||
    v.toLowerCase().includes("façon") ||
    v.toLowerCase().includes("manière")
  );

  // Service trop lent
  if (relevantKeywords.includes("lent") || relevantVerbatims.some(v => v.toLowerCase().includes("lent"))) {
    methodCauses.push({
      description: "Rythme de service trop lent",
      probability: "Probable",
      evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("lent")).slice(0, 2)
    });
  }

  // Priorisation des tables
  if (relevantVerbatims.some(v => v.toLowerCase().includes("priorité") || v.toLowerCase().includes("oubli"))) {
    methodCauses.push({
      description: "Mauvaise priorisation ou oubli de certaines tables",
      probability: "Possible",
      evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("priorité") || v.toLowerCase().includes("oubli")).slice(0, 1)
    });
  }

  // Coordination entre équipes
  if (relevantVerbatims.some(v => v.toLowerCase().includes("coordination") || v.toLowerCase().includes("communication"))) {
    methodCauses.push({
      description: "Manque de coordination entre les équipes",
      probability: "Occasionnelle",
      evidence: relevantVerbatims.filter(v => v.toLowerCase().includes("coordination") || v.toLowerCase().includes("communication")).slice(0, 1)
    });
  }

  if (methodCauses.length === 0 && relevantKeywords.includes("lent")) {
    methodCauses.push({
      description: "Méthodes de service à optimiser",
      probability: "Possible",
      evidence: relevantVerbatims.slice(0, 1)
    });
  }

  if (methodCauses.length > 0) {
    categories.push({ name: "Méthodes de service", causes: methodCauses });
  }

  // 4. Outils & systèmes
  const toolsCauses: RootCause[] = [];
  const toolsKeywords = ['système', 'outil', 'logiciel', 'technologie', 'caisse', 'commande'];
  const toolsEvidence = relevantVerbatims.filter(v => 
    toolsKeywords.some(kw => v.toLowerCase().includes(kw))
  );

  // Système de commande
  if (relevantVerbatims.some(v => v.toLowerCase().includes("commande") || v.toLowerCase().includes("order"))) {
    toolsCauses.push({
      description: "Système de prise de commande inefficace ou lent",
      probability: "Possible",
      evidence: toolsEvidence.filter(v => v.toLowerCase().includes("commande")).slice(0, 1)
    });
  }

  // Outils de gestion
  if (relevantVerbatims.some(v => v.toLowerCase().includes("caisse") || v.toLowerCase().includes("paiement"))) {
    toolsCauses.push({
      description: "Problèmes avec les outils de caisse ou de paiement",
      probability: "Occasionnelle",
      evidence: toolsEvidence.filter(v => v.toLowerCase().includes("caisse") || v.toLowerCase().includes("paiement")).slice(0, 1)
    });
  }

  if (toolsCauses.length === 0 && toolsEvidence.length > 0) {
    toolsCauses.push({
      description: "Outils ou systèmes à améliorer",
      probability: "Occasionnelle",
      evidence: toolsEvidence.slice(0, 1)
    });
  }

  if (toolsCauses.length > 0) {
    categories.push({ name: "Outils & systèmes", causes: toolsCauses });
  }

  // 5. Contexte & affluence
  const contextCauses: RootCause[] = [];
  const contextKeywords = ['affluence', 'plein', 'bondé', 'week-end', 'soir', 'rush', 'pic'];
  const contextEvidence = relevantVerbatims.filter(v => 
    contextKeywords.some(kw => v.toLowerCase().includes(kw))
  );

  // Pic d'affluence
  if (relevantVerbatims.some(v => contextKeywords.some(kw => v.toLowerCase().includes(kw)))) {
    contextCauses.push({
      description: "Gestion difficile des pics d'affluence (week-ends, soirs)",
      probability: "Probable",
      evidence: contextEvidence.slice(0, 2)
    });
  }

  // Capacité d'accueil
  if (relevantVerbatims.some(v => v.toLowerCase().includes("capacité") || v.toLowerCase().includes("trop petit"))) {
    contextCauses.push({
      description: "Capacité d'accueil insuffisante pour la demande",
      probability: "Possible",
      evidence: contextEvidence.filter(v => v.toLowerCase().includes("capacité") || v.toLowerCase().includes("petit")).slice(0, 1)
    });
  }

  if (contextCauses.length === 0 && (relevantVerbatims.length > 0 || relevantKeywords.length > 0)) {
    contextCauses.push({
      description: "Contexte d'affluence non anticipé",
      probability: "Possible",
      evidence: relevantVerbatims.slice(0, 1)
    });
  }

  if (contextCauses.length > 0) {
    categories.push({ name: "Contexte & affluence", causes: contextCauses });
  }

  // Si aucune catégorie n'a été identifiée, créer des causes génériques basées sur les données
  if (categories.length === 0) {
    if (relevantVerbatims.length > 0 || relevantKeywords.length > 0) {
      categories.push({
        name: "Processus",
        causes: [{
          description: "Problèmes de service ou d'attente identifiés dans les avis",
          probability: "Possible",
          evidence: relevantVerbatims.slice(0, 2)
        }]
      });
    }
  }

  // Générer la synthèse
  const probableCauses = categories.flatMap(cat => 
    cat.causes.filter(c => c.probability === "Probable")
  );
  const possibleCauses = categories.flatMap(cat => 
    cat.causes.filter(c => c.probability === "Possible")
  );

  let summary = "";
  if (probableCauses.length > 0) {
    const mainCause = probableCauses[0];
    summary = `Les causes dominantes du problème "${problem}" sont principalement liées à ${mainCause.description.toLowerCase()}, avec des contributions probables de ${probableCauses.slice(1).map(c => c.description.toLowerCase()).join(" et ")}.`;
  } else if (possibleCauses.length > 0) {
    summary = `Les causes probables du problème "${problem}" semblent être liées à ${possibleCauses[0].description.toLowerCase()}, nécessitant une analyse plus approfondie pour confirmer.`;
  } else {
    summary = `L'analyse des avis suggère que le problème "${problem}" peut avoir plusieurs origines, nécessitant une investigation plus approfondie sur le terrain.`;
  }

  return {
    problem,
    categories,
    summary
  };
}
