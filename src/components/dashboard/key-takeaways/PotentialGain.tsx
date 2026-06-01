
import { ChevronRight, TrendingUp, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { RecommendedActionSectionProps, PotentialGainSectionProps, Review } from "./types";

const getNote = (review: Review): number => review?.note ?? review?.rating ?? 0;

const getNumberLocale = (language: string | undefined) =>
  language?.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";

const formatLocalizedNumber = (
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions = {},
) => new Intl.NumberFormat(locale, options).format(value);

const normalize = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const extractOriginalText = (
  text: string | { original?: string; text?: string } | null | undefined,
): string => {
  if (typeof text === "string") return text;
  if (typeof text === "object" && text !== null) {
    return text?.original || text?.text || "";
  }
  return "";
};


type ActionGainCardProps = RecommendedActionSectionProps &
  Pick<PotentialGainSectionProps, "reviews" | "handleClick">;


export function ActionGainCard({
  points,
  mainIssue,
  reviews = [],
  handleClick,
}: ActionGainCardProps) {
  const { t,i18n } = useTranslation();

  const locale = getNumberLocale(i18n.language);

  const recommendedPoint =
    points?.find(
      (p) => p.issue?.toLowerCase().trim() === mainIssue?.toLowerCase().trim(),
    ) ||
    [...(points || [])].sort((a, b) => b.impact - a.impact)[0] ||
    null;

  const potentialGain = useMemo(() => {
    if (!points?.length || !reviews.length) return null;

    const normalizedIssue = mainIssue.toLowerCase().trim();
    const selectedAction =
      points.find((a) => a.issue.toLowerCase().trim() === normalizedIssue) ??
      points.slice().sort((a, b) => b.impact - a.impact)[0];

    if (!selectedAction) return null;

    const neg = reviews.filter((r) => (getNote(r) ?? 0) <= 3);
    const totalNeg = Math.max(1, neg.length);
    const theoreticalMaxGain = neg.reduce(
      (sum, r) => sum + (3 - (getNote(r) ?? 1)) / reviews.length,
      0,
    );

    const issueWords = normalize(selectedAction.issue).split(/\s+/);
    const count = neg.filter((r) => {
      const txt = normalize(extractOriginalText(r?.text) || r?.texte || "");
      return issueWords.some((w) => w.length > 3 && txt.includes(w));
    }).length;

    const mentionWeight = count / totalNeg;
    const aiShare = selectedAction.impact / 100;
    const starDelta = Number(
      (theoreticalMaxGain * aiShare * Math.sqrt(mentionWeight + 0.1)).toFixed(3),
    );

    return Math.max(0.05, starDelta);
  }, [reviews, points, mainIssue]);

  if (!recommendedPoint) {
    return (
      <div className="rounded-[18px] border border-white/70 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
         <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#dffbf5]">
          <CircleCheck className="h-5 w-5 text-violet-600" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {t("dashboard.keyTakeaways.recommandedActions.title")}
        </p>
        </div>
        <div className="mt-4 rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
          {t("dashboard.keyTakeaways.recommandedActions.noData")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/70 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/40 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row">

        <div className="flex flex-1 flex-col justify-center gap-2 p-5">
         <div className="h-full  bg-white  dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#dffbf5]">
          <CircleCheck className="h-5 w-5 text-violet-600" />
        </span>
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {t("dashboard.keyTakeaways.recommandedActions.title")}
        </p>
      </div>

      <div className="mt-4 rounded-[16px]  bg-white px-4 py-4  dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-baseline gap-3">
          <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
          </span>

          <div className="min-w-0">
            <p className="text-[16px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {recommendedPoint?.first_step}
            </p>

            <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              {recommendedPoint?.why_it_matters}
            </p>
          </div>
        </div>
      </div>
    </div>
        </div>

        <div className="mx-0 my-0 hidden w-px self-stretch bg-slate-100 dark:bg-slate-800 sm:block" />
        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 sm:hidden" />

        <div className="flex shrink-0 flex-col items-center justify-center gap-3 p-5 sm:w-[300px] sm:pl-6 sm:pr-6">
          {potentialGain ? (
            <>
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <span className="text-[2.2rem] font-bold leading-none tracking-tight text-[#16a34a] dark:text-slate-50">
                    +{formatLocalizedNumber(potentialGain, locale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a9aae] mt-2">
                  {t("dashboard.keyTakeaways.potentialGain.label", {
                    defaultValue: "Gain estimé",
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClick}
                className="flex mt-6 w-full items-center justify-between gap-2 rounded-[12px] bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("dashboard.keyTakeaways.potentialGain.viewActionPlan")}
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400">
              {t("dashboard.keyTakeaways.potentialGain.noData", {
                defaultValue: "—",
              })}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
