import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/i18n/config";

interface HeaderProps {
  theme?: string;
}

function Header({ theme = "light" }: HeaderProps) {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const isDark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    setLangMenuOpen(false);
    setMenuOpen(false);
  };

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
            className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 ${
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
              🔐 {t("auth.login")}
            </Link>

            <div className={`border-t my-1 ${isDark ? "border-gray-700" : "border-gray-200"}`}></div>

            {/* Language submenu */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-blue-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${isDark ? "text-purple-400" : "text-blue-500"}`} />
                  {t("common.language")}
                </span>
                <span className="text-xs text-gray-500">{lang.toUpperCase()}</span>
              </button>

              {langMenuOpen && (
                <div className={`absolute left-full top-0 ml-1 w-48 rounded-lg shadow-lg border z-50 ${
                  isDark
                    ? "bg-gray-900 border-gray-700 text-gray-100"
                    : "bg-white border-gray-200 text-gray-900"
                }`}>
                  {SUPPORTED_LANGUAGES.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`w-full flex items-center justify-between px-4 py-2 ${
                        isDark ? "hover:bg-gray-800" : "hover:bg-blue-50"
                      } ${lang === code ? "bg-blue-50 text-blue-600 font-medium" : ""}`}
                    >
                      <span className="flex items-center gap-2">
                        {LANGUAGE_FLAGS[code]} {LANGUAGE_LABELS[code]}
                      </span>
                      {lang === code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
