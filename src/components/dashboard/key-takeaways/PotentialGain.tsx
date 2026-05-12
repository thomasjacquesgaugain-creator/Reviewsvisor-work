import { ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { PotentialGainSectionProps, Review } from "./types";

const getNote = (review: Review): number => review?.note ?? review?.rating ?? 0;
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

export function PotentialGainSection({
  reviews = [],
  recommendedActions = [],
  mainIssue = "",
  handleClick
}: PotentialGainSectionProps) {
  const { t } = useTranslation();

  const potentialGain = useMemo(() => {
    const aiPainPoints = recommendedActions ?? [];
    if (!aiPainPoints.length) return null;

    const normalizedIssue = mainIssue.toLowerCase().trim();
    const selectedAction =
      aiPainPoints.find(
        (action) => action.issue.toLowerCase().trim() === normalizedIssue,
      ) ?? aiPainPoints.slice().sort((a, b) => b.impact - a.impact)[0];

    if (!selectedAction) return null;

    const neg = reviews.filter((r) => (getNote(r) ?? 0) <= 3);
    const totalNeg = Math.max(1, neg.length);
    const theoreticalMaxGain = neg.reduce((sum, r) => {
      return sum + (3 - (getNote(r) ?? 1)) / reviews.length;
    }, 0);

    const issueWords = normalize(selectedAction.issue).split(/\s+/);
    const count = neg.filter((r) => {
      const txt = normalize(extractOriginalText(r?.text) || r?.texte || "");
      return issueWords.some((w) => w.length > 3 && txt.includes(w));
    }).length;

    const mentionWeight = count / totalNeg;
    const aiShare = selectedAction.impact / 100;
    const starDelta = Number(
      (theoreticalMaxGain * aiShare * Math.sqrt(mentionWeight + 0.1)).toFixed(3)
    );

    return Math.max(0.05, starDelta);
  }, [reviews, recommendedActions, mainIssue]);

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className="relative flex min-h-[236px] flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#e9fbf6]">
            <Sparkles className="h-4 w-4 text-[#2563eb]" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("dashboard.keyTakeaways.potentialGain.title", {
              defaultValue: "Potential Gain",
            })}
          </p>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70" />

          {potentialGain ? (
            <>
        <div className="mt-4 rounded-[8px] border border-slate-100 bg-white/70 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6]">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </span>

              <div className="min-w-0">
                <div className="text-[26px] font-semibold leading-none tracking-tight text-slate-900">
                  +{potentialGain.toFixed(2)}
                </div>
                <div className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#2563eb]">
                  {t("dashboard.keyTakeaways.potentialGain.label", {
                    defaultValue: "Estimated lift",
                  })}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {t("dashboard.keyTakeaways.potentialGain.estimatedGain", {
                    gain: potentialGain.toFixed(2),
                    defaultValue: `+${potentialGain.toFixed(2)} estimated if action applied.`,
                  })}
                </div>
              </div>
            </div>
              <button
              type="button"
               onClick={handleClick}
              className="flex w-full mt-4 items-center justify-between gap-2 rounded-[8px] bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
              {t("dashboard.keyTakeaways.potentialGain.viewActionPlan")}
              <ChevronRight className="h-4 w-4" />
            </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              {t("dashboard.keyTakeaways.potentialGain.noData", {
                defaultValue: "No data available",
              })}
            </div>
          )}

      </div>
    </div>
  );
}
