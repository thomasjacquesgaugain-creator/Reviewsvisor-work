import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavBarProps {
  variant?: "default" | "transparent";
}

export const NavBar = ({ variant = "default" }: NavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, displayName, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isAccueil = location.pathname === "/tableau-de-bord";
  const isDashboard = location.pathname === "/dashboard";
  const isEtablissement = location.pathname === "/etablissement";
  const isCompte = location.pathname === "/compte";

  if (!user) {
    return null;
  }

  return (
    <header className="rv-navbar">
      <div className="rv-navbar-inner">
        {/* Gauche : logo */}
        <div className="rv-navbar-left">
          <div className="rv-logo cursor-default select-none">
            <span className="rv-logo-icon">📊</span>
            <span className="rv-logo-text">Reviewsvisor</span>
          </div>
        </div>

        {/* Centre : liens avec icônes */}
        <nav className="rv-navbar-center">
          <Link to="/tableau-de-bord" className={`rv-nav-link ${isAccueil ? "active" : ""}`}>
            <span className="rv-nav-icon">🏠</span>
            <span>Accueil</span>
          </Link>
          <Link to="/dashboard" className={`rv-nav-link ${isDashboard ? "active" : ""}`}>
            <span className="rv-nav-icon">📈</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/etablissement" className={`rv-nav-link ${isEtablissement ? "active" : ""}`}>
            <span className="rv-nav-icon">🏢</span>
            <span>Établissement</span>
          </Link>
        </nav>

        {/* Droite : texte cliquable + toggle thème + déconnexion */}
        <div className="rv-navbar-right">
          {user ? (
            <>
              <Link 
                to="/compte" 
                className={`rv-user-text hover:text-primary transition-colors cursor-pointer ${isCompte ? "text-primary" : ""}`}
              >
                Bonjour, {displayName}
              </Link>

              {/* Toggle thème */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleTheme}
                className="flex items-center gap-2"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span className="hidden sm:inline">Mode clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span className="hidden sm:inline">Mode sombre</span>
                  </>
                )}
              </Button>

              <button onClick={handleLogout} className="rv-logout-btn">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="rv-nav-link">
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};