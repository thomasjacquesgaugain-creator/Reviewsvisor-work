import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { RotateCcw } from "lucide-react";
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

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setPeriodFilter({ preset: "custom" });
    } else if (value === "ALL_TIME" || value === "30d" || value === "90d" || value === "365d") {
      setPeriodFilter({ preset: value as any });
    }
  };

  const handleSourceChange = (value: string) => {
    const opt = SOURCE_OPTIONS.find((o) => o.value === value);
    if (!opt || !opt.enabled) return;
    setSourceFilter(opt.value);
  };

  const handleReset = () => {
    setRatingFilter("ALL");
    setPeriodFilter({ preset: "ALL_TIME" });
    setSourceFilter("google");
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
      : periodFilter.preset === "365d"
      ? "12 mois"
      : periodFilter.preset === "custom"
      ? "Période personnalisée"
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
              {filteredReviews.length || totalReviews}
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

        <div className="flex flex-wrap items-center gap-3">
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
                onClick={() => setRatingFilter(opt.key as any)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  ratingFilter === opt.key
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-transparent text-gray-700 hover:bg-white"
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
              value={periodFilter.preset}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              <option value="ALL_TIME">Toute la période</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
              <option value="365d">12 mois</option>
              <option value="custom">Personnalisé…</option>
            </select>
          </div>

          {/* Filtre source */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Source :</span>
            <Select value={sourceFilter} onValueChange={handleSourceChange}>
              <SelectTrigger
                className={`h-8 w-[140px] rounded-md border px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-colors flex items-center gap-2 ${
                  sourceFilter === "google"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {sourceFilter === "google" && (
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

          {/* Bouton Réinitialiser */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Résumé compact */}
      <div className="mt-2 text-[11px] text-gray-500">
        {ratingLabel} · {periodLabel} · {sourceLabel}
      </div>

      {isLowData && (
        <div className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
          Données limitées – interprétation prudente
        </div>
      )}
    </div>
  );
}

