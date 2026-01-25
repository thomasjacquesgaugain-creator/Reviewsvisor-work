# 📊 Configuration du Rapport Mensuel Automatique

## Vue d'ensemble

Le système de rapport mensuel automatique envoie un email récapitulatif à tous les utilisateurs qui ont activé cette fonctionnalité, le 1er de chaque mois à 9h.

## Structure créée

### 1. Edge Function `send-monthly-report`

**Fichier** : `supabase/functions/send-monthly-report/index.ts`

**Fonctionnalités** :
- Récupère les données des avis du mois actuel et précédent
- Calcule les statistiques et l'évolution de la note
- Génère un rapport HTML professionnel
- Envoie par email via Resend

**Sections du rapport** :
1. **Évolution de la note** - Avec badge de performance coloré
2. **Actions réalisées** - Avis reçus, réponses envoyées, taux de réponse
3. **Résumé des avis** - Top 3 points positifs et négatifs
4. **Recommandations** - Actions prioritaires pour le mois prochain

### 2. Migrations SQL

#### Migration 1 : Ajout des préférences utilisateur
**Fichier** : `supabase/migrations/20260125143627_add_monthly_report_preferences.sql`

Ajoute deux colonnes à la table `profiles` :
- `monthly_report_enabled` (BOOLEAN, default: true)
- `report_frequency` (TEXT, default: 'monthly', valeurs: 'weekly' | 'monthly')

#### Migration 2 : Configuration CRON
**Fichier** : `supabase/migrations/20260125143628_setup_monthly_report_cron.sql`

Tente de configurer un CRON job via `pg_cron` (peut ne pas être disponible dans toutes les instances Supabase).

## Configuration

### Étape 1 : Appliquer les migrations

Exécutez les migrations dans Supabase Dashboard :

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Exécutez le contenu de `20260125143627_add_monthly_report_preferences.sql`
3. Vérifiez que les colonnes ont été ajoutées :
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('monthly_report_enabled', 'report_frequency');
   ```

### Étape 2 : Configurer le CRON Job

**Option A : Via Supabase Dashboard (Recommandé)**

1. Allez dans **Supabase Dashboard** → **Database** → **Cron Jobs**
2. Cliquez sur **New Cron Job**
3. Configurez :
   - **Name** : `send-monthly-reports`
   - **Schedule** : `0 9 1 * *` (1er de chaque mois à 9h UTC)
   - **Command** :
     ```sql
     SELECT net.http_post(
       url := 'https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/send-monthly-report',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer [VOTRE_SERVICE_ROLE_KEY]'
       ),
       body := jsonb_build_object()
     );
     ```
   - Remplacez `[VOTRE_PROJECT_REF]` et `[VOTRE_SERVICE_ROLE_KEY]` par vos valeurs

**Option B : Via migration SQL (si pg_cron est disponible)**

Exécutez le contenu de `20260125143628_setup_monthly_report_cron.sql` dans SQL Editor.

**Option C : Via un service externe (Alternative)**

Utilisez un service comme :
- **GitHub Actions** avec un workflow cron
- **Vercel Cron** (si déployé sur Vercel)
- **Cloudflare Workers** avec un cron trigger
- **AWS EventBridge** ou **Google Cloud Scheduler**

Exemple GitHub Actions :
```yaml
name: Send Monthly Reports
on:
  schedule:
    - cron: '0 9 1 * *' # 1er de chaque mois à 9h UTC
  workflow_dispatch: # Permet de déclencher manuellement

jobs:
  send-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Call send-monthly-report
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://[VOTRE_PROJECT_REF].supabase.co/functions/v1/send-monthly-report
```

### Étape 3 : Déployer la Edge Function

```bash
npx supabase functions deploy send-monthly-report --project-ref [VOTRE_PROJECT_REF]
```

### Étape 4 : Vérifier les secrets

Assurez-vous que les secrets suivants sont configurés dans **Supabase Dashboard** → **Edge Functions** → **Secrets** :
- ✅ `RESEND_API_KEY` - Clé API Resend
- ✅ `SUPABASE_URL` - URL de votre projet (automatique)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Clé service role (automatique)

## Test

### Tester pour un utilisateur spécifique

```bash
curl -X POST \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"userId": "[USER_ID]"}' \
  https://[PROJECT_REF].supabase.co/functions/v1/send-monthly-report
```

### Tester pour tous les utilisateurs

```bash
curl -X POST \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://[PROJECT_REF].supabase.co/functions/v1/send-monthly-report
```

## Gestion des préférences utilisateur

### Activer/Désactiver les rapports

Les utilisateurs peuvent modifier leurs préférences via une page de paramètres (à créer) :

```typescript
// Exemple de code pour mettre à jour les préférences
const { error } = await supabase
  .from('profiles')
  .update({
    monthly_report_enabled: true, // ou false
    report_frequency: 'monthly' // ou 'weekly'
  })
  .eq('user_id', user.id);
```

## Badges de performance

Le système génère automatiquement un badge de performance basé sur l'évolution de la note :

- **0.1 à 0.3** → "Bon" (badge vert clair)
- **0.3 à 0.5** → "Très bien" (badge vert)
- **0.5 à 0.7** → "Excellent" (badge bleu)
- **0.7 et plus** → "Incroyable" (badge violet)
- **Négatif ou 0** → "À améliorer" (badge orange)

## Prochaines étapes

1. ✅ Créer la Edge Function
2. ✅ Créer les migrations SQL
3. ⏳ Créer la page de paramètres utilisateur pour activer/désactiver
4. ⏳ Améliorer l'extraction des top points positifs/négatifs (utiliser l'analyse IA)
5. ⏳ Ajouter le support des rapports hebdomadaires

## Dépannage

### L'email n'est pas envoyé

1. Vérifiez les logs dans **Supabase Dashboard** → **Edge Functions** → **Logs**
2. Vérifiez que `RESEND_API_KEY` est configuré
3. Vérifiez que le domaine `reviewsvisor.fr` est vérifié dans Resend
4. Vérifiez que l'utilisateur a `monthly_report_enabled = true`

### Le CRON ne s'exécute pas

1. Vérifiez que le CRON job est bien configuré dans Supabase Dashboard
2. Vérifiez les logs du CRON job
3. Testez manuellement en appelant la fonction directement
