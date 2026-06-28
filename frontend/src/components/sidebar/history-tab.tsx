'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '@/lib/api-client';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Trash2, Trash, Send, FileCode } from 'lucide-react';
import { getMethodColorClass } from './collections-tab';
import { toast } from 'sonner';

export default function HistoryTab() {
  const queryClient = useQueryClient();
  const { addTab, setActiveTabId } = useWorkspaceStore();

  // Fetch History
  const { data: history = [], refetch } = useQuery({
    queryKey: ['history'],
    queryFn: historyApi.list,
  });

  // Mutations
  const deleteItemMutation = useMutation({
    mutationFn: historyApi.deleteItem,
    onSuccess: () => {
      refetch();
      toast.success('History entry removed');
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: historyApi.clear,
    onSuccess: () => {
      refetch();
      toast.success('History cleared');
    },
  });

  const handleHistoryClick = (item: any) => {
    const tabId = addTab({
      name: item.name || 'Historical Request',
      method: item.method,
      url: item.url,
      headers: item.headers && item.headers.length ? item.headers : [{ key: '', value: '', enabled: true }],
      query_params: item.query_params && item.query_params.length ? item.query_params : [{ key: '', value: '', enabled: true }],
      body_type: item.body_type,
      body_content: item.body_content,
      auth_type: item.auth_type,
      auth_config: item.auth_config,
      is_dirty: false,
      response: {
        status: item.response_status,
        status_text: item.response_status === 200 ? 'OK' : 'Response Log',
        time_ms: item.response_time_ms,
        size_bytes: item.response_size_bytes,
        headers: item.response_headers || [],
        body: item.response_body || '',
      },
    });
    setActiveTabId(tabId);
  };

  const getStatusColorClass = (status: number) => {
    if (status >= 200 && status < 300) return 'text-pm-get bg-pm-get/10 border-pm-get/25';
    if (status >= 400) return 'text-pm-delete bg-pm-delete/10 border-pm-delete/25';
    return 'text-pm-text-secondary bg-pm-bg-tertiary border-pm-border';
  };

  // Helper to extract path from full URL
  const getUrlPath = (urlString: string) => {
    if (!urlString) return '/';
    try {
      // If it contains a variable expression like {{baseUrl}}, it won't parse in URL class, so handle manually
      const withoutProtocol = urlString.replace(/^https?:\/\//i, '');
      const slashIndex = withoutProtocol.indexOf('/');
      if (slashIndex === -1) return withoutProtocol;
      return withoutProtocol.substring(slashIndex);
    } catch {
      return urlString;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-xs">
      {/* Header bar with actions */}
      {history.length > 0 && (
        <div className="p-3 border-b border-pm-border flex justify-between items-center bg-pm-bg-primary/10 shrink-0">
          <span className="text-pm-text-secondary font-medium">Recent Requests</span>
          <button
            onClick={() => {
              if (confirm('Wipe all history logs?')) {
                clearHistoryMutation.mutate();
              }
            }}
            className="flex items-center space-x-1 text-pm-text-secondary hover:text-pm-delete hover:bg-pm-bg-tertiary px-2 py-1 rounded transition cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      )}

      {/* History Items Log */}
      <div className="flex-1 overflow-y-auto py-2">
        {history.map((item: any) => (
          <div
            key={item.id}
            onClick={() => handleHistoryClick(item)}
            className="group flex items-center justify-between px-3 py-2 border-b border-pm-border/30 hover:bg-pm-bg-tertiary/40 cursor-pointer transition text-pm-text-secondary hover:text-pm-text-primary"
          >
            <div className="flex-1 min-w-0 mr-2">
              {/* Method and status badge */}
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded-sm font-mono shrink-0 w-[42px] text-center ${getMethodColorClass(item.method)}`}>
                  {item.method}
                </span>

                {item.response_status > 0 ? (
                  <span className={`text-[9px] font-bold px-1 border rounded-sm ${getStatusColorClass(item.response_status)}`}>
                    {item.response_status}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1 border border-pm-border text-pm-text-muted rounded-sm bg-pm-bg-tertiary">
                    ERR
                  </span>
                )}

                <span className="text-[10px] text-pm-text-muted truncate">
                  {item.response_time_ms} ms
                </span>
              </div>

              {/* URL String */}
              <div className="font-mono text-[11px] truncate text-pm-text-primary" title={item.url}>
                {getUrlPath(item.url)}
              </div>
            </div>

            {/* Delete Single Log Entry */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItemMutation.mutate(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pm-bg-tertiary text-pm-text-muted hover:text-pm-delete rounded transition cursor-pointer shrink-0"
              title="Remove entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {history.length === 0 && (
          <div className="px-4 py-8 text-pm-text-muted italic text-center">
            No request history log yet
          </div>
        )}
      </div>
    </div>
  );
}
