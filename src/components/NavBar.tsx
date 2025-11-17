import { Button } from "@/components/ui/button";
import { Home, BarChart3, Building, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface NavBarProps {
  variant?: "default" | "transparent";
}

export const NavBar = ({ variant = "default" }: NavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navClassName = variant === "transparent" 
    ? "bg-white/80 backdrop-blur-sm border-b border-gray-200"
    : "bg-white border-b border-gray-200";

  const isAccueil = location.pathname === "/tableau-de-bord";
  const isDashboard = location.pathname === "/dashboard";
  const isEtablissement = location.pathname === "/etablissement";

  return (
    <nav className={navClassName}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo à gauche */}
          <div className="flex items-center gap-0 w-fit flex-shrink-0">
            <img 
              src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" 
              alt="Logo Reviewsvisor" 
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-[1.05rem] font-bold text-gray-900 whitespace-nowrap" translate="no">Reviewsvisor</span>
          </div>
          
          {/* Navigation au centre - étalée horizontalement */}
          <div className="flex items-center gap-6 flex-1 justify-center">
            <Link to="/tableau-de-bord">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isAccueil ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isDashboard ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/etablissement">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${
                  isEtablissement ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <Building className="w-4 h-4" />
                Établissement
              </Button>
            </Link>
          </div>
          
          {/* Utilisateur et déconnexion à droite */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="whitespace-nowrap">Bonjour, {displayName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-gray-700 flex items-center gap-2 whitespace-nowrap"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 whitespace-nowrap">
                  Se connecter
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
