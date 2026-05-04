// src/components/reviews/RecommendationsSection.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartObjectiveCard } from "./reviews/SmartObjectiveCard";
import { SmartGenerateModal } from "./reviews/SmartGenerateModal";
import { useSmartStore } from "@/store/smartStore";
import type { ParetoItem } from "@/types/analysis";
import type { RootCauseAnalysis } from "@/utils/rootCauseAnalysis";
import { getCurrentEstablishment } from "@/services/establishments";

interface Props {
  paretoCauses: ParetoItem[];
  rcaByIssue: Record<string, RootCauseAnalysis>;
}

export function RecommendationsSection({ paretoCauses, rcaByIssue = {} }: Props) {

  const {
    objectives,
    currentDraft,
    isGenerating,
    isSaving,
    error,
    generateSmart,
    updateDraft,
    saveDraft,
    discardDraft,
    fetchObjectives,
    updateProgress,
    questionnaireByIssue,
    toggleAction
  } = useSmartStore();

  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);

  const establishmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadEst() {
      const est = await getCurrentEstablishment();
      const id = est?.id ?? null;
      setEstablishmentId(id);
      establishmentIdRef.current = id;
      if (id) fetchObjectives(id);
    }
    loadEst();
  }, []);

  const safeObjectives = Array.isArray(objectives) ? objectives : [];

  // ✅ SORT PARETO BY COUNT (FIX CORE ISSUE)
  const sortedPareto = useMemo(() => {
    return [...paretoCauses].sort((a, b) => b.count - a.count);
  }, [paretoCauses]);

  // ✅ MAP OBJECTIVES IN PARETO ORDER
  const orderedObjectives = useMemo(() => {
    return sortedPareto
      .map(p =>
        safeObjectives.find(
          o => o.pareto_cause?.toLowerCase() === p.name.toLowerCase()
        )
      )
      .filter(Boolean);
  }, [sortedPareto, safeObjectives]);

  // ✅ SPLIT STATES
  const completedObjectives = orderedObjectives.filter(o => o.status === "completed");

  const activeObjective =
    orderedObjectives.find(o => o.status !== "completed") || null;

  const pendingObjectives =
    orderedObjectives.filter(
      o => o.status !== "completed" && o.id !== activeObjective?.id
    );

  // ✅ NEXT ISSUE (NOT GENERATED YET)
  const nextIssue = useMemo(() => {
    return sortedPareto.find(p =>
      !safeObjectives.some(
        o => o.pareto_cause?.toLowerCase() === p.name.toLowerCase()
      )
    ) || null;
  }, [sortedPareto, safeObjectives]);

  // 🔥 GENERATE SMART (NOW USES NEXT ISSUE, NOT FIXED MAIN)
  const handleGenerate = async () => {
    console.log("button clicked")
    
  const estId = establishmentIdRef.current ?? establishmentId;
  if (!estId || !activeObjective) return;

  const pareto = paretoCauses.find(
    p =>
      p.name.toLowerCase() ===
      activeObjective.pareto_cause?.toLowerCase()
  );

  const rca = pareto ? rcaByIssue[pareto.name] : null;
  const questionnaire = pareto
    ? questionnaireByIssue?.[pareto.name]
    : null;

  if (!pareto || !rca) return;

  await generateSmart(
    estId,
    pareto,
    rca,
    questionnaire?.dominantEffort,
    questionnaire?.dominantCategory,
    questionnaire ? "user_questionnaire" : "auto_detected",
    questionnaire?.scores ?? null
  );

  setModalOpen(true);
};

  const handleUpdate = async()=>{

    setIsUpdating(()=>true)
    setModalOpen(true)


  }
  
  const handleSave = async () => {
    await saveDraft();
    isUpdating&&setIsUpdating(false)
    setModalOpen(false);
  };

  const handleClose = () => {
    discardDraft();
    setModalOpen(false);
    isUpdating&&setIsUpdating(false)
  };

  if (!sortedPareto.length) {
    return <p className="text-sm text-gray-500">No Pareto issues available.</p>;
  }

  const currentStep =
    orderedObjectives.findIndex(o => o.id === activeObjective?.id) + 1;

  return (
    <div className="space-y-6">

      {/* 🔥 HEADER (MAIN ISSUE BASED ON REAL PRIORITY) */}
  
      <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div>
          <p className="text-sm font-semibold text-orange-800">
            Main issue: "{sortedPareto[0]?.name}"
          </p>
          <p className="text-xs text-orange-600 mt-0.5">
            {sortedPareto[0]?.percentage?.toFixed(0)}% of negative reviews
          </p>
        </div>

        {!activeObjective?<Button
          onClick={handleGenerate}
          disabled={isGenerating || !establishmentId}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generate SMART
            </>
          )}
        </Button>:<Button
          onClick={handleUpdate}
          disabled={isUpdating || !establishmentId}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              updating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1.5" />
              update SMART
            </>
          )}
        </Button>
        }
      
      </div>

      {/* 🔥 STEP INDICATOR */}
      {activeObjective && (
        <p className="text-xs text-gray-500">
          Step {currentStep} of {sortedPareto.length}
        </p>
      )}

      {/* 🔥 CURRENT OBJECTIVE (ONLY ONE CARD) */}
      {activeObjective && (
        <SmartObjectiveCard
          objective={activeObjective}
          onUpdateProgress={updateProgress}
          onToggleAction={toggleAction}
        />
      )}

      {/* ⏳ NEXT OBJECTIVES */}
      {pendingObjectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Next Objectives
          </h3>

          <div className="space-y-2">
            {pendingObjectives.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50"
              >
                <p className="text-sm text-gray-700">
                  {o.pareto_cause}
                </p>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  To do
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ COMPLETED */}
      {completedObjectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 mb-2">
            Completed Objectives
          </h3>

          <div className="space-y-2">
            {completedObjectives.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-green-50"
              >
                <p className="text-sm text-green-700">
                  {o.pareto_cause}
                </p>
                <span>✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* MODAL */}
      <SmartGenerateModal
        updating={isUpdating}
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        currentDraft={currentDraft}
        isGenerating={isGenerating}
        isSaving={isSaving}
        updateDraft={updateDraft}
        paretoCause={activeObjective?.pareto_cause ?? ""}
        activeObjective ={activeObjective}
      />
    </div>
  );
}