import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import CollapsibleInstructionsHeader from "./CollapsibleInstructionsHeader";

import { bulkCreateReviews } from "@/services/reviewsService";
import { runAnalyze } from "@/lib/runAnalyze";
import { useNavigate } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { toast as sonnerToast } from "sonner";
import { getDisplayAuthor } from "@/utils/getDisplayAuthor";

interface ImportCsvPanelProps {
  onFileAnalyzed?: () => void;
  placeId?: string;
}

export default function ImportCsvPanel({ onFileAnalyzed, placeId }: ImportCsvPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentEstablishment = useCurrentEstablishment();
  
  // Utiliser l'établissement actuel si placeId n'est pas fourni en prop
  const activeEstablishment = placeId || currentEstablishment?.place_id;

  const handleFileSelect = useCallback((file: File) => {
    const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");
    
    if (!isCSV && !isJSON) {
      toast({
        title: "Format de fichier invalide",
        description: "Veuillez sélectionner un fichier CSV ou JSON.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier ne doit pas dépasser 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Mapping pour convertir les notes textuelles en nombres
  const convertStarRating = (starRating: any): number => {
    if (typeof starRating === 'number') return starRating;
    
    const ratingMap: Record<string, number> = {
      'FIVE': 5,
      'FOUR': 4,
      'THREE': 3,
      'TWO': 2,
      'ONE': 1,
    };
    
    if (typeof starRating === 'string') {
      const upperRating = starRating.toUpperCase();
      return ratingMap[upperRating] || 3; // Par défaut 3 étoiles si non reconnu
    }
    
    return 3; // Par défaut 3 étoiles
  };

  const parseGoogleTakeoutJSON = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          console.log('📄 Structure du fichier JSON importé:', data);
          console.log('📊 Clés disponibles:', Object.keys(data));
          
          if (!data.reviews || !Array.isArray(data.reviews)) {
            reject(new Error("Le fichier JSON ne correspond pas au format Google Takeout attendu (reviews.json)."));
            return;
          }
          
          console.log(`📝 Nombre d'avis trouvés dans le fichier: ${data.reviews.length}`);
          
          if (data.reviews.length > 0) {
            console.log('🔍 Exemple d\'avis (premier):', data.reviews[0]);
            console.log('🔑 Clés de l\'avis:', Object.keys(data.reviews[0]));
          }
          
          const reviews = data.reviews.map((review: any, index: number) => {
            const rating = convertStarRating(review.starRating);
            const displayAuthor = getDisplayAuthor(review);
            
            const parsedReview = {
              text: review.comment || "",
              rating: rating,
              author_name: displayAuthor,
              published_at: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
              source: "Google"
            };
            
            if (index === 0) {
              console.log('👤 Auteur extrait:', displayAuthor);
              console.log('✅ Avis normalisé (premier):', parsedReview);
            }
            
            return parsedReview;
          });
          
          console.log(`✨ Total d'avis normalisés: ${reviews.length}`);
          resolve(reviews);
        } catch (error) {
          console.error('❌ Erreur lors du parsing JSON:', error);
          reject(new Error("Le fichier JSON ne correspond pas au format Google Takeout attendu (reviews.json)."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error("Le fichier CSV est vide ou invalide"));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          console.log('📋 En-têtes CSV détectés:', headers);
          
          const reviews = lines.slice(1).map((line, lineIndex) => {
            const values = line.split(',').map(v => v.trim());
            const rawReview: any = {};
            
            // D'abord, mapper toutes les colonnes avec leurs noms originaux
            headers.forEach((header, index) => {
              rawReview[header] = values[index];
            });
            
            if (lineIndex === 0) {
              console.log('🔍 Premier avis brut CSV:', rawReview);
              console.log('🔑 Clés disponibles:', Object.keys(rawReview));
            }
            
            // Ensuite extraire les champs normalisés
            const review: any = {};
            
            headers.forEach((header, index) => {
              if (header.includes('rating') || header.includes('note')) {
                review.rating = parseFloat(values[index]) || 0;
              } else if (header.includes('text') || header.includes('comment') || header.includes('avis')) {
                review.text = values[index] || "";
              } else if (header.includes('date')) {
                review.published_at = values[index] || null;
              }
            });
            
            // Utiliser la fonction getDisplayAuthor pour extraire le nom
            const displayAuthor = getDisplayAuthor(rawReview);
            review.author_name = displayAuthor;
            
            if (lineIndex === 0) {
              console.log('👤 Auteur extrait:', displayAuthor);
            }

            return {
              ...review,
              source: "CSV"
            };
          });

          console.log(`✅ ${reviews.length} avis CSV parsés`);
          resolve(reviews);
        } catch (error) {
          reject(new Error("Erreur lors de la lecture du fichier CSV"));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier.",
        variant: "destructive",
      });
      return;
    }
    
    if (!activeEstablishment) {
      setError("Aucun établissement sélectionné. Ajoutez ou enregistrez un établissement avant d'importer des avis.");
      toast({
        title: "Erreur",
        description: "Aucun établissement sélectionné. Ajoutez ou enregistrez un établissement avant d'importer des avis.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setError(undefined);
    setSuccessMessage(undefined);

    try {
      const isJSON = selectedFile.name.endsWith(".json");
      let reviews: any[];
      
      // Déterminer le nom de l'établissement dès le début
      const establishmentName = currentEstablishment?.name || "Établissement";
      const establishmentIdForService = currentEstablishment?.id || activeEstablishment;
      
      // Parse le fichier selon son type
      if (isJSON) {
        reviews = await parseGoogleTakeoutJSON(selectedFile);
      } else {
        reviews = await parseCSV(selectedFile);
      }
      
      // Validation : vérifier qu'il y a au moins un avis
      if (!reviews || reviews.length === 0) {
        throw new Error("Le fichier ne contient aucun avis reconnu. Vérifiez que vous importez bien le fichier reviews.json de Google.");
      }
      
      console.log(`📦 Avis à importer: ${reviews.length} avis pour l'établissement "${establishmentName}"`);
      console.log('📋 Premiers avis:', reviews.slice(0, 3));

      // Préparer les avis pour l'import
      const reviewsToCreate = reviews.map(review => {
        const nameParts = (review.author_name || "").split(" ");
        return {
          establishment_id: establishmentIdForService!,
          establishment_place_id: activeEstablishment!,
          establishment_name: establishmentName,
          source: review.source || (isJSON ? "google" : "csv"),
          author_first_name: nameParts[0] || "",
          author_last_name: nameParts.slice(1).join(" ") || "",
          rating: review.rating,
          comment: review.text,
          review_date: review.published_at,
          import_method: isJSON ? "json_upload" : "csv_upload",
        };
      });
      
      // Import des avis dans la base de données
      const result = await bulkCreateReviews(reviewsToCreate);
      
      console.log(`✅ Résultat de l'import: ${result.inserted} insérés, ${result.skipped} ignorés`);
      
      // Lancer l'analyse des avis
      console.log('Lancement de l\'analyse pour place_id:', activeEstablishment);
      await runAnalyze({ 
        place_id: activeEstablishment,
        name: establishmentName,
      });
      
      // TOAST bas-droite avec rapport détaillé (même format que "Coller des avis")
      const duplicates = result.reasons?.duplicate || 0;
      sonnerToast.success(`✅ ${result.inserted} avis enregistrés pour ${establishmentName} (doublons: ${duplicates})`, {
        duration: 5000,
      });
      
      setSelectedFile(null);
      onFileAnalyzed?.();
      
    } catch (error) {
      console.error('Erreur lors de l\'import/analyse:', error);
      const errorMsg = error instanceof Error ? error.message : "Une erreur est survenue lors de l'import des avis. Veuillez vérifier votre fichier.";
      setError(errorMsg);
      
      // Toast d'erreur rouge en bas à droite
      sonnerToast.error(errorMsg, {
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <CollapsibleInstructionsHeader>
        {/* Contenu vide pour le moment */}
      </CollapsibleInstructionsHeader>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-border",
          selectedFile && "bg-muted/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou cliquez pour sélectionner un fichier CSV ou JSON
            </p>
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Sélectionner un fichier
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {selectedFile && (
        <Button
          className="w-full"
          onClick={handleAnalyze}
          disabled={isUploading || !activeEstablishment}
        >
          {isUploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Import en cours...
            </>
          ) : (
            "Analyser le fichier importé"
          )}
        </Button>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}
    </div>
  );
}
