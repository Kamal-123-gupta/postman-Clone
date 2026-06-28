'use client';

import React, { useMemo } from 'react';
import { useWorkspaceStore, KeyValueItem, Tab } from '@/store/useWorkspaceStore';
import { Trash2, AlertCircle } from 'lucide-react';

interface BodyEditorProps {
  tab: Tab;
}

export default function BodyEditor({ tab }: BodyEditorProps) {
  const { updateTab } = useWorkspaceStore();
  const bodyType = tab.body_type || 'none';
  const rawBodyContent = tab.body_content || '';

  // Parse structured items for form-data and urlencoded grids
  const structuredItems = useMemo((): KeyValueItem[] => {
    if (bodyType === 'none' || bodyType === 'raw') return [];
    try {
      const parsed = JSON.parse(rawBodyContent);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed : [{ key: '', value: '', enabled: true }];
      }
    } catch {
      // Return default first line if JSON parse fails
    }
    return [{ key: '', value: '', enabled: true }];
  }, [bodyType, rawBodyContent]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    let content = '';
    
    // Initialize default structure depending on type
    if (type === 'raw') {
      content = '{\n  \n}';
    } else if (type === 'form-data' || type === 'x-www-form-urlencoded') {
      content = JSON.stringify([{ key: '', value: '', enabled: true }]);
    }
    updateTab(tab.id, { body_type: type, body_content: content });
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTab(tab.id, { body_content: e.target.value });
  };

  const handleGridChange = (index: number, field: keyof KeyValueItem, value: any) => {
    const updated = [...structuredItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // Auto append empty row at bottom
    if (index === structuredItems.length - 1 && (field === 'key' || field === 'value') && value) {
      updated.push({ key: '', value: '', enabled: true });
    }

    updateTab(tab.id, { body_content: JSON.stringify(updated) });
  };

  const handleGridDelete = (index: number) => {
    const updated = structuredItems.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated.push({ key: '', value: '', enabled: true });
    }
    updateTab(tab.id, { body_content: JSON.stringify(updated) });
  };

  return (
    <div className="w-full text-xs flex flex-col space-y-4 select-none animate-fade-in">
      {/* Body selector */}
      <div className="flex items-center space-x-4 shrink-0">
        <label className="text-pm-text-secondary font-medium w-24">Body Type</label>
        <select
          value={bodyType}
          onChange={handleTypeChange}
          className="bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs text-pm-text-primary hover:bg-pm-bg-tertiary/30 transition cursor-pointer"
        >
          <option value="none">None (No Body)</option>
          <option value="raw">Raw (JSON)</option>
          <option value="form-data">Form Data</option>
          <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
        </select>
      </div>

      {/* Editor panels */}
      <div className="flex-1 min-h-0 border-t border-pm-border/40 pt-4">
        {bodyType === 'none' && (
          <div className="flex items-center space-x-2 text-pm-text-muted bg-pm-bg-secondary/20 p-4 rounded border border-pm-border/30">
            <AlertCircle className="w-4 h-4" />
            <span>This request does not send any HTTP body payload.</span>
          </div>
        )}

        {bodyType === 'raw' && (
          <div className="flex flex-col space-y-2 h-[220px]">
            <textarea
              placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
              value={rawBodyContent}
              onChange={handleRawChange}
              className="flex-1 w-full bg-pm-bg-secondary/40 border border-pm-border rounded p-3 text-xs font-mono text-pm-text-primary placeholder-pm-text-muted resize-none focus:border-pm-orange transition"
            />
          </div>
        )}

        {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
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
              {structuredItems.map((item, index) => (
                <tr key={index} className="border-b border-pm-border/60 hover:bg-pm-bg-tertiary/20">
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => handleGridChange(index, 'enabled', e.target.checked)}
                      className="rounded border-pm-border bg-pm-bg-primary text-pm-orange focus:ring-pm-orange h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) => handleGridChange(index, 'key', e.target.value)}
                      className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => handleGridChange(index, 'value', e.target.value)}
                      className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted focus:ring-0"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description || ''}
                      onChange={(e) => handleGridChange(index, 'description', e.target.value)}
                      className="w-full bg-transparent border-0 text-pm-text-secondary placeholder-pm-text-muted focus:ring-0"
                    />
                  </td>
                  <td className="py-2 text-center">
                    {(index < structuredItems.length - 1 || item.key || item.value) && (
                      <button
                        onClick={() => handleGridDelete(index)}
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
        )}
      </div>
    </div>
  );
}
