import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ReviewIntro } from "@/components/ReviewIntro";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <ReviewIntro />
      <HeroSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;
