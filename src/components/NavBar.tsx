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

  const isAccueil = location.pathname === "/tableau-de-bord";
  const isDashboard = location.pathname === "/dashboard";
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
          <Link to="/accueil" className={`rv-nav-link ${location.pathname === "/accueil" ? "active" : ""}`}>
            <span className="rv-nav-icon">🏠</span>
            <span>Accueil</span>
          </Link>
          <Link to="/fonctionnalites" className={`rv-nav-link ${location.pathname === "/fonctionnalites" ? "active" : ""}`}>
            <span className="rv-nav-icon">⭐</span>
            <span>Fonctionnalités</span>
          </Link>
          <Link to="/a-propos" className={`rv-nav-link ${location.pathname === "/a-propos" ? "active" : ""}`}>
            <span className="rv-nav-icon">ℹ️</span>
            <span>À propos</span>
          </Link>
        </nav>

        {/* Droite : texte + déconnexion */}
        <div className="rv-navbar-right">
          {user ? (
            <>
              <span className="rv-user-text">Bonjour, {displayName}</span>
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
