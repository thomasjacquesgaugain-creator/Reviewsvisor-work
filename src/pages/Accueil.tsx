import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { PricingSection } from "@/components/PricingSection";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
      <PricingSection />
    </div>
  );
};

export default Accueil;