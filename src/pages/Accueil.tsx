import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

const Accueil = () => {
  const { displayName, loading, signOut } = useAuth();
  const [analysisData, setAnalysisData] = useState<{ name: string; url: string } | null>(null);

  const handleAnalyze = (restaurantData: { name: string; url: string }) => {
    setAnalysisData(restaurantData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" alt="Analytics Logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Accueil
                </Button>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  Dashboard
                </Link>
                <Link to="/etablissement" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Établissement
                </Link>
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <div className="text-gray-700 font-medium">
                  {loading ? "Bonjour..." : displayName ? `Bonjour, ${displayName}` : <Link to="/login">Se connecter</Link>}
                </div>
                <Button variant="ghost" className="text-gray-600 hover:text-red-600 flex items-center gap-2" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <HeroSection />
      {analysisData && (
        <AnalyticsDashboard restaurantData={analysisData} />
      )}
    </div>
  );
};

export default Accueil;