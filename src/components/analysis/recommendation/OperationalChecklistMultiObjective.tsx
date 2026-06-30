import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  Calendar,
  Check,
  Download,
  List,
  PencilIcon,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SmartAction, ScheduleType, SmartObjective } from "@/types/smart";
import { ChecklistConfigureModal } from "./ChecklistConfigureModal";
import { useSmartStore } from "@/store/smartStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { generateChecklistPdf } from "@/utils/generateChecklistPdf";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";

type ChecklistAction = {
  text: string | Record<string, string>;
  frequency?: string;
  schedule?: ScheduleType;
  schedule_value?: string | null;
  completed?: boolean;
};


type Props = {
  objectives: SmartObjective[];
  language: string;
  onToggleAction: (objectiveId: string, actionIndex: number) => void;
  totalReviews: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
  setOpenCard: Dispatch<SetStateAction<string | null>>;
};

const OBJECTIVE_TONES = [
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
];

const normalizeFrequency = (frequency?: string) => {
  const value = String(frequency ?? "").toLowerCase();
  if (value === "weekly") return "weekly";
  if (value === "once" || value === "monthly") return "monthly";
  return "daily";
};

const formatMonthLabel = (deadline?: string, language = "en") => {
  const parsed = deadline ? new Date(deadline) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  return new Intl.DateTimeFormat(language.startsWith("fr") ? "fr-FR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(valid);
};

const localizeValue = (
  value: string | Record<string, string> | undefined,
  language: string,
) => {
  if (!value) return "";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed[language] ?? parsed.fr ?? parsed.en ?? value;
      }
    } catch {
      return value;
    }
    return value;
  }

  return value[language] ?? value.fr ?? value.en ?? "";
};

function scheduleLabel(
  action: ChecklistAction,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (!action.schedule) return "";

  const isCustom =
    action.schedule === "custom_time" ||
    action.schedule === "custom_date";

  if (isCustom && action.schedule_value) {
    return action.schedule_value;
  }

  const labels: Record<string, string> = {
    start_of_day: t("recommendations.smart.checklist.schedule.daily.startOfDay"),
    during_activity: t("recommendations.smart.checklist.schedule.daily.duringActivity"),
    end_of_day: t("recommendations.smart.checklist.schedule.daily.endOfDay"),
    custom_time: t("recommendations.smart.checklist.schedule.daily.customTime"),

    monday: t("recommendations.smart.checklist.schedule.weekly.monday"),
    tuesday: t("recommendations.smart.checklist.schedule.weekly.tuesday"),
    wednesday: t("recommendations.smart.checklist.schedule.weekly.wednesday"),
    thursday: t("recommendations.smart.checklist.schedule.weekly.thursday"),
    friday: t("recommendations.smart.checklist.schedule.weekly.friday"),
    saturday: t("recommendations.smart.checklist.schedule.weekly.saturday"),
    sunday: t("recommendations.smart.checklist.schedule.weekly.sunday"),

    start_of_month: t("recommendations.smart.checklist.schedule.monthly.startOfMonth"),
    mid_month: t("recommendations.smart.checklist.schedule.monthly.midMonth"),
    end_of_month: t("recommendations.smart.checklist.schedule.monthly.endOfMonth"),
    custom_date: t("recommendations.smart.checklist.schedule.monthly.customDate"),
  };

  return labels[action.schedule] ?? action.schedule;
}

