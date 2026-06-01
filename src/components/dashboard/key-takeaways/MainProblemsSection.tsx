import { AlertTriangle, CircleAlert} from "lucide-react";
import type { MainProblemsSectionProps } from "./types";
import { Trans, useTranslation } from "react-i18next";
import { useEffect } from "react";

export function MainProblemsSection({ problems, setMainIssue }: MainProblemsSectionProps) {
  const { t } = useTranslation();
  const mainProblem =
    problems && problems.length > 0
      ? problems.reduce((max, current) =>
          current.count > max.count ? current : max,
        )
      : null;

  useEffect(() => {
    if (mainProblem?.theme && setMainIssue) {
      setMainIssue(mainProblem.theme);
    }
  }, [mainProblem, setMainIssue]);

  if (!mainProblem) {
    return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7f2]">
           <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fde8e8]">
            <CircleAlert className="h-4 w-4 text-[#dc2626]" />
          </span>
          </span>
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.mainIssues.majorIssue")}
          </div>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

        <div className="mt-6 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {t("dashboard.keyTakeaways.mainIssues.noData")}
        </div>
      </div>
    );
  }

  return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7f2]">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fde8e8]">
            <CircleAlert className="h-4 w-4 text-[#dc2626]" />
          </span>
        </span>
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.mainIssues.majorIssue")}
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

<div className="mt-4  bg-white px-0 py-1 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3 px-1 py-1">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3f8]">
            <AlertTriangle className="h-6 w-6 text-[#b86e07]" />
          </span>

          <div className="min-w-0">
            <div className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {mainProblem.theme}
            </div>

            <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#ef4444]">
              {t("dashboard.keyTakeaways.mainIssues.impactHigh")}
            </div>
          </div>
        </div>

        <div className="mt-3 w-full border-t border-dashed border-[#ece8f3] dark:border-slate-700" />

        <div className="mt-3 px-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
          <Trans
            i18nKey="dashboard.keyTakeaways.mainIssues.mentionedIn"
            values={{ percentage: Math.round(mainProblem.percentage) }}
            components={{
              strong: (
                <strong className="font-bold text-slate-900 dark:text-slate-100" />
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
