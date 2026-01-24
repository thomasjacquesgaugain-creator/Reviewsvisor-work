/**
 * Brand configuration - Single source of truth for product name and tagline
 * This ensures consistent branding across the entire application.
 */

export const APP_NAME = "Reviewsvisor";
export const APP_TAGLINE = "Analyse complète des avis clients";

// Brand metadata for SEO and social sharing
export const BRAND_METADATA = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  website: "https://reviewsvisor.fr",
  email: "contact@reviewsvisor.fr",
} as const;
