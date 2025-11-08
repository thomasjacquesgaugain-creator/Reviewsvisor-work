import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export const AppNavbar = () => {
  const { displayName, loading, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/tableau-de-bord") {
      return location.pathname === "/tableau-de-bord" || location.pathname === "/accueil" || location.pathname === "/";
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" 
              alt="Analytics Logo" 
              className="w-8 h-8" 
            />
            <span className="text-xl font-bold text-gray-900">analytique</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6">
              <Link 
                to="/tableau-de-bord" 
                className={`flex items-center gap-2 ${
                  isActive("/tableau-de-bord") 
                    ? "text-blue-600 font-medium" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
                aria-current={isActive("/tableau-de-bord") ? "page" : undefined}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-2 ${
                  isActive("/dashboard") 
                    ? "text-blue-600 font-medium" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
                aria-current={isActive("/dashboard") ? "page" : undefined}
              >
                Dashboard
              </Link>
              <Link 
                to="/etablissement" 
                className={`flex items-center gap-2 ${
                  isActive("/etablissement") 
                    ? "text-blue-600 font-medium" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
                aria-current={isActive("/etablissement") ? "page" : undefined}
              >
                <Building2 className="w-4 h-4" />
                Établissement
              </Link>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-gray-700 font-medium">
                {loading ? "Bonjour..." : displayName ? `Bonjour, ${displayName}` : <Link to="/login">Se connecter</Link>}
              </div>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-red-600 flex items-center gap-2" 
                onClick={signOut}
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
