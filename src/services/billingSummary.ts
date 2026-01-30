import type { SubscriptionStatus } from "@/lib/stripe";
import { subscriptionPlans } from "@/config/subscriptionPlans";

/**
 * Résumé facturation pour affichage "Plan actuel".
 * Alimenté par check-subscription (Stripe / user_entitlements) + config plans.
 */
export type BillingSummary = {
  planName: string;
  status: "active" | "trialing" | "canceled" | "past_due" | "inactive";
  interval?: "month" | "year";
  renewAt?: string | null;
  includedEstablishments: number;
  /** Établissements supplémentaires achetés (add-ons). Source: billed_additional_establishments. */
  extraEstablishments: number;
  /** Total autorisé = includedEstablishments + extraEstablishments. */
  totalAllowed: number;
};

const DEFAULT_INCLUDED = 1;
const FREE_PLAN_NAME = "Free";

/**
 * Construit le résumé facturation à partir du statut d'abonnement (check-subscription).
 * - Plan name : via subscriptionPlans (price_id) ou "Free" si non abonné.
 * - includedEstablishments : 1 (premier inclus dans tous les plans).
 * - extraEstablishments : billed_additional_establishments (add-ons Stripe). Si non exposé par le backend, fallback à 0 + TODO.
 */
export function getBillingSummary(subscription: SubscriptionStatus | null): BillingSummary {
  if (!subscription || !subscription.subscribed) {
    return {
      planName: FREE_PLAN_NAME,
      status: "inactive",
      includedEstablishments: DEFAULT_INCLUDED,
      // TODO: brancher une colonne profiles.extra_establishments ou équivalent si le backend l'expose
      extraEstablishments: 0,
      totalAllowed: DEFAULT_INCLUDED,
    };
  }

  const plan = subscription.price_id
    ? subscriptionPlans.find((p) => p.priceId === subscription.price_id)
    : null;
  const planName = plan?.name ?? FREE_PLAN_NAME;

  // Premier établissement inclus dans le plan ; add-ons = établissements supplémentaires facturés
  const includedEstablishments = DEFAULT_INCLUDED;
  const extraEstablishments =
    subscription.billed_additional_establishments ??
    subscription.additional_establishments ??
    0;
  const totalAllowed = includedEstablishments + extraEstablishments;

  // Statut détaillé (trialing, canceled, past_due) à brancher quand le backend les expose
  const status: BillingSummary["status"] = subscription.subscribed ? "active" : "inactive";

  return {
    planName,
    status,
    interval: "month",
    renewAt: subscription.subscription_end ?? null,
    includedEstablishments,
    extraEstablishments,
    totalAllowed,
  };
}
