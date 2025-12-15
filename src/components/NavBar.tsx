import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export default function NavBar() {
  const location = useLocation();
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const getLinkClass = (path: string) =>
    `px-4 py-2 rounded-md font-medium transition-all duration-200 ${
      location.pathname === path
        ? "text-blue-600"
        : "text-gray-700 hover:bg-blue-600 hover:text-white"
    }`;

  const logoutStyle =
    "px-4 py-2 rounded-md font-medium bg-red-600 text-white border border-red-600 transition-all duration-200";

  if (!user) {
    return null;
  }

  return (
    <nav className="w-full flex justify-between items-center px-8 py-3 bg-white shadow-sm">
      {/* Logo + liens */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📊</span>
          <div className="text-2xl font-bold text-blue-600">Reviewsvisor</div>
          {/* Barre verticale */}
          <div
            className="relative mx-4 h-12 w-px bg-blue-300 before:absolute before:top-0 before:left-0 before:w-full before:h-2 before:bg-gradient-to-b before:from-white before:to-transparent after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:bg-gradient-to-t after:from-white after:to-transparent"
          ></div>
        </div>

        <NavLink to="/tableau-de-bord" className={getLinkClass("/tableau-de-bord")}>
          🏠 Tableau de bord
        </NavLink>

        <NavLink to="/dashboard" className={getLinkClass("/dashboard")}>
          📈 Dashboard
        </NavLink>

        <NavLink to="/etablissement" className={getLinkClass("/etablissement")}>
          🏢 Établissement
        </NavLink>
      </div>

      {/* Bonjour + Déconnexion */}
      <div className="flex items-center space-x-4">
        <Link to="/compte" className={getLinkClass("/compte")}>
          Bonjour, {displayName}
        </Link>

        <button onClick={handleLogout} className={logoutStyle}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export { NavBar };
