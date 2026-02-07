# Stripe TEST / LIVE – Configuration

## Fichiers d’env (front)

Créer ou compléter à la main (les fichiers `.env*` peuvent être gitignorés) :

- **`.env.local`** (dev, prioritaire) :
  ```bash
  VITE_STRIPE_MODE=test
  VITE_STRIPE_PRICE_ENGAGEMENT_TEST=price_xxx   # ID créé en mode Test (Dashboard Stripe)
  VITE_STRIPE_PRICE_FLEXIBLE_TEST=price_xxx
  VITE_STRIPE_PRICE_ADDON_TEST=price_xxx
  ```
- **`.env.production`** (build prod) :
  ```bash
  VITE_STRIPE_MODE=live
  ```

Si `VITE_STRIPE_MODE` est absent, le mode est déduit de `MODE` : `production` → `live`, sinon → `test`.

**Important :** En mode TEST, les trois variables `VITE_STRIPE_PRICE_*_TEST` doivent contenir des price IDs réels créés en **mode Test** dans le Dashboard Stripe. Sinon, le front bloquera le clic (toast d’erreur) et create-checkout refusera tout placeholder.

## Edge Function (secrets Supabase)

Pour **create-checkout** en mode TEST : `STRIPE_PRICE_ENGAGEMENT_TEST`, `STRIPE_PRICE_FLEXIBLE_TEST`, `STRIPE_PRICE_ADDON_TEST` (mêmes valeurs que dans `.env.local` sans le préfixe `VITE_`).

## Mapping price IDs (référence)

| Clé | LIVE (code) | TEST (env uniquement) |
|-----|-------------|------------------------|
| **proEngagement** | `price_1SZT7tGkt979eNWB0MF2xczP` | `VITE_STRIPE_PRICE_ENGAGEMENT_TEST` / `STRIPE_PRICE_ENGAGEMENT_TEST` |
| **proFlexible** | `price_1SXnCbGkt979eNWBttiTM124` | `VITE_STRIPE_PRICE_FLEXIBLE_TEST` / `STRIPE_PRICE_FLEXIBLE_TEST` |
| **addon** | `price_1ShiPzGkt979eNWBSDapH7aJ` | `VITE_STRIPE_PRICE_ADDON_TEST` / `STRIPE_PRICE_ADDON_TEST` |

Aucun placeholder `price_REPLACE_*` ne doit rester dans le code.

## Checklist de validation

- [ ] **Dev en TEST**  
  - `.env.local` avec `VITE_STRIPE_MODE=test` et les trois `VITE_STRIPE_PRICE_*_TEST` (vrais price IDs Test)  
  - Supabase : `STRIPE_SECRET_KEY=sk_test_...` et les trois `STRIPE_PRICE_*_TEST`  
  - Clic « Profiter des 14 jours offerts » / « S’abonner » → redirection Stripe Checkout sans erreur « No such price »

- [ ] **Prod en LIVE**  
  - Build avec `VITE_STRIPE_MODE=live` (ou `.env.production`)  
  - Supabase (prod) : `STRIPE_SECRET_KEY=sk_live_...`  
  - Clic « S’abonner » → redirection Stripe Checkout en mode Live

- [ ] **Cohérence**  
  - Front : `stripeMode` = `test` en dev, `live` en prod ; `[checkout:request]` avec un vrai `priceId` (jamais `price_REPLACE_*`)  
  - Edge Function : logs `[CREATE-CHECKOUT] Stripe mode` + `Inputs` avec `priceId` et `stripeMode`
