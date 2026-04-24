import type { SubscriptionStatus } from "@/lib/stripe";
import { subscriptionPlans } from "@/config/subscriptionPlans";

/**
 * Résumé facturation pour affichage "Plan actuel".
 * Alimenté par check-subscription (Stripe / user_entitlements) + config plans.
 */
export type BillingSummary = {
  planName: string;
  planTier: "basic" | "standard" | "pro" | "premium" | null;
  planBilling: "annual" | "monthly" | null;
  status: "active" | "trialing" | "canceled" | "past_due" | "inactive";
  interval?: "month" | "year";
  renewAt?: string | null;
  // includedEstablishments: number;
  /** Établissements supplémentaires achetés (add-ons). Source: billed_additional_establishments. */
  // extraEstablishments: number;
  /** Total autorisé = includedEstablishments + extraEstablishments. */
  // totalAllowed: number;
  activeSubscriptions: {
    subscriptionId: string;
    planName: string;
    planTier: "basic" | "standard" | "pro" | "premium" | null;
    planBilling: "annual" | "monthly" | null;
    priceId: string | null;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    latestInvoicePdfUrl?: string | null;
    latestInvoiceHostedUrl?: string | null;
    establishmentName?: string;
  }[];
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
      planTier:           null,
      planBilling:        null,
      status: "inactive",
      // includedEstablishments: DEFAULT_INCLUDED,
      // TODO: brancher une colonne profiles.extra_establishments ou équivalent si le backend l'expose
      // extraEstablishments: 0,
      // totalAllowed: DEFAULT_INCLUDED,
      interval:           null,
      renewAt:            null,
      activeSubscriptions: [],
    };
  }

  const subs = subscription.subscriptions ?? [];

  const activeSubscriptions = subs.map((sub) => {
    const plan = sub.plan_price_id
      ? subscriptionPlans.find((p) => p.priceId === sub.plan_price_id)
      : null;

    return {
      subscriptionId: sub.subscription_id,
      planName:       plan?.name ?? null,
      planTier:       plan?.tier ?? null,
      planBilling:    plan?.billing ?? null,
      priceId:        sub.plan_price_id,
      periodEnd:      sub.period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      latestInvoicePdfUrl: sub.latest_invoice_pdf_url ?? null,
      latestInvoiceHostedUrl: sub.latest_invoice_hosted_url ?? null,
      establishmentName:  sub.establishment_name ?? "—",
    };
  });
  const primary = activeSubscriptions[0] ?? null;
  const interval: "month" | "year" | null =
    primary?.planBilling === "annual"  ? "year"  :
    primary?.planBilling === "monthly" ? "month" :
    null;

  return {
    planName:            primary?.planName    ?? FREE_PLAN_NAME,
    planTier:            primary?.planTier    ?? null,
    planBilling:         primary?.planBilling ?? null,
    status:              "active",
    interval,
    renewAt:             primary?.periodEnd   ?? subscription.subscription_end ?? null,
    activeSubscriptions,
  };
}
