import { create } from 'zustand';

export interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface Tab {
  id: string;
  request_id?: number;
  name: string;
  method: string;
  url: string;
  headers: KeyValueItem[];
  query_params: KeyValueItem[];
  body_type: string;
  body_content?: string;
  auth_type: string;
  auth_config?: Record<string, any>;
  is_dirty: boolean;
  response?: {
    status: number;
    status_text: string;
    time_ms: number;
    size_bytes: number;
    headers: KeyValueItem[];
    body: string;
    error?: string;
  } | null;
}

interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string | null;
  selectedEnvironmentId: number | null;
  sidebarCollapsed: boolean;
  addTab: (tab?: Partial<Tab>) => string;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string | null) => void;
  updateActiveTab: (fields: Partial<Tab>) => void;
  updateTab: (tabId: string, fields: Partial<Tab>) => void;
  setSelectedEnvironmentId: (envId: number | null) => void;
  syncUrlToParams: (tabId: string, url: string) => void;
  syncParamsToUrl: (tabId: string, params: KeyValueItem[]) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const createDefaultTab = (id: string): Tab => ({
  id,
  name: 'Untitled Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  query_params: [{ key: '', value: '', enabled: true }],
  body_type: 'none',
  body_content: '',
  auth_type: 'none',
  auth_config: {},
  is_dirty: false,
  response: null,
});

export const parseUrlQueryParams = (urlString: string): KeyValueItem[] => {
  if (!urlString) return [{ key: '', value: '', enabled: true }];
  const qIndex = urlString.indexOf('?');
  if (qIndex === -1) return [{ key: '', value: '', enabled: true }];
  const queryString = urlString.substring(qIndex + 1);
  if (!queryString) return [{ key: '', value: '', enabled: true }];

  const params: KeyValueItem[] = [];
  const parts = queryString.split('&');
  for (const part of parts) {
    if (!part) continue;
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) {
      params.push({ key: part, value: '', enabled: true });
    } else {
      const key = part.substring(0, eqIndex);
      const value = part.substring(eqIndex + 1);
      params.push({
        key: decodeURIComponent(key),
        value: decodeURIComponent(value),
        enabled: true,
      });
    }
  }
  // Always append an empty row at the bottom for clean user edits
  params.push({ key: '', value: '', enabled: true });
  return params;
};

export const buildUrlWithParams = (urlString: string, params: KeyValueItem[]): string => {
  if (!urlString) return '';
  const qIndex = urlString.indexOf('?');
  const baseUrl = qIndex === -1 ? urlString : urlString.substring(0, qIndex);

  const activeParams = params.filter((p) => p.enabled && p.key);
  if (activeParams.length === 0) return baseUrl;

  const queryString = activeParams
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  selectedEnvironmentId: null,
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addTab: (tabData) => {
    const id = `tab_${Date.now()}`;
    const newTab = {
      ...createDefaultTab(id),
      ...tabData,
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }));
    return id;
  },

  closeTab: (tabId) => {
    set((state) => {
      const filteredTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;

      if (state.activeTabId === tabId) {
        if (filteredTabs.length > 0) {
          // Set active tab to the one next to the closed tab
          const closedIndex = state.tabs.findIndex((t) => t.id === tabId);
          const nextActiveIndex = Math.min(closedIndex, filteredTabs.length - 1);
          newActiveId = filteredTabs[nextActiveIndex].id;
        } else {
          newActiveId = null;
        }
      }

      return {
        tabs: filteredTabs,
        activeTabId: newActiveId,
      };
    });
  },

  setActiveTabId: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateActiveTab: (fields) => {
    const { activeTabId } = get();
    if (!activeTabId) return;
    get().updateTab(activeTabId, fields);
  },

  updateTab: (tabId, fields) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...fields, is_dirty: true } : t)),
    }));
  },

  setSelectedEnvironmentId: (envId) => {
    set({ selectedEnvironmentId: envId });
  },

  syncUrlToParams: (tabId, url) => {
    set((state) => {
      const tab = state.tabs.find((t) => t.id === tabId);
      if (!tab) return {};

      const query_params = parseUrlQueryParams(url);
      return {
        tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, url, query_params, is_dirty: true } : t)),
      };
    });
  },

  syncParamsToUrl: (tabId, params) => {
    set((state) => {
      const tab = state.tabs.find((t) => t.id === tabId);
      if (!tab) return {};

      const url = buildUrlWithParams(tab.url, params);
      return {
        tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, url, query_params: params, is_dirty: true } : t)),
      };
    });
  },
}));
