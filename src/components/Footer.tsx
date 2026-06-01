import { Link, useNavigate } from "react-router-dom";
import { Mail, Shield, Cookie, FileText, HelpCircle, Scale, Info, Layers, CircleUser, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/config/brand";

export function Footer() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const reviewsvisorLink = user ? "/tableau-de-bord" : "/";
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };
  
  return (
    <footer
      className="relative overflow-hidden bg-blue-600 dark:bg-transparent text-white mt-auto shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "var(--footer-gradient)",
          filter: "contrast(var(--app-bg-contrast-factor, 1))",
        }}
      />
      <div className="relative container mx-auto px-4 py-12">
        <div
          className={`grid grid-cols-1 gap-10 mb-8 items-start md:grid-cols-[1fr_auto_1fr] max-w-6xl mx-auto`}
        >
          {/* Colonne 1 - Reviewsvisor */}
          <div className="justify-self-start">
            <ul className="space-y-3">
            <Link to={reviewsvisorLink}>
              <h3 className="text-white font-bold text-lg mb-4 hover:opacity-80 transition-opacity cursor-pointer normal-case" translate="no">{APP_NAME}</h3>
            </Link>
              <li>
                <Link to="/aide" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {t("nav.help")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                <Info className="h-4 w-4" />
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link to="/fonctionnalites" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                <Layers className="h-4 w-4" />
                  {t("nav.features")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 - Compte */}
          {!user ? (
          <div className="justify-self-center text-left">
            <ul className="space-y-3">
            <h3 className="text-white font-bold text-lg mb-4">{t("nav.account")}</h3>
              <li>
                <Link to="/login" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("auth.login")}
                </Link>
              </li>
              <li>
                <Link to="/inscription" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t("auth.signup")}
                </Link>
              </li>
            </ul>
          </div>
          ) : (
            <div className="justify-self-center text-left">
            <ul className="space-y-3">
            <h3 className="text-white font-bold text-lg mb-4">{t("nav.account")}</h3>
              <li>
                <Link to="/settings/profile" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <CircleUser className="h-4 w-4" />
                  {t("footer.myAccount")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("footer.dashboard")}
                </Link>
              </li>
              <li onClick={handleLogout}>
                <button
                  type="button"
                  className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t("footer.logout")}
                </button>
              </li>
            </ul>
          </div>
          )}

          {/* Colonne 3 - Légal */}
          <div className="justify-self-start md:justify-self-end">
            <ul className="space-y-3">
            <h3 className="text-white font-bold text-lg mb-4">{t("footer.legal")}</h3>
              <li>
                <Link to="/mentions-legales" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  {t("footer.legalNotice")}
                </Link>
              </li>
              <li>
                <Link to="/cgu" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("footer.termsOfUse")}
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link to="/politique-cookies" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  {t("footer.cookies")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/20 pt-8">
          <p className="text-center text-sm text-white">
            © 2026 <span translate="no" className="normal-case">{APP_NAME}</span>. {t("common.allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
