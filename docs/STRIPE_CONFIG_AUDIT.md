# Audit configuration Stripe – Reviewsvisor (production)

**Référence des IDs LIVE :** voir [STRIPE_LIVE_IDS.md](./STRIPE_LIVE_IDS.md).

## IDs Stripe utilisés (LIVE)

| Usage | price_id |
|-------|----------|
| Pro mensuel 24,99 € | `price_1SXnCbGkt979eNWBttiTM124` |
| Pro annuel 179,88 € (engagement, trial 14j) | `price_1SZT7tGkt979eNWB0MF2xczP` |
| Add-on établissement 4,99 € | `price_1ShiPzGkt979eNWBSDapH7aJ` |

- **Source de vérité frontend :** `src/config/subscriptionPlans.ts`
- **Edge Functions :** create-checkout, create-subscription, check-subscription, update-subscription, update-establishment-quantity, update-addon-quantity, stripe-webhook — tous alignés sur ces trois IDs.
- **isEngagementPlan / trial 14 jours :** plan annuel `price_1SZT7t...`
- **Aucune référence aux anciens IDs** (`Sse*`, `SSJ0s`) dans le code applicatif.

## Secrets Supabase (PROD)

| Secret | Rôle |
|--------|------|
| **STRIPE_SECRET_KEY** | `sk_live_...` — obligatoire |
| **STRIPE_PUBLIC_KEY** | `pk_live_...` — obligatoire |
| **STRIPE_WEBHOOK_SECRET** | `whsec_...` — obligatoire |
| **STRIPE_PRICE_ID** | `price_1SXnCb...` (optionnel, fallback create-checkout) |

Détail et exemples : [STRIPE_LIVE_IDS.md](./STRIPE_LIVE_IDS.md).
