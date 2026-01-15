import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast notification component
 */
export function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    error: {
      bg: 'bg-red-500',
      icon: '❌'
    },
    success: {
      bg: 'bg-emerald-500',
      icon: '✓'
    },
    warning: {
      bg: 'bg-amber-500',
      icon: '⚠️'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ️'
    }
  };

  const style = styles[type] || styles.error;

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 ${style.bg} text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-slide-up`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{style.icon}</span>
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-80 transition-opacity text-lg leading-none"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * Toast container for multiple toasts
 */
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts?.length) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'success'
              ? 'bg-emerald-500'
              : toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-blue-500'
          } text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-up`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity text-lg leading-none"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}

export default Toast;
