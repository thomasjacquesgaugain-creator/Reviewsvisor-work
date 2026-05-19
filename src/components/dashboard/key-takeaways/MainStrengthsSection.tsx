import { TrendingUp } from "lucide-react";
import type { MainStrengthsSectionProps } from "./types";
import { useTranslation } from "react-i18next";

export function MainStrengthsSection({ strengths }: MainStrengthsSectionProps) {
  const { t } = useTranslation();
  const mainStrength =
    strengths && strengths.length > 0
      ? strengths.reduce((max, current) =>
          current.count > max.count ? current : max
        )
      : null;

 if (!mainStrength) {
  return (
    <div className="relative flex  overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="absolute inset-0" />

      <div className="relative flex w-full flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.mainStrengths.mainStrength")}
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
          {t(
            "dashboard.keyTakeaways.mainStrengths.noData",
            "No key strengths identified from recent reviews."
          )}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="relative h-fit overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="absolute inset-0" />

      <div className="relative flex w-full flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#defbf4]">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
           {t("dashboard.keyTakeaways.mainStrengths.mainStrength")}
          </div>
        </div>

        <div className="mt-2 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-3">
          <div className="flex items-start gap-2">
            <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#defbf4]">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </span>

            <div className="min-w-0">
              <div className="text-[16px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                {mainStrength.theme}
              </div>

              <div className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                {t("dashboard.keyTakeaways.mainStrengths.positiveImpact")}
              </div>

              <div className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                {t("dashboard.keyTakeaways.mainStrengths.mentionedIn", { percentage: Math.round(mainStrength.percentage) })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
