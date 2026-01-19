import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, CheckCircle, Menu, Globe, Check } from "lucide-react";
import logoHeader from "@/assets/reviewsvisor-logo-header.png";
import { WhyReviewsvisor } from "@/components/WhyReviewsvisor";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS, SupportedLanguage, SUPPORTED_LANGUAGES } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

export const HeroSection = () => {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
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
          
          {/* Hamburger menu - using Radix Portal for true overlay */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label={t("common.menu")}
                >
                  <Menu className="w-5 h-5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent 
                  side="bottom" 
                  align="end" 
                  sideOffset={8}
                  className="z-[99999] w-[200px] bg-white"
                >
                  {/* Se connecter */}
                  <DropdownMenuItem 
                    onClick={() => navigate("/login")}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">🔐</span>
                    {t("auth.login")}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Langue - Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <Globe className="w-4 h-4 mr-2 text-gray-500" />
                      {t("common.language")}
                      <span className="ml-auto text-xs text-gray-500">{lang.toUpperCase()}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="z-[99999] bg-white">
                        {SUPPORTED_LANGUAGES.map((code) => (
                          <DropdownMenuItem
                            key={code}
                            onClick={() => handleLanguageChange(code)}
                            className={`cursor-pointer ${lang === code ? "text-blue-600 font-medium bg-blue-50" : ""}`}
                          >
                            <span className="flex items-center gap-2 flex-1">
                              {LANGUAGE_FLAGS[code]} {LANGUAGE_LABELS[code]}
                            </span>
                            {lang === code && <Check className="w-4 h-4 ml-2" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
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
                  onClick={() => navigate('/abonnement')}
                >
                  <span>✨</span>
                  {t("hero.startNow")}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-foreground px-8 py-3 rounded-full font-medium"
                  onClick={() => navigate('/login')}
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
            <h3 className="text-xl font-bold text-gray-900">{t("hero.card1Title")}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>{t("hero.card1Desc1")}</span>, <span style={{ color: '#23C55E' }}>{t("hero.card1Desc2")}</span> {t("hero.card1Desc3")} <span style={{ color: '#23C55E' }}>{t("hero.card1Desc4")}</span>.
              {t("hero.card1Desc5")} <span style={{ color: '#23C55E' }}>{t("hero.card1Desc6")}</span>.
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">{t("hero.card2Title")}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              <span style={{ color: '#23C55E' }}>{t("hero.card2Desc1")}</span> :<br />
              ➡️ <span style={{ color: '#2563EB' }}>94%</span> {t("hero.card2Stat1")}<br />
              ➡️ <span style={{ color: '#2563EB' }}>86%</span> {t("hero.card2Stat2")}
            </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
            <h3 className="text-xl font-bold text-gray-900">{t("hero.card3Title")}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {t("hero.card3Desc1")} <span style={{ color: '#23C55E' }}>{t("hero.card3Desc2")}</span> {t("hero.card3Desc3")} <span style={{ color: '#23C55E' }}>{t("hero.card3Desc4")}</span>.<br /><br />
              {t("hero.card3Desc5")} <span style={{ color: '#23C55E' }}>{t("hero.card3Desc6")}</span>.
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