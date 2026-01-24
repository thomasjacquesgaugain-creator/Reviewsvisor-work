/**
 * Utilitaires de diagnostic Supabase
 * Pour vérifier la configuration et les buckets Storage
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Masque une partie de l'URL pour la sécurité
 */
function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Masquer le milieu de l'hostname : zzjmtipdsccxmmoaetlp.supabase.co -> zzj***etlp.supabase.co
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0].length > 6) {
      const masked = parts[0].substring(0, 3) + '***' + parts[0].substring(parts[0].length - 3);
      return `${urlObj.protocol}//${masked}.${parts.slice(1).join('.')}`;
    }
    return url;
  } catch {
    return url.substring(0, 20) + '***';
  }
}

/**
 * Extrait le project ref depuis l'URL Supabase
 */
function extractProjectRef(url: string): string | null {
  try {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Vérifie la configuration Supabase et liste les buckets disponibles
 */
export async function diagnoseSupabaseStorage() {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  if (!isDev) {
    // Ne pas faire de diagnostic en production
    return;
  }

  try {
    // Récupérer l'URL depuis le client (via introspection)
    const supabaseUrl = (supabase as any).supabaseUrl || 'unknown';
    const projectRef = extractProjectRef(supabaseUrl);
    const maskedUrl = maskUrl(supabaseUrl);

    console.group('🔍 Diagnostic Supabase Storage');
    console.log('📡 Supabase URL:', maskedUrl);
    console.log('🆔 Project Ref:', projectRef || 'non détecté');
    
    // Lister les buckets disponibles
    console.log('📦 Vérification des buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      console.error('   Message:', bucketsError.message);
      console.error('   Status:', bucketsError.statusCode);
      console.groupEnd();
      return {
        success: false,
        error: bucketsError.message,
        buckets: [],
      };
    }

    const bucketNames = buckets?.map(b => b.name) || [];
    const hasAvatarsBucket = bucketNames.includes('avatars');

    console.log('✅ Buckets disponibles:', bucketNames.length);
    buckets?.forEach(bucket => {
      const isAvatars = bucket.name === 'avatars';
      const icon = isAvatars ? '✅' : '  ';
      console.log(`${icon} - ${bucket.name} (public: ${bucket.public ? 'oui' : 'non'})`);
    });

    if (!hasAvatarsBucket) {
      console.warn('⚠️ Bucket "avatars" ABSENT dans ce projet Supabase !');
      console.warn('   Actions requises :');
      console.warn('   1. Allez dans Supabase Dashboard > Storage');
      console.warn('   2. Créez un bucket nommé exactement "avatars"');
      console.warn('   3. Activez "Public bucket"');
      console.warn('   4. OU exécutez la migration SQL dans ce projet');
      console.warn(`   Project: ${projectRef || 'unknown'}`);
    } else {
      const avatarsBucket = buckets?.find(b => b.name === 'avatars');
      console.log('✅ Bucket "avatars" trouvé !');
      console.log('   Public:', avatarsBucket?.public ? '✅ Oui' : '❌ Non (doit être public)');
      console.log('   File size limit:', avatarsBucket?.file_size_limit ? `${avatarsBucket.file_size_limit / 1024 / 1024} Mo` : 'non défini');
    }

    console.groupEnd();

    return {
      success: true,
      projectRef,
      buckets: bucketNames,
      hasAvatarsBucket,
      avatarsBucket: buckets?.find(b => b.name === 'avatars'),
    };
  } catch (error: any) {
    console.error('❌ Erreur lors du diagnostic:', error);
    return {
      success: false,
      error: error.message,
      buckets: [],
    };
  }
}
