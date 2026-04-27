import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeAnalysis, QualitativeData, ParetoItem, Review } from "@/types/analysis";
import { analyzeRootCauses, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { useMemo } from "react";
import { AlertCircle, Clock, HelpCircle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "../ui/button";
import Questionare from "./Questionare";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RootCauseSectionProps {
  paretoIssues: ParetoItem[];
  themes?: ThemeAnalysis[];
  qualitative?: QualitativeData;
  reviews?: Review[];
}

const probabilityConfig: Record<ProbabilityLevel, { label: string; color: string; icon: typeof AlertCircle }> = {
  "Probable": {
    label: "Probable",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertCircle
  },
  "Possible": {
    label: "Possible",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock
  },
  "Occasionnelle": {
    label: "Occasionnelle",
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


export function RootCauseSection({
  paretoIssues,
  themes = [],
  qualitative,
  reviews = []
}: RootCauseSectionProps) {

  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionare, setShowQuestionare] = useState(false);
  const { t } = useTranslation();

  const currentIssue =
    paretoIssues && paretoIssues.length > 0
      ? paretoIssues[currentStep]
      : null;

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

  if (!currentIssue || !rootCauseAnalysis) return null;

  const nextStep = () => {
    setCurrentStep((prev) =>
      Math.min(prev + 1, paretoIssues.length - 1)
    );
    setShowQuestionare(false);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setShowQuestionare(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>6.  {t("analysis.ishikawa.title")}</span>

          {/* Step Indicator */}
          <span className="text-sm text-gray-500">
            {currentStep + 1} / {paretoIssues.length}
          </span>
        </CardTitle>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button onClick={prevStep} disabled={currentStep === 0}>
            Previous
          </Button>

          <Button
            onClick={nextStep}
            disabled={currentStep === paretoIssues.length - 1}
          >
            Next
          </Button>

          <Button onClick={() => setShowQuestionare(true)}>
            View Questionare
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* 👇 Show Questionnaire */}
        {showQuestionare && (
          <Questionare problemTitle={currentIssue.name} />
        )}

        {/* 6.1 Problem */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            6.1 {t("analysis.ishikawa.problemAnalyzed")}
          </h3>
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-lg font-semibold">
              {currentIssue.name} –{" "}
              {currentIssue.percentage.toFixed(0)} %
            </p>
          </div>
        </div>

        {/* 6.2 Causes */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            6.2 {t("analysis.ishikawa.probableCausesIdentified")}
          </h3>

          {rootCauseAnalysis.categories.length > 0 ? (
            <div className="space-y-4">
              {rootCauseAnalysis.categories.map((category, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    {category.name}
                  </h4>

                  <ul className="space-y-2">
                    {category.causes.map((cause, j) => {
                      const probConfig =
                        probabilityConfig[cause.probability];
                      const Icon = probConfig.icon;

                      return (
                        <li key={j} className="flex justify-between">
                          <span>{cause.description}</span>
                          <Badge className={probConfig.color}>
                            <Icon className="w-3 h-3 mr-1" />
                            {probConfig.label}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border rounded-lg text-center">
              No causes identified
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            6.4 {t("analysis.ishikawa.automatedSummary")}
          </h3>
          <div className="p-4 bg-blue-50 border rounded-lg">
            {rootCauseAnalysis.summary}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}