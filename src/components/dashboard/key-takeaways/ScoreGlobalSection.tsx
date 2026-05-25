import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Info,
  Minus,
  MessageCircleMore,
  Sparkles,
  Star,
} from "lucide-react";
import { parseISO, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { type ScoreGlobalSectionProps, type ScoreStatus } from "./types";
import type { Review } from "./types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MIN_REVIEWS_FOR_TREND = 3;
const MAX_REASONABLE_RATING_DELTA = 4;
const TREND_WINDOW_DAYS = 60;

const getNote = (r: Review): number => r.note || r.rating || 0;
const getDateStr = (r: Review): string =>
  r.published_at || r.inserted_at || r.created_at || r.date || "";

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

const parseReviewDate = (r: Review): Date | null => {
  const s = getDateStr(r);
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

const getValidRatedReviews = (reviews: Review[]): Review[] =>
  reviews.filter((r) => {
    const n = getNote(r);
    return n >= 1 && n <= 5;
  });

const computeAverage = (reviews: Review[]): number | null => {
  const valid = getValidRatedReviews(reviews);
  if (!valid.length) return null;
  return valid.reduce((acc, r) => acc + getNote(r), 0) / valid.length;
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

function getScoreStatus(score: number, t: (key: string) => string): ScoreStatus {
  if (score < 40)
    return {
      label: t("dashboard.keyTakeaways.overallScore.critical"),
      tone: "critical",
      ring: "#ef4444",
      ringSoft: "#fee2e2",
      accent: "#ef4444",
    };
  if (score < 70)
    return {
      label: t("dashboard.keyTakeaways.overallScore.toImprove"),
      tone: "warning",
      ring: "#f59e0b",
      ringSoft: "#fef3c7",
      accent: "#f59e0b",
    };
  return {
    label: t("dashboard.keyTakeaways.overallScore.good"),
    tone: "positive",
    ring: "#22c55e",
    ringSoft: "#dcfce7",
    accent: "#22c55e",
  };
}

function ScoreRing({
  score,
  label,
  t,
}: {
  score: number;
  label: string;
  t: (key: string) => string;
}) {
  const normalizedScore = clampScore(score);
  const status = getScoreStatus(normalizedScore, t);
  const ringStyle: CSSProperties = {
    background: `conic-gradient(${status.ring} 0 ${normalizedScore}%, ${status.ringSoft} ${normalizedScore}% 100%)`,
  };

  return (
    <div className="relative mx-auto h-40 w-40 shrink-0">
      <div className="absolute inset-0 rounded-full" style={ringStyle} />
      <div className="absolute inset-[10px] rounded-full bg-white shadow-inner dark:bg-slate-900" />
      <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-950">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            {normalizedScore}
          </span>
          <span className="pb-1 text-sm font-semibold text-slate-400 dark:text-slate-400">/100</span>
        </div>
        <div
          className="mt-2 rounded-full px-3 py-1 text-sm font-semibold"
          style={{ color: status.accent, backgroundColor: `${status.accent}14` }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function SourceRow({
  icon,
  label,
  value,
  valueClassName = "text-slate-700 dark:text-slate-200",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span>{label}</span>
      </div>
      <div className={`text-[13px] font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

type TrendState = {
  ratingChange: number | null;
  currentAvg: number | null;
  previousAvg: number | null;
  reason: "insufficient-data" | "invalid-data" | null;
};

function TrendDelta({
  trend,
  locale,
  t,
}: {
  trend: TrendState;
  locale: string;
  t: (key: string) => string;
}) {
  const deltaPoints = trend.ratingChange === null ? null : trend.ratingChange * 20;
  const isUnavailable = deltaPoints === null;
  const unavailableMessage = t(
    "dashboard.keyTakeaways.overallScore.trendUnavailableMessage",
  );

  const isPositive = deltaPoints !== null && deltaPoints > 0;
  const isNeutral = deltaPoints !== null && deltaPoints === 0;
  const trendClassName =
    deltaPoints === null
      ? "text-slate-500"
      : isPositive
      ? "text-emerald-700"
      : isNeutral
      ? "text-slate-600"
      : "text-rose-600";

  const formattedValue =
    deltaPoints === null ? (
      "-"
    ) : (
      <span className="inline-flex items-center gap-1">
        {deltaPoints > 0 ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : deltaPoints < 0 ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
        <span>
          {`${formatLocalizedNumber(
            Math.abs(deltaPoints),
            locale,
            { minimumFractionDigits: 1, maximumFractionDigits: 1 },
          )} pts`}
        </span>
      </span>
    );

  const exactValue =
    deltaPoints === null
      ? null
      : `${deltaPoints > 0 ? "+" : deltaPoints < 0 ? "-" : ""}${formatLocalizedNumber(
          Math.abs(deltaPoints),
          locale,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )} pts`;

  const relativePct =
    trend.ratingChange !== null &&
    trend.previousAvg !== null &&
    trend.previousAvg > 0
      ? (trend.ratingChange / trend.previousAvg) * 100
      : null;

  const relativePctLabel =
    relativePct === null
      ? null
      : `${relativePct > 0 ? "+" : relativePct < 0 ? "-" : ""}${formatLocalizedNumber(
          Math.abs(relativePct),
          locale,
          { minimumFractionDigits: 1, maximumFractionDigits: 1 },
        )} %`;

  return (
    <div className="flex w-full max-w-[18rem] flex-col items-center gap-1 lg:w-[18rem] lg:items-start">
      <div className={`flex items-center gap-2 text-sm font-semibold ${trendClassName}`}>
        <span>{formattedValue}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("dashboard.keyTakeaways.overallScore.statRecentTrend")}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 border-slate-200 bg-white p-4 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none"
            align="center"
            sideOffset={8}
          >
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                {t("dashboard.keyTakeaways.overallScore.statRecentTrend")}
              </p>
              {isUnavailable ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {unavailableMessage}
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("dashboard.keyTakeaways.overallScore.trendExactPrefix")}{" "}
                    <strong>{exactValue ?? "-"}</strong>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("dashboard.keyTakeaways.overallScore.trendRelativePrefix")}{" "}
                    <strong>{relativePctLabel ?? "-"}</strong>{" "}
                    {t("dashboard.keyTakeaways.overallScore.trendRelativeSuffix")}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t("dashboard.keyTakeaways.overallScore.trendWindow")
                      .split("{{days}}")
                      .join(String(TREND_WINDOW_DAYS))}
                  </p>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="min-h-[2.5rem] text-[12px] leading-5 text-slate-400">
        {isUnavailable ? (
          <div className="space-y-0.5">
            <div>{unavailableMessage}</div>
            <div className="invisible">
              {t("dashboard.keyTakeaways.overallScore.trendComparisonWindow")}
            </div>
          </div>
        ) : (
          <>
            <div>{t("dashboard.keyTakeaways.overallScore.trendCurrentWindow")}</div>
            <div>{t("dashboard.keyTakeaways.overallScore.trendComparisonWindow")}</div>
          </>
        )}
      </div>
    </div>
  );
}

function hasEnoughData(
  avgRating?: number,
  positivePct?: number,
  reviewCount?: number,
): boolean {
  if (avgRating == null || !Number.isFinite(avgRating) || avgRating <= 0) return false;
  if (positivePct == null || !Number.isFinite(positivePct)) return false;
  if (reviewCount == null || !Number.isFinite(reviewCount) || reviewCount <= 0)
    return false;
  return true;
}

export function ScoreGlobalSection({
  avgRating,
  positivePct,
  reviewCount,
  reviews,
}: Omit<ScoreGlobalSectionProps, "ratingChange">) {
  const { t, i18n } = useTranslation();
  const locale = getNumberLocale(i18n.language);
  const isDataAvailable = hasEnoughData(avgRating, positivePct, reviewCount);

  const trend = useMemo<TrendState>(() => {
    if (!reviews?.length) {
      return {
        ratingChange: null,
        currentAvg: null,
        previousAvg: null,
        reason: "insufficient-data",
      };
    }

    const today = new Date();
    const last60Start = subDays(today, TREND_WINDOW_DAYS);
    const prior60Start = subDays(today, TREND_WINDOW_DAYS * 2);

    const currentReviews = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return !!d && d >= last60Start && d <= today;
    });

    const previousReviews = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return !!d && d >= prior60Start && d < last60Start;
    });

    const currentValid = getValidRatedReviews(currentReviews);
    const previousValid = getValidRatedReviews(previousReviews);

    if (
      currentValid.length < MIN_REVIEWS_FOR_TREND ||
      previousValid.length < MIN_REVIEWS_FOR_TREND
    ) {
      return {
        ratingChange: null,
        currentAvg: null,
        previousAvg: null,
        reason: "insufficient-data",
      };
    }

    const currentAvg = computeAverage(currentValid);
    const previousAvg = computeAverage(previousValid);

    if (currentAvg === null || previousAvg === null) {
      return {
        ratingChange: null,
        currentAvg: null,
        previousAvg: null,
        reason: "insufficient-data",
      };
    }

    const ratingChange = currentAvg - previousAvg;

    if (Math.abs(ratingChange) > MAX_REASONABLE_RATING_DELTA) {
      console.error("Mathematically impossible ratingChange", {
        ratingChange,
        currentAvg,
        previousAvg,
        currentCount: currentValid.length,
        previousCount: previousValid.length,
        reviewCount: reviews.length,
      });
      return {
        ratingChange: null,
        currentAvg,
        previousAvg,
        reason: "invalid-data",
      };
    }

    return { ratingChange, currentAvg, previousAvg, reason: null };
  }, [reviews]);
  

  const normalizedScore = useMemo<number | null>(() => {
    if (!isDataAvailable) return null;

    const ratingScore = (avgRating / 5) * 100;
    const sentimentScore = positivePct;
    const volumeScore = Math.min(100, reviewCount);

    const activePillars: Array<{ score: number; baseWeight: number }> = [
      { score: ratingScore, baseWeight: 0.4 },
      { score: sentimentScore, baseWeight: 0.3 },
      { score: volumeScore, baseWeight: 0.1 },
    ];

    if (trend.ratingChange !== null) {
      activePillars.splice(2, 0, {
        score: Math.max(0, Math.min(100, 100 + trend.ratingChange * 20)),
        baseWeight: 0.2,
      });
    }

    const totalActiveWeight = activePillars.reduce(
      (sum, pillar) => sum + pillar.baseWeight,
      0,
    );

    if (totalActiveWeight === 0) return null;

    const finalScore = activePillars.reduce(
      (sum, pillar) => sum + pillar.score * (pillar.baseWeight / totalActiveWeight),
      0,
    );

    return Math.round(clampScore(finalScore));
  }, [isDataAvailable, avgRating, positivePct, reviewCount, trend.ratingChange]);

  if (normalizedScore === null) {
    return (
      <div className="h-full self-start rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Sparkles className="h-4 w-4 text-slate-400 dark:text-slate-400" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.overallScore.overallScore")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-[8px] border border-slate-100 bg-white/70 py-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <AlertCircle className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-200">
            {t("dashboard.keyTakeaways.overallScore.noData")}
          </p>
          <p className="max-w-[240px] text-xs text-slate-400 dark:text-slate-400">
            {t("dashboard.keyTakeaways.overallScore.noDataHint")}
          </p>
        </div>
      </div>
    );
  }

  const status = getScoreStatus(normalizedScore, t);

  const scoreNarrative =
    status.tone === "critical"
      ? t("dashboard.keyTakeaways.overallScore.narrativeCritical")
      : status.tone === "warning"
      ? t("dashboard.keyTakeaways.overallScore.narrativeWarning")
      : t("dashboard.keyTakeaways.overallScore.narrativePositive");

  const googleRating = avgRating ?? null;
  const sentimentScore = positivePct ?? null;
  const reviewLabel =
    reviewCount == null ? null : formatLocalizedNumber(reviewCount, locale);

  return (
    <div className="h-full self-start rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${status.accent}14` }}
          >
            <Sparkles className="h-4 w-4" style={{ color: status.accent }} />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("dashboard.keyTakeaways.overallScore.overallScore")}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ color: status.accent, backgroundColor: `${status.accent}14` }}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ScoreRing score={normalizedScore} label={status.label} t={t} />
          <TrendDelta trend={trend} locale={locale} t={t} />
        </div>

        <div className="mx-auto max-w-xl text-center">
          <div className="mt-3 flex items-start justify-center gap-2 text-sm text-slate-500">
            <Star className="mt-0.5 h-4 w-4 text-amber-400" />
            <span>{scoreNarrative}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {t("dashboard.keyTakeaways.overallScore.sourcesAndDetails")}
          </div>
          <div className="divide-y divide-slate-100">
            <SourceRow
              icon={<Star className="h-3.5 w-3.5 text-amber-400" />}
              label={t("dashboard.keyTakeaways.overallScore.statRating")}
              value={
                googleRating === null
                  ? "-"
                  : `${formatLocalizedNumber(googleRating, locale, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })} / 5`
              }
            />
            <SourceRow
              icon={<Sparkles className="h-3.5 w-3.5 text-sky-500" />}
              label={t("dashboard.keyTakeaways.overallScore.statPositive")}
              value={
                sentimentScore === null
                  ? "-"
                  : `${formatLocalizedNumber(sentimentScore, locale, {
                      maximumFractionDigits: 0,
                    })} / 100`
              }
            />
            <SourceRow
              icon={<MessageCircleMore className="h-3.5 w-3.5 text-slate-400" />}
              label={t("dashboard.keyTakeaways.overallScore.statReviews")}
              value={reviewLabel ?? "-"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
