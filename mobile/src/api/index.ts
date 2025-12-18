// API service layer matching frontend endpoints
import { apiClient } from './client';
import {
  Job,
  User,
  CalendarSource,
  CalendarEventItem,
  SiteSettings,
  ShoppingList,
  ShoppingItem,
} from '../types';

// Jobs API
export const jobsApi = {
  async getByDate(date: string): Promise<Job[]> {
    const response = await apiClient.get<Job[]>(`/api/jobs?date=${date}`);
    return response.data;
  },
};

// Job Assignments API
export const jobAssignmentsApi = {
  async complete(jobId: number, assignmentId: number, date: string): Promise<void> {
    await apiClient.post(`/api/jobs/${jobId}/assignments/${assignmentId}/complete?date=${date}`);
  },

  async uncomplete(jobId: number, assignmentId: number, date: string): Promise<void> {
    await apiClient.delete(`/api/jobs/${jobId}/assignments/${assignmentId}/complete?date=${date}`);
  },
};

// Users API
export const usersApi = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  },

  async toggleHideCompleted(userId: number): Promise<{ hideCompletedInKiosk: boolean }> {
    const response = await apiClient.patch<{ hideCompletedInKiosk: boolean }>(
      `/api/users/${userId}/hide-completed`
    );
    return response.data;
  },
};

// Calendars API
export const calendarsApi = {
  async getAll(): Promise<CalendarSource[]> {
    const response = await apiClient.get<CalendarSource[]>('/api/calendars');
    return response.data;
  },
};

// Calendar Events API
export const calendarEventsApi = {
  async get(start: string, end: string, includeIds?: number[]): Promise<CalendarEventItem[]> {
    const params = new URLSearchParams({ start, end });
    if (includeIds && includeIds.length > 0) {
      params.set('include', includeIds.join(','));
    }
    const response = await apiClient.get<CalendarEventItem[]>(
      `/api/calendar/events?${params.toString()}`
    );
    return response.data;
  },
};

// Site Settings API
export const siteSettingsApi = {
  async get(): Promise<SiteSettings> {
    const response = await apiClient.get<SiteSettings>('/api/sitesettings');
    return response.data;
  },
};

// Shopping Lists API
export const shoppingListsApi = {
  async getAll(): Promise<ShoppingList[]> {
    const response = await apiClient.get<ShoppingList[]>('/api/shoppinglists');
    return response.data;
  },
};

// Shopping Items API
export const shoppingItemsApi = {
  async create(
    listId: number,
    item: { name: string; isBought: boolean; isImportant: boolean; displayOrder: number }
  ): Promise<ShoppingItem> {
    const response = await apiClient.post<ShoppingItem>(
      `/api/shoppinglists/${listId}/items`,
      item
    );
    return response.data;
  },

  async toggleBought(listId: number, itemId: number): Promise<ShoppingItem> {
    const response = await apiClient.post<ShoppingItem>(
      `/api/shoppinglists/${listId}/items/${itemId}/toggle`
    );
    return response.data;
  },

  async toggleImportant(listId: number, itemId: number): Promise<ShoppingItem> {
    const response = await apiClient.post<ShoppingItem>(
      `/api/shoppinglists/${listId}/items/${itemId}/important`
    );
    return response.data;
  },

  async delete(listId: number, itemId: number): Promise<void> {
    await apiClient.delete(`/api/shoppinglists/${listId}/items/${itemId}`);
  },

  async clearBought(listId: number): Promise<void> {
    await apiClient.delete(`/api/shoppinglists/${listId}/items/bought`);
  },
};
