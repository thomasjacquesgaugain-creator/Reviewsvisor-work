// src/components/reviews/SmartObjectiveCard.tsx
// Card 2 — SMART objective details + progress

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Target, ChevronDown, ChevronUp, Info, Zap, Clock, Calendar, CheckCircle2, Sun, Gauge, Check, RefreshCcw } from "lucide-react";
import type { SmartObjective } from "@/types/smart";
import { useSmartProgress } from "@/hooks/useSmartProgress";
import { format, type Locale } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface Props {
  objective: SmartObjective;
  onUpdateProgress?: (id: string, value: number) => void;
  onToggleAction?: (id: string, actionIndex: number) => void;
}

const localeMap: Record<string, Locale> = { fr, en: enUS, it, es, pt: ptBR };

const getLocalizedText = (value: any, language = "en"): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value[language] || value.en || value.fr || Object.values(value)[0] || "";
  return String(value);
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};
const STATUS_STYLE: Record<string, string> = {
  todo:        "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-500 text-white",
  completed:   "bg-green-100 text-green-700",
  overdue:     "bg-red-100 text-red-700",
};

const LETTER: Record<string, { dot: string; label: string; text: string }> = {
  S: { dot: "bg-blue-500",   label: "text-blue-700",   text: "OBJECTIF CLAIR"   },
  P: { dot: "bg-orange-500", label: "text-orange-700", text: "PERTINENCE"        },
  M: { dot: "bg-green-500",  label: "text-green-700",  text: "MESURÉ PAR"       },
  E: { dot: "bg-purple-500", label: "text-purple-700", text: "ÉCHÉANCE"          },
  A: { dot: "bg-yellow-500", label: "text-yellow-700", text: "OBJECTIF À ACCOMPLIR" },
};

export function SmartObjectiveCard({ objective, onUpdateProgress }: Props) {    
  const { t, i18n } = useTranslation();
  const lang       = (i18n.language || "fr").split("-")[0].toLowerCase();
  const locale     = localeMap[lang] || fr;
  const progress   = useSmartProgress(objective);
  const [showProgress, setShowProgress] = useState(false);
  const [progressInput, setProgressInput] = useState(
    String(objective.current_progress ?? objective.current_value)
  );
  const deadlineFmt = objective.deadline
    ? format(new Date(objective.deadline), "d MMMM yyyy", { locale })
    : "—";
  const startFmt = objective.created_at
    ? format(new Date(objective.created_at), "d MMMM yyyy", { locale })
    : "—";
  const endFmt = objective.deadline
    ? format(new Date(objective.deadline), "d MMMM yyyy", { locale })
    : "—";

  const specific  = t("smartCard.goalSections.specific",   { defaultValue: "Spécifique · Pro" });
  const realistic = t("smartCard.goalSections.realistic",      { defaultValue: "Réaliste" });
  const measuredBy= t("smartCard.goalSections.measuredBy",     { defaultValue: "Mesurable" });
  const timeBound = t("smartCard.goalSections.Timebound",      { defaultValue: "Temporellement défini" });
  const achievable= t("smartCard.goalSections.Achievable",{ defaultValue: "Atteignable" });

  const current = Number(objective.current_value ?? 0);
const target = Number(objective.target_value ?? 0);

const targetChangePercentage =
  current !== 0
    ? Math.round(((target - current) / current) * 100)
    : 0;

 useEffect(() => {
  setProgressInput(String(objective.current_progress ?? objective.current_value));
  setShowProgress(false); 
}, [objective.id, objective.current_progress, objective.current_value]);

  return (
    <Card className="border rounded-[18px] border-gray-200 shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
            <Target className={`h-5 w-5 shrink-0 ${
              objective.status === "completed" ? "text-green-500" : "text-blue-600"
                }`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t("smartCard.header.title", {
                    defaultValue: "Target goal",
                  })}
                </p>

                <span className="text-sm italic text-slate-500 dark:text-slate-400">(SMART)</span>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                      className="text-violet-500 hover:text-violet-600 transition-colors dark:text-violet-300 dark:hover:text-violet-200"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>

                    <TooltipContent
                      side="top"
                    className="max-w-xs rounded-xl border bg-white p-4 text-sm leading-6 text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {t("smartCard.header.smartTooltip", {
                        defaultValue:
                          "SMART goal: method for defining a clear, measurable and realistic goal. Benefit: you know exactly what result to reach and how to track it.",
                      })}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-400">
    {t("smartCard.header.subTitle", {
      defaultValue: "Goal framework validated by AI for this issue",
    })}
  </p>
