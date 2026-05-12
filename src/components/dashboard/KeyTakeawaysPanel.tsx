import logoHeader from "@/assets/reviewsvisor-logo-header.png";
import { cn } from "@/lib/utils";
import {
  type KeyTakeawaysPanelProps,
} from "./key-takeaways/types";
import { ScoreGlobalSection } from "./key-takeaways/ScoreGlobalSection";
import { MainProblemsSection } from "./key-takeaways/MainProblemsSection";
import { MainStrengthsSection } from "./key-takeaways/MainStrengthsSection";
import { RiskAlertSection } from "./key-takeaways/RiskAlertSection";
import { OverallTrendSection } from "./key-takeaways/OverallTrendSection";
import { RecommendedActionSection } from "./key-takeaways/RecommendedActionSection";
import { useState } from "react";
import { PotentialGainSection } from "./key-takeaways/PotentialGain";
import { useTranslation } from "react-i18next";

export function KeyTakeawaysPanel({
  avgRating,
  positivePct,
  reviewCount,
  mainProblems,
  mainStrengths,
  reviews,
  recommendedActions,
  className,
  handleClick
}: KeyTakeawaysPanelProps) {

  const [mainIssue, setMainIssue] = useState("");
  const {t}=useTranslation();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[8px]",
        className,
      )}
    >
      <div className="absolute inset-0" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* <div className="flex items-center gap-3"> */}
            {/* <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white shadow-[0_12px_28px_rgba(37,99,235,0.12)]">
              <img
                src={logoHeader}
                alt="Reviewsvisor"
                className="h-8 w-8 object-contain"
              />
            </div> */}
            <div className="p-4 px-5 rounded-lg bg-white w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t("dashboard.keyTakeaways.title")}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                {t("dashboard.keyTakeaways.quickRead")}
              </h2>
            </div>
          {/* </div> */}
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.65fr_1.2fr] items-stretch">
          <ScoreGlobalSection
            reviewCount={reviewCount}
            avgRating={avgRating}
            positivePct={positivePct}
            reviews={reviews}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <MainProblemsSection problems={mainProblems} setMainIssue={setMainIssue} />
              <RiskAlertSection reviews={reviews}
              />
            </div>
            <div className="flex flex-col gap-4">
              <MainStrengthsSection strengths={mainStrengths} />
              <OverallTrendSection reviews={reviews}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <RecommendedActionSection points={recommendedActions} mainIssue={mainIssue} />
          <PotentialGainSection
            reviews={reviews}
            recommendedActions={recommendedActions}
            mainIssue={mainIssue}
            handleClick={handleClick}
          />
        </div>
      </div>
    </section>
  );
}
