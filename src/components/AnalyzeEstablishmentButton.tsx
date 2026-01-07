import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runAnalyze } from '@/lib/runAnalyze';
import { useTranslation } from 'react-i18next';

interface AnalyzeEstablishmentButtonProps {
  place_id: string;
  name?: string;
  address?: string;
}

export function AnalyzeEstablishmentButton({ place_id, name, address }: AnalyzeEstablishmentButtonProps) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!place_id) {
      toast({
        title: t("common.error"),
        description: t("errors.missingPlaceIdForAnalysis"),
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
          title: t("establishment.analysisComplete"),
          description: t("establishment.reviewsAnalyzedSuccess", { count: result.counts?.collected || 0 }),
        });
      } else {
        let errorMessage = t("establishment.analysisError");
        
        if (result.error === 'google_fetch_failed') {
          errorMessage = t("establishment.cannotFetchGoogleReviews");
        } else if (result.error === 'upsert_failed') {
          errorMessage = t("establishment.errorSavingResults");
        } else if (result.details) {
          errorMessage = result.details;
        }

        toast({
          title: t("establishment.analysisError"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analyze error:', error);
      toast({
        title: t("common.error"),
        description: t("errors.generic"),
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
          {t("establishment.analysisInProgress")}
        </>
      ) : (
        t("establishment.analyzeThisEstablishment")
      )}
    </Button>
  );
}