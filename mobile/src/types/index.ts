// Shared TypeScript types for the mobile app

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

export interface CalendarSource {
  id: number;
  name: string;
  icalUrl: string;
  colorHex: string;
  enabled: boolean;
  displayOrder: number;
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

export interface SiteSettings {
  id: number;
  defaultView: 'Day' | 'Week' | 'Month';
  completionMode?: 'Today' | 'VisibleRange';
  jobsRefreshSeconds?: number;
  calendarRefreshSeconds?: number;
  weatherRefreshSeconds?: number;
  weatherApiKey?: string;
  weatherLocation?: string;
}

export interface ShoppingList {
  id: number;
  name: string;
  colorHex: string;
  avatarUrl?: string | null;
  displayOrder: number;
  items: ShoppingItem[];
}

export interface ShoppingItem {
  id: number;
  shoppingListId: number;
  name: string;
  isBought: boolean;
  isImportant: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  role: 'admin' | 'kiosk';
  user?: {
    id: number;
    email: string;
    displayName: string;
  };
}
