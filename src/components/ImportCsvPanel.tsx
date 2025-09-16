import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImportCsvPanelProps {
  onFileAnalyzed?: () => void;
}

export default function ImportCsvPanel({ onFileAnalyzed }: ImportCsvPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Format de fichier invalide",
        description: "Veuillez sélectionner un fichier CSV.",
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

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
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
    } catch (error) {
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse du fichier.",
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
          Fichier CSV (colonnes : avis, source, date)
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
            accept=".csv"
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
                  Déposez votre fichier CSV ici ou{" "}
                  <label
                    htmlFor="csv-file-input"
                    className="text-primary cursor-pointer hover:underline"
                  >
                    choisissez un fichier
                  </label>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format CSV uniquement, maximum 10MB
                </p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Format attendu : première colonne = texte de l'avis
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