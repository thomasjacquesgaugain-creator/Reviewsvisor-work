# 🚀 Guide de Déploiement - Edge Function generate-review-response

## 📋 Prérequis

1. **Node.js et npm installés**
2. **Compte Supabase** avec accès au projet
3. **CLI Supabase** (sera installée automatiquement via npx)

## 🔐 Étape 1 : Se connecter à Supabase

Avant de déployer, vous devez vous authentifier :

```bash
npx supabase login
```

Cette commande va :
1. Ouvrir votre navigateur
2. Vous demander de vous connecter à Supabase
3. Autoriser l'accès à la CLI

**Alternative** : Si vous préférez utiliser un token d'accès :

```bash
# Obtenez votre access token depuis : https://supabase.com/dashboard/account/tokens
# Puis définissez-le comme variable d'environnement :
$env:SUPABASE_ACCESS_TOKEN="votre_token_ici"
```

## 🚀 Étape 2 : Déployer la fonction

Une fois connecté, déployez la fonction :

```bash
cd C:\Users\Thomas\Documents\reviewsvisor
npx supabase functions deploy generate-review-response --project-ref zzjmtipdsccxmmoaetlp
```

### Options de déploiement

**Déployer une fonction spécifique** :
```bash
npx supabase functions deploy generate-review-response --project-ref zzjmtipdsccxmmoaetlp
```

**Déployer toutes les fonctions** :
```bash
npx supabase functions deploy --project-ref zzjmtipdsccxmmoaetlp
```

**Déployer avec vérification JWT désactivée** (si nécessaire) :
```bash
npx supabase functions deploy generate-review-response --project-ref zzjmtipdsccxmmoaetlp --no-verify-jwt
```

## 📝 Étape 3 : Vérifier le déploiement

Après le déploiement, vous devriez voir :
```
Deploying function generate-review-response...
Function generate-review-response deployed successfully
```

### Vérification dans le Dashboard

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : `zzjmtipdsccxmmoaetlp`
3. Allez dans **Edge Functions**
4. Vérifiez que `generate-review-response` est listée
5. Cliquez dessus pour voir les détails et les logs

## 🔧 Configuration requise

Assurez-vous que les secrets suivants sont configurés dans Supabase :

1. **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Vérifiez que ces secrets existent :
   - ✅ `LOVABLE_API_KEY` (pour l'API Lovable)
   - ✅ `CLÉ_API_OPENAI` (pour OpenAI si utilisé)
   - ✅ `SUPABASE_URL` (automatique)
   - ✅ `SUPABASE_ANON_KEY` (automatique)

## 🐛 Résolution de problèmes

### Erreur : "Access token not provided"

**Solution** :
```bash
npx supabase login
```

### Erreur : "Project not found"

**Solution** : Vérifiez que le `project-ref` est correct :
- Votre project ref : `zzjmtipdsccxmmoaetlp`
- Trouvable dans : Supabase Dashboard → Settings → General → Reference ID

### Erreur : "Function not found"

**Solution** : Vérifiez que le fichier existe :
```
supabase/functions/generate-review-response/index.ts
```

### Erreur de déploiement

**Solution** : Vérifiez les logs détaillés :
```bash
npx supabase functions deploy generate-review-response --project-ref zzjmtipdsccxmmoaetlp --debug
```

## 📚 Commandes utiles

**Lister les fonctions déployées** :
```bash
npx supabase functions list --project-ref zzjmtipdsccxmmoaetlp
```

**Voir les logs d'une fonction** :
```bash
npx supabase functions logs generate-review-response --project-ref zzjmtipdsccxmmoaetlp
```

**Supprimer une fonction** :
```bash
npx supabase functions delete generate-review-response --project-ref zzjmtipdsccxmmoaetlp
```

## ✅ Checklist de déploiement

- [ ] Connecté à Supabase (`npx supabase login`)
- [ ] Dans le bon répertoire (`cd C:\Users\Thomas\Documents\reviewsvisor`)
- [ ] Les secrets sont configurés dans Supabase Dashboard
- [ ] La fonction est déployée avec succès
- [ ] Testé dans l'application

## 🎯 Commandes rapides (PowerShell)

```powershell
# Se connecter
npx supabase login

# Déployer
cd C:\Users\Thomas\Documents\reviewsvisor
npx supabase functions deploy generate-review-response --project-ref zzjmtipdsccxmmoaetlp

# Voir les logs
npx supabase functions logs generate-review-response --project-ref zzjmtipdsccxmmoaetlp
```


