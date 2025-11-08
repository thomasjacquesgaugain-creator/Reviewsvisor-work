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
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo et marque */}
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" 
              alt="Analytics Logo" 
              className="w-8 h-8" 
            />
            <span className="text-xl font-bold text-foreground">analytique</span>
          </div>
          
          {/* Séparateur visuel sur desktop */}
          <div className="hidden sm:block w-px h-6 bg-border" />
          
          {/* Navigation principale */}
          <nav 
            role="navigation" 
            aria-label="Navigation principale"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6"
          >
            <Link 
              to="/tableau-de-bord" 
              className={`flex items-center gap-2 transition-colors ${
                isActive("/tableau-de-bord") 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              aria-current={isActive("/tableau-de-bord") ? "page" : undefined}
            >
              <Home className="w-4 h-4" />
              Accueil
            </Link>
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-2 transition-colors ${
                isActive("/dashboard") 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              aria-current={isActive("/dashboard") ? "page" : undefined}
            >
              Dashboard
            </Link>
            <Link 
              to="/etablissement" 
              className={`flex items-center gap-2 transition-colors ${
                isActive("/etablissement") 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-primary"
              }`}
              aria-current={isActive("/etablissement") ? "page" : undefined}
            >
              <Building2 className="w-4 h-4" />
              Établissement
            </Link>
          </nav>
          
          {/* Menu utilisateur */}
          <div className="flex items-center gap-4 sm:ml-auto">
            <div className="text-foreground font-medium">
              {loading ? "Bonjour..." : displayName ? `Bonjour, ${displayName}` : <Link to="/login" className="text-primary hover:underline">Se connecter</Link>}
            </div>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-destructive flex items-center gap-2" 
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
