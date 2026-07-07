import React, { useState, useMemo } from "react";
import { Check, Sparkles, Timer } from "lucide-react";
import type { ParetoItem } from "@/types/analysis";
import { SmartObjective } from "@/types/smart";
import { Trans } from "react-i18next";

interface ObjectiveAction {
  text: string | Record<string, string>;
  priority?: string;
  frequency?: string;
  completed?: boolean;
  reason?: string | Record<string, string>;
}


interface Props {
  objectives: SmartObjective[]; 
  paretoCauses?: ParetoItem[];
  language: string;
  onToggleAction: (objectiveId: string, actionIndex: number) => void;
  totalReviews: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
  activeIssueKey?: string;
  onActiveIssueChange?: (issueKey: string) => void;
}

const TAB_COLORS = ["#7c3aed", "#f59e0b", "#3b82f6", "#10b981", "#ef4444"];

const PRIORITY_CONFIG: Record<
  string,
  { borderColor: string; badgeClass: string; badgeLabel: string }
> = {
  high: {
    borderColor: "#ef4444",
    badgeClass:
      "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-red-600 dark:bg-red-950/30 dark:text-red-400",
    badgeLabel: "High Priority",
  },
  medium: {
    borderColor: "#f59e0b",
    badgeClass:
      "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    badgeLabel: "Medium Priority",
  },
  low: {
    borderColor: "#3b82f6",
    badgeClass:
      "inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    badgeLabel: "Low Priority",
  },
};

