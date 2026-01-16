
interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const tabs = [
    { id: 'indicateurs', label: 'Indicateurs clés', icon: '📊' },
    { id: 'analyse', label: 'Analyse', icon: '🔍' },
    { id: 'recommandations', label: 'Recommandations', icon: '⚡' },
    { id: 'reponses', label: 'Réponses', icon: '💬' },
    { id: 'objectif', label: 'Objectif', icon: '🎯' },
  ];

  return (
    <div className="flex justify-evenly w-full mb-6 bg-white shadow-sm rounded-lg p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-3 text-sm font-medium border border-transparent rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600'
              : 'text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

