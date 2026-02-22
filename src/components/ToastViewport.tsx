import { Toast } from './Toast'
import { useNotifications } from '../context/NotificationContext'

export function ToastViewport() {
  const { toasts, dismissToast } = useNotifications()

  if (toasts.length === 0) {
    return null
  }

  return (
    <section className="toast-viewport" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={dismissToast} />
      ))}
    </section>
  )
}
