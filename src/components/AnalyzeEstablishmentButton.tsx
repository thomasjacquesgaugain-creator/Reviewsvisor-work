import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runAnalyze } from '@/lib/runAnalyze';

interface AnalyzeEstablishmentButtonProps {
  place_id: string;
  name?: string;
  address?: string;
}

export function AnalyzeEstablishmentButton({ place_id, name, address }: AnalyzeEstablishmentButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!place_id) {
      toast({
        title: "Erreur",
        description: "Place ID manquant pour l'analyse",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await runAnalyze({
        place_id,
        name,
        address
      });

      if (result.ok) {
        toast({
          title: "Analyse terminée",
          description: `${result.counts?.collected || 0} avis analysés avec succès`,
        });
      } else {
        let errorMessage = "Erreur lors de l'analyse";
        
        if (result.error === 'google_fetch_failed') {
          errorMessage = "Impossible de récupérer les avis Google";
        } else if (result.error === 'upsert_failed') {
          errorMessage = "Erreur lors de l'enregistrement des résultats";
        } else if (result.details) {
          errorMessage = result.details;
        }

        toast({
          title: "Erreur d'analyse",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analyze error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button 
      onClick={handleAnalyze} 
      disabled={isAnalyzing || !place_id}
      className="w-full"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyse en cours...
        </>
      ) : (
        "Analyser cet établissement"
      )}
    </Button>
  );
}