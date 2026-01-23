# Guide de déploiement - Upload d'avatar

## ✅ Checklist de déploiement

### 1. Migrations Supabase (OBLIGATOIRE)

Exécutez les migrations dans l'ordre :

```bash
# 1. Ajouter la colonne avatar_url
supabase migration up 20250115000000_add_avatar_url_to_profiles.sql

# 2. Créer le bucket avatars
supabase migration up 20250115000001_create_avatars_bucket.sql

# 3. Créer les policies
supabase migration up 20250115000002_avatars_bucket_policies.sql
```

**OU** via Supabase Dashboard > SQL Editor (copier-coller chaque fichier).

### 2. Vérification manuelle (recommandé)

1. Allez dans **Supabase Dashboard** > **Storage**
2. Vérifiez que le bucket **"avatars"** existe
3. Vérifiez qu'il est **public** (icône globe visible)
4. Vérifiez les **Policies** :
   - "Users can upload their own avatars" (INSERT)
   - "Users can update their own avatars" (UPDATE)
   - "Users can delete their own avatars" (DELETE)
   - "Avatars are publicly readable" (SELECT)

### 3. Si le bucket n'existe pas

**Option A : Via Dashboard**
1. Storage > New bucket
2. Name: `avatars` (exactement, minuscules)
3. Public: ✅ Activé
4. File size limit: `2097152` (2 Mo)
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

**Option B : Via SQL**
Exécutez `20250115000004_create_avatars_bucket_simple.sql` dans SQL Editor.

### 4. Test de l'upload

1. Connectez-vous à l'application
2. Allez sur `/settings/profile`
3. Cliquez sur "Ajouter une photo" ou "Changer la photo"
4. Sélectionnez une image (JPG/PNG/WebP, < 2 Mo)
5. Vérifiez :
   - ✅ Preview immédiate
   - ✅ Upload réussi (toast de succès)
   - ✅ Photo affichée
   - ✅ Photo persiste après refresh (F5)

### 5. Test de la suppression

1. Cliquez sur "Supprimer"
2. Vérifiez :
   - ✅ Photo supprimée
   - ✅ Initiales affichées
   - ✅ Persiste après refresh

## 🔍 Dépannage

### Erreur "Bucket not found"

**Cause** : Le bucket `avatars` n'existe pas dans Supabase Storage.

**Solution** :
1. Créez le bucket via Dashboard ou migration
2. Vérifiez que le nom est exactement `avatars` (pas "avatar", pas "Avatars")

### Erreur 401/403 "Unauthorized"

**Cause** : Les policies RLS ne sont pas configurées.

**Solution** :
1. Exécutez `20250115000002_avatars_bucket_policies.sql`
2. Vérifiez dans Dashboard > Storage > avatars > Policies

### Erreur "Column avatar_url does not exist"

**Cause** : La colonne n'existe pas dans la table `profiles`.

**Solution** :
1. Exécutez `20250115000000_add_avatar_url_to_profiles.sql`

### La photo ne s'affiche pas après upload

**Vérifications** :
1. Console navigateur : vérifiez l'URL générée
2. Supabase Storage : vérifiez que le fichier est présent
3. Table `profiles` : vérifiez que `avatar_url` est rempli
4. Refresh du profil : vérifiez que `refreshProfile()` est appelé

## 📋 Structure attendue

### Bucket Storage
- **Nom** : `avatars`
- **Public** : `true`
- **Limite** : 2 Mo
- **Types** : `image/jpeg`, `image/png`, `image/webp`

### Structure des fichiers
```
avatars/
  └── {userId}/
      └── {timestamp}.{ext}
```

Exemple : `avatars/550e8400-e29b-41d4-a716-446655440000/1704067200000.jpg`

### Table profiles
- Colonne `avatar_url` (TEXT, nullable)
- Contient l'URL publique complète

## 🚀 Production

En production, les messages d'erreur sont génériques :
- ❌ Dev : "Bucket 'avatars' introuvable. Créez-le dans Supabase..."
- ✅ Prod : "Impossible d'envoyer la photo. Veuillez réessayer plus tard."

Les logs détaillés restent dans la console (dev tools) pour le debugging.
