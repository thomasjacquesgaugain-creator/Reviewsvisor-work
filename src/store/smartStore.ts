// src/store/smartStore.ts

import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type {
  SmartObjective,
  SmartEffort,
  SmartImpact,
  SmartQuadrant,
  GenerateSmartPayload,
  IshikawaScores,
  QuestionnaireResult,
} from "@/types/smart";
import type { ParetoItem } from "@/types/analysis";
import type { RootCauseAnalysis } from "@/utils/rootCauseAnalysis";
import i18n from "@/i18n/config";
import { toast } from "sonner";

/* ─────────────────────────────────────────────
   DETERMINISTIC HELPERS
───────────────────────────────────────────── */
const db = supabase as any;
const DEADLINE_BY_EFFORT: Record<SmartEffort, number> = {
  Low:    2,
  Medium: 3,
  High:   6,
};

function getQuadrant(impact: SmartImpact, effort: SmartEffort): SmartQuadrant {
  if (impact === "High"   && effort === "Low")    return "quick_win";
  if (impact === "High"   && effort === "Medium") return "quick_win";
  if (impact === "High"   && effort === "High")   return "strategic";
  if (impact === "Medium" && effort === "Low")    return "minor";
  if (impact === "Low"    && effort === "High")   return "avoid";
  return "minor";
}

function getImpact(count: number, total: number): SmartImpact {
  const pct = (count / Math.max(total, 1)) * 100;
  if (pct > 25)  return "High";
  if (pct >= 10) return "Medium";
  return "Low";
}

export function buildSmartPayload(
  establishmentId:      string,
  paretoIssue:          ParetoItem,
  rca:                  RootCauseAnalysis,
  effortOverride?:      SmartEffort,
  ishikawaTopCategory?: string,
  effortSource?:        "auto_detected" | "user_questionnaire",
  questionnaireScores?: IshikawaScores | null,
  paretoPercentage? :    number,
): GenerateSmartPayload {
  const t = i18n.t.bind(i18n);
  const totalNegative = paretoIssue.count ?? 1;

  const allCauses = rca.categories.flatMap((c) =>
    c.causes.map((cause) => ({ ...cause, categoryName: c.name }))
  );
  const topCause = [...allCauses].sort(
    (a, b) => (b.count ?? 0) - (a.count ?? 0)
  )[0];

  const count  = topCause?.count ?? 1;
  const impact = getImpact(count, totalNegative);

  const autoEffort = ((): SmartEffort => {
    const name = (topCause?.categoryName ?? "").toLowerCase();
    if (name.includes("outil") || name.includes("syst") || name.includes("produit")) return "High";
    if (name.includes("main") || name.includes("uvre") || name.includes("processus")) return "Medium";
    return "Low";
  })();

  const effort         = effortOverride ?? autoEffort;
  const deadlineMonths = DEADLINE_BY_EFFORT[effort];
  const quadrant       = getQuadrant(impact, effort);

  return {
    establishment_id:         establishmentId,
    pareto_cause:             paretoIssue.name,
    computed_count:           count,
    computed_target:          Math.ceil(count * 0.5),
    computed_impact:          impact,
    computed_effort:          effort,
    computed_deadline_months: deadlineMonths,
    computed_quadrant:        quadrant,
    ishikawa_top_category:    ishikawaTopCategory ?? topCause?.categoryName,
    effort_source:            effortSource ?? "auto_detected",
    questionnaire_scores:     questionnaireScores ?? null,
    pareto_percentage:        paretoPercentage,
    language:                 i18n.language,
  };
}
// TYPES
export type ObjectiveStatus =
  | "todo"
  | "in_progress"
  | "completed"
  |"overdue";

/* ─────────────────────────────────────────────
   STORE INTERFACE
───────────────────────────────────────────── */

