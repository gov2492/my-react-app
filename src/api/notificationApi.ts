import type {
  CreateNotificationPayload,
  MarkAllReadResponse,
  NotificationItem,
  UnreadCountResponse
} from '../types/notification'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

export async function fetchNotifications(token: string, limit = 50): Promise<NotificationItem[]> {
  const response = await fetch(`${API_URL}/api/dashboard/notifications?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Notifications API returned ${response.status}`)
  }

  return (await response.json()) as NotificationItem[]
}

export async function fetchUnreadCount(token: string): Promise<UnreadCountResponse> {
  const response = await fetch(`${API_URL}/api/dashboard/notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Unread count API returned ${response.status}`)
  }

  return (await response.json()) as UnreadCountResponse
}

export async function markNotificationAsRead(token: string, id: number): Promise<NotificationItem> {
  const response = await fetch(`${API_URL}/api/dashboard/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Mark read failed: ${response.status}`)
  }

  return (await response.json()) as NotificationItem
}

export async function markAllNotificationsAsRead(token: string): Promise<MarkAllReadResponse> {
  const response = await fetch(`${API_URL}/api/dashboard/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`Mark all as read failed: ${response.status}`)
  }

  return (await response.json()) as MarkAllReadResponse
}

export async function createNotification(token: string, payload: CreateNotificationPayload): Promise<NotificationItem> {
  const response = await fetch(`${API_URL}/api/dashboard/notifications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Create notification failed: ${response.status}`)
  }

  return (await response.json()) as NotificationItem
}
