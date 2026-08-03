// src/components/reviews/SmartActionPlanCard.tsx
// Card 3 — Action plan (PDCA) — redesigned to match target image

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Info, List, RefreshCw, BarChart2,Target } from "lucide-react";
import type { SmartObjective } from "@/types/smart";
import { useSmartProgress } from "@/hooks/useSmartProgress";
import { format, type Locale } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useSmartStore } from "@/store/smartStore";
import { useEstablishmentStore } from "@/store/establishmentStore";

interface Props {
  objective: SmartObjective;
}

const localeMap: Record<string, Locale> = { fr, en: enUS, it, es, pt: ptBR };

const getLocalizedText = (value: any, language = "en"): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value[language] || value.en || value.fr || Object.values(value)[0] || "";
  return String(value);
};

function GearItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-1.5 mb-1.5">
      <Target height={12} width={12} />
      <span className="text-xs text-gray-500 italic">{label}</span>
    </div>
  );
}

export function SmartActionPlanCard({ objective }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0].toLowerCase();
  const locale = localeMap[lang] || enUS;
  const progress = useSmartProgress(objective);
  const { updateObjectiveStatus } = useSmartStore();
  const currentGoogleRating = useEstablishmentStore(
    (s) => s.selectedEstablishment?.rating ?? null,
  );
  const checklistActions = objective.actions ?? [];
  const checklistCompleted = checklistActions.filter((action) => action.completed).length;
  const fieldExecutionProgress =
    checklistActions.length > 0
      ? Math.round((checklistCompleted / checklistActions.length) * 100)
      : progress.percentage;

  const startFmt = objective.created_at
    ? format(new Date(objective.created_at), "d MMMM yyyy", { locale })
    : "—";
  const endFmt = objective.deadline
    ? format(new Date(objective.deadline), "d MMMM yyyy", { locale })
    : "—";

  const kpiLabel = getLocalizedText(objective.kpi_label, lang);
  const unitLabel = getLocalizedText(objective.unit, lang)
    || t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "negative reviews / month" });

  const launchActions = (objective.actions ?? []).slice(0, 2);

  return (
    <Card className="border rounded-[18px] border-gray-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-0">

        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
            <List className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("smartCard.pdca.title", { defaultValue: "Action plan" })}
              </p>
              <span className="text-sm italic text-slate-400 dark:text-slate-400">(PDCA)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-violet-400 hover:text-violet-600 transition-colors dark:text-violet-300 dark:hover:text-violet-200">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs rounded-xl border bg-white p-4 text-sm leading-6 text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {t("smartCard.pdca.pdcaTooltip", {
                      defaultValue: "PDCA: execution method to turn a goal into concrete actions and measure results. Benefit: improve performance through continuous tracking and regular adjustments.",
                    })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-400">
              {t("smartCard.pdca.subTitle", { defaultValue: "Execution method · automatically generated from your SMART goal" })}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">

          <div style={{ borderLeftColor: "#8B5CF6" }}
            className="rounded-2xl border border-violet-200 bg-violet-50 border-l-4 overflow-hidden dark:border-violet-900/50 dark:bg-violet-950/20">
            <div className="flex items-start justify-between px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-violet-700">
                      {t("smartCard.pdca.planTitle", { defaultValue: "Plan" })}
                    </span>
                    <span className="text-xs text-gray-400 italic dark:text-slate-400">
                      ({t("smartCard.pdca.planSubtitle", { defaultValue: "Plan" })})
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 dark:text-slate-200">
                    {getLocalizedText(objective.problem, lang) || "—"}
                  </p>
                  <GearItem label={t("smartCard.pdca.managerDecision", { defaultValue: "Manager decision" })} />
                  {objective.status === "todo" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!objective.id) return;
                        await updateObjectiveStatus(objective.id, "in_progress", {
                          start_rating: currentGoogleRating ?? undefined,
                          start_time: new Date().toISOString(),
                        });
                      }}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5 px-4 dark:bg-violet-500 dark:hover:bg-violet-400"
                    >
                      <span>✓</span>
                      {t("smartCard.pdca.status.activateLaunchPlan", {
                        defaultValue: "Validate and launch the plan",
                      })}
                    </Button>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 ml-4 border
                ${objective.status === "todo"
                    ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300"
                    : "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500 dark:text-white"
                  }`}
              >
                {objective.status === "todo" ? (
                  t("smartCard.pdca.status.toBeValidated", {
                    defaultValue: "To be validated",
                  })
                ) : (
                  <>
                    <span>✓</span>
                    {t("smartCard.pdca.status.planValidated", {
                      defaultValue: "Plan validated",
                    })}
                  </>
                )}
              </span>
            </div>
          </div>

          <div style={{ borderLeftColor: "#F97316" }} className="rounded-2xl border border-orange-200 bg-orange-50 border-l-4 overflow-hidden dark:border-orange-900/50 dark:bg-orange-950/20">
            <div className="flex items-start justify-between px-5 py-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-orange-400 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-orange-700">
                      {t("smartCard.pdca.launchTitle", { defaultValue: "Launch" })}
                    </span>
                    <span className="text-xs text-gray-400 italic dark:text-slate-400">
                      ({t("smartCard.pdca.launchSubtitle", { defaultValue: "Do" })})
                    </span>
                  </div>

                  {launchActions.map((a, i) => (
                    <p className="text-sm text-gray-700 mt-0.5 dark:text-slate-200">
                      {getLocalizedText(a?.text ?? a, lang)}
                    </p>

                  ))}

                  <GearItem label={t("smartCard.pdca.teamExecution", { defaultValue: "Team action on the ground" })} />

                </div>
              </div>
          
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shrink-0 ml-4 border
                ${objective.status === "todo"
                    ? "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300"
                    : "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500 dark:text-white"
                  }`}
              >
                {objective.status === "todo" ? (
                  t("smartCard.pdca.status.pendingToActivate", {
                    defaultValue: "To be validated",
                  })
                ) : (
                  <>
                    <span>✓</span>
                    {t("smartCard.pdca.status.active", { defaultValue: "Active" })}
                  </>
                )}
              </span>
            </div>
          </div>

          <div style={{ borderLeftColor: "#EAB308" }} className="rounded-2xl border border-yellow-300 bg-yellow-50 border-l-4 overflow-hidden dark:border-yellow-900/50 dark:bg-yellow-950/20">
            <div className="flex items-start justify-between px-5 py-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-yellow-400 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-yellow-700">
                      {t("smartCard.pdca.measureTitle", { defaultValue: "Measure" })}
                    </span>
                    <span className="text-xs text-gray-400 italic dark:text-slate-400">
                      ({t("smartCard.pdca.measureSubtitle", { defaultValue: "Check" })})
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 dark:text-slate-200">
                    {kpiLabel}
                    {" "}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                      {t("smartCard.pdca.object", { defaultValue: "Objectif" })} :{" "}
                      <span className="font-semibold ml-1">
                        {objective.target_value} / {t("smartCard.temporal.months", { defaultValue: "months" })}
                      </span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                      {t("smartCard.pdca.current", { defaultValue: "Current" })} :{" "}
                      <span className="font-semibold ml-1 text-blue-600">
                        {objective.current_progress ?? objective.current_value} / {t("smartCard.temporal.months", { defaultValue: "months" })}
                      </span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                      {t("smartCard.pdca.fieldExecution", { defaultValue: "Field execution" })} :{" "}
                      <span className="font-semibold ml-1 text-violet-600">
                        {fieldExecutionProgress} %
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    <RefreshCw className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="text-xs text-blue-500 italic dark:text-blue-300">
                      {t("smartCard.pdca.autoMeasured", { defaultValue: "Auto-measured by Reviewsvisor" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-4 mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 shrink-0 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                <BarChart2 className="h-3.5 w-3.5 text-blue-500" />
                {t("smartCard.pdca.status.auto", {
                  defaultValue: "Automatic",
                })}
              </div>
            </div>
          </div>

          <div style={{ borderLeftColor: "#22C55E" }} className="rounded-2xl border border-green-200 bg-green-50 border-l-4 overflow-hidden dark:border-green-900/50 dark:bg-green-950/20">
            <div className="flex items-start justify-between px-5 py-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-base font-bold text-green-700">
                      {t("smartCard.pdca.adjustTitle", { defaultValue: "Adjust" })}
                    </span>
                    <span className="text-xs text-gray-400 italic dark:text-slate-400">
                      ({t("smartCard.pdca.adjustSubtitle", { defaultValue: "Act" })})
                    </span>
                  </div>

                  <div style={{ borderLeftColor: objective.status === "todo" ? "#9a9aae" : "#27aaeb" }} className={`rounded-xl ${objective.status === "todo" ? "bg-[#f5f5f7] dark:bg-slate-900/60" : "bg-blue-100 dark:bg-blue-950/30"} border border-green-100 border-l-4 px-4 py-3.5 space-y-2 dark:border-green-900/30`}>

                    {objective.status === "todo" ? <div className="text-gray-600 text-sm dark:text-slate-300">
                      ⏸{t("smartCard.pdca.waitingForPlan", { defaultValue: "Waiting for plan validation to start data collection." })}
                    </div> : <>
                      <p className="text-sm font-bold text-gray-800 mb-1 dark:text-slate-100">
                        {t("smartCard.pdca.adjustInProgress", { defaultValue: "Goal in progress" })}
                      </p>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-2 dark:text-slate-200">
                          <span>🗓️</span>
                          <span>
                            {t("smartCard.pdca.start", { defaultValue: "Start" })} :{" "}
                            <span className="font-semibold">{startFmt}</span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2 dark:text-slate-200">
                          <span>🗓️</span>
                          <span>
                            {t("smartCard.pdca.forecast", { defaultValue: "Expected end" })} :{" "}
                            <span className="font-semibold">{endFmt}</span>
                          </span>
                        </p>
                      </div>

                      <div className="border-t border-gray-100 pt-2 space-y-1 dark:border-slate-800">
                        <p className="text-sm text-gray-700 flex items-center gap-2 dark:text-slate-200">
                          <span>🎯</span>
                          <span>
                            {t("smartCard.pdca.targetShort", { defaultValue: "Objectif" })} :{" "}
                            <span className="font-semibold">
                              {objective.current_value} → {objective.target_value} {unitLabel}
                            </span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2 dark:text-slate-200">
                          <span>📊</span>
                          <span>
                            {t("smartCard.pdca.currentSituation", { defaultValue: "Current situation" })} :{" "}
                            <span className="font-semibold">
                              {objective.current_progress ?? objective.current_value} {unitLabel}
                            </span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-2 dark:text-slate-200">
                          <span>✅</span>
                          <span>
                            {t("smartCard.pdca.fieldExecution", { defaultValue: "Field execution" })} :{" "}
                            <span className="font-semibold">{fieldExecutionProgress} %</span>
                          </span>
                        </p>
                      </div>
                    </>}

                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-blue-600 shrink-0 ml-4 mt-0.5 dark:border-slate-700 dark:bg-slate-900/60 dark:text-blue-300">
                {t("smartCard.pdca.status.tracking", { defaultValue: "Tracking" })}
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}