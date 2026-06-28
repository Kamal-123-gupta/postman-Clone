'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { collectionsApi } from '@/lib/api-client';
import { X, Folder } from 'lucide-react';
import { Tab } from '@/store/useWorkspaceStore';
import { toast } from 'sonner';

interface SaveModalProps {
  tab: Tab;
  onClose: () => void;
  onSuccess: (savedReq: any) => void;
}

export default function SaveModal({ tab, onClose, onSuccess }: SaveModalProps) {
  const [name, setName] = useState(tab.name || 'Untitled Request');
  const [selectedColId, setSelectedColId] = useState<number | ''>('');

  // Fetch Collections
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsApi.list,
  });

  // Save Request Mutation
  const saveMutation = useMutation({
    mutationFn: collectionsApi.createRequest,
    onSuccess: (data) => {
      toast.success('Request saved to collection');
      onSuccess(data);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a request name');
      return;
    }
    if (!selectedColId) {
      toast.error('Please select a collection');
      return;
    }

    saveMutation.mutate({
      collection_id: selectedColId,
      name: name.trim(),
      method: tab.method,
      url: tab.url,
      headers: tab.headers,
      query_params: tab.query_params,
      body_type: tab.body_type,
      body_content: tab.body_content,
      auth_type: tab.auth_type,
      auth_config: tab.auth_config,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none text-xs">
      <div className="bg-pm-bg-secondary border border-pm-border rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 border-b border-pm-border px-4 flex items-center justify-between shrink-0 bg-pm-bg-primary">
          <span className="font-semibold text-sm tracking-wide">Save Request</span>
          <button
            onClick={onClose}
            className="text-pm-text-secondary hover:text-pm-text-primary p-1 hover:bg-pm-bg-tertiary rounded transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col space-y-4">
          {/* Request Name */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-pm-text-muted">
              Request Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fetch Users"
              className="bg-pm-bg-primary border border-pm-border rounded px-3 py-1.5 text-xs text-pm-text-primary placeholder-pm-text-muted w-full"
              required
              autoFocus
            />
          </div>

          {/* Target Collection Selection */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-pm-text-muted">
              Save in Collection
            </label>
            <select
              value={selectedColId}
              onChange={(e) => setSelectedColId(Number(e.target.value))}
              className="bg-pm-bg-primary border border-pm-border rounded px-3 py-1.5 text-xs text-pm-text-primary hover:bg-pm-bg-tertiary/20 transition cursor-pointer w-full"
              required
            >
              <option value="" disabled>Select a collection</option>
              {collections.map((col: any) => (
                <option key={col.id} value={col.id}>
                  📁 {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-pm-bg-primary border border-pm-border hover:bg-pm-bg-tertiary px-4 py-1.5 rounded text-xs text-pm-text-secondary transition font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-pm-orange hover:bg-pm-orange-hover text-white px-4 py-1.5 rounded text-xs font-semibold transition cursor-pointer"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
