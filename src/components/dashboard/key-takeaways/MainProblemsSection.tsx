import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { MainProblemsSectionProps } from "./types";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export function MainProblemsSection({ problems,setMainIssue }: MainProblemsSectionProps) {
  const { t } = useTranslation();
   const mainProblem =
    problems && problems.length > 0
      ? problems.reduce((max, current) =>
          current.count > max.count ? current : max
        )
      : null;

  useEffect(() => {
    if (mainProblem?.theme && setMainIssue) {
      setMainIssue(mainProblem.theme);
    }
  }, [mainProblem, setMainIssue]);

 if (!mainProblem) {
  return (
    <div className="relative h-fit overflow-hidden rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ffe7f2]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#fe53b3]" />
          </span>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.mainIssues.majorIssue")}
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
          {t("dashboard.keyTakeaways.mainIssues.noData")}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="relative overflow-hidden rounded-[8px] border bg-white p-4">
      <div className="absolute inset-0" />
      
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ffffff] border-none">
            <ShieldAlert className="h-3.5 w-3.5 text-[#fe53b3]" />
          </span>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.mainIssues.majorIssue")}
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-3">
          <div className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffe7f2]">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </span>

            <div className="min-w-0">
              <div className="text-[16px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                {mainProblem.theme}
              </div>

              <div className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                {t("dashboard.keyTakeaways.mainIssues.impactHigh")}
              </div>

              <div className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                 {t("dashboard.keyTakeaways.mainIssues.mentionedIn", { percentage: Math.round(mainProblem.percentage) })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
