// src/components/reviews/ChecklistConfigureModal.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, PencilIcon } from "lucide-react";
import type { SmartAction, ScheduleType, ActionFrequency } from "@/types/smart";

const getLocalizedText = (value: any, lang: string): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.en || "";
};

interface Props {
  open: boolean;
  onClose: () => void;
  actions: SmartAction[];
  objectiveName: string;
  lang: string;
  onSave: (updatedActions: SmartAction[]) => Promise<void>;
}

export function ChecklistConfigureModal({ open, onClose, actions, objectiveName, lang, onSave }: Props) {
  const { t } = useTranslation();

  const SCHEDULE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    daily: [
      { value: "start_of_day", label: t("recommendations.smart.checklist.schedule.daily.startOfDay") },
      { value: "during_activity", label: t("recommendations.smart.checklist.schedule.daily.duringActivity") },
      { value: "end_of_day", label: t("recommendations.smart.checklist.schedule.daily.endOfDay") },
      { value: "custom_time", label: t("recommendations.smart.checklist.schedule.daily.customTime") },
    ],
    weekly: [
      { value: "monday", label: t("recommendations.smart.checklist.schedule.weekly.monday") },
      { value: "tuesday", label: t("recommendations.smart.checklist.schedule.weekly.tuesday") },
      { value: "wednesday", label: t("recommendations.smart.checklist.schedule.weekly.wednesday") },
      { value: "thursday", label: t("recommendations.smart.checklist.schedule.weekly.thursday") },
      { value: "friday", label: t("recommendations.smart.checklist.schedule.weekly.friday") },
      { value: "saturday", label: t("recommendations.smart.checklist.schedule.weekly.saturday") },
      { value: "sunday", label: t("recommendations.smart.checklist.schedule.weekly.sunday") },
    ],
    monthly: [
      { value: "start_of_month", label: t("recommendations.smart.checklist.schedule.monthly.startOfMonth") },
      { value: "mid_month", label: t("recommendations.smart.checklist.schedule.monthly.midMonth") },
      { value: "end_of_month", label: t("recommendations.smart.checklist.schedule.monthly.endOfMonth") },
      { value: "custom_date", label: t("recommendations.smart.checklist.schedule.monthly.customDate") },
    ],
  };

  const [draft, setDraft] = useState<SmartAction[]>(() => actions.map((a) => ({ ...a })));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(actions.map((a) => ({ ...a })));
    }
  }, [open, actions]);

  const updateSchedule = (index: number, schedule: string) => {
    setDraft((prev) =>
      prev.map((a, i) =>
        i === index
          ? {
            ...a,
            schedule: schedule as ScheduleType,
            schedule_value: schedule === "custom_time" || schedule === "custom_date"
              ? (a.schedule_value ?? "")
              : null,
          }
          : a
      )
    );
  };

  const updateScheduleValue = (index: number, value: string) => {
    setDraft((prev) =>
      prev.map((a, i) => (i === index ? { ...a, schedule_value: value } : a))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    onClose();
  };


  const grouped = (["daily", "weekly", "monthly"] as ActionFrequency[])
    .map((freq) => ({
      freq,
      items: draft
        .map((a, i) => ({ action: a, index: i }))
        .filter(({ action }) => action.frequency === freq),
    }))
    .filter(({ items }) => items.length > 0);

  const freqLabel: Record<string, string> = {
    daily: t("recommendations.smart.checklist.configure.dailyTasks", { defaultValue: "Daily Tasks" }),
    weekly: t("recommendations.smart.checklist.configure.weeklyTasks", { defaultValue: "Weekly Tasks" }),
    monthly: t("recommendations.smart.checklist.configure.monthlyTasks", { defaultValue: "Monthly Tasks" }),
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white">
        <DialogHeader>
          <div className="flex items-center gap-2 border-b p-4">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-sm">
              <PencilIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold">
                {t("recommendations.smart.checklistTitle", { defaultValue: "Configure la checklist" })}
                {" · "}
                <span>{objectiveName}</span>
              </DialogTitle>
            </div>
          </div>
          <p className="text-[13px] text-gray-600 m-4 p-3 bg-[#f3f1f7] rounded-[12px] border ">
            {t("recommendations.smart.checklistSubtitle", {
              defaultValue: "Customize each task according to your activity rhythm. Settings will be saved for this goal.",
            })}
          </p>
        </DialogHeader>

        <div className=" space-y-5 p-4">
          {grouped.map(({ freq, items }) => (
            <div key={freq}>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#dcfce7]">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-green-700">
                  {freqLabel[freq]}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {items.map(({ action, index }) => {
                  const options = SCHEDULE_OPTIONS[freq] ?? [];
                  const isCustom = action.schedule === "custom_time" || action.schedule === "custom_date";

                  return (
                    <div key={index} className="px-4 py-3 space-y-2 border border-gray-300 divide-gray-100 rounded-[12px]">
                      <div className="flex items-center gap-4">
                        <p className="flex-1 text-[13px] font-semibold leading-snug text-slate-800">
                          {getLocalizedText(action.text, lang)}
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={action.schedule}
                            onValueChange={(val) => updateSchedule(index, val)}
                          >
                            <SelectTrigger
                              className={`${isCustom ? "w-[160px]" : "w-[180px]"} h-9 text-xs bg-white`}
                            >
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              {options.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {isCustom && (
                            <Input
                              className="h-9 w-[160px] text-xs"
                              placeholder={
                                freq === "monthly"
                                  ? t(
                                    "recommendations.smart.checklist.configure.customDatePlaceholder",
                                    { defaultValue: "ex: 1er lundi" }
                                  )
                                  : t(
                                    "recommendations.smart.checklist.configure.customTimePlaceholder",
                                    { defaultValue: "ex: 14h00" }
                                  )
                              }
                              value={action.schedule_value ?? ""}
                              onChange={(e) => updateScheduleValue(index, e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 flex justify-between gap-2 p-4 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="">
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className=" bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving
              ? t("common.saving", { defaultValue: "Saving…" })
              : `✓ ${t("common.save", { defaultValue: "Save" })}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}