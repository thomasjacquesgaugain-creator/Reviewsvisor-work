// src/components/reviews/SmartGenerateModal.tsx

import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Check, X,
  CalendarDays, Pencil,
  Loader,
  Sparkles,
  ChevronDown,
  ChevronUp,
 
} from "lucide-react";
import type { ReviewFrequency, SmartObjective } from "@/types/smart";
import { useEffect, useState } from "react";
import i18n from "@/i18n/config";
import { DatePicker } from "@/components/ui/date-picker";
import { differenceInCalendarDays, differenceInMonths, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  currentDraft: SmartObjective | null;
  isGenerating: boolean;
  isSaving: boolean;
  updateDraft: (updates: Partial<SmartObjective>) => void;
  paretoCause: string;
  updating?: any;
  activeObjective?: SmartObjective;
}

const getLocalizedText = (value: any, language = "en"): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object")
    return value[language] || value.en || value.fr || Object.values(value)[0] || "";
  return String(value);
};

const updateLocalizedValue = (existing: any, value: string, lang: "en" | "fr") => ({
  ...(typeof existing === "object" && existing ? existing : {}),
  [lang]: value,
});

const localeMap: Record<string, any> = { fr, en: enUS };

function SectionHeader({
  letter,
  badgeBg,
  title,
  subtitle,
  subtitleColor = "text-violet-500",
}: {
  letter: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  subtitleColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${badgeBg}`}
      >
        {letter}
      </span>
      <div className="flex flex-col min-w-0 pt-0.5">
        <span className="text-sm font-bold text-gray-900 leading-tight dark:text-slate-100">
          {title}
        </span>
        <span className={`text-xs font-normal leading-tight mt-0.5 ${subtitleColor} dark:text-slate-400`}>
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function EditableTextarea({
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-none text-sm text-gray-800 border border-gray-200 rounded-xl
                   focus:border-violet-300 focus:ring-1 focus:ring-violet-200
                   pr-8 bg-white leading-relaxed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:ring-violet-500/30"
      />
      <Pencil className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 text-gray-300 dark:text-slate-600
                         opacity-0 group-focus-within:opacity-100
                         transition-opacity pointer-events-none" />
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-100 my-5" />;
}

export function SmartGenerateModal({
  open, onClose, onSave,
  currentDraft, isGenerating, isSaving,
  updateDraft, paretoCause, updating, activeObjective,
}: Props) {
  const { t } = useTranslation();
  const lang = (i18n.language?.startsWith("fr") ? "fr" : "en") as "en" | "fr";
  const locale = localeMap[lang] || enUS;

  const [showSmartDetail, setShowSmartDetail] = useState(false);

  const REVIEW_FREQUENCY_OPTIONS: { value: ReviewFrequency; labelKey: string; defaultLabel: string }[] = [
  { value: "every_week",     labelKey: "smartCard.temporal.reviewFrequency.every_week",     defaultLabel: "Every week" },
  { value: "every_2_weeks",  labelKey: "smartCard.temporal.reviewFrequency.every_2_weeks",  defaultLabel: "Every 2 weeks" },
  { value: "every_4_weeks",  labelKey: "smartCard.temporal.reviewFrequency.every_4_weeks",  defaultLabel: "Every 4 weeks" },
  { value: "every_3_months", labelKey: "smartCard.temporal.reviewFrequency.every_3_months", defaultLabel: "Every 3 months" },
];

  useEffect(() => {
    if (open && updating && activeObjective) {
      updateDraft(activeObjective);
    }
  }, [open, updating, activeObjective, updateDraft]);

  const draftData = currentDraft;
  if (!open) return null;

  const impactLabel = draftData ? t(`recommendations.smart.impactValues.${draftData.impact?.toLowerCase()}`, { defaultValue: draftData.impact ?? "" }) : "";
  const quadrantLabel = draftData ? t(`recommendations.smart.quadrantValues.${draftData.quadrant}`, { defaultValue: draftData.quadrant ?? "" }) : "";
  const todayFmt = format(new Date(), "dd-MM-yyyy");

  const currentVal = draftData?.current_value ?? 0;
  const targetVal = draftData?.target_value ?? 0;
  const improvementPct = currentVal > 0
    ? Math.round(((targetVal - currentVal) / currentVal) * 100)
    : 0;

  const unitLabel = getLocalizedText(draftData?.unit, lang)
    || t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "negative reviews / month" });

  const AchievableSection = (
    <div style={{ borderTopColor: "#22C55E" }}
      className="rounded-[10px] border border-grey-400 p-4 border-t-4 mt-4 mb-4 dark:border-slate-700 dark:bg-slate-900/60">
      <SectionHeader
        letter="A"
        badgeBg="bg-green-500"
        title={t("smartCard.goalSections.Achievable")}
        subtitle={t("recommendations.smart.whereToStart", { defaultValue: "How do you measure progress?" })}
        subtitleColor="text-slate-500" />
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.current", { defaultValue: "Current situation" })}
            </Label>
            <Input
              type="number"
              value={draftData?.current_value ?? ""}
              onChange={(e) => updateDraft({ current_value: Number(e.target.value) })}
              className="text-sm bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 truncate dark:text-slate-500">{unitLabel}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.target", { defaultValue: "Target" })}
              {draftData?.target_source === "computed" && (
                <span className="ml-1 text-[10px] text-gray-400 italic dark:text-slate-500">
                  {t("recommendations.smart.auto", { defaultValue: "(auto)" })}
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={draftData?.target_value ?? ""}
              onChange={(e) => updateDraft({ target_value: Number(e.target.value), target_source: "user_adjusted" })}
              className="text-sm bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 truncate dark:text-slate-500">{unitLabel}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.targetImprovement", { defaultValue: "Target Improvement" })}
            </Label>
            <div className={`flex bg-white items-center justify-between px-3 h-9 rounded-md border text-sm font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 ${improvementPct <= 0 ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/40 dark:text-green-300" : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300"
              }`}>
              {improvementPct > 0 ? "+" : ""}{improvementPct}%
            <p className="text-[10px] text-gray-400 mt-0.5 text-center dark:text-slate-500">
              {t("recommendations.smart.autoCalculated", { defaultValue: "auto-calculated" })}
            </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-green-50 border border-green-100 px-3 py-2.5 dark:border-green-900/40 dark:bg-green-950/20">
          <div className="flex gap-2">
            <Loader className="w-2.5 h-2.5 text-purple-600" />
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mb-1 dark:text-green-300">
            {t("recommendations.smart.aiJustification", { defaultValue: "AI Justification" })}
          </p>
            </div>
          <p className="text-xs text-green-800 leading-relaxed dark:text-green-200">
            {getLocalizedText(draftData?.ai_justification, lang) || "—"}
          </p>
        </div>
      </div>
    </div>
  );

  const TimeBoundSection = (
    <div style={{ borderTopColor: "#FB923C" }}
      className="rounded-[10px] border border-grey-400 p-4 border-t-4 dark:border-slate-700 dark:bg-slate-900/60">
      <SectionHeader
        letter="T"
        badgeBg="bg-orange-400"
        title={t("smartCard.goalSections.Timebound")}
        subtitle={t("recommendations.smart.byWhen", { defaultValue: "By when and with what review cadence?" })}
        subtitleColor="text-slate-500" />
      <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.startDate", { defaultValue: "Start date" })}
            </Label>
            <DatePicker
              value={draftData?.created_at}
              onChange={(date) => updateDraft({ deadline: date, deadline_source: "user_adjusted" })}
              className="text-sm"
              disabled
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.targetDate", { defaultValue: "Target date" })}
            </Label>
            <DatePicker
              value={draftData?.deadline}
              onChange={(date) => {
                const start = draftData?.created_at ? new Date(draftData.created_at) : new Date();
                const months = Math.max(1, Math.ceil(differenceInCalendarDays(new Date(date), start) / 30));
                updateDraft({
                  deadline: date,
                  deadline_source: "user_adjusted",
                  duration_months: months,
                });
              }}
              className="text-sm"
              disablePastDates
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
              {t("recommendations.smart.durationMonths", { defaultValue: "Duration (months)" })}
            </Label>
            <div className={`flex bg-white items-center justify-between px-3 h-9 rounded-md border text-sm font-bold text-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-violet-300`}>
              {draftData?.duration_months ?? ""}
            <p className="text-[10px] text-gray-400 mt-0.5 text-center dark:text-slate-500">
              {t("recommendations.smart.autoCalculated", { defaultValue: "auto-calculated" })}
            </p>
            </div>
          </div>

  <div>
          <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
            {t("recommendations.smart.reviewFrequency", { defaultValue: "Review frequency" })}
          </Label>
          <Select
            value={draftData?.review_frequency ?? "every_4_weeks"}
            onValueChange={(value) =>
              updateDraft({ review_frequency: value as ReviewFrequency })
            }
          >
            <SelectTrigger className="h-9 text-sm bg-white border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <SelectValue>
                {t(
                  `smartCard.temporal.reviewFrequency.${draftData?.review_frequency ?? "every_4_weeks"}`,
                  { defaultValue: draftData?.review_frequency ?? "Every 4 weeks" }
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REVIEW_FREQUENCY_OPTIONS.map(({ value, labelKey, defaultLabel }) => (
                <SelectItem key={value} value={value} className="text-sm">
                  {t(labelKey, { defaultValue: defaultLabel })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full h-[92vh] p-0 gap-0 rounded-2xl border-0 shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-white z-10 shrink-0 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Loader className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
              {t("recommendations.smart.modalTitle", { defaultValue: "Define goal SMART" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full font-medium dark:bg-violet-950/30 dark:border-violet-900/40 dark:text-violet-300">
              <CalendarDays className="h-3 w-3" />
              {todayFmt}
            </span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {isGenerating && !updating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-gray-500 text-center dark:text-slate-400">
              {t("recommendations.smart.generating", { cause: paretoCause })}
            </p>
          </div>
        )}

        {!isGenerating && draftData && (
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-white dark:bg-slate-900">

            <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-4 mb-5 dark:border-violet-900/40 dark:bg-violet-950/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-700">
                  {t("recommendations.smart.contextAnalyzed", {
                    defaultValue: "Context analyzed by AI",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">

                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap dark:text-slate-500">
                    {t("recommendations.smart.issue", { defaultValue: "Issue" })}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-[7px] w-[7px] rounded-full bg-red-500 shrink-0" />
                    <span className="text-[13px] font-semibold text-slate-900 truncate dark:text-slate-100">
                      {paretoCause || "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap dark:text-slate-500">
                    {t("recommendations.smart.impact", { defaultValue: "Impact" })}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`h-[7px] w-[7px] rounded-full shrink-0 ${draftData.impact?.toLowerCase() === "high" ? "bg-red-500" :
                        draftData.impact?.toLowerCase() === "medium" ? "bg-orange-500" : "bg-green-500"
                      }`} />
                    <span className={`text-[13px] font-semibold ${draftData.impact?.toLowerCase() === "high" ? "text-red-600 dark:text-red-300" :
                        draftData.impact?.toLowerCase() === "medium" ? "text-orange-600 dark:text-orange-300" : "text-green-600 dark:text-green-300"
                      }`}>
                      {impactLabel || "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap pt-[2px] dark:text-slate-500">
                    {t("recommendations.smart.paretoSource", { defaultValue: "Pareto Source" })}
                  </span>
                  <span className="text-[13px] font-medium text-slate-900 leading-[1.4] dark:text-slate-100">
                    {draftData.pareto_percentage != null
                      ? t("recommendations.smart.negativeReviews", { percentage: Math.round(draftData.pareto_percentage) })
                      : "—"}

                  </span>
                </div>

                <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap pt-[2px] dark:text-slate-500">
                    {t("recommendations.smart.cause", { defaultValue: "Cause (Ishikawa)" })}
                  </span>
                  <span className="text-[13px] font-medium text-slate-900 leading-[1.4] dark:text-slate-100">
                    {getLocalizedText(draftData.ishikawa_top_category, lang) || quadrantLabel || "—"}
                  </span>
                </div>

              </div>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 mb-4 dark:border-violet-900/40 dark:bg-violet-950/20">

              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-700">
                  {t("recommendations.smart.goalProposed", { defaultValue: "Goal proposed by AI" })}
                </p>
              </div>

              <p className="text-xs text-black-900 leading-relaxed font-medium dark:text-slate-100">
                {getLocalizedText(draftData.relevance_note, lang) || "—"}
              </p>
              {draftData.actions?.[0] && (
                <div className="mt-2 px-2 py-2 bg-white rounded-[10px] border border-violet-200 dark:border-violet-900/40 dark:bg-slate-900">
                  <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest mb-1">
                    {t("recommendations.smart.mainAction", { defaultValue: "Main action" })}
                  </p>
                  <p className="text-[11px] text-black-800 dark:text-slate-100">
                    {getLocalizedText(draftData.actions[0]?.text ?? draftData.actions[0], lang)}
                  </p>
                </div>
              )}
            </div>

            {showSmartDetail && (
              <div>
                <div style={{ borderTopColor: "#3B82F6" }}
                  className=" rounded-[10px] border border-grey-400 p-4 border-t-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <SectionHeader
                    letter="S"
                    badgeBg="bg-blue-500"
                    title={t("smartCard.goalSections.specific", { defaultValue: "Specific" })}
                    subtitle={t("recommendations.smart.whichIssue", { defaultValue: "Which issue, which action?" })}
                    subtitleColor="text-slate-500"
                  />

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5 dark:text-slate-300">
                        {t("recommendations.smart.issueToSolve", { defaultValue: "Issue to solve" })}
                      </p>
                      <EditableTextarea
                        value={getLocalizedText(draftData.problem, lang)}
                        onChange={(v) =>
                          updateDraft({ problem: updateLocalizedValue(draftData.problem, v, lang) })
                        }
                        rows={3}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5 dark:text-slate-300">
                        {t("recommendations.smart.recommendedMainAction", {
                          defaultValue: "Recommended main action",
                        })}
                      </p>
                      <EditableTextarea
                        value={getLocalizedText(
                          draftData.actions?.[0]?.text ?? draftData.actions?.[0],
                          lang
                        )}
                        onChange={(v) => {
                          const updated = [...(draftData.actions ?? [])];
                          if (updated[0])
                            updated[0] = {
                              ...updated[0],
                              text: updateLocalizedValue(updated[0].text, v, lang),
                            };
                          updateDraft({ actions: updated });
                        }}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Divider />

                 <div style={{ borderTopColor: "#EC4899" }}
                  className=" rounded-[10px] border border-grey-400 p-4 border-t-4 dark:border-slate-700 dark:bg-slate-900/60">
                <SectionHeader letter="M"
                badgeBg="bg-pink-500"
                title={t("smartCard.goalSections.Measurable")}
                subtitle={t("recommendations.smart.howToMeasure", { defaultValue: "How do you measure progress?" })}
                subtitleColor="text-slate-500" />
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500  mb-1.5 block dark:text-slate-400">
                      {t("recommendations.smart.trackingIndicator", { defaultValue: "Tracking Indicator" })}
                    </Label>
                    <Input
                      value={getLocalizedText(draftData.kpi_label, lang)}
                      onChange={(e) => updateDraft({ kpi_label: updateLocalizedValue(draftData.kpi_label, e.target.value, lang) })}
                      className="text-sm bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
                        {t("recommendations.smart.unitOfMeasurement", { defaultValue: "Unit of measurement" })}
                      </Label>
                      <Input
                        value={getLocalizedText(draftData.unit, lang)}
                        onChange={(e) => updateDraft({ unit: updateLocalizedValue(draftData.unit, e.target.value, lang) })}
                        className="text-sm bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder={t("smartCard.goalSections.negativeReviewsMonth", { defaultValue: "negative reviews / month" })}
                      />
                    </div>
                </div>
                </div>

                <Divider />

                {AchievableSection}

                <Divider />

                  <div style={{ borderTopColor: "#A855F7" }}
                  className=" rounded-[10px] border border-grey-400 p-4 border-t-4 dark:border-slate-700 dark:bg-slate-900/60">
                <SectionHeader letter="R" 
                badgeBg="bg-purple-500"
                 title={t("smartCard.goalSections.relevant")}
                 subtitle={t("recommendations.smart.WhyGoalMatter", { defaultValue: "Why does this goal matter?" })}
                  subtitleColor="text-slate-500" />
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block dark:text-slate-400">
                      {t("recommendations.smart.whyImportant", { defaultValue: "Why is this goal important?" })}
                    </Label>
                    <EditableTextarea
                      value={getLocalizedText(draftData.relevance_note, lang)}
                      onChange={(v) => updateDraft({ relevance_note: updateLocalizedValue(draftData.relevance_note, v, lang) })}
                      rows={2}
                    />
                    <Label className="text-xs text-gray-500 mb-1.5 mt-1.5 block dark:text-slate-400">
                      {t("smartCard.expectedResult", { defaultValue: "Expected result" })}
                    </Label>
                    <EditableTextarea
                      value={getLocalizedText(draftData.expected_result, lang)}
                      onChange={(v) => updateDraft({ expected_result: updateLocalizedValue(draftData.expected_result, v, lang) })}
                      rows={2}
                    />
                  </div>
                </div>
                </div>

                <Divider />

                {TimeBoundSection}

              </div>
            )}

            {!showSmartDetail && (
              <div className="space-y-0">
                {AchievableSection}
                <Divider />
                {TimeBoundSection}
              </div>
            )}

            <div className="flex items-center justify-center mt-5 mb-2">
            <button
              type="button"
              onClick={() => setShowSmartDetail((v) => !v)}
              className="flex p-2 rounded-[6px] items-center justify-center border border-grey-600 w-full items-center gap-1 text-[11px] text-violet-700 hover:bg-violet-100 hover:text-gray-600 transition-colors dark:border-slate-700 dark:text-violet-300 dark:hover:bg-slate-800 dark:hover:text-violet-200"
            >
                {showSmartDetail?<ChevronUp className="h-4 w-4 text-gray-500 dark:text-slate-400" />:<ChevronDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />}
                {showSmartDetail
                  ? `${t("recommendations.smart.hideDetail", { defaultValue: "Hide SMART detail" })}`
                  : `${t("recommendations.smart.showDetail", { defaultValue: "Show SMART detail" })}`}
              </button>
            </div>

          </div>
        )}

        {!isGenerating && draftData && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 flex items-end justify-between gap-2 shrink-0 dark:border-slate-800 dark:bg-slate-900">
            {/* <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs text-violet-600 border-violet-200 hover:bg-violet-50 gap-1.5"
              onClick={() => {}}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("recommendations.smart.regenerate", { defaultValue: "Regenerate with AI" })}
            </Button> */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {t("recommendations.smart.cancel", { defaultValue: "Cancel" })}
              </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5 px-4 dark:bg-violet-500 dark:hover:bg-violet-400"
              >
                {isSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("recommendations.smart.saving", { defaultValue: "Saving…" })}</>
                ) : (
                  <><Check className="h-3.5 w-3.5" />{t("recommendations.smart.validateGoal", { defaultValue: "Validate the goal" })}</>
                )}
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
