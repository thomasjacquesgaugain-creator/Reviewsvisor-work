import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface NavBarProps {
  variant?: "default" | "transparent";
}

const linkStyle =
  "px-4 py-2 rounded-md font-medium border border-blue-600 text-blue-600 bg-white transition-all duration-200 hover:bg-blue-600 hover:text-white";

const logoutStyle =
  "px-4 py-2 rounded-md font-medium bg-red-600 text-white border border-red-600";

export const NavBar = ({ variant = "default" }: NavBarProps) => {
  const location = useLocation();
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const isCompte = location.pathname === "/compte";

  if (!user) {
    return null;
  }

  const navItems = [
    { name: "Accueil", href: "/tableau-de-bord" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Établissement", href: "/etablissement" },
  ];

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

        {/* Centre : liens */}
        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={linkStyle}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Droite : texte cliquable + déconnexion */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link 
                to="/compte" 
                className={linkStyle}
              >
                Bonjour, {displayName}
              </Link>

              <button 
                onClick={handleLogout} 
                className={logoutStyle}
              >
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