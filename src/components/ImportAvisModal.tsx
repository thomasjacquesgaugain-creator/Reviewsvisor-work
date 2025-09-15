import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText, RefreshCw } from "lucide-react";

interface ImportAvisModalProps {
  children: React.ReactNode;
}

export default function ImportAvisModal({ children }: ImportAvisModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analysez vos avis clients</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Choisissez une méthode pour importer et analyser vos avis clients (un par ligne)
          </p>
          
          <div className="space-y-3">
            {/* Saisie manuelle */}
            <Button 
              variant="outline" 
              className="w-full h-12 flex items-center justify-start gap-3 text-left"
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
      </DialogContent>
    </Dialog>
  );
}