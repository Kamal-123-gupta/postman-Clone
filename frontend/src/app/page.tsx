'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const WorkspaceShell = dynamic(() => import('@/components/workspace/workspace-shell'), { ssr: false });

export default function Home() {
  const { addTab, tabs } = useWorkspaceStore();

  // Ensure at least one tab is open on startup
  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs, addTab]);

  return <WorkspaceShell />;
}
