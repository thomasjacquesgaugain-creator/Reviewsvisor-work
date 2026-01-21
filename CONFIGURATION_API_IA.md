# Configuration de l'API IA pour "Générer avec IA"

## 🔍 Diagnostic de l'erreur "Unauthorized"

L'erreur "Unauthorized" lors du clic sur "Générer avec IA" est causée par une **clé API manquante ou invalide**.

## 📋 API utilisée

**Service** : Lovable AI Gateway  
**Modèle** : Google Gemini 2.5 Flash  
**Endpoint** : `https://ai.gateway.lovable.dev/v1/chat/completions`

L'Edge Function `generate-review-response` utilise cette API pour générer des réponses automatiques aux avis clients.

## 🔑 Clé API requise

**Variable d'environnement** : `LOVABLE_API_KEY`

Cette clé doit être configurée dans **Supabase** comme secret pour les Edge Functions.

## ✅ Comment configurer la clé API

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionnez votre projet : `zzjmtipdsccxmmoaetlp`

2. **Accédez aux Secrets des Edge Functions**
   - Dans le menu de gauche, allez dans **Edge Functions**
   - Cliquez sur **Secrets** (ou **Settings** → **Edge Functions** → **Secrets**)

3. **Ajoutez la clé API**
   - Cliquez sur **"Add new secret"** ou **"New secret"**
   - **Nom** : `LOVABLE_API_KEY`
   - **Valeur** : Votre clé API Lovable
   - Cliquez sur **"Save"** ou **"Add secret"**

### Option 2 : Via la CLI Supabase

```bash
# Installer la CLI Supabase si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local
supabase link --project-ref zzjmtipdsccxmmoaetlp

# Ajouter le secret
supabase secrets set LOVABLE_API_KEY=votre_cle_api_ici
```

### Option 3 : Via l'API Supabase

```bash
curl -X POST 'https://api.supabase.com/v1/projects/zzjmtipdsccxmmoaetlp/secrets' \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LOVABLE_API_KEY",
    "value": "votre_cle_api_ici"
  }'
```

## 🔐 Où obtenir votre clé API Lovable

1. **Connectez-vous à Lovable**
   - Allez sur [https://lovable.dev](https://lovable.dev)
   - Connectez-vous avec votre compte

2. **Accédez aux paramètres du projet**
   - Ouvrez votre projet Reviewsvisor
   - Allez dans **Settings** → **API Keys** ou **Secrets**

3. **Générez ou copiez votre clé API**
   - Si vous n'avez pas de clé, créez-en une
   - Copiez la clé (elle commence généralement par `lv_` ou similaire)

## ✅ Vérification de la configuration

### Vérifier que la clé est bien configurée

1. **Dans Supabase Dashboard**
   - Allez dans **Edge Functions** → **Secrets**
   - Vérifiez que `LOVABLE_API_KEY` est présente
   - ⚠️ **Important** : La valeur ne sera pas affichée pour des raisons de sécurité, mais le nom doit être visible

2. **Tester la fonctionnalité**
   - Retournez dans l'application
   - Cliquez sur "Générer avec IA" sur un avis
   - Si la clé est correcte, la réponse devrait être générée

### Vérifier les logs en cas d'erreur

1. **Dans Supabase Dashboard**
   - Allez dans **Edge Functions** → **Logs**
   - Sélectionnez la fonction `generate-review-response`
   - Recherchez les erreurs récentes

2. **Messages d'erreur courants** :
   - `LOVABLE_API_KEY non configurée` → La clé n'est pas définie
   - `Unauthorized` → La clé est invalide ou expirée
   - `429 Too Many Requests` → Limite de requêtes atteinte
   - `402 Payment Required` → Crédits insuffisants

## 📝 Fichiers concernés

- **Edge Function** : `supabase/functions/generate-review-response/index.ts`
  - Ligne 87-94 : Vérification de la clé API
  - Ligne 168-183 : Appel à l'API Lovable

- **Frontend** : `src/pages/Dashboard.tsx`
  - Ligne 2060-2111 : Fonction `generateAiResponse`

## 🚨 Erreurs courantes et solutions

### Erreur : "Configuration IA manquante"
**Cause** : `LOVABLE_API_KEY` n'est pas définie dans Supabase  
**Solution** : Ajoutez la clé via le Dashboard Supabase (voir Option 1 ci-dessus)

### Erreur : "Unauthorized" (401)
**Causes possibles** :
1. La clé API est invalide ou expirée
2. La clé n'a pas été correctement enregistrée
3. Il y a un problème d'authentification utilisateur

**Solutions** :
1. Vérifiez que la clé est correctement copiée (pas d'espaces avant/après)
2. Régénérez une nouvelle clé API dans Lovable
3. Vérifiez que vous êtes bien connecté dans l'application

### Erreur : "429 Too Many Requests"
**Cause** : Limite de requêtes atteinte  
**Solution** : Attendez quelques minutes avant de réessayer

### Erreur : "402 Payment Required"
**Cause** : Crédits insuffisants sur votre compte Lovable  
**Solution** : Rechargez votre compte Lovable

## 📚 Documentation supplémentaire

- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Lovable AI Gateway Documentation](https://docs.lovable.dev)

## 🔄 Après avoir ajouté la clé

1. **Redéployez l'Edge Function** (si nécessaire)
   ```bash
   supabase functions deploy generate-review-response
   ```

2. **Testez immédiatement**
   - La clé est disponible immédiatement après l'ajout
   - Aucun redéploiement n'est nécessaire normalement

3. **Vérifiez les logs**
   - Si l'erreur persiste, consultez les logs dans Supabase Dashboard


