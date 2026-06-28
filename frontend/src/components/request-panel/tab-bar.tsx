'use client';

import React from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Plus, X, AlertCircle } from 'lucide-react';
import { getMethodColorClass } from '../sidebar/collections-tab';

export default function TabBar() {
  const { tabs, activeTabId, addTab, closeTab, setActiveTabId } = useWorkspaceStore();

  const handleAddTab = () => {
    addTab();
  };

  return (
    <div className="h-10 bg-pm-bg-secondary border-b border-pm-border flex items-center select-none shrink-0 overflow-x-auto scrollbar-none">
      {/* List open tabs */}
      <div className="flex h-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`h-full border-r border-pm-border px-3.5 flex items-center space-x-2 text-xs font-medium cursor-pointer transition select-none group max-w-[180px] min-w-[100px] truncate ${
                isActive 
                  ? 'bg-pm-bg-primary text-pm-text-primary border-t-2 border-t-pm-orange' 
                  : 'text-pm-text-secondary bg-pm-bg-secondary/40 hover:bg-pm-bg-tertiary/20 hover:text-pm-text-primary'
              }`}
            >
              {/* Method badge tag */}
              <span className={`text-[8px] font-extrabold font-mono shrink-0 px-1 py-0.5 rounded-sm ${getMethodColorClass(tab.method)}`}>
                {tab.method}
              </span>

              {/* Name */}
              <span className="truncate flex-1 font-medium">{tab.name}</span>

              {/* Close / Dirty Indicator button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary transition cursor-pointer"
              >
                {tab.is_dirty ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-pm-text-muted group-hover:hidden" />
                ) : null}
                <X className={`w-3 h-3 ${tab.is_dirty ? 'hidden group-hover:block' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Tab Button */}
      <button
        onClick={handleAddTab}
        className="h-full px-3 text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary/20 transition flex items-center justify-center border-r border-pm-border cursor-pointer"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
