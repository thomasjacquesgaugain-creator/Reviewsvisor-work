// src/store/smartStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  paretoPercentage?:    number,
): GenerateSmartPayload {
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
    pareto_cause:             {
                                key: paretoIssue.key,
                                en:  paretoIssue.en,
                                fr:  paretoIssue.fr,
                              },
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
  | "overdue";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

const buildParetoCause = (paretoIssue: ParetoItem) => ({
  key: paretoIssue.key,
  en:  paretoIssue.en,
  fr:  paretoIssue.fr,
});

const findObjectiveByParetoKey = async (
  establishmentId: string,
  paretoKey:       string,
  userId:          string,
) => {
  const { data } = await db
    .from("smart_objectives")
    .select("id")
    .eq("establishment_id", establishmentId)
    .eq("user_id", userId)
    .eq("pareto_cause->>key", paretoKey)
    .maybeSingle();

  return data;
};

/* ─────────────────────────────────────────────
   STORE INTERFACE
───────────────────────────────────────────── */

interface SmartStore {
  objectives:            SmartObjective[];
  currentDraft:          SmartObjective | null;
  isGenerating:          boolean;
  isSaving:              boolean;
  error:                 string | null;
  questionnaireByIssue:  Record<string, QuestionnaireResult>;
  loadedEstablishmentId: string | null;

  setQuestionnaireResult: (issueName: string, result: QuestionnaireResult) => void;
  resetSmartState:        () => void;

  generateSmart: (
    establishmentId:      string,
    paretoIssue:          ParetoItem,
    rca:                  RootCauseAnalysis,
    effortOverride?:      SmartEffort,
    ishikawaTopCategory?: string,
    effortSource?:        "auto_detected" | "user_questionnaire",
    questionnaireScores?: IshikawaScores | null,
    paretoPercentage?:    number,
  ) => Promise<boolean>; // true = saved OK, false = error (toast already shown)

  updateDraft:     (updates: Partial<SmartObjective>) => void;
  saveDraft:       () => Promise<void>;
  discardDraft:    () => void;
  fetchObjectives: (establishmentId: string) => Promise<void>;
  updateObjective: (id: string, updates: Partial<SmartObjective>) => Promise<void>;
  toggleAction:    (id: string, actionIndex: number) => Promise<void>;
  updateProgress:  (id: string, current_progress: number) => Promise<void>;

  saveQuestionnaireOnly: (
    establishmentId: string,
    paretoIssue:     ParetoItem,
    result:          QuestionnaireResult,
  ) => Promise<void>;

  updateObjectiveStatus: (
    objectiveId: string,
    status:      ObjectiveStatus,
  ) => Promise<SmartObjective | null>;

  resetAllData: () => void;
}

/* ─────────────────────────────────────────────
   STORE IMPLEMENTATION
───────────────────────────────────────────── */

export const useSmartStore = create<SmartStore>()(
  persist(
    (set, get) => ({
      objectives:            [],
      currentDraft:          null,
      isGenerating:          false,
      isSaving:              false,
      error:                 null,
      questionnaireByIssue:  {},
      loadedEstablishmentId: null,

      /* ── questionnaire cache ── */
      setQuestionnaireResult: (issueName, result) =>
        set((state) => ({
          questionnaireByIssue: {
            ...state.questionnaireByIssue,
            [issueName]: result,
          },
        })),

      resetSmartState: () =>
        set({
          objectives:            [],
          currentDraft:          null,
          questionnaireByIssue:  {},
          loadedEstablishmentId: null,
          error:                 null,
          isGenerating:          false,
          isSaving:              false,
        }),

      /* ─────────────────────────────────────────
         saveQuestionnaireOnly
         Upserts by pareto_cause->>'key' so fr/en
         never create duplicate rows.
      ───────────────────────────────────────── */
      saveQuestionnaireOnly: async (establishmentId, paretoIssue, result) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const paretoCause = buildParetoCause(paretoIssue);

        const existing = await findObjectiveByParetoKey(
          establishmentId,
          paretoIssue.key,
          user.id,
        );

        if (existing) {
          const { error } = await db
            .from("smart_objectives")
            .update({
              pareto_cause:          paretoCause,
              questionnaire_scores:  result.scores,
              ishikawa_top_category: result.dominantCategory,
              effort:                result.dominantEffort,
              effort_source:         "user_questionnaire",
              updated_at:            new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          const { error } = await db.from("smart_objectives").insert({
            establishment_id:      establishmentId,
            user_id:               user.id,
            pareto_cause:          paretoCause,
            questionnaire_scores:  result.scores,
            ishikawa_top_category: result.dominantCategory,
            effort:                result.dominantEffort,
            effort_source:         "user_questionnaire",
            place_id:              "temp",
            problem:               { en: `Reduce ${paretoIssue.en}`, fr: `Réduire ${paretoIssue.fr}` },
            kpi_label:             { en: "Negative mentions", fr: "Mentions négatives" },
            current_value:         paretoIssue.count ?? 0,
            target_value:          Math.ceil((paretoIssue.count ?? 1) * 0.5),
            deadline:              new Date().toISOString(),
          });

          if (error) throw error;
        }
      },

      /* ─────────────────────────────────────────
         generateSmart
         Checks for existing row by pareto key
         BEFORE calling the edge function, passes
         existing_objective_id so the function
         updates instead of inserting — prevents
         fr/en duplication.
         Returns true on success, false on failure
         (toast already shown on failure).
      ───────────────────────────────────────── */
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
        const t = i18n.t.bind(i18n);

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");

          const existing = await findObjectiveByParetoKey(
            establishmentId,
            paretoIssue.key,
            user.id,
          );

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

          // Pass existing id so edge function updates rather than inserts
          const payloadWithId = existing
            ? { ...payload, existing_objective_id: existing.id }
            : payload;

          const { data, error } = await supabase.functions.invoke(
            "generate-smart-objective",
            { body: payloadWithId },
          );

          if (error) {
            console.error("Edge function error:", error);
            toast.error(t("toasts.error"), {
              description: t("questionnaire.errors.saveFailed"),
            });
            set({ isGenerating: false });
            return false; // failure: caller must NOT update local cache
          }

          if (data.ok) {
            toast.success(t("toasts.saved"), {
              description: t("questionnaire.success"),
            });
          }

          const saved: SmartObjective = data.smart_objective;

          // Update in-place or prepend — no duplicates
          set((state) => ({
            objectives: [
              saved,
              ...state.objectives.filter(
                (o) => o.pareto_cause?.key !== paretoIssue.key
              ),
            ],
            currentDraft: saved,
            isGenerating: false,
          }));

          return true; // success: caller may update local cache

        } catch (err: any) {
          console.error("generateSmart error:", err);
          toast.error(i18n.t("toasts.error"), {
            description: i18n.t("questionnaire.errors.saveFailed"),
          });
          set({ error: err.message, isGenerating: false });
          return false; // failure
        }
      },

      /* ── draft helpers ── */
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
          let data, error;

          if (currentDraft.id) {
            const result = await db
              .from("smart_objectives")
              .update(currentDraft)
              .eq("id", currentDraft.id)
              .select()
              .single();
            data  = result.data;
            error = result.error;
          } else {
            const existing = await findObjectiveByParetoKey(
              currentDraft.establishment_id,
              currentDraft.pareto_cause.key,
              currentDraft.user_id,
            );

            const result = existing
              ? await db
                  .from("smart_objectives")
                  .update(currentDraft)
                  .eq("id", existing.id)
                  .select()
                  .single()
              : await db
                  .from("smart_objectives")
                  .insert(currentDraft)
                  .select()
                  .single();

            data  = result.data;
            error = result.error;
          }

          if (error) throw error;

          set((state) => ({
            objectives:   [data, ...state.objectives.filter((o) => o.id !== data.id)],
            currentDraft: null,
            isSaving:     false,
          }));
        } catch (err: any) {
          set({ error: err.message, isSaving: false });
        }
      },

      discardDraft: () => set({ currentDraft: null }),

      /* ── fetchObjectives ── */
      fetchObjectives: async (establishmentId) => {
        const { loadedEstablishmentId } = get();

        if (loadedEstablishmentId !== establishmentId) {
          set({
            objectives:           [],
            currentDraft:         null,
            questionnaireByIssue: {},
            error:                null,
          });
        }

        const { data, error } = await db
          .from("smart_objectives")
          .select("*")
          .eq("establishment_id", establishmentId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("fetchObjectives error:", error);
          set({ error: error.message });
          return;
        }

        set({
          objectives:            data ?? [],
          loadedEstablishmentId: establishmentId,
        });
      },

      /* ── updateObjective ── */
      updateObjective: async (id, updates) => {
        const normalizedUpdates = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const { error } = await db
          .from("smart_objectives")
          .update(normalizedUpdates)
          .eq("id", id);

        if (!error) {
          set((state) => ({
            objectives: state.objectives.map((obj) =>
              obj.id === id ? { ...obj, ...normalizedUpdates } : obj
            ),
          }));
        }
      },

      toggleAction: async (id, actionIndex) => {
        const { objectives } = get();
        const obj = objectives.find((o) => o.id === id);
        if (!obj) return;

        const updatedActions = obj.actions.map((a, i) =>
          i === actionIndex ? { ...a, completed: !a.completed } : a
        );
        await get().updateObjective(id, { actions: updatedActions });
      },

      updateProgress: async (id, current_progress) => {
        const { objectives, updateObjectiveStatus } = get();
        const objective = objectives.find((o) => o.id === id);
        if (!objective) return;
        if (objective.status !== "in_progress") return;

        await get().updateObjective(id, { current_progress });

        if (current_progress <= objective.target_value) {
          await updateObjectiveStatus(id, "completed");
        }
      },

      updateObjectiveStatus: async (objectiveId, status) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error("User not authenticated");

          const { data, error } = await db
            .from("smart_objectives")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", objectiveId)
            .eq("user_id", session.user.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            objectives: state.objectives.map((obj) =>
              obj.id === objectiveId ? { ...obj, status } : obj
            ),
          }));

          return data;
        } catch (err) {
          console.error("updateObjectiveStatus error:", err);
          throw err;
        }
      },

      resetAllData: () =>
        set({
          objectives:           [],
          currentDraft:         null,
          questionnaireByIssue: {},
          error:                null,
          isGenerating:         false,
          isSaving:             false,
        }),
    }),
    {
      name: "smart-store",
      partialize: (state) => ({
        objectives:            state.objectives,
        questionnaireByIssue:  state.questionnaireByIssue,
        loadedEstablishmentId: state.loadedEstablishmentId,
      }),
    }
  )
);