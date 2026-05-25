import { Lightbulb, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from "recharts";
import { useMemo, useState } from "react";
import { parseISO, subDays, isAfter } from "date-fns";
import { getRatingEvolution, Granularity as RatingGranularity } from "@/utils/ratingEvolution";
import { useTranslation } from "react-i18next";
import type { OverallTrendSectionProps, Review } from "./types";

type Granularity = 'day' | 'week' | 'month';
const MIN_REVIEWS_FOR_TREND = 3;

const mapGranularity = (g: Granularity): RatingGranularity =>
  ({ day: 'jour', week: 'semaine', month: 'mois' }[g] as RatingGranularity) ?? 'mois';

const getNote = (r: Review): number => r.note || r.rating || 0;

const getDateStr = (r: Review): string =>
  r.published_at || r.inserted_at || r.created_at || r.date || '';

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

const getLatestDate = (reviews: Review[]): Date | null =>
  reviews.reduce<Date | null>((latest, r) => {
    const d = parseReviewDate(r);
    return d && (!latest || d > latest) ? d : latest;
  }, null);

export function OverallTrendSection({ reviews }: OverallTrendSectionProps) {
  const { t, i18n } = useTranslation();
  const [granularity, setGranularity] = useState<Granularity>('month');

  const anchorDate = useMemo(() =>
    (!reviews?.length ? null : getLatestDate(reviews)) ?? new Date(),
  [reviews]);

  const { change, summary, isPositive, isNegative, insufficientData } = useMemo(() => {
    if (!reviews?.length) {
      return {
        change: "N/A",
        summary: "",
        isPositive: false,
        isNegative: false,
        insufficientData: false,
      };
    }

    const today = new Date();
    const last60Start = subDays(today, 60);
    const prior60Start = subDays(today, 120);

    const current = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return d && d >= last60Start && d <= today;
    });

    const previous = reviews.filter((r) => {
      const d = parseReviewDate(r);
      return d && d >= prior60Start && d < last60Start;
    });

    const currentValid = getValidRatedReviews(current);
    const previousValid = getValidRatedReviews(previous);

    const currentAvg = computeAverage(currentValid);
    const previousAvg = computeAverage(previousValid);

    if (
      currentValid.length < MIN_REVIEWS_FOR_TREND ||
      previousValid.length < MIN_REVIEWS_FOR_TREND
    ) {
      return {
        change: "N/A",
        summary: t("dashboard.keyTakeaways.overallTrend.summaryInsufficientData"),
        isPositive: false,
        isNegative: false,
        insufficientData: true,
      };
    }
    if (currentAvg === null) {
      return {
        change: "N/A",
        summary: "",
        isPositive: false,
        isNegative: false,
        insufficientData: false,
      };
    }

    if (
      previousAvg === null
    ) {
      return {
        change: t("dashboard.keyTakeaways.overallTrend.changeAvg", {
          avg: currentAvg.toFixed(1),
        }),
        summary: t("dashboard.keyTakeaways.overallTrend.summaryNoPrevious", {
          current: currentAvg.toFixed(1),
          count: currentValid.length,
        }),
        isPositive: false,
        isNegative: false,
        insufficientData: false,
      };
    }

    const diff = currentAvg - previousAvg;
    const sign = diff >= 0 ? "+" : "-";
    const summaryKey =
      diff > 0 ? "summaryUp" : diff < 0 ? "summaryDown" : "summaryFlat";

    return {
      change: `${diff >= 0 ? "↑" : "↓"} ${Math.abs(diff).toFixed(1)} pts`,
      summary: t(`dashboard.keyTakeaways.overallTrend.${summaryKey}`, {
        diff: `${sign}${Math.abs(diff).toFixed(1)}`,
      }),
      isPositive: diff > 0,
      isNegative: diff < 0,
      insufficientData: false,
    };
  }, [reviews, t]);

  const chartData = useMemo(() => {
    if (!reviews?.length) return [];
    const cutoff = subDays(anchorDate, 60);

    const filtered = reviews
      .filter(r => {
        const n = getNote(r);
        const s = getDateStr(r);
        if (!s || n < 1 || n > 5) return false;
        try { const d = parseISO(s); return isAfter(d, cutoff) && !isAfter(d, anchorDate); }
        catch { return false; }
      })
      .map(r => ({
        rating: getNote(r),
        published_at: getDateStr(r),
        inserted_at: r.inserted_at || r.created_at || r.date || '',
      }));

    if (!filtered.length) return [];

    return getRatingEvolution(filtered, cutoff, mapGranularity(granularity), i18n.language || 'fr')
      .filter(p => { try { return !isAfter(parseISO(p.fullDate), anchorDate); } catch { return true; } })
      .map(p => ({ label: p.mois, note: p.note, fullDate: p.fullDate }));
  }, [reviews, anchorDate, granularity, i18n.language]);

  const badgeClass = isPositive
    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
    : isNegative
    ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300"
    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";

  const xAngle      = granularity === 'day' ? -45 : 0;
  const xAnchor     = granularity === 'day' ? 'end' : 'middle';
  const xHeight     = granularity === 'day' ? 60 : 34;

  return (
    <div className="flex-1 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#e9fbf6]">
          <Lightbulb className="h-4 w-4 text-[#2563eb]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.overallTrend.title")}
          </p>
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">
            {t("dashboard.keyTakeaways.overallTrend.recentTrend")}
          </h3>
        </div>
      </div>

      {summary && (
        <p className={`mt-2 rounded-[8px] px-3 py-2 text-sm leading-5 ${badgeClass}`}>
          {summary}
        </p>
      )}

      <div className="mt-2 h-px bg-slate-200/70 dark:bg-slate-700/70" />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <TrendingUp className="h-4 w-4 text-[#2563eb]" />
          {t("analysis.history.averageRatingTitle")}
        </div>
        <Select value={granularity} onValueChange={v => setGranularity(v as Granularity)}>
          <SelectTrigger className="h-8 w-28 rounded-[8px] border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{t("analysis.history.byMonth")}</SelectItem>
            <SelectItem value="week">{t("analysis.history.byWeek")}</SelectItem>
            <SelectItem value="day">{t("analysis.history.byDay")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {chartData.length > 0 || insufficientData ? (
        <>
          <div className="mt-2" style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 32, bottom: xHeight }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  angle={xAngle}
                  textAnchor={xAnchor}
                  height={xHeight}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                >
                  <Label
                    value={t("analysis.history.averageRatingLabel", "Rating")}
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 }}
                  />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label: lbl }) => {
                    if (insufficientData) return null;
                    if (!active || !payload?.length) return null;
                    const val = payload[0]?.value as number | undefined;
                    return (
                      <div className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{lbl}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                          {typeof val === "number" ? val.toFixed(1) : "-"} / 5
                        </p>
                      </div>
                    );
                  }}
                />
                {!insufficientData && (
                  <Line
                    type="monotone"
                    dataKey="note"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 3.5 }}
                    activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-0.5 text-center text-xs text-slate-400 dark:text-slate-500">
            {t("analysis.history.xAxisLabel", "Period")}
          </p>
        </>
      ) : (
        <div className="mt-3 flex h-52 items-center justify-center rounded-[8px] bg-white/70 dark:bg-slate-900 text-sm text-slate-400 dark:text-slate-500">
          {t("analysis.history.noData", "No data available")}
        </div>
      )}
    </div>
  );
}
