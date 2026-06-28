'use client';

import React, { useRef, useEffect } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, PanelImperativeHandle } from 'react-resizable-panels';
import SidebarTabs from '../sidebar/sidebar-tabs';
import TopNavbar from './top-navbar';
import TabBar from '../request-panel/tab-bar';
import ActiveTabContent from '../request-panel/active-tab';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export default function WorkspaceShell() {
  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const sidebarRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      if (sidebarCollapsed && !sidebar.isCollapsed()) {
        sidebar.collapse();
      } else if (!sidebarCollapsed && sidebar.isCollapsed()) {
        sidebar.resize(22); // Explicitly resize to 22% to avoid getting stuck at 0 width
      }
    }
  }, [sidebarCollapsed]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-pm-bg-primary">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Resizable Sidebar and Main Workspace split */}
      <div className="flex-1 overflow-hidden relative w-full">
        <PanelGroup orientation="horizontal">
          {/* Left panel: Collections / History Sidebar */}
          <Panel
            panelRef={sidebarRef}
            collapsible={true}
            onResize={() => {
              const sidebar = sidebarRef.current;
              if (sidebar) {
                const isCollapsed = sidebar.isCollapsed();
                if (isCollapsed !== useWorkspaceStore.getState().sidebarCollapsed) {
                  useWorkspaceStore.getState().setSidebarCollapsed(isCollapsed);
                }
              }
            }}
            defaultSize={22}
            minSize={15}
            maxSize={100}
            className="flex flex-col h-full bg-pm-bg-secondary overflow-hidden"
          >
            <SidebarTabs />
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 hover:w-3 bg-transparent relative flex items-center justify-center transition-all cursor-col-resize duration-150 shrink-0 group">
            <div className="w-[1px] h-full bg-pm-border group-hover:bg-pm-orange transition-colors" />
          </PanelResizeHandle>

          {/* Right panel: Tab Bar and active workspace */}
          <Panel defaultSize={78} minSize={0} className="flex flex-col h-full bg-pm-bg-primary overflow-hidden">
            <TabBar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <ActiveTabContent />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
