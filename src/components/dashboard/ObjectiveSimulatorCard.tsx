import { Dispatch, SetStateAction, useMemo } from "react";
import { Gauge, Info, Star, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trans } from "react-i18next";

type SmartSimulatorData = {
  currentRating: number;
  startRating: number;
  target: number;
  totalReviews: number;
  yourPace: number;
  fiveStarReviewsNeeded: number;
  requiredPace: number;
  feasibility: number;
  operationalLow: number;
  operationalHigh: number;
  themes: string[];
  combinedReviews: number;
};

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

type Props = {
  t: (key: string, opts?: Record<string, unknown>) => string;
  language: string;
  targetRating: number;
  simulatorTimeframe: 3 | 6 | 12;
  setSimulatorTimeframe: Dispatch<SetStateAction<3 | 6 | 12>>;
  startRatingText: string;
  startDateText: string;
  targetDateText: string;
  smartSimulator: SmartSimulatorData;
  simulatorTargetRating: number;
  setSimulatorTargetRating: Dispatch<SetStateAction<number>>;
};

const TIMEFRAMES = [3, 6, 12] as const;

export function ObjectiveSimulatorCard({
  t,
  language,
  targetRating,
  simulatorTimeframe,
  setSimulatorTimeframe,
  startRatingText,
  startDateText,
  targetDateText,
  smartSimulator,
  simulatorTargetRating,
  setSimulatorTargetRating
}: Props) {
  const monthsLabel = language.startsWith("fr") ? "mois" : "months";
  const numberLocale = getNumberLocale(language);
  const hasReviews = smartSimulator.totalReviews > 0;

  const formatRating = (value: number) =>
    formatLocalizedNumber(value, numberLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const formatCount = (value: number) =>
    formatLocalizedNumber(value, numberLocale, { maximumFractionDigits: 0 });

  const formatRate = (value: number) =>
    formatLocalizedNumber(value, numberLocale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const ratingProgressPct = useMemo(() => {
    const effectiveStartRating =
      smartSimulator.startRating ?? smartSimulator.currentRating;

    if (effectiveStartRating >= targetRating) return 100;

    const denom = Math.max(0.01, targetRating - effectiveStartRating);
    const pct =
      ((smartSimulator.currentRating - effectiveStartRating) / denom) * 100;

    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [
    smartSimulator.currentRating,
    smartSimulator.startRating,
    targetRating,
  ]);
  const feasibilityLabel =
    smartSimulator.feasibility <= 0.8
      ? t("objective.realistic")
      : smartSimulator.feasibility <= 1.2
        ? t("objective.achievable")
        : t("objective.ambitious");

  const getDifficultyBadge = (label: string) => {
    switch (label) {
      case t("objective.simulator.achievable"):
        return {
          className:
            "border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
          dot: "bg-emerald-500",
        };

      case t("objective.simulator.realistic"):
        return {
          className:
            "border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
          dot: "bg-emerald-500",
        };

      case t("objective.simulator.ambitious"):
        return {
          className:
            "border-0 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
          dot: "bg-amber-500",
        };

      case t("objective.simulator.hard", { defaultValue: "Hard" }):
        return {
          className:
            "border-0 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300",
          dot: "bg-red-500",
        };

      default:
        return {
          className:
            "border-0 bg-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200",
          dot: "bg-slate-500",
        };
    }
  };

  const volumeLabel =
    smartSimulator.requiredPace <= 3
      ? t("objective.simulator.achievable")
      : smartSimulator.requiredPace <= 7
        ? t("objective.simulator.ambitious")
        : smartSimulator.requiredPace <= 10
          ? t("objective.simulator.hard", { defaultValue: "Hard" })
          : t("objective.simulator.veryHard", { defaultValue: "Very Hard" });

  const volumeBadge = getDifficultyBadge(volumeLabel);

  const recommendationLabel =
    smartSimulator.requiredPace <= 7
      ? t("objective.simulator.realistic")
      : smartSimulator.requiredPace <= 10
        ? t("objective.simulator.ambitious")
        : smartSimulator.requiredPace <= 15
          ? t("objective.simulator.hard", { defaultValue: "Hard" })
          : t("objective.simulator.veryHard", { defaultValue: "Very Hard" });

  const recommendationBadge = getDifficultyBadge(recommendationLabel);

  return (
    <Card className="mb-8 rounded-[28px] overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="pb-0 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex gap-4 items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-[22px] font-semibold text-slate-900 dark:text-slate-100">
                {t("objective.simulator.googleRating")}
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("objective.simulator.googleRatingDesc")}
              </p>
            </div>
          </div>

          <Badge
            className="inline-flex items-center gap-2 rounded-full border-0 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 shadow-none hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {t("objective.ambitious")}
          </Badge>
        </div>
      </CardHeader>

      {!hasReviews ? (
        <CardContent className="px-6 pb-6 pt-4 sm:px-7">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {t("objective.simulator.noReviewsFound", {
                defaultValue: "No reviews found",
              })}
            </p>
            <p className="mt-1">
              {t("objective.simulator.addReviewsPrompt", {
                defaultValue: "Please add reviews to unlock the simulator.",
              })}
            </p>
          </div>
        </CardContent>
      ) : (
      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              label: t("objective.simulator.start", { defaultValue: "Start" }),
              value: smartSimulator.startRating,
              displayText: startRatingText,
              tint:
                "text-slate-800 border-violet-100 dark:bg-violet-950/25 dark:text-violet-200 dark:border-violet-900/50",
            },
            {
              label: t("objective.simulator.current", { defaultValue: "Current" }),
              value: smartSimulator?.currentRating,
              tint:
                "bg-[#ede9fe] text-indigo-700 border-indigo-100 dark:bg-indigo-950/25 dark:text-indigo-200 dark:border-indigo-900/50",
            },
            {
              label: t("objective.simulator.target"),
              value: targetRating,
              tint:
                "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-200 dark:border-emerald-900/50",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-[10px] border px-3 py-2 text-center ${item.tint}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                {item.label}
              </p>
              <p className="text-[30px] font-bold leading-none">
                {"displayText" in item ? (
                  item.displayText === t("objective.simulator.notAvailable", { defaultValue: "Not available" }) ? (
                    <span className="text-[18px] font-semibold leading-none text-slate-500 dark:text-slate-400">
                      {item.displayText}
                    </span>
                  ) : (
                    <>
                      <span className="font-bold leading-none text-slate-900 dark:text-slate-100">
                        {formatRating(Number(item.displayText))}
                      </span>
                      <span className="text-sm font-medium opacity-70">/5</span>
                    </>
                  )
                ) : (
                  <>
                    {formatRating(Number(item?.value ?? 0))}
                    <span className="text-sm font-medium opacity-70">/5</span>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#22c55e] transition-all duration-500"
              style={{ width: `${ratingProgressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>
              {t("objective.simulator.startDate", { defaultValue: "Start" })} · {startDateText}
            </span>
            <span>
              {t("dashboard.progressPercentage")} {formatCount(ratingProgressPct)}%
            </span>
            <span>
              {t("objective.simulator.targetDate")} · {targetDateText}
            </span>
          </div>

        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <Gauge className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("objective.simulator.title", {
                      defaultValue: "Smart simulator",
                    })}
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("objective.calculationHelp", {
                          defaultValue: "How is this calculated?",
                        })}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      sideOffset={10}
                      className="w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <div className="px-5 py-5">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-indigo-600" />
                          <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                            {t("objective.simulator.calculationHelp", {
                              defaultValue: "How is this calculated?",
                            })}
                          </p>
                        </div>

                        <h4 className="mt-4 text-[13px] font-bold text-slate-900 dark:text-slate-100">
                          {t("objective.simulator.description", {
                            defaultValue: "Description",
                          })}
                        </h4>

                        <p className="mt-2 text-[12px] font-bold leading-6 text-slate-600 dark:text-slate-300">
                          {t("objective.simulator.calculationHelpDescription", {
                            defaultValue:
                              "The calculation is personalized: it starts from your current rating, your total number of reviews ({{reviews}}) and your real pace ({{pace}} reviews over 30 days). It compares three paths — volume only, operational improvement, and a recommended mix.",
                            reviews: smartSimulator.totalReviews,
                            pace: Math.round(smartSimulator.yourPace),
                          })}
                        </p>

                        <h4 className="mt-5 text-[13px] font-bold text-slate-900 dark:text-slate-100">
                          {t("objective.simulator.formula", {
                            defaultValue: "Formula",
                          })}
                        </h4>

                        <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-2 text-slate-900 dark:text-slate-200">
                            {t("objective.simulator.calculationFormula", {
                              defaultValue: `5★ reviews needed = current reviews ×
                                (target − current) ÷ (5 − target)

                                Required pace = reviews needed ÷
                                timeframe

                                Feasibility = required pace ÷ your pace
                                ({{pace}}/month)`,
                              pace: Math.round(smartSimulator.yourPace),
                            })}
                          </pre>
                        </div>

                        <p className="mt-4 text-[12px] leading-6 font-bold text-slate-600 dark:text-slate-300">
                          {t("objective.simulator.calculationHelpNote", {
                            defaultValue:
                              "The impact of operational improvement is given as a range, not an exact per-theme value: the data isn't yet sufficient to be more precise without being misleading.",
                          })}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("objective.simulator.titleDesc", {
                    defaultValue:
                      "How many reviews do you need to reach your target, at your real pace?",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("dashboard.targetRating")}
                  </p>
                </div>
                <span className="text-xl font-bold text-violet-700 dark:text-violet-300">
                  {formatRating(simulatorTargetRating)}
                </span>
              </div>
              <input
                type="range"
                min={Number(Math.min(5, Math.ceil(smartSimulator.currentRating * 10 + 1) / 10).toFixed(1))}
                max={5}
                step={0.1}
                value={simulatorTargetRating}
                onChange={(e) => setSimulatorTargetRating(parseFloat(e.target.value))}
                className={`rv-slider "cursor-pointer"}`}
                style={{
                  cursor:"pointer",
                  ["--pct" as any]: `${(() => {
                    const min = Number(
                      Math.min(5, Math.ceil(smartSimulator.currentRating * 10 + 1) / 10).toFixed(1),
                    );
                    const max = 5;
                    const value = Number(simulatorTargetRating);

                    return ((value - min) / (max - min)) * 100;
                  })()}%`,
                }}
              />
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t("objective.simulator.timeframe", { defaultValue: "Timeframe" })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TIMEFRAMES.map((monthCount) => {
                  const active = simulatorTimeframe === monthCount;
                  return (
                    <button
                      key={monthCount}
                      type="button"
                      onClick={() => setSimulatorTimeframe(monthCount)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${active
                        ? "border-violet-300 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        }`}
                    >
                      {t(`objective.timeframeOptions.${monthCount}`, {
                        defaultValue: `${monthCount} ${monthsLabel}`,
                      })}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
            {t("objective.simulator.toReachTargetPrefix", {
              defaultValue: "To reach",
            })}{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatRating(Number(simulatorTargetRating))}
            </span>{" "}
            {t("objective.simulator.toReachTargetWithin", {
              defaultValue: "within",
            })}{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {t(`objective.simulator.timeframeOptions.${simulatorTimeframe}`, {
                defaultValue: `${simulatorTimeframe} ${monthsLabel}`,
              })}
            </span>
            {", "}
            {t("objective.simulator.threePaths", {
              defaultValue: "three paths:",
            })}
          </p>
          <div className="mt-4 grid gap-2">
            <div className="rounded-[12px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {t("objective.simulator.pathVolumeOnly", {
                      defaultValue: "Path 1 · Volume only",
                    })}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {t("objective.simulator.approxReviews", {
                      defaultValue: "≈ {{count}} 5★ reviews",
                      count: Math.max(0, Math.round(smartSimulator.fiveStarReviewsNeeded)),
                    })}
                    <span className="mt-1 ml-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("objective.simulator.reviewsPerMonth", {
                        defaultValue: "≈ {{count}} / month",
                        count: Math.round(smartSimulator.requiredPace),
                      })}
                    </span>
                  </p>
                </div>
                <Badge
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold shadow-none ${volumeBadge.className}`}
                >
                  <span className={`h-2 w-2 rounded-full ${volumeBadge.dot}`} />
                  {volumeLabel}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t("objective.simulator.volumeOnlyNote", {
                  defaultValue:
                    "Only by generating new 5★ reviews at your current pace.",
                })}
              </p>
            </div>

            <div className="rounded-[12px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {t("objective.simulator.pathOperational", {
                      defaultValue: "Path 2 · Operational improvement",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    <Trans
                      i18nKey={
                        smartSimulator.themes.length > 0
                          ? "objective.simulator.reduceNegativesAbout"
                          : "objective.simulator.reduceNegativesFallback"
                      }
                      values={{
                        themes: smartSimulator.themes.join(", "),
                      }}
                      components={{
                        bold: (
                          <span className="font-semibold text-slate-900 dark:text-slate-100" />
                        ),
                        muted: (
                          <span className="text-slate-500 dark:text-slate-400" />
                        ),
                      }}
                    />
                  </p>
                </div>
                <Badge
                  className="inline-flex items-center gap-2 rounded-full border-0 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 shadow-none hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {t("objective.impactValues.medium")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                <Trans
                  i18nKey="objective.simulator.operationalGainRange"
                  values={{
                    low: formatLocalizedNumber(smartSimulator.operationalLow, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    high: formatLocalizedNumber(smartSimulator.operationalHigh, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                  }}
                  components={{
                    gain: (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400" />
                    ),
                  }}
                />
              </p>
            </div>
            <div className="rounded-[12px] border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                      {t("objective.simulator.recommendedPath")}
                    </p>
                  </div>

                  <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t("objective.simulator.approxReviews", {
                      count: formatCount(smartSimulator.combinedReviews),
                      defaultValue: "≈ {{count}} 5★ reviews",
                    })}
                  </p>
                </div>
                <Badge
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold shadow-none ${recommendationBadge.className}`}
                >
                  <span className={`h-2 w-2 rounded-full ${recommendationBadge.dot}`} />
                  {recommendationLabel}
                </Badge>
              </div>
              <p className="mt-0 text-sm leading-7 text-slate-800/80 dark:text-slate-200/80">
                <Trans
                  i18nKey="objective.simulator.recommendedPathNote"
                  components={{
                    strong: <span className="font-semibold text-slate-900 dark:text-slate-200/80" />,
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
