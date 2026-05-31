import { useState, useEffect } from 'react'
import { notificationStore, type AppNotification } from '@/store/notificationStore'
import { useRole } from '@/context/RoleContext'

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
