import { Review } from "@/types/analysis";
import { isAfter, isBefore, parseISO, subDays, format } from "date-fns";
import { fr } from "date-fns/locale";

export type RatingFilter = "ALL" | "POS" | "NEU" | "NEG";

export type PeriodPreset = "ALL_TIME" | "30d" | "90d" | "365d" | "custom";

export interface PeriodFilter {
  preset: PeriodPreset;
  from?: Date;
  to?: Date;
}

export type SourceFilter = "ALL" | string;

export interface ReviewFilterOptions {
  ratingFilter: RatingFilter;
  periodFilter: PeriodFilter;
  sourceFilter: SourceFilter;
}

export function filterReviews(
  reviews: Review[] = [],
  { ratingFilter, periodFilter, sourceFilter }: ReviewFilterOptions
): Review[] {
  if (!reviews || reviews.length === 0) return [];

  const now = new Date();

  let minDate: Date | undefined;
  let maxDate: Date | undefined;

  switch (periodFilter.preset) {
    case "30d":
      minDate = subDays(now, 30);
      break;
    case "90d":
      minDate = subDays(now, 90);
      break;
    case "365d":
      minDate = subDays(now, 365);
      break;
    case "custom":
      minDate = periodFilter.from;
      maxDate = periodFilter.to;
      break;
    case "ALL_TIME":
    default:
      // Toute la période : pas de filtre de date
      break;
  }

  return reviews.filter((review) => {
    const rating = review.note;
    if (ratingFilter === "POS" && !(rating >= 4 && rating <= 5)) return false;
    if (ratingFilter === "NEU" && rating !== 3) return false;
    if (ratingFilter === "NEG" && !(rating >= 1 && rating <= 2)) return false;

    if (sourceFilter !== "ALL" && review.source !== sourceFilter) return false;

    if (minDate || maxDate) {
      const reviewDate = parseISO(review.date);
      if (minDate && isBefore(reviewDate, minDate)) return false;
      if (maxDate && isAfter(reviewDate, maxDate)) return false;
    }

    return true;
  });
}

/**
 * Formate un filtre de période en texte lisible pour l'affichage
 */
export function formatPeriodLabel(periodFilter: PeriodFilter): string {
  switch (periodFilter.preset) {
    case "30d":
      return "sur les 30 derniers jours";
    case "90d":
      return "sur les 90 derniers jours";
    case "365d":
      return "sur les 12 derniers mois";
    case "custom":
      if (periodFilter.from && periodFilter.to) {
        return `du ${format(periodFilter.from, "d MMM yyyy", { locale: fr })} au ${format(periodFilter.to, "d MMM yyyy", { locale: fr })}`;
      }
      return "période personnalisée";
    case "ALL_TIME":
    default:
      return "toute la période";
  }
}

