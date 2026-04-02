import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { capitalizeName } from "@/utils/capitalizeName";
import { APP_NAME } from "@/config/brand";
import { AccountMenu } from "@/components/AccountMenu";

export default function NavBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, displayName, signOut, loading } = useAuth();
  const [isCreatorChecked, setIsCreatorChecked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Vérifier si c'est le créateur en vérifiant directement la session Supabase
  useEffect(() => {
    const checkCreator = async () => {
      if (!loading) {
        // Si user existe dans le contexte, utiliser celui-ci
        if (user?.email === "thomas.jacquesgaugain@gmail.com") {
          setIsCreator(true);
          setIsCreatorChecked(true);
          return;
        }
        
        // Sinon, vérifier directement la session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === "thomas.jacquesgaugain@gmail.com") {
          setIsCreator(true);
        }
        setIsCreatorChecked(true);
      }
    };
    
    checkCreator();
  }, [user, loading]);

  const handleLogout = async () => {
    // Redirection immédiate pour éviter le flash "Invité"
    window.location.href = "/";
    // Déconnexion en arrière-plan
    signOut();
  };

  const getLinkClass = (path: string) =>
    `px-4 py-2 rounded-md font-medium transition-all duration-200 ${
      location.pathname === path
        ? "text-blue-600"
        : "text-gray-700 hover:bg-blue-600 hover:text-white"
    }`;

  const logoutStyle =
    "px-4 py-2 rounded-md font-medium !bg-[#dc2626] !text-white !border !border-[#dc2626] hover:!bg-[#b91c1c] active:!bg-[#991b1b] transition-all duration-200";

  // Pour le créateur : toujours afficher la NavBar une fois vérifié
  if (isCreator && isCreatorChecked) {
    // Le créateur voit toujours la NavBar
  } else if (!isCreatorChecked || loading) {
    // Attendre que la vérification soit terminée
    return null;
  } else if (!user) {
    // Pour les autres utilisateurs : ne pas afficher si pas connecté
    return null;
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isCreator) {
      e.preventDefault();
      e.stopPropagation();
      navigate("/");
    }
    // Sinon ne rien faire
  };

  return (
    <nav className="relative z-50 w-full flex items-center justify-between px-8 py-3 bg-white shadow-sm">
      {/* Gauche : Logo + barre */}
      <div className="flex items-center gap-4">
        <div 
          className={`flex items-center gap-2 ${isCreator ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
          onClick={handleLogoClick}
          role={isCreator ? "button" : undefined}
          tabIndex={isCreator ? 0 : undefined}
          onKeyDown={isCreator ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleLogoClick(e as any);
            }
          } : undefined}
        >
          <span className="text-xl">📊</span>
          <div className="text-2xl font-bold text-blue-600 normal-case">{APP_NAME}</div>
        </div>
        {/* Barre de séparation bleue */}
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-70"></div>
      </div>

      {/* Centre : Navigation */}
      <div className="flex items-center gap-8">
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

      {/* Droite : User + Déconnexion */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <AccountMenu />
            <button onClick={handleLogout} className={logoutStyle}>
              {t("auth.logout")}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={getLinkClass("/login")}
            >
              {t("auth.login")}
            </Link>
            <Link
              to="/login?mode=signup"
              className={getLinkClass("/login")}
            >
              {t("auth.signup")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export { NavBar };
