import { useState } from "react";
import { X, Edit3, Upload, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ManualReviewPanel from "./ManualReviewPanel";
import ImportCsvPanel from "./ImportCsvPanel";

interface ImportAvisToolbarProps {
  onClose: () => void;
  onFileAnalyzed?: () => void;
}

type ActiveTab = "manual" | "csv" | "auto";

interface ManualReview {
  firstName: string;
  lastName: string;
  rating: number;
  comment: string;
}

export default function ImportAvisToolbar({ onClose, onFileAnalyzed }: ImportAvisToolbarProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("csv");

  const handleManualReviewSubmit = (review: ManualReview) => {
    console.log("Avis manuel:", review);
    // TODO: Envoyer l'avis au backend
  };

  const tabs = [
    {
      id: "manual" as const,
      label: "Saisie manuelle",
      icon: Edit3,
      testId: "tab-manuel"
    },
    {
      id: "csv" as const,
      label: "Import CSV",
      icon: Upload,
      testId: "tab-csv"
    },
    {
      id: "auto" as const,
      label: "Récupération auto",
      icon: Zap,
      testId: "tab-auto"
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "manual":
        return <ManualReviewPanel onSubmit={handleManualReviewSubmit} />;
      case "csv":
        return <ImportCsvPanel onFileAnalyzed={onFileAnalyzed} />;
      case "auto":
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Récupération automatique</p>
            <p className="text-sm">
              Connexion à Google/Tripadvisor/Google Maps à venir…
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="w-full max-w-4xl mx-auto"
      data-testid="import-avis-toolbar"
    >
      <CardContent className="p-6">
        {/* Header avec titre et bouton fermer */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold mb-2">Analysez vos avis clients</h3>
            <p className="text-sm text-muted-foreground">
              Importez vos avis manuellement ou via un fichier CSV pour obtenir une analyse détaillée.
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
                    ? "bg-background text-foreground shadow-sm"
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