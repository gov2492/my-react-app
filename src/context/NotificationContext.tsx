import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  createNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '../api/notificationApi'
import type { CreateNotificationPayload, NotificationItem, ToastItem, NotificationType } from '../types/notification'

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isDropdownOpen: boolean
  toasts: ToastItem[]
  setAuthToken: (token: string | null) => void
  refreshNotifications: () => Promise<void>
  toggleDropdown: () => void
  closeDropdown: () => void
  markOneAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  createNewNotification: (payload: CreateNotificationPayload) => Promise<void>
  pushToast: (payload: { title: string; message: string; type: NotificationType; durationMs?: number }) => void
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const MAX_TOASTS = 5
const DEFAULT_TOAST_DURATION_MS = 4500

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthTokenState] = useState<string | null>(() => localStorage.getItem('luxegem_token'))
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const setAuthToken = useCallback((token: string | null) => {
    setAuthTokenState(token)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, message, type, durationMs = DEFAULT_TOAST_DURATION_MS }: { title: string; message: string; type: NotificationType; durationMs?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const nextToast: ToastItem = { id, title, message, type }

      setToasts((current) => [...current, nextToast].slice(-MAX_TOASTS))

      window.setTimeout(() => {
        dismissToast(id)
      }, durationMs)
    },
    [dismissToast]
  )

  const refreshNotifications = useCallback(async () => {
    if (!authToken) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setIsLoading(true)
    try {
      const [notificationList, unread] = await Promise.all([
        fetchNotifications(authToken, 50),
        fetchUnreadCount(authToken)
      ])
      setNotifications(notificationList)
      setUnreadCount(unread.unreadCount)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [authToken])

  const markOneAsRead = useCallback(
    async (id: number) => {
      if (!authToken) {
        return
      }

      await markNotificationAsRead(authToken, id)
      await refreshNotifications()
    },
    [authToken, refreshNotifications]
  )

  const markAllAsRead = useCallback(async () => {
    if (!authToken) {
      return
    }

    await markAllNotificationsAsRead(authToken)
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
    setUnreadCount(0)
  }, [authToken])

  const createNewNotification = useCallback(
    async (payload: CreateNotificationPayload) => {
      if (!authToken) {
        return
      }

      await createNotification(authToken, payload)
      await refreshNotifications()
    },
    [authToken, refreshNotifications]
  )

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((open) => !open)
  }, [])

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

  useEffect(() => {
    if (!authToken) {
      setNotifications([])
      setUnreadCount(0)
      setIsDropdownOpen(false)
      return
    }

    void refreshNotifications()
    const intervalId = window.setInterval(() => {
      void refreshNotifications()
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [authToken, refreshNotifications])

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isDropdownOpen,
      toasts,
      setAuthToken,
      refreshNotifications,
      toggleDropdown,
      closeDropdown,
      markOneAsRead,
      markAllAsRead,
      createNewNotification,
      pushToast,
      dismissToast
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      isDropdownOpen,
      toasts,
      setAuthToken,
      refreshNotifications,
      toggleDropdown,
      closeDropdown,
      markOneAsRead,
      markAllAsRead,
      createNewNotification,
      pushToast,
      dismissToast
    ]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
