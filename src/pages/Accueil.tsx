import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { PricingSection } from "@/components/PricingSection";

const Accueil = () => {
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);
  const location = useLocation();

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  // Handle hash navigation for anchor scrolling
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <PricingSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;