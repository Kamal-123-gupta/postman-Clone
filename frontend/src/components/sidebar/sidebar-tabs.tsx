'use client';

import React, { useState } from 'react';
import { FolderOpen, History as HistoryIcon } from 'lucide-react';
import CollectionsTab from './collections-tab';
import HistoryTab from './history-tab';

export default function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-pm-bg-secondary select-none">
      {/* Tab Switchers */}
      <div className="h-10 border-b border-pm-border flex text-xs font-medium bg-pm-bg-primary/20 shrink-0">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 flex items-center justify-center space-x-1.5 transition border-b-2 cursor-pointer min-w-0 px-1.5 ${
            activeTab === 'collections'
              ? 'border-pm-orange text-pm-orange font-semibold bg-pm-bg-tertiary/30'
              : 'border-transparent text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary/10'
          }`}
        >
          <FolderOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">Collections</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center space-x-1.5 transition border-b-2 cursor-pointer min-w-0 px-1.5 ${
            activeTab === 'history'
              ? 'border-pm-orange text-pm-orange font-semibold bg-pm-bg-tertiary/30'
              : 'border-transparent text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary/10'
          }`}
        >
          <HistoryIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">History</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 flex flex-col overflow-hidden bg-pm-bg-secondary">
        {activeTab === 'collections' ? <CollectionsTab /> : <HistoryTab />}
      </div>
    </div>
  );
}
