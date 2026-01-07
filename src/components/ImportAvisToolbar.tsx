import { useState } from "react";
import { X, Upload, Zap, Clipboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ImportCsvPanel from "./ImportCsvPanel";
import PasteImportPanel from "./PasteImportPanel";
import GoogleImportButton from "./GoogleImportButton";
import CollapsibleInstructionsHeader from "./CollapsibleInstructionsHeader";
import { useTranslation } from "react-i18next";

interface ImportAvisToolbarProps {
  onClose: () => void;
  onFileAnalyzed?: () => void;
  onImportSuccess?: () => void;
  onOpenVisualPanel?: () => void;
  placeId?: string;
  establishmentName?: string;
}

type ActiveTab = "csv" | "paste" | "auto";

export default function ImportAvisToolbar({ onClose, onFileAnalyzed, onImportSuccess, onOpenVisualPanel, placeId, establishmentName }: ImportAvisToolbarProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("auto"); // Start with auto tab for Google import

  const handleManualReviewSubmit = (review: { firstName: string; lastName: string; rating: number; comment: string }) => {
    // Pour l'instant, simple log
    console.log("Avis manuel:", review);
  };

  const handleBulkImport = (reviews: any[]) => {
    // Pour l'instant, simple log des avis en masse
    console.log("Import en masse:", reviews);
    reviews.forEach((review, index) => {
      console.log(`Avis ${index + 1}:`, review);
    });
  };

  const tabs = [
    {
      id: "paste" as const,
      label: t("import.pasteReviews"),
      icon: Clipboard,
      testId: "tab-paste"
    },
    {
      id: "csv" as const,
      label: t("import.importCsv"),
      icon: Upload,
      testId: "tab-csv"
    },
    {
      id: "auto" as const,
      label: t("import.autoRecovery"),
      icon: Zap,
      testId: "tab-auto"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "csv":
        return <ImportCsvPanel onFileAnalyzed={onFileAnalyzed} placeId={placeId} onOpenVisualPanel={onOpenVisualPanel} onClose={onClose} onImportSuccess={onImportSuccess} />;
      case "paste":
        return <PasteImportPanel onImportBulk={handleBulkImport} onClose={onClose} onImportSuccess={onImportSuccess} onOpenVisualPanel={onOpenVisualPanel} />;
      case "auto":
        return (
          <div className="space-y-4">
            <CollapsibleInstructionsHeader>
              {/* Contenu vide pour le moment */}
            </CollapsibleInstructionsHeader>
            
            <div className="py-6">
              <p className="text-sm text-gray-600 mb-4">
                {placeId 
                  ? t("import.autoImportForEstablishment", { name: establishmentName || t("establishment.thisEstablishment") })
                  : t("import.selectEstablishmentToImport")}
              </p>
              <GoogleImportButton onSuccess={onImportSuccess} placeId={placeId} onOpenVisualPanel={onOpenVisualPanel} onClose={onClose} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="w-full max-w-4xl mx-auto relative z-40 pointer-events-auto"
      data-testid="import-avis-toolbar"
    >
      <CardContent className="p-6">
        {/* Header avec titre et bouton fermer */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold mb-2">{t("import.analyzeReviews")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("import.analyzeReviewsDesc")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-testid="btn-close-import-bar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Onglets */}
        <div 
          className="flex space-x-1 bg-muted/30 p-1 rounded-lg mb-6"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="import-bar-content"
                tabIndex={isActive ? 0 : -1}
                data-testid={tab.testId}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenu de l'onglet actif */}
        <div 
          id="import-bar-content"
          data-testid="import-bar-content"
          role="tabpanel"
        >
          {renderTabContent()}
        </div>
      </CardContent>
    </Card>
  );
}