import type { BillingSummary } from "@/services/billingSummary";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BillingSummary["status"], string> = {
  active: "Actif",
  trialing: "Essai",
  canceled: "Annulé",
  past_due: "Expiré",
  inactive: "Inactif",
};

const STATUS_VARIANTS: Record<BillingSummary["status"], string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  trialing: "bg-blue-100 text-blue-800 border-blue-200",
  canceled: "bg-gray-100 text-gray-700 border-gray-200",
  past_due: "bg-amber-100 text-amber-800 border-amber-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

interface CurrentPlanCardProps {
  summary: BillingSummary;
  className?: string;
}

/**
 * Carte "Plan actuel" : nom du plan, statut, quota établissements (inclus + add-ons + total).
 */
export function CurrentPlanCard({ summary, className }: CurrentPlanCardProps) {
  const isPaid = summary.status === "active" || summary.status === "trialing";
  const renewLabel =
    summary.renewAt && isPaid
      ? new Date(summary.renewAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const intervalLabel = summary.interval === "year" ? "annuel" : "mensuel";

  return (
    <div
      className={cn(
        "rounded-lg border p-6",
        isPaid ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50",
        className
      )}
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4">Plan actuel</h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-lg font-medium text-gray-900">
          {summary.planName === "Free" ? "Plan gratuit (Free)" : summary.planName}
        </span>
        <Badge
          variant="outline"
          className={cn("font-medium", STATUS_VARIANTS[summary.status])}
        >
          {STATUS_LABELS[summary.status]}
        </Badge>
      </div>

      {summary.interval && (
        <p className="text-sm text-gray-600 mb-2">
          Période : {intervalLabel}
          {renewLabel && (
            <span className="ml-2">
              • Prochain renouvellement : {renewLabel}
            </span>
          )}
        </p>
      )}

      <div className="space-y-1.5 text-sm text-gray-700">
        <p>Établissements inclus : {summary.includedEstablishments}</p>
        <p>
          {summary.extraEstablishments === 0
            ? "Aucun établissement supplémentaire"
            : `Établissements supplémentaires : +${summary.extraEstablishments}`}
        </p>
        <p className="font-medium">
          Total autorisé : {summary.totalAllowed}
        </p>
      </div>
    </div>
  );
}
