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
// URL hub - se thay bang URL that cua Bao
const HUB_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5151') + '/hubs/notifications'

let connection: signalR.HubConnection | null = null

// Tao + start ket noi toi SignalR hub
export async function startConnection(
  onReceive: (data: RealtimeNotification) => void
): Promise<signalR.HubConnection | null> {
  // neu da co ket noi dang chay thi dung lai
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token || '', // gui token neu hub can auth
    })
    .withAutomaticReconnect() // tu ket noi lai neu rot mang
    .build()

  // Lang nghe event tu BE - TEN EVENT se thay theo Bao (vd "ReceiveNotification")
  connection.on('ReceiveNotification', (data: any) => {
    onReceive(data)
  })

  try {
    await connection.start()
    console.log('SignalR: đã kết nối realtime')
    return connection
  } catch (err) {
    console.error('SignalR: kết nối thất bại', err)
    return null
  }
}

// Ngat ket noi (khi logout / roi trang)
export async function stopConnection() {
  if (connection) {
    await connection.stop()
    connection = null
  }
}