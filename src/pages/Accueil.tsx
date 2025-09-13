import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { RestaurantInput } from "@/components/RestaurantInput";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string; place_id: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string; place_id: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;