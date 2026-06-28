'use client';

import React from 'react';
import { useWorkspaceStore, KeyValueItem, Tab } from '@/store/useWorkspaceStore';
import { Trash2 } from 'lucide-react';

interface ParamsEditorProps {
  tab: Tab;
}

export default function ParamsEditor({ tab }: ParamsEditorProps) {
  const { syncParamsToUrl } = useWorkspaceStore();
  const params = tab.query_params || [{ key: '', value: '', enabled: true }];

  const handleChange = (index: number, field: keyof KeyValueItem, value: any) => {
    const updated = [...params];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // If user edited the last row, add a new empty row at the bottom
    if (index === params.length - 1 && (field === 'key' || field === 'value') && value) {
      updated.push({ key: '', value: '', enabled: true });
    }

    syncParamsToUrl(tab.id, updated);
  };

  const handleDelete = (index: number) => {
    const updated = params.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated.push({ key: '', value: '', enabled: true });
    }
    syncParamsToUrl(tab.id, updated);
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
          {params.map((param, index) => (
            <tr key={index} className="border-b border-pm-border/60 hover:bg-pm-bg-tertiary/20">
              {/* Checkbox enabled/disabled */}
              <td className="py-2 text-center">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={(e) => handleChange(index, 'enabled', e.target.checked)}
                  className="rounded border-pm-border bg-pm-bg-primary text-pm-orange focus:ring-pm-orange h-3.5 w-3.5 cursor-pointer"
                />
              </td>

              {/* Key input */}
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => handleChange(index, 'key', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                />
              </td>

              {/* Value input */}
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                />
              </td>

              {/* Description input */}
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={param.description || ''}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full bg-transparent border-0 text-pm-text-secondary placeholder-pm-text-muted focus:ring-0"
                />
              </td>

              {/* Delete Row button */}
              <td className="py-2 text-center">
                {(index < params.length - 1 || param.key || param.value) && (
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
        </tbody>
      </table>
    </div>
  );
}