export function OperationalChecklistMultiObjective({
  objectives,
  language,
  onToggleAction,
  totalReviews,
  t,
  setOpenCard
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showConfigure, setShowConfigure] = useState(false);
  const lang = language.startsWith("fr") ? "fr" : "en";
  const { saveActionSchedules } = useSmartStore();
  const { establishment: currentEstablishment } = useCurrentEstablishment();
  

  useEffect(() => {
    if (activeIndex >= objectives.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, objectives.length]);

  const tabs = useMemo(
    () =>
      objectives.map((objective, index) => {
        const label =
          objective?.pareto_cause?.[lang] ||
          objective?.pareto_cause?.en ||
          objective?.pareto_cause?.fr ||
          t("dashboard.problemBadge", { number: index + 1 });
        const pct =
          typeof objective?.pareto_percentage === "number"
            ? Math.round(objective.pareto_percentage)
            : typeof objective?.pareto_count === "number" && totalReviews > 0
              ? Math.round((objective.pareto_count / totalReviews) * 100)
              : null;
        const actions = objective.actions ?? [];
        const completed = actions.filter((action) => action.completed).length;
        const allDone = actions.length > 0 && completed === actions.length;
        const inProgress = completed > 0 && !allDone;

        return {
          label,
          pct,
          allDone,
          inProgress,
          color: OBJECTIVE_TONES[index % OBJECTIVE_TONES.length],
        };
      }),
    [lang, objectives, t, totalReviews],
  );

  const objective = objectives[activeIndex] ?? objectives[0] ?? null;
  const actions = Array.isArray(objective?.actions) ? objective.actions : [];

  const entries = actions.map((action, actionIndex) => ({
    ...action,
    actionIndex,
    frequency: normalizeFrequency(action.frequency),
    text: localizeValue(action.text, lang),
  }));

  const grouped = {
    daily: entries.filter((item) => item.frequency === "daily"),
    weekly: entries.filter((item) => item.frequency === "weekly"),
    monthly: entries.filter((item) => item.frequency === "monthly"),
  };

  const completedCount = entries.filter((item) => item.completed).length;
  const totalCount = entries.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const monthLabel = formatMonthLabel(new Date().toISOString(), language);
  const isChecklistLocked = objective?.status !== "in_progress";

  const sectionCounts = [
    {
      key: "daily",
      title: t("dashboard.daily"),
      items: grouped.daily,
    },
    {
      key: "weekly",
      title: t("dashboard.weekly"),
      items: grouped.weekly,
    },
    {
      key: "monthly",
      title: t("dashboard.monthly"),
      items: grouped.monthly,
    },
  ];

  if (!objectives.length) {
    return (
       <Card className="mb-8 rounded-[18px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="relative border-slate-200 pb-4 text-left dark:border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <List className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("dashboard.operationalChecklist")}
              </span>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {t("dashboard.routineToFollow")}
              </p>
            </div>
          </div>
          <div className="flexitems-center gap-8 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpenCard(null)}
              className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5 sm:px-6">


      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/15">
        <List className="mx-auto mb-3 h-10 w-10 text-emerald-600 dark:text-emerald-300" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t("recommendations.smart.noSmartActions")}
        </p>
      </div>
      
      </CardContent>
    </Card>
    );
  }

  return (
    <Card className="mb-8 rounded-[18px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="relative border-slate-200 pb-4 text-left dark:border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <List className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("dashboard.operationalChecklist")}
              </span>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {t("dashboard.routineToFollow")}
              </p>
            </div>
          </div>
          <div className="flexitems-center gap-8 justify-end">
            {objective?.id && objective.status === "in_progress" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigure(true)}
                className="gap-2 text-xs mr-2"
              >
                <PencilIcon className="h-2.5 w-2.5" />
                {t("dashboard.configure", { defaultValue: "Configure" })}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                generateChecklistPdf({
                  establishmentName:currentEstablishment?.name,
                  objectiveName: localizeValue(objective?.pareto_cause, lang) || "",
                  actions: objective?.actions ?? [],
                  lang,
                  t,
                })
              }
              className="gap-2 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              {t("recommendations.smart.checklist.configure.downloadPDF", { defaultValue: "Imprimer / PDF" })}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpenCard(null)}
              className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

        </div>

      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5 sm:px-6">


        <div className="space-y-4">
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2 pb-1">
            {tabs.map((tab, i) => {
              const isActive = i === activeIndex;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`
                inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold select-none
                transition-colors duration-150 border
                ${isActive
                      ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                      : "bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }
              `}
                >
                  {tab.allDone ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-base leading-none">⏳</span>
                  )}

                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: tab.color }}
                  />

                  <span className="whitespace-nowrap">{tab.label}</span>

                  {tab.pct != null && (
                    <span
                      className={`font-normal ${isActive
                        ? "text-white/60 dark:text-gray-900/60"
                        : "text-gray-400 dark:text-slate-500"
                        }`}
                    >
                      {tab.pct} %
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

          <div className="relative">
            {isChecklistLocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[24px] bg-white/70 backdrop-blur-[2px] dark:bg-slate-900/70">
                <div className="max-w-sm rounded-xl border border-orange-200 bg-white px-5 py-4 text-center shadow-lg dark:border-orange-900 dark:bg-slate-800">
                  <div className="mb-2 text-lg">🔒</div>

                  <p className="text-sm font-semibold">
                    {t("smartCard.pdca.checklistLocked", { defaultValue: "Checklist locked" })}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {t("smartCard.pdca.checklistLockedStatus", { defaultValue: " The operational checklist will be available once validate and launch this plan." })}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-[24px] border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/15 mb-4">
              <div className="px-5 py-4">
                <div className="flex items-end justify-between gap-4 rounded-2xl bg-emerald-50/70 px-1 pb-3 pt-1 dark:bg-emerald-950/10">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    <BarChart2 className="h-4 w-4" />
                    {t("dashboard.executionFor", {
                      defaultValue: `Execution for ${monthLabel}`,
                    })}
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {progress} %
                  </div>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {sectionCounts.map((section) => (
                    <div
                      key={section.key}
                      className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 dark:border-emerald-900/40 dark:bg-slate-900/70"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {section.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {section.items.filter((item) => item.completed).length}
                          {" / "}
                          {section.items.length}
                        </span>
                        <span className="ml-1 text-slate-500 dark:text-slate-400">
                          {t("dashboard.tasks")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {sectionCounts.map((section) => {
              if (!section.items.length) return null;

              return (
                <section key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                      <Calendar className="h-4 w-4" />
                      {section.title}
                    </div>
                    <Badge className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {section.items.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((entry) => (
                      <div
                        key={`${section.key}-${entry.actionIndex}`}
                        onClick={() => objective?.id && onToggleAction(objective.id, entry.actionIndex)}
                        className="flex cursor-pointer items-center gap-3  bg-white px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                      >
                        <div className="shrink-0">
                          {entry.completed ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-emerald-500">
                              <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-[6px] border-2 border-slate-300 bg-white" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm leading-relaxed ${entry.completed
                              ? "text-slate-400 line-through dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-100"
                              }`}
                          >
                            {entry.text}
                          </p>
                        </div>

                        <Badge
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${section.key === "daily"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : section.key === "weekly"
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                              : "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300"
                            }`}
                        >
                          {scheduleLabel(entry, t) || section.title}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {objective?.id && (
            <ChecklistConfigureModal
              open={showConfigure}
              onClose={() => setShowConfigure(false)}
              actions={objective.actions as SmartAction[] ?? []}
              objectiveName={
                localizeValue(objective.pareto_cause, lang) ||
                t("dashboard.problemBadge", { number: activeIndex + 1 })
              }
              lang={lang}
              onSave={(updatedActions) => saveActionSchedules(objective.id!, updatedActions)}
            />
          )}
        </div>
        {/* </div> */}
      </CardContent>
    </Card>

  );
}
