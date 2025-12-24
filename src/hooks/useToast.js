import { useState, useCallback } from 'react'

// Toast通知用カスタムフック
export function useToast(defaultDuration = 3000) {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success', // success, error, warning, info
  })

  const showToast = useCallback((message, type = 'success', duration = defaultDuration) => {
    setToast({ show: true, message, type })

    if (duration > 0) {
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }))
      }, duration)
    }
  }, [defaultDuration])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }))
  }, [])

  // 便利なショートカットメソッド
  const success = useCallback((message, duration) => {
    showToast(message, 'success', duration)
  }, [showToast])

  const error = useCallback((message, duration) => {
    showToast(message, 'error', duration)
  }, [showToast])

  const warning = useCallback((message, duration) => {
    showToast(message, 'warning', duration)
  }, [showToast])

  const info = useCallback((message, duration) => {
    showToast(message, 'info', duration)
  }, [showToast])

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
    // Toastコンポーネント用のprops
    toastProps: {
      message: toast.message,
      isVisible: toast.show,
      type: toast.type,
      onClose: hideToast,
    },
  }
}

export default useToast
