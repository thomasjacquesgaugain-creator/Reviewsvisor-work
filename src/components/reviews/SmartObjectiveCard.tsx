// src/components/reviews/SmartObjectiveCard.tsx

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Calendar, CheckCircle2, Circle,
         ChevronDown, ChevronUp } from "lucide-react";
import type { SmartObjective } from "@/types/smart";
import { useSmartProgress } from "@/hooks/useSmartProgress";
import { format } from "date-fns";

interface Props {
  objective:         SmartObjective;
  onUpdateProgress?: (id: string, value: number) => void;
  onToggleAction?:   (id: string, actionIndex: number) => void;
}

/* ─────────────────────────────────────────────
   CONFIG MAPS
───────────────────────────────────────────── */

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const STATUS_STYLE: Record<string, string> = {
  todo:        "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-500 text-white",
  completed:   "bg-green-100 text-green-700",
  overdue:     "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  todo:        "To do",
  in_progress: "In progress",
  completed:   "Completed",
  overdue:     "Overdue",
};

// Spec §7.3.2 PDCA phases
const PDCA_CONFIG: Record<string, {
  phase: string;
  label: string;
  color: string;
  dot:   string;
}> = {
  todo: {
    phase: "PLAN",
    label: "PLAN — defining objective",
    color: "bg-blue-50 border-blue-200",
    dot:   "bg-blue-500",
  },
  in_progress: {
    phase: "DO",
    label: "DO — executing",
    color: "bg-green-50 border-green-200",
    dot:   "bg-green-500",
  },
  completed: {
    phase: "ACT",
    label: "ACT — standardizing",
    color: "bg-purple-50 border-purple-200",
    dot:   "bg-purple-500",
  },
  overdue: {
    phase: "CHECK",
    label: "CHECK — review needed",
    color: "bg-red-50 border-red-200",
    dot:   "bg-red-500",
  },
};

const FREQUENCY_STYLE: Record<string, string> = {
  daily:   "bg-blue-50 text-blue-600 border-blue-100",
  weekly:  "bg-orange-50 text-orange-600 border-orange-100",
  monthly: "bg-purple-50 text-purple-600 border-purple-100",
  once:    "bg-gray-100 text-gray-500 border-gray-200",
};

