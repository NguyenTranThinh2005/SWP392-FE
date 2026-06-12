import { fetchAPI } from "./api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  listNotifications: async (): Promise<any> => {
    return fetchAPI<any>("/api/notifications/my");
  },
  
  markAsRead: async (id: string): Promise<any> => {
    return fetchAPI<any>(`/api/notifications/${id}/read`, {
      method: 'PUT'
    });
  }
};
