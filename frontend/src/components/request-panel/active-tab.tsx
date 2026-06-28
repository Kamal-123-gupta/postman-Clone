'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { runnerApi, collectionsApi } from '@/lib/api-client';
import { Play, Save, Code, Zap, FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, PanelImperativeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';

// Child components (we will write these next)
import ParamsEditor from '../request-editors/params-editor';
import AuthEditor from '../request-editors/auth-editor';
import HeadersEditor from '../request-editors/headers-editor';
import BodyEditor from '../request-editors/body-editor';
import ResponseViewer from '../response-panel/response-viewer';
import SaveModal from './save-modal';

type EditorSection = 'params' | 'auth' | 'headers' | 'body';

export default function ActiveTabContent() {
  const queryClient = useQueryClient();
  const { tabs, activeTabId, updateTab, selectedEnvironmentId } = useWorkspaceStore();
  const [activeSection, setActiveSection] = useState<EditorSection>('params');
  const [isSending, setIsSending] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const editorsRef = useRef<PanelImperativeHandle>(null);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  const toggleEditor = () => {
    const editors = editorsRef.current;
    if (editors) {
      if (editors.isCollapsed()) {
        editors.expand();
        setIsEditorCollapsed(false);
      } else {
        editors.collapse();
        setIsEditorCollapsed(true);
      }
    }
  };

  const tab = tabs.find((t) => t.id === activeTabId);

  // Send request mutation
  const sendRequestMutation = useMutation({
    mutationFn: runnerApi.send,
    onSuccess: (data) => {
      if (tab) {
        updateTab(tab.id, { response: data });
        // Trigger history tab refresh
        queryClient.invalidateQueries({ queryKey: ['history'] });
        toast.success('Response received');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Network error occurred');
    },
    onSettled: () => setIsSending(false),
  });

  // Update existing request mutation
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      collectionsApi.updateRequest(id, payload),
    onSuccess: () => {
      if (tab) {
        updateTab(tab.id, { is_dirty: false });
        queryClient.invalidateQueries({ queryKey: ['collections'] });
        toast.success('Request changes saved');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save request changes'),
  });

  if (!tab) {
    // Empty state welcome screen
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-pm-bg-primary text-center p-6 select-none animate-fade-in">
        <div className="w-16 h-16 bg-pm-bg-secondary border border-pm-border rounded-2xl flex items-center justify-center text-pm-orange mb-4 shadow-xl">
          <Zap className="w-8 h-8 fill-current" />
        </div>
        <h2 className="font-semibold text-base text-pm-text-primary">
          Welcome to Postman Client Clone
        </h2>
        <p className="text-xs text-pm-text-secondary mt-1 max-w-[280px] leading-relaxed">
          Create a new tab or click on a request in the sidebar to build and send HTTP requests.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    setIsSending(true);
    sendRequestMutation.mutate({
      name: tab.name,
      url: tab.url,
      method: tab.method,
      headers: tab.headers,
      query_params: tab.query_params,
      body_type: tab.body_type,
      body_content: tab.body_content,
      auth_type: tab.auth_type,
      auth_config: tab.auth_config,
      environment_id: selectedEnvironmentId,
    });
  };

  const handleSave = () => {
    if (tab.request_id) {
      // Save changes to already existing request
      updateRequestMutation.mutate({
        id: tab.request_id,
        payload: {
          name: tab.name,
          method: tab.method,
          url: tab.url,
          headers: tab.headers,
          query_params: tab.query_params,
          body_type: tab.body_type,
          body_content: tab.body_content,
          auth_type: tab.auth_type,
          auth_config: tab.auth_config,
        },
      });
    } else {
      // Open save modal to ask for collection & name
      setIsSaveModalOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Address Bar */}
      <div className="p-3.5 bg-pm-bg-primary border-b border-pm-border flex items-center space-x-3 shrink-0 select-none">
        {/* Method selector */}
        <select
          value={tab.method}
          onChange={(e) => updateTab(tab.id, { method: e.target.value })}
          className="bg-pm-bg-secondary border border-pm-border rounded px-3 py-1.5 text-xs text-pm-orange font-bold hover:bg-pm-bg-tertiary transition cursor-pointer"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="OPTIONS">OPTIONS</option>
          <option value="HEAD">HEAD</option>
        </select>

        {/* URL Input */}
        <input
          type="text"
          placeholder="Enter request URL (e.g. {{baseUrl}}/posts)"
          value={tab.url}
          onChange={(e) => {
            // Keep URL and query parameters synchronized
            const newUrl = e.target.value;
            useWorkspaceStore.getState().syncUrlToParams(tab.id, newUrl);
          }}
          className="flex-1 bg-pm-bg-secondary border border-pm-border rounded px-3.5 py-1.5 text-xs text-pm-text-primary placeholder-pm-text-muted font-mono transition"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isSending}
          className={`bg-pm-orange hover:bg-pm-orange-hover disabled:bg-pm-text-muted text-white text-xs font-semibold px-4 py-1.5 rounded transition flex items-center space-x-1.5 cursor-pointer shadow-md select-none shrink-0`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSending ? 'Sending...' : 'Send'}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="bg-pm-bg-secondary hover:bg-pm-bg-tertiary border border-pm-border text-pm-text-primary text-xs font-semibold px-4 py-1.5 rounded transition flex items-center space-x-1.5 cursor-pointer select-none shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        {/* Toggle Editor Collapse Button */}
        <button
          onClick={toggleEditor}
          className="bg-pm-bg-secondary hover:bg-pm-bg-tertiary border border-pm-border text-pm-text-primary text-xs font-semibold px-3 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer select-none shrink-0"
          title={isEditorCollapsed ? "Expand Request Editor" : "Collapse Request Editor"}
        >
          {isEditorCollapsed ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Expand Panel</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Minimize Panel</span>
            </>
          )}
        </button>
      </div>

      {/* Split panel between editors and responses */}
      <div className="flex-1 overflow-hidden relative w-full">
        <PanelGroup orientation="vertical">
          {/* Editors tab panel */}
          <Panel
            panelRef={editorsRef}
            collapsible={true}
            onResize={() => {
              const editors = editorsRef.current;
              if (editors) {
                const collapsed = editors.isCollapsed();
                if (collapsed !== isEditorCollapsed) {
                  setIsEditorCollapsed(collapsed);
                }
              }
            }}
            defaultSize={10}
            minSize={10}
            className="flex flex-col h-full bg-pm-bg-primary overflow-hidden"
          >
            {/* Headers switcher */}
            <div className="flex border-b border-pm-border text-[11px] font-semibold bg-pm-bg-primary/20 px-3.5 shrink-0 select-none">
              {(['params', 'auth', 'headers', 'body'] as EditorSection[]).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`py-2 px-3 border-b-2 transition cursor-pointer capitalize ${
                    activeSection === section
                      ? 'border-pm-orange text-pm-orange font-bold'
                      : 'border-transparent text-pm-text-secondary hover:text-pm-text-primary'
                  }`}
                >
                  {section === 'params' ? 'Params' : section === 'auth' ? 'Authorization' : section}
                </button>
              ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto p-4 bg-pm-bg-primary">
              {activeSection === 'params' && <ParamsEditor tab={tab} />}
              {activeSection === 'auth' && <AuthEditor tab={tab} />}
              {activeSection === 'headers' && <HeadersEditor tab={tab} />}
              {activeSection === 'body' && <BodyEditor tab={tab} />}
            </div>
          </Panel>

          {/* Panel Resize Handler */}
          <PanelResizeHandle className="h-2 hover:h-3 bg-transparent relative flex items-center justify-center transition-all cursor-row-resize duration-150 shrink-0 group">
            <div className="h-[1px] w-full bg-pm-border group-hover:bg-pm-orange transition-colors" />
          </PanelResizeHandle>

          {/* Response Viewer */}
          <Panel collapsible={true} defaultSize={90} minSize={10} className="flex flex-col h-full bg-pm-bg-primary overflow-hidden">
            <ResponseViewer tab={tab} isSending={isSending} />
          </Panel>
        </PanelGroup>
      </div>

      {isSaveModalOpen && (
        <SaveModal
          tab={tab}
          onClose={() => setIsSaveModalOpen(false)}
          onSuccess={(savedReq) => {
            updateTab(tab.id, {
              request_id: savedReq.id,
              name: savedReq.name,
              is_dirty: false,
            });
            setIsSaveModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['collections'] });
          }}
        />
      )}
    </div>
  );
}
