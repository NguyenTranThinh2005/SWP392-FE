import { useState, useEffect } from 'react'
import { notificationStore, type AppNotification } from '@/store/notificationStore'
import { useRole } from '@/context/RoleContext'
import { startConnection, type RealtimeNotification } from '@/services/signalrService'

export const useNotifications = () => {
  const { role } = useRole()
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    const unsubscribe = notificationStore.subscribe((allNotifications) => {
      const filtered = allNotifications.filter(
        (n) => n.role === role || n.role === 'All'
      )
      setNotifications(filtered)
    })
    return () => unsubscribe()
  }, [role])

  // Ket noi SignalR nhan notification realtime tu BE
  useEffect(() => {
    startConnection((data: RealtimeNotification) => {
      // chuyen type BE (string) -> type cua store
      const t = data.type?.toLowerCase()
      const mappedType: AppNotification['type'] =
        t === 'success' ? 'success' : t === 'warning' ? 'warning' : t === 'error' ? 'error' : 'info'
      // BE da gui dung nguoi/role roi -> hien cho user hien tai
      notificationStore.addNotification(data.title, data.message, 'All', mappedType)
    })
    // KHONG stopConnection trong cleanup -> tranh StrictMode ngat ket noi vua mo.
    // Ket noi song suot phien, chi ngat khi logout (goi stopConnection o nut logout neu can).
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    addNotification: (
      title: string,
      message: string,
      targetRole: AppNotification['role'],
      type: AppNotification['type'] = 'info'
    ) => {
      return notificationStore.addNotification(title, message, targetRole, type)
    },
    markRead: (id: string) => {
      notificationStore.markRead(id)
    },
    markAllRead: () => {
      notificationStore.markAllRead(role)
    },
    clearAll: () => {
      notificationStore.clearAll(role)
    }
  }
}
