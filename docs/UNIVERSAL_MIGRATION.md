# Migration vers l'analyse universelle multi-secteurs

## Vue d'ensemble

Cette migration transforme le SaaS d'analyse d'avis orienté restaurant en une solution universelle pour tous types de commerces avec détection automatique du secteur.

## Plan d'implémentation (6 commits)

### Commit 1: Migration DB + Types
- ✅ Migration SQL: `20260128000000_add_business_type_universal.sql`
- ✅ Ajout des champs `business_type`, `business_type_confidence`, `business_type_candidates`, `business_type_source`, `analysis_version` aux tables `establishments`, `établissements` et `review_insights`
- ✅ Ajout des champs v2 dans `review_insights`: `themes_universal`, `themes_industry`, `pain_points_prioritized`, etc.

### Commit 2: Config taxonomie
- ✅ `src/config/industry.ts`: Configuration des thèmes universels + par secteur
- ✅ Définition des `BUSINESS_TYPES` et `INDUSTRY_CONFIG`

### Commit 3: Service détection
- ✅ `src/services/businessTypeDetection.ts`: Détection automatique robuste
- ✅ Combine Google Places types + keywords analysis
- ✅ Retourne type, confidence, candidates, source

### Commit 4: Pipeline analyse v2
- ✅ `supabase/functions/analyze-reviews-v2/index.ts`: Nouvelle Edge Function v2
- ✅ Pipeline 2 passes: PASS A (thèmes) + PASS B (recommandations + templates)
- ✅ `src/lib/analysisSchemas.ts`: Schémas Zod pour validation stricte

### Commit 5: UI Dashboard adaptatif
- ✅ `src/components/ThemesDisplay.tsx`: Affichage conditionnel thèmes universels/métier
- ✅ `src/components/BusinessTypeIndicator.tsx`: Indicateur discret si confidence < 75
- ✅ `src/components/BusinessTypeOverrideModal.tsx`: Modal override manuel
- ✅ Adaptation `Dashboard.tsx`: Utilise le nouveau format v2 si disponible

### Commit 6: API endpoints
- ✅ `supabase/functions/update-business-type/index.ts`: Endpoint PATCH pour override
- ✅ `src/lib/runAnalyze.ts`: Ajout de `runAnalyzeV2()` pour appeler la v2

## Commandes de migration

### 1. Appliquer la migration DB

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via SQL Editor dans Supabase Dashboard
# Copier le contenu de: supabase/migrations/20260128000000_add_business_type_universal.sql
```

### 2. Déployer les Edge Functions

```bash
# Déployer la nouvelle fonction v2
supabase functions deploy analyze-reviews-v2

# Déployer l'endpoint override
supabase functions deploy update-business-type

# Vérifier le déploiement
supabase functions list
```

### 3. Configurer les secrets (si pas déjà fait)

```bash
# Vérifier que OPENAI_API_KEY est configurée
supabase secrets list

# Si manquante, l'ajouter
supabase secrets set OPENAI_API_KEY=sk-...
```

### 4. Tests locaux

```bash
# Lancer les tests unitaires
npm run test src/services/__tests__/businessTypeDetection.test.ts

# Tester la détection manuellement
npm run dev
# Ouvrir la console et tester:
# import { detectBusinessType } from '@/services/businessTypeDetection';
# detectBusinessType('Salon Coiffure Marie', null, ['coupe', 'coloration']);
```

### 5. Tester l'analyse v2

```typescript
// Dans le code frontend, appeler:
import { runAnalyzeV2 } from '@/lib/runAnalyze';

const result = await runAnalyzeV2({
  place_id: 'ChIJ...',
  name: 'Mon Établissement'
});
```

## Rétrocompatibilité

- ✅ Les anciennes analyses (v1) continuent de fonctionner
- ✅ Le Dashboard détecte automatiquement `analysis_version` et affiche le format approprié
- ✅ Si `analysis_version !== 'v2-auto-universal'`, utilise le format v1 existant
- ✅ Les champs v1 (`themes`, `top_issues`, etc.) sont toujours remplis pour compatibilité

## Structure des données v2

### Format JSON strict (validé par Zod)

```json
{
  "business_type": "salon_coiffure",
  "business_type_confidence": 85,
  "business_type_candidates": [
    {"type": "salon_coiffure", "confidence": 85},
    {"type": "institut_beaute", "confidence": 45}
  ],
  "summary": {
    "one_liner": "Résumé en une phrase",
    "what_customers_love": ["point 1", "point 2"],
    "what_customers_hate": ["point 1"]
  },
  "kpis": {
    "avg_rating": 4.2,
    "total_reviews": 156,
    "positive_ratio_estimate": 68,
    "negative_ratio_estimate": 18
  },
  "themes_universal": [
    {
      "theme": "Accueil",
      "sentiment": "positive",
      "importance": 85,
      "evidence_quotes": ["citation 1"],
      "what_it_means": "Explication"
    }
  ],
  "themes_industry": [
    {
      "theme": "Coupe",
      "sentiment": "positive",
      "importance": 90,
      "evidence_quotes": ["citation"],
      "what_it_means": "Explication"
    }
  ],
  "pain_points_prioritized": [
    {
      "issue": "Temps d'attente",
      "why_it_matters": "Impact sur satisfaction",
      "impact": 75,
      "ease": 60,
      "first_step": "Action concrète"
    }
  ],
  "recommendations": {
    "quick_wins_7_days": [
      {
        "title": "Titre",
        "details": "Détails",
        "expected_result": "Résultat",
        "priority": 5
      }
    ],
    "projects_30_days": []
  },
  "reply_templates": {
    "positive": [
      {
        "title": "Template positif",
        "reply": "Texte de réponse",
        "use_when": "Quand utiliser"
      }
    ],
    "neutral": [],
    "negative": []
  }
}
```

## Fichiers modifiés/créés

### Nouveaux fichiers
- `supabase/migrations/20260128000000_add_business_type_universal.sql`
- `src/config/industry.ts`
- `src/services/businessTypeDetection.ts`
- `src/lib/analysisSchemas.ts`
- `supabase/functions/analyze-reviews-v2/index.ts`
- `supabase/functions/update-business-type/index.ts`
- `src/components/ThemesDisplay.tsx`
- `src/components/BusinessTypeIndicator.tsx`
- `src/components/BusinessTypeOverrideModal.tsx`
- `src/services/__tests__/businessTypeDetection.test.ts`

### Fichiers modifiés
- `src/pages/Dashboard.tsx`: Adaptation pour afficher thèmes universels/métier selon confidence
- `src/lib/runAnalyze.ts`: Ajout de `runAnalyzeV2()`

## Prochaines étapes (post-MVP)

1. **Tests end-to-end**: Tester avec de vrais établissements (salon, sport, serrurier)
2. **Amélioration détection**: Ajouter plus de keywords, améliorer le scoring
3. **Analytics**: Tracker les types détectés pour améliorer la précision
4. **UI améliorée**: Afficher les recommandations quick wins / projets dans le Dashboard
5. **Reply templates**: Intégrer les templates dans l'interface de réponse aux avis

## Support

En cas de problème:
1. Vérifier les logs Edge Functions: `supabase functions logs analyze-reviews-v2`
2. Vérifier que la migration DB a bien été appliquée
3. Vérifier que `OPENAI_API_KEY` est configurée
4. Tester avec `runAnalyzeV2()` en mode `dryRun: true` d'abord
