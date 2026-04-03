// Mode Stripe : "test" (dev) ou "live" (prod). Dépend de VITE_STRIPE_MODE ou MODE.
export type StripeEnv = "test" | "live";

export const stripeMode: StripeEnv =
  (import.meta.env.VITE_STRIPE_MODE as StripeEnv) ??
  (import.meta.env.MODE === "production" ? "live" : "test");

/** Valeurs par défaut (Live) si les variables d'env ne sont pas définies. */
// const DEFAULT_PRICE_IDS = {
//   proEngagement: "price_1SseJlGkt979eNWBoFcKFjFZ", // Pro annuel 14,99€
//   proFlexible: "price_1SseK2Gkt979eNWBgrF3GcCU",   // Pro mensuel 24,99€
//   addon: "price_1SseKdGkt979eNWBOA5fiM2f",         // Établissement supplémentaire 4,99€
// } as const;


/** Price IDs : variables d'env (VITE_STRIPE_PRICE_ID_*) avec fallback sur les valeurs Live. */
// function getPriceIds() {
//   const fromEnv = {
//     proEngagement: (import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL as string)?.trim() || "",
//     proFlexible: (import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY as string)?.trim() || "",
//     addon: (import.meta.env.VITE_STRIPE_PRICE_ID_EXTRA_ESTABLISHMENT as string)?.trim() || "",
//   };
//   return {
//     proEngagement: fromEnv.proEngagement || DEFAULT_PRICE_IDS.proEngagement,
//     proFlexible: fromEnv.proFlexible || DEFAULT_PRICE_IDS.proFlexible,
//     addon: fromEnv.addon || DEFAULT_PRICE_IDS.addon,
//   };
// }


function getPriceIds() {
  const prices = {
    basicAnnual: import.meta.env.VITE_STRIPE_PRICE_BASIC_ANNUAL,
    basicMonthly: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY,
    standardAnnual: import.meta.env.VITE_STRIPE_PRICE_STANDARD_ANNUAL,
    standardMonthly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY,
    proAnnual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL,
    proMonthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    premiumAnnual: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_ANNUAL,
    premiumMonthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY,
    addon: import.meta.env.VITE_STRIPE_PRICE_ID_EXTRA_ESTABLISHMENT,
  };

  // Object.entries(prices).forEach(([key, value]) => {
  //   if (!value) {
  //     throw new Error(`Missing Stripe price ID for ${key}`);
  //   }
  // });

  return prices;
}

export const PRICE_IDS = {
  test: getPriceIds(),
  live: getPriceIds(),
} as const;

/** priceId = Stripe price ID (stripePriceId) — source unique pour create-checkout. */
// export interface SubscriptionPlan {
//   id: string;
//   slug: string;
//   name: string;
//   price: number;
//   priceLabel: string;
//   description: string;
//   billingHint?: string;
//   badge: string;
//   badgeColor: "purple" | "blue";
//   /** Stripe price ID — utilisé pour create-checkout. Ne doit jamais être un placeholder. */
//   priceId: string;
//   productKey: string;
//   benefits: string[];
// }

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  tier: "basic" | "standard" | "pro" | "premium";
  billing: "annual" | "monthly";
  priceTTC: number;
  priceHT: number;
  annualTotalTTC?: number;
  annualTotalHT?: number;
  priceLabel: string;
  priceLabelHT: string;
  description: string;
  billingHint: string;
  badge: string;
  badgeColor: "purple" | "blue" | "green" | "pink";
  reviewQuota: number | "100+";
  priceId: string;
  productKey: string;
  benefitKeys: string[];
  targetAudience: string;
}

type PlanTemplate = Omit<SubscriptionPlan, "priceId">;

