import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { bulkCreateReviews } from "@/services/reviewsService";
import { runAnalyze } from "@/lib/runAnalyze";
import { useNavigate } from "react-router-dom";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";

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
          }
          
          const reviews = data.reviews.map((review: any, index: number) => {
            const rating = convertStarRating(review.starRating);
            const parsedReview = {
              text: review.comment || "",
              rating: rating,
              published_at: review.createTime || new Date().toISOString(),
              source: "google",
              author_name: review.reviewer?.displayName || "Anonyme",
            };
            
            if (index === 0) {
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
          
          const reviews = lines.map((line, index) => {
            const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
            
            return {
              text: columns[0] || "",
              rating: columns[3] ? parseInt(columns[3]) : 3,
              published_at: columns[2] || new Date().toISOString(),
              source: columns[1] || "csv",
              author_name: `Client ${index + 1}`,
            };
          });
          
          resolve(reviews);
        } catch (error) {
          reject(new Error("Erreur lors de la lecture du fichier CSV."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    setError(undefined);
    setSuccessMessage(undefined);
    
    if (!selectedFile) {
      setError("Veuillez d'abord importer un fichier CSV ou JSON avant de lancer l'analyse.");
      toast({
        title: "Fichier manquant",
        description: "Veuillez d'abord importer un fichier CSV ou JSON avant de lancer l'analyse.",
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
      
      // Lancer l'analyse des avis
      console.log('Lancement de l\'analyse pour place_id:', activeEstablishment);
      await runAnalyze({ 
        place_id: activeEstablishment,
        name: establishmentName,
      });
      
      const successMsg = `Avis importés et associés à l’établissement ${establishmentName}.`;
      setSuccessMessage(successMsg);
      
      toast({
        title: "Import et analyse terminés",
        description: successMsg,
      });
      
      setSelectedFile(null);
      onFileAnalyzed?.();
      
      // Redirection vers le dashboard
      setTimeout(() => {
        navigate('/tableau-de-bord');
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de l\'import/analyse:', error);
      const errorMsg = error instanceof Error ? error.message : "Une erreur est survenue pendant l'analyse. Veuillez réessayer plus tard.";
      setError(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Fichier CSV ou JSON Google Takeout
        </label>
        
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-border",
            "hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <input
            type="file"
            accept=".csv,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="csv-file-input"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <File className="w-5 h-5" />
                <span className="font-medium">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Taille: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Déposez votre fichier CSV ou JSON ici ou{" "}
                  <label
                    htmlFor="csv-file-input"
                    className="text-primary cursor-pointer hover:underline"
                  >
                    choisissez un fichier
                  </label>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV ou JSON (Google Takeout), maximum 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          CSV : première colonne = texte de l'avis | JSON : format Google Takeout (reviews.json)
        </p>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!selectedFile || isUploading}
        className="w-full h-12 text-base font-semibold"
      >
        {isUploading ? "Analyse en cours..." : "Analyser le fichier importé"}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
      
      {successMessage && (
        <p className="text-sm text-green-600 mt-2">
          {successMessage}
        </p>
      )}
    </div>
  );
}