import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Brain, Target, TrendingUp, CheckCircle, Menu, X, Globe, ChevronRight, Check } from "lucide-react";
import logoHeader from "@/assets/reviewsvisor-logo-header.png";
import { WhyReviewsvisor } from "@/components/WhyReviewsvisor";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/i18n/config";

export const HeroSection = () => {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
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
    <div className="min-h-screen relative">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Trust indicators bar */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full mx-4 mt-6 shadow-sm relative">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{t("hero.trust1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{t("hero.trust2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{t("hero.trust3")}</span>
              </div>
            </div>
          </div>
          
          {/* Hamburger menu - positioned absolute to not affect trust indicators */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2" ref={menuRef}>
            <button
              onClick={() => {
                setMenuOpen(!menuOpen);
                if (!menuOpen) setLangMenuOpen(false);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-visible">
                {/* Se connecter */}
                <button
                  onClick={() => {
                    navigate("/login");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span>🔐</span>
                  {t("auth.login")}
                </button>

                <div className="border-t border-gray-100"></div>

                {/* Langue */}
                <div className="relative">
                  <button
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      {t("common.language")}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{lang.toUpperCase()}</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${langMenuOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Language submenu - All 5 languages */}
                  {langMenuOpen && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {SUPPORTED_LANGUAGES.map((code) => (
                        <button
                          key={code}
                          onClick={() => handleLanguageChange(code)}
                          className={`w-full text-left px-6 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${lang === code ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}
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
        </div>

        {/* Brand header - Large version */}
        <div className="flex items-center justify-center pt-2 pb-0">
          <img 
            src={logoHeader} 
            alt="Reviewsvisor Logo" 
            className="h-[90px] w-auto -mr-2 mt-4"
            style={{ filter: 'brightness(0) saturate(100%) invert(38%) sepia(89%) saturate(2475%) hue-rotate(214deg) brightness(101%) contrast(101%)' }}
          />
          <span className="text-[#2F6BFF] text-[48px] font-bold leading-none">
            Reviewsvisor
          </span>
        </div>


        {/* Main hero card */}
        <div className="container mx-auto px-4 pt-2 pb-16">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-12">
            <CardContent className="p-8 text-center space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                {t("hero.title")}
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {t("hero.desc1")} <span className="font-semibold" style={{ color: '#2ECC71' }}>{t("hero.highlight1")}</span> {t("hero.desc2")} <span className="font-semibold" style={{ color: '#2ECC71' }}>{t("hero.highlight2")}</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/abonnement'}
                >
                  <span>✨</span>
                  {t("hero.startNow")}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/login'}
                >
                  <span>👤</span>
                  {t("hero.haveAccount")}
                </Button>
              </div>

              {/* Trust indicators bottom */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{t("hero.trust1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{t("hero.trust2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{t("hero.trust3")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-pink-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">Centralisation & Analyse Essentielle</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>Un outil</span>, <span style={{ color: '#23C55E' }}>une centralisation</span> pour votre établissement qui transforme vos <span style={{ color: '#23C55E' }}>retours en conception</span>.
              Avec Reviewsvisor, vos retours clients deviennent une véritable <span style={{ color: '#23C55E' }}>source de croissance</span>.
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">Pourquoi les avis comptent vraiment</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>Parce qu&apos;un avis n&apos;est pas qu&apos;un commentaire</span> :<br />
              ➡️ <span style={{ color: '#2563EB' }}>94%</span> des clients consultent les avis avant de choisir un établissement.<br />
              ➡️ <span style={{ color: '#2563EB' }}>86%</span> hésitent à acheter auprès d&apos;un établissement avec des avis négatifs.
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">Décisions Basées sur Vos Données</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Nous croyons que chaque avis contient <span style={{ color: '#23C55E' }}>une opportunité d&apos;évolution</span> – et que des données bien analysées deviennent <span style={{ color: '#23C55E' }}>un véritable moteur de croissance</span>.<br /><br />
              Prenez des <span style={{ color: '#23C55E' }}>décisions stratégiques basées sur vos propres données</span>.
            </p>
              </CardContent>
            </Card>
          </div>

        </div>
        
        {/* Why section */}
        <WhyReviewsvisor />
      </div>
    </div>
  );
};