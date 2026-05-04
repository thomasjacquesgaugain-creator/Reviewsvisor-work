// src/components/reviews/SmartGenerateModal.tsx

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check } from "lucide-react";
import type { SmartObjective } from "@/types/smart";
import { useEffect } from "react";

interface Props {
  open:          boolean;
  onClose:       () => void;
  onSave:        () => void;
  currentDraft:  SmartObjective | null;
  isGenerating:  boolean;
  isSaving:      boolean;
  updateDraft:   (updates: Partial<SmartObjective>) => void;
  paretoCause:   string;
  updating?:      any;
  activeObjective?: SmartObjective
}

export function SmartGenerateModal({
  open, onClose, onSave,
  currentDraft, isGenerating, isSaving,
  updateDraft, paretoCause, updating , activeObjective
}: Props) {

  useEffect(() => {
  if (updating && activeObjective) {
    updateDraft(activeObjective);
  }
}, [updating, activeObjective]);

const draftData = currentDraft;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            SMART Objective Generator
          </DialogTitle>
        </DialogHeader>

        {/* Generating state */}
        {isGenerating && !updating && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">
              Generating SMART objective for "{paretoCause}"...
            </p>
          </div>
        )}

        {/* Draft ready — review & edit */}
        {!isGenerating && draftData && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              ✨ AI has generated this objective. Review and adjust before saving.
            </p>

            {/* Computed values — read only, shown for transparency */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 text-xs">
              <div>
                <p className="text-gray-400">Impact</p>
                <p className="font-semibold text-gray-700">{draftData.impact}</p>
              </div>
              <div>
                <p className="text-gray-400">Effort</p>
                <p className="font-semibold text-gray-700">
                  {draftData.effort}
                  {draftData.effort_source === "user_questionnaire" && (
                    <span className="ml-1 text-green-600">(validated)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Quadrant</p>
                <p className="font-semibold text-gray-700">{draftData.quadrant?.replace("_", " ")}</p>
              </div>
            </div>

            {/* S — Specific */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">
                S — Specific (Problem to solve)
              </Label>
              <Textarea
                value={draftData.problem}
                onChange={(e) => updateDraft({ problem: e.target.value })}
                className="mt-1.5 text-sm"
                rows={2}
              />
            </div>

            {/* M — Measurable */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">
                M — Measurable
              </Label>
              <Input
                value={draftData.kpi_label}
                onChange={(e) => updateDraft({ kpi_label: e.target.value })}
                placeholder="KPI name"
                className="mt-1.5 text-sm mb-2"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Current</Label>
                  <Input
                    type="number"
                    value={draftData.current_value}
                    onChange={(e) =>
                      updateDraft({ current_value: Number(e.target.value) })
                    }
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Target
                    {draftData.target_source === "computed" && (
                      <span className="ml-1 text-gray-400">(auto)</span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    value={draftData.target_value}
                    onChange={(e) =>
                      updateDraft({
                        target_value:  Number(e.target.value),
                        target_source: "user_adjusted",
                      })
                    }
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Unit</Label>
                  <Input
                    value={draftData.unit}
                    onChange={(e) => updateDraft({ unit: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* T — Temporal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  T — Deadline
                </Label>
                <Input
                  type="date"
                  value={draftData.deadline?.split("T")[0]}
                  onChange={(e) =>
                    updateDraft({
                      deadline:        e.target.value,
                      deadline_source: "user_adjusted",
                    })
                  }
                  className="mt-1.5 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  Duration (months)
                </Label>
                <Input
                  type="number"
                  value={draftData.duration_months}
                  onChange={(e) =>
                    updateDraft({ duration_months: Number(e.target.value) })
                  }
                  className="mt-1.5 text-sm"
                  min={1}
                  max={12}
                />
              </div>
            </div>

            {/* R — Relevant */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">
                R — Why it matters
              </Label>
              <Textarea
                value={draftData.relevance_note ?? ""}
                onChange={(e) => updateDraft({ relevance_note: e.target.value })}
                className="mt-1.5 text-sm"
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Objective
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}