'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentsApi } from '@/lib/api-client';
import { X, Plus, Trash2, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface EnvManagerModalProps {
  onClose: () => void;
}

export default function EnvManagerModal({ onClose }: EnvManagerModalProps) {
  const queryClient = useQueryClient();
  const [selectedEnvId, setSelectedEnvId] = useState<number | 'globals'>('globals');
  const [newEnvName, setNewEnvName] = useState('');
  const [vars, setVars] = useState<any[]>([]);

  // Fetch Environments
  const { data: environments = [], refetch: refetchEnvs } = useQuery({
    queryKey: ['environments'],
    queryFn: environmentsApi.list,
  });

  // Fetch Globals
  const { data: globals = [], refetch: refetchGlobals } = useQuery({
    queryKey: ['globals'],
    queryFn: environmentsApi.listGlobals,
  });

  const activeEnv = environments.find((e: any) => e.id === selectedEnvId);

  // Initialize variables list when environment selection changes
  useEffect(() => {
    let activeVars: any[] = [];
    if (selectedEnvId === 'globals') {
      activeVars = [...globals];
    } else if (activeEnv) {
      activeVars = [...activeEnv.variables];
    }
    
    // Add empty row at bottom for inline creations
    activeVars.push({ id: null, key: '', value: '' });
    setVars(activeVars);
  }, [selectedEnvId, environments, globals, activeEnv]);

  // Mutations
  const createEnvMutation = useMutation({
    mutationFn: environmentsApi.create,
    onSuccess: () => {
      setNewEnvName('');
      refetchEnvs();
      toast.success('Environment created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create environment'),
  });

  const deleteEnvMutation = useMutation({
    mutationFn: environmentsApi.delete,
    onSuccess: () => {
      setSelectedEnvId('globals');
      refetchEnvs();
      toast.success('Environment deleted');
    },
  });

  const saveVarMutation = useMutation({
    mutationFn: ({ key, value, id }: { key: string; value: string; id?: number | null }) =>
      environmentsApi.saveVariable(key, value, selectedEnvId === 'globals' ? null : (selectedEnvId as number)),
    onSuccess: () => {
      refetchEnvs();
      refetchGlobals();
      toast.success('Variable saved');
    },
  });

  const deleteVarMutation = useMutation({
    mutationFn: environmentsApi.deleteVariable,
    onSuccess: () => {
      refetchEnvs();
      refetchGlobals();
      toast.success('Variable removed');
    },
  });

  const handleCreateEnv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    createEnvMutation.mutate(newEnvName.trim());
  };

  const handleVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...vars];
    updated[index][field] = value;
    
    // If user typed in the last empty row, append another empty row
    if (index === vars.length - 1 && (updated[index].key || updated[index].value)) {
      updated.push({ id: null, key: '', value: '' });
    }
    setVars(updated);
  };

  const handleSaveVar = (index: number) => {
    const variable = vars[index];
    if (!variable.key.trim()) {
      toast.error('Variable key cannot be empty');
      return;
    }
    saveVarMutation.mutate({ key: variable.key.trim(), value: variable.value, id: variable.id });
  };

  const handleDeleteVar = (id: number | null, index: number) => {
    if (id) {
      deleteVarMutation.mutate(id);
    } else {
      const updated = vars.filter((_, i) => i !== index);
      // Ensure there's always at least one empty row
      if (updated.length === 0 || updated[updated.length - 1].id !== null) {
        updated.push({ id: null, key: '', value: '' });
      }
      setVars(updated);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-pm-bg-secondary border border-pm-border rounded-lg shadow-2xl w-full max-w-4xl h-[560px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-pm-border px-6 flex items-center justify-between shrink-0 bg-pm-bg-primary">
          <h2 className="font-semibold text-sm tracking-wide flex items-center space-x-2">
            <span>Manage Environments & Variables</span>
          </h2>
          <button
            onClick={onClose}
            className="text-pm-text-secondary hover:text-pm-text-primary p-1 hover:bg-pm-bg-tertiary rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: List environments */}
          <div className="w-64 border-r border-pm-border flex flex-col bg-pm-bg-primary shrink-0">
            {/* Create new environment input */}
            <form onSubmit={handleCreateEnv} className="p-4 border-b border-pm-border">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-pm-text-muted mb-1.5">
                New Environment
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Env name..."
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-2 py-1 text-xs text-pm-text-primary placeholder-pm-text-muted"
                />
                <button
                  type="submit"
                  className="bg-pm-orange hover:bg-pm-orange-hover text-white rounded p-1 transition flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2">
              <button
                onClick={() => setSelectedEnvId('globals')}
                className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition ${
                  selectedEnvId === 'globals' ? 'bg-pm-bg-tertiary text-pm-orange font-semibold' : 'text-pm-text-primary hover:bg-pm-bg-tertiary/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Globals (fallback)</span>
              </button>

              <div className="h-px bg-pm-border my-2 px-4" />

              <div className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-pm-text-muted">
                Environments
              </div>

              {environments.map((env: any) => (
                <div
                  key={env.id}
                  className={`group flex items-center justify-between px-4 py-1.5 text-xs transition ${
                    selectedEnvId === env.id ? 'bg-pm-bg-tertiary text-pm-orange font-semibold' : 'hover:bg-pm-bg-tertiary/50 text-pm-text-primary'
                  }`}
                >
                  <button
                    onClick={() => setSelectedEnvId(env.id)}
                    className="flex-1 text-left truncate mr-2"
                  >
                    {env.name}
                  </button>

                  <button
                    onClick={() => deleteEnvMutation.mutate(env.id)}
                    className="opacity-0 group-hover:opacity-100 text-pm-text-muted hover:text-pm-delete p-0.5 rounded transition cursor-pointer"
                    title="Delete environment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {environments.length === 0 && (
                <div className="px-4 py-3 text-xs text-pm-text-muted italic">
                  No environments added
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Variables table editor */}
          <div className="flex-1 flex flex-col bg-pm-bg-secondary overflow-hidden">
            {/* Header bar */}
            <div className="px-6 py-4 border-b border-pm-border flex items-center justify-between bg-pm-bg-primary/20 shrink-0">
              <div>
                <h3 className="font-semibold text-xs text-pm-text-primary">
                  {selectedEnvId === 'globals' ? 'Global Fallback Variables' : `${activeEnv?.name || ''} Variables`}
                </h3>
                <p className="text-[11px] text-pm-text-secondary mt-0.5">
                  Variables are referenced using syntax like <code className="text-pm-orange bg-pm-bg-tertiary px-1 py-0.5 rounded font-mono font-bold">&#123;&#123;variable_name&#125;&#125;</code>
                </p>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-pm-border text-pm-text-secondary">
                    <th className="py-2 font-bold w-1/3">Variable Key</th>
                    <th className="py-2 font-bold w-1/2">Current Value</th>
                    <th className="py-2 font-bold w-[70px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vars.map((v: any, index: number) => (
                    <tr key={index} className="border-b border-pm-border/60 hover:bg-pm-bg-tertiary/20">
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          placeholder="e.g. baseUrl"
                          value={v.key}
                          onChange={(e) => handleVarChange(index, 'key', e.target.value)}
                          className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="text"
                          placeholder="e.g. https://api.com"
                          value={v.value}
                          onChange={(e) => handleVarChange(index, 'value', e.target.value)}
                          className="w-full bg-transparent border-0 text-pm-text-primary font-mono placeholder-pm-text-muted"
                        />
                      </td>
                      <td className="py-2 flex items-center justify-center space-x-2">
                        {v.key.trim() && (
                          <button
                            onClick={() => handleSaveVar(index)}
                            className="p-1 text-pm-text-secondary hover:text-pm-get rounded hover:bg-pm-bg-tertiary transition cursor-pointer"
                            title="Save Variable"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(v.id || v.key || v.value) && (
                          <button
                            onClick={() => handleDeleteVar(v.id, index)}
                            className="p-1 text-pm-text-secondary hover:text-pm-delete rounded hover:bg-pm-bg-tertiary transition cursor-pointer"
                            title="Delete Variable"
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
          </div>
        </div>
      </div>
    </div>
  );
}
