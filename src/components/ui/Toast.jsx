import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const variants = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500',
    border: 'border-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500',
    border: 'border-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500',
    border: 'border-blue-400',
  },
}

export default function Toast({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3000,
  position = 'top-right'
}) {
  const config = variants[type] || variants.info
  const Icon = config.icon

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed ${positionClasses[position]} z-[100] max-w-sm`}
        >
          <div className={`${config.bg} rounded-xl shadow-lg border ${config.border} px-4 py-3 flex items-center gap-3`}>
            <Icon size={20} className="text-white flex-shrink-0" />
            <span className="text-white text-sm font-medium flex-1">{message}</span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  const success = (message) => showToast(message, 'success')
  const error = (message) => showToast(message, 'error')
  const warning = (message) => showToast(message, 'warning')
  const info = (message) => showToast(message, 'info')

  return {
    toast,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  }
}

