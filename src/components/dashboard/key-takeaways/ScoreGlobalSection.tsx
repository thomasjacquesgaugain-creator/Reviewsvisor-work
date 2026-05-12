import type { CSSProperties } from "react";
import { Sparkles, Star, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type ScoreGlobalSectionProps, type ScoreStatus } from "./types";
import type { Review } from "./types";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { parseISO, subDays, isAfter, isBefore } from "date-fns";

const getNote = (r: Review): number => r.note || r.rating || 0;
const getDateStr = (r: Review): string => r.published_at || r.inserted_at || r.created_at || r.date || '';

const parseReviewDate = (r: Review): Date | null => {
  const s = getDateStr(r);
  if (!s) return null;
  try { const d = parseISO(s); return isNaN(d.getTime()) ? null : d; }
  catch { return null; }
};

const computeAverage = (reviews: Review[]): number | null => {
  const valid = reviews.filter(r => { const n = getNote(r); return n >= 1 && n <= 5; });
  if (!valid.length) return null;
  return valid.reduce((acc, r) => acc + getNote(r), 0) / valid.length;
};

const getLatestDate = (reviews: Review[]): Date | null =>
  reviews.reduce<Date | null>((latest, r) => {
    const d = parseReviewDate(r);
    return d && (!latest || d > latest) ? d : latest;
  }, null);

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

function getScoreStatus(score: number, t: (key: string) => string): ScoreStatus {
  if (score < 40) return { label: t("dashboard.keyTakeaways.overallScore.critical"),  tone: "critical", ring: "#ef4444", ringSoft: "#fee2e2", accent: "#ef4444" };
  if (score < 70) return { label: t("dashboard.keyTakeaways.overallScore.toImprove"), tone: "warning",  ring: "#f59e0b", ringSoft: "#fef3c7", accent: "#f59e0b" };
  return           { label: t("dashboard.keyTakeaways.overallScore.good"),             tone: "positive", ring: "#22c55e", ringSoft: "#dcfce7", accent: "#22c55e" };
}

