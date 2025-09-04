import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { RestaurantInput } from "@/components/RestaurantInput";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

const Index = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      {!analysisData ? (
        <RestaurantInput onAnalyze={handleAnalyze} />
      ) : (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Index;
