import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";
import { analyzeRootCauses, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { useMemo } from "react";
import { AlertCircle, Clock, HelpCircle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "../ui/button";
import { useState } from "react";
import { buildImpactEffortMatrix } from "./recommendation/EffortMatrix";
import Questionnaire, { QuestionnaireResult,IshikawaScores,} from "./Questionare";
import { useSmartStore } from "@/store/smartStore";
import { useEffect , useRef } from "react";
import { getCurrentEstablishment } from "@/services/establishments";

import { useTranslation } from "react-i18next";

interface RootCauseSectionProps {
  paretoIssues: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
  reviews?: Review[];
  // Each pareto issue maps to an existing smart_objectives row
}

// Per-issue questionnaire state



const probabilityConfig: Record<ProbabilityLevel, { label: string; color: string; icon: typeof AlertCircle }> = {
  "Probable": {
    label: "probable",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertCircle
  },
  "Possible": {
    label: "possible",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock
  },
  "Occasionnelle": {
    label: "occasional",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: HelpCircle
  }
};

// export function RootCauseSection({
//   paretoIssues,
//   themes = [],
//   qualitative,
//   reviews = []
// }: RootCauseSectionProps) {
//   // Identifier le problème prioritaire (première cause du Pareto)


//   function handleQuestionareClick(){
//         <Questionare problemTitle={paretoIssues[0].name}/>
// }




//   const mainIssue = paretoIssues && paretoIssues.length > 0 ? paretoIssues[0] : null;

//   // Analyser les causes racines
//   const rootCauseAnalysis = useMemo(() => {
//     if (!mainIssue || !qualitative) return null;
//     return analyzeRootCauses(
//       mainIssue.name,
//       themes,
//       qualitative,
//       paretoIssues,
//       reviews
//     );
//   }, [mainIssue, themes, qualitative, paretoIssues, reviews]);

//   // Si pas de problème prioritaire ou pas d'analyse possible, ne rien afficher
//   if (!mainIssue || !rootCauseAnalysis) {
//     return null;
//   }









//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           6. Analyse des causes racines (Ishikawa IA)
//           <InfoTooltip 
//             content="Analyse des causes racines (Ishikawa) : outil pour identifier les causes profondes d'un problème récurrent. Bénéfice : vous comprenez pourquoi un problème survient et pouvez agir à la source."
//           />
//         </CardTitle>
//         <Button onClick={handleQuestionareClick}>View Questionare</Button>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {/* 6.1 Problème analysé */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.1 Problème analysé
//           </h3>
//           <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
//             <p className="text-lg font-semibold text-gray-900">
//               {mainIssue.name} – {mainIssue.percentage.toFixed(0)} % des irritants
//             </p>
//             <p className="text-sm text-gray-500 mt-1">
//               Données issues du diagramme de Pareto des avis négatifs.
//             </p>
//           </div>
//         </div>

//         {/* 6.2 Causes probables identifiées par l'IA */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">
//             6.2 Causes probables identifiées par l'IA
//           </h3>
          
//           {rootCauseAnalysis.categories.length > 0 ? (
//             <div className="space-y-4">
//               {rootCauseAnalysis.categories.map((category, catIndex) => (
//                 <div key={catIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
//                   <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                     <span className="w-2 h-2 rounded-full bg-gray-400"></span>
//                     {category.name}
//                   </h4>
                  
//                   <ul className="space-y-2">
//                     {category.causes.map((cause, causeIndex) => {
//                       const probConfig = probabilityConfig[cause.probability];
//                       const Icon = probConfig.icon;
                      
//                       return (
//                         <li key={causeIndex} className="flex items-start justify-between gap-3 pl-2">
//                           <span className="text-gray-700 flex-1">{cause.description}</span>
//                           <Badge 
//                             variant="outline" 
//                             className={`${probConfig.color} border flex items-center gap-1 text-xs`}
//                           >
//                             <Icon className="w-3 h-3" />
//                             {probConfig.label}
//                           </Badge>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
//               <p>Aucune cause spécifique n'a pu être identifiée à partir des données disponibles.</p>
//               <p className="text-sm mt-2">Une analyse sur le terrain serait recommandée.</p>
//             </div>
//           )}
//         </div>

//         {/* 6.3 Niveau de probabilité - Légende */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.3 Niveau de probabilité
//           </h3>
//           <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
//             <div className="flex flex-wrap gap-4">
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" />
//                   Probable
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause fréquemment mentionnée dans les avis</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1">
//                   <Clock className="w-3 h-3" />
//                   Possible
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause suggérée par certains avis</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
//                   <HelpCircle className="w-3 h-3" />
//                   Occasionnelle
//                 </Badge>
//                 <span className="text-sm text-gray-600">Cause rarement mentionnée</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* 6.4 Synthèse automatique */}
//         <div>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">
//             6.4 Synthèse automatique
//           </h3>
//           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//             <p className="text-gray-700 leading-relaxed">
//               {rootCauseAnalysis.summary}
//             </p>
//           </div>
//         </div>

//       </CardContent>
//     </Card>
//   );
// }



/* ─────────────────────────────────────────────


/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

export function RootCauseSection({
  paretoIssues,
  themes = [],
  qualitative,
  reviews = [],
}: RootCauseSectionProps) {

  const { setQuestionnaireResult , fetchObjectives ,generateSmart ,saveQuestionnaireOnly, 
  questionnaireByIssue,
 objectives: smartObjectives,} = useSmartStore() 

  /* ── Step navigation (one issue at a time) ── */
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [questionnaireSkipped, setQuestionnaireSkipped] = useState(false);
  const [showQuestionare, setShowQuestionare] = useState(false);
  const { t } = useTranslation();


const establishmentIdRef = useRef<string | null>(null);
/* ── Current issue ── */
const currentIssue =
  paretoIssues && paretoIssues.length > 0
    ? paretoIssues[currentStep]
    : null;

/* ── Load establishment ── */
useEffect(() => {
  async function loadEst() {
    const est = await getCurrentEstablishment();
    const id = est?.id ?? null;

    setEstablishmentId(id);
    establishmentIdRef.current = id;
  }

  loadEst();
}, []);

/* ── Fetch SMART objectives when ID is ready ── */
useEffect(() => {
  if (!establishmentId) return;

  fetchObjectives(establishmentId);
}, [establishmentId]);



useEffect(() => {
  if (!smartObjectives?.length) return;

  smartObjectives.forEach((obj) => {
    if (obj.questionnaire_scores && obj.pareto_cause) {
      setQuestionnaireResult(obj.pareto_cause, {
        paretoIssue: obj.pareto_cause,
        scores: obj.questionnaire_scores,
        dominantCategory: obj.ishikawa_top_category,
        dominantEffort: obj.effort,
        confirmedCategories: [],
        isComplete: true,
      });
    }
  });
}, [smartObjectives,setQuestionnaireResult]);


const safeObjectives = Array.isArray(smartObjectives)
  ? smartObjectives
  : [];

const currentQuestionnaire =
  currentIssue ? questionnaireByIssue[currentIssue.name] : null;

const dbObjective = safeObjectives.find(
  (obj) =>
    obj.pareto_cause?.toLowerCase() ===
    currentIssue?.name?.toLowerCase()
);

const questionnaireSubmitted =
  !!currentQuestionnaire ||
  !!dbObjective?.questionnaire_scores;

const currentSmartObjective = useMemo(() => {
  if (!currentIssue) return null;

  return (
    safeObjectives.find(
      (obj) =>
        obj.pareto_cause?.toLowerCase() ===
        currentIssue.name?.toLowerCase()
    ) ?? null
  );
}, [safeObjectives, currentIssue]);


  /* ── RCA — recomputes per issue ── */
  const rootCauseAnalysis = useMemo(() => {
    if (!currentIssue || !qualitative) return null;
    return analyzeRootCauses(
      currentIssue.name,
      themes,
      qualitative,
      paretoIssues,
      reviews
    );
  }, [currentIssue, themes, qualitative, paretoIssues, reviews]);



  /* ── Navigation ── */
  const goToStep = (step: number) => {
    setCurrentStep(step);
    setShowQuestionnaire(false);
  };

  const nextStep = () =>
    goToStep(Math.min(currentStep + 1, paretoIssues.length - 1));
  const prevStep = () => goToStep(Math.max(currentStep - 1, 0));


  //Questionare submit handler :- perfrom db entry automatically

    const handleQuestionnaireSuccess = async (result: QuestionnaireResult) => {
      if (!currentIssue || !rootCauseAnalysis) return;

      const estId = establishmentIdRef.current;
      if (!estId) return;

      //  store update
      setQuestionnaireResult(currentIssue.name, result);

      //  save in DB
    
    
      await generateSmart(
        estId,
        currentIssue,
        rootCauseAnalysis,
        result.dominantEffort,
        result.dominantCategory,
        "user_questionnaire",
        result.scores,
        currentIssue.percentage
      );

      setShowQuestionnaire(false);
    };

  const handleQuestionnaireSkip = () => {
  setQuestionnaireSkipped(true);
  setShowQuestionnaire(false);
};

  return (
  <Card>
    <CardHeader className="space-y-4">
      <CardTitle className="flex items-center gap-2">
        6. {t("analysis.ishikawa.title")}
        <InfoTooltip
          content="Analyse des causes racines (Ishikawa) : outil pour identifier les causes profondes d'un problème récurrent. Bénéfice : vous comprenez pourquoi un problème survient et pouvez agir à la source."
        />

        {/* Step indicator */}
        <span className="ml-auto text-sm font-normal text-gray-500">
          {currentStep + 1} / {paretoIssues.length}
        </span>
      </CardTitle>

      {/* Warning banner */}
      {!questionnaireSubmitted && (
        <div className="flex items-start justify-between bg-red-50 border border-red-200 rounded-xl p-4">
          <div>
            <p className="text-sm font-semibold text-red-800">
               {t("analysis.ishikawa.questionareWarning")}
            </p>
            <p className="text-sm text-red-700 mt-1">
              {t("analysis.ishikawa.recommendMessage")}
            </p>
          </div>
        </div>
      )}

      {/* Navigation + Questionnaire actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
        
        {/* Step navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            {t("common.previous")}
          </Button>

          <Button
            variant="outline"
            onClick={nextStep}
            disabled={currentStep === paretoIssues.length - 1}
          >
             {t("common.next")}
          </Button>
        </div>

        {/* Questionnaire action */}
        <div>
          {!showQuestionnaire ? (
            <Button
              variant="outline"
              onClick={() => setShowQuestionnaire(true)}
              className={
                questionnaireSubmitted
                  ? "border-green-400 text-green-700 hover:bg-green-700 hover:text-white"
                  : "border-yellow-400 text-yellow-700 hover:bg-yellow-700 hover:text-white animate-pulse"
              }
            >
              {questionnaireSubmitted
                ? `✏️ ${t("analysis.ishikawa.editQuestionare")}`
                : `⚠️ ${t("analysis.ishikawa.fillQuestionare")}`}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowQuestionnaire(false)}
            >
              {`✕ ${t("analysis.ishikawa.closeQuestionare")}`}
            </Button>
          )}
        </div>
      </div>
        {/* Effort override banner */}
        {questionnaireSubmitted && currentQuestionnaire && (
          <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
            <span>✅</span>
            <span>
              Effort overridden to{" "}
              <strong>
                {currentQuestionnaire?.dominantEffort}
              </strong>{" "}
              — dominant cause:{" "}
              <strong>
                {t(`questionnaire.sections.${currentQuestionnaire?.dominantCategory}.title`)}
              </strong>
            </span>
          </div>
        )}
        {/* Skip warning */}
        {questionnaireSkipped && !questionnaireSubmitted && (
          <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            {`⚠️ ${t("analysis.ishikawa.questionareSkipped")}`}
            {t("analysis.ishikawa.recommendMessage")}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Questionnaire — inline, per issue, remounts on issue change */}
        {showQuestionnaire && (
          <>
            <Questionnaire
                key={currentIssue.name}
                problemTitle={currentIssue.name}
                establishmentId={establishmentId}
                smartObjectiveId={currentSmartObjective?.id ?? ""}
                initialScores={
                  currentQuestionnaire?.scores ??
                  dbObjective?.questionnaire_scores ??
                  undefined
                }
                onSuccess={handleQuestionnaireSuccess}
                onSkip={handleQuestionnaireSkip}
              />
          </>
        )}

        {/* 6.1 Problème analysé */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            6.1 {t("analysis.ishikawa.problemAnalyzed")}
          </h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">
              {currentIssue.name} –{" "}
              {`${currentIssue.percentage.toFixed(0)} % ${t("dashboard.negativeMentions")}`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t("analysis.ishikawa.dataSrc")}
            </p>
          </div>
        </div>

        {/* 6.2 Causes probables identifiées par l'IA */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            6.2 {t("analysis.ishikawa.probableCausesIdentified")}
          </h3>

          {rootCauseAnalysis.categories.length > 0 ? (
            <div className="space-y-4">
              {rootCauseAnalysis.categories.map((category, catIndex) => (
                <div
                  key={catIndex}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    {category.name}
                  </h4>

                  <ul className="space-y-2">
                    {category.causes.map((cause, causeIndex) => {
                      const probConfig = probabilityConfig[cause.probability];
                      const Icon = probConfig.icon;
                      return (
                        <li
                          key={causeIndex}
                          className="flex items-start justify-between gap-3 pl-2"
                        >
                          <span className="text-gray-700 flex-1">
                            {cause.description}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${probConfig.color} border flex items-center gap-1 text-xs`}
                          >
                            <Icon className="w-3 h-3" />
                           {t(`analysis.pareto.rootCause.probability.${probConfig.label}`)}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
              <p>
               {t("analysis.rootCause.noCause")}
              </p>
              <p className="text-sm mt-2">
               {t("analysis.rootCause.fieldAnalysisRecommended")}
              </p>
            </div>
          )}
        </div>

        {/* 6.3 Niveau de probabilité — unchanged from original */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            6.3 {t("analysis.ishikawa.probabilityLevel")}
          </h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-300 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {t("analysis.pareto.rootCause.probability.probable")}
                </Badge>
                <span className="text-sm text-gray-600">
                  {t("analysis.ishikawa.causeMentioned")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-700 border-amber-300 flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  {t("analysis.pareto.rootCause.probability.possible")}
                </Badge>
                <span className="text-sm text-gray-600">
                  {t("analysis.ishikawa.causeSuggested")}

                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                   {t("analysis.pareto.rootCause.probability.occasional")}
                </Badge>
                <span className="text-sm text-gray-600">
                  {t("analysis.ishikawa.causeRare")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6.4 Synthèse automatique — unchanged from original */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            6.4 {t("analysis.ishikawa.automatedSummary")}
          </h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              {rootCauseAnalysis.summary}
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}