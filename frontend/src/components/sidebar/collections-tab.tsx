'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsApi } from '@/lib/api-client';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Folder, ChevronDown, ChevronRight, FileCode, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';

export const getMethodColorClass = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-pm-get bg-pm-get/15';
    case 'POST':
      return 'text-pm-post bg-pm-post/15';
    case 'PUT':
      return 'text-pm-put bg-pm-put/15';
    case 'PATCH':
      return 'text-pm-patch bg-pm-patch/15';
    case 'DELETE':
      return 'text-pm-delete bg-pm-delete/15';
    default:
      return 'text-pm-text-secondary bg-pm-bg-tertiary';
  }
};

export default function CollectionsTab() {
  const queryClient = useQueryClient();
  const { addTab, tabs, setActiveTabId } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [newColName, setNewColName] = useState('');
  const [isAddingCol, setIsAddingCol] = useState(false);

  // Fetch Collections
  const { data: collections = [], refetch } = useQuery({
    queryKey: ['collections'],
    queryFn: collectionsApi.list,
  });

  // Mutations
  const createColMutation = useMutation({
    mutationFn: (name: string) => collectionsApi.create(name),
    onSuccess: () => {
      setNewColName('');
      setIsAddingCol(false);
      refetch();
      toast.success('Collection created');
    },
  });

  const deleteColMutation = useMutation({
    mutationFn: collectionsApi.delete,
    onSuccess: () => {
      refetch();
      toast.success('Collection deleted');
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: ({ name, collectionId }: { name: string; collectionId: number }) =>
      collectionsApi.createRequest({
        collection_id: collectionId,
        name,
        method: 'GET',
        url: '',
        headers: [],
        query_params: [],
        body_type: 'none',
        auth_type: 'none',
      }),
    onSuccess: (newReq: any) => {
      refetch();
      // Add a workspace tab referencing the newly created request
      const tabId = addTab({
        request_id: newReq.id,
        name: newReq.name,
        method: newReq.method,
        url: newReq.url,
        headers: newReq.headers && newReq.headers.length ? newReq.headers : [{ key: '', value: '', enabled: true }],
        query_params: newReq.query_params && newReq.query_params.length ? newReq.query_params : [{ key: '', value: '', enabled: true }],
        body_type: newReq.body_type,
        body_content: newReq.body_content,
        auth_type: newReq.auth_type,
        auth_config: newReq.auth_config,
        is_dirty: false,
      });
      setActiveTabId(tabId);
      toast.success('Request added to collection');
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: collectionsApi.deleteRequest,
    onSuccess: () => {
      refetch();
      toast.success('Request deleted');
    },
  });

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    createColMutation.mutate(newColName.trim());
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddRequest = (colId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Open prompt to ask for request name
    const reqName = prompt('Enter request name:');
    if (!reqName || !reqName.trim()) return;
    createRequestMutation.mutate({ name: reqName.trim(), collectionId: colId });
  };

  const handleRequestClick = (req: any) => {
    // Check if there is an active tab already open pointing to this request
    const existingTab = tabs.find((t) => t.request_id === req.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const tabId = addTab({
        request_id: req.id,
        name: req.name,
        method: req.method,
        url: req.url,
        headers: req.headers && req.headers.length ? req.headers : [{ key: '', value: '', enabled: true }],
        query_params: req.query_params && req.query_params.length ? req.query_params : [{ key: '', value: '', enabled: true }],
        body_type: req.body_type,
        body_content: req.body_content,
        auth_type: req.auth_type,
        auth_config: req.auth_config,
        is_dirty: false,
      });
      setActiveTabId(tabId);
    }
  };

  // Filter collections and their nested requests based on search
  const filteredCollections = collections
    .map((col: any) => {
      const matchesCol = col.name.toLowerCase().includes(search.toLowerCase());
      const filteredReqs = col.requests.filter((req: any) =>
        req.name.toLowerCase().includes(search.toLowerCase())
      );
      
      if (matchesCol || filteredReqs.length > 0) {
        return {
          ...col,
          requests: filteredReqs,
        };
      }
      return null;
    })
    .filter(Boolean);

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      {/* Search & Actions Bar */}
      <div className="p-3 border-b border-pm-border flex flex-col space-y-2 shrink-0 bg-pm-bg-primary/10">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-pm-text-muted" />
            <input
              type="text"
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-pm-bg-primary border border-pm-border rounded-md pl-7 pr-3 py-1.5 text-xs text-pm-text-primary placeholder-pm-text-muted transition"
            />
          </div>
          <button
            onClick={() => setIsAddingCol(!isAddingCol)}
            className="bg-pm-bg-tertiary border border-pm-border hover:border-pm-orange hover:text-pm-orange rounded px-2 py-1.5 transition text-[11px] font-medium flex items-center space-x-1 cursor-pointer shrink-0 min-w-0"
            title="Create New Collection"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">New Col</span>
          </button>
        </div>

        {/* Add Collection Panel */}
        {isAddingCol && (
          <form onSubmit={handleCreateCollection} className="flex space-x-2 bg-pm-bg-primary/30 p-2 rounded border border-pm-border/60">
            <input
              type="text"
              placeholder="Collection name..."
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="flex-1 bg-pm-bg-primary border border-pm-border rounded px-2 py-1 text-xs"
              autoFocus
            />
            <button
              type="submit"
              className="bg-pm-orange hover:bg-pm-orange-hover text-white text-xs font-semibold rounded px-3 py-1 transition cursor-pointer"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* Accordion Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredCollections.map((col: any) => {
          const isExpanded = expanded[col.id];
          return (
            <div key={col.id} className="flex flex-col">
              {/* Collection Header */}
              <div
                onClick={() => toggleExpand(col.id)}
                className="group flex items-center justify-between px-3 py-2 hover:bg-pm-bg-tertiary/40 cursor-pointer transition select-none text-pm-text-primary"
              >
                <div className="flex items-center space-x-2 truncate min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-pm-text-secondary shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-pm-text-secondary shrink-0" />
                  )}
                  <Folder className="w-4 h-4 text-pm-orange shrink-0" />
                  <span className="font-medium truncate">{col.name}</span>
                </div>

                {/* Inline Action Buttons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 transition shrink-0">
                  <button
                    onClick={(e) => handleAddRequest(col.id, e)}
                    className="p-1 hover:bg-pm-bg-tertiary text-pm-text-muted hover:text-pm-get rounded transition cursor-pointer"
                    title="Add Request"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this collection and all nested requests?')) {
                        deleteColMutation.mutate(col.id);
                      }
                    }}
                    className="p-1 hover:bg-pm-bg-tertiary text-pm-text-muted hover:text-pm-delete rounded transition cursor-pointer"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Nested requests */}
              {isExpanded && (
                <div className="flex flex-col border-l border-pm-border ml-5 py-0.5">
                  {col.requests.map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => handleRequestClick(req)}
                      className="group flex items-center justify-between pl-4 pr-3 py-1.5 hover:bg-pm-bg-tertiary/30 cursor-pointer transition text-pm-text-secondary hover:text-pm-text-primary"
                    >
                      <div className="flex items-center space-x-2 truncate min-w-0">
                        <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded-sm font-mono shrink-0 w-[42px] text-center ${getMethodColorClass(req.method)}`}>
                          {req.method}
                        </span>
                        <span className="truncate">{req.name}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this request?')) {
                            deleteRequestMutation.mutate(req.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-pm-bg-tertiary rounded text-pm-text-muted hover:text-pm-delete transition cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {col.requests.length === 0 && (
                    <div className="pl-4 py-2 text-pm-text-muted italic text-[11px]">
                      Collection is empty
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCollections.length === 0 && (
          <div className="px-4 py-6 text-pm-text-muted italic text-center">
            No collections found
          </div>
        )}
      </div>
    </div>
  );
}
