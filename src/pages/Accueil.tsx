import { useState } from "react";
import Header from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;