interface SmartStore {
  objectives:           SmartObjective[];
  currentDraft:         SmartObjective | null;
  isGenerating:         boolean;
  isSaving:             boolean;
  error:                string | null;
  questionnaireByIssue: Record<string, QuestionnaireResult>;

  setQuestionnaireResult: (
    issueName: string,
    result: QuestionnaireResult
  ) => void;

  generateSmart: ( 
    establishmentId:      string,
    paretoIssue:          ParetoItem,
    rca:                  RootCauseAnalysis,
    effortOverride?:      SmartEffort,
    ishikawaTopCategory?: string,
    effortSource?:        "auto_detected" | "user_questionnaire",
    questionnaireScores?: IshikawaScores | null,
    paretoPercetage? :     number,
  ) => Promise<void>;

  updateDraft:     (updates: Partial<SmartObjective>) => void;
  saveDraft:       () => Promise<void>;
  discardDraft:    () => void;
  fetchObjectives: (establishmentId: string) => Promise<void>;
  updateObjective: (id: string, updates: Partial<SmartObjective>) => Promise<void>;
  toggleAction: (id: string, actionIndex: number) => Promise<void>;
  updateProgress:  (id: string, current_progress: number) => Promise<void>;
  saveQuestionnaireOnly: (
  establishmentId: string,
  paretoIssue: ParetoItem,
  result: QuestionnaireResult
) => Promise<void>;
 updateObjectiveStatus: (
    objectiveId: string,
    status: ObjectiveStatus
  ) => Promise<SmartObjective | null>;
  resetAllData: () => void;
}

/* ─────────────────────────────────────────────
   STORE IMPLEMENTATION
───────────────────────────────────────────── */

