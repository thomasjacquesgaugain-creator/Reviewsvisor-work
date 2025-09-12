import { useState } from "react";
import { refreshAndAnalyze } from "@/services/reviews";
import { useToast } from "@/hooks/use-toast";

export default function AnalyzeReviewsButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      const result = await refreshAndAnalyze();
      
      toast({
        title: "Analyse terminée",
        description: `${result.synced} avis synchronisés, ${result.analyzed} avis analysés`,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser les avis. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAnalyze}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 disabled:opacity-50 transition-colors"
    >
      {loading ? "Analyse en cours…" : "Analyser mes avis"}
    </button>
  );
}