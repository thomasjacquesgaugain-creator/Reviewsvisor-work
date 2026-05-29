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

  if (!reviews?.length) {
    return (
      <div className="flex-1 relative overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
        <div className="relative flex min-h-[180px] flex-col">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <AlertTriangle className="h-4 w-4 text-slate-400" />
            </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.riskAlert.title")}
            </p>
          </div>
          <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.riskAlert.noData")}
          </div>
        </div>
      </div>
    );
  }

  const data = riskData ?? {
    currentMonthLabel: "",
    previousMonthLabel: "",
    currentMonthNegativeCount: 0,
    previousMonthNegativeCount: 0,
    changePct: 0,
    isRising: false,
    isStable: true,
  };

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

  return (
    <div className="flex-1 relative overflow-hidden rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="relative flex min-h-[180px] flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
              data.isStable ? "bg-slate-100" : data.isRising ? "bg-rose-100" : "bg-emerald-100"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                data.isStable ? "text-slate-400" : data.isRising ? "text-rose-500" : "text-emerald-600"
              }`}
            />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.riskAlert.title")}
          </p>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${
              data.isStable
                ? "bg-slate-100 text-slate-600"
                : data.isRising
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {data.isStable
              ? t("dashboard.keyTakeaways.riskAlert.stable")
              : data.isRising
              ? t("dashboard.keyTakeaways.riskAlert.rising")
              : t("dashboard.keyTakeaways.riskAlert.falling")}
          </span>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70 dark:bg-slate-700/70" />

        <div className="mt-4 rounded-[8px] bg-white/70 dark:bg-slate-950 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2">
            <p
              className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${
                data.isStable ? "text-slate-500" : data.isRising ? "text-rose-500" : "text-emerald-600"
              }`}
            >
              {t("dashboard.keyTakeaways.riskAlert.recentDrift")}
            </p>
            {data.isStable ? (
              <Minus className="h-3.5 w-3.5 text-slate-400" />
            ) : data.isRising ? (
              <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            )}
          </div>

          <p className="mt-2 text-[15px] leading-6 text-slate-700 dark:text-slate-200">
            {t(driftMessageKey, {
              countLabel: negativeReviewsLabel(data.currentMonthNegativeCount),
              month: data.currentMonthLabel,
              pct: data.changePct.toFixed(1),
            })}
          </p>

          <p className="mt-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.riskAlert.comparison", {
              currentLabel: negativeReviewsLabel(data.currentMonthNegativeCount),
              previousLabel: negativeReviewsLabel(data.previousMonthNegativeCount),
              previousMonth: data.previousMonthLabel,
            })}
          </p>

          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              data.isStable
                ? "bg-slate-100 text-slate-600"
                : data.isRising
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {data.isStable ? (
              <Minus className="h-3 w-3" />
            ) : data.isRising ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {t(changeBadgeKey, { pct: Math.abs(data.changePct).toFixed(1) })}
          </div>
        </div>

        <div className="mt-auto pt-4 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.riskAlert.footer")}
        </div>
      </div>
    </div>
  );
}
