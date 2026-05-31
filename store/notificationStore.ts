import { toast } from "sonner"

export interface AppNotification {
  id: string
  title: string
  message: string
  role: 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief' | 'All'
  read: boolean
  createdAt: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const STORAGE_KEY = 'mangaflow_notifications'

// Seed mock notifications
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Proposal Approved',
    message: 'Your proposal "Whispers of the Deep" has been approved and activated! Tantou Editor Nakamura Takeshi is confirmed.',
    role: 'Mangaka',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    type: 'success',
  },
  {
    id: 'n2',
    title: 'New Proposal Submitted',
    message: 'Mangaka Tanaka Yuki has submitted a new proposal "Sakura Knights" for review.',
    role: 'Editorial Board',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    type: 'info',
  },
  {
    id: 'n3',
    title: 'New Proposal Submitted',
    message: 'Mangaka Tanaka Yuki has submitted a new proposal "Sakura Knights" for review.',
    role: 'Editor-in-Chief',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    type: 'info',
  },
  {
    id: 'n4',
    title: 'Manuscript Draft Uploaded',
    message: 'Mangaka Oda Kenji uploaded a new manuscript draft for "Spy x Family: Secret Mission".',
    role: 'Tantou Editor',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    type: 'info',
  }
]

type Listener = (notifications: AppNotification[]) => void
const listeners = new Set<Listener>()

let currentNotifications: AppNotification[] = []

function loadNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return SEED_NOTIFICATIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS))
      return SEED_NOTIFICATIONS
    }
    return JSON.parse(raw) as AppNotification[]
  } catch {
    return SEED_NOTIFICATIONS
  }
}

function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  listeners.forEach(listener => listener(notifications))
}

// Initialize on first load
if (typeof window !== 'undefined') {
  currentNotifications = loadNotifications()
} else {
  currentNotifications = SEED_NOTIFICATIONS
}

export const notificationStore = {
  getNotifications(): AppNotification[] {
    if (typeof window !== 'undefined' && currentNotifications.length === 0) {
      currentNotifications = loadNotifications()
    }
    return currentNotifications
  },

  addNotification(
    title: string,
    message: string,
    role: AppNotification['role'],
    type: AppNotification['type'] = 'info'
  ) {
    const notifications = this.getNotifications()
    const newNotification: AppNotification = {
      id: `NT${String(notifications.length + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      title,
      message,
      role,
      read: false,
      createdAt: new Date().toISOString(),
      type,
    }
    
    const updated = [newNotification, ...notifications]
    currentNotifications = updated
    saveNotifications(updated)

    // Trigger Sonner toast on client side if it targets the current active role or is for 'All'
    if (typeof window !== 'undefined') {
      const activeRole = localStorage.getItem('user-role')
      if (role === 'All' || role === activeRole) {
        const toastFn = toast[type] || toast
        toastFn(title, {
          description: message,
          duration: 5000,
        })
      }
    }
    
    return newNotification
  },

  markRead(id: string) {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    currentNotifications = updated
    saveNotifications(updated)
  },

  markAllRead(role: string) {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => (n.role === role || n.role === 'All') ? { ...n, read: true } : n)
    currentNotifications = updated
    saveNotifications(updated)
  },

  clearAll(role: string) {
    const notifications = this.getNotifications()
    const updated = notifications.filter(n => n.role !== role && n.role !== 'All')
    currentNotifications = updated
    saveNotifications(updated)
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    listener(this.getNotifications())
    return () => {
      listeners.delete(listener)
    }
  }
}
