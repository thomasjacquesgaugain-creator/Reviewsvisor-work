import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, FileText, RefreshCw, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImportAvisModalProps {
  children: React.ReactNode;
}

export default function ImportAvisModal({ children }: ImportAvisModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'manual'>('menu');
  const [manualReviews, setManualReviews] = useState('');

  const handleSaveReviews = () => {
    // Logique pour sauvegarder les avis
    console.log('Avis sauvegardés:', manualReviews);
    setIsOpen(false);
    setCurrentView('menu');
    setManualReviews('');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setCurrentView('menu');
        setManualReviews('');
      }
    }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 max-w-sm mx-auto bg-white shadow-lg border rounded-lg p-6" align="center" side="bottom" sideOffset={10}>
        {currentView === 'menu' ? (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">{t("import.analyzeReviews")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("import.analyzeReviewsDesc")}
            </p>
            
            <div className="space-y-3">
              {/* Saisie manuelle */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
                onClick={() => setCurrentView('manual')}
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{t("import.manualEntry")}</span>
              </Button>
              
              {/* Import CSV */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
              >
                <Upload className="w-5 h-5 text-green-500" />
                <span>{t("import.importCsv")}</span>
              </Button>
              
              {/* Récupération auto */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
              >
                <RefreshCw className="w-5 h-5 text-purple-500" />
                <span>{t("import.autoRecovery")}</span>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              {t("import.exampleReview")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToMenu}
                className="p-1 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{t("import.backToMenu")}</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {t("import.enterReviewsOnePerLine")}
            </p>
            
            <Textarea
              placeholder={t("import.enterReviewsPlaceholder")}
              value={manualReviews}
              onChange={(e) => setManualReviews(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveReviews}
                disabled={!manualReviews.trim()}
                className="flex-1"
              >
                {t("import.analyzeReviews")}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}