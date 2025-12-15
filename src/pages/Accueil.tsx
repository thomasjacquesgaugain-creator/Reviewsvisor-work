import { useState, useRef, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Link } from "react-router-dom";

interface AccueilProps {
  theme?: string;
}

const Accueil = ({ theme = "light" }: AccueilProps) => {
  const isDark = theme === "dark";
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setInfoMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main
      className={`min-h-screen flex flex-col items-center px-4 py-10 ${
        isDark ? "bg-black text-gray-100" : "bg-gradient-to-b from-white to-blue-50 text-gray-900"
      }`}
    >
      {/* BARRE AVEC CHECK + MENU */}
      <div
        className={`w-full max-w-5xl rounded-full flex items-center justify-between px-6 py-3 shadow ${
          isDark ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="flex flex-wrap gap-6 text-sm">
          <span>✅ Transformer retour en conception</span>
          <span>✅ Vos avis, votre croissance</span>
          <span>✅ Un outil, une centralisation</span>
        </div>

        {/* MENU 3 BARRES */}
        <div className="relative ml-4" ref={menuRef}>
          <button
            onClick={() => setInfoMenuOpen((o) => !o)}
            className={`p-2 rounded-full border transition ${
              isDark 
                ? "border-purple-500 hover:bg-gray-800" 
                : "border-blue-200 hover:bg-blue-50"
            }`}
          >
            {infoMenuOpen ? (
              <X className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-blue-600"}`} />
            ) : (
              <Menu className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-blue-600"}`} />
            )}
          </button>

          {infoMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                isDark
                  ? "bg-gray-900 border-gray-700 text-gray-100"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            >
              <Link
                to="/login"
                className={`block w-full text-left px-4 py-2 ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-blue-50"
                }`}
                onClick={() => setInfoMenuOpen(false)}
              >
                🔐 Se connecter
              </Link>
              <div className={`border-t my-1 ${isDark ? "border-gray-700" : "border-gray-200"}`} />
              <div className="px-4 py-2 flex items-center space-x-2">
                <Globe className={`w-4 h-4 ${isDark ? "text-purple-400" : "text-blue-500"}`} />
                <select
                  className={`text-sm bg-transparent outline-none w-full cursor-pointer ${
                    isDark ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  <option>🇫🇷 Français</option>
                  <option>🇬🇧 English</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HÉROS */}
      <section className="w-full max-w-4xl mt-10 text-center">
        <h1 className={`text-4xl font-bold mb-4 ${isDark ? "text-purple-400" : "text-blue-600"}`}>
          Reviewsvisor
        </h1>
        <p className={`text-lg mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Analysez automatiquement vos avis clients pour identifier les
          problèmes prioritaires et améliorer la satisfaction de votre
          établissement.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/abonnement"
            className={`px-6 py-3 rounded-full font-medium transition ${
              isDark
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Commencer maintenant
          </Link>
          <Link
            to="/login"
            className={`px-6 py-3 rounded-full border font-medium transition ${
              isDark
                ? "border-gray-600 bg-gray-900 text-gray-100 hover:bg-gray-800"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
            }`}
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Accueil;
