export interface Notification {
  id: string
  userId: string
  message: string
  type: 'Info' | 'Warning' | 'Alert'
  read: boolean
  createdAt: string
}
