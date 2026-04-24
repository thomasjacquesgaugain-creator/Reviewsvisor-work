import type { BillingSummary } from "@/services/billingSummary";
import { subscriptionPlans, type SubscriptionPlan } from "@/config/subscriptionPlans";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";


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
  const { t,i18n } = useTranslation();

  const STATUS_LABELS: Record<BillingSummary["status"], string> = {
  active:   t("subscription.status.active"),
  trialing: t("subscription.status.trialing"),
  canceled: t("subscription.status.canceled"),
  past_due: t("subscription.status.pastDue"),
  inactive: t("subscription.status.inactive"),
};
  const isPaid = summary.status === "active" || summary.status === "trialing";

  // ── Free / inactive ────────────────────────────────────────────────────────
  if (!isPaid || summary.activeSubscriptions.length === 0) {
    return (
      <div className={cn("rounded-lg border p-6 border-gray-200 bg-gray-50", className)}>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          {t("subscription.currentPlan")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium text-gray-900">
            {t("settings.BillingAndSubscription.freePlan")}
          </span>
          <Badge variant="outline" className={STATUS_VARIANTS["inactive"]}>
            {STATUS_LABELS["inactive"]}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 w-full max-w-3xl", className)}>
      {summary.activeSubscriptions.map((sub) => {
        const plan = subscriptionPlans.find((p) => p.priceId === sub.priceId);

        const tierColor = {
          basic:    { badge: "bg-green-600",  price: "text-green-600",  check: "text-green-600",  border: "border-green-400" },
          standard: { badge: "bg-blue-600",   price: "text-blue-600",   check: "text-blue-600",   border: "border-blue-400" },
          pro:      { badge: "bg-violet-600", price: "text-violet-600", check: "text-violet-600", border: "border-violet-400" },
          premium:  { badge: "bg-pink-600",   price: "text-pink-600",   check: "text-pink-600",   border: "border-pink-400" },
        }[sub.planTier ?? "pro"] ?? { badge: "bg-blue-600", price: "text-blue-600", check: "text-blue-600", border: "border-blue-400" };

        const renewLabel = sub.periodEnd
          ? new Date(sub.periodEnd).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-GB", {
            day: "numeric", month: "long", year: "numeric",
          })
          : null;

        return (
          <Card
            key={sub.subscriptionId}
            className={cn(
              "relative overflow-hidden bg-white rounded-2xl shadow-md border-2",
              tierColor.border
            )}
          >
            <div className={cn("absolute top-0 left-0 text-white px-3 py-1 text-xs font-semibold rounded-br-lg", tierColor.badge)}>
              {t("subscription.status.active")}
            </div>

            <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 px-3 py-1 text-xs font-semibold rounded-bl-lg">
              {sub.planBilling === "annual" ? t("subscription.annualBadge") : t("subscription.monthlyBadge")}
            </div>

            <CardHeader className="pb-3 pt-8 px-5">
              <CardTitle className="text-xl font-bold text-foreground">
                {sub.planName} 
              </CardTitle>

              {sub.establishmentName && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                    <Building2 className="w-3 h-3" />
                    {sub.establishmentName}
                  </div>
                </div>
              )}

              {plan && (
                <div className="mt-3">
                  <span className={cn("text-3xl font-bold", tierColor.price)}>
                    {plan.priceTTC.toFixed(2).replace(".", ",")} € TTC
                    <span className="text-base font-normal text-muted-foreground">
                      {t("subscription.perMonth")}
                    </span>
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.priceHT.toFixed(2).replace(".", ",")} € {t("subscription.exclTax")}{t("subscription.perMonth")}
                  </p>
                  {plan.billing === "annual" && plan.annualTotalTTC && (
                    <p className={cn("text-xs font-semibold mt-1", tierColor.price)}>
                      {t("subscription.annualTotal", {
                        total: plan.annualTotalTTC.toFixed(0),
                        totalHT: plan.annualTotalHT?.toFixed(2)
                      })}
                    </p>
                  )}
                </div>
              )}

              {renewLabel && (
                <p className="text-xs text-muted-foreground mt-2">
                  {sub.cancelAtPeriodEnd
                    ? t("subscription.endsOnDate", { date: renewLabel })
                    : t("subscription.renewsOnDate", { date: renewLabel })}
                </p>
              )}
            </CardHeader>

            {plan && (
              <CardContent className="pb-5 px-5 pt-0">
                <ul className="space-y-2">
                  {plan.benefitKeys.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={cn("w-4 h-4 mt-0.5 flex-shrink-0", tierColor.check)} />
                      <span className="text-sm text-muted-foreground">{t(benefit)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}