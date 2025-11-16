import { Link } from "react-router-dom";
import { Mail, Shield, Cookie, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Colonne 1 - Reviewsvisor */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Reviewsvisor</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/a-propos" className="hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/fonctionnalites" className="hover:text-white transition-colors">
                  Fonctionnalités
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 - Légal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Légal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/mentions-legales" className="hover:text-white transition-colors flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="hover:text-white transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="hover:text-white transition-colors flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Compte */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Compte</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link to="/onboarding/signup" className="hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-white transition-colors">
                  Abonnement Pro
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-sm text-gray-400">
            © 2025 Reviewsvisor. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
