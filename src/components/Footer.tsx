import { Link } from "react-router-dom";
import { Mail, Shield, Cookie, FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-blue-600 text-white mt-auto shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Colonne 1 - Reviewsvisor */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4" translate="no">Reviewsvisor</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/a-propos" className="text-white hover:underline hover:opacity-80 transition-all">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/fonctionnalites" className="text-white hover:underline hover:opacity-80 transition-all">
                  Fonctionnalités
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 - Légal */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Légal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/mentions-legales" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/conditions" className="text-white hover:underline hover:opacity-80 transition-all">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-white hover:underline hover:opacity-80 transition-all flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Compte */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Compte</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-white hover:underline hover:opacity-80 transition-all">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link to="/onboarding/signup" className="text-white hover:underline hover:opacity-80 transition-all">
                  Créer un compte
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/20 pt-8">
          <p className="text-center text-sm text-white">
            © 2025 <span translate="no">Reviewsvisor</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

