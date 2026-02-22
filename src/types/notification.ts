export type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'

export interface NotificationItem {
  id: number
  shopId: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}

export interface CreateNotificationPayload {
  shopId?: string
  title: string
  message: string
  type?: NotificationType
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface MarkAllReadResponse {
  updatedCount: number
}

export interface ToastItem {
  id: string
  title: string
  message: string
  type: NotificationType
}
