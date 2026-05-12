import { AppPageBackground } from "@/components/AppPageBackground";
import { useTranslation } from "react-i18next";

export default function Messages() {
  const { t } = useTranslation();

  return (
    <div className="app-page-shell">
      <AppPageBackground />
      <div className="relative z-10 p-8">
        <h1 className="text-2xl font-semibold mb-4">Messages</h1>
        <p className="text-white">
          {t("messages.featureAvailableSoon")}
        </p>
      </div>
    </div>
  );
}
