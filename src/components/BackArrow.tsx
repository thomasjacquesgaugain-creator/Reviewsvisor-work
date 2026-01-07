import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BackArrowProps {
  to?: string;
}

const BackArrow = ({ to = "/" }: BackArrowProps) => {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="fixed top-[15px] left-[10px] z-50 p-2 rounded-lg hover:bg-white/50 transition-colors"
      aria-label={t("common.backToHome")}
    >
      <ArrowLeft 
        size={28} 
        color="#2F6BFF" 
        strokeWidth={2.5}
        className="rounded-sm"
      />
    </Link>
  );
};

export default BackArrow;