const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "basic-annual",
    slug: "basic-annual",
    name: "Basic",
    tier: "basic",
    billing: "annual",
    priceTTC: 15,
    priceHT: 12.5,
    annualTotalTTC: 180,
    annualTotalHT: 150,
    priceLabel: "15,00 € TTC/mois",
    priceLabelHT: "12,50 € HT/mois",
    description: "Engagement 12 mois — 180 € TTC (150 € HT) en une fois",
    billingHint: "180 € TTC facturés en une fois",
    badge: "💎 Meilleur prix",
    badgeColor: "green",
    reviewQuota: 25,
    productKey: "basic_annual",
    benefitKeys: [
      "subscription.benefits.reviewsQuota25",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience: "Idéal pour la majorité des petites entreprises.",
  },
  {
    id: "basic-monthly",
    slug: "basic-monthly",
    name: "Basic",
    tier: "basic",
    billing: "monthly",
    priceTTC: 25,
    priceHT: 20.83,
    priceLabel: "25,00 € TTC/mois",
    priceLabelHT: "20,83 € HT/mois",
    description: "Sans engagement — résiliable à tout moment",
    billingHint: "Sans engagement",
    badge: "⚡ Flexible",
    badgeColor: "blue",
    reviewQuota: 25,
    productKey: "basic_monthly",
    benefitKeys: [
      "subscription.benefits.reviewsQuota25",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience: "Idéal pour la majorité des petites entreprises.",
  },
  {
    id: "standard-annual",
    slug: "standard-annual",
    name: "Standard",
    tier: "standard",
    billing: "annual",
    priceTTC: 20,
    priceHT: 16.67,
    annualTotalTTC: 240,
    annualTotalHT: 200.04,
    priceLabel: "20,00 € TTC/mois",
    priceLabelHT: "16,67 € HT/mois",
    description: "Engagement 12 mois — 240 € TTC (200,04 € HT) en une fois",
    billingHint: "240 € TTC facturés en une fois",
    badge: "💎 Meilleur prix",
    badgeColor: "green",
    reviewQuota: 50,
    productKey: "standard_annual",
    benefitKeys: [
      "subscription.benefits.reviewsQuota50",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience:
      "Plan principal pour restaurants actifs ou commerces actifs.",
  },
  {
    id: "standard-monthly",
    slug: "standard-monthly",
    name: "Standard",
    tier: "standard",
    billing: "monthly",
    priceTTC: 30,
    priceHT: 25,
    priceLabel: "30,00 € TTC/mois",
    priceLabelHT: "25,00 € HT/mois",
    description: "Sans engagement — résiliable à tout moment",
    billingHint: "Sans engagement",
    badge: "⚡ Flexible",
    badgeColor: "blue",
    reviewQuota: 50,
    productKey: "standard_monthly",
    benefitKeys: [
      "subscription.benefits.reviewsQuota50",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience:
      "Plan principal pour restaurants actifs ou commerces actifs.",
  },
  {
    id: "pro-annual",
    slug: "pro-annual",
    name: "Pro",
    tier: "pro",
    billing: "annual",
    priceTTC: 30,
    priceHT: 25,
    annualTotalTTC: 360,
    annualTotalHT: 300,
    priceLabel: "30,00 € TTC/mois",
    priceLabelHT: "25,00 € HT/mois",
    description: "Engagement 12 mois — 360 € TTC (300 € HT) en une fois",
    billingHint: "360 € TTC facturés en une fois",
    badge: "💎 Meilleur prix",
    badgeColor: "purple",
    reviewQuota: 100,
    productKey: "pro_annual",
    benefitKeys: [
      "subscription.benefits.reviewsQuota100",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience: "Adapté aux grands établissements / chaînes locales.",
  },
  {
    id: "pro-monthly",
    slug: "pro-monthly",
    name: "Pro",
    tier: "pro",
    billing: "monthly",
    priceTTC: 58.8,
    priceHT: 49,
    priceLabel: "58,80 € TTC/mois",
    priceLabelHT: "49,00 € HT/mois",
    description: "Sans engagement — résiliable à tout moment",
    billingHint: "Sans engagement",
    badge: "⚡ Flexible",
    badgeColor: "blue",
    reviewQuota: 100,
    productKey: "pro_monthly",
    benefitKeys: [
      "subscription.benefits.reviewsQuota100",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience: "Adapté aux grands établissements / chaînes locales.",
  },
  {
    id: "premium-annual",
    slug: "premium-annual",
    name: "Premium",
    tier: "premium",
    billing: "annual",
    priceTTC: 50,
    priceHT: 41.67,
    annualTotalTTC: 600,
    annualTotalHT: 500.04,
    priceLabel: "50,00 € TTC/mois",
    priceLabelHT: "41,67 € HT/mois",
    description: "Engagement 12 mois — 600 € TTC (500,04 € HT) en une fois",
    billingHint: "600 € TTC facturés en une fois",
    badge: "💎 Meilleur prix",
    badgeColor: "pink",
    reviewQuota: "100+",
    productKey: "premium_annual",
    benefitKeys: [
      "subscription.benefits.reviewsQuota100plus",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience:
      "Pour établissements exceptionnels / chaînes locales à fort volume d'avis.",
  },
  {
    id: "premium-monthly",
    slug: "premium-monthly",
    name: "Premium",
    tier: "premium",
    billing: "monthly",
    priceTTC: 65,
    priceHT: 54.17,
    priceLabel: "65,00 € TTC/mois",
    priceLabelHT: "54,17 € HT/mois",
    description: "Sans engagement — résiliable à tout moment",
    billingHint: "Sans engagement",
    badge: "⚡ Flexible",
    badgeColor: "blue",
    reviewQuota: "100+",
    productKey: "premium_monthly",
    benefitKeys: [
      "subscription.benefits.reviewsQuota100plus",
      "subscription.benefits.fullAnalysis",
      "subscription.benefits.recommendations",
      "subscription.benefits.aiReplies",
      "subscription.benefits.historyQuota",
    ],
    targetAudience:
      "Pour établissements exceptionnels / chaînes locales à fort volume d'avis.",
  },
];

const ids = PRICE_IDS[stripeMode];

// export const subscriptionPlans: SubscriptionPlan[] = [
//   { ...PLAN_TEMPLATES[0], priceId: ids.proEngagement },
//   { ...PLAN_TEMPLATES[1], priceId: ids.proFlexible },
// ];

export const subscriptionPlans: SubscriptionPlan[] = [
  { ...PLAN_TEMPLATES[0], priceId: ids.basicAnnual },
  { ...PLAN_TEMPLATES[1], priceId: ids.basicMonthly },
  { ...PLAN_TEMPLATES[2], priceId: ids.standardAnnual },
  { ...PLAN_TEMPLATES[3], priceId: ids.standardMonthly },
  { ...PLAN_TEMPLATES[4], priceId: ids.proAnnual },
  { ...PLAN_TEMPLATES[5], priceId: ids.proMonthly },
  { ...PLAN_TEMPLATES[6], priceId: ids.premiumAnnual },
  { ...PLAN_TEMPLATES[7], priceId: ids.premiumMonthly },
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


export const getPlansByTier = (tier: SubscriptionPlan["tier"]): SubscriptionPlan[] =>
  subscriptionPlans.filter((p) => p.tier === tier);

export const getAnnualPlans = (): SubscriptionPlan[] =>
  subscriptionPlans.filter((p) => p.billing === "annual");

export const getMonthlyPlans = (): SubscriptionPlan[] =>
  subscriptionPlans.filter((p) => p.billing === "monthly");

