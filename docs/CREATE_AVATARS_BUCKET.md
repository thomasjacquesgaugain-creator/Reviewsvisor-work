# Créer le bucket "avatars" dans Supabase

## Projet Supabase utilisé

**Project Ref** : `zzjmtipdsccxmmoaetlp`  
**URL** : `https://zzjmtipdsccxmmoaetlp.supabase.co`

## Méthode 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez le projet `zzjmtipdsccxmmoaetlp`
3. Allez dans **Storage** (menu gauche)
4. Cliquez sur **"New bucket"**
5. Configurez :
   - **Name** : `avatars` (exactement, minuscules, sans espace)
   - **Public bucket** : ✅ **Activé** (très important !)
   - **File size limit** : `2097152` (2 Mo)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp`
6. Cliquez sur **"Create bucket"**

## Méthode 2 : Via SQL Editor

1. Allez dans **SQL Editor** (menu gauche)
2. Créez une nouvelle query
3. Copiez-collez ce SQL :

```sql
-- Créer le bucket avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
```

4. Cliquez sur **"Run"**

## Méthode 3 : Via les migrations

Si vous utilisez Supabase CLI :

```bash
# Dans le terminal, à la racine du projet
supabase db push
```

Ou exécutez manuellement les migrations dans l'ordre :
1. `20250115000000_add_avatar_url_to_profiles.sql`
2. `20250115000001_create_avatars_bucket.sql`
3. `20250115000002_avatars_bucket_policies.sql`

## Vérification

Après création, vérifiez :

1. **Dans le Dashboard** :
   - Storage > Le bucket "avatars" apparaît
   - Icône globe visible (bucket public)
   - Policies présentes (4 policies)

2. **Dans la console du navigateur** (dev) :
   - Ouvrez la console (F12)
   - Rechargez la page
   - Vous devriez voir : `✅ Bucket "avatars" trouvé !`

3. **Test d'upload** :
   - Allez sur `/settings/profile`
   - Cliquez "Ajouter une photo"
   - L'upload devrait fonctionner

## Si le bucket existe déjà mais n'est pas public

1. Dashboard > Storage > avatars
2. Cliquez sur les **3 points** > **Edit bucket**
3. Activez **"Public bucket"**
4. Sauvegardez

## Dépannage

### "Bucket not found" persiste

1. Vérifiez que vous êtes dans le **bon projet** Supabase
2. Vérifiez le **project ref** dans la console (dev) : doit être `zzjmtipdsccxmmoaetlp`
3. Si différent, vérifiez vos variables d'environnement :
   - `.env.local` ou `.env`
   - `VITE_SUPABASE_URL` doit pointer vers le bon projet
   - `VITE_SUPABASE_ANON_KEY` doit être la clé du bon projet

### Le bucket existe mais l'upload échoue (401/403)

1. Vérifiez les **policies** :
   - Dashboard > Storage > avatars > Policies
   - 4 policies doivent être présentes
2. Si absentes, exécutez `20250115000002_avatars_bucket_policies.sql`