export const ActionPlanMultiObjective: React.FC<Props> = ({
  objectives,
  paretoCauses,
  language,
  onToggleAction,
  totalReviews,
  t,
  activeIssueKey,
  onActiveIssueChange,
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState("");
  const lang = language.startsWith("fr") ? "fr" : "en";

  const tabs = useMemo(() => {
    const objectiveByKey = new Map(
      objectives
        .filter((obj) => obj.pareto_cause?.key)
        .map((obj) => [String(obj.pareto_cause.key).toLowerCase(), obj]),
    );

    const sourceIssues = paretoCauses?.length
      ? paretoCauses
      : objectives.map((obj) => ({
          key: obj.pareto_cause?.key ?? "",
          name:
            obj.pareto_cause?.[lang] ||
            obj.pareto_cause?.en ||
            obj.pareto_cause?.fr ||
            "Issue",
          en: obj.pareto_cause?.en ?? "",
          fr: obj.pareto_cause?.fr ?? "",
          count: obj.pareto_count ?? 0,
          percentage:
            typeof obj.pareto_percentage === "number"
              ? obj.pareto_percentage
              : totalReviews > 0 && typeof obj.pareto_count === "number"
                ? (obj.pareto_count / totalReviews) * 100
                : 0,
        }));

    return sourceIssues.map((issue, i) => {
      const key = String(issue.key ?? issue.name ?? `issue-${i}`).toLowerCase();
      const objective = objectiveByKey.get(key);
      const label =
        issue?.[lang as "en" | "fr"] ||
        issue.en ||
        issue.fr ||
        issue.name ||
        `Issue ${i + 1}`;
      const pct =
        typeof issue.percentage === "number"
          ? Math.round(issue.percentage)
          : objective && typeof objective.pareto_percentage === "number"
            ? Math.round(objective.pareto_percentage)
            : objective && typeof objective.pareto_count === "number" && totalReviews > 0
              ? Math.round((objective.pareto_count / totalReviews) * 100)
              : null;
      const actions = objective?.actions ?? [];
      const doneCount = actions.filter((a) => a.completed).length;
      const allDone = actions.length > 0 && doneCount === actions.length;
      const inProgress = doneCount > 0 && !allDone;

      return {
        key,
        label,
        pct,
        allDone,
        inProgress,
        color: TAB_COLORS[i % TAB_COLORS.length],
        objective,
        issue,
      };
    });
  }, [objectives, paretoCauses, lang, totalReviews]);

  const activeKey =
    (activeIssueKey ?? internalActiveKey ?? tabs[0]?.key ?? "").toLowerCase();
  const activeIndex = tabs.findIndex((tab) => tab.key === activeKey);
  const activeTab = activeIndex >= 0 ? tabs[activeIndex] : tabs[0];
  const activeObj = activeTab?.objective ?? null;
  const actionPlanItems =
    activeObj?.action_plan?.[lang] ??
    activeObj?.action_plan?.en ??
    [];
  const displayedActions = actionPlanItems.map((plan, index) => {
    const actionState = activeObj?.actions?.find(
      (a: any) => a.action_plan_index === index
    );
    return {
      ...plan,
      completed: actionState?.completed ?? false,
      actionIndex: index,
    };
  });

  const doneCount = displayedActions.filter((a) => a.completed).length;
  const totalCount = displayedActions.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const tabColor = tabs[activeIndex]?.color ?? tabs[0]?.color ?? "#7c3aed";
  const activeIssueLabel =
    (activeTab?.issue as any)?.[lang] ||
    (activeTab?.issue as any)?.en ||
    (activeTab?.issue as any)?.fr ||
    activeTab?.label ||
    activeKey;

  const getActionReason = (action: ObjectiveAction): string => {
    if (action.reason) {
      if (typeof action.reason === "string") {
        try {
          const parsed = JSON.parse(action.reason);
          return parsed[lang] ?? parsed.en ?? action.reason;
        } catch {
          return action.reason;
        }
      }
      return (
        (action.reason as Record<string, string>)?.[lang] ??
        (action.reason as Record<string, string>)?.en ??
        ""
      );
    }
    return (
      activeObj?.pareto_cause?.[lang] ||
      activeObj?.pareto_cause?.en ||
      activeObj?.pareto_cause?.fr ||
      ""
    );
  };

  const normPriority = (p: string): "high" | "medium" | "low" => {
    const lp = (p || "").toLowerCase();
    if (lp === "high") return "high";
    if (lp === "medium" || lp === "med") return "medium";
    return "low";
  };

  return (
    <div className="space-y-5">
      <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
      <div className="flex flex-wrap gap-2 pb-1">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInternalActiveKey(tab.key);
                onActiveIssueChange?.(tab.key);
              }}
              className={`
                inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold select-none
                transition-colors duration-150 border
                ${isActive
                  ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                  : "bg-white border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                }
              `}
            >
              {/* {tab.allDone ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              ) :  (
                <span className="text-base leading-none">⏳</span>
              ) } */}

              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: tab.color }}
              />

              <span className="whitespace-nowrap">{tab.label}</span>

              {tab.pct != null && (
                <span
                  className={`font-normal ${
                    isActive
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

      {/* <div className="border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-500">
            {t("dashboard.planProgress")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
              {doneCount} / {totalCount}
            </span>
            <span className="text-sm text-gray-400 dark:text-slate-500">
              {t("dashboard.actionsCompleted")}
            </span>
            <span
              className="text-2xl font-bold ml-1"
              style={{ color: tabColor }}
            >
              {pct}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: tabColor }}
          />
        </div>
      </div> */}

      <div className="space-y-3 pt-1">
        {!activeObj ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-slate-800">
                <Timer className="h-6 w-6 text-yellow-600 dark:text-slate-300" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-yellow-900 dark:text-slate-100">
                  {t("recommendations.smart.noActionPlan.title", {
                    defaultValue: "No SMART objective available",
                  })}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-yellow-800 dark:text-slate-400">
                  <Trans
                    i18nKey="recommendations.smart.noActionPlan.subtitle"
                    values={{
                      issue: activeIssueLabel,
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
          </div>
        ) : activeObj.status === "completed" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-6 w-6" strokeWidth={3} />
            </div>
            <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300">
              {t("recommendations.smart.completed.title", {
                defaultValue: "This objective has already been completed.",
              })}
            </p>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              {t("recommendations.smart.completed.subtitle", {
                defaultValue:
                  "You can review the completed plan, but no further action is required.",
              })}
            </p>
          </div>
        ) : (
          displayedActions.map((action, idx) => {
            const p = normPriority(action.priority ?? "medium");
            const cfg = PRIORITY_CONFIG[p];
            const text = action.text;
            const reason = getActionReason(action);
            const isDone = !!action.completed;

            return (
              <div
                key={idx}
                // onClick={() =>
                //   activeObj.id && onToggleAction(activeObj.id, idx)
                // }
                style={{ borderLeftColor: cfg.borderColor }}
                className={`flex items-start gap-4 px-4 py-4 rounded-xl border border-gray-200 dark:border-slate-800 border-l-4  transition-colors `}
              >
                {/* <div
                  className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 border-2 transition-all ${
                    isDone
                      ? "border-transparent"
                      : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  }`}
                  style={isDone ? { background: tabColor } : {}}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                </div> */}

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-snug `}
                  >
                    {text}
                  </p>
                  {reason && (
                    <p className="mt-1 text-xs flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
                      <Sparkles className="w-3 h-3 text-violet-500 flex-shrink-0" />
                      <span className="text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wide text-[10px]">
                        {t("dashboard.AiRecommendation")}
                      </span>
                    </p>
                  )}
                </div>

                <span className={`flex-shrink-0 mt-0.5 ${cfg.badgeClass}`}>
                  {p === "high"
                    ? t("smartCard.priority.high")
                    : p === "medium"
                      ? t("smartCard.priority.medium")
                      : t("smartCard.priority.low")}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};