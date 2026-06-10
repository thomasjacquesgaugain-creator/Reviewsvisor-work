import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { MainStrengthsSectionProps } from "./types";
import { Trans, useTranslation } from "react-i18next";

export function MainStrengthsSection({ strengths }: MainStrengthsSectionProps) {
  const { t } = useTranslation();
  const mainStrength =
    strengths && strengths.length > 0
      ? strengths.reduce((max, current) =>
          current.count > max.count ? current : max,
        )
      : null;

  if (!mainStrength) {
    return (
<div className="h-full rounded-[18px] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#defbf4]">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </span>
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.mainStrengths.mainStrength")}
          </div>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

        <div className="mt-6 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          {t(
            "dashboard.keyTakeaways.mainStrengths.noData",
            "No key strengths identified from recent reviews.",
          )}
        </div>
      </div>
    );
  }

  return (
<div className="h-full rounded-[18px] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#defbf4]">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </span>
        <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.mainStrengths.mainStrength")}
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-800/80" />

<div className="mt-4 bg-white px-0 py-1 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3 px-1 py-1">
          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#defbf4]">
            <ArrowUpRight className="h-6 w-6 text-emerald-600" />
          </span>

          <div className="min-w-0">
            <div className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {mainStrength.theme}
            </div>

            <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
              {t("dashboard.keyTakeaways.mainStrengths.positiveImpact")}
            </div>
          </div>
        </div>

        <div className="mt-3 w-full border-t border-dashed border-[#ece8f3] dark:border-slate-700" />

        <div className="mt-3 px-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
          <Trans
            i18nKey="dashboard.keyTakeaways.mainStrengths.mentionedIn"
            values={{ percentage: Math.round(mainStrength.percentage) }}
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
