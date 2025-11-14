import { Button } from "@/components/ui/button";
import { Home, BarChart3, Building, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface NavBarProps {
  displayName: string;
  variant?: "default" | "transparent";
}

export const NavBar = ({ displayName, variant = "default" }: NavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0 w-fit">
            <img 
              src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" 
              alt="Logo Reviewsvisor" 
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-[1.05rem] font-bold text-gray-900 whitespace-nowrap">Reviewsvisor</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <Link 
                to="/tableau-de-bord" 
                className={`font-medium hover:underline flex items-center gap-2 ${
                  isAccueil ? "text-blue-600" : "text-gray-700"
                }`}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <div className="flex items-center gap-0">
                <Link to="/dashboard">
                  <Button 
                    variant="ghost" 
                    className={`flex items-center gap-2 ${
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
                    className={`flex items-center gap-2 ${
                      isEtablissement ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Établissement
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, {displayName}</span>
              </div>
              <Button 
                variant="ghost" 
                className="text-gray-700 flex items-center gap-2"
                onClick={handleLogout}
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
