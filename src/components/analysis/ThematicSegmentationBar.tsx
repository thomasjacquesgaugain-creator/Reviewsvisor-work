import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  { value: "facebook", label: "Facebook", enabled: false },
  { value: "yelp", label: "Yelp", enabled: false },
  { value: "tripadvisor", label: "Tripadvisor", enabled: false },
] as const;

export function ThematicSegmentationBar() {
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
    if (!periodFilter.startDate || !periodFilter.endDate) return "Personnalisé…";
    return `${format(periodFilter.startDate, "dd/MM/yyyy", { locale: fr })} – ${format(periodFilter.endDate, "dd/MM/yyyy", { locale: fr })}`;
  }, [periodFilter.endDate, periodFilter.startDate]);

  const pendingCustomRangeLabel = useMemo(() => {
    if (!pendingPeriodFilter.startDate || !pendingPeriodFilter.endDate) return "Personnalisé…";
    return `${format(pendingPeriodFilter.startDate, "dd/MM/yyyy", { locale: fr })} – ${format(pendingPeriodFilter.endDate, "dd/MM/yyyy", { locale: fr })}`;
  }, [pendingPeriodFilter.endDate, pendingPeriodFilter.startDate]);

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
      : "Tous";

  const periodLabel =
    periodFilter.preset === "30d"
      ? "30 jours"
      : periodFilter.preset === "90d"
      ? "90 jours"
      : periodFilter.preset === "12m"
      ? "12 mois"
      : periodFilter.preset === "custom"
      ? customRangeLabel
      : "Toute la période";

  const currentSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === sourceFilter);
  const sourceLabel = currentSourceOption ? currentSourceOption.label : "Source";

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm md:sticky md:top-0 md:z-20">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Contexte d’analyse</h3>
          <p className="mt-1 text-xs text-gray-500">
            Analyse basée sur{" "}
            <span className="font-semibold text-gray-800">
              {filteredReviews.length}
            </span>{" "}
            avis
          </p>
          {minReviewDate && (
            <p className="mt-0.5 text-[11px] text-gray-400">
              Depuis le{" "}
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
          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-1 py-1">
            {[
              { key: "ALL", label: "Tous" },
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
                    : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-slate-900 hover:border-blue-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filtre période */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Période :</span>
            <select
              value={pendingPeriodFilter.preset}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="all">Toute la période</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
              <option value="12m">12 mois</option>
              <option value="custom">{hasPendingCustom ? pendingCustomRangeLabel : "Personnalisé…"}</option>
            </select>
          </div>

          {/* Filtre source */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Source :</span>
            <Select value={pendingSourceFilter} onValueChange={handleSourceChange}>
              <SelectTrigger
                className={`h-8 w-[140px] rounded-md border px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors duration-200 ease-in-out flex items-center gap-2 ${
                  pendingSourceFilter === "google"
                    ? "bg-blue-600 text-white border-blue-600/30 hover:bg-[#1e4fc9]"
                    : "bg-white text-blue-950 border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                }`}
              >
                {pendingSourceFilter === "google" && (
                  <GoogleLogo className="h-4 w-4 flex-shrink-0" />
                )}
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border border-slate-200 shadow-md">
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
            title={!isDirty ? "Aucun changement à appliquer" : "Appliquer les filtres sélectionnés"}
          >
            <Check className="h-3.5 w-3.5" />
            Valider
          </button>

          {/* Bouton Réinitialiser */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm transition-colors duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Résumé compact */}
      <div className="mt-2 text-[11px] font-semibold text-slate-700">
        Sélection : {ratingLabel} · {periodLabel} · {sourceLabel}
      </div>

      {/* Date range picker (Personnalisé…) */}
      {isCustomOpen && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Période personnalisée</p>
              <p className="text-[11px] text-slate-500">
                Choisissez une date de début et une date de fin, puis validez.
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
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-950 hover:border-blue-200"
              >
                Annuler
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
                Appliquer
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
          Données limitées – interprétation prudente
        </div>
      )}

      {filteredReviews.length === 0 && periodFilter.preset !== "all" && (
        <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
          Aucun avis sur la période sélectionnée
        </div>
      )}
    </div>
  );
}

