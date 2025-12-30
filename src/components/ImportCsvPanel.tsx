import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  onOpenVisualPanel?: () => void;
  onClose?: () => void;
  onImportSuccess?: () => void;
}

export default function ImportCsvPanel({ onFileAnalyzed, placeId, onOpenVisualPanel, onClose, onImportSuccess }: ImportCsvPanelProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentEstablishment = useCurrentEstablishment();
  
  const activeEstablishment = placeId || currentEstablishment?.place_id;

  const handleFileSelect = useCallback((file: File) => {
    const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");
    
    if (!isCSV && !isJSON) {
      toast({
        title: t("csvImport.invalidFormat"),
        description: t("csvImport.invalidFormatDesc"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("csvImport.fileTooLarge"),
        description: t("csvImport.fileTooLargeDesc"),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  }, [toast, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

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
      return ratingMap[upperRating] || 3;
    }
    
    return 3;
  };

  const parseGoogleTakeoutJSON = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!data.reviews || !Array.isArray(data.reviews)) {
            reject(new Error(t("csvImport.jsonFormatError")));
            return;
          }
          
          const reviews = data.reviews.map((review: any) => {
            const rating = convertStarRating(review.starRating);
            const displayAuthor = getDisplayAuthor(review);
            
            return {
              text: review.comment || "",
              rating: rating,
              author_name: displayAuthor,
              published_at: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
              source: "Google"
            };
          });
          
          resolve(reviews);
        } catch (error) {
          reject(new Error(t("csvImport.jsonFormatError")));
        }
      };
      reader.onerror = () => reject(new Error(t("csvImport.fileReadError")));
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
            reject(new Error(t("csvImport.csvEmpty")));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const reviews = lines.slice(1).map((line) => {
            const values = line.split(',').map(v => v.trim());
            const rawReview: any = {};
            
            headers.forEach((header, index) => {
              rawReview[header] = values[index];
            });
            
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
            
            const displayAuthor = getDisplayAuthor(rawReview);
            review.author_name = displayAuthor;

            return {
              ...review,
              source: "CSV"
            };
          });

          resolve(reviews);
        } catch (error) {
          reject(new Error(t("csvImport.csvReadError")));
        }
      };
      reader.onerror = () => reject(new Error(t("csvImport.fileReadError")));
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: t("common.error"),
        description: t("csvImport.selectFileFirst"),
        variant: "destructive",
      });
      return;
    }
    
    if (!activeEstablishment) {
      setError(t("csvImport.noEstablishment"));
      toast({
        title: t("common.error"),
        description: t("csvImport.noEstablishment"),
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
      
      const establishmentName = currentEstablishment?.name || t("categories.establishment");
      const establishmentIdForService = currentEstablishment?.id || activeEstablishment;
      
      if (isJSON) {
        reviews = await parseGoogleTakeoutJSON(selectedFile);
      } else {
        reviews = await parseCSV(selectedFile);
      }
      
      if (!reviews || reviews.length === 0) {
        throw new Error(t("csvImport.noReviewsInFile"));
      }

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
      
      const result = await bulkCreateReviews(reviewsToCreate);
      
      await runAnalyze({ 
        place_id: activeEstablishment,
        name: establishmentName,
      });
      
      const duplicates = result.reasons?.duplicate || 0;
      sonnerToast.success(t("establishment.reviewsAnalyzedSuccess", { count: result.inserted }) + ` (${t("dashboard.duplicates") || 'duplicates'}: ${duplicates})`, {
        duration: 5000,
      });
      
      setSelectedFile(null);
      onFileAnalyzed?.();
      onImportSuccess?.();
      
      if (onOpenVisualPanel) {
        onOpenVisualPanel();
        setTimeout(() => {
          document.getElementById("reviews-visual-anchor")?.scrollIntoView({ 
            behavior: "smooth", 
            block: "start" 
          });
        }, 100);
      }
      
      window.dispatchEvent(new CustomEvent("reviews:imported", { 
        detail: { establishmentId: establishmentIdForService } 
      }));
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("errors.generic");
      setError(errorMsg);
      
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
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside pl-1">
          <li>
            {t("csvImport.instructions.step1")}{" "}
            <a 
              href="https://takeout.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Google Takeout
            </a>.
          </li>
          <li>{t("csvImport.instructions.step2")}</li>
          <li>{t("csvImport.instructions.step3")}</li>
          <li>{t("csvImport.instructions.step4")}</li>
          <li>{t("csvImport.instructions.step5")}</li>
          <li>{t("csvImport.instructions.step6")}</li>
          <li>{t("csvImport.instructions.step7")}</li>
        </ul>
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
              {t("csvImport.dropzone")}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t("csvImport.dropzoneDesc")}
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
              {t("csvImport.selectFile")}
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
              {t("csvImport.importInProgress")}
            </>
          ) : (
            t("csvImport.importButton")
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