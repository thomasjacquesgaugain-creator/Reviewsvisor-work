import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

interface NavBarProps {
  variant?: "default" | "transparent";
}

const navLinkBase =
  "flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200";
const navLinkHover =
  "hover:bg-blue-600 hover:text-white text-gray-700 border border-transparent hover:border-blue-600";
const navLinkActive =
  "bg-blue-600 text-white border border-blue-600";

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
    { name: "Accueil", href: "/" },
    { name: "Dashboard", href: "/tableau-de-bord" },
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

        <nav className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 ${
                location.pathname === item.href
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "hover:bg-blue-600 hover:text-white text-gray-700 border border-transparent hover:border-blue-600"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Bonjour, displayName */}
          <Link
            to="/compte"
            className={`px-3 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer ${
              isCompte
                ? "bg-blue-600 text-white border border-blue-600"
                : "hover:bg-blue-600 hover:text-white text-gray-700 border border-transparent hover:border-blue-600"
            }`}
          >
            Bonjour, {displayName}
          </Link>

          <button 
            onClick={handleLogout} 
            className="ml-4 px-4 py-2 rounded-md border border-red-500 text-red-600 font-medium hover:bg-red-50 transition"
          >
            Déconnexion
          </button>
        </nav>

      </div>
    </header>
  );
};