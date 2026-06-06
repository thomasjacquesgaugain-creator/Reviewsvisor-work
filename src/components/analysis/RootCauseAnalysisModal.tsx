import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParetoItem } from "@/types/analysis";
import { ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

interface RootCauseAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paretoIssues: ParetoItem[];           // ← now accepts the full array
  initialIndex?: number;                // ← optional: which issue to start on
}

const importanceToProbability = (importance: string): ProbabilityLevel => {
  if (importance === "dominant")  return "Probable";
  if (importance === "secondary") return "Possible";
  return "Occasionnelle";
};
const probabilityConfig = (t: (key: string) => string): Record<
  ProbabilityLevel,
  { label: string; color: string; icon: typeof AlertCircle }
> => ({
  Probable:     { label: t("analysis.pareto.rootCause.probability.probable"),  color: "bg-red-100 text-red-700 border-red-300",     icon: AlertCircle },
  Possible:     { label: t("analysis.pareto.rootCause.probability.possible"),  color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  Occasionnelle:{ label: t("analysis.pareto.rootCause.probability.occasional"),color: "bg-blue-100 text-blue-700 border-blue-300",   icon: HelpCircle },
});

export function RootCauseAnalysisModal({
  open,
  onOpenChange,
  paretoIssues,
  initialIndex = 0,
}: RootCauseAnalysisModalProps) {
  const { t } = useTranslation();
  const probConfig = probabilityConfig(t);
  const [currentStep, setCurrentStep] = useState(initialIndex);

  // Sync step when modal opens or initialIndex changes
  useEffect(() => {
    if (open) setCurrentStep(initialIndex);
  }, [open, initialIndex]);

  const issue = paretoIssues[currentStep];
  if (!issue) return null;

  const categories = (issue.root_causes ?? []).map((rc) => ({
    name: rc.category,
    causes: (rc.causes ?? []).map((desc: string) => ({
      description: desc,
      probability: importanceToProbability(rc.importance),
      evidence: rc.evidence ?? [],
    })),
  }));

  const total     = paretoIssues.length;
  const isFirst   = currentStep === 0;
  const isLast    = currentStep === total - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* ── HEADER + STEPPER DOTS ── */}
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t("analysis.pareto.rootCause.title", { problem: issue.name })}
            </DialogTitle>
            <span className="text-sm text-slate-400 whitespace-nowrap shrink-0">
              {currentStep + 1} / {total}
            </span>
          </div>

          {/* Step dots */}
          {total > 1 && (
            <div className="flex items-center gap-2 mt-3">
              {paretoIssues.map((iss, idx) => (
                <button
                  key={iss.key ?? idx}
                  onClick={() => setCurrentStep(idx)}
                  title={iss.name}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    idx === currentStep
                      ? "w-6 bg-indigo-500"
                      : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">

          {/* ── SUMMARY ── */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                  {t("analysis.pareto.rootCause.summary")}
                </h3>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  {issue.ai_synthesis}
                </p>
              </div>
            </div>
          </div>

          {/* ── CATEGORIES ── */}
          {categories.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("analysis.pareto.rootCause.categoriesHeading")}
              </h3>

              {categories.map((category, catIndex) => (
                <div
                  key={catIndex}
                  className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    {category.name}
                  </h4>

                  <div className="space-y-3">
                    {category.causes.map((cause, causeIndex) => {
                      const config = probConfig[cause.probability];
                      const Icon   = config.icon;
                      return (
                        <div key={causeIndex} className="pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="flex-1 text-slate-700 dark:text-slate-300">
                              {cause.description}
                            </p>
                            <Badge variant="outline" className={`${config.color} border flex items-center gap-1`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>
                          {cause.evidence.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {cause.evidence.map((ev, evIdx) => (
                                <p key={evIdx} className="border-l border-slate-200 pl-2 text-xs italic text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                  "{ev.length > 100 ? ev.substring(0, 100) + "…" : ev}"
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

          {/* ── METHOD NOTE ── */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>{t("analysis.pareto.rootCause.methodNote.title")}</strong>{" "}
              {t("analysis.pareto.rootCause.methodNote.body")}
            </p>
          </div>

          {/* ── PREV / NEXT ── */}
          {total > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                disabled={isFirst}
                onClick={() => setCurrentStep((s) => s - 1)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("common.previous") || "Previous"}
              </Button>

              {/* Issue name pills */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                {!isFirst && (
                  <span className="truncate max-w-[120px]">{paretoIssues[currentStep - 1]?.name}</span>
                )}
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                  {issue.name}
                </span>
                {!isLast && (
                  <span className="truncate max-w-[120px]">{paretoIssues[currentStep + 1]?.name}</span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={isLast}
                onClick={() => setCurrentStep((s) => s + 1)}
                className="gap-1"
              >
                {t("common.next") || "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}