export const useSmartStore = create<SmartStore>((set, get) => ({
  objectives:           [],
  currentDraft:         null,
  isGenerating:         false,
  isSaving:             false,
  error:                null,
  questionnaireByIssue: {},
  

  setQuestionnaireResult: (issueName, result) =>
    set((state) => ({
      questionnaireByIssue: {
        ...state.questionnaireByIssue,
        [issueName]: result,
      },
    })),


  saveQuestionnaireOnly: async (
  establishmentId: string,
  paretoIssue: ParetoItem,
  result: QuestionnaireResult
  ) => {
    const db = supabase as any;
    const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: existing } = await db
    .from("smart_objectives")
    .select("id")
    .eq("establishment_id", establishmentId)
    .eq("pareto_cause", paretoIssue.name)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await db
      .from("smart_objectives")
      .update({
        questionnaire_scores: result.scores,
        ishikawa_top_category: result.dominantCategory,
        effort: result.dominantEffort,
        effort_source: "user_questionnaire",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await db.from("smart_objectives").insert({
      establishment_id: establishmentId,
      pareto_cause: paretoIssue.name,
      user_id: user.id,
      questionnaire_scores: result.scores,
      ishikawa_top_category: result.dominantCategory,
      effort: result.dominantEffort,
      effort_source: "user_questionnaire",

      // required fallback fields
      place_id: "temp",
      problem: paretoIssue.name,
      kpi_label: "Negative mentions",
      current_value: paretoIssue.count ?? 0,
      target_value: Math.ceil((paretoIssue.count ?? 1) * 0.5),
      deadline: new Date().toISOString(),
    });
  }
},


  generateSmart: async (
    establishmentId,
    paretoIssue,
    rca,
    effortOverride,
    ishikawaTopCategory,
    effortSource,
    questionnaireScores,
    paretoPercentage,
  ) => {
    set({ isGenerating: true, error: null });

    console.log("generateSmart called with:", {
      establishmentId,
      paretoIssue,
      rcaCategories: rca?.categories?.length,
    });
    const t = i18n.t.bind(i18n);
    try {
      // ✅ FIX 1: pass establishmentId directly, not wrapped in paretoIssue
      const payload = buildSmartPayload(
        establishmentId,
        paretoIssue,
        rca,
        effortOverride,
        ishikawaTopCategory,
        effortSource,
        questionnaireScores,
        paretoPercentage,
      );

      console.log("payload:", payload);

      const { data, error } = await supabase.functions.invoke(
        "generate-smart-objective",
        { body: payload }
      );

      console.log("edge function response:", { data, error });

        if (error) {
        console.error("Erreur:", error);
        toast.error(t("toasts.error"),{
          description: t("questionnaire.error"),
        });
        return;
      }
       if (data.ok) {
        toast.success(t("toasts.saved"), {
        description: t("questionnaire.success"),
      });
      }










      set({ currentDraft: data.smart_objective, isGenerating: false });
    } catch (err: any) {
      console.error("generateSmart error:", err);
      set({ error: err.message, isGenerating: false });
    }
  },

  updateDraft: (updates) =>
  set((state) => ({
    currentDraft: state.currentDraft
      ? { ...state.currentDraft, ...updates }
      : (updates as SmartObjective),
  })),

 saveDraft: async () => {
  const { currentDraft } = get();
  if (!currentDraft) return;

  set({ isSaving: true });
  try {
    let data;
    let error;

    if (currentDraft.id) {
      // Edge function already saved it — just update with user edits
      const result = await db
        .from("smart_objectives")
        .update(currentDraft)
        .eq("id", currentDraft.id)
        .select()
        .single();
      data  = result.data;
      error = result.error;
    } else {
      // No id yet — insert (fallback, shouldn't happen normally)
      const result = await db
        .from("smart_objectives")
        .insert(currentDraft)
        .select()
        .single();
      data  = result.data;
      error = result.error;
    }

    if (error) throw error;

    set((state) => ({
      objectives:   [data, ...state.objectives.filter(o => o.id !== data.id)],
      currentDraft: null,
      isSaving:     false,
    }));
  } catch (err: any) {
    set({ error: err.message, isSaving: false });
  }
},

  discardDraft: () => set({ currentDraft: null }),


  fetchObjectives: async (establishmentId) => {
    const { data, error } = await db
      .from("smart_objectives")
      .select("*")
      .eq("establishment_id", establishmentId)
      .order("created_at", { ascending: false })

    if (!error && data) set({ objectives: data });
  },

  updateObjective: async (id, updates) => {

    const { error } = await db
      .from("smart_objectives")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      set((state) => ({
        objectives: state.objectives.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        ),
      }));
    }
  },
  toggleAction: async (id: string, actionIndex: number) => {
  const { objectives } = get();
  const obj = objectives.find(o => o.id === id);
  if (!obj) return;

  const updatedActions = obj.actions.map((a, i) =>
    i === actionIndex ? { ...a, completed: !a.completed } : a
  );
  await get().updateObjective(id, { actions: updatedActions });
},
  updateProgress: async (id, current_progress) => {
  const { objectives, updateObjectiveStatus } = get();

  const objective = objectives.find(o => o.id === id);

  if (!objective) return;

  // only active objective can progress
  if (objective.status !== "in_progress") {
    return;
  }

  await get().updateObjective(id, {
    current_progress
  });

  const targetReached =
    current_progress <= objective.target_value;

  if (targetReached) {
    await updateObjectiveStatus(
      id,
      "completed"
    );
  }
},

  updateObjectiveStatus: async (
  objectiveId: string,
  status: "todo" | "in_progress" | "completed"|"overdue"
) => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await db
      .from("smart_objectives")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", objectiveId)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Zustand local sync
    set(state => ({
      objectives: state.objectives.map(obj =>
        obj.id === objectiveId
          ? {
              ...obj,
              status
            }
          : obj
      )
    }));

    return data;
  } catch (err) {
    console.error("updateObjectiveStatus error:", err);
    throw err;
  }
},

  resetAllData: () =>
    set({
      objectives: [],
      currentDraft: null,
      questionnaireByIssue: {},
      error: null,
      isGenerating: false,
      isSaving: false,
    }),


}));
