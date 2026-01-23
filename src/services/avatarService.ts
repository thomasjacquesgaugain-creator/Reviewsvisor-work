/**
 * Service pour gérer l'upload et la suppression des avatars
 */

import { supabase } from "@/integrations/supabase/client";

// Détecter l'environnement (dev vs prod)
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadAvatarResult {
  url: string;
  path: string;
}

/**
 * Valide un fichier image
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Format non supporté. Utilisez JPG, PNG ou WebP.",
    };
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale : ${MAX_FILE_SIZE / 1024 / 1024} Mo`,
    };
  }

  return { valid: true };
}

/**
 * Génère un nom de fichier unique pour l'avatar
 */
function generateAvatarFileName(userId: string, file: File): string {
  const extension = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  return `${userId}/${timestamp}.${extension}`;
}

/**
 * Upload un avatar vers Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadAvatarResult> {
  // Validation
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Générer le nom de fichier
  const fileName = generateAvatarFileName(userId, file);

  // Vérifier que l'utilisateur est authentifié
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Vous devez être connecté pour uploader une photo de profil");
  }

  // Vérifier que le bucket existe (en dev uniquement)
  if (isDev) {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (!bucketsError) {
      const bucketExists = buckets?.some(b => b.name === AVATAR_BUCKET);
      if (!bucketExists) {
        const bucketNames = buckets?.map(b => b.name).join(', ') || 'aucun';
        throw new Error(`Bucket "${AVATAR_BUCKET}" introuvable. Buckets disponibles : ${bucketNames || 'aucun'}. Créez le bucket "avatars" dans Supabase Dashboard > Storage.`);
      }
    }
  }

  // Upload vers Supabase Storage
  console.log("[avatarService] Upload vers bucket:", AVATAR_BUCKET);
  console.log("[avatarService] Nom de fichier:", fileName);
  console.log("[avatarService] Taille fichier:", file.size, "bytes");
  console.log("[avatarService] User ID:", userId);
  
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false, // Ne pas écraser si existe déjà
    });

  if (error) {
    console.error("[avatarService] Erreur upload:", error);
    console.error("[avatarService] Détails erreur:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      name: error.name,
    });
    
    // Message d'erreur selon l'environnement (détaillé en dev, simple en prod)
    let errorMessage: string;
    
    if (error.message?.includes("Bucket not found") || error.message?.includes("bucket") || error.statusCode === 404) {
      if (isDev) {
        errorMessage = `❌ Bucket "avatars" introuvable.

Actions requises :
1. Allez dans Supabase Dashboard > Storage
2. Créez un bucket nommé exactement "avatars" (public = true)
3. OU exécutez la migration : supabase/migrations/20250115000001_create_avatars_bucket.sql

Puis exécutez aussi : supabase/migrations/20250115000002_avatars_bucket_policies.sql`;
      } else {
        errorMessage = "Impossible d'envoyer la photo. Veuillez réessayer plus tard.";
      }
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      if (isDev) {
        errorMessage = `❌ Erreur d'autorisation (${error.statusCode}).

Vérifiez que :
1. Le bucket "avatars" existe dans Supabase Storage
2. Les policies RLS sont configurées (migration 20250115000002_avatars_bucket_policies.sql)
3. L'utilisateur est authentifié (session valide)`;
      } else {
        errorMessage = "Impossible d'envoyer la photo. Vérifiez vos permissions.";
      }
    } else {
      // Autre erreur
      if (isDev) {
        errorMessage = `Erreur lors de l'upload : ${error.message} (${error.statusCode || 'N/A'})`;
      } else {
        errorMessage = "Impossible d'envoyer la photo. Veuillez réessayer plus tard.";
      }
    }
    
    const enhancedError: any = new Error(errorMessage);
    enhancedError.status = error.statusCode;
    enhancedError.error = error;
    throw enhancedError;
  }

  console.log("[avatarService] Upload réussi, path:", data.path);

  // Récupérer l'URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

  console.log("[avatarService] URL publique générée:", publicUrl);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Supprime un avatar de Supabase Storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  if (!avatarUrl) {
    console.log("[avatarService] deleteAvatar: URL vide, rien à supprimer");
    return;
  }

  console.log("[avatarService] Suppression avatar:", avatarUrl);

  // Extraire le chemin depuis l'URL si nécessaire
  // Format: https://xxx.supabase.co/storage/v1/object/public/avatars/userId/timestamp.ext
  let path: string;
  if (avatarUrl.includes("/storage/v1/object/public/avatars/")) {
    path = avatarUrl.split("/storage/v1/object/public/avatars/")[1];
  } else if (avatarUrl.includes("/avatars/")) {
    // Format alternatif
    path = avatarUrl.split("/avatars/")[1];
  } else {
    // Déjà un chemin relatif
    path = avatarUrl;
  }

  console.log("[avatarService] Chemin extrait pour suppression:", path);

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);

  if (error) {
    console.error("[avatarService] Erreur suppression avatar:", error);
    // Ne pas throw pour éviter de bloquer l'UI si la suppression échoue
    console.warn("[avatarService] Impossible de supprimer l'ancien avatar, mais la mise à jour continue");
  } else {
    console.log("[avatarService] Avatar supprimé avec succès");
  }
}

/**
 * Met à jour l'URL de l'avatar dans le profil utilisateur
 */
export async function updateProfileAvatarUrl(
  userId: string,
  avatarUrl: string | null
): Promise<void> {
  console.log("[avatarService] Mise à jour avatar_url pour userId:", userId);
  console.log("[avatarService] Nouvelle URL:", avatarUrl);
  
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        avatar_url: avatarUrl,
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("[avatarService] Erreur mise à jour profil:", error);
    console.error("[avatarService] Détails erreur:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    let errorMessage: string;
    
    if (error.code === "PGRST116") {
      errorMessage = isDev 
        ? "Profil non trouvé. Vérifiez que l'utilisateur existe dans la table profiles."
        : "Impossible de mettre à jour votre profil.";
    } else if (error.code === "42501") {
      errorMessage = isDev
        ? "Erreur de permissions. Vérifiez les policies RLS de la table profiles."
        : "Impossible de mettre à jour votre profil. Vérifiez vos permissions.";
    } else {
      errorMessage = isDev
        ? `Erreur lors de la mise à jour du profil : ${error.message}`
        : "Impossible de mettre à jour votre profil. Veuillez réessayer.";
    }
    
    throw new Error(errorMessage);
  }

  console.log("[avatarService] Profil mis à jour avec succès:", data);
}
