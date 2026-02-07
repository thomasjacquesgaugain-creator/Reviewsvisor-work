// Mode Stripe : "test" (dev) ou "live" (prod). Dépend de VITE_STRIPE_MODE ou MODE.
export type StripeEnv = "test" | "live";

export const stripeMode: StripeEnv =
  (import.meta.env.VITE_STRIPE_MODE as StripeEnv) ??
  (import.meta.env.MODE === "production" ? "live" : "test");

/** Valeurs par défaut (Live) si les variables d'env ne sont pas définies. */
const DEFAULT_PRICE_IDS = {
  proEngagement: "price_1SZT7tGkt979eNWB0MF2xczP", // Pro annuel 14,99€
  proFlexible: "price_1SXnCbGkt979eNWBttiTM124",   // Pro mensuel 24,99€
  addon: "price_1ShiPzGkt979eNWBSDapH7aJ",         // Établissement supplémentaire 4,99€
} as const;

/** Price IDs : variables d'env (VITE_STRIPE_PRICE_ID_*) avec fallback sur les valeurs Live. */
function getPriceIds() {
  const fromEnv = {
    proEngagement: (import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL as string)?.trim() || "",
    proFlexible: (import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY as string)?.trim() || "",
    addon: (import.meta.env.VITE_STRIPE_PRICE_ID_EXTRA_ESTABLISHMENT as string)?.trim() || "",
  };
  return {
    proEngagement: fromEnv.proEngagement || DEFAULT_PRICE_IDS.proEngagement,
    proFlexible: fromEnv.proFlexible || DEFAULT_PRICE_IDS.proFlexible,
    addon: fromEnv.addon || DEFAULT_PRICE_IDS.addon,
  };
}

export const PRICE_IDS = {
  test: getPriceIds(),
  live: getPriceIds(),
} as const;

/** priceId = Stripe price ID (stripePriceId) — source unique pour create-checkout. */
export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  billingHint?: string;
  badge: string;
  badgeColor: "purple" | "blue";
  /** Stripe price ID — utilisé pour create-checkout. Ne doit jamais être un placeholder. */
  priceId: string;
  productKey: string;
  benefits: string[];
}

const PLAN_TEMPLATES: Omit<SubscriptionPlan, "priceId">[] = [
  {
    id: "pro-engagement",
    slug: "pro-annual",
    name: "Abonnement Pro",
    price: 179.88,
    priceLabel: "14,99 €",
    description: "14 jours offerts, puis 14,99 € / mois – engagement 12 mois",
    billingHint: "Engagement 12 mois",
    badge: "💎 Meilleur prix",
    badgeColor: "purple",
    productKey: "pro_1499_12m",
    benefits: [
      "Accès complet à Reviewsvisor",
      "14 jours offerts",
      "Engagement 12 mois",
    ],
  },
  {
    id: "pro-flexible",
    slug: "pro-24",
    name: "Abonnement Pro",
    price: 24.99,
    priceLabel: "24,99 €",
    description: "Sans engagement",
    badge: "⚡ Flexible",
    badgeColor: "blue",
    productKey: "pro_2499_monthly",
    benefits: [
      "Accès complet à Reviewsvisor",
      "Sans engagement",
      "Résiliable à tout moment",
    ],
  },
];

const ids = PRICE_IDS[stripeMode];

export const subscriptionPlans: SubscriptionPlan[] = [
  { ...PLAN_TEMPLATES[0], priceId: ids.proEngagement },
  { ...PLAN_TEMPLATES[1], priceId: ids.proFlexible },
];

export const establishmentAddon = {
  id: "addon-etablissement",
  name: "Établissement supplémentaire",
  price: 4.99,
  priceLabel: "+4,99 €",
  priceId: ids.addon,
  productKey: "addon_multi_etablissements_499",
} as const;

export const getDefaultPlan = (): SubscriptionPlan => subscriptionPlans[0];

export const getPlanBySlug = (slug: string): SubscriptionPlan | undefined =>
  subscriptionPlans.find((p) => p.slug === slug);

export const getPlanById = (id: string): SubscriptionPlan | undefined =>
  subscriptionPlans.find((p) => p.id === id);

export const getPlanByProductKey = (productKey: string): SubscriptionPlan | undefined =>
  subscriptionPlans.find((p) => p.productKey === productKey);
