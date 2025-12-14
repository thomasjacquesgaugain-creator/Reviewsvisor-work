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
    <header className="sticky top-0 z-50 w-full flex items-center justify-center bg-white py-3 shadow-sm border-b border-border">
      <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground font-medium flex-wrap justify-center px-4">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Transformer retour en conception
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Vos avis, votre croissance
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Un outil, une centralisation
        </span>

        <div className="relative" ref={menuRef}>
          <Menu
            className="cursor-pointer text-foreground hover:text-primary transition-colors"
            size={22}
            onClick={() => setIsOpen(!isOpen)}
          />

          {isOpen && (
            <div className="absolute right-0 top-10 bg-white shadow-lg rounded-xl border border-border p-4 w-44 z-50">
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