</div>
          </div>
         
        </div>


<div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-3">

  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Target className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <span className="text-[12px] font-bold text-blue-700 uppercase tracking-wide">
        {t("smartCard.smart.specific", { defaultValue: "CLEAR GOAL" })}
      </span>
      <span className="text-[12px] text-gray-400 uppercase italic">({specific})</span>
    </div>
    <p className="text-[13px] text-slate-800 leading-relaxed mb-0.5 dark:text-slate-100">
      {getLocalizedText(objective.problem, lang) || "—"}
    </p>
    <p className="text-[12px] text-slate-700 leading-relaxed mb-1.5 dark:text-slate-300">
      {t("dashboard.action", { defaultValue: "Action" })}: {getLocalizedText(objective.actions[0]?.text ?? objective.actions[0], lang)}
    </p>
   
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
        <Sun className="w-3.5 h-3.5 text-purple-600" />
      </div>
      <span className="text-[12px] font-bold text-purple-700 uppercase tracking-wide">
        {t("smartCard.smart.relevant", { defaultValue: "RELEVANCE" })}
      </span>
      <span className="text-[12px] text-gray-400 italic uppercase">({realistic})</span>
    </div>
    <p className="text-[13px] text-slate-800 leading-relaxed mb-0.5 dark:text-slate-100">
      {getLocalizedText(objective.relevance_note, lang) || "—"}
    </p>
    <p className="text-[12px] text-slate-600 leading-relaxed mb-1.5 dark:text-slate-300">
       {t("smartCard.expectedResult", { defaultValue: "Expected result" })} : {getLocalizedText(objective.expected_result, lang) || "—"}
    </p>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <Gauge className="w-3.5 h-3.5 text-red-600" />
      </div>
      <span className="text-[12px] font-bold text-red-700 uppercase tracking-wide">
        {t("smartCard.smart.measurable", { defaultValue: "MEASURED BY" })}
      </span>
      <span className="text-[12px] text-gray-400 italic uppercase">({measuredBy})</span>
    </div>
    <p className="text-[13px] text-slate-700 font-medium mb-1 dark:text-slate-200">
      {getLocalizedText(objective.kpi_label, lang)}
    </p>
    <p className="text-[11px] text-slate-400 dark:text-slate-400">
      {t("smartCard.goalSections.measurementUnit", { defaultValue: "Unit" })} :{" "}
      <strong className="text-slate-600 dark:text-slate-200">
        {getLocalizedText(objective.unit, lang) || t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "negative reviews / month" })}
      </strong>
      {" · "}
      {/* {t("smartCard.goalSections.measurementFrequency", { defaultValue: "Measurement frequency" })} :{" "}
      <strong className="text-slate-600">
        {t("smartCard.goalSections.monthly", { defaultValue: "monthly" })}
      </strong> */}
    </p>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
        <Calendar className="w-3.5 h-3.5 text-orange-600" />
      </div>
      <span className="text-[12px] font-bold text-orange-700 uppercase tracking-wide">
        {t("smartCard.smart.temporal", { defaultValue: "DEADLINE" })}
      </span>
      <span className="text-[12px] text-gray-400 italic uppercase">({timeBound})</span>
    </div>
    <p className="text-[13px] text-slate-800 dark:text-slate-100">
      {t("smartCard.temporal.from", { defaultValue: "From" })}{" "}
      <strong className="dark:text-slate-100">{startFmt}</strong>
      {" "}{t("smartCard.temporal.to", { defaultValue: "to" })}{" "}
      <strong className="dark:text-slate-100">{endFmt}</strong>
      {" "}<span className="text-purple-600 dark:text-violet-300">({objective.duration_months} {t("smartCard.temporal.months", { defaultValue: "months" })})</span>
      {" · "}
      {t("smartCard.temporal.review", { defaultValue: "Review" })}{" "}
      <strong className="dark:text-slate-100"> {t(`smartCard.temporal.reviewFrequency.${objective.review_frequency}`, {
      defaultValue: objective.review_frequency ?? "—"
    })}</strong>
    </p>
  </div>
</div>