const SMART_LETTER_STYLE: Record<string, string> = {
  S: "bg-blue-100 text-blue-700",
  M: "bg-green-100 text-green-700",
  A: "bg-yellow-100 text-yellow-700",
  R: "bg-orange-100 text-orange-700",
  T: "bg-purple-100 text-purple-700",
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

export function SmartObjectiveCard({
  objective,
  onUpdateProgress,
  onToggleAction,
}: Props) {
  const progress = useSmartProgress(objective);
  const pdca     = PDCA_CONFIG[objective.status ?? "todo"];

  const [showProgress, setShowProgress]   = useState(false);
  const [progressInput, setProgressInput] = useState(
    String(objective.current_progress ?? objective.current_value)
  );

  // Next review = 6 weeks from created_at (spec §7.3.2)
  const nextReview = objective.created_at
    ? (() => {
        const d = new Date(objective.created_at);
        d.setDate(d.getDate() + 42);
        return format(d, "MMM d, yyyy");
      })()
    : null;

  const completedActions = (objective.actions ?? [])
    .filter(a => a.completed).length;
  const totalActions = (objective.actions ?? []).length;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-5 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1">
            <Target className={`h-5 w-5 mt-0.5 shrink-0 ${
              objective.status === "completed"
                ? "text-green-500" : "text-blue-600"
            }`} />
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                SMART objective — {objective.pareto_cause}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                From Pareto: "{objective.pareto_cause}
                {objective.pareto_percentage
                  ? ` – ${Math.round(objective.pareto_percentage ?? 0)}% of negative reviews`
                  : ""}"
                {objective.ishikawa_top_category && (
                  <span>
                    {" · "}Ishikawa: {objective.ishikawa_top_category}
                    {objective.effort_source === "user_questionnaire" && (
                      <span className="text-green-600"> (validated)</span>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge className={`text-xs border ${
              PRIORITY_STYLE[objective.priority ?? "medium"]
            }`}>
              {objective.priority} priority
            </Badge>
            <Badge className={`text-xs ${
              STATUS_STYLE[objective.status ?? "todo"]
            }`}>
              {STATUS_LABEL[objective.status ?? "todo"]}
            </Badge>
            {objective.ai_generated && (
              <span className="text-xs text-gray-400 bg-gray-50
                               px-2 py-0.5 rounded-full border">
                AI generated
              </span>
            )}
          </div>
        </div>

        {/* ── S M R T grid (2x2) ── */}
        <div className="grid grid-cols-2 gap-2">

          {/* S — Specific */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold
                               flex items-center justify-center
                               ${SMART_LETTER_STYLE["S"]}`}>
                S
              </span>
              <span className="text-xs font-semibold text-blue-700">
                Specific
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
              {objective.problem ?? "—"}
            </p>
          </div>

          {/* R — Relevant */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold
                               flex items-center justify-center
                               ${SMART_LETTER_STYLE["R"]}`}>
                R
              </span>
              <span className="text-xs font-semibold text-orange-700">
                Relevant
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
              {objective.relevance_note ?? "—"}
            </p>
          </div>

          {/* M — Measurable */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold
                               flex items-center justify-center
                               ${SMART_LETTER_STYLE["M"]}`}>
                M
              </span>
              <span className="text-xs font-semibold text-green-700">
                Measurable
              </span>
            </div>
            <p className="text-xs text-gray-500">{objective.kpi_label}</p>
            <p className="text-xs font-semibold text-gray-800 mt-0.5">
              {objective.current_value} → {objective.target_value}{" "}
              {objective.unit}
            </p>
          </div>

          {/* T — Temporal */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-5 h-5 rounded-full text-xs font-bold
                               flex items-center justify-center
                               ${SMART_LETTER_STYLE["T"]}`}>
                T
              </span>
              <span className="text-xs font-semibold text-purple-700">
                Temporal
              </span>
            </div>
            <p className="text-xs text-gray-700">
              Deadline:{" "}
              {objective.deadline
                ? format(new Date(objective.deadline), "MMM d, yyyy")
                : "—"}
            </p>
            <p className="text-xs text-gray-500">
              Duration: {objective.duration_months}mo · Review: 6 weeks
            </p>
          </div>
        </div>

        {/* ── A — Achievable (full width) ── */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-5 h-5 rounded-full text-xs font-bold
                             flex items-center justify-center
                             ${SMART_LETTER_STYLE["A"]}`}>
              A
            </span>
            <span className="text-xs font-semibold text-yellow-700">
              Achievable
            </span>
          </div>
          <p className="text-xs text-gray-700">
            {objective.actions?.[0]?.text ?? "No actions defined"}
            {(objective.actions?.length ?? 0) > 1 && (
              <span className="text-gray-400">
                {" "}+ {(objective.actions?.length ?? 0) - 1} more
              </span>
            )}
          </p>
        </div>

        {/* ── Progress bar — spec §7.3 ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Progress toward target
            </span>
            <span className={`text-xs font-semibold ${
              progress.label === "improvement" ? "text-blue-600" :
              progress.label === "degradation" ? "text-red-500" :
                                                 "text-gray-500"
            }`}>
              {progress.percentage}%
              {progress.label === "improvement" && (
                <span className="ml-1 font-normal text-gray-500">
                  · {objective.current_progress ?? objective.current_value}{" "}
                  mentions now
                </span>
              )}
            </span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>Start: {objective.current_value}</span>
            <span className={progress.isOverdue ? "text-red-500" : ""}>
              {progress.isOverdue
                ? `${Math.abs(progress.daysRemaining)}d overdue`
                : `${progress.daysRemaining} days left`}
            </span>
            <span>Target: {objective.target_value}</span>
          </div>

          {/* Manual progress update */}
          {onUpdateProgress && objective.status !== "completed" && (
            <div className="pt-1">
              <button
                onClick={() => setShowProgress(p => !p)}
                className="text-xs text-blue-500 hover:text-blue-700
                           flex items-center gap-1"
              >
                Update progress
                {showProgress
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />}
              </button>

              {showProgress && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    Current mentions:
                  </span>
                  <input
                    type="number"
                    value={progressInput}
                    min={0}
                    max={objective.current_value}
                    onChange={(e) => setProgressInput(e.target.value)}
                    className="w-16 text-xs border border-gray-200
                               rounded px-2 py-1 text-center"
                  />
                  <button
                    onClick={() => {
                      const val = Number(progressInput);
                      if (!isNaN(val) && objective.id) {
                        onUpdateProgress(objective.id, val);
                        setShowProgress(false);
                      }
                    }}
                    className="text-xs bg-blue-600 text-white
                               px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </div>



         {/* At the bottom of SmartObjectiveCard — replace the current 3-cell footer */}

{/* ── PDCA Cycle — spec §7.3.2 ── */}
<div className="border-t border-gray-100 pt-3">
  <p className="text-xs font-semibold text-gray-500 mb-2">
    PDCA — Monitoring, execution, continuous improvement
  </p>

  <div className="space-y-2">

    {/* PLAN */}
    <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border-l-2 border-blue-400">
      <span className="text-xs font-bold text-blue-600 w-12 shrink-0">PLAN</span>
      <div className="text-xs text-gray-700">
        <p className="font-medium">{objective.problem}</p>
        <p className="text-gray-500 mt-0.5">
          Target: {objective.current_value} → {objective.target_value} · {objective.duration_months} months
        </p>
      </div>
    </div>

    {/* DO */}
    <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border-l-2 border-red-400">
      <span className="text-xs font-bold text-red-600 w-12 shrink-0">DO</span>
      <div className="text-xs text-gray-700 flex-1">
        <p className="font-medium mb-1">
          Tasks ({completedActions}/{totalActions})
        </p>
        {objective.actions?.slice(0, 2).map((a, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {a.completed
              ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
              : <Circle className="h-3 w-3 text-gray-300 shrink-0" />}
            <span className={a.completed ? "line-through text-gray-400" : ""}>
              {a.text}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* CHECK */}
    <div className="flex items-start gap-2 p-2.5 bg-yellow-50 rounded-lg border-l-2 border-yellow-400">
      <span className="text-xs font-bold text-yellow-600 w-12 shrink-0">CHECK</span>
      <div className="text-xs text-gray-700 flex-1">
        <p className="font-medium mb-1">KPI tracking</p>
        <p className="font-mono text-gray-600">
          {objective.kpi_label}: {objective.current_value}
          {objective.current_progress != null &&
            objective.current_progress !== objective.current_value && (
              <span className="text-blue-600">
                {" → "}{objective.current_progress}
              </span>
            )}
          {" → "}<span className="text-green-600">target {objective.target_value}</span>
        </p>
        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>

    {/* ACT */}
    <div className="flex items-start gap-2 p-2.5 bg-green-50 rounded-lg border-l-2 border-green-400">
      <span className="text-xs font-bold text-green-600 w-12 shrink-0">ACT</span>
      <div className="text-xs text-gray-700 flex-1">
        <p className="font-medium mb-1.5">Decision</p>
        <div className="space-y-1">
          {[
            { label: "Effective → standardize",  value: "effective" },
            { label: "Partial → adjust",          value: "partial"   },
            { label: "Ineffective → new action",  value: "ineffective"},
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`act-${objective.id}`}
                value={opt.value}
                className="w-3 h-3 accent-green-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {/* Mini trend badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            progress.label === "improvement" ? "bg-green-500" :
            progress.label === "degradation" ? "bg-red-500" :
                                               "bg-yellow-500"
          }`} />
          <span className="text-gray-500 capitalize">{progress.label}</span>
          </div>
          </div>
        </div>
      </div>
    </div>

      </CardContent>
    </Card>
  );
}