function ScoreRing({ score, label, t }: { score: number; label: string; t: (key: string) => string }) {
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
          <span className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-100">{normalizedScore}</span>
          <span className="pb-1 text-sm font-semibold text-slate-400 dark:text-slate-500">/100</span>
        </div>
        <div className="mt-2 rounded-full px-3 py-1 text-sm font-semibold"
          style={{ color: status.accent, backgroundColor: `${status.accent}14` }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ScoreStat({ label, value, accentClassName }: { label: string; value: string; accentClassName: string }) {
  return (
    <div className="rounded-[8px] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900 p-3 shadow-sm">
      <div className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${accentClassName}`}>{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{value}</div>
    </div>
  );
}

function RatingChangeStat({ ratingChange, t }: { ratingChange: number; t: (key: string) => string }) {
  const isPositive = ratingChange > 0;
  const isNeutral  = ratingChange === 0;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  const accentClassName = isNeutral
    ? "text-slate-500"
    : isPositive
    ? "text-emerald-700"
    : "text-rose-600";

  const valueColor = isNeutral
    ? "text-slate-950 dark:text-slate-100"
    : isPositive
    ? "text-emerald-700"
    : "text-rose-600";

  const formattedValue = isNeutral
    ? "—"
    : `${isPositive ? "+" : ""}${ratingChange.toFixed(2)} ★`;

  return (
    <div className="rounded-[8px] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900 p-3 shadow-sm">
      <div className={`font-semibold uppercase tracking-[0.12em] flex items-center gap-1 text-[11px] ${accentClassName}`}>
        <Icon className="h-3 w-3" />
        <span>{t("dashboard.keyTakeaways.overallScore.statRecentTrend")}</span>
      </div>
      <div className={`mt-1 text-lg font-bold ${valueColor}`}>{formattedValue}</div>
      <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
        {t("dashboard.keyTakeaways.overallScore.statRecentTrendHint")}
      </div>
    </div>
  );
}

function hasEnoughData(avgRating?: number, positivePct?: number, reviewCount?: number, reviews?: Review[]): boolean {
  if (!avgRating || !Number.isFinite(avgRating) || avgRating <= 0) return false;
  if (!Number.isFinite(positivePct)) return false;
  if (!reviewCount || reviewCount <= 0) return false;
  if (!reviews?.length) return false;
  return true;
}

export function ScoreGlobalSection({
  avgRating,
  positivePct,
  reviewCount,
  reviews,
}: Omit<ScoreGlobalSectionProps, 'ratingChange'>) {
  const { t } = useTranslation();
  const isDataAvailable = hasEnoughData(avgRating, positivePct, reviewCount, reviews);

  const ratingChange = useMemo(() => {
    if (!reviews?.length) return 0;

    const anchorDate = getLatestDate(reviews) ?? new Date();
    const start60    = subDays(anchorDate, 60);

    const current = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return d && isAfter(d, start60) && !isAfter(d, anchorDate);
    });
    const previous = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return d && isBefore(d, start60);
    });

    const currentAvg  = computeAverage(current);
    const previousAvg = computeAverage(previous);

    if (currentAvg === null || previousAvg === null) return 0;
    return currentAvg - previousAvg;
  }, [reviews]);

  const normalizedScore = useMemo(() => {
    if (!isDataAvailable) return 0;
    const ratingScore    = (avgRating / 5) * 100;
    const sentimentScore = positivePct;
    const trendScore     = Math.max(0, Math.min(100, 100 + ratingChange * 20));
    const volumeScore    = Math.min(100, reviewCount);
    return Math.round(clampScore(ratingScore * 0.4 + sentimentScore * 0.3 + trendScore * 0.2 + volumeScore * 0.1));
  }, [isDataAvailable, avgRating, positivePct, ratingChange, reviewCount]);

  const status = getScoreStatus(normalizedScore, t);
  const displaySentimentScore=positivePct/10;

  const scoreNarrative =
    status.tone === "critical" ? t("dashboard.keyTakeaways.overallScore.narrativeCritical") :
    status.tone === "warning"  ? t("dashboard.keyTakeaways.overallScore.narrativeWarning")  :
                                 t("dashboard.keyTakeaways.overallScore.narrativePositive");

  return (
    <div className="h-full self-start rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.5)]">

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: isDataAvailable ? `${status.accent}14` : '#f1f5f9' }}>
            <Sparkles className="h-4 w-4" style={{ color: isDataAvailable ? status.accent : '#94a3b8' }} />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.overallScore.overallScore")}
          </p>
        </div>
        {isDataAvailable && (
          <span className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: status.accent, backgroundColor: `${status.accent}14` }}>
            {status.label}
          </span>
        )}
      </div>

      {isDataAvailable ? (
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex justify-center">
            <ScoreRing score={normalizedScore} label={status.label} t={t} />
          </div>

          <div className="mx-auto max-w-xl text-center">
            <div className="mt-3 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Star className="h-4 w-4 text-amber-400 mt-0.5" />
              <span>{scoreNarrative}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScoreStat
              label={t("dashboard.keyTakeaways.overallScore.statRating")}
              value={avgRating?.toFixed(1)}
              accentClassName="text-[#fe53b3]"
            />
            <ScoreStat
              label={t("dashboard.keyTakeaways.overallScore.statPositive")}
              value={`${(displaySentimentScore)}/10`}
              accentClassName="text-[#b18cf4]"
            />
            <ScoreStat
              label={t("dashboard.keyTakeaways.overallScore.statReviews")}
              value={String(reviewCount)}
              accentClassName="text-[#2563eb]"
            />
            <RatingChangeStat ratingChange={ratingChange} t={t} />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-[8px] border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <AlertCircle className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("dashboard.keyTakeaways.overallScore.noData")}
          </p>
          <p className="max-w-[200px] text-xs text-slate-400 dark:text-slate-500">
            {t("dashboard.keyTakeaways.overallScore.noDataHint")}
          </p>
        </div>
      )}
    </div>
  );
}
