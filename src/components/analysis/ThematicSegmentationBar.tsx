import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { Check, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { computeRange } from "@/utils/filterReviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Logo Google en couleurs officielles (SVG inline)
const GoogleLogo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const SOURCE_OPTIONS = [
  { value: "google", label: "Google", enabled: true },
  { value: "trustpilot", label: "Trustpilot", enabled: false },
  // { value: "facebook", label: "Facebook", enabled: false },
  // { value: "yelp", label: "Yelp", enabled: false },
  // { value: "tripadvisor", label: "Tripadvisor", enabled: false },
] as const;

export function ThematicSegmentationBar() {
  const { t } = useTranslation();
  const {
    ratingFilter,
    setRatingFilter,
    periodFilter,
    setPeriodFilter,
    sourceFilter,
    setSourceFilter,
    filteredReviews,
    totalReviews,
    availableSources,
    minReviewDate,
  } = useAnalysisFilters();

  const isLowData = filteredReviews.length > 0 && filteredReviews.length < 3;
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const [periodBeforeCustom, setPeriodBeforeCustom] = useState<typeof periodFilter | null>(null);

  // Pending filters (applied only when user clicks "Valider")
  const [pendingRatingFilter, setPendingRatingFilter] = useState(ratingFilter);
  const [pendingSourceFilter, setPendingSourceFilter] = useState(sourceFilter);
  const [pendingPeriodFilter, setPendingPeriodFilter] = useState(periodFilter);

  const isDirty = useMemo(() => {
    const sameRating = pendingRatingFilter === ratingFilter;
    const sameSource = pendingSourceFilter === sourceFilter;
    const samePreset = pendingPeriodFilter.preset === periodFilter.preset;
    const sameStart =
      (pendingPeriodFilter.startDate?.getTime?.() ?? null) ===
      (periodFilter.startDate?.getTime?.() ?? null);
    const sameEnd =
      (pendingPeriodFilter.endDate?.getTime?.() ?? null) ===
      (periodFilter.endDate?.getTime?.() ?? null);
    return !(sameRating && sameSource && samePreset && sameStart && sameEnd);
  }, [
    pendingPeriodFilter.endDate,
    pendingPeriodFilter.preset,
    pendingPeriodFilter.startDate,
    pendingRatingFilter,
    pendingSourceFilter,
    periodFilter.endDate,
    periodFilter.preset,
    periodFilter.startDate,
    ratingFilter,
    sourceFilter,
  ]);

  const hasCustomApplied =
    periodFilter.preset === "custom" &&
    !!periodFilter.startDate &&
    !!periodFilter.endDate;

  const hasPendingCustom =
    pendingPeriodFilter.preset === "custom" &&
    !!pendingPeriodFilter.startDate &&
    !!pendingPeriodFilter.endDate;

  const customRangeLabel = useMemo(() => {
    if (!periodFilter.startDate || !periodFilter.endDate) return t("dashboard.customFilter");
    return `${format(periodFilter.startDate, "dd/MM/yyyy", { locale: fr })}  – ${format(periodFilter.endDate, "dd/MM/yyyy", { locale: fr })}`;
  }, [periodFilter.endDate, periodFilter.startDate, t]);

  const pendingCustomRangeLabel = useMemo(() => {
    if (!pendingPeriodFilter.startDate || !pendingPeriodFilter.endDate) return t("dashboard.customFilter");
    return `${format(pendingPeriodFilter.startDate, "dd/MM/yyyy", { locale: fr })}  – ${format(pendingPeriodFilter.endDate, "dd/MM/yyyy", { locale: fr })}`;
  }, [pendingPeriodFilter.endDate, pendingPeriodFilter.startDate, t]);

  useEffect(() => {
    // Sync pending with applied values when there are no unsaved changes
    if (!isDirty) {
      setPendingRatingFilter(ratingFilter);
      setPendingSourceFilter(sourceFilter);
      setPendingPeriodFilter(periodFilter);
    }
  }, [isDirty, periodFilter, ratingFilter, sourceFilter]);

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setPeriodBeforeCustom(pendingPeriodFilter);
      setPendingPeriodFilter((prev) => ({ ...(prev as any), preset: "custom" } as any));
      setDraftRange({
        from: pendingPeriodFilter.startDate ?? undefined,
        to: pendingPeriodFilter.endDate ?? undefined,
      });
      setIsCustomOpen(true);
      return;
    }

    setIsCustomOpen(false);
    setPeriodBeforeCustom(null);

    if (value === "all") {
      const range = computeRange("all");
      setPendingPeriodFilter({ preset: "all", startDate: range.start, endDate: range.end } as any);
      return;
    }

    if (value === "30d") {
      const range = computeRange("30d");
      setPendingPeriodFilter({ preset: "30d", startDate: range.start, endDate: range.end } as any);
      return;
    }

    if (value === "90d") {
      const range = computeRange("90d");
      setPendingPeriodFilter({ preset: "90d", startDate: range.start, endDate: range.end } as any);
      return;
    }

    if (value === "12m") {
      const range = computeRange("12m");
      setPendingPeriodFilter({ preset: "12m", startDate: range.start, endDate: range.end } as any);
      return;
    }
  };

  const handleSourceChange = (value: string) => {
    const opt = SOURCE_OPTIONS.find((o) => o.value === value);
    if (!opt || !opt.enabled) return;
    setPendingSourceFilter(opt.value);
  };

  const handleReset = () => {
    // Reset pending + applied (comportement existant conservé)
    setPendingRatingFilter("ALL");
    setPendingPeriodFilter({ preset: "all", startDate: null, endDate: null } as any);
    setPendingSourceFilter("google");
    setRatingFilter("ALL");
    setPeriodFilter({ preset: "all", startDate: null, endDate: null });
    setSourceFilter("google");
    setIsCustomOpen(false);
    setDraftRange(undefined);
  };

  const handleValidate = () => {
    setRatingFilter(pendingRatingFilter as any);
    setPeriodFilter(pendingPeriodFilter as any);
    setSourceFilter(pendingSourceFilter as any);
    setIsCustomOpen(false);
  };

 const ratingLabel =
    ratingFilter === "POS"
      ? "4–5⭐"
      : ratingFilter === "NEU"
      ? "3⭐"
      : ratingFilter === "NEG"
      ? "1–2⭐"
      : t("dashboard.allFilter");

  const periodLabel =
    periodFilter.preset === "30d"
      ? t("dashboard.days30")
      : periodFilter.preset === "90d"
      ? t("dashboard.days90")
      : periodFilter.preset === "12m"
      ? t("dashboard.months12")
      : periodFilter.preset === "custom"
      ? customRangeLabel
      : t("dashboard.allTime");

  const currentSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === sourceFilter);
  const sourceLabel = currentSourceOption ? currentSourceOption.label : t("dashboard.sourceFilter");

  return (
    <div className="mb-6 rounded-lg border border-transparent dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm dark:shadow-slate-950/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("dashboard.analysisContext")}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("dashboard.analysisBasedOn")}{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {filteredReviews.length}
            </span>{" "}
            {t("dashboard.reviews")}
          </p>
          {minReviewDate && (
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {t("dashboard.sinceDate")}{" "}
              {minReviewDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 md:flex-1 md:justify-center">
          {/* Filtres de note */}
          <div className="flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-1 py-1">
            {[
              { key: "ALL", label: t("dashboard.allFilter") },
             { key: "POS", label: "4–5⭐" },
              { key: "NEU", label: "3⭐" },
              { key: "NEG", label: "1–2⭐" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setPendingRatingFilter(opt.key as any)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ease-in-out ${
                  pendingRatingFilter === opt.key
                    ? "bg-blue-600 text-white border-blue-600/30 shadow-sm hover:bg-[#1e4fc9]"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-slate-900 dark:hover:text-slate-100 hover:border-blue-200 dark:hover:border-blue-900/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filtre période */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t("dashboard.periodFilter")} :</span>
            <select
              value={pendingPeriodFilter.preset}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
            >
              <option value="all">{t("dashboard.allTime")}</option>
              <option value="30d">{t("dashboard.days30")}</option>
              <option value="90d">{t("dashboard.days90")}</option>
              <option value="12m">{t("dashboard.months12")}</option>
              <option value="custom">{hasPendingCustom ? pendingCustomRangeLabel : t("dashboard.customFilter")}</option>
            </select>
          </div>

          {/* Filtre source */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t("dashboard.sourceFilter")} :</span>
            <Select value={pendingSourceFilter} onValueChange={handleSourceChange}>
              <SelectTrigger
                className={`h-8 w-[140px] rounded-md border px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors duration-200 ease-in-out flex items-center gap-2 ${
                  pendingSourceFilter === "google"
                    ? "bg-blue-600 text-white border-blue-600/30 hover:bg-[#1e4fc9]"
                    : "bg-white dark:bg-slate-900 text-blue-950 dark:text-blue-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900/60"
                }`}
              >
                {pendingSourceFilter === "google" && (
                  <GoogleLogo className="h-4 w-4 flex-shrink-0" />
                )}
                <SelectValue placeholder={t("dashboard.sourceFilter")} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-md">
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    disabled={!opt.enabled}
                    className="text-xs data-[disabled]:text-slate-400 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none data-[disabled]:opacity-100"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton Valider */}
          <button
            type="button"
            onClick={handleValidate}
            disabled={!isDirty}
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold shadow-sm transition-colors duration-200 ease-in-out ${
              isDirty
                ? "border-blue-600/30 bg-blue-600 text-white hover:bg-[#1e4fc9]"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 shadow-none"
            }`}
            title={!isDirty ? t("dashboard.noChangesToApply") : t("dashboard.applySelectedFilters")}
          >
            <Check className="h-3.5 w-3.5" />
            {t("dashboard.validate")}
          </button>

          {/* Bouton Réinitialiser */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300 shadow-sm transition-colors duration-200 ease-in-out hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-200 hover:border-blue-300 dark:hover:border-blue-900/70"
          >
            <RotateCcw className="h-3 w-3" />
            {t("dashboard.reset")}
          </button>
        </div>
      </div>

      {/* RÃ©sumÃ© compact */}
      <div className="mt-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        {t("dashboard.selection")} : {ratingLabel} · {periodLabel} · {sourceLabel}
      </div>

      {/* Date range picker (PersonnalisÃ©â€¦) */}
      {isCustomOpen && (
        <div className="mt-3 rounded-lg border border-transparent dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm dark:shadow-slate-950/40">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{t("dashboard.customPeriodTitle")}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t("dashboard.customPeriodDescription")}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 md:mt-0">
              <button
                type="button"
                onClick={() => {
                  setIsCustomOpen(false);
                  setDraftRange(undefined);
                  if (periodBeforeCustom) {
                    setPendingPeriodFilter(periodBeforeCustom as any);
                    setPeriodBeforeCustom(null);
                  }
                }}
                className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors duration-200 ease-in-out hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-950 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-900/60"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={!draftRange?.from || !draftRange?.to}
                onClick={() => {
                  if (!draftRange?.from || !draftRange?.to) return;
                  const range = computeRange("custom", draftRange.from, draftRange.to);
                  setPendingPeriodFilter({
                    preset: "custom",
                    startDate: range.start,
                    endDate: range.end,
                  });
                  setIsCustomOpen(false);
                  setPeriodBeforeCustom(null);
                }}
                className="inline-flex items-center rounded-md border border-blue-900/30 bg-blue-900 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 ease-in-out hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("dashboard.apply")}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draftRange}
              onSelect={setDraftRange}
              disabled={{ after: new Date() }}
              defaultMonth={draftRange?.from ?? new Date()}
            />
          </div>
        </div>
      )}

      {isLowData && (
        <div className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
          {t("dashboard.limitedDataCaution")}
        </div>
      )}

      {filteredReviews.length === 0 && periodFilter.preset !== "all" && (
        <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          {t("dashboard.noReviewsForSelectedPeriod")}
        </div>
      )}
    </div>
  );
}
