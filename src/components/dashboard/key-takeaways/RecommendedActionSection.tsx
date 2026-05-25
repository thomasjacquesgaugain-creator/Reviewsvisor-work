import { CheckCircle2 } from "lucide-react";
import type { RecommendedActionSectionProps } from "./types";
import { useTranslation } from "react-i18next";

export function RecommendedActionSection({
  points,
  mainIssue
}: RecommendedActionSectionProps) {
  const { t } = useTranslation();  

  const recommendedPoint =
    points?.find(
      (point) =>
        point.issue?.toLowerCase().trim() === mainIssue?.toLowerCase().trim()
    ) ||
    [...(points || [])].sort((a, b) => b.impact - a.impact)[0] ||
    null;

  if (!recommendedPoint) {
    return (
      <div className="relative overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
        <div className="relative flex min-h-[236px] flex-col">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#a1fae8]/70">
              <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.recommandedActions.title")}
            </p>
          </div>

          <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

          <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.recommandedActions.noData")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="relative flex min-h-[236px] flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#a1fae8]/70">
            <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.recommandedActions.title")}
          </p>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-4 rounded-[8px] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6]">
                <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
              </span>

              <div>
                <p className="text-[16px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                  {recommendedPoint?.first_step}
                </p>

                <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                  {recommendedPoint?.why_it_matters}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
