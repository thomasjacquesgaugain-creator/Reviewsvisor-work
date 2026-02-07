import type { BillingSummary } from "@/services/billingSummary";
import type { SubscriptionPlan } from "@/config/subscriptionPlans";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  /** Plan actif (pro-engagement ou pro-flexible) quand l'utilisateur est abonné. Null pour Free. */
  activePlan?: SubscriptionPlan | null;
  className?: string;
}

/**
 * Carte "Plan actuel" : design comme /abonnement (badge, prix, avantages) + infos facturation (renouvellement, établissements).
 * Si activePlan fourni et statut payant → carte style abonnement avec badge "Actif".
 * Sinon → bloc simple (Free / inactif).
 */
export function CurrentPlanCard({ summary, activePlan, className }: CurrentPlanCardProps) {
  const { t } = useTranslation();
  const isPaid = summary.status === "active" || summary.status === "trialing";
  const showAbonnementStyle = activePlan && isPaid;

  const renewLabel =
    summary.renewAt && isPaid
      ? new Date(summary.renewAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
  const intervalLabel = summary.interval === "year" ? "annuel" : "mensuel";

  if (showAbonnementStyle && activePlan) {
    const colorClasses =
      activePlan.badgeColor === "purple"
        ? {
            badge: "bg-purple-600",
            price: "text-purple-600",
            check: "text-purple-600",
          }
        : {
            badge: "bg-blue-600",
            price: "text-blue-600",
            check: "text-blue-600",
          };

    return (
      <Card
        className={cn(
          "relative overflow-hidden bg-white rounded-2xl shadow-lg border-2 flex flex-col w-full max-w-3xl",
          isPaid ? "border-purple-500" : "border-border",
          className
        )}
      >
        {/* Badge plan (Meilleur prix / Flexible) */}
        <div
          className={cn(
            "absolute top-0 right-0 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg",
            colorClasses.badge
          )}
        >
          {t(`subscription.plans.${activePlan.id}.badge`)}
        </div>
        {/* Badge Actif */}
        <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1 text-xs font-semibold rounded-br-lg">
          {STATUS_LABELS.active}
        </div>

        <CardHeader className="pb-4 pt-8 px-5">
          <CardTitle className="text-xl font-bold text-foreground mb-2">
            {t(`subscription.plans.${activePlan.id}.name`)}
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-3">
            {t(`subscription.plans.${activePlan.id}.description`)}
          </p>
          <div className="mt-4">
            <span className={cn("text-4xl font-bold", colorClasses.price)}>
              {activePlan.priceLabel}
            </span>
            <span className="text-base text-muted-foreground ml-2">{t("common.perMonth")}</span>
            {activePlan.billingHint && (
              <p className="text-xs text-muted-foreground mt-1">{activePlan.billingHint}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col pb-6 px-5 pt-0">
          <ul className="space-y-3">
            {activePlan.benefits.map((_, index) => {
              const benefitKey = `subscription.plans.${activePlan.id}.benefits.${index}`;
              return (
                <li key={index} className="flex items-start gap-3">
                  <Check
                    className={cn("w-4 h-4 mt-0.5 flex-shrink-0", colorClasses.check)}
                    aria-hidden
                  />
                  <span className="text-sm text-foreground">{t(benefitKey)}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  /* Bloc simple pour Free / inactif */
  return (
    <div
      className={cn(
        "rounded-lg border p-6",
        isPaid ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50",
        className
      )}
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4">{t("subscription.currentPlan")}</h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-lg font-medium text-gray-900">
          {summary.planName === "Free" ? "Plan gratuit (Free)" : summary.planName}
        </span>
        <Badge variant="outline" className={cn("font-medium", STATUS_VARIANTS[summary.status])}>
          {STATUS_LABELS[summary.status]}
        </Badge>
      </div>

      {summary.interval && (
        <p className="text-sm text-gray-600 mb-2">
          {intervalLabel === "annuel"
            ? t("subscription.yearlyBilling")
            : t("subscription.monthlyBilling")}
          {renewLabel && (
            <span className="ml-2">
              • {t("subscription.renewalDate")} : {renewLabel}
            </span>
          )}
        </p>
      )}

      <div className="space-y-1.5 text-sm text-gray-700">
        <p>{t("subscription.establishmentsIncluded", "Établissements inclus")} : {summary.includedEstablishments}</p>
        <p>
          {summary.extraEstablishments === 0
            ? `${t("subscription.additionalEstablishments")} : 0`
            : `${t("subscription.additionalEstablishments")} : +${summary.extraEstablishments}`}
        </p>
        <p className="font-medium">
          {t("subscription.totalAllowed")} : {summary.totalAllowed}
        </p>
      </div>
    </div>
  );
}
