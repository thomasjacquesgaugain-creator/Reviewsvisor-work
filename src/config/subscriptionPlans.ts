// Source unique de vérité pour les plans d'abonnement
export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  badge: string;
  badgeColor: "purple" | "blue";
  priceId: string;
  productKey: string; // Clé stable pour le bypass créateur
  benefits: string[];
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "pro-engagement",
    slug: "pro-14",
    name: "Abonnement Pro",
    price: 14.99,
    priceLabel: "14,99 €",
    description: "14 jours offerts, puis 14,99 €/mois – engagement 12 mois",
    badge: "💎 Meilleur prix",
    badgeColor: "purple",
    priceId: "price_1SZT7tGkt979eNWB0MF2xczP",
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
    priceId: "price_1SXnCbGkt979eNWBttiTM124",
    productKey: "pro_2499_monthly",
    benefits: [
      "Accès complet à Reviewsvisor",
      "Sans engagement",
      "Résiliable à tout moment",
    ],
  },
];

// Add-on pour établissements supplémentaires
export const establishmentAddon = {
  id: "addon-etablissement",
  name: "Établissement supplémentaire",
  price: 4.99,
  priceLabel: "+4,99 €",
  priceId: "price_1ShiPzGkt979eNWBSDapH7aJ",
  productKey: "addon_multi_etablissements_499",
};

export const getDefaultPlan = (): SubscriptionPlan => subscriptionPlans[0];

export const getPlanBySlug = (slug: string): SubscriptionPlan | undefined => 
  subscriptionPlans.find(p => p.slug === slug);

export const getPlanById = (id: string): SubscriptionPlan | undefined => 
  subscriptionPlans.find(p => p.id === id);

export const getPlanByProductKey = (productKey: string): SubscriptionPlan | undefined =>
  subscriptionPlans.find(p => p.productKey === productKey);
