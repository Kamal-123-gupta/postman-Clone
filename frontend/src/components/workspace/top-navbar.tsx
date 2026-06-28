'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { environmentsApi } from '@/lib/api-client';
import { Settings, Globe, Plus, Trash2, ShieldAlert, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import EnvManagerModal from './env-manager-modal';

export default function TopNavbar() {
  const { selectedEnvironmentId, setSelectedEnvironmentId, sidebarCollapsed, toggleSidebar } = useWorkspaceStore();
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: environments = [], refetch } = useQuery({
    queryKey: ['environments'],
    queryFn: environmentsApi.list,
  });

  const selectedEnv = environments.find((e: any) => e.id === selectedEnvironmentId);

  return (
    <nav className="h-12 border-b border-pm-border bg-pm-bg-secondary flex items-center justify-between px-4 select-none shrink-0">
      {/* Left side: Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary transition cursor-pointer flex items-center justify-center shrink-0"
          title={sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <div className="w-6 h-6 bg-pm-orange rounded flex items-center justify-center text-white font-bold text-sm shrink-0">
          P
        </div>
        <span className="font-semibold text-sm tracking-wide text-pm-text-primary">
          Postman Client Clone
        </span>
        <div className="h-4 w-px bg-pm-border" />
        <span className="text-xs text-pm-text-secondary bg-pm-bg-tertiary px-2 py-0.5 rounded-full border border-pm-border">
          My Workspace
        </span>
      </div>

      {/* Right side: Environment dropdown & settings */}
      <div className="flex items-center space-x-3 relative">
        <div className="flex items-center bg-pm-bg-primary border border-pm-border rounded text-xs">
          <div className="px-2 py-1.5 flex items-center space-x-1.5 text-pm-text-secondary">
            <Globe className="w-3.5 h-3.5" />
            <span>Environment:</span>
          </div>

          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-1.5 border-l border-pm-border font-medium hover:bg-pm-bg-tertiary transition cursor-pointer text-pm-text-primary min-w-[140px] text-left"
          >
            {selectedEnv ? selectedEnv.name : 'No Environment'}
          </button>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-12 top-10 w-56 bg-pm-bg-secondary border border-pm-border rounded-md shadow-lg z-20 py-1 text-xs">
              <button
                onClick={() => {
                  setSelectedEnvironmentId(null);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-pm-bg-tertiary transition ${
                  selectedEnvironmentId === null ? 'text-pm-orange font-medium' : 'text-pm-text-primary'
                }`}
              >
                No Environment
              </button>

              {environments.map((env: any) => (
                <button
                  key={env.id}
                  onClick={() => {
                    setSelectedEnvironmentId(env.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-pm-bg-tertiary transition ${
                    selectedEnvironmentId === env.id ? 'text-pm-orange font-medium' : 'text-pm-text-primary'
                  }`}
                >
                  {env.name}
                </button>
              ))}

              <div className="h-px bg-pm-border my-1" />

              <button
                onClick={() => {
                  setIsEnvModalOpen(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-pm-text-secondary hover:bg-pm-bg-tertiary hover:text-pm-text-primary transition flex items-center space-x-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage Environments</span>
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setIsEnvModalOpen(true)}
          className="p-1.5 rounded border border-pm-border bg-pm-bg-primary text-pm-text-secondary hover:text-pm-text-primary hover:bg-pm-bg-tertiary transition cursor-pointer"
          title="Manage Environments"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {isEnvModalOpen && (
        <EnvManagerModal
          onClose={() => {
            setIsEnvModalOpen(false);
            refetch();
          }}
        />
      )}
    </nav>
  );
}
