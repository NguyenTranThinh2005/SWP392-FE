import { fetchAPI } from './api'

export interface ServerNotification {
  userNotificationId: string
  notificationId: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export const notificationService = {
  // Lay danh sach thong bao cua user hien tai (BE loc theo token)
  async getMyNotifications(): Promise<ServerNotification[]> {
    try {
      const res = await fetchAPI<any>('/api/notifications/my')
      const list = res?.data ?? res
      return Array.isArray(list) ? list : []
    } catch (err) {
      console.warn('Khong tai duoc thong bao:', err)
      return []
    }
  },

  // Danh dau 1 thong bao da doc
  async markAsRead(userNotificationId: string): Promise<boolean> {
    try {
      await fetchAPI(`/api/notifications/${userNotificationId}/read`, { method: 'PUT' })
      return true
    } catch (err) {
      console.warn('Khong danh dau duoc da doc:', err)
      return false
    }
  },
}
