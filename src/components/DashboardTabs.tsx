import { BookOpen, Lightbulb, MessageSquare, Search, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const { t } = useTranslation();
  const tabs = [
    { id: "key-takeaways", label: t("dashboard.keyTakeaways.title"), icon: BookOpen, color: "#4F46E5" },
    // { id: 'indicateurs', label: t("dashboard.keyIndicators"), icon: '📊' },
    { id: "analyse", label: t("dashboard.analyse"), icon: Search, color: "#2563EB" },
    { id: "recommandations", label: t("dashboard.recommendations"), icon: Lightbulb, color: "#D97706" },
    { id: "reponses", label: t("dashboard.response"), icon: MessageSquare, color: "#059669" },
    { id: "objectif", label: t("dashboard.objective"), icon: Target, color: "#E11D48" },
  ];

  return (
    <div
      className="mb-6 flex w-full gap-1 rounded-xl bg-white p-1.5 dark:bg-slate-900"
      style={{
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7D2FE] focus-visible:ring-offset-2 dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900",
              isActive
                ? "border-[#C7D2FE] bg-[#E5EDFF] font-bold text-[#15151f] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                : "border-transparent text-gray-500 hover:bg-black/[0.03] hover:text-[#4B5563] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100"
            )}
          >
            <Icon
              className="h-5 w-5 shrink-0"
              strokeWidth={2.2}
              color={tab.color}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

