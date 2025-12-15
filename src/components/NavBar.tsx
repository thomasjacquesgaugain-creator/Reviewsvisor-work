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
    <nav className="w-full flex justify-between items-center px-8 py-3 bg-white shadow-sm">
      <div className="flex items-center space-x-8">
        <div className="text-2xl font-bold text-blue-600">Reviewsvisor</div>

        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              location.pathname === item.href
                ? "bg-blue-600 text-white border border-blue-600"
                : "hover:bg-blue-600 hover:text-white text-gray-700 border border-transparent hover:border-blue-600"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to="/compte"
          className={`px-4 py-2 rounded-md font-medium transition-all duration-200 cursor-pointer ${
            isCompte
              ? "bg-blue-600 text-white border border-blue-600"
              : "hover:bg-blue-600 hover:text-white text-gray-700 border border-transparent hover:border-blue-600"
          }`}
        >
          Bonjour, {displayName}
        </Link>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 rounded-md border border-red-500 text-red-600 font-medium hover:bg-red-50 transition"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
};