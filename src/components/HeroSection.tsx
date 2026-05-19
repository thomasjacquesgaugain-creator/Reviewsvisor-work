import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, CheckCircle, Menu, Globe, Check, User, BookmarkCheck, Rocket, Lock, Languages } from "lucide-react";
import logoHeader from "@/assets/reviewsvisor-logo-header.png";
import logoHeaderLight from "@/assets/reviewsvisor-logo-header-light.png";
import { WhyReviewsvisor } from "@/components/WhyReviewsvisor";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { APP_NAME } from "@/config/brand";
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
    <div className="relative z-0 flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_bottom_right,hsl(var(--ring)/0.14),transparent_38%)]" />
      <div className="relative z-10">
        {/* Header */}
        <div className="mx-4 mt-6 flex items-center justify-end pr-2">
          <div>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="
                    rounded-full
                    p-2
                    transition-colors
                    hover:bg-muted

                    dark:border
                    dark:border-border
                    dark:bg-white/[0.04]
                    dark:hover:bg-white/[0.08]
                  "
                  aria-label={t("common.menu")}
                >
                  <Menu className="h-5 w-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="z-[99999] w-[200px] border border-border bg-popover text-popover-foreground"
                >
                  {/* Login */}
                  <DropdownMenuItem
                    onClick={() => navigate("/login")}
                    className="cursor-pointer focus:bg-accent"
                  >
                    <span className="mr-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </span>

                    {t("auth.login")}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border" />

                  {/* Language */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer focus:bg-accent">
                      <Languages className="mr-2 h-4 w-4 text-muted-foreground" />

                      {t("common.language")}

                      <span className="ml-auto text-xs text-muted-foreground">
                        {lang.toUpperCase()}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent
                        className="z-[99999] border border-border bg-popover text-popover-foreground"
                      >
                        {SUPPORTED_LANGUAGES.map((code) => (
                          <DropdownMenuItem
                            key={code}
                            onClick={() => handleLanguageChange(code)}
                            className={`cursor-pointer focus:bg-accent ${
                              lang === code
                                ? "bg-primary/10 font-medium text-primary"
                                : ""
                            }`}
                          >
                            <span className="flex flex-1 items-center gap-2">
                              {LANGUAGE_FLAGS[code]} {LANGUAGE_LABELS[code]}
                            </span>

                            {lang === code && (
                              <Check className="ml-2 h-4 w-4" />
                            )}
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

        {/* Logo */}
        <div className="flex items-center justify-center pb-0 pt-2">
          {/* Light mode logo */}
          <img
            src={logoHeader}
            alt={`${APP_NAME} Logo`}
            className="mt-4 h-[50px] w-auto -mr-2 dark:hidden"
          />

          {/* Dark mode logo */}
          <img
            src={logoHeaderLight}
            alt={`${APP_NAME} Logo`}
            className="mt-4 hidden h-[50px] w-auto -mr-2 dark:block dark:drop-shadow-[0_0_22px_hsl(var(--primary)/0.35)]"
          />
        </div>
        <br/>

        {/* Main Hero Card */}
        <div className="container mx-auto px-4 pb-16 pt-2">
          <Card
            className="
              mx-auto
              mb-12
              max-w-3xl
              overflow-hidden
              rounded-3xl
              border
              border-transparent
              bg-white/90
              shadow-xl
              backdrop-blur-sm

              dark:border-border
              dark:bg-white/[0.04]
              dark:shadow-2xl
              dark:backdrop-blur-xl
            "
          >
            <CardContent className="space-y-6 p-8 text-center">
              <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
                {t("hero.title")}
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground">
                {t("hero.desc1")}{" "}
                <span className="font-semibold text-primary">
                  {t("hero.highlight1")}
                </span>{" "}
                {t("hero.desc2")}{" "}
                <span className="font-semibold text-primary">
                  {t("hero.highlight2")}
                </span>
                .
              </p>

              {/* Buttons */}
              <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
                <Button
                  className="
                    rounded-full
                    bg-primary
                    px-8
                    py-3
                    font-medium
                    text-primary-foreground
                    hover:bg-primary/90
                    dark:shadow-[0_0_24px_hsl(var(--primary)/0.35)]
                  "
                  onClick={() => navigate("/inscription")}
                >
                  <span>
                    <Rocket className="h-5 w-5" />
                  </span>

                  {t("hero.startNow")}
                </Button>

                <Button
                  variant="outline"
                  className="h-10 rounded-full border-gray-300 bg-background px-8 py-3 font-medium text-gray-700 hover:bg-accent hover:text-accent-foreground dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                  onClick={() => navigate("/login")}
                >
                  <span>
                    <User className="h-5 w-5" />
                  </span>

                  {t("hero.haveAccount")}
                </Button>
              </div>

              {/* Trust indicators */}
              <div
                className="
                  mt-4
                  rounded-full
                  border
                  border-border
                  px-6
                  py-4

                  dark:bg-white/[0.03]
                "
              >
                <div
                  className="
                    flex
                    flex-nowrap
                    items-center
                    justify-center
                    gap-6
                    text-sm
                    text-muted-foreground
                    sm:gap-8
                  "
                >
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />

                    <span className="whitespace-nowrap">
                      {t("hero.trust1")}
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />

                    <span className="whitespace-nowrap">
                      {t("hero.trust2")}
                    </span>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />

                    <span className="whitespace-nowrap">
                      {t("hero.trust3")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <div className="mx-auto mb-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <Card
              className="
                rounded-2xl
                border
                border-transparent
                bg-white/80
                p-6
                shadow-lg
                backdrop-blur-sm

                dark:border-border
                dark:bg-white/[0.04]
                dark:shadow-xl
                dark:backdrop-blur-xl
                dark:transition-all
                dark:hover:bg-white/[0.06]
              "
            >
              <CardContent className="space-y-4 p-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100 dark:border dark:border-pink-500/20 dark:bg-pink-500/10">
                  <Brain className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {t("hero.card1Title")}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="text-primary">
                    {t("hero.card1Desc1")}
                  </span>
                  ,{" "}
                  <span className="text-primary">
                    {t("hero.card1Desc2")}
                  </span>{" "}
                  {t("hero.card1Desc3")}{" "}
                  <span className="text-primary">
                    {t("hero.card1Desc4")}
                  </span>
                  . {t("hero.card1Desc5")}{" "}
                  <span className="text-primary">
                    {t("hero.card1Desc6")}
                  </span>
                  .
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card
              className="
                rounded-2xl
                border
                border-transparent
                bg-white/80
                p-6
                shadow-lg
                backdrop-blur-sm

                dark:border-border
                dark:bg-white/[0.04]
                dark:shadow-xl
                dark:backdrop-blur-xl
                dark:transition-all
                dark:hover:bg-white/[0.06]
              "
            >
              <CardContent className="space-y-4 p-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:border dark:border-red-500/20 dark:bg-red-500/10">
                  <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {t("hero.card2Title")}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="text-primary">
                    {t("hero.card2Desc1")}
                  </span>{" "}
                  :
                  <br />
                  ➡️ <span className="text-primary">94%</span>{" "}
                  {t("hero.card2Stat1")}
                  <br />
                  ➡️ <span className="text-primary">86%</span>{" "}
                  {t("hero.card2Stat2")}
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card
              className="
                rounded-2xl
                border
                border-transparent
                bg-white/80
                p-6
                shadow-lg
                backdrop-blur-sm

                dark:border-border
                dark:bg-white/[0.04]
                dark:shadow-xl
                dark:backdrop-blur-xl
                dark:transition-all
                dark:hover:bg-white/[0.06]
              "
            >
              <CardContent className="space-y-4 p-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:border dark:border-purple-500/20 dark:bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {t("hero.card3Title")}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("hero.card3Desc1")}{" "}
                  <span className="text-primary">
                    {t("hero.card3Desc2")}
                  </span>{" "}
                  {t("hero.card3Desc3")}{" "}
                  <span className="text-primary">
                    {t("hero.card3Desc4")}
                  </span>
                  .
                  <br />
                  <br />
                  {t("hero.card3Desc5")}{" "}
                  <span className="text-primary">
                    {t("hero.card3Desc6")}
                  </span>
                  .
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