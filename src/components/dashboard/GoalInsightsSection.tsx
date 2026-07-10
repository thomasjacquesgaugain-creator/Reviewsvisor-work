import { Dispatch, ReactNode, SetStateAction, useMemo } from "react";
import {
  AlertTriangle,
  Check,
  Gauge,
  Info,
  Target,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { SmartObjective, SmartProgress } from "@/types/smart";
import { extractOriginalText } from "@/utils/extractOriginalText";
import { ParetoItem } from "@/types/analysis";

type ProjectedStats = {
  totalImpact: number;
  current: number;
  low: number;
  high: number;
};

type Props = {
  openCard: string | null;
  setOpenCard: Dispatch<SetStateAction<string | null>>;
  progress: SmartProgress;
  linkedReviews: any[];
  projectedStats: ProjectedStats | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
  language: string;
  renderReviewText?: (text: string) => ReactNode;
  paretoCauses?: ParetoItem[];
  objectives: SmartObjective[];
  handleClick?: () => void;
};

const goalProgressPct = (goal: { start: number; current: number; target: number }) => {
  const denom = goal.start - goal.target;
  if (!denom) return 0;
  const pct = ((goal.start - goal.current) / denom) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

const getGoalColor = (pct: number) => {
  if (pct <= 0) {
    return {
      dot: "bg-slate-300 dark:bg-slate-600",
      text: "text-slate-400 dark:text-slate-500",
    };
  }
  if (pct < 50) {
    return {
      dot: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  };
};

const getPriorityStatus = (
  trendPct: number,
  progressPct: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
) => {

  if (progressPct >= 100) {
    return {
      label: t("objective.completed", { defaultValue: "Completed" }),
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    };
  }

  if (trendPct >= 50) {
    return {
      label: t("objective.onTrack", { defaultValue: "On track" }),
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    };
  }

  if (trendPct > 0) {
    return {
      label: t("objective.notEnoughImpact", {
        defaultValue: "Not enough impact",
      }),
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      dotClass: "bg-amber-500",
    };
  }

  return {
    label: t("objective.notStarted", { defaultValue: "Not started" }),
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotClass: "bg-slate-300 dark:bg-slate-500",
  };
};

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

export function GoalInsightsSection({
  openCard,
  setOpenCard,
  progress,
  linkedReviews,
  projectedStats,
  t,
  language,
  renderReviewText,
  paretoCauses,
  objectives,
  handleClick
}: Props) {

  const selectedTab = openCard ?? "progression";
  const lang = language.startsWith("fr") ? "fr" : "en";
  const numberLocale = getNumberLocale(language);

  const actions = useMemo(
    () => objectives.flatMap((objective) => objective.actions ?? []),
    [objectives],
  );
  const completedActions = actions.filter((action) => action.completed).length;
  const totalActions = actions.length;
  const actionsPercentage =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const objectiveGoals = useMemo(
    () =>
      objectives.map((objective) => {
        const key = String(objective?.pareto_cause?.key ?? "").toLowerCase();
        const label =
          objective?.pareto_cause?.[lang] ||
          objective?.pareto_cause?.en ||
          objective?.pareto_cause?.fr ||
          t("objective.actionTracking");
        const start = objective?.current_value ?? 0;
        const current = objective?.current_progress ?? objective?.current_value ?? 0;
        const target = objective?.target_value ?? 0;
        const percentage =
          typeof objective?.pareto_percentage === "number"
            ? objective.pareto_percentage
            : typeof objective?.pareto_count === "number" &&
              objective.pareto_count > 0
              ? objective.pareto_count
              : 0;
        return { id: objective?.id, key, label, start, current, target, percentage };
      }),
    [objectives, lang, t],
  );

  const objectiveGoalMap = useMemo(
    () => new Map(objectiveGoals.map((goal) => [goal.key, goal])),
    [objectiveGoals],
  );

  const priorityRows = useMemo(() => {
    const normalizedKey = (item: ParetoItem | any) =>
      String(item?.key ?? item?.name ?? item?.label ?? "")
        .trim()
        .toLowerCase();

    const sortedCauses = [...(paretoCauses ?? [])]
      .sort(
        (a, b) => (b.count ?? b.percentage ?? 0) - (a.count ?? a.percentage ?? 0),
      )
      .filter((item, index, list) => {
        const key = normalizedKey(item);
        if (!key) return true;

        return (
          index ===
          list.findIndex((candidate) => normalizedKey(candidate) === key)
        );
      });
    return sortedCauses.slice(0, 3).map((item, index) => {
      const key = normalizedKey(item);
      const goal = objectiveGoalMap.get(key) || null;
      const sourceItem = item as ParetoItem & { label?: string };

      const label =
        sourceItem?.[lang as "en" | "fr"] ||
        sourceItem?.name ||
        sourceItem?.label ||
        goal?.label ||
        t("objective.actionTracking");

      const start = goal?.start ?? item.count ?? item.percentage ?? 0;
      const current = goal?.current ?? item.count ?? item.percentage ?? start;
      const target = goal?.target ?? current;
      const progressPct = goal ? goalProgressPct(goal) : 0;
      const trendPct = goal && start > 0 ? Math.round(((current - start) / start) * 100) : 0;
      const status = goal
        ? getPriorityStatus(Math.abs(trendPct), progressPct, t)
        : getPriorityStatus(0, 0, t);

      const trendLabel =
        trendPct === 0
          ? t("objective.stable", { defaultValue: "stable" })
          : `${trendPct > 0 ? "+" : ""}${formatLocalizedNumber(Math.abs(trendPct), numberLocale, { maximumFractionDigits: 0 })}%`;

      return {
        key: key || `priority-${index}`,
        label,
        start,
        current,
        target,
        trendPct,
        trendLabel,
        status,
      };
    });
  }, [paretoCauses, objectiveGoalMap, lang, t]);

  const exampleGoal = useMemo(() => {
    if (objectiveGoals.length === 0) return null;
    return objectiveGoals.reduce(
      (best, goal) => (goalProgressPct(goal) > goalProgressPct(best) ? goal : best),
      objectiveGoals[0],
    );
  }, [objectiveGoals]);
  const exampleGoalPct = exampleGoal ? goalProgressPct(exampleGoal) : 0;
  const TAB_META = [
    {
      key: "progression",
      label: t("objective.progress"),
      icon: Check,
    },
    {
      key: "avisLies",
      label: t("objective.criticalReviews"),
      icon: AlertTriangle,
    },
    {
      key: "impact",
      label: t("objective.whereToAct"),
      icon: TrendingUp,
    },
  ] as const;

  const getImpactLabel = (index: number) => {
    switch (index) {
      case 0:
        return {
          color: "emerald",
          label: `${t("objective.impactValues.high")}`,
        };

      case 1:
        return {
          color: "amber",
          label: `${t("objective.impactValues.medium")}`,
        };

      default:
        return {
          color: "slate",
          label: `${t("objective.impactValues.low")}`,
        };
    }
  };

  const reviewItems = useMemo(
    () =>
      linkedReviews.map((review, idx) => {
        const authorName =
          review?.author ||
          review?.author_name ||
          t("dashboard.anonymous");
        const rating = Math.round(review?.rating || 0);
        const text = extractOriginalText(review?.text) || review?.text || "";
        return { review, idx, authorName, rating, text };
      }),
    [linkedReviews, t],
  );

  const detailContent = {
    progression: (
      <div className="space-y-4">
        <div className="rounded-[18px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("objective.actionsProgress")}
              </p>
              <p className="-mt-1 mb-3 text-sm text-slate-600 dark:text-slate-100">
                {t("objective.workDone")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("objective.actionsCompleted", {
                  completed: completedActions,
                  total: totalActions,
                })}
              </p>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatLocalizedNumber(actionsPercentage, numberLocale, { maximumFractionDigits: 0 })}%
            </div>
          </div>

          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${actionsPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("objective.goalsProgress", { defaultValue: "Goals progress" })}
              </p>
              <p className="-mt-1 mb-3 text-sm text-slate-600 dark:text-slate-100">
                {t("objective.problemImproving", {
                  defaultValue: "Is the problem actually improving?",
                })}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("objective.actualReduction", {
                  defaultValue: "Actual reduction of negative reviews",
                })}
              </p>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatLocalizedNumber(Math.round(progress.percentage), numberLocale, { maximumFractionDigits: 0 })}%
            </div>
          </div>

          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>

          <div className="mt-4 space-y-3">
            {objectiveGoals.map((goal) => {
              const pct = goalProgressPct(goal);
              const color = getGoalColor(pct);
              return (
                <div
                  key={goal.id ?? goal.label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
                  <div className="min-w-0 flex-1 basis-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {goal.label}
                    </p>
                  </div>
                  <div className="flex-1 basis-0 text-center text-sm text-slate-500 dark:text-slate-400">
                    {formatLocalizedNumber(goal.start, numberLocale, { maximumFractionDigits: 0 })} → {formatLocalizedNumber(goal.current, numberLocale, { maximumFractionDigits: 0 })} → {formatLocalizedNumber(goal.target, numberLocale, { maximumFractionDigits: 0 })}
                  </div>
                  <div className={`flex-1 basis-0 text-right text-sm font-semibold ${color.text}`}>
                    {formatLocalizedNumber(pct, numberLocale, { maximumFractionDigits: 0 })}%
                  </div>
                </div>
              );
            })}
          </div>

          {exampleGoal && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              {t("objective.progressFormulaExample", {
                label: exampleGoal.label,
                start: formatLocalizedNumber(exampleGoal.start, numberLocale, { maximumFractionDigits: 0 }),
                current: formatLocalizedNumber(exampleGoal.current, numberLocale, { maximumFractionDigits: 0 }),
                target: formatLocalizedNumber(exampleGoal.target, numberLocale, { maximumFractionDigits: 0 }),
                percentage: formatLocalizedNumber(exampleGoalPct, numberLocale, { maximumFractionDigits: 0 }),
              })}
            </p>
          )}
        </div>
      </div>
    ),
    avisLies: (
      <div className="space-y-3">
        {reviewItems.length === 0 ? (
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {t("dashboard.noRelatedReviewsFound")}
          </div>
        ) : (
          reviewItems.map(({ review, idx, authorName, rating, text }) => (
            <div
              key={review?.id || idx}
              className="rounded-[18px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {authorName}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${star <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {renderReviewText ? renderReviewText(text) : text}
              </div>
            </div>
          ))
        )}
      </div>
    ),
    impact: (
      <div className="space-y-4">
        <div className="bg-white dark:border-slate-800 dark:bg-slate-900">
          {paretoCauses?.length>0?  <p className="text-sm text-slate-900 dark:text-slate-100">
            {t("objective.impactPriority")}
          </p>:
            <p className="rounded-[18px] border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {t("dashboard.keyTakeaways.overallScore.noData")}
          </p>
          }
        
          <div className="mt-4 space-y-4">
            {paretoCauses?.map((item, index) => (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">

                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </span>
                  </div>
                  <div className={`text-sm font-semibold text-${getImpactLabel(index).color}-600 dark:text-emerald-400`}>
                    {getImpactLabel(index).label}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-emerald-500 transition-all`}
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {formatLocalizedNumber(item.count, numberLocale, { maximumFractionDigits: 0 })} {t("dashboard.mentionsInNegativeReviews")}
                </div>
              </div>
            ))}
          </div>

          {projectedStats && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t("dashboard.projectedRating")}:{" "}
                {formatLocalizedNumber(projectedStats.low, numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} -{" "}
                {formatLocalizedNumber(projectedStats.high, numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("objective.currentRatingText", {
                  rating: formatLocalizedNumber(projectedStats.current, numberLocale, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }),
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">
                {t("objective.topPriorities", {
                  defaultValue: "Top 3 priorities",
                })}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("objective.topPrioritiesDesc", {
                  defaultValue:
                    "Observed result and plan execution, for each ongoing battle",
                })}
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl ">
            <div className="grid grid-cols-[1.25fr_1fr_0.8fr] gap-3 border-b border-slate-200  px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
              <div>{t("objective.objectiveColumn", { defaultValue: "Objective" })}</div>
              <div>{t("objective.trendColumn", { defaultValue: "Trend" })}</div>
              <div>{t("objective.statusColumn", { defaultValue: "Status" })}</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {priorityRows.length === 0 ? (
                <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                  {t("objective.noPriorities", {
                    defaultValue: "No priorities available yet.",
                  })}
                </div>
              ) : (
                priorityRows.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={handleClick}
                    className="grid w-full grid-cols-[1.25fr_1fr_0.8fr] items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-950/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`h-3 w-3 shrink-0 rounded-full ${row.status.dotClass}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {formatLocalizedNumber(row.start, numberLocale, { maximumFractionDigits: 0 })} → {formatLocalizedNumber(row.current, numberLocale, { maximumFractionDigits: 0 })}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${Math.abs(row.trendPct) > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : Math.abs(row.trendPct) < 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                        {row.trendLabel}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${row.status.className}`}>
                        {row.status.label}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 border-t border-dashed border-slate-200 pt-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p>
              {t("objective.topPrioritiesNote", {
                defaultValue:
                  '"Not enough impact" means the plan is moving, but the result is not following yet. Click a row to open its action plan in Recommendations.',
              })}
            </p>
          </div>
        </div>
      </div>
      <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">
                  {t("objective.exploreTheDetails", {
                    defaultValue: "Explore the details",
                  })}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("objective.detailBehindYourGoals", {
                    defaultValue: "The detail behind your goals, open it if needed",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-6">
            <div className="grid grid-cols-1 rounded-[18px] bg-slate-100 p-1 md:grid-cols-3 dark:bg-slate-800/80">
              {TAB_META.map((tab) => {
                const isActive = selectedTab === tab.key;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOpenCard(tab.key as string)}
                    className={`flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold transition-all ${isActive
                      ? "bg-white text-violet-700 shadow-sm dark:bg-slate-100 dark:text-violet-700"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="mb-3">
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTab === "progression"
                    ? t("objective.planProgress")
                    : selectedTab === "avisLies"
                      ? t("objective.criticalReviews")
                      : t("objective.whereToActFirst")}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTab === "progression"
                    ? t("objective.planProgressDesc")
                    : selectedTab === "avisLies"
                      ? t("objective.criticalReviewsDesc")
                      : t("objective.whereToActFirstDesc")}
                </p>
              </div>
              {detailContent[selectedTab as keyof typeof detailContent]}
            </div>
            {selectedTab === "progression" && (
              <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <p>
                    {t("objective.planEffectNote", {
                      actionsPercentage,
                      progressPercentage: Math.round(progress.percentage),
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}