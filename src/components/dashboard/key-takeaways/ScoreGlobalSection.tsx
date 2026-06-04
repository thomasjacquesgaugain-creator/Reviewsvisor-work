import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  AlertCircle,
  Info,
  Minus,
  Star,
  Sun,
  TrendingDown,
  TrendingUp,
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
  if (score < 40) {
    return {
      label: t("dashboard.keyTakeaways.overallScore.critical"),
      tone: "critical",
      ring: "#ef4444",
      ringSoft: "#fee2e2",
      accent: "#ef4444",
    };
  }
  if (score < 70) {
    return {
      label: t("dashboard.keyTakeaways.overallScore.toImprove"),
      tone: "warning",
      ring: "#f59e0b",
      ringSoft: "#fef3c7",
      accent: "#f59e0b",
    };
  }
  if (score < 85) {
    return {
      label: t("dashboard.keyTakeaways.overallScore.good"),
      tone: "positive",
      ring: "#16a34a",
      ringSoft: "#e8f5e8",
      accent: "#16a34a",
    };
  }
  return {
    label: t("dashboard.keyTakeaways.overallScore.excellent"),
    tone: "positive",
    ring: "#166534",
    ringSoft: "#d1fae5",
    accent: "#166534",
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
    <div className="relative mx-auto h-44 w-44 shrink-0">
      <div className="absolute inset-0 rounded-full" style={ringStyle} />
      <div className="absolute inset-[10px] rounded-full bg-white shadow-inner dark:bg-slate-900" />
      <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            {normalizedScore}
          </span>
          <span className="pb-1.5 text-sm font-semibold text-slate-400">/100</span>
        </div>
        <div
          className="mt-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ color: status.accent, backgroundColor: `${status.accent}18` }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function ScoreCalculationPopover() {
  const { t } = useTranslation();

  const pillars = [
    {
      title: t("dashboard.keyTakeaways.overallScore.calcGoogleTitle"),
      weight: "40 %",
      description: t("dashboard.keyTakeaways.overallScore.calcGoogleDesc"),
    },
    {
      title: t("dashboard.keyTakeaways.overallScore.calcSentimentTitle"),
      weight: "30 %",
      description: t("dashboard.keyTakeaways.overallScore.calcSentimentDesc"),
    },
    {
      title: t("dashboard.keyTakeaways.overallScore.calcTrendTitle"),
      weight: "20 %",
      description: t("dashboard.keyTakeaways.overallScore.calcTrendDesc"),
    },
    {
      title: t("dashboard.keyTakeaways.overallScore.calcVolumeTitle"),
      weight: "10 %",
      description: t("dashboard.keyTakeaways.overallScore.calcVolumeDesc"),
    },
  ];

  const pills = [
    { label: t("dashboard.keyTakeaways.overallScore.calcThresholdCritical"), bg: "#FCE4E4", fg: "#DC2626", symbol: "🔴" },
    { label: t("dashboard.keyTakeaways.overallScore.calcThresholdImprove"), bg: "#FEF1DC", fg: "#E89614", symbol: "🟠" },
    { label: t("dashboard.keyTakeaways.overallScore.calcThresholdGood"), bg: "#E8F5E8", fg: "#16A34A", symbol: "🟢" },
    { label: t("dashboard.keyTakeaways.overallScore.calcThresholdExcellent"), bg: "#D1FAE5", fg: "#166534", symbol: "💎" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("dashboard.keyTakeaways.overallScore.calcAriaLabel")}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-indigo-50 dark:hover:bg-slate-800"
        >
          <Info size={14} color="#4F46E5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={10}
        className="w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden p-0 border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        style={{ borderRadius: 14, boxShadow: "0 8px 28px rgba(0,0,0,0.1)" }}
      >
        <div className="px-[22px] py-5">
          <div className="flex items-center gap-2">
            <Info size={14} color="#4F46E5" />
            <p className="text-[13px] font-bold text-[#15151f] dark:text-slate-100">
              {t("dashboard.keyTakeaways.overallScore.calcTitle")}
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <div className="flex items-start gap-2 text-[13px] font-bold text-[#15151f] dark:text-slate-100">
                  <span>
                    {pillar.title}{" "}
                    <span className="font-bold text-[#4F46E5]">({pillar.weight})</span>
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-5 text-[#6b6b85]">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
            <p className="text-[11px] font-bold text-slate-600">
              {t("dashboard.keyTakeaways.overallScore.calcThresholdsLabel")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full px-[8px] py-[3px] text-[10px] font-bold leading-none"
                  style={{ backgroundColor: pill.bg, color: pill.fg }}
                >
                  <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center leading-none">
                    {pill.symbol}
                  </span>
                  {pill.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
            <p className="text-[11px] italic text-slate-600">
              {t("dashboard.keyTakeaways.overallScore.calcNote")}
            </p>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3">
            <div className="flex items-start gap-2 text-[10px] text-[#9CA3AF]">
              <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
              <p>{t("dashboard.keyTakeaways.overallScore.calcFooter")}</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
  const deltaPoints = trend.ratingChange === null ? null : trend.ratingChange;
  const isUnavailable = deltaPoints === null;
  const unavailableMessage = t("dashboard.keyTakeaways.overallScore.trendUnavailableMessage");

  const isPositive = deltaPoints !== null && deltaPoints > 0;
  const isNeutral = deltaPoints !== null && deltaPoints === 0;

  const trendColor =
    deltaPoints === null
      ? "#94a3b8"
      : isPositive
      ? "#16a34a"
      : isNeutral
      ? "#64748b"
      : "#ef4444";

  const formattedValue =
    deltaPoints === null ? "—" : (
      <span className="inline-flex items-center gap-1">
        {deltaPoints > 0 ? (
          <TrendingUp className="h-6 w-6 shrink-0" />
        ) : deltaPoints < 0 ? (
          <TrendingDown className="h-6 w-6 shrink-0" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
        {deltaPoints > 0 ? "+" : deltaPoints < 0 ? "-" : ""}
        {`${formatLocalizedNumber(Math.abs(deltaPoints), locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}`}
      </span>
    );

  const exactValueNode =
  deltaPoints === null ? null : (
    <span className="inline-flex items-center gap-1">
      <span>
        {`${deltaPoints > 0 ? "+" : deltaPoints < 0 ? "-" : ""}${formatLocalizedNumber(
          Math.abs(deltaPoints),
          locale,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )}`}
      </span>
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
    </span>
  );

  const relativePct =
    trend.ratingChange !== null && trend.previousAvg !== null && trend.previousAvg > 0
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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span
              className="text-[32px] font-bold leading-none tabular-nums"
              style={{ color: trendColor }}
            >
              {formattedValue}
            </span>
            <Star className="h-6 w-6 mt-1 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex flex-col leading-tight mt-1">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {t("dashboard.keyTakeaways.overallScore.statRecentTrend")}
            </span>
            <span className="mt-0 text-[10px] text-slate-400">
              {t("dashboard.keyTakeaways.overallScore.trendCurrentWindow")}
            </span>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex mb-2 h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
              aria-label={t("dashboard.keyTakeaways.overallScore.statRecentTrend")}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-72 border border-slate-200 bg-white p-4 text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
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
                    <strong className="text-slate-900 dark:text-slate-100">
                      {exactValueNode ?? "-"}
                    </strong>
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t("dashboard.keyTakeaways.overallScore.trendRelativePrefix")}{" "}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {relativePctLabel ?? "-"}
                    </strong>{" "}
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
    </div>
  );
}

function SourceTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-slate-100 bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 transition-transform hover:-translate-y-0.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl rounded-[12px] bg-[#f7f5fb] dark:bg-slate-800">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6b6b80]">
          {label}
        </span>
        <div className="flex items-end gap-1 leading-none">
          <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
            {value}
          </span>
          {unit && (
            <span className="pb-0.5 text-sm font-semibold text-slate-400 dark:text-slate-500">
              {unit}
            </span>
          )}
        </div>
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
  if (reviewCount == null || !Number.isFinite(reviewCount) || reviewCount <= 0) return false;
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
      return { ratingChange: null, currentAvg: null, previousAvg: null, reason: "insufficient-data" };
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
      return { ratingChange: null, currentAvg: null, previousAvg: null, reason: "insufficient-data" };
    }

    const currentAvg = computeAverage(currentValid);
    const previousAvg = computeAverage(previousValid);

    if (currentAvg === null || previousAvg === null) {
      return { ratingChange: null, currentAvg: null, previousAvg: null, reason: "insufficient-data" };
    }

    const ratingChange = currentAvg - previousAvg;

    if (Math.abs(ratingChange) > MAX_REASONABLE_RATING_DELTA) {
      return { ratingChange: null, currentAvg, previousAvg, reason: "invalid-data" };
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

    const totalActiveWeight = activePillars.reduce((sum, p) => sum + p.baseWeight, 0);
    if (totalActiveWeight === 0) return null;

    const finalScore = activePillars.reduce(
      (sum, p) => sum + p.score * (p.baseWeight / totalActiveWeight),
      0,
    );
    return Math.round(clampScore(finalScore));
  }, [isDataAvailable, avgRating, positivePct, reviewCount, trend.ratingChange]);

  const status = normalizedScore === null ? null : getScoreStatus(normalizedScore, t);

  const scoreNarrative =
    status?.tone === "critical"
      ? t("dashboard.keyTakeaways.overallScore.narrativeCritical")
      : status?.tone === "warning"
      ? t("dashboard.keyTakeaways.overallScore.narrativeWarning")
      : t("dashboard.keyTakeaways.overallScore.narrativePositive");

  const googleRating = avgRating ?? null;
  const sentimentScore = positivePct ?? null;
  const reviewLabel = reviewCount == null ? null : formatLocalizedNumber(reviewCount, locale);

  if (normalizedScore === null || !status) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#defbf4]">
                <Sun className="h-4 w-4 text-emerald-500" />
              </span>

              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t("dashboard.keyTakeaways.overallScore.overallScore")}
              </p>

              <ScoreCalculationPopover />
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {t("dashboard.keyTakeaways.overallScore.noData")}
            </span>
          </div>

          <div className="mt-6 flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <AlertCircle className="h-6 w-6 text-slate-400 dark:text-slate-500" />

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("dashboard.keyTakeaways.overallScore.noData")}
            </p>

            <p className="max-w-[260px] text-xs text-slate-400 dark:text-slate-500">
              {t("dashboard.keyTakeaways.overallScore.noDataHint")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
             <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl dark:bg-[#ffe7f2]">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${status.accent}18` }}
            >
              <Sun className="h-4 w-4" style={{ color: status.accent }} />
            </span>
             </span>

            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.overallScore.overallScore")}
            </p>
            <ScoreCalculationPopover />
          </div>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{ color: status.accent, backgroundColor: `${status.accent}18` }}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-6 mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">

          <div className="flex shrink-0 justify-center  ml-8 mr-8">
            <ScoreRing score={normalizedScore} label={status.label} t={t} />
          </div>

          <div className="flex w-full flex-col gap-4">
            <TrendDelta trend={trend} locale={locale} t={t} />

            <div
              className="flex items-start gap-2.5 rounded-[10px] border-l-[3px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
              style={{ borderLeftColor: status.accent }}
            >
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{scoreNarrative}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a9aae] dark:text-slate-500">
          {t("dashboard.keyTakeaways.overallScore.sourcesAndDetails")}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SourceTile
            icon={"⭐"}
            label={t("dashboard.keyTakeaways.overallScore.statRating")}
            value={
              googleRating === null
                ? "-"
                : formatLocalizedNumber(googleRating, locale, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })
            }
            unit="/5"
          />
          <SourceTile
            icon={"🧠"}
            label={t("dashboard.keyTakeaways.overallScore.statPositive")}
            value={
              sentimentScore === null
                ? "-"
                : formatLocalizedNumber(sentimentScore, locale, { maximumFractionDigits: 0 })
            }
            unit="/100"
          />
          <SourceTile
            icon={"💬"}
            label={t("dashboard.keyTakeaways.overallScore.statReviews")}
            value={reviewLabel ?? "-"}
            unit={t("dashboard.keyTakeaways.overallScore.reviews")}
          />
        </div>
      </div>

    </div>
  );
}
