import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  uploadAvatar,
  deleteAvatar,
  updateProfileAvatarUrl,
  validateAvatarFile,
} from "@/services/avatarService";
import { supabase } from "@/integrations/supabase/client";

interface ProfilePhotoUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  displayName: string;
  onAvatarUpdated?: (avatarUrl: string | null) => void;
}

export function ProfilePhotoUploader({
  userId,
  currentAvatarUrl,
  displayName,
  onAvatarUpdated,
}: ProfilePhotoUploaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser avec les changements externes
  useEffect(() => {
    setAvatarUrl(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  // Nettoyer les URLs d'aperçu pour éviter les memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[ProfilePhotoUploader] handleFileSelect appelé");
    const file = event.target.files?.[0];
    if (!file) {
      console.log("[ProfilePhotoUploader] Aucun fichier sélectionné");
      return;
    }

    console.log("[ProfilePhotoUploader] Fichier sélectionné:", {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
    });

    // Validation
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      console.log("[ProfilePhotoUploader] Validation échouée:", validation.error);
      setError(validation.error || "Fichier invalide");
      toast.error(validation.error || "Fichier invalide");
      return;
    }

    setError(null);

    // Créer une preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    console.log("[ProfilePhotoUploader] Preview créée:", preview);

    // Upload
    try {
      setIsUploading(true);
      console.log("[ProfilePhotoUploader] Début de l'upload...");

      // Supprimer l'ancien avatar si existe
      if (avatarUrl) {
        console.log("[ProfilePhotoUploader] Suppression de l'ancien avatar:", avatarUrl);
        await deleteAvatar(avatarUrl);
      }

      // Upload le nouveau
      console.log("[ProfilePhotoUploader] Upload vers Supabase Storage...");
      const result = await uploadAvatar(userId, file);
      console.log("[ProfilePhotoUploader] Upload réussi:", result);

      // Mettre à jour le profil
      console.log("[ProfilePhotoUploader] Mise à jour du profil...");
      await updateProfileAvatarUrl(userId, result.url);
      console.log("[ProfilePhotoUploader] Profil mis à jour");

      // Mettre à jour l'état local
      setAvatarUrl(result.url);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);

      // Callback
      onAvatarUpdated?.(result.url);

      toast.success("Photo de profil mise à jour");
    } catch (err: any) {
      console.error("[ProfilePhotoUploader] Erreur lors de l'upload:", err);
      console.error("[ProfilePhotoUploader] Détails de l'erreur:", {
        message: err.message,
        status: err.status,
        statusText: err.statusText,
        error: err.error,
        name: err.name,
        stack: err.stack,
      });
      
      // Le message d'erreur est déjà formaté dans avatarService.ts
      // (détaillé en dev, générique en prod)
      const errorMessage = err.message || "Impossible d'envoyer la photo. Veuillez réessayer plus tard.";
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Nettoyer la preview en cas d'erreur
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      console.log("[ProfilePhotoUploader] Upload terminé");
      // Réinitialiser l'input pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setIsUploading(true);

      // Supprimer de Storage
      await deleteAvatar(avatarUrl);

      // Mettre à jour le profil
      await updateProfileAvatarUrl(userId, null);

      // Mettre à jour l'état local
      setAvatarUrl(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Callback
      onAvatarUpdated?.(null);

      toast.success("Photo de profil supprimée");
    } catch (err: any) {
      console.error("Error removing avatar:", err);
      toast.error("Erreur lors de la suppression de la photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    console.log("[ProfilePhotoUploader] handleButtonClick appelé");
    console.log("[ProfilePhotoUploader] fileInputRef.current:", fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log("[ProfilePhotoUploader] click() appelé sur input");
    } else {
      console.error("[ProfilePhotoUploader] fileInputRef.current est null");
    }
  };

  const displayUrl = previewUrl || avatarUrl;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt="Photo de profil" />
          ) : null}
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4" />
            <span>{avatarUrl ? "Changer la photo" : "Ajouter une photo"}</span>
          </Button>
          {avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemoveAvatar}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
              <span>Supprimer</span>
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <p className="text-xs text-gray-500">
          JPG, PNG ou WebP. Taille maximale : 2 Mo
        </p>
      </div>
    </div>
  );
}
