'use client';

import React from 'react';
import { useWorkspaceStore, Tab } from '@/store/useWorkspaceStore';
import { ShieldAlert, Shield } from 'lucide-react';

interface AuthEditorProps {
  tab: Tab;
}

export default function AuthEditor({ tab }: AuthEditorProps) {
  const { updateTab } = useWorkspaceStore();
  const authType = tab.auth_type || 'none';
  const authConfig = tab.auth_config || {};

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    // Set default structures
    let config = {};
    if (type === 'bearer') {
      config = { token: authConfig.token || '' };
    } else if (type === 'basic') {
      config = {
        username: authConfig.username || '',
        password: authConfig.password || '',
      };
    }
    updateTab(tab.id, { auth_type: type, auth_config: config });
  };

  const handleConfigChange = (field: string, value: string) => {
    updateTab(tab.id, {
      auth_config: {
        ...authConfig,
        [field]: value,
      },
    });
  };

  return (
    <div className="w-full text-xs flex flex-col space-y-4 max-w-lg select-none animate-fade-in">
      {/* Selector */}
      <div className="flex items-center space-x-4">
        <label className="w-24 text-pm-text-secondary font-medium">Auth Type</label>
        <select
          value={authType}
          onChange={handleTypeChange}
          className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs text-pm-text-primary hover:bg-pm-bg-tertiary/30 transition cursor-pointer"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {/* Fields */}
      <div className="border-t border-pm-border/40 pt-4">
        {authType === 'none' && (
          <div className="flex items-center space-x-2 text-pm-text-muted bg-pm-bg-secondary/20 p-4 rounded border border-pm-border/30">
            <Shield className="w-4 h-4" />
            <span>This request does not inherit or use any explicit authentication parameters.</span>
          </div>
        )}

        {authType === 'bearer' && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-4">
              <label className="w-24 text-pm-text-secondary font-medium font-mono text-[11px]">Token</label>
              <input
                type="text"
                placeholder="Enter Bearer Token"
                value={authConfig.token || ''}
                onChange={(e) => handleConfigChange('token', e.target.value)}
                className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs font-mono text-pm-text-primary placeholder-pm-text-muted"
              />
            </div>
            <p className="text-[10px] text-pm-text-muted pl-28">
              Added to headers as <code className="bg-pm-bg-tertiary px-1 py-0.5 rounded text-pm-orange font-bold font-mono">Authorization: Bearer &lt;token&gt;</code>
            </p>
          </div>
        )}

        {authType === 'basic' && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-4">
              <label className="w-24 text-pm-text-secondary font-medium font-mono text-[11px]">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={authConfig.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs font-mono text-pm-text-primary placeholder-pm-text-muted"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="w-24 text-pm-text-secondary font-medium font-mono text-[11px]">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={authConfig.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs font-mono text-pm-text-primary placeholder-pm-text-muted"
              />
            </div>
            <p className="text-[10px] text-pm-text-muted pl-28">
              Compiles into Base64 basic access authentication credentials header.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
