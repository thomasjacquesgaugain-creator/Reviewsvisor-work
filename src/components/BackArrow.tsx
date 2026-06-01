import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

interface BackArrowProps {
  to?: string;
  position?: "fixed" | "absolute";
  className?: string;
  top?: string;
  scrollTop?: string;
  isLoggedIn?: boolean;
}

const BackArrow = ({ to = "/", position = "fixed", className, top = "top-[15px]", scrollTop = "top-[15px]", isLoggedIn = false }: BackArrowProps) => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return; // no scroll listener when logged out
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoggedIn]);

  // logged out → always top-[15px], logged in → scroll-aware
  const currentTop = !isLoggedIn ? "top-[15px]" : scrolled ? scrollTop : top;

  return (
    <Link
      to={to}
      className={`${position} ${currentTop} left-[24px] ${
        position === "fixed" ? "z-50" : "z-40"
      } flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ${className || ""}`}
      aria-label={t("common.backToHome")}
    >
      <ArrowLeft 
        size={28} 
        color="#2F6BFF" 
        strokeWidth={2.5}
      />
    </Link>
  );
};

export default BackArrow;
