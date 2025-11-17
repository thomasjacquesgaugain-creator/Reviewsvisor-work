import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { bulkCreateReviews } from "@/services/reviewsService";

interface ImportCsvPanelProps {
  onFileAnalyzed?: () => void;
  placeId?: string;
}

export default function ImportCsvPanel({ onFileAnalyzed, placeId }: ImportCsvPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

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

  const parseGoogleTakeoutJSON = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!data.reviews || !Array.isArray(data.reviews)) {
            reject(new Error("Le fichier JSON ne correspond pas au format d'export Google Reviews attendu."));
            return;
          }
          
          const reviews = data.reviews.map((review: any) => ({
            text: review.comment || "",
            rating: review.starRating || 0,
            published_at: review.createTime || new Date().toISOString(),
            source: "google",
            author_name: review.reviewer?.displayName || "Anonyme",
          }));
          
          resolve(reviews);
        } catch (error) {
          reject(new Error("Le fichier JSON ne correspond pas au format d'export Google Reviews attendu."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    if (!placeId) {
      toast({
        title: "Erreur",
        description: "Aucun établissement sélectionné.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const isJSON = selectedFile.name.endsWith(".json");
      
      if (isJSON) {
        // Parse JSON Google Takeout
        const reviews = await parseGoogleTakeoutJSON(selectedFile);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Utilisateur non authentifié");
        }
        
        // Get establishment info
        const { data: establishment } = await supabase
          .from("establishments")
          .select("id, name")
          .eq("place_id", placeId)
          .eq("user_id", user.id)
          .single();
        
        if (!establishment) {
          throw new Error("Établissement non trouvé");
        }
        
        const reviewsToCreate = reviews.map(review => {
          const nameParts = review.author_name.split(" ");
          return {
            establishment_id: establishment.id,
            establishment_place_id: placeId,
            establishment_name: establishment.name,
            source: "google",
            author_first_name: nameParts[0] || "",
            author_last_name: nameParts.slice(1).join(" ") || "",
            rating: review.rating,
            comment: review.text,
            review_date: review.published_at,
            import_method: "json_upload",
          };
        });
        
        const result = await bulkCreateReviews(reviewsToCreate);
        
        toast({
          title: "Import terminé",
          description: `${result.inserted} avis importés avec succès${result.skipped > 0 ? `, ${result.skipped} doublons ignorés` : ""}.`,
        });
        setSelectedFile(null);
        onFileAnalyzed?.();
      } else {
        // CSV - comportement existant
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const response = await fetch("/api/reviews/import-csv", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          toast({
            title: "Analyse terminée",
            description: "Votre fichier CSV a été importé et analysé avec succès.",
          });
          setSelectedFile(null);
          onFileAnalyzed?.();
        } else {
          throw new Error("Erreur lors de l'analyse");
        }
      }
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse du fichier.",
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
    </div>
  );
}