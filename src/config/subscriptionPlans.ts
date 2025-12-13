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
  checkoutUrl: string;
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
    checkoutUrl: "https://buy.stripe.com/5kQbJ1dqp0uD6cwb2GgjC03",
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
    checkoutUrl: "https://buy.stripe.com/cNi14n1HHgtBeJ29YCgjC02",
    benefits: [
      "Accès complet à Reviewsvisor",
      "Sans engagement",
      "Résiliable à tout moment",
    ],
  },
];

export const getDefaultPlan = (): SubscriptionPlan => subscriptionPlans[0];

export const getPlanBySlug = (slug: string): SubscriptionPlan | undefined => 
  subscriptionPlans.find(p => p.slug === slug);

export const getPlanById = (id: string): SubscriptionPlan | undefined => 
  subscriptionPlans.find(p => p.id === id);
