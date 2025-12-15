import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export default function NavBar() {
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const linkStyle =
    "px-4 py-2 rounded-md font-medium text-gray-700 transition-all duration-200 hover:bg-blue-600 hover:text-white";

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
        </div>

        <NavLink to="/tableau-de-bord" className={linkStyle}>
          🏠 Accueil
        </NavLink>

        <NavLink to="/dashboard" className={linkStyle}>
          📈 Dashboard
        </NavLink>

        <NavLink to="/etablissement" className={linkStyle}>
          🏢 Établissement
        </NavLink>
      </div>

      {/* Bonjour + Déconnexion */}
      <div className="flex items-center space-x-4">
        <Link to="/compte" className={linkStyle}>
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
