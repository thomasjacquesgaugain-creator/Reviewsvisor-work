# Configuration du Cron Job Supabase

Pour activer la synchronisation automatique toutes les 6 heures, vous devez exécuter le SQL suivant dans votre console Supabase :

## Étape 1 : Activer les extensions

```sql
-- Activer pg_cron (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Activer pg_net (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## Étape 2 : Créer le cron job

```sql
-- Supprimer l'ancien job s'il existe
SELECT cron.unschedule('google-reviews-sync');

-- Créer le job de synchronisation toutes les 6 heures
SELECT cron.schedule(
  'google-reviews-sync',
  '0 */6 * * *',  -- Toutes les 6 heures à heure pile (0:00, 6:00, 12:00, 18:00)
  $$
  SELECT
    net.http_post(
        url:='https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/google-sync-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## Étape 3 : Vérifier que le cron est actif

```sql
-- Voir tous les cron jobs actifs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Modification de la fréquence

Si vous voulez changer la fréquence :

```sql
-- Toutes les heures
SELECT cron.schedule('google-reviews-sync', '0 * * * *', $$ ... $$);

-- Toutes les 3 heures
SELECT cron.schedule('google-reviews-sync', '0 */3 * * *', $$ ... $$);

-- Tous les jours à 2h du matin
SELECT cron.schedule('google-reviews-sync', '0 2 * * *', $$ ... $$);

-- Toutes les 30 minutes
SELECT cron.schedule('google-reviews-sync', '*/30 * * * *', $$ ... $$);
```

## Désactiver le cron

```sql
SELECT cron.unschedule('google-reviews-sync');
```

## Notes importantes

- Le cron job appellera automatiquement la fonction `google-sync-cron` qui :
  - Rafraîchit les tokens expirés
  - Synchronise les avis de tous les utilisateurs connectés
  - Crée des logs dans `import_logs`
  - Ne traite que les nouveaux/mis à jour depuis la dernière sync

- Les logs d'exécution sont visibles dans `/parametres`

- En cas d'erreur, vérifier `cron.job_run_details` dans Supabase