import { CheckCircle2 } from "lucide-react";
import type { RecommendedActionSectionProps } from "./types";
import { useTranslation } from "react-i18next";

export function RecommendedActionSection({
  points,
  mainIssue,
}: RecommendedActionSectionProps) {
  const { t } = useTranslation();

  const recommendedPoint =
    points?.find(
      (point) =>
        point.issue?.toLowerCase().trim() === mainIssue?.toLowerCase().trim(),
    ) ||
    [...(points || [])].sort((a, b) => b.impact - a.impact)[0] ||
    null;

  if (!recommendedPoint) {
    return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dffbf5]">
            <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
          </span>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.recommandedActions.title")}
          </p>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

        <div className="mt-6 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {t("dashboard.keyTakeaways.recommandedActions.noData")}
        </div>
      </div>
    );
  }

  return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dffbf5]">
          <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
        </span>
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.recommandedActions.title")}
        </p>
      </div>

      <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

<div className="mt-4 rounded-[16px] border border-slate-100 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
          </span>

          <div className="min-w-0">
            <p className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {recommendedPoint?.first_step}
            </p>

            <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              {recommendedPoint?.why_it_matters}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
