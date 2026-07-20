import * as signalR from '@microsoft/signalr'

// Payload BE gui (khop RealtimeNotificationPayload)
export interface RealtimeNotification {
  notificationId: string
  title: string
  message: string
  type: string
  priority: string
  link?: string
  createdAt: string
}

const HUB_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5151') + '/hubs/notifications'

let connection: signalR.HubConnection | null = null
// Giu lai promise dang chay -> tranh tao ket noi thu 2 khi StrictMode chay effect 2 lan
let startPromise: Promise<signalR.HubConnection | null> | null = null

export async function startConnection(
  onReceive: (data: RealtimeNotification) => void
): Promise<signalR.HubConnection | null> {
  // Da ket noi roi -> dung lai
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection
  }
  // Dang ket noi do -> tra lai promise cu, KHONG tao cai moi
  if (startPromise) {
    return startPromise
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token || '',
    })
    .withAutomaticReconnect()
    .build()

  conn.on('ReceiveNotification', (data: any) => {
    onReceive(data)
  })

  startPromise = (async () => {
    try {
      await conn.start()
      connection = conn
      console.log('SignalR: da ket noi realtime')
      return conn
    } catch (err: any) {
      const msg = String(err?.message || err)
      // Loi vo hai khi StrictMode huy ket noi giua chung -> chi warn, khong bao do
      if (msg.includes('stopped during negotiation') || msg.includes('The connection was stopped')) {
        console.warn('SignalR: ket noi bi huy giua chung (dev StrictMode), se tu ket noi lai')
      } else {
        console.warn('SignalR: ket noi that bai -', msg)
      }
      connection = null
      return null
    } finally {
      startPromise = null
    }
  })()

  return startPromise
}

export async function stopConnection() {
  // Neu dang ket noi do thi doi xong roi moi dung -> tranh huy giua negotiate
  if (startPromise) {
    try { await startPromise } catch { /* bo qua */ }
  }
  if (connection) {
    try { await connection.stop() } catch { /* bo qua */ }
    connection = null
  }
}
