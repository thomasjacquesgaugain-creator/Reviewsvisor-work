# Configuration de l'upload d'avatar

## Problème : "Bucket not found"

Si vous obtenez l'erreur "Bucket not found", le bucket `avatars` n'existe pas dans Supabase Storage.

## Solution 1 : Via les migrations (recommandé)

Exécutez les migrations dans l'ordre :

```bash
# Migration 1 : Créer le bucket
supabase migration up 20250115000001_create_avatars_bucket.sql

# Migration 2 : Créer les policies
supabase migration up 20250115000002_avatars_bucket_policies.sql

# Migration 3 : Vérifier/créer si nécessaire
supabase migration up 20250115000003_verify_avatars_bucket.sql
```

## Solution 2 : Via le Dashboard Supabase (manuel)

1. Allez dans **Supabase Dashboard** > **Storage**
2. Cliquez sur **"New bucket"**
3. Configurez :
   - **Name** : `avatars` (exactement, sans majuscule)
   - **Public bucket** : ✅ Activé
   - **File size limit** : `2097152` (2 Mo)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp`
4. Cliquez sur **"Create bucket"**

## Solution 3 : Via SQL direct (SQL Editor)

Exécutez dans le SQL Editor de Supabase :

```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Créer les policies
-- (Copier le contenu de 20250115000002_avatars_bucket_policies.sql)
```

## Vérification

Après création du bucket, testez l'upload :
1. Allez sur `/settings/profile`
2. Cliquez sur "Changer la photo"
3. Sélectionnez une image (JPG/PNG/WebP, < 2 Mo)
4. L'upload devrait fonctionner

## Structure du bucket

- **Nom** : `avatars` (exactement)
- **Public** : Oui
- **Structure des fichiers** : `{userId}/{timestamp}.{ext}`
  - Exemple : `550e8400-e29b-41d4-a716-446655440000/1704067200000.jpg`

## Policies requises

Les policies permettent :
- ✅ Utilisateurs authentifiés peuvent uploader dans leur dossier (`userId/`)
- ✅ Utilisateurs authentifiés peuvent modifier/supprimer leurs propres fichiers
- ✅ Tout le monde peut lire (bucket public)

## Dépannage

### Erreur 404 "Bucket not found"
→ Le bucket n'existe pas. Créez-le via Dashboard ou migration.

### Erreur 401/403 "Unauthorized"
→ Les policies RLS ne sont pas configurées. Exécutez la migration des policies.

### Erreur "Column avatar_url does not exist"
→ La colonne n'existe pas dans `profiles`. Exécutez `20250115000000_add_avatar_url_to_profiles.sql`.
