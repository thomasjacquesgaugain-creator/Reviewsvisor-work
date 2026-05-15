import { BadgeCheck, Lightbulb, MessagesSquare, ScanSearch, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const { t } = useTranslation();
  const tabs = [
    { id: 'key-takeaways', label:t("dashboard.keyTakeaways.title"), icon: <Lightbulb className="h-5 w-5" /> },
    // { id: 'indicateurs', label: t("dashboard.keyIndicators"), icon: '📊' },
    { id: 'analyse', label: t("dashboard.analyse"), icon: <ScanSearch className="h-5 w-5" />},
    { id: 'recommandations', label: t("dashboard.recommendations"), icon: <BadgeCheck className="h-5 w-5" /> },
    { id: 'reponses', label: t("dashboard.response"), icon: <MessagesSquare className="h-5 w-5" />},
    { id: 'objectif', label: t("dashboard.objective"), icon: <Target className="h-5 w-5" />},
  ];

  return (
    <div className="flex justify-evenly w-full mb-6 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-950/40 rounded-lg p-2 border border-transparent dark:border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 border border-transparent rounded-lg transition-all duration-200 ${
            activeTab === tab.id
              ? 'text-primary bg-primary/10 dark:bg-primary/5 border-primary/20 font-semibold'
              : 'text-gray-600 dark:text-slate-300 hover:bg-primary hover:text-primary-foreground hover:border-primary'
          }`}
        >
          <span className={`transition-all duration-200 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>
            {tab.icon}
          </span>
          
          <span className={`transition-all duration-200 ${activeTab === tab.id ? 'text-[15px]' : 'text-sm'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};

