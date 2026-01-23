# Correction de la carte "Tendance" - Formatage et robustesse

## Modifications apportées

### 1. Formatage UI avec unité explicite

**Avant** : `"En hausse +12.5"` (sans unité)

**Après** : `"En hausse +0,5 pt (+12,5 %)"` avec :
- Format FR : virgule au lieu du point (12,5 au lieu de 12.5)
- Unité "%" explicite
- Variation en points affichée en premier : `+0,5 pt`
- Variation en pourcentage en second : `(+12,5 %)`
- Sous-texte : `"vs 3 mois précédents"`

### 2. Gestion des données insuffisantes

**Cas gérés** :
- Division par zéro (`olderAvg = 0`)
- Données manquantes (null, NaN, Infinity)
- Minimum d'avis insuffisant (< 5 avis par période de 3 mois)

**Affichage** : `"Données insuffisantes"` au lieu d'un chiffre erroné

### 3. Calcul robuste avec seuils

**Minimum d'avis** : Au moins 5 avis dans chaque période (3 derniers mois ET 3 mois précédents)

**Seuils de tendance** :
- `trendValue > 2%` → "En hausse"
- `trendValue < -2%` → "En baisse"
- Entre -2% et +2% → "Stable"
- Données insuffisantes → "Données insuffisantes"

## Exemples de rendu

### Cas 1 : Tendance positive avec données suffisantes

**Données** :
- `olderAvg = 4.0`
- `recentAvg = 4.5`
- `recentReviews.length >= 5`
- `olderReviews.length >= 5`

**Calcul** :
- `trendDeltaPoints = 4.5 - 4.0 = +0.5`
- `trendValue = ((4.5 - 4.0) / 4.0) * 100 = +12.5%`

**Affichage** :
```
Tendance (note moyenne)                    [ℹ️]
─────────────────────────────────────────────────
[↑] En hausse +0,5 pt (+12,5 %)
    vs 3 mois précédents
```

### Cas 2 : Tendance négative

**Données** :
- `olderAvg = 4.5`
- `recentAvg = 4.0`
- Données suffisantes

**Calcul** :
- `trendDeltaPoints = 4.0 - 4.5 = -0.5`
- `trendValue = ((4.0 - 4.5) / 4.5) * 100 = -11.1%`

**Affichage** :
```
Tendance (note moyenne)                    [ℹ️]
─────────────────────────────────────────────────
[↓] En baisse -0,5 pt (-11,1 %)
    vs 3 mois précédents
```

### Cas 3 : Données insuffisantes (pas assez d'avis)

**Données** :
- `recentReviews.length = 3` (< 5)
- OU `olderReviews.length = 2` (< 5)

**Affichage** :
```
Tendance                                    [ℹ️]
─────────────────────────────────────────────────
[-] Données insuffisantes
```

### Cas 4 : Données insuffisantes (division par zéro)

**Données** :
- `olderAvg = 0` (aucun avis dans la période précédente)

**Affichage** :
```
Tendance                                    [ℹ️]
─────────────────────────────────────────────────
[-] Données insuffisantes
```

### Cas 5 : Tendance stable

**Données** :
- `olderAvg = 4.0`
- `recentAvg = 4.05`
- `trendValue = +1.25%` (entre -2% et +2%)

**Affichage** :
```
Tendance (note moyenne)                    [ℹ️]
─────────────────────────────────────────────────
[→] Stable
```

## Code modifié

### 1. Types (`src/types/analysis.ts`)

```typescript
export interface OverviewMetrics {
  // ...
  trend: 'up' | 'down' | 'stable' | 'insufficient';
  trendValue?: number | null; // null si données insuffisantes
  trendDeltaPoints?: number | null; // Variation en points (ex: +0.5)
}
```

### 2. Calcul de la tendance (`src/utils/transformAnalysisData.ts`)

