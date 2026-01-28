# Configuration de l'API IA pour "Générer avec IA"

## 🔍 Diagnostic de l'erreur "Unauthorized"

L'erreur "Unauthorized" lors du clic sur "Générer avec IA" est causée par une **clé API manquante ou invalide**.

## 📋 API utilisée

**Service** : OpenAI  
**Modèle** : GPT-4o-mini  
**Endpoint** : `https://api.openai.com/v1/chat/completions`

L'Edge Function `generate-review-response` utilise cette API pour générer des réponses automatiques aux avis clients.

## 🔑 Clé API requise

**Variable d'environnement** : `CLÉ_API_OPENAI`

⚠️ **IMPORTANT** : Le nom exact de la variable est `CLÉ_API_OPENAI` (avec les accents et en majuscules).

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
   - **Nom** : `CLÉ_API_OPENAI` (⚠️ exactement comme indiqué, avec les accents)
   - **Valeur** : Votre clé API OpenAI (commence par `sk-`)
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
supabase secrets set CLÉ_API_OPENAI=votre_cle_api_openai_ici
```

### Option 3 : Via l'API Supabase

```bash
curl -X POST 'https://api.supabase.com/v1/projects/zzjmtipdsccxmmoaetlp/secrets' \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CLÉ_API_OPENAI",
    "value": "votre_cle_api_openai_ici"
  }'
```

## 🔐 Où obtenir votre clé API OpenAI

1. **Connectez-vous à OpenAI**
   - Allez sur [https://platform.openai.com](https://platform.openai.com)
   - Connectez-vous avec votre compte OpenAI

2. **Accédez aux API Keys**
   - Cliquez sur votre profil (en haut à droite)
   - Sélectionnez **"API keys"** ou **"View API keys"**
   - Ou allez directement sur [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. **Créez une nouvelle clé API**
   - Cliquez sur **"Create new secret key"**
   - Donnez-lui un nom (ex: "Reviewsvisor")
   - ⚠️ **Important** : Copiez la clé immédiatement, vous ne pourrez plus la voir après !
   - La clé commence par `sk-` (ex: `sk-proj-...`)

4. **Vérifiez vos crédits**
   - Assurez-vous d'avoir des crédits disponibles sur votre compte OpenAI
   - Allez dans **"Usage"** pour vérifier votre solde

## ✅ Vérification de la configuration

### Vérifier que la clé est bien configurée

1. **Dans Supabase Dashboard**
   - Allez dans **Edge Functions** → **Secrets**
   - Vérifiez que `CLÉ_API_OPENAI` est présente
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
   - `CLÉ_API_OPENAI non trouvée` → La clé n'est pas définie
   - `Unauthorized` (401) → La clé est invalide ou expirée
   - `429 Too Many Requests` → Limite de requêtes atteinte
   - `402 Payment Required` → Crédits insuffisants sur votre compte OpenAI

## 📝 Fichiers concernés

- **Edge Function** : `supabase/functions/generate-review-response/index.ts`
  - Ligne 117 : Récupération de la clé API (`CLÉ_API_OPENAI`)
  - Ligne 267-280 : Appel à l'API OpenAI

- **Frontend** : `src/pages/Dashboard.tsx`
  - Ligne 2060-2111 : Fonction `generateAiResponse`

## 🚨 Erreurs courantes et solutions

### Erreur : "Configuration IA manquante"
**Cause** : `CLÉ_API_OPENAI` n'est pas définie dans Supabase  
**Solution** : Ajoutez la clé via le Dashboard Supabase (voir Option 1 ci-dessus)

### Erreur : "Unauthorized" (401)
**Causes possibles** :
1. La clé API est invalide ou expirée
2. La clé n'a pas été correctement enregistrée
3. Il y a un problème d'authentification utilisateur

**Solutions** :
1. Vérifiez que la clé est correctement copiée (pas d'espaces avant/après)
2. Vérifiez que le nom de la variable est exactement `CLÉ_API_OPENAI` (avec les accents)
3. Régénérez une nouvelle clé API dans OpenAI
4. Vérifiez que vous avez des crédits disponibles sur votre compte OpenAI
5. Vérifiez que vous êtes bien connecté dans l'application

### Erreur : "429 Too Many Requests"
**Cause** : Limite de requêtes atteinte  
**Solution** : Attendez quelques minutes avant de réessayer

### Erreur : "402 Payment Required"
**Cause** : Crédits insuffisants sur votre compte OpenAI  
**Solution** : Rechargez votre compte OpenAI via [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)

## 📚 Documentation supplémentaire

- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI API Keys](https://platform.openai.com/api-keys)

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


