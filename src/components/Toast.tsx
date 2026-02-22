import type { ToastItem } from '../types/notification'

interface ToastProps {
  toast: ToastItem
  onClose: (id: string) => void
}

function typeClass(type: ToastItem['type']): string {
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

export function Toast({ toast, onClose }: ToastProps) {
  return (
    <article className={`toast toast-${typeClass(toast.type)}`} role="status" aria-live="polite">
      <div className="toast-content">
        <h4>{toast.title}</h4>
        <p>{toast.message}</p>
      </div>
      <button type="button" className="toast-close" aria-label="Close notification" onClick={() => onClose(toast.id)}>
        ✕
      </button>
    </article>
  )
}