```typescript
const MIN_REVIEWS_PER_PERIOD = 5;

// Vérifier le minimum d'avis par période
if (recentReviews.length >= MIN_REVIEWS_PER_PERIOD && olderReviews.length >= MIN_REVIEWS_PER_PERIOD) {
  const recentAvg = recentReviews.reduce((sum, r) => sum + (r.note || 0), 0) / recentReviews.length;
  const olderAvg = olderReviews.reduce((sum, r) => sum + (r.note || 0), 0) / olderReviews.length;
  
  // Vérifier que les moyennes sont valides
  if (!isNaN(recentAvg) && !isNaN(olderAvg) && isFinite(recentAvg) && isFinite(olderAvg)) {
    // Vérifier division par zéro
    if (olderAvg > 0) {
      trendDeltaPoints = recentAvg - olderAvg;
      trendValue = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (trendValue > 2) trend = 'up';
      else if (trendValue < -2) trend = 'down';
      else trend = 'stable';
    } else {
      trend = 'insufficient';
    }
  } else {
    trend = 'insufficient';
  }
} else {
  trend = 'insufficient';
}
```

### 3. Affichage (`src/components/analysis/OverviewSection.tsx`)

```typescript
// Formater la valeur de tendance en pourcentage (format FR avec virgule)
const formatTrendValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  return Math.abs(value).toFixed(1).replace('.', ',');
};

// Formater la variation en points (format FR avec virgule)
const formatDeltaPoints = (delta: number | null | undefined): string => {
  if (delta === null || delta === undefined || isNaN(delta)) return '';
  const formatted = Math.abs(delta).toFixed(1).replace('.', ',');
  return delta >= 0 ? `+${formatted}` : `-${formatted}`;
};

// Dans le JSX :
{data.trend === 'insufficient' ? (
  <div className="flex items-center gap-2">
    {getTrendIcon()}
    <span className="text-lg font-semibold text-gray-400">
      Données insuffisantes
    </span>
  </div>
) : (
  <>
    <div className="flex items-center gap-2">
      {getTrendIcon()}
      <span className={`text-lg font-semibold ${getTrendColor()}`}>
        {data.trend === 'up' && (
          <>
            En hausse
            {data.trendDeltaPoints !== null && (
              <span className="ml-1 text-base">
                {formatDeltaPoints(data.trendDeltaPoints)} pt
              </span>
            )}
            {data.trendValue !== null && (
              <span className="ml-1 text-base">
                +{formatTrendValue(data.trendValue)} %
              </span>
            )}
          </>
        )}
        {/* ... */}
      </span>
    </div>
    {data.trendValue !== null && (
      <p className="text-xs text-gray-500 mt-1">
        vs 3 mois précédents
      </p>
    )}
  </>
)}
```

## Tooltip amélioré

**Contenu du tooltip** :
- Si données insuffisantes : "Données insuffisantes pour calculer la tendance. Au moins 5 avis sont nécessaires dans chaque période de 3 mois."
- Sinon : "Variation (%) de la note moyenne sur les 3 derniers mois comparée aux 3 mois précédents." + explication des icônes

## Tests de validation

### Test 1 : Cas normal (données suffisantes)
```typescript
// Input
olderAvg = 4.0
recentAvg = 4.5
recentReviews.length = 10
olderReviews.length = 8

// Expected
trend = 'up'
trendValue = 12.5
trendDeltaPoints = 0.5
// Affichage: "En hausse +0,5 pt (+12,5 %)"
```

### Test 2 : Pas assez d'avis
```typescript
// Input
recentReviews.length = 3
olderReviews.length = 7

// Expected
trend = 'insufficient'
trendValue = null
trendDeltaPoints = null
// Affichage: "Données insuffisantes"
```

### Test 3 : Division par zéro
```typescript
// Input
olderAvg = 0
recentAvg = 4.5

// Expected
trend = 'insufficient'
trendValue = null
trendDeltaPoints = null
// Affichage: "Données insuffisantes"
```

### Test 4 : Tendance stable
```typescript
// Input
olderAvg = 4.0
recentAvg = 4.05
trendValue = 1.25% (entre -2% et +2%)

// Expected
trend = 'stable'
// Affichage: "Stable"
```

## Résultat final

✅ **Unité explicite** : "%" toujours affiché  
✅ **Format FR** : virgule au lieu du point (12,5 au lieu de 12.5)  
✅ **Variation en points** : affichée en premier (+0,5 pt)  
✅ **Sous-texte** : "vs 3 mois précédents"  
✅ **Robustesse** : gestion des cas limites (division par zéro, NaN, données insuffisantes)  
✅ **Seuils** : minimum 5 avis par période pour un calcul significatif  
✅ **Tooltip** : explication claire de la base de comparaison
