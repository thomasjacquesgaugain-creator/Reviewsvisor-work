import { cn } from "@/lib/utils";
import { type KeyTakeawaysPanelProps } from "./key-takeaways/types";
import { ScoreGlobalSection } from "./key-takeaways/ScoreGlobalSection";
import { MainProblemsSection } from "./key-takeaways/MainProblemsSection";
import { MainStrengthsSection } from "./key-takeaways/MainStrengthsSection";
import { RiskAlertSection } from "./key-takeaways/RiskAlertSection";
import { OverallTrendSection } from "./key-takeaways/OverallTrendSection";
import { ActionGainCard } from "./key-takeaways/PotentialGain";
import { useState } from "react";

export function KeyTakeawaysPanel({
  avgRating,
  positivePct,
  reviewCount,
  mainProblems,
  mainStrengths,
  reviews,
  recommendedActions,
  className,
  handleClick,
}: KeyTakeawaysPanelProps) {
  const [mainIssue, setMainIssue] = useState("");

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        className,
      )}
    >
      <div className="relative mx-auto flex w-full  flex-col gap-4">

        <ScoreGlobalSection
          reviewCount={reviewCount}
          avgRating={avgRating}
          positivePct={positivePct}
          reviews={reviews}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MainProblemsSection
            problems={mainProblems}
            setMainIssue={setMainIssue}
          />
          <MainStrengthsSection strengths={mainStrengths} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RiskAlertSection reviews={reviews} />
          <OverallTrendSection reviews={reviews} />
        </div>

        <ActionGainCard
          points={recommendedActions}
          mainIssue={mainIssue}
          reviews={reviews}
          handleClick={handleClick}
        />

      </div>
    </section>
  );
}
