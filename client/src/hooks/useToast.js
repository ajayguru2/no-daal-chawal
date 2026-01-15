import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing toast notifications
 * @returns {Object} Toast state and functions
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const addToast = useCallback((message, type = 'error', duration = 5000) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (message, duration) => addToast(message, 'error', duration),
    [addToast]
  );

  const showSuccess = useCallback(
    (message, duration) => addToast(message, 'success', duration),
    [addToast]
  );

  const showWarning = useCallback(
    (message, duration) => addToast(message, 'warning', duration),
    [addToast]
  );

  const showInfo = useCallback(
    (message, duration) => addToast(message, 'info', duration),
    [addToast]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearAll
  };
}

/**
 * Simple single-toast hook for components that only need one toast at a time
 */
export function useSingleToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showError,
    showSuccess
  };
}

export default useToast;
