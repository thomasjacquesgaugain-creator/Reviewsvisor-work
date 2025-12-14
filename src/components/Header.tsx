import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full flex justify-center py-4 px-4">
      <div className="flex items-center justify-between gap-4 md:gap-6 bg-white rounded-2xl shadow-md px-6 pr-4 py-3 w-full max-w-4xl">
        {/* Taglines */}
        <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground font-medium flex-wrap">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-green-500 text-base">✓</span>
            <span className="hidden sm:inline">Transformer retour en conception</span>
            <span className="sm:hidden">Retour → conception</span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-green-500 text-base">✓</span>
            <span className="hidden sm:inline">Vos avis, votre croissance</span>
            <span className="sm:hidden">Avis = croissance</span>
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-green-500 text-base">✓</span>
            <span className="hidden sm:inline">Un outil, une centralisation</span>
            <span className="sm:hidden">Centralisation</span>
          </span>
        </div>

        {/* Menu button */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            <Menu className="text-foreground" size={22} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-12 bg-white shadow-lg rounded-xl border border-border p-4 w-44 z-50">
              <ul className="space-y-3 text-foreground text-sm">
                <li>
                  <Link 
                    to="/login" 
                    className="block hover:text-primary transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Se connecter
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/abonnement" 
                    className="block hover:text-primary transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/a-propos" 
                    className="block hover:text-primary transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    À propos
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
