import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { format, parseISO, subMonths, type Locale } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { RiskAlertSectionProps, Review } from "./types";

const localeMap: Record<string, Locale> = {
  fr,
  en: enUS,
  it,
  es,
  pt: ptBR,
};

const getDateStr = (review: Review): string =>
  review?.published_at || review?.inserted_at || review?.created_at || review?.date || "";

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

const parseReviewDate = (review: Review): Date | null => {
  const raw = getDateStr(review);
  if (!raw) return null;
  try {
    const parsed = parseISO(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const getNote = (review: Review): number => review?.note || review?.rating || 0;
const isNegative = (review: Review): boolean => {
  const note = getNote(review);
  return note >= 1 && note <= 2;
};

const getLatestDate = (reviews: Review[]): Date | null =>
  reviews.reduce<Date | null>((latest, review) => {
    const parsed = parseReviewDate(review);
    return parsed && (!latest || parsed > latest) ? parsed : latest;
  }, null);

export function RiskAlertSection({ reviews }: RiskAlertSectionProps) {
  const { t, i18n } = useTranslation();
  const locale = getNumberLocale(i18n.language);

  const negativeReviewsLabel = (count: number) =>
    t("dashboard.keyTakeaways.riskAlert.negativeReviews", { count });

  const riskData = useMemo(() => {
    if (!reviews?.length) return null;

    const anchorDate = getLatestDate(reviews) ?? new Date();
    const language = (i18n.language || "fr").split("-")[0].toLowerCase();
    const locale = localeMap[language] || fr;
    const currentMonthKey = format(anchorDate, "yyyy-MM");
    const previousMonthDate = subMonths(anchorDate, 1);
    const previousMonthKey = format(previousMonthDate, "yyyy-MM");
    const currentMonthLabel = format(anchorDate, "MMMM yyyy", { locale });
    const previousMonthLabel = format(previousMonthDate, "MMMM yyyy", { locale });

    const monthlyNegativeCounts = new Map<string, number>();

    for (const review of reviews) {
      const parsedDate = parseReviewDate(review);
      if (!parsedDate) continue;
      const monthKey = format(parsedDate, "yyyy-MM");
      if (!isNegative(review)) continue;
      monthlyNegativeCounts.set(monthKey, (monthlyNegativeCounts.get(monthKey) ?? 0) + 1);
    }

    const currentMonthNegativeCount = monthlyNegativeCounts.get(currentMonthKey) ?? 0;
    const previousMonthNegativeCount = monthlyNegativeCounts.get(previousMonthKey) ?? 0;
    const diff = currentMonthNegativeCount - previousMonthNegativeCount;
    const changePct =
      previousMonthNegativeCount > 0
        ? (diff / previousMonthNegativeCount) * 100
        : currentMonthNegativeCount > 0
        ? 100
        : 0;

    return {
      currentMonthLabel,
      previousMonthLabel,
      currentMonthNegativeCount,
      previousMonthNegativeCount,
      changePct,
      isRising: diff > 0,
      isStable: diff === 0,
    };
  }, [reviews, i18n.language]);

  const data = riskData ?? {
    currentMonthLabel: "",
    previousMonthLabel: "",
    currentMonthNegativeCount: 0,
    previousMonthNegativeCount: 0,
    changePct: 0,
    isRising: false,
    isStable: true,
  };

  const accentBadgeClasses = data.isStable
    ? "bg-slate-100 text-slate-600"
    : data.isRising
    ? "bg-rose-100 text-[#b91c1c]"
    : "bg-emerald-100 text-emerald-700";

  const accentTextClass = data.isStable
    ? "text-slate-500"
    : data.isRising
    ? "text-[#b91c1c]"
    : "text-emerald-600";

  const iconBgClass = data.isStable
    ? "bg-slate-100"
    : data.isRising
    ? "bg-rose-100"
    : "bg-emerald-100";

  const TrendIcon = data.isStable ? Minus : data.isRising ? TrendingUp : TrendingDown;

  const driftMessageKey = data.isStable
    ? "dashboard.keyTakeaways.riskAlert.stableMessage"
    : data.isRising
    ? "dashboard.keyTakeaways.riskAlert.risingMessage"
    : "dashboard.keyTakeaways.riskAlert.fallingMessage";

  const changeBadgeKey = data.isStable
    ? "dashboard.keyTakeaways.riskAlert.changeStable"
    : data.isRising
    ? "dashboard.keyTakeaways.riskAlert.changeRising"
    : "dashboard.keyTakeaways.riskAlert.changeFalling";

  if (!reviews?.length) {
    return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </span>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.riskAlert.title")}
          </p>
        </div>
        <div className="mt-3 h-px w-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-6 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          {t("dashboard.keyTakeaways.riskAlert.noData")}
        </div>
      </div>
    );
  }

  return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-2">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${iconBgClass}`}>
          <AlertTriangle className={`h-4 w-4 ${accentTextClass}`} />
        </span>
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.riskAlert.title")}
        </p>
        <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${accentBadgeClasses}`}>
          {data.isStable
            ? t("dashboard.keyTakeaways.riskAlert.stable")
            : data.isRising
            ? t("dashboard.keyTakeaways.riskAlert.rising")
            : t("dashboard.keyTakeaways.riskAlert.falling")}
        </span>
      </div>

      <div className="mt-3 h-px w-full bg-slate-100 dark:bg-slate-800" />

      <div className="mt-4 flex flex-col gap-3">

        <div className="flex items-center gap-1.5">
          <p className={`text-[12px] font-bold uppercase tracking-[0.14em] ${accentTextClass}`}>
            {t("dashboard.keyTakeaways.riskAlert.recentDrift")}
          </p>
          <TrendIcon className={`h-3.5 w-3.5 ${accentTextClass}`} />
        </div>

        <p className="text-[14px] leading-6 text-slate-700 dark:text-slate-200">
          {t(driftMessageKey, {
            countLabel: negativeReviewsLabel(data.currentMonthNegativeCount),
            month: data.currentMonthLabel,
            pct: formatLocalizedNumber(data.changePct, locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          })}
        </p>

        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.riskAlert.comparison", {
            currentLabel: negativeReviewsLabel(data.currentMonthNegativeCount),
            previousLabel: negativeReviewsLabel(data.previousMonthNegativeCount),
            previousMonth: data.previousMonthLabel,
          })}
        </p>

        <div className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${accentBadgeClasses}`}>
          <TrendIcon className="h-3 w-3" />
          {t(changeBadgeKey, {
            pct: formatLocalizedNumber(Math.abs(data.changePct), locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }),
          })}
        </div>
      </div>
        <div className="mt-3 w-full border-t border-dashed border-[#ece8f3] dark:border-slate-700" />

      <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-500">
        {t("dashboard.keyTakeaways.riskAlert.footer")}
      </p>

    </div>
  );
}
