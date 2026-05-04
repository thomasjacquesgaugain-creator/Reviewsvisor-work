import React, { useState } from "react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

export type IshikawaKey =
  | "manpower"
  | "method"
  | "machine"
  | "material"
  | "measurement";

export type IshikawaScores = Record<IshikawaKey, number | null>;

export const ISHIKAWA_CATEGORY_MAP: Record<IshikawaKey, string> = {
  manpower:    "Main-d'œuvre",
  method:      "Méthodes",
  machine:     "Outils & systèmes",
  material:    "Produit / Service",
  measurement: "Environnement",
};

export const EFFORT_BY_5M: Record<IshikawaKey, "Low" | "Medium" | "High"> = {
  manpower:    "Medium",
  method:      "Low",
  machine:     "High",
  material:    "High",
  measurement: "Low",
};

export interface QuestionnaireResult {
  paretoIssue: string;
  scores: IshikawaScores;
  dominantCategory: string;
  dominantEffort: "Low" | "Medium" | "High";
  confirmedCategories: {
    key: IshikawaKey;
    categoryName: string;
    score: number;
    effort: "Low" | "Medium" | "High";
    label: string;
  }[];
  isComplete: boolean;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const OPTIONS = [
  { label: "No",          value: 0, icon: "" },
  { label: "Unlikely",    value: 1, icon: "" },
  { label: "Uncertain",   value: 2, icon: "" },
  { label: "Likely",      value: 3, icon: "" },
  { label: "Very likely", value: 4, icon: "" },
];

const SCORE_LABELS: Record<number, string> = {
  0: "No",
  1: "Unlikely",
  2: "Uncertain",
  3: "Likely",
  4: "Very likely",
};

const SECTIONS: { key: IshikawaKey; title: string; subtitle: string }[] = [
  {
    key: "manpower",
    title: "Manpower (People)",
    subtitle: "Is the issue related to staff skills or training?",
  },
  {
    key: "method",
    title: "Method (Processes)",
    subtitle:
      "Is the issue related to the way tasks are performed or to a lack of clear procedures?",
  },
  {
    key: "machine",
    title: "Machine (Equipment & Tools)",
    subtitle: "Is the issue related to tools, equipment, or software used?",
  },
  {
    key: "material",
    title: "Material (Products)",
    subtitle: "Is the issue related to the quality of the products used?",
  },
  {
    key: "measurement",
    title: "Measurement (Environment & Context)",
    subtitle:
      "Is the issue related to the environment or external conditions?",
  },
];

/* ─────────────────────────────────────────────
   HELPER — build result from scores
───────────────────────────────────────────── */

export function buildQuestionnaireResult(
  paretoIssue: string,
  scores: IshikawaScores
): QuestionnaireResult {
  const confirmedCategories = (
    Object.entries(scores) as [IshikawaKey, number | null][]
  )
    .filter(([, score]) => score !== null && score > 0)
    .map(([key, score]) => ({
      key,
      categoryName: ISHIKAWA_CATEGORY_MAP[key],
      score: score as number,
      effort: EFFORT_BY_5M[key],
      label: SCORE_LABELS[score as number],
    }))
    .sort((a, b) => b.score - a.score);

  const dominant = confirmedCategories[0];

  return {
    paretoIssue,
    scores,
    dominantCategory: dominant?.categoryName ?? "Méthodes",
    dominantEffort:   dominant?.effort       ?? "Low",
    confirmedCategories,
    isComplete: Object.values(scores).every((s) => s !== null),
  };
}


const Section = ({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: number | null;
  onChange: (val: number) => void;
}) => (
  <div className="border-b border-gray-300 p-3">
    <div className="font-semibold">{title}</div>
    <div className="mb-2 text-sm text-gray-700">{subtitle}</div>

    <div className="flex justify-between gap-3 border rounded-full px-3 py-2 w-full">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition
              ${selected
                ? "bg-blue-100 border border-blue-400"
                : "hover:bg-gray-100"
              }`}
          >
            <span>{opt.icon}</span>
            <span className="text-sm">{opt.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);



type Props = {
  problemTitle: string;
  establishmentId: string;
  smartObjectiveId: string;       // the smart_objectives row to update
  initialScores:any;
  onSuccess: (result: QuestionnaireResult) => void;  // parent gets result after save
  onSkip?: () => void;
};

const Questionnaire = ({
  problemTitle,
  establishmentId,
  smartObjectiveId,
  initialScores,
  onSuccess,
  onSkip,
}: Props) => {
  const [scores, setScores] = useState<IshikawaScores>(
  initialScores ?? {
    manpower:    null,
    method:      null,
    machine:     null,
    material:    null,
    measurement: null,
  }
);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const getValueCounts = (scores: IshikawaScores) => {
  const map: Record<number, number> = {};

  Object.values(scores).forEach((v) => {
    if (v === null) return;
    map[v] = (map[v] || 0) + 1;
  });

  return map;
};

const hasTooManySameValues = (scores: IshikawaScores) => {
  const counts = getValueCounts(scores);
  return Object.values(counts).some((count) => count > 2);
};

const hasStrongSignal = (scores: IshikawaScores) => {
  return Object.values(scores).some((v) => v === 3 || v === 4);
};
  
  const answeredCount = Object.values(scores).filter((s) => s !== null).length;
  const isInvalidDistribution = hasTooManySameValues(scores);
  const lacksStrongSignal     = !hasStrongSignal(scores);


  const isComplete = answeredCount === SECTIONS.length;
  const handleChange = (key: IshikawaKey, val: number) => {
  setScores((prev) => {
    const updated = { ...prev };

    // Only one "Very likely" (4)
    if (val === 4) {
      Object.keys(updated).forEach((k) => {
        if (updated[k as IshikawaKey] === 4) {
          updated[k as IshikawaKey] = null;
        }
      });
    }

    // Only one "Likely" (3)
    if (val === 3) {
      Object.keys(updated).forEach((k) => {
        if (updated[k as IshikawaKey] === 3) {
          updated[k as IshikawaKey] = null;
        }
      });
    }

    updated[key] = val;
    return updated;
  });
};
  const handleSubmit = async () => {
  if (!isComplete || isInvalidDistribution || lacksStrongSignal) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = buildQuestionnaireResult(problemTitle, scores);

      // Save questionnaire scores + derived effort override to smart_objectives
      // const { error: dbError } = await supabase
      //   .from("smart_objectives")
      //   .update({
      //     // Store raw 5M scores for traceability
      //     questionnaire_scores: scores,

      //     // Store which category the user identified as dominant
      //     ishikawa_top_category: result.dominantCategory,

      //     // Override effort with user-validated value
      //     // This is what buildImpactEffortMatrix will read
      //     effort: result.dominantEffort,

      //     // Mark that effort came from user, not auto-detection
      //     effort_source: "user_questionnaire",

      //     updated_at: new Date().toISOString(),
      //   })
      //   .eq("id", smartObjectiveId)
      //   .eq("place_id", placeId);

      // if (dbError) throw dbError;

      // Notify parent — parent re-runs buildImpactEffortMatrix
      // with result.dominantEffort as the override
      await onSuccess(result);

    } catch (err: any) {
      setError(err.message ?? "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-400 rounded w-full font-sans">
      {/* Header — same as your original */}
      <div className="text-center font-bold p-3 border-b bg-gray-100">
        {problemTitle}
      </div>

      {/* Progress bar */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {answeredCount}/5
        </span>
      </div>

      {/* Sections — same structure as your original */}
      {SECTIONS.map((section) => (
        <Section
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          value={scores[section.key]}
          onChange={(val) => handleChange(section.key, val)}
        />
      ))}

      {/* Error */}
      {error && (
        <p className="px-3 pt-2 text-xs text-red-500">{error}</p>
      )}

      {isInvalidDistribution && (
        <p className="px-3 pt-2 text-xs text-orange-500">
          Please vary your answers — no more than 2 categories can have the same score.
        </p>
      )}
      

      {!isInvalidDistribution && lacksStrongSignal && (
        <p className="px-3 pt-2 text-xs text-orange-500">
          Please mark at least one category as "Likely" or "Very likely".
        </p>
      )}

      {!isComplete && (
        <p className="px-3 pt-2 text-xs text-orange-500">
          Please answer all questions before submitting.
        </p>
      )}

      {/* Footer */}
      <div className="p-3 flex items-center justify-between gap-3">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 underline hover:text-gray-600"
          >
            Skip — recommendations may be less accurate
          </button>
        )}
      <Button
        onClick={handleSubmit}
        disabled={
          !isComplete ||
          isSubmitting ||
          isInvalidDistribution ||
          lacksStrongSignal
        }
        className="ml-auto flex items-center gap-2 min-w-[170px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving & generating...
          </>
        ) : !isComplete ? (
          `Answer all questions (${answeredCount}/5)`
        ) : isInvalidDistribution ? (
          "Too many similar answers"
        ) : lacksStrongSignal ? (
          "Select at least one strong factor"
        ) : (
          "Submit Questionnaire"
        )}
      </Button>
      </div>
    </div>
  );
};

export default Questionnaire;