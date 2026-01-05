import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NavBar() {
  const { t } = useTranslation();
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
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div className="text-2xl font-bold text-blue-600">Reviewsvisor</div>
        </div>

        <NavLink to="/tableau-de-bord" className={`flex items-center gap-2 ${getLinkClass("/tableau-de-bord")}`}>
          🏠 {t("nav.home")}
        </NavLink>

        <NavLink to="/dashboard" className={`flex items-center gap-2 ${getLinkClass("/dashboard")}`}>
          📈 {t("nav.dashboard")}
        </NavLink>

        <NavLink to="/etablissement" className={`flex items-center gap-2 ${getLinkClass("/etablissement")}`}>
          🏢 {t("nav.establishment")}
        </NavLink>
      </div>

      {/* Avatar utilisateur + Déconnexion */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/compte" 
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            location.pathname === "/compte"
              ? "text-blue-600"
              : "text-gray-700 hover:bg-blue-600 hover:text-white"
          } group`}
        >
          <div className="flex items-center justify-center w-6 h-6 transition-colors">
            <UserRound className={`w-5 h-5 transition-colors ${
              location.pathname === "/compte"
                ? "text-blue-600"
                : "text-blue-600 group-hover:text-white"
            }`} />
          </div>
          <span className="hidden sm:inline">{displayName}</span>
        </Link>

        <button onClick={handleLogout} className={logoutStyle}>
          {t("auth.logout")}
        </button>
      </div>
    </nav>
  );
}

export { NavBar };
