import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface NavBarProps {
  variant?: "default" | "transparent";
}

const navLinkBase =
  "flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors";
const navLinkHover =
  "hover:border hover:border-blue-500 hover:bg-blue-50 text-gray-700";
const navLinkActive =
  "border border-blue-600 bg-blue-100 text-blue-700";

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
              className={`${navLinkBase} ${
                location.pathname === item.href ? navLinkActive : navLinkHover
              }`}
            >
              {item.name}
            </Link>
          ))}
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

              <button 
                onClick={handleLogout} 
                className="ml-4 px-4 py-2 rounded-md border border-red-500 text-red-600 font-medium hover:bg-red-50 transition"
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