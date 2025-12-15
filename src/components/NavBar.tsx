import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export const NavBar = () => {
  const { user, displayName, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  const linkStyle =
    "px-4 py-2 rounded-md font-medium transition-all duration-200 bg-blue-600 text-white border border-blue-600";
  const logoutStyle =
    "px-4 py-2 rounded-md font-medium transition-all duration-200 bg-red-600 text-white border border-red-600";

  return (
    <nav className="w-full flex justify-between items-center px-8 py-3 bg-white shadow-sm">
      <div className="flex items-center space-x-8">
        <div className="text-2xl font-bold text-blue-600">Reviewsvisor</div>

        <NavLink to="/tableau-de-bord" end className={linkStyle}>
          Accueil
        </NavLink>

        <NavLink to="/dashboard" className={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="/etablissement" className={linkStyle}>
          Établissement
        </NavLink>
      </div>

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
};
