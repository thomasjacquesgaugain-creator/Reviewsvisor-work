import { CheckCircle2 } from "lucide-react";
import type { RecommendedActionSectionProps } from "./types";
import { useTranslation } from "react-i18next";

export function RecommendedActionSection({
  points,
  mainIssue
}: RecommendedActionSectionProps) {
  const { t } = useTranslation();  

  const recommendedPoint =
    points?.find(
      (point) =>
        point.issue?.toLowerCase().trim() === mainIssue?.toLowerCase().trim()
    ) ||
    [...(points || [])].sort((a, b) => b.impact - a.impact)[0] ||
    null;

  if (!recommendedPoint) {
    return (
      <div className="relative overflow-hidden rounded-[8px] border border-white/70 bg-gradient-to-br from-white via-[#fbfaff] to-[#f4fbff] p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(161,250,232,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(109,189,250,0.12),_transparent_28%)]" />

        <div className="relative flex min-h-[236px] flex-col">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#a1fae8]/70">
              <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t("dashboard.keyTakeaways.recommandedActions.title")}
            </p>
          </div>

          <div className="mt-3 h-px w-full bg-slate-200/70" />

          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              {t("dashboard.keyTakeaways.recommandedActions.noData")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-white/70 bg-gradient-to-br from-white via-[#fbfaff] to-[#f4fbff] p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(161,250,232,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(109,189,250,0.12),_transparent_28%)]" />

      <div className="relative flex min-h-[236px] flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#a1fae8]/70">
            <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("dashboard.keyTakeaways.recommandedActions.title")}
          </p>
        </div>

        <div className="mt-3 h-px w-full bg-slate-200/70" />

        <div className="mt-4 rounded-[8px] border border-slate-100 bg-white/70 p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9fbf6]">
                <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
              </span>

              <div>
                <p className="text-sm leading-6 text-slate-700">
                  {recommendedPoint.first_step}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {recommendedPoint.why_it_matters}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
