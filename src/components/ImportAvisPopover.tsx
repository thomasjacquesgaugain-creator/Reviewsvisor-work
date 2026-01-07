import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ManualReviewPanel from "./ManualReviewPanel";
import InstructionsHeader from "./InstructionsHeader";
import { useTranslation } from "react-i18next";

interface ImportAvisPopoverProps {
  children: React.ReactNode;
  /** Place ID de l'établissement pour l'analyse */
  locationId?: string;
}

/**
 * Popover d'import d'avis CSV ancré sous l'icône "Importer des avis"
 * 
 * Configuration personnalisable :
 * - Largeur : modifier `w-[740px]` dans PopoverContent
 * - Position : changer `side` et `align` props du PopoverContent
 * - Offset : ajuster `sideOffset` prop
 */
export default function ImportAvisPopover({ children, locationId }: ImportAvisPopoverProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("csv");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: t("import.invalidFileFormat"),
        description: t("import.selectCsvOrJson"),
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      setSelectedFile(csvFile);
    } else {
      toast({
        title: t("import.invalidFileFormat"),
        description: t("import.selectCsvOrJson"),
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (locationId) {
        formData.append('locationId', locationId);
      }

      const response = await fetch('/api/reviews/import-csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: t("import.importSuccess"),
          description: t("import.reviewsImported", { count: result.imported || 0 }),
        });
        
        // Fermer le popover et reset
        setIsOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Rafraîchir les données (vous pouvez adapter selon votre logique de state management)
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.message || t("import.importError"));
      }
    } catch (error) {
      toast({
        title: t("import.importError"),
        description: error instanceof Error ? error.message : t("errors.generic"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualReviewSubmit = async (review: {
    firstName: string;
    lastName: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const reviewData = {
        ...review,
        locationId: locationId || undefined,
      };

      const response = await fetch('/api/reviews/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        toast({
          title: t("import.reviewAdded"),
          description: t("import.reviewAddedSuccess", { firstName: review.firstName, lastName: review.lastName }),
        });
        
        // Rafraîchir les données
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.message || t("import.errorAddingReview"));
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("errors.generic"),
        variant: "destructive",
      });
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setActiveTab("csv");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetAndClose();
      }
    }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[740px] max-w-[95vw] rounded-2xl shadow-xl border bg-white p-6 sm:p-8" 
        align="start" 
        side="bottom" 
        sideOffset={8}
      >
        <div className="space-y-6">
          {/* Header avec bouton fermer */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("import.analyzeReviews")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("import.analyzeReviewsDesc")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAndClose}
              className="text-gray-400 hover:text-gray-600 p-1 h-auto"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger 
                value="manual" 
                className="rounded-full px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                {t("import.manualEntry")}
              </TabsTrigger>
              <TabsTrigger 
                value="csv"
                className="rounded-full px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                {t("import.importCsv")}
              </TabsTrigger>
              <TabsTrigger 
                value="auto"
                className="rounded-full px-3 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium"
              >
                {t("import.autoRecovery")}
              </TabsTrigger>
            </TabsList>

            {/* Contenu Saisie manuelle */}
            <TabsContent value="manual" className="mt-6">
              <ManualReviewPanel onSubmit={handleManualReviewSubmit} />
            </TabsContent>

            {/* Contenu Import CSV */}
            <TabsContent value="csv" className="mt-6 space-y-4">
              <InstructionsHeader />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("import.csvFileColumns")}
                </label>
                
                {/* Zone de drop */}
                <div
                  className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      {t("import.dragAndDropFile")} {t("common.or")}{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:text-primary/80 underline"
                      >
                        {t("import.clickToSelectFile")}
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("import.expectedFormat")}
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label={t("import.selectFile")}
                  />
                </div>

                {/* Fichier sélectionné */}
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-green-600">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-green-600 hover:text-green-800 p-1 h-auto"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Analyser */}
              <Button
                onClick={handleAnalyzeFile}
                disabled={!selectedFile || isUploading}
                className="mt-4 h-12 text-base font-semibold w-full"
              >
                {isUploading ? t("import.importing") : t("import.analyzeImportedFile")}
              </Button>
            </TabsContent>

            {/* Contenu Récupération auto */}
            <TabsContent value="auto" className="mt-6 space-y-4">
              <InstructionsHeader />
              
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
                <p>{t("import.autoRecoveryComingSoon")}</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}