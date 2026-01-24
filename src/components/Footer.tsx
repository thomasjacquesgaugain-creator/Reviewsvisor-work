import { Link } from "react-router-dom";
import { Mail, Shield, Cookie, FileText, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/config/brand";

export function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const reviewsvisorLink = user ? "/tableau-de-bord" : "/";
  
  return (
    <footer className="bg-blue-600 text-white mt-auto shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Colonne 1 - Reviewsvisor */}
          <div>
            <Link to={reviewsvisorLink}>
              <h3 className="text-white font-bold text-lg mb-4 hover:opacity-80 transition-opacity cursor-pointer normal-case" translate="no">{APP_NAME}</h3>
            </Link>
            <ul className="space-y-3">
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
                <Link to="/a-propos" className="text-white hover:underline hover:opacity-80 transition-all">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link to="/fonctionnalites" className="text-white hover:underline hover:opacity-80 transition-all">
                  {t("nav.features")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 - Compte */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{t("nav.account")}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-white hover:underline hover:opacity-80 transition-all">
                  {t("auth.login")}
                </Link>
              </li>
              <li>
                <Link to="/onboarding/signup" className="text-white hover:underline hover:opacity-80 transition-all">
                  {t("auth.signup")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Légal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">{t("footer.legal")}</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/mentions-legales" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("footer.legalNotice")}
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="text-white hover:underline hover:opacity-80 transition-all">
                  {t("footer.termsOfUse")}
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
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
            © 2025 <span translate="no" className="normal-case">{APP_NAME}</span>. {t("common.allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}

