import { BarChart2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from "recharts";
import { useMemo, useState } from "react";
import { parseISO, subDays, isAfter, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, endOfDay, endOfWeek, endOfMonth, format, startOfMonth } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { OverallTrendSectionProps, Review } from "./types";

type Granularity = "day" | "week" | "month";
const MIN_REVIEWS_FOR_TREND = 3;

const getNote = (r: Review): number => r.note || r.rating || 0;

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

const getDateStr = (r: Review): string =>
  r.published_at || r.create_time || r.inserted_at || r.created_at || r.date || "";

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

const getPeriods = (start: Date, end: Date, granularity: Granularity): Date[] => {
  switch (granularity) {
    case "day":
      return eachDayOfInterval({ start, end });
    case "week":
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    case "month":
    default:
      return eachMonthOfInterval({ start, end });
  }
};

const getPeriodEnd = (date: Date, granularity: Granularity): Date => {
  switch (granularity) {
    case "day":
      return endOfDay(date);
    case "week":
      return endOfWeek(date, { weekStartsOn: 1 });
    case "month":
    default:
      return endOfMonth(date);
  }
};

const formatPeriodLabel = (date: Date, granularity: Granularity, language: string | undefined): string => {
  const locale = getNumberLocale(language) === "fr-FR" ? fr : enUS;

  switch (granularity) {
    case "day":
      return format(date, "dd/MM", { locale });
    case "week":
      return `S${format(date, "w", { locale })}`;
    case "month":
    default:
      return format(date, "MMMM yyyy", { locale });
  }
};

export function OverallTrendSection({ reviews }: OverallTrendSectionProps) {
  const { t, i18n } = useTranslation();
  const locale = getNumberLocale(i18n.language);
  const [granularity, setGranularity] = useState<Granularity>("month");

  const anchorDate = useMemo(() => new Date(), []);

  const { summary, isPositive, isNegative, insufficientData } = useMemo(() => {
    if (!reviews?.length) {
      return { summary: "", isPositive: false, isNegative: false, insufficientData: false };
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

    if (
      currentValid.length < MIN_REVIEWS_FOR_TREND ||
      previousValid.length < MIN_REVIEWS_FOR_TREND
    ) {
      return {
        summary: t("dashboard.keyTakeaways.overallTrend.summaryInsufficientData"),
        isPositive: false,
        isNegative: false,
        insufficientData: true,
      };
    }

    const currentAvg = computeAverage(currentValid);
    const previousAvg = computeAverage(previousValid);

    if (currentAvg === null) {
      return { summary: "", isPositive: false, isNegative: false, insufficientData: false };
    }

    if (previousAvg === null) {
      return {
        summary: t("dashboard.keyTakeaways.overallTrend.summaryNoPrevious", {
          current: formatLocalizedNumber(currentAvg, locale, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }), count: currentValid.length,
        }),
        isPositive: false,
        isNegative: false,
        insufficientData: false,
      };
    }

    const diff = currentAvg - previousAvg;
    const sign = diff >= 0 ? "+" : "-";
    const summaryKey = diff > 0 ? "summaryUp" : diff < 0 ? "summaryDown" : "summaryFlat";

    return {
      summary: t(`dashboard.keyTakeaways.overallTrend.${summaryKey}`, {
        diff: `${sign}${formatLocalizedNumber(Math.abs(diff), locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}`,
      }),
      isPositive: diff > 0,
      isNegative: diff < 0,
      insufficientData: false,
    };
  }, [reviews, t,locale]);

  const chartData = useMemo(() => {
    if (!reviews?.length) return [];
    const cutoff = subDays(anchorDate, 60);
    const validReviews = reviews
      .map((r) => ({
        rating: getNote(r),
        dateStr: getDateStr(r),
      }))
      .filter((r) => r.rating >= 1 && r.rating <= 5 && r.dateStr);

    if (!validReviews.length) return [];

    const parsedReviews = validReviews
      .map((r) => ({
        rating: r.rating,
        date: parseISO(r.dateStr),
      }))
      .filter((r) => !isNaN(r.date.getTime()) && !isAfter(r.date, anchorDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!parsedReviews.length) return [];

    if (granularity === "month") {
      const start = startOfMonth(cutoff);
      const end = startOfMonth(anchorDate);
      const periods = eachMonthOfInterval({ start, end });

      return periods.map((period) => {
        const periodKey = format(period, "yyyy-MM");
        const reviewsInMonth = parsedReviews.filter((r) => format(r.date, "yyyy-MM") === periodKey);

        const avg = reviewsInMonth.length > 0
          ? reviewsInMonth.reduce((sum, r) => sum + r.rating, 0) / reviewsInMonth.length
          : null;

        return {
          label: formatPeriodLabel(period, granularity, i18n.language),
          note: avg === null ? 0 : Math.round(avg * 10) / 10,
          fullDate: format(period, "yyyy-MM-dd"),
        };
      });
    }

    const reviewsInWindow = parsedReviews.filter((r) => isAfter(r.date, cutoff));
    if (!reviewsInWindow.length) return [];

    const periods = getPeriods(cutoff, anchorDate, granularity);

    return periods
      .map((period) => {
        const periodEnd = getPeriodEnd(period, granularity);
        const reviewsInPeriod = reviewsInWindow.filter((r) => {
          return (r.date.getTime() >= period.getTime()) && (r.date.getTime() <= periodEnd.getTime());
        });

        const avg = reviewsInPeriod.length > 0
          ? reviewsInPeriod.reduce((sum, r) => sum + r.rating, 0) / reviewsInPeriod.length
          : null;

        return {
          label: formatPeriodLabel(period, granularity, i18n.language),
          note: avg === null ? 0 : Math.round(avg * 10) / 10,
          fullDate: format(period, "yyyy-MM-dd"),
        };
      })
      ;
  }, [reviews, anchorDate, granularity, i18n.language]);

  const xAngle = granularity === "day" ? -45 : 0;
  const xAnchor = granularity === "day" ? "end" : "middle";
  const xHeight = granularity === "day" ? 60 : 34;

  const SummaryIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const summaryBg = isPositive
    ? "bg-emerald-50 text-emerald-700"
    : isNegative
    ? "bg-red-50 text-red-600"
    : "bg-slate-100 text-slate-600";
  const summaryIconColor = isPositive
    ? "text-emerald-500"
    : isNegative
    ? "text-red-500"
    : "text-slate-400";

  if (!reviews?.length) {
    return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
              <BarChart2 className="h-4 w-4 text-[#2563eb]" />
            </span>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("dashboard.keyTakeaways.overallTrend.title")}
            </p>
          </div>
          <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">
            {t("dashboard.keyTakeaways.overallTrend.recentTrend", "60 derniers jours")}
          </span>
        </div>
        <div className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />
        <div className="mt-4 flex h-40 items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
          {t("analysis.history.noData", "No data available")}
        </div>
      </div>
    );
  }

  return (
<div className="h-full rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
            <BarChart2 className="h-4 w-4 text-[#2563eb]" />
          </span>
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {t("dashboard.keyTakeaways.overallTrend.title")}
          </p>
        </div>
        <span className="text-[12px] font-medium text-[#6b6b80] dark:text-slate-500">
          {t("dashboard.keyTakeaways.overallTrend.recentTrend", "60 derniers jours")}
        </span>
      </div>

      <div className="mt-3 h-px bg-slate-100 dark:bg-slate-800" />

      {summary && (
        <div className={`mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium leading-5 ${summaryBg}`}>
          <SummaryIcon className={`h-4 w-4 shrink-0 ${summaryIconColor}`} />
          <span>{summary}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <TrendingUp className="h-4 w-4 text-[#2563eb]" />
          {t("analysis.history.averageRatingTitle")}
        </div>
        <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
<SelectTrigger className="h-8 w-28 rounded-[10px] border-slate-200 bg-white/90 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
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
          <div className="mt-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 12, left: 24, bottom: xHeight }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  angle={xAngle}
                  textAnchor={xAnchor}
                  height={xHeight}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={30}
                  axisLine={false}
                  tickLine={false}
                >
                  <Label
                    value={t("analysis.history.averageRatingLabel", "Rating")}
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: "middle", fill: "#94a3b8", fontSize: 11 }}
                  />
                </YAxis>
                <Tooltip
                  content={({ active, payload, label: lbl }) => {
                    if (insufficientData || !active || !payload?.length) return null;
                    const val = payload[0]?.value as number | undefined;
                    return (
                      <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-xs font-semibold text-slate-500">{lbl}</p>
                        <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
                          {typeof val === "number"
                            ? formatLocalizedNumber(val, locale, {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                            : "-"}{" "}
                          / 5                        </p>
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
                  dot={{ fill: "#fff", stroke: "#3b82f6", strokeWidth: 2, r: 3.5 }}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
            {t("analysis.history.xAxisLabel", "Period")}
          </p>
        </>
      ) : (
        <div className="mt-3 flex h-40 items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900/60">
          {t("analysis.history.noData", "No data available")}
        </div>
      )}

    </div>
  );
}
