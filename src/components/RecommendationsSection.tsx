// src/components/reviews/RecommendationsSection.tsx

import { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2,
  ChevronDown, ChevronUp, Target, ListChecks, RefreshCw, Timer,
  Check,
  Info,
  Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SmartObjectiveCard } from "./reviews/SmartObjectiveCard";
import { SmartActionPlanCard } from "./reviews/SmartActionPlanCard";
import { SmartGenerateModal } from "./reviews/SmartGenerateModal";
import { useSmartStore } from "@/store/smartStore";
import type { ParetoItem } from "@/types/analysis";
import { Trans, useTranslation } from "react-i18next";
import { useEstablishmentStore } from "@/store/establishmentStore";
import i18n from "@/i18n/config";

interface Props {
  paretoCauses: ParetoItem[];
}

const getLocalizedText = (value: any, language = "en"): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value[language] || value.en || value.fr || Object.values(value)[0] || "";
  return String(value);
};

export function RecommendationsSection({ paretoCauses }: Props) {
  const {
    objectives, currentDraft, isGenerating, isSaving,
    updateDraft, saveDraft, discardDraft, fetchObjectives,
    updateProgress, toggleAction, updateObjectiveStatus,
  } = useSmartStore();

  const activeEstablishmentId = useEstablishmentStore((s) => s.activeEstablishmentId);
  const { t } = useTranslation();
  const lang = (i18n.language || "fr").split("-")[0].toLowerCase();

  const [expanded, setExpanded] = useState(false);
  const [activeStepKey, setActiveStepKey] = useState<string>("targetGoal");
  const [modalOpen, setModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!activeEstablishmentId) return;
    fetchObjectives(activeEstablishmentId);
  }, [activeEstablishmentId, fetchObjectives]);

  // useEffect(() => {
  //   async function sync() {
  //     if (!objectives.length) return;
  //     const sorted = [...paretoCauses].sort((a, b) => b.count - a.count);
  //     const next = sorted
  //       .map((p) => objectives.find(
  //         (o) => o.pareto_cause?.key?.toLowerCase() === p.key.toLowerCase()
  //       ))
  //       .find((o) => o && o.status !== "completed");
  //     if (!next || next.status === "in_progress") return;
  //     await updateObjectiveStatus(next.id, "in_progress");
  //   }
  //   sync();
  // }, [objectives, paretoCauses]);

  const safeObjectives = Array.isArray(objectives) ? objectives : [];
  const activeObjective = safeObjectives.find((o) => o.status === "in_progress") || null

  const sortedPareto = useMemo(
    () => [...paretoCauses].sort((a, b) => b.count - a.count),
    [paretoCauses]
  );

  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (!sortedPareto.length) {
      setActiveTab("");
      return;
    }

    if (!sortedPareto.some((p) => p.key === activeTab)) {
      setActiveTab(sortedPareto[0].key);
    }
  }, [sortedPareto, activeTab]);

  const tabObjective = safeObjectives.find(
    (o) => o.pareto_cause?.key?.toLowerCase() === activeTab.toLowerCase()
  );
  const tabIssue = sortedPareto.find((p) => p.key.toLowerCase() === activeTab.toLowerCase());
  const isValidated = tabObjective?.effort_source === "user_questionnaire";
  const totalMentions = sortedPareto.reduce((s, p) => s + (p.count ?? 0), 0) || 1;

  /* step bar */
  const steps = [
    {
      key: "issueImpact",
      label: t("recommendations.smart.stepbar.issueImpact", { defaultValue: "Impact des problèmes" }),
      sub: t("recommendations.smart.stepbar.pareto", { defaultValue: "Pareto" }),
      status: "done" as const,
    },
    {
      key: "causeIdentified",
      label: t("recommendations.smart.stepbar.causeIdentified", { defaultValue: "Causes identifiées" }),
      sub: t("recommendations.smart.stepbar.ishikawa", { defaultValue: "Ishikawa" }),
      status: "done" as const,
    },
    {
      key: "targetGoal",
      label: t("recommendations.smart.stepbar.targetGoal", { defaultValue: "Objectif à atteindre" }),
      sub: t("recommendations.smart.stepbar.smart", { defaultValue: "SMART" }),
      status: (activeObjective ? "active" : "todo") as "active" | "todo",
    },
    {
      key: "actionSteps",
      label: t("recommendations.smart.stepbar.actionSteps", { defaultValue: "Étapes du plan" }),
      sub: t("recommendations.smart.stepbar.pdca", { defaultValue: "PDCA" }),
      status: "todo" as const,
    },
  ];
  const clickableStepKeys = new Set(["targetGoal", "actionSteps"]);

  const handleUpdate = async () => {
    if (tabObjective) updateDraft(tabObjective);
    setIsUpdating(true);
    setModalOpen(true);
  };
  const handleSave = async () => { await saveDraft(); setIsUpdating(false); setModalOpen(false); };
  const handleClose = () => { discardDraft(); setModalOpen(false); setIsUpdating(false); };

  const getDotColor = (issueKey: string) => {
    const obj = safeObjectives.find(
      (o) => o.pareto_cause?.key?.toLowerCase() === issueKey.toLowerCase()
    );
    if (!obj) return "#8b5cf6";
    if (obj.status === "completed") return "#10b981";
    if (obj.status === "in_progress") return "#f59e0b";
    return "#8b5cf6";
  };

  const validatedCount = safeObjectives.filter(
    (o) => o.effort_source === "user_questionnaire"
  ).length;

  return (
    <div className="space-y-4">
      <Card className="border rounded-[18px] border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-0">

          <div className="flex items-center px-5 py-4 gap-4">
            <div className="flex flex-1 items-center min-w-0 rounded-[10px] bg-slate-100 p-2 dark:bg-slate-800/80">
              {steps.map((step, idx) => {
                const isDone = step.status === "done";
                const isActive = step.key === activeStepKey;
                const isClickable = clickableStepKeys.has(step.key);

                return (
                  <div key={step.key} className="flex flex-1 items-center min-w-0">
                    {isClickable ? (
                      <button
                        type="button"
                        onClick={() => setActiveStepKey(step.key)}
                        className={`flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 transition-all ${isDone
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : isActive
                              ? "bg-white border-2 border-gray-300 text-gray-800 shadow-sm dark:bg-slate-100 dark:border-slate-300 dark:text-slate-900"
                              : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                      >
                        {step.key === "targetGoal" ? (
                          <Target className="h-4 w-4 shrink-0 text-gray-500" />
                        ) : (
                          <ListChecks className="h-4 w-4 shrink-0 text-gray-500" />
                        )}

                        <span className="whitespace-nowrap text-sm font-semibold">
                          {step.label}
                        </span>

                        {step.sub && (
                          <span
                            className={`hidden text-xs font-normal italic xl:inline ${isDone
                                ? "text-green-500"
                                : "text-gray-400 dark:text-slate-500"
                              }`}
                          >
                            ({step.sub})
                          </span>
                        )}
                      </button>
                    ) : (
                      <div
                        className={`flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 transition-all ${isDone
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold">
                          {step.label}
                        </span>

                        {step.sub && (
                          <span
                            className={`hidden text-xs font-normal italic xl:inline ${isDone
                                ? "text-green-500"
                                : "text-gray-400 dark:text-slate-500"
                              }`}
                          >
                            ({step.sub})
                          </span>
                        )}
                      </div>
                    )}

                    {idx < steps.length - 1 && (
                      <div className="flex shrink-0 items-center justify-center px-2">
                        <span className="text-3xl font-bold text-slate-500 dark:text-slate-600">
                          ›
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setExpanded((e) => !e)}
              className="
      shrink-0
      flex
      items-center
      justify-center
      w-8
      h-8
      rounded-full
      hover:bg-gray-100
      dark:hover:bg-slate-800
      transition-colors
    "
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {expanded && (
            <>
              <div className="flex items-center justify-between px-5 pt-4 pb-2 ">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <Target className="h-4 w-4 shrink-0 text-blue-500" />
                  {t("recommendations.smart.chooseIssue", { defaultValue: "Choisissez un problème à traiter" })}
                </p>
                <div className="flex items-center gap-2">
                  <button  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 transition-colors font-medium">
                    <Loader className="w-3 h-3 text-purple-600" />
                    {t("recommendations.smart.reanalyse", { defaultValue: "Refaire l'analyse IA" })}
                  </button>
                  <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-full font-semibold border border-gray-200 dark:border-slate-700">
                    {validatedCount} / {sortedPareto.length}{" "}
                    {t("recommendations.smart.stepbar.validated", {
                      defaultValue: "validé",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-1 px-5 mb-4">
                {sortedPareto.map((issue, i) => {
                  const obj = safeObjectives.find(
                    (o) => o.pareto_cause?.key?.toLowerCase() === issue.key.toLowerCase()
                  );

                  const isActive = activeTab === issue.key;
                  const hasSmartObjective = !!obj;

                  return (
                    <button
                      key={issue.key}
                      type="button"
                      onClick={() => setActiveTab(issue.key)}
                      className={`
          inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold select-none
          transition-colors duration-150 border
          ${isActive
                          ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                          : "bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }
        `}
                    >

                      {hasSmartObjective ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <Timer className="h-3.5 w-3.5 text-amber-600" />
                        </span>
                      )}

                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: getDotColor(issue.key) }}
                      />
                      <span className="whitespace-nowrap">
                        {issue.name ?? issue.key}
                      </span>

                      <span
                        className={`font-normal ${isActive
                            ? "text-white/60 dark:text-gray-900/60"
                            : "text-gray-400 dark:text-slate-500"
                          }`}
                      >
                        {t("recommendations.smart.negativeReviews", { percentage: Math.round(issue.percentage) })}
                      </span>
                    </button>
                  );
                })}
              </div>

              {tabIssue && (
                <div className="px-5 pb-5">
                  <div className={`flex items-center justify-between rounded-xl px-4 py-3.5 border-l-4 border gap-3 ${isValidated
                      ? "bg-green-50 border-l-green-500 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                      : "bg-amber-50 border-l-amber-400 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                    }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <p className={`text-sm truncate ${isValidated ? "text-green-900 dark:text-green-300" : "text-amber-900 dark:text-amber-300"}`}>
                        <span className="font-bold">
                          {t("recommendations.smart.mainIssueLabel", { defaultValue: "PROBLÈME PRINCIPAL" })}
                          {" — "}
                          {tabIssue.name ?? tabIssue.key}
                        </span>
                        {" "}
                        <span className="font-normal text-xs">
                          {t("recommendations.smart.negativeReviews", { percentage: Math.round(((tabIssue.count ?? 0) / totalMentions) * 100) })}
                        </span>
                      </p>

                      {isValidated ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shrink-0">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          {t("recommendations.smart.stepbar.validated", {
                            defaultValue: "VALIDATED",
                          })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shrink-0">
                          <Info className="h-3.5 w-3.5" strokeWidth={3} />
                          {t("dashboard.toValidate", {
                            defaultValue: "To Validate",
                          })}
                        </span>
                      )}
                    </div>

                    {tabObjective && tabObjective.status !== "completed" && (
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || !activeEstablishmentId}
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700 dark:hover:bg-violet-900/30"                      >
                        {isUpdating ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("recommendations.smart.updating")}</>
                        ) : (
                          <><RefreshCw className="h-3.5 w-3.5" />{t("recommendations.smart.updateSmart", { defaultValue: "Modifier l'objectif" })}</>
                        )}
                      </Button>
                    )}
                  </div>

                  {tabObjective && !isValidated && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                      <span className="text-amber-400">⚠</span>
                      {t("recommendations.smart.goalNotValidated", {
                        defaultValue: "Ce goal n'a pas été validé. Définissez-le pour activer le plan d'action.",
                      })}
                    </p>
                  )}
                </div>
              )}


            </>
          )}

        </CardContent>
      </Card>
      {expanded && (
        !tabObjective ? (
          <Card className="rounded-[18px] border border-yellow-200 bg-yellow-50 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <CardContent className="px-6 py-5">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-slate-800">
        <Timer className="h-6 w-6 text-yellow-600 dark:text-slate-300" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-yellow-900 dark:text-slate-100">
          {t("recommendations.smart.noObjective.title", {
            defaultValue: "No SMART objective available",
          })}
        </p>

        <p className="mt-1 text-sm leading-relaxed text-yellow-800 dark:text-slate-400">
          <Trans
            i18nKey="recommendations.smart.noObjective.subtitle"
            values={{
              issue: tabIssue?.name ?? activeTab,
            }}
            components={{
              strong: (
                <strong className="font-semibold text-yellow-900 dark:text-slate-200" />
              ),
            }}
          />
        </p>
      </div>
    </div>
  </CardContent>
</Card>

        ) : tabObjective.status === "completed" ? (
      <Card className="rounded-[18px] border border-green-200 bg-green-50 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <CardContent className="px-6 py-5">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 dark:bg-slate-800">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-green-800 dark:text-slate-100">
          {t("recommendations.smart.completed.title", {
            defaultValue: "Objectif atteint",
          })}
        </p>

        <p className="mt-0.5 text-sm text-green-700 dark:text-slate-400">
          {t("recommendations.smart.completed.subtitle", {
            issue:
              tabObjective.pareto_cause?.[i18n.language] ??
              tabObjective.pareto_cause?.en ??
              "",
            defaultValue:
              "Cet objectif SMART a été complété avec succès. Le plan d'actions associé est clôturé.",
          })}
        </p>
      </div>
    </div>
  </CardContent>
</Card>

        ) : (
          <>
            <SmartObjectiveCard
              objective={tabObjective}
              onUpdateProgress={updateProgress}
              onToggleAction={toggleAction}
            />
            <SmartActionPlanCard objective={tabObjective} />
          </>
        )
      )}

      <SmartGenerateModal
        updating={isUpdating}
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        currentDraft={currentDraft}
        isGenerating={isGenerating}
        isSaving={isSaving}
        updateDraft={updateDraft}
        paretoCause={
          getLocalizedText(tabObjective?.pareto_cause, lang) ||
          tabIssue?.name ||
          tabIssue?.key ||
          ""
        }
        activeObjective={tabObjective}
      />
    </div>
  );
}
