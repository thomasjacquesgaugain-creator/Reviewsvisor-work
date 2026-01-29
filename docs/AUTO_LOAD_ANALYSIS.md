# Chargement automatique de l'analyse dans le Dashboard

## Objectif

Le dashboard affiche maintenant automatiquement les données d'analyse déjà calculées quand l'utilisateur revient sur Reviewsvisor, sans devoir recliquer sur "Analyser cet établissement".

## Modifications apportées

### 1. Service de chargement d'analyse (`src/services/analysisLoader.ts`)

Nouveau service créé pour centraliser le chargement des analyses :

- `loadLatestAnalysis(placeId, userId)` : Charge la dernière analyse pour un établissement donné
- `loadLatestAnalysisForActiveEstablishment(userId)` : Charge la dernière analyse pour l'établissement actif de l'utilisateur

**Retour** :
```typescript
{
  success: boolean;
  data: AnalysisData | null;
  error?: string;
  hasAnalysis: boolean;
}
```

### 2. Amélioration du Dashboard (`src/pages/Dashboard.tsx`)

#### États ajoutés
- `isLoadingInsight` : Commence à `true` pour éviter d'afficher 0 par défaut
- `hasAnalysis` : Indique si une analyse existe pour l'établissement actif

#### Chargement automatique au mount
- Le Dashboard charge automatiquement la dernière analyse au montage via `loadLatestAnalysisForActiveEstablishment`
- Les données sont chargées avant l'affichage pour éviter les valeurs par défaut (0)

#### Gestion des valeurs par défaut
- Les valeurs par défaut (0) ne s'affichent plus si une analyse existe
- Utilisation de `hasAnalysisData` pour déterminer si on utilise les données d'analyse ou les données calculées depuis les avis

#### Rechargement après analyse
- Après une nouvelle analyse, le Dashboard recharge automatiquement les insights via `loadLatestAnalysis`
- Mise à jour de `hasAnalysis` en conséquence

### 3. Comportement

#### États gérés
1. **Loading** : `isLoadingInsight === true` → Affiche un loader, pas de valeurs par défaut
2. **No analysis** : `hasAnalysis === false` → Affiche les CTAs "Importer/Analyser"
3. **Analysis available** : `hasAnalysis === true` → Affiche toutes les sections avec les données d'analyse
4. **Analysis running** : `isAnalyzing === true` → Affiche un loader pendant l'analyse

#### Affichage conditionnel
- Si `hasAnalysis === true` : Les KPI, thèmes, décryptage, recommandations sont affichés avec les données d'analyse
- Si `hasAnalysis === false` : Affichage des CTAs pour importer/analyser
- Les valeurs par défaut (0) ne s'affichent que si vraiment aucune donnée n'existe

## Rétrocompatibilité

- Compatible avec les analyses v1 et v2 (v2-auto-universal)
- Détection automatique de la version d'analyse via `analysis_version`
- Fallback sur les données calculées depuis les avis si aucune analyse n'existe

## Tests

### Scénario 1 : Première visite (aucune analyse)
1. Ouvrir le dashboard
2. Vérifier que les CTAs "Importer/Analyser" sont affichés
3. Vérifier qu'aucune valeur 0 n'est affichée par défaut

### Scénario 2 : Retour après analyse
1. Effectuer une analyse
2. Fermer le dashboard
3. Rouvrir le dashboard
4. Vérifier que les données d'analyse sont automatiquement chargées et affichées

### Scénario 3 : Nouvelle analyse
1. Avoir une analyse existante
2. Cliquer sur "Analyser cet établissement"
3. Vérifier que les nouvelles données sont automatiquement chargées après l'analyse

### Scénario 4 : Changement d'établissement
1. Avoir plusieurs établissements avec analyses
2. Changer d'établissement actif
3. Vérifier que l'analyse de l'établissement actif est automatiquement chargée

## Fichiers modifiés

- `src/services/analysisLoader.ts` (nouveau)
- `src/pages/Dashboard.tsx` (modifié)

## Migration

Aucune migration de base de données nécessaire. Le système utilise la table `review_insights` existante.

## Notes

- Le chargement automatique se fait au montage du composant Dashboard
- Les données sont chargées de manière asynchrone pour ne pas bloquer l'UI
- Le système gère automatiquement les erreurs et les cas où aucune analyse n'existe
