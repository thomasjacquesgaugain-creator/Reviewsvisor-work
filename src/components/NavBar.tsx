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

  const isAccueil = location.pathname === "/accueil" || location.pathname === "/";
  const isDashboard = location.pathname === "/tableau-de-bord";
  const isEtablissement = location.pathname === "/etablissement";

  return (
    <header className="rv-navbar">
      <div className="rv-navbar-inner">
        {/* Gauche : logo */}
        <div className="rv-navbar-left">
          <Link to="/accueil" className="rv-logo">
            <span className="rv-logo-icon">📊</span>
            <span className="rv-logo-text">Reviewsvisor</span>
          </Link>
        </div>

        {/* Centre : liens avec icônes */}
        <nav className="rv-navbar-center">
          <Link to="/accueil" className={`rv-nav-link ${isAccueil ? "active" : ""}`}>
            <span className="rv-nav-icon">🏠</span>
            <span>Accueil</span>
          </Link>
          <Link to="/tableau-de-bord" className={`rv-nav-link ${isDashboard ? "active" : ""}`}>
            <span className="rv-nav-icon">📈</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/etablissement" className={`rv-nav-link ${isEtablissement ? "active" : ""}`}>
            <span className="rv-nav-icon">🏢</span>
            <span>Établissement</span>
          </Link>
        </nav>

        {/* Droite : texte + déconnexion */}
        <div className="rv-navbar-right">
          {user ? (
            <>
              <span className="rv-user-text">Bonjour, {displayName}</span>
              <button onClick={handleLogout} className="rv-logout-link">
                <span className="rv-nav-icon">↪</span>
                <span>Déconnexion</span>
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
