// src/types/smart.ts

/* ─────────────────────────────────────────────
   ENUMS
───────────────────────────────────────────── */

export type SmartStatus   = "todo" | "in_progress" | "completed" | "overdue";
export type SmartPriority = "high" | "medium" | "low";
export type SmartEffort   = "Low" | "Medium" | "High";
export type SmartImpact   = "Low" | "Medium" | "High";
export type SmartQuadrant = "quick_win" | "strategic" | "minor" | "avoid";
export type EffortSource  = "auto_detected" | "user_questionnaire";
export type TargetSource  = "computed" | "user_adjusted";
export type ActionFrequency = "daily" | "weekly" | "monthly" | "once";

/* ─────────────────────────────────────────────
   SMART ACTION
───────────────────────────────────────────── */

export interface SmartAction {
  text:        string;
  frequency:   ActionFrequency;
  completed:   boolean;
}

/* ─────────────────────────────────────────────
   QUESTIONNAIRE
───────────────────────────────────────────── */

export type IshikawaKey =
  | "manpower"
  | "method"
  | "machine"
  | "material"
  | "measurement";

export type IshikawaScores = Record<IshikawaKey, number | null>;

export interface QuestionnaireResult {
  paretoIssue:    {
                    key: string;
                    en: string;
                    fr: string;
                    };
  scores:      IshikawaScores;
  dominantCategory: string;
  dominantEffort:   SmartEffort;
  confirmedCategories: {
    key:          IshikawaKey;
    categoryName: string;
    score:        number;
    effort:       SmartEffort;
    label:        string;
  }[];
  isComplete: boolean;
}

/* ─────────────────────────────────────────────
   SMART OBJECTIVE — matches smart_objectives table
───────────────────────────────────────────── */

export interface SmartObjective {
  id?:              string;
  establishment_id?: string;
  user_id?:         string;
  place_id:         string;

  // Source tracing
    pareto_cause:         {
                          key: string;
                          en: string;
                          fr: string;
                        };
  pareto_percentage?: number;
  pareto_count?:      number;

  // Ishikawa / Questionnaire
  ishikawa_top_category?: string;
  questionnaire_scores?:  IshikawaScores | null;
  effort:                 SmartEffort;
  effort_source:          EffortSource;

  // Impact / Matrix
  impact:   SmartImpact;
  quadrant: SmartQuadrant;

  // SMART fields
  problem:        string;
  kpi_label:      string;
  current_value:  number;
  target_value:   number;
  unit:           string;
  relevance_note?: string;
  actions:         SmartAction[];
  action_plan:     any;
  synthesis:        any;
  deadline:        string;
  duration_months: number;

  // Computed vs user-adjusted
  computed_target?:          number;
  computed_deadline_months?: number;
  target_source:             TargetSource;
  deadline_source:           TargetSource;

  // Progress
  current_progress?: number;
  status:            SmartStatus;
  priority:          SmartPriority;

  // AI metadata
  ai_generated:  boolean;
  ai_confidence?: number;

  created_at?: string;
  updated_at?: string;
}

/* ─────────────────────────────────────────────
   PROGRESS — computed by useSmartProgress hook
───────────────────────────────────────────── */

export interface SmartProgress {
  percentage:    number;           // 0–100
  label:         "improvement" | "stable" | "degradation";
  daysRemaining: number;
  isOverdue:     boolean;
}



/* ─────────────────────────────────────────────
   EDGE FUNCTION PAYLOAD — what frontend sends
   to generate-smart-objective
───────────────────────────────────────────── */

export interface GenerateSmartPayload {
  establishment_id:         string;
  pareto_cause:         {
                          key: string;
                          en: string;
                          fr: string;
                        };
  computed_count:           number;
  computed_target:          number;
  computed_impact:          SmartImpact;
  computed_effort:          SmartEffort;
  computed_deadline_months: number;
  computed_quadrant:        SmartQuadrant;
  ishikawa_top_category?:   string;
  effort_source?:           EffortSource;
  questionnaire_scores?:    IshikawaScores | null;
  pareto_percentage?:       number;
  language?:                string
}

/* ─────────────────────────────────────────────
   EDGE FUNCTION RESPONSE
───────────────────────────────────────────── */

export interface GenerateSmartResponse {
  ok:              boolean;
  smart_objective?: SmartObjective;
  error?:          string;
}