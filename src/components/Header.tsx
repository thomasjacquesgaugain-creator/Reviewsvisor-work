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
    <header className="relative flex items-center justify-center bg-background py-4 shadow-sm border-b border-border">
      <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
        <span>✅ Transformer retour en conception</span>
        <span>✅ Vos avis, votre croissance</span>
        <span>✅ Un outil, une centralisation</span>

        <div className="relative" ref={menuRef}>
          <Menu
            className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
            size={22}
            onClick={() => setIsOpen(!isOpen)}
          />

          {isOpen && (
            <div className="absolute right-0 top-8 bg-background shadow-lg rounded-xl border border-border p-3 w-40 animate-fade-in z-50">
              <ul className="space-y-2 text-foreground">
                <li>
                  <Link 
                    to="/login" 
                    className="block hover:text-primary cursor-pointer transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Se connecter
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/abonnement" 
                    className="block hover:text-primary cursor-pointer transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/a-propos" 
                    className="block hover:text-primary cursor-pointer transition-colors"
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
