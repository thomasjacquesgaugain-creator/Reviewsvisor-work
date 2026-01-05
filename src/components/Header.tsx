import { useState, useRef, useEffect } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  theme?: string;
}

function Header({ theme = "light" }: HeaderProps) {
  const isDark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`flex justify-between items-center p-4 shadow-md ${
        isDark ? "bg-black text-gray-100" : "bg-white text-gray-900"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center space-x-6">
        <Link
          to="/"
          className={`text-xl font-bold ${
            isDark ? "text-purple-400" : "text-blue-600"
          }`}
        >
          Reviewsvisor
        </Link>
      </div>

      {/* MENU BURGER */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-md transition ${
            isDark ? "hover:bg-gray-800" : "hover:bg-blue-100"
          }`}
        >
          {menuOpen ? (
            <X className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-blue-600"}`} />
          ) : (
            <Menu className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-blue-600"}`} />
          )}
        </button>

        {menuOpen && (
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
              onClick={() => setMenuOpen(false)}
            >
              🔐 Se connecter
            </Link>

            <div className={`border-t my-1 ${isDark ? "border-gray-700" : "border-gray-200"}`}></div>

            <div className="px-4 py-2 flex items-center space-x-2">
              <Globe className={`w-4 h-4 ${isDark ? "text-purple-400" : "text-blue-600"}`} />
              <select
                className={`text-sm bg-transparent outline-none cursor-pointer ${
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
    </header>
  );
}

export default Header;
