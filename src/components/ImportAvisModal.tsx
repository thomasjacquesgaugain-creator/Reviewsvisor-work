import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, FileText, RefreshCw, ArrowLeft } from "lucide-react";

interface ImportAvisModalProps {
  children: React.ReactNode;
}

export default function ImportAvisModal({ children }: ImportAvisModalProps) {
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setCurrentView('menu');
        setManualReviews('');
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentView === 'menu' ? 'Analysez vos avis clients' : 'Saisie manuelle des avis'}
          </DialogTitle>
        </DialogHeader>
        
        {currentView === 'menu' ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choisissez une méthode pour importer et analyser vos avis clients (un par ligne)
            </p>
            
            <div className="space-y-3">
              {/* Saisie manuelle */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
                onClick={() => setCurrentView('manual')}
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Saisie manuelle</span>
              </Button>
              
              {/* Import CSV */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
              >
                <Upload className="w-5 h-5 text-green-500" />
                <span>Import CSV</span>
              </Button>
              
              {/* Récupération auto */}
              <Button 
                variant="outline" 
                className="w-full h-12 flex items-center justify-start gap-3 text-left"
              >
                <RefreshCw className="w-5 h-5 text-purple-500" />
                <span>Récupération auto</span>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Exemple : "Excellent restaurant, service impeccable et plats délicieux ! A tarte un peu lasse le mais la qualité était au rendez-vous. Très très sympa !"
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
              <span className="text-sm text-muted-foreground">Retour au menu</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Saisissez vos avis clients (un par ligne)
            </p>
            
            <Textarea
              placeholder="Entrez vos avis ici, un avis par ligne...&#10;&#10;Exemple :&#10;Excellent restaurant, service impeccable !&#10;Très bon accueil, plats délicieux.&#10;Cadre agréable mais service un peu lent."
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
                Analyser les avis
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}