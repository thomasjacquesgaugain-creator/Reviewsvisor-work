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
import { useTranslation } from "react-i18next";
import { useEstablishmentStore } from "@/store/establishmentStore";
import i18n from "@/i18n/config";

interface Props {
  paretoCauses: ParetoItem[];
}

export function RecommendationsSection({ paretoCauses }: Props) {

  const {
    objectives,
    currentDraft,
    isGenerating,
    isSaving,
    error,
    updateDraft,
    saveDraft,
    discardDraft,
    fetchObjectives,
    updateProgress,
    toggleAction,
    updateObjectiveStatus
  } = useSmartStore();
  const activeEstablishmentId = useEstablishmentStore(
  s => s.activeEstablishmentId
);


  const [modalOpen, setModalOpen] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);

  const {t}=useTranslation();

useEffect(() => {
  if (!activeEstablishmentId) return;

  fetchObjectives(activeEstablishmentId);
}, [activeEstablishmentId, fetchObjectives]);
useEffect(() => {
  async function syncActiveObjective() {
    if (!objectives.length) return;

    const sortedPareto = [...paretoCauses].sort(
      (a, b) => b.count - a.count
    );

    const nextObjective = sortedPareto
      .map(p =>
        objectives.find(
          o =>
            o.pareto_cause?.key?.toLowerCase() ===
            p.key.toLowerCase()
        )
      )
      .find(o => o &&o.status !== "completed");
    if (!nextObjective) return;

    // already active
    if (nextObjective.status === "in_progress") {
      return;
    }

    await updateObjectiveStatus(
      nextObjective.id,
      "in_progress"
    );
  }

  syncActiveObjective();
}, [objectives, paretoCauses]);




  const safeObjectives = Array.isArray(objectives)
    ? objectives
    : [];

  // ACTIVE OBJECTIVE DIRECTLY FROM DB
  const activeObjective =
    safeObjectives.find(o => o.status === "in_progress") ||
    null;

  // COMPLETED
  const completedObjectives = safeObjectives.filter(
    o => o.status === "completed"
  );

  // PENDING
  const pendingObjectives = safeObjectives.filter(
    o =>
      o.status !== "completed" &&
      o.status !== "in_progress"
  );

  // NEXT ISSUE (NOT GENERATED YET)
  const sortedPareto = useMemo(() => {
    return [...paretoCauses].sort(
      (a, b) => b.count - a.count
    );
  }, [paretoCauses]);

  const nextIssue = useMemo(() => {
    return (
      sortedPareto.find(
        p =>
          !safeObjectives.some(
            o =>
              o.pareto_cause?.key?.toLowerCase() ===
              p.key.toLowerCase()
          )
      ) || null
    );
  }, [sortedPareto, safeObjectives]);


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
    return <p className="text-sm text-gray-500">{t("recommendations.smart.noParetoIssues")}</p>;
  }



  return (
    <div className="space-y-6">
        {/* 🔥 HEADER */}
          {activeObjective && (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-orange-800">
                 {t("recommendations.smart.mainIssue", {
                    issue: activeObjective.pareto_cause?.[i18n.language],
                  })}
                </p>

                <p className="text-xs text-orange-600 mt-0.5">
                  {t("recommendations.smart.negativeReviews", {
                    percentage: Math.round(activeObjective.pareto_percentage ?? 0),
                  })}
                </p>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={isUpdating || !activeEstablishmentId}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    {t("recommendations.smart.updating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    {t("recommendations.smart.updateSmart")}
                  </>
                )}
              </Button>
            </div>
          )}
    
      {/* If questionare for active is not filled */}
      {/* 🚨 Questionnaire missing */}
        {!activeObjective && nextIssue && (
          <div className="flex items-start justify-between bg-red-50 border border-red-200 rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-red-800">
                {t("recommendations.smart.questionnaireMissing")}
              </p>

              <p className="text-sm text-red-700 mt-1">
                {t("recommendations.smart.completeQuestionnaireFor", {
                issue: nextIssue.name,
              })}
              </p>
            </div>
          </div>
        )}

        {/* ✅ All objectives completed */}
        {!activeObjective && !nextIssue && (
          <div className="flex items-start justify-between bg-green-50 border border-green-200 rounded-xl p-4">
            <div>
              <p className="text-sm font-semibold text-green-800">
                {t("recommendations.smart.noIssuesLeft")}
              </p>

              <p className="text-sm text-green-700 mt-1">
                 {t("recommendations.smart.allObjectivesCompleted")}
              </p>
            </div>
          </div>
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
            {t("recommendations.smart.nextObjectives")}
          </h3>

          <div className="space-y-2">
            {pendingObjectives.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50"
              >
                <p className="text-sm text-gray-700">
                  {o.pareto_cause?.[i18n.language]}
                </p>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {t("recommendations.smart.todo")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  COMPLETED */}
      {completedObjectives.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-600 mb-2">
              {t("recommendations.smart.completedObjectives")}
          </h3>

          <div className="space-y-2">
            {completedObjectives.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-green-50"
              >
                <p className="text-sm text-green-700">
                  {o.pareto_cause?.[i18n.language]}
                </p>
                <span>✓</span>
              </div>
            ))}
          </div>
        </div>
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
        paretoCause={activeObjective?.pareto_cause?.[i18n.language] ?? ""}
        activeObjective ={activeObjective}
      />
    </div>
  );
}