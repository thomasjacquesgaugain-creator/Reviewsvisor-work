import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import logoIcon from "@/assets/reviewsvisor-logo-icon.png";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Logo and brand section */}
      <div className="flex items-center justify-center gap-3 pt-5 pb-2.5">
        <img 
          src={logoIcon} 
          alt="Reviewsvisor Logo" 
          className="h-[42px] inline-block"
        />
        <span className="text-[#2563EB] text-2xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          Reviewsvisor
        </span>
      </div>
      
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;