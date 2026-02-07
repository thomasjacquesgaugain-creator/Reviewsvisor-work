# IDs Stripe LIVE – Reviewsvisor

Source de vérité pour les **price_id** utilisés en production (compte Stripe Live).

## Price IDs (LIVE)

| Usage | price_id | Montant |
|-------|----------|---------|
| **Pro mensuel** (flexible, 24,99 €/mois) | `price_1SXnCbGkt979eNWBttiTM124` | 24,99 €/mois |
| **Pro annuel** (engagement, 14 jours offerts) | `price_1SZT7tGkt979eNWB0MF2xczP` | 179,88 €/an |
| **Add-on établissement** | `price_1ShiPzGkt979eNWBSDapH7aJ` | 4,99 €/mois par établissement |

- Plan **engagement** = annuel = trial 14 jours → `price_1SZT7t...`
- Plan **flexible** = mensuel → `price_1SXnCb...`
- Add-on = établissements supplémentaires → `price_1ShiPz...`

## Où c’est utilisé

| Fichier / fonction | Rôle |
|--------------------|------|
| `src/config/subscriptionPlans.ts` | Source de vérité frontend (plans + addon) |
| `src/lib/stripe.ts` | `STRIPE_PRODUCTS.pro.price_id` = plan par défaut (annuel) |
| `supabase/functions/create-checkout` | `PRICE_ID_TO_PRODUCT_KEY`, addon, `isEngagementPlan` (SZT7t = trial 14j) |
| `supabase/functions/create-subscription` | `DEFAULT_PLAN_PRICE_ID`, addon, `PRICE_ID_TO_PRODUCT_KEY`, `isEngagementPlan` |
| `supabase/functions/check-subscription` | Addon, bypass créateur → `price_id` SZT7t / SXnCb |
| `supabase/functions/update-subscription` | Addon (filtrer item principal vs addon) |
| `supabase/functions/update-establishment-quantity` | Addon |
| `supabase/functions/update-addon-quantity` | Addon |
| `supabase/functions/stripe-webhook` | `PRICE_TO_PLAN` (SZT7t → pro_1499_12m, SXnCb → pro_2499_monthly, ShiPz → addon) |

## Secrets Supabase (LIVE)

À configurer dans **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (ou via CLI).

| Secret | Valeur | Obligatoire |
|--------|--------|-------------|
| **STRIPE_SECRET_KEY** | `sk_live_...` | Oui |
| **STRIPE_PUBLIC_KEY** | `pk_live_...` | Oui |
| **STRIPE_WEBHOOK_SECRET** | `whsec_...` (signing secret du endpoint webhook Stripe) | Oui |
| **STRIPE_PRICE_ID** | `price_1SXnCbGkt979eNWBttiTM124` (fallback create-checkout si pas de `priceId` dans le body) | Optionnel |

### Exemple (ne pas commiter les vraies valeurs)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1SXnCbGkt979eNWBttiTM124
```

- Le webhook Stripe doit pointer vers l’URL de l’Edge Function `stripe-webhook` (mode Live).
- Aucune référence aux anciens IDs (`Sse*`, `SSJ0s`) ne doit rester dans le code ; tout est aligné sur les trois IDs ci-dessus.
