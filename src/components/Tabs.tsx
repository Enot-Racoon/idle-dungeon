import React from 'react';

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  heroLevel: number;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, heroLevel }) => {
  const tabs = [
    { id: 'upgrades', label: '⚔️ Улучшения', levelRequired: 1 },
    { id: 'skills', label: '🔮 Заклинания', levelRequired: 1 },
    { id: 'artifacts', label: '💎 Реликвии', levelRequired: 1 },
    { id: 'prestige', label: '⌛ Перерождение', levelRequired: 1 }
  ];

  return (
    <div className="tabs-container" id="dashboard-tabs">
      {tabs.map(tab => {
        const isLocked = heroLevel < tab.levelRequired;
        return (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => !isLocked && setActiveTab(tab.id)}
            disabled={isLocked}
            id={`tab-btn-${tab.id}`}
          >
            {tab.label}
            {isLocked && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}> (Lvl {tab.levelRequired})</span>}
          </button>
        );
      })}
    </div>
  );
};
