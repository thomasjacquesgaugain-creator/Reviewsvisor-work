# 🔍 Guide de Debug - Erreur "Unauthorized" pour Générer avec IA

## 📋 Informations importantes

**⚠️ ATTENTION** : L'API utilisée est **Lovable AI Gateway**, pas OpenAI directement.

**Variable d'environnement requise** : `LOVABLE_API_KEY` (pas `OPENAI_API_KEY`)

## 🔍 Vérification étape par étape

### 1. Vérifier que la clé est dans Supabase Secrets

**Où vérifier** :
1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **Edge Functions** → **Secrets** (ou **Settings** → **Edge Functions** → **Secrets**)

**Ce qu'il faut voir** :
- ✅ `LOVABLE_API_KEY` doit être dans la liste
- ⚠️ La valeur ne sera pas affichée (sécurité), mais le nom doit être présent

**Si la clé n'est pas là** :
- Cliquez sur **"Add new secret"**
- Nom : `LOVABLE_API_KEY`
- Valeur : Votre clé API Lovable
- Cliquez sur **"Save"**

### 2. Vérifier les logs de l'Edge Function

**Où voir les logs** :
1. Supabase Dashboard → **Edge Functions** → **Logs**
2. Sélectionnez la fonction : `generate-review-response`
3. Filtrez par "Error" ou regardez les logs récents

**Logs à rechercher** :

#### ✅ Si la clé est trouvée :
```
[generate-review-response] ✅ LOVABLE_API_KEY trouvée (longueur: XX preview: xxxx...xxxx)
```

#### ❌ Si la clé n'est pas trouvée :
```
[generate-review-response] ❌ LOVABLE_API_KEY non trouvée dans Deno.env
[generate-review-response] Vérifiez que la clé est bien configurée dans Supabase Dashboard → Edge Functions → Secrets
```

#### 🔐 Si la clé est invalide (401) :
```
[generate-review-response] 🔐 401 Unauthorized - La clé API est invalide ou expirée
[generate-review-response] Vérifiez que LOVABLE_API_KEY dans Supabase Secrets est correcte
```

### 3. Vérifier le nom de la variable

**⚠️ IMPORTANT** : Le code cherche `LOVABLE_API_KEY`, pas `OPENAI_API_KEY`

**Variables vérifiées automatiquement** :
- ✅ `LOVABLE_API_KEY` (correct)
- ❌ `OPENAI_API_KEY` (incorrect pour cette fonction)
- ❌ `VITE_LOVABLE_API_KEY` (incorrect - c'est pour le frontend)
- ❌ `LOVABLE_KEY` (incorrect)

**Si vous avez configuré une autre variable** :
- Renommez-la en `LOVABLE_API_KEY` dans Supabase Secrets

### 4. Vérifier que la clé est valide

**Où obtenir une clé valide** :
1. Connectez-vous sur [Lovable.dev](https://lovable.dev)
2. Ouvrez votre projet Reviewsvisor
3. Allez dans **Settings** → **API Keys**
4. Générez ou copiez votre clé API

**Format de la clé** :
- Généralement commence par `lv_` ou similaire
- Longueur typique : 40-60 caractères

## 🐛 Scénarios de debug

### Scénario 1 : "Configuration IA manquante"

**Logs attendus** :
```
[generate-review-response] ❌ LOVABLE_API_KEY non trouvée dans Deno.env
```

**Solution** :
1. Vérifiez que `LOVABLE_API_KEY` existe dans Supabase Secrets
2. Si elle n'existe pas, ajoutez-la (voir étape 1)
3. Attendez 1-2 minutes pour que le secret soit propagé
4. Réessayez

### Scénario 2 : "Unauthorized" (401)

**Logs attendus** :
```
[generate-review-response] 🔐 401 Unauthorized - La clé API est invalide ou expirée
```

**Causes possibles** :
1. La clé est incorrecte (copie incomplète, espaces avant/après)
2. La clé a expiré
3. La clé n'a pas les permissions nécessaires

**Solution** :
1. Vérifiez que la clé est complète (pas d'espaces)
2. Régénérez une nouvelle clé dans Lovable
3. Mettez à jour `LOVABLE_API_KEY` dans Supabase Secrets
4. Réessayez

### Scénario 3 : La clé existe mais n'est pas chargée

**Logs attendus** :
```
[generate-review-response] Variables d'environnement disponibles: [...]
[generate-review-response] ❌ LOVABLE_API_KEY non trouvée dans Deno.env
```

**Solution** :
1. Vérifiez l'orthographe exacte : `LOVABLE_API_KEY` (majuscules, underscore)
2. Supprimez et recréez le secret dans Supabase
3. Redéployez l'Edge Function si nécessaire :
   ```bash
   supabase functions deploy generate-review-response
   ```

## 📝 Checklist de vérification

- [ ] `LOVABLE_API_KEY` existe dans Supabase Secrets
- [ ] Le nom est exactement `LOVABLE_API_KEY` (pas d'espaces, majuscules correctes)
- [ ] La clé est complète (pas tronquée lors de la copie)
- [ ] La clé est valide (obtenue depuis Lovable.dev)
- [ ] Les logs montrent que la clé est trouvée
- [ ] Pas d'erreur 401 dans les logs

## 🔄 Après avoir corrigé

1. **Attendez 1-2 minutes** pour que les secrets soient propagés
2. **Testez immédiatement** dans l'application
3. **Vérifiez les nouveaux logs** pour confirmer que ça fonctionne

## 📞 Si le problème persiste

1. **Copiez les logs complets** depuis Supabase Dashboard
2. **Vérifiez** :
   - Que la clé commence bien par les bons caractères (preview dans les logs)
   - Que la longueur de la clé est correcte
   - Qu'il n'y a pas d'erreur de typage

3. **Testez la clé directement** :
   ```bash
   curl -X POST 'https://ai.gateway.lovable.dev/v1/chat/completions' \
     -H "Authorization: Bearer VOTRE_CLE_ICI" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "google/gemini-2.5-flash",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

   Si ça retourne 401, la clé est invalide.
   Si ça fonctionne, le problème vient de la configuration Supabase.


