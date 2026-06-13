import { fetchAPI } from "./api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'N01',
    title: 'New Manuscript Submitted',
    message: 'Chainsaw Man Chapter 9 has been submitted for review.',
    read: false,
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'N02',
    title: 'Revision Completed',
    message: 'Spy x Family Chapter 22 revision has been approved.',
    read: true,
    createdAt: '2026-05-30T10:00:00Z',
  }
];

export const notificationService = {
  listNotifications: async () => {
    try {
      return await fetchAPI<Notification[]>("/api/notifications");
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },
  markAsRead: async (id: string) => {
    try {
      return await fetchAPI<any>(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      return { success: true };
    }
  }
};
