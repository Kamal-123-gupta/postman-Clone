const BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = {
  async request(path: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP error! Status: ${res.status}`);
    }
    
    if (res.status === 204) return null;
    return res.json();
  },

  get(path: string) {
    return this.request(path, { method: 'GET' });
  },

  post(path: string, body?: any) {
    return this.request(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put(path: string, body?: any) {
    return this.request(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete(path: string) {
    return this.request(path, { method: 'DELETE' });
  },
};

// Typed Endpoint Actions
export const collectionsApi = {
  list: () => apiClient.get('/collections'),
  create: (name: string, description?: string, parent_id?: number) =>
    apiClient.post('/collections', { name, description, parent_id }),
  update: (id: number, data: { name?: string; description?: string }) =>
    apiClient.put(`/collections/${id}`, data),
  delete: (id: number) => apiClient.delete(`/collections/${id}`),
  
  createRequest: (payload: any) => apiClient.post('/collections/requests', payload),
  updateRequest: (id: number, payload: any) => apiClient.put(`/collections/requests/${id}`, payload),
  deleteRequest: (id: number) => apiClient.delete(`/collections/requests/${id}`),
};

export const environmentsApi = {
  list: () => apiClient.get('/environments'),
  create: (name: string) => apiClient.post('/environments', { name }),
  delete: (id: number) => apiClient.delete(`/environments/${id}`),
  
  listGlobals: () => apiClient.get('/environments/globals'),
  saveVariable: (key: string, value: string, environment_id?: number | null) =>
    apiClient.post('/environments/variables', { key, value, environment_id }),
  deleteVariable: (id: number) => apiClient.delete(`/environments/variables/${id}`),
};

export const historyApi = {
  list: () => apiClient.get('/history'),
  deleteItem: (id: number) => apiClient.delete(`/history/${id}`),
  clear: () => apiClient.delete('/history'),
};

export const tabsApi = {
  list: () => apiClient.get('/tabs'),
  sync: (tabs: any[]) => apiClient.put('/tabs/sync', tabs),
};

export const runnerApi = {
  send: (payload: any) => apiClient.post('/runner/send', payload),
};
