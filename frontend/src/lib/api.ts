// Get the API URL based on environment
// - If NEXT_PUBLIC_API_URL is set, use it
// - If running on the server side, construct URL from the request host
// - Otherwise, use empty string for relative URLs (client-side via rewrites)
function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Server-side: try to get from headers
  if (typeof window === 'undefined') {
    // During SSR, we need to use relative URLs as we don't have access to headers here
    // The actual host resolution happens in middleware/rewrites
    return '';
  }

  // Client-side: use relative URLs (proxied via rewrites)
  return '';
}

const API_URL = getApiUrl();

// Global access token storage (set by AuthContext)
let globalAccessToken: string | null = null;
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

export function setGlobalAccessToken(token: string | null) {
  globalAccessToken = token;
}

export function setTokenRefreshCallback(callback: (() => Promise<string | null>) | null) {
  tokenRefreshCallback = callback;
}

// Authenticated fetch wrapper with automatic token refresh on 401
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Add Authorization header if we have an access token
  if (globalAccessToken) {
    headers.set('Authorization', `Bearer ${globalAccessToken}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get 401 and have a refresh callback, try to refresh token and retry once
  if (response.status === 401 && tokenRefreshCallback) {
    try {
      const newToken = await tokenRefreshCallback();
      if (newToken) {
        // Update the Authorization header with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    } catch (error) {
      console.error('Token refresh failed during API call:', error);
      // Return the original 401 response
    }
  }

  return response;
}

export interface JobAssignment {
  id: number;
  jobId: number;
  userId: number;
  user?: User | null;
  recurrence?: string;
  recurrenceStartDate?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceIndefinite?: boolean;
  displayOrder: number;
  isCompleted?: boolean;
  completedAt?: string | null;
}

export interface Job {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string | null;
  createdAt: string;
  recurrence?: string;
  recurrenceStartDate?: string | null;
  recurrenceEndDate?: string | null;
  recurrenceIndefinite?: boolean;
  useSharedRecurrence?: boolean;
  assignments?: JobAssignment[];
  occurrenceDate?: string | null;
}

export interface User {
  id: number;
  displayName: string;
  colorHex: string;
  hideCompletedInKiosk?: boolean;
  avatarUrl?: string | null;
  displayOrder?: number;
  email?: string | null;
  isAdmin?: boolean;
}

// Calendar types
export interface CalendarSource {
  id: number;
  name: string;
  icalUrl: string;
  colorHex: string;
  enabled: boolean;
  displayOrder: number;
}

export interface SiteSettings {
  id: number;
  defaultView: 'Day' | 'Week' | 'Month';
  completionMode?: 'Today' | 'VisibleRange';
  jobsRefreshSeconds?: number; // default 10
  calendarRefreshSeconds?: number; // default 30
  weatherRefreshSeconds?: number; // default 1800
  weatherApiKey?: string;
  weatherLocation?: string;
}

export interface CalendarEventItem {
  sourceId: number;
  sourceName: string;
  colorHex: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

export interface KioskToken {
  id: number;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export interface KioskTokenResponse {
  id: number;
  token: string;
  name: string;
  createdAt: string;
}

export const jobApi = {
  async getAll(): Promise<Job[]> {
    const response = await authFetch(`${API_URL}/api/jobs`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  async getByDate(date: string): Promise<Job[]> {
    const response = await authFetch(`${API_URL}/api/jobs?date=${date}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },

  async getById(id: number): Promise<Job> {
    const response = await authFetch(`${API_URL}/api/jobs/${id}`);
    if (!response.ok) throw new Error('Failed to fetch job');
    return response.json();
  },

  async create(job: Omit<Job, 'id' | 'createdAt'>): Promise<Job> {
    const response = await authFetch(`${API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    if (!response.ok) throw new Error('Failed to create job');
    return response.json();
  },

  async update(id: number, job: Job): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    if (!response.ok) throw new Error('Failed to update job');
  },

  async delete(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete job');
  },

  async uploadImage(id: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await authFetch(`${API_URL}/api/jobs/${id}/image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.imageUrl as string;
  },

  async deleteImage(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${id}/image`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete image');
  },
};

export const jobAssignmentApi = {
  async getAll(jobId: number): Promise<JobAssignment[]> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments`);
    if (!response.ok) throw new Error('Failed to fetch assignments');
    return response.json();
  },

  async getById(jobId: number, id: number): Promise<JobAssignment> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch assignment');
    return response.json();
  },

  async create(jobId: number, assignment: Omit<JobAssignment, 'id' | 'jobId'>): Promise<JobAssignment> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...assignment, jobId }),
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
  },

  async update(jobId: number, id: number, assignment: JobAssignment): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error('Failed to update assignment');
  },

  async delete(jobId: number, id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete assignment');
  },

  async updateOrder(jobId: number, assignmentIds: number[]): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentIds),
    });
    if (!response.ok) throw new Error('Failed to update assignment order');
  },

  async complete(jobId: number, id: number, date: string): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/${id}/complete?date=${date}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to complete assignment');
  },

  async uncomplete(jobId: number, id: number, date: string): Promise<void> {
    const response = await authFetch(`${API_URL}/api/jobs/${jobId}/assignments/${id}/complete?date=${date}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to uncomplete assignment');
  },
};

export const calendarsApi = {
  async getAll(): Promise<CalendarSource[]> {
    const res = await authFetch(`${API_URL}/api/calendars`);
    if (!res.ok) throw new Error('Failed to fetch calendars');
    return res.json();
  },
  async create(item: Omit<CalendarSource, 'id' | 'displayOrder'>): Promise<CalendarSource> {
    const res = await authFetch(`${API_URL}/api/calendars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create calendar');
    return res.json();
  },
  async update(id: number, item: CalendarSource): Promise<void> {
    const res = await authFetch(`${API_URL}/api/calendars/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update calendar');
  },
  async delete(id: number): Promise<void> {
    const res = await authFetch(`${API_URL}/api/calendars/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete calendar');
  },
  async updateOrder(order: number[]): Promise<void> {
    const res = await authFetch(`${API_URL}/api/calendars/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('Failed to update calendars order');
  },
};

export const siteSettingsApi = {
  async get(): Promise<SiteSettings> {
    const res = await authFetch(`${API_URL}/api/sitesettings`);
    if (!res.ok) throw new Error('Failed to fetch site settings');
    return res.json();
  },
  async update(settings: SiteSettings): Promise<void> {
    const res = await authFetch(`${API_URL}/api/sitesettings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update site settings');
  },
};

export const calendarEventsApi = {
  async get(start: string, end: string, includeIds?: number[]): Promise<CalendarEventItem[]> {
    const params = new URLSearchParams({ start, end });
    if (includeIds && includeIds.length > 0) params.set('include', includeIds.join(','));
    const res = await authFetch(`${API_URL}/api/calendar/events?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch calendar events');
    return res.json();
  },
};

export const userApi = {
  async getAll(): Promise<User[]> {
    const response = await authFetch(`${API_URL}/api/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },
  async create(user: Omit<User, 'id'>): Promise<User> {
    const response = await authFetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
  async update(id: number, user: User): Promise<void> {
    const response = await authFetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to update user');
  },
  async delete(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete user');
  },
  async updateOrder(order: number[]): Promise<void> {
    const response = await authFetch(`${API_URL}/api/users/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to update user order');
  },
  async toggleHideCompleted(id: number): Promise<{ hideCompletedInKiosk: boolean }> {
    const response = await authFetch(`${API_URL}/api/users/${id}/hide-completed`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to toggle hide completed');
    return response.json();
  },
  async uploadAvatar(id: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await authFetch(`${API_URL}/api/users/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload avatar');
    const data = await response.json();
    return data.avatarUrl as string;
  },
  async deleteAvatar(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/users/${id}/avatar`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete avatar');
  },
};

// Shopping types
export interface ShoppingItem {
  id: number;
  shoppingListId: number;
  name: string;
  isBought: boolean;
  isImportant: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ShoppingList {
  id: number;
  name: string;
  colorHex: string;
  avatarUrl?: string | null;
  displayOrder: number;
  items: ShoppingItem[];
}

export const shoppingListApi = {
  async getAll(): Promise<ShoppingList[]> {
    const response = await authFetch(`${API_URL}/api/shoppinglists`);
    if (!response.ok) throw new Error('Failed to fetch shopping lists');
    return response.json();
  },
  async getById(id: number): Promise<ShoppingList> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${id}`);
    if (!response.ok) throw new Error('Failed to fetch shopping list');
    return response.json();
  },
  async create(list: Omit<ShoppingList, 'id' | 'items'>): Promise<ShoppingList> {
    const response = await authFetch(`${API_URL}/api/shoppinglists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    if (!response.ok) throw new Error('Failed to create shopping list');
    return response.json();
  },
  async update(id: number, list: ShoppingList): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    if (!response.ok) throw new Error('Failed to update shopping list');
  },
  async delete(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete shopping list');
  },
  async updateOrder(order: number[]): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to update shopping list order');
  },
  async uploadAvatar(id: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await authFetch(`${API_URL}/api/shoppinglists/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload avatar');
    const data = await response.json();
    return data.avatarUrl as string;
  },
  async deleteAvatar(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${id}/avatar`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete avatar');
  },
};

export const kioskTokenApi = {
  async getAll(): Promise<KioskToken[]> {
    const response = await authFetch(`${API_URL}/api/auth/kiosk/tokens`);
    if (!response.ok) throw new Error('Failed to fetch kiosk tokens');
    return response.json();
  },
  async create(name: string): Promise<KioskTokenResponse> {
    const response = await authFetch(`${API_URL}/api/auth/kiosk/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to create kiosk token');
    return response.json();
  },
  async revoke(id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/auth/kiosk/tokens/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to revoke kiosk token');
  },
};

export const shoppingItemApi = {
  async getAll(listId: number): Promise<ShoppingItem[]> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items`);
    if (!response.ok) throw new Error('Failed to fetch shopping items');
    return response.json();
  },
  async create(listId: number, item: Omit<ShoppingItem, 'id' | 'shoppingListId' | 'createdAt'>): Promise<ShoppingItem> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create shopping item');
    return response.json();
  },
  async update(listId: number, id: number, item: ShoppingItem): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update shopping item');
  },
  async delete(listId: number, id: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete shopping item');
  },
  async toggleBought(listId: number, id: number): Promise<ShoppingItem> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/${id}/toggle`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle item');
    return response.json();
  },
  async toggleImportant(listId: number, id: number): Promise<ShoppingItem> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/${id}/important`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle important');
    return response.json();
  },
  async updateOrder(listId: number, order: number[]): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to update item order');
  },
  async clearBought(listId: number): Promise<void> {
    const response = await authFetch(`${API_URL}/api/shoppinglists/${listId}/items/bought`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to clear bought items');
  },
};


// Performance types
export interface EndpointMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  avgRequestTimeMs: number;
  p50RequestTimeMs: number;
  p95RequestTimeMs: number;
  p99RequestTimeMs: number;
  avgDependencyTimeMs: number;
  errorRate: number;
  throughputPerMinute: number;
  avgQueryCount: number;
}

export interface PerformanceMetricsResponse {
  endpoints: EndpointMetrics[];
  startTime: string;
  endTime: string;
  totalRequests: number;
}

export interface PerformanceMetricsParams {
  startTime?: string;
  endTime?: string;
  endpoint?: string;
  method?: string;
  statusCodeMin?: number;
  statusCodeMax?: number;
}

export const performanceApi = {
  async getMetrics(params?: PerformanceMetricsParams): Promise<PerformanceMetricsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.startTime) queryParams.append('startTime', params.startTime);
    if (params?.endTime) queryParams.append('endTime', params.endTime);
    if (params?.endpoint) queryParams.append('endpoint', params.endpoint);
    if (params?.method) queryParams.append('method', params.method);
    if (params?.statusCodeMin !== undefined) queryParams.append('statusCodeMin', params.statusCodeMin.toString());
    if (params?.statusCodeMax !== undefined) queryParams.append('statusCodeMax', params.statusCodeMax.toString());

    const url = `${API_URL}/api/perf/data${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await authFetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch performance metrics: ${response.status} ${errorText}`);
    }

    return response.json();
  },
};

