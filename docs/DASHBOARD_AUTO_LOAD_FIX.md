# Correction : chargement automatique de l'analyse et i18n

## Problème

- Après refresh / retour sur `/dashboard`, affichage "Aucune donnée d'analyse disponible" et tout à 0 alors qu'une analyse avait été lancée.
- Section Conseiller : clés i18n en brut (`dashboard.noAdviceAvailable`).

## Causes identifiées

1. **Place_id utilisé pour charger l'analyse** : le chargement utilisait uniquement l'établissement "actif" en DB (`is_active = true`). Après refresh, si aucun établissement n'avait `is_active` en base (ou délai de chargement), l'analyse n'était pas chargée.
2. **Établissement sélectionné non persisté** : la sélection n'était pas restaurée au retour (localStorage), donc incohérence entre UI et DB.
3. **Clés i18n manquantes** : `dashboard.noAdviceAvailable` et `dashboard.analyzeEstablishmentToGetAdvice` absentes des locales.
4. **AnalysisTabContent** : exigeait `reviews.length > 0` pour afficher l'analyse, alors que l'analyse persistée (insight seul) suffit.

## Modifications

### 1. Dashboard – Chargement de l'analyse (`src/pages/Dashboard.tsx`)

- **Source du `place_id`** : utilisation en priorité de l’établissement sélectionné dans l’UI (`selectedEtab?.place_id ?? selectedEstablishment?.place_id`), puis en fallback de l’établissement actif en DB (`is_active = true`).
- **Chargement** : appel à `loadLatestAnalysis(placeId, user.id)` avec ce `place_id` au lieu de `loadLatestAnalysisForActiveEstablishment(user.id)`.
- **Pas d’écrasement** : quand il n’y a pas d’avis mais qu’une analyse existe pour cet établissement, on ne remet plus insight à null (variable locale `hadAnalysisForThisPlace`).

### 2. Persistance de l’établissement sélectionné (`src/pages/Dashboard.tsx`)

- **Clé localStorage** : `reviewsvisor_active_place_id`.
- **Au chargement des établissements** : lecture de `reviewsvisor_active_place_id` ; si ce `place_id` existe dans la liste, il est utilisé comme actif et `is_active` est mis à jour en DB si besoin.
- **À la sélection d’un établissement** : enregistrement du `place_id` dans `reviewsvisor_active_place_id`.

### 3. i18n (`src/i18n/locales/fr.json`)

- Ajout dans `dashboard` :
  - `noAdviceAvailable` : "Aucun conseil disponible"
  - `analyzeEstablishmentToGetAdvice` : "Analysez votre établissement pour obtenir des conseils personnalisés."
  - `importAndAnalyzeToSeeResults` : "Importez des avis et lancez une analyse pour voir les résultats"

### 4. AnalysisTabContent (`src/components/analysis/AnalysisTabContent.tsx`)

- **Affichage avec insight seul** : `analysisData` est calculé dès qu’il y a `analyse` (insight), même si `reviews` est vide ; `transformAnalysisData(analyse, reviews ?? [])` est appelé avec `reviews` optionnel.
- **Traductions** : usage de `useTranslation()` et de `t("dashboard.noAnalysisAvailable", "…")`, `t("dashboard.importAndAnalyzeToSeeResults", "…")`, `t("dashboard.noDataAvailable", "…")` pour les états vides.

## Fichiers modifiés

- `src/pages/Dashboard.tsx` – logique de chargement (place_id prioritaire, persistance, pas d’écrasement)
- `src/components/analysis/AnalysisTabContent.tsx` – affichage avec insight seul + i18n
- `src/i18n/locales/fr.json` – clés `noAdviceAvailable`, `analyzeEstablishmentToGetAdvice`, `importAndAnalyzeToSeeResults`

## Comment tester

1. **Lancer une analyse**
   - Aller sur `/dashboard`, sélectionner un établissement, cliquer sur "Analyser cet établissement".
   - Attendre la fin de l’analyse et vérifier que KPI, thématiques, décryptage, recommandations, Conseiller sont remplis.

2. **Rafraîchir la page**
   - F5 (ou rechargement complet).
   - Vérifier que les KPI et toutes les sections restent remplis sans recliquer sur "Analyser".
   - Vérifier que l’établissement sélectionné est bien le même (grâce à `reviewsvisor_active_place_id`).

3. **Traductions**
   - Section Conseiller : vérifier que "Aucun conseil disponible" et "Analysez votre établissement pour obtenir des conseils personnalisés." s’affichent (pas les clés `dashboard.noAdviceAvailable` / `dashboard.analyzeEstablishmentToGetAdvice`).
   - Onglet Analyse : en absence de données, vérifier les messages traduits (pas de clés brutes).

4. **Sans analyse**
   - Ouvrir le dashboard pour un établissement sans analyse (ou nouveau).
   - Vérifier l’affichage du CTA "Analyser" / "Importer" et des messages d’état vides traduits.

## Backend

Aucune migration ni nouvel endpoint pour cette correction. On continue d’utiliser la table `review_insights` et le chargement via Supabase depuis le front (service `analysisLoader.ts`). L’analyse est déjà persistée par les Edge Functions `analyze-reviews` et `analyze-reviews-v2`.
