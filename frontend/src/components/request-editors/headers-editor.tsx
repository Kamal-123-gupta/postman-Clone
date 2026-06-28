'use client';

import React, { useMemo } from 'react';
import { useWorkspaceStore, KeyValueItem, Tab } from '@/store/useWorkspaceStore';
import { Trash2, Lock } from 'lucide-react';

interface HeadersEditorProps {
  tab: Tab;
}

export default function HeadersEditor({ tab }: HeadersEditorProps) {
  const { updateTab } = useWorkspaceStore();
  const headers = tab.headers || [{ key: '', value: '', enabled: true }];

  // Compute read-only system generated headers based on auth and body selections
  const systemHeaders = useMemo(() => {
    const sys: { key: string; value: string; description: string }[] = [];

    // Body content type
    if (tab.body_type === 'raw') {
      sys.push({
        key: 'Content-Type',
        value: 'application/json',
        description: 'Auto-generated based on raw body content',
      });
    } else if (tab.body_type === 'x-www-form-urlencoded') {
      sys.push({
        key: 'Content-Type',
        value: 'application/x-www-form-urlencoded',
        description: 'Auto-generated based on urlencoded body',
      });
    } else if (tab.body_type === 'form-data') {
      sys.push({
        key: 'Content-Type',
        value: 'multipart/form-data',
        description: 'Auto-generated based on form data',
      });
    }

    // Auth headers indication
    if (tab.auth_type === 'bearer' && tab.auth_config?.token) {
      sys.push({
        key: 'Authorization',
        value: `Bearer ${tab.auth_config.token.substring(0, 8)}...`,
        description: 'Auto-generated based on authorization token',
      });
    } else if (tab.auth_type === 'basic' && (tab.auth_config?.username || tab.auth_config?.password)) {
      sys.push({
        key: 'Authorization',
        value: 'Basic ****************',
        description: 'Auto-generated basic credentials header',
      });
    }

    return sys;
  }, [tab.auth_type, tab.auth_config, tab.body_type]);

  const handleChange = (index: number, field: keyof KeyValueItem, value: any) => {
    const updated = [...headers];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // Auto append empty row at bottom
    if (index === headers.length - 1 && (field === 'key' || field === 'value') && value) {
      updated.push({ key: '', value: '', enabled: true });
    }

    updateTab(tab.id, { headers: updated });
  };

  const handleDelete = (index: number) => {
    const updated = headers.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated.push({ key: '', value: '', enabled: true });
    }
    updateTab(tab.id, { headers: updated });
  };

  return (
    <div className="w-full text-xs animate-fade-in select-none">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-pm-border text-pm-text-secondary">
            <th className="py-2 pl-2 w-8 text-center"></th>
            <th className="py-2 pr-4 w-1/3 font-bold">Key</th>
            <th className="py-2 pr-4 w-1/3 font-bold">Value</th>
            <th className="py-2 pr-4 font-bold">Description</th>
            <th className="py-2 w-10 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {/* Render User Defined Headers */}
          {headers.map((header, index) => (
            <tr key={`user-${index}`} className="border-b border-pm-border/60 hover:bg-pm-bg-tertiary/20">
              <td className="py-2 text-center">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => handleChange(index, 'enabled', e.target.checked)}
                  className="rounded border-pm-border bg-pm-bg-primary text-pm-orange focus:ring-pm-orange h-3.5 w-3.5 cursor-pointer"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Header Key"
                  value={header.key}
                  onChange={(e) => handleChange(index, 'key', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={header.description || ''}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-secondary placeholder-pm-text-muted focus:ring-0"
                />
              </td>
              <td className="py-2 text-center">
                {(index < headers.length - 1 || header.key || header.value) && (
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-1 text-pm-text-secondary hover:text-pm-delete hover:bg-pm-bg-tertiary rounded transition cursor-pointer"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}

          {/* Render system/read-only headers */}
          {systemHeaders.map((sysHeader, i) => (
            <tr key={`sys-${i}`} className="border-b border-pm-border/30 bg-pm-bg-tertiary/10 opacity-60 text-pm-text-secondary">
              <td className="py-2 text-center">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded border-pm-border bg-pm-bg-tertiary text-pm-orange h-3.5 w-3.5 cursor-not-allowed"
                />
              </td>
              <td className="py-2 pr-4 font-mono select-all font-semibold italic">{sysHeader.key}</td>
              <td className="py-2 pr-4 font-mono select-all truncate">{sysHeader.value}</td>
              <td className="py-2 pr-4 select-all text-pm-text-muted flex items-center space-x-1">
                <Lock className="w-3 h-3 text-pm-text-muted shrink-0" />
                <span className="truncate">{sysHeader.description}</span>
              </td>
              <td className="py-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
