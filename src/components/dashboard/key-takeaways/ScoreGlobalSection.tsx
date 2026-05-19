import { useMemo, type CSSProperties } from "react";
import {
  Sparkles,
  Star,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { parseISO, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { type ScoreGlobalSectionProps, type ScoreStatus } from "./types";
import type { Review } from "./types";

const MIN_REVIEWS_FOR_TREND = 3;
const MAX_REASONABLE_RATING_DELTA = 4;

const getNote = (r: Review): number => r.note || r.rating || 0;
const getDateStr = (r: Review): string =>
  r.published_at || r.inserted_at || r.created_at || r.date || "";

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
      <div className="absolute inset-[10px] rounded-full bg-white dark:bg-slate-900 shadow-inner" />
      <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-950">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-slate-950">
            {normalizedScore}
          </span>
          <span className="pb-1 text-sm font-semibold text-slate-400">/100</span>
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

function ScoreStat({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: string;
  accentClassName: string;
}) {
  return (
    <div className="rounded-[8px] border border-slate-100 bg-white/70 p-3 shadow-sm">
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${accentClassName}`}
      >
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

type TrendState = {
  ratingChange: number | null;
  reason: "insufficient-data" | "invalid-data" | null;
};

function RatingChangeStat({
  ratingChange,
  reason,
  t,
}: {
  ratingChange: number | null;
  reason: TrendState["reason"];
  t: (key: string) => string;
}) {
  const isUnavailable = ratingChange === null;
  const isPositive = !isUnavailable && ratingChange > 0;
  const isNeutral = !isUnavailable && ratingChange === 0;

  const Icon = isUnavailable || isNeutral
    ? Minus
    : isPositive
    ? TrendingUp
    : TrendingDown;

  const accentClassName =
    isUnavailable || isNeutral
      ? "text-slate-500"
      : isPositive
      ? "text-emerald-700"
      : "text-rose-600";

  const valueColor =
    isUnavailable || isNeutral
      ? "text-slate-950"
      : isPositive
      ? "text-emerald-700"
      : "text-rose-600";

  const formattedValue = isUnavailable
    ? "—"
    : isNeutral
    ? "0.0 pts"
    : `${isPositive ? "↑" : "↓"} ${Math.abs(ratingChange).toFixed(1)} pts`;

  const hint =
    reason === "insufficient-data"
      ? t("dashboard.keyTakeaways.overallScore.statRecentTrendInsufficient")
      : reason === "invalid-data"
      ? t("dashboard.keyTakeaways.overallScore.statRecentTrendInvalid")
      : t("dashboard.keyTakeaways.overallScore.statRecentTrendHint");

  return (
    <div className="rounded-[8px] border border-slate-100 bg-slate-50 p-3 shadow-sm">
      <div
        className={`font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-[11px] ${accentClassName}`}
      >
        <Icon className="h-3 w-3" />
        <span>{t("dashboard.keyTakeaways.overallScore.statRecentTrend")}</span>
      </div>
      <div className={`mt-1 text-lg font-bold ${valueColor}`}>{formattedValue}</div>
      <div className="mt-0.5 text-[10px] text-slate-400">{hint}</div>
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
  const { t } = useTranslation();
  const isDataAvailable = hasEnoughData(avgRating, positivePct, reviewCount);

  const trend = useMemo<TrendState>(() => {
    if (!reviews?.length) {
      return { ratingChange: null, reason: "insufficient-data" };
    }

    const today = new Date();
    const last60Start = subDays(today, 60);
    const prior60Start = subDays(today, 120);

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
      return { ratingChange: null, reason: "insufficient-data" };
    }

    const currentAvg = computeAverage(currentValid);
    const previousAvg = computeAverage(previousValid);

    if (currentAvg === null || previousAvg === null) {
      return { ratingChange: null, reason: "insufficient-data" };
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
      return { ratingChange: null, reason: "invalid-data" };
    }

    return { ratingChange, reason: null };
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
console.log("Active pillars---->",activePillars);

    const totalActiveWeight = activePillars.reduce(
      (sum, pillar) => sum + pillar.baseWeight,
      0,
    );

    console.log("total weight---->",totalActiveWeight);
    

    if (totalActiveWeight === 0) return null;

    const finalScore = activePillars.reduce(
      (sum, pillar) => sum + pillar.score * (pillar.baseWeight / totalActiveWeight),
      0,
    );

    return Math.round(clampScore(finalScore));
  }, [isDataAvailable, avgRating, positivePct, reviewCount, trend.ratingChange]);

  if (normalizedScore === null) {
    return (
      <div className="h-full self-start rounded-[8px] border border-white/70 bg-gradient-to-br from-white via-[#fbfaff] to-[#f4fbff] p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Sparkles className="h-4 w-4 text-slate-400" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("dashboard.keyTakeaways.overallScore.overallScore")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-[8px] border border-slate-100 bg-white/70 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <AlertCircle className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("dashboard.keyTakeaways.overallScore.noData")}
          </p>
          <p className="max-w-[240px] text-xs text-slate-400">
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

  return (
    <div className="h-full self-start rounded-[8px] border border-white/70 bg-gradient-to-br from-white via-[#fbfaff] to-[#f4fbff] p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${status.accent}14` }}
          >
            <Sparkles
              className="h-4 w-4"
              style={{ color: status.accent }}
            />
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

      <div className="mt-5 flex flex-col gap-5">
        <div className="flex justify-center">
          <ScoreRing score={normalizedScore} label={status.label} t={t} />
        </div>

        <div className="mx-auto max-w-xl text-center">
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
            <Star className="mt-0.5 h-4 w-4 text-amber-400" />
            <span>{scoreNarrative}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ScoreStat
            label={t("dashboard.keyTakeaways.overallScore.statRating")}
            value={`${avgRating?.toFixed(1)}/5`}
            accentClassName="text-[#fe53b3]"
          />
          <ScoreStat
            label={t("dashboard.keyTakeaways.overallScore.statPositive")}
            value={`${positivePct}/100`}
            accentClassName="text-[#b18cf4]"
          />
          <ScoreStat
            label={t("dashboard.keyTakeaways.overallScore.statReviews")}
            value={String(reviewCount)}
            accentClassName="text-[#2563eb]"
          />
          <RatingChangeStat
            ratingChange={trend.ratingChange}
            reason={trend.reason}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
