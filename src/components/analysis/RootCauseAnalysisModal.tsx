import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RootCauseAnalysis, ProbabilityLevel } from "@/utils/rootCauseAnalysis";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, HelpCircle } from "lucide-react";

interface RootCauseAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: RootCauseAnalysis;
}

const probabilityConfig: Record<ProbabilityLevel, { label: string; color: string; icon: typeof AlertCircle }> = {
  "Probable": {
    label: "Probable",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertCircle
  },
  "Possible": {
    label: "Possible",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    icon: Clock
  },
  "Occasionnelle": {
    label: "Occasionnelle",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: HelpCircle
  }
};

export function RootCauseAnalysisModal({
  open,
  onOpenChange,
  analysis
}: RootCauseAnalysisModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Analyse des causes racines : {analysis.problem}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Synthèse */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Synthèse</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
              </div>
            </div>
          </div>

          {/* Catégories de causes */}
          {analysis.categories.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Causes identifiées par catégorie</h3>
              
              {analysis.categories.map((category, catIndex) => (
                <div key={catIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    {category.name}
                  </h4>
                  
                  <div className="space-y-3">
                    {category.causes.map((cause, causeIndex) => {
                      const probConfig = probabilityConfig[cause.probability];
                      const Icon = probConfig.icon;
                      
                      return (
                        <div key={causeIndex} className="pl-4 border-l-2 border-gray-200">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <p className="text-gray-700 flex-1">{cause.description}</p>
                            <Badge 
                              variant="outline" 
                              className={`${probConfig.color} border flex items-center gap-1`}
                            >
                              <Icon className="w-3 h-3" />
                              {probConfig.label}
                            </Badge>
                          </div>
                          
                          {/* Preuves (verbatims) si disponibles */}
                          {cause.evidence && cause.evidence.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {cause.evidence.map((evidence, evIndex) => (
                                <p 
                                  key={evIndex} 
                                  className="text-xs text-gray-500 italic pl-2 border-l border-gray-100"
                                >
                                  "{evidence.length > 100 ? evidence.substring(0, 100) + '...' : evidence}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
              <p>Aucune cause spécifique n'a pu être identifiée à partir des données disponibles.</p>
              <p className="text-sm mt-2">Une analyse sur le terrain serait recommandée.</p>
            </div>
          )}

          {/* Note méthodologique */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note méthodologique :</strong> Cette analyse est basée uniquement sur les thèmes, mots-clés et verbatims extraits des avis clients. 
              Les niveaux de probabilité sont indicatifs et doivent être validés par une observation terrain.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