<div className="px-5 pb-4">
  <div className="rounded-2xl  border  p-3.5">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-green-700" />
      </div>
      <span className="text-[12px] font-bold text-green-700 uppercase tracking-wide">
        {t("smartCard.smart.achievable", { defaultValue: "GOAL TO ACCOMPLISH" })}
      </span>
              <span className="text-[12px] text-gray-400 italic uppercase">({achievable})</span>
            </div>
           <p className="mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
  {t("smartCard.goalSections.currentSituation", {
    defaultValue: "Current situation",
  })}{" "}
  : {objective.current_value} {getLocalizedText(objective.kpi_label, lang)}
  {" → "}
  {t("smartCard.goalSections.targetValue", {
    defaultValue: "Target value",
  })}{" "}
  : {objective.target_value} {getLocalizedText(objective.kpi_label, lang)}
  {" ("}
  {targetChangePercentage > 0 ? "+" : ""}
  {targetChangePercentage}%{")"}
</p>

<p className="text-[11px] text-slate-500 dark:text-slate-400">
  {t("smartCard.goalSections.justification", {
    defaultValue: "AI justification",
  })}{" "}
  : {getLocalizedText(objective.ai_justification, lang) || "—"}
</p>
  </div>
</div>

        <div className="px-5 pb-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-[16px] font-semibold text-black-700 dark:text-slate-100">
                    {t("smartCard.progress.label", {
                      defaultValue: "Progression vers l'objectif",
                    })}
                  </p>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {t("smartCard.progress.cycle", {
                      defaultValue: "CYCLE N°1",
                    })}
                  </span>
                </div>
                <p className="text-[12px] text-gray-600 dark:text-slate-400">
                  {getLocalizedText(objective.kpi_label, lang)}
                  {" · "}
                  {t("smartCard.progress.autoStarted", { defaultValue: "auto-mesuré · démarré le" })}{" "}
                  {startFmt}
                </p>
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-xl font-bold text-violet-600">
                  {progress.percentage} %
                </span>

                <span className="mt-1 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
                  {t("smartCard.progress.atteint", {
                    defaultValue: "ATTEINT",
                  })}
                </span>
              </div>
            </div>

            <Progress value={progress.percentage} className="h-2 mb-2" />
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-slate-800/70">
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide dark:text-slate-400">
                  {t("smartCard.progress.startLabel", { defaultValue: "Départ" })}
                </p>
                <p className="text-sm font-bold text-gray-700 dark:text-slate-100">{objective.current_value}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">
                  {t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "avis négatifs / mois" })}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40">
                <p className="text-[10px] text-blue-500 mb-0.5 uppercase tracking-wide dark:text-blue-300">
                  {t("smartCard.progress.currentLabel", { defaultValue: "Actuel" })}
                </p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {objective.current_progress ?? objective.current_value}
                </p>
                <p className="text-[10px] text-blue-400 dark:text-blue-200">
                {t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "avis négatifs / mois" })}
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg dark:bg-slate-800/70">
                <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide dark:text-slate-400">
                  {t("smartCard.progress.targetLabel", { defaultValue: "Cible" })}
                </p>
                <p className="text-sm font-bold text-gray-700 dark:text-slate-100">{objective.target_value}</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">
                  {t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "avis négatifs / mois" })}
                </p>
              </div>
            </div>


            <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-400">
              <span>{startFmt}</span>
              <span className="text-gray-300">← {objective.duration_months} {t("smartCard.temporal.months")} →</span>
              <span className={progress.isOverdue ? "text-red-500" : ""}>{endFmt}</span>
            </div>

            {onUpdateProgress && objective.status === "in_progress" && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => setShowProgress((p) => !p)}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  {t("smartCard.progress.updateBtn")}
                  {showProgress ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showProgress && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{t("smartCard.progress.currentMentions")}</span>
                    <input
                      type="number"
                      value={progressInput}
                      min={0}
                      max={objective.current_value}
                      onChange={(e) => setProgressInput(e.target.value)}
                      className="w-16 text-xs border border-gray-200 rounded px-2 py-1 text-center dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => {
                        const val = Number(progressInput);
                        if (!isNaN(val) && objective.id) {
                          onUpdateProgress(objective.id, val);
                          setShowProgress(false);
                        }
                      }}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                    >
                      {t("smartCard.progress.saveBtn")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}