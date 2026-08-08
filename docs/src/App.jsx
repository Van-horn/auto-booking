import { useState } from 'react';

import { HomeScreen } from '@/pages/home/HomeScreen';
import { LogsScreen } from '@/pages/logs/LogsScreen';
import { SettingsScreen } from '@/pages/settings/SettingsScreen';

const TABS = [
  { key: 'home', title: 'Главная', Component: HomeScreen },
  { key: 'logs', title: 'Логи', Component: LogsScreen },
  { key: 'settings', title: 'Settings', Component: SettingsScreen },
];

export default function App() {
  const [activeKey, setActiveKey] = useState('home');
  const active = TABS.find((tab) => tab.key === activeKey);
  const Active = active.Component;

  return (
    <div className="app">
      <main className="app-content">
        <Active />
      </main>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${tab.key === activeKey ? 'tab-button_active' : ''}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
