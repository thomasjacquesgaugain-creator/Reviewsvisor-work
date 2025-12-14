import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface NavBarProps {
  variant?: "default" | "transparent";
}

export const NavBar = ({ variant = "default" }: NavBarProps) => {
  const location = useLocation();
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
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
        <nav className="rv-navbar-center flex items-center gap-2">
          <Link
            to="/tableau-de-bord"
            className={`flex items-center justify-center w-10 h-10 rounded-full transition text-gray-700 hover:text-blue-600 hover:ring-2 hover:ring-blue-400 ${isAccueil ? "ring-2 ring-blue-400 text-blue-600" : ""}`}
          >
            🏠
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center justify-center w-10 h-10 rounded-full transition text-gray-700 hover:text-blue-600 hover:ring-2 hover:ring-blue-400 ${isDashboard ? "ring-2 ring-blue-400 text-blue-600" : ""}`}
          >
            📊
          </Link>
          <Link
            to="/etablissement"
            className={`flex items-center justify-center w-10 h-10 rounded-full transition text-gray-700 hover:text-blue-600 hover:ring-2 hover:ring-blue-400 ${isEtablissement ? "ring-2 ring-blue-400 text-blue-600" : ""}`}
          >
            🏢
          </Link>
        </nav>

        {/* Droite : texte cliquable + déconnexion */}
        <div className="rv-navbar-right">
          {user ? (
            <>
              <Link 
                to="/compte" 
                className={`rv-user-text hover:text-primary transition-colors cursor-pointer ${isCompte ? "text-primary" : ""}`}
              >
                Bonjour, {displayName}
              </Link>

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
