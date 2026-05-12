import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RootCauseAnalysis, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RootCauseAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: RootCauseAnalysis;
}

const probabilityConfig = (t: (key: string) => string): Record<ProbabilityLevel, { label: string; color: string; icon: typeof AlertCircle }> => ({
"Probable": {
  label: t("analysis.pareto.rootCause.probability.probable"),
  color: "bg-red-100 text-red-700 border-red-300",
  icon: AlertCircle
},
"Possible": {
  label: t("analysis.pareto.rootCause.probability.possible"),
  color: "bg-amber-100 text-amber-700 border-amber-300",
  icon: Clock
},
"Occasionnelle": {
  label: t("analysis.pareto.rootCause.probability.occasional"),
  color: "bg-blue-100 text-blue-700 border-blue-300",
  icon: HelpCircle
}
});

export function RootCauseAnalysisModal({
  open,
  onOpenChange,
  analysis
}: RootCauseAnalysisModalProps) {
  const { t } = useTranslation();
console.log("analysis---->",analysis);



  const probConfig = probabilityConfig(t);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t("analysis.pareto.rootCause.title", { problem: analysis.problem })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Synthèse */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{t("analysis.pareto.rootCause.summary")}</h3>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">{analysis.summary}</p>
              </div>
            </div>
          </div>

          {/* Catégories de causes */}
          {analysis.categories.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("analysis.pareto.rootCause.categoriesHeading")}</h3>
              
              {analysis.categories.map((category, catIndex) => (
                <div key={catIndex} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    {category.name}
                  </h4>
                  
                  <div className="space-y-3">
                    {category.causes.map((cause, causeIndex) => {
                      const config = probConfig[cause.probability];
                      const Icon = config.icon;
                      
                      return (
                        <div key={causeIndex} className="pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="flex-1 text-slate-700 dark:text-slate-300">{cause.description}</p>
                            <Badge 
                              variant="outline" 
                              className={`${config.color} border flex items-center gap-1`}
                            >
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>
                          
                          {/* Preuves (verbatims) si disponibles */}
                          {cause.evidence && cause.evidence.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {cause.evidence.map((evidence, evIndex) => (
                                <p 
                                  key={evIndex} 
                                  className="border-l border-slate-200 pl-2 text-xs italic text-slate-500 dark:border-slate-700 dark:text-slate-400"
                                >
                                  "{evidence.length > 100 ? evidence.substring(0, 100) + '...' : evidence}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              <p>{t("analysis.pareto.rootCause.noCauses")}</p>
              <p className="text-sm mt-2">{t("analysis.pareto.rootCause.fieldAnalysisRecommended")}</p>
            </div>
          )}

          {/* Note méthodologique */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>{t("analysis.pareto.rootCause.methodNote.title")}</strong>{" "}
              {t("analysis.pareto.rootCause.methodNote.body")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
