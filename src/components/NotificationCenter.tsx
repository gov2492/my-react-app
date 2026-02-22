import { useEffect, useMemo, useRef } from 'react'
import { useNotifications } from '../context/NotificationContext'
import type { NotificationItem } from '../types/notification'

function formatRelativeTime(value: string): string {
  const createdAt = new Date(value).getTime()
  if (Number.isNaN(createdAt)) {
    return value
  }

  const diffMs = Date.now() - createdAt
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) {
    return 'Just now'
  }
  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)} minutes ago`
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} hours ago`
  }
  return `${Math.floor(diffMs / day)} days ago`
}

function badgeCount(count: number): string {
  if (count > 99) {
    return '99+'
  }
  return String(count)
}

function typeClass(type: NotificationItem['type']): string {
  switch (type) {
    case 'SUCCESS':
      return 'success'
    case 'WARNING':
      return 'warning'
    case 'ERROR':
      return 'error'
    default:
      return 'info'
  }
}

function typeIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'SUCCESS':
      return '✓'
    case 'WARNING':
      return '!'
    case 'ERROR':
      return '⨯'
    default:
      return 'i'
  }
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    markOneAsRead,
    markAllAsRead
  } = useNotifications()

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDropdownOpen) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      if (!containerRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [closeDropdown, isDropdownOpen])

  const hasUnread = unreadCount > 0
  const unreadInList = useMemo(() => notifications.some((notification) => !notification.isRead), [notifications])

  return (
    <div className="notification-anchor" ref={containerRef}>
      <button
        type="button"
        className={`notification-bell ${isDropdownOpen ? 'active' : ''}`}
        aria-label="Open notifications"
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        onClick={toggleDropdown}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        {hasUnread && <span className="notification-badge">{badgeCount(unreadCount)}</span>}
      </button>

      {isDropdownOpen && (
        <section className="notification-dropdown" role="dialog" aria-label="Notifications panel">
          <header className="notification-header">
            <h3>Notifications</h3>
            <button
              type="button"
              className="mark-all-btn"
              onClick={() => void markAllAsRead()}
              disabled={!unreadInList}
            >
              Mark all as read
            </button>
          </header>

          <div className="notification-list" role="list">
            {isLoading ? (
              <div className="notification-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="listitem"
                  className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => void markOneAsRead(notification.id)}
                >
                  <span className={`notification-type-icon ${typeClass(notification.type)}`} aria-hidden="true">
                    {typeIcon(notification.type)}
                  </span>

                  <span className="notification-content">
                    <span className="notification-title-row">
                      <span className="notification-title">{notification.title}</span>
                      {!notification.isRead && <span className="notification-unread-dot" aria-hidden="true" />}
                    </span>
                    <span className="notification-message">{notification.message}</span>
                    <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
