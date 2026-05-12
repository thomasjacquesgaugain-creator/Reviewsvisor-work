import { useTranslation } from "react-i18next";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const { t } = useTranslation();
  const tabs = [
    { id: 'key-takeaways', label:t("dashboard.keyTakeaways.title"), icon: '✅' },
    // { id: 'indicateurs', label: t("dashboard.keyIndicators"), icon: '📊' },
    { id: 'analyse', label: t("dashboard.analyse"), icon: '🔍' },
    { id: 'recommandations', label: t("dashboard.recommendations"), icon: '⚡' },
    { id: 'reponses', label: t("dashboard.response"), icon: '💬' },
    { id: 'objectif', label: t("dashboard.objective"), icon: '🎯' },
  ];

  return (
    <div className="flex justify-evenly w-full mb-6 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-950/40 rounded-lg p-2 border border-transparent dark:border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 text-sm font-medium border border-transparent rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
              : 'text-gray-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-700 dark:hover:border-blue-500'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

