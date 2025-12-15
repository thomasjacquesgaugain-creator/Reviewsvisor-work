import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

const links = [
  { name: "Accueil", path: "/" },
  { name: "Dashboard", path: "/tableau-de-bord" },
  { name: "Établissement", path: "/etablissement" },
];

export const NavBar = () => {
  const { user, displayName, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const base =
    "px-4 py-2 rounded-md font-medium transition-all duration-200 border border-transparent";
  const active = "bg-blue-600 text-white border-blue-600";
  const hover = "text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600";

  return (
    <nav className="w-full flex justify-between items-center px-8 py-3 bg-white shadow-sm">
      <div className="flex items-center space-x-8">
        <div className="text-2xl font-bold text-blue-600">Reviewsvisor</div>

        {links.map((l) => (
          <NavLink
            key={l.path}
            to={l.path}
            end={l.path === "/"}
            className={({ isActive }) =>
              `${base} ${isActive ? active : hover}`
            }
          >
            {l.name}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to="/compte"
          className={`${base} ${hover} cursor-pointer`}
        >
          Bonjour, {displayName}
        </Link>

        <button 
          onClick={signOut}
          className="px-4 py-2 rounded-md bg-red-600 text-white font-medium transition-all duration-200 hover:bg-red-700 active:bg-red-800"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
};
