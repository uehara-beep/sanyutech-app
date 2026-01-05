import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function NotifyPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/`)
      if (res.ok) {
        setNotifications(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' })
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="通知"
        icon="🔔"
        gradient="from-pink-700 to-pink-400"
        onBack={() => navigate(-1)}
        action={
          notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-app-primary"
            >
              全て既読
            </button>
          )
        }
      />

      <div className="px-5 py-4">
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">🔔</div>
            <div>通知はありません</div>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="mb-2.5 flex gap-3 cursor-pointer"
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  notif.is_read ? 'bg-app-border' : 'bg-app-primary'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1" style={{ color: currentBg.text }}>{notif.title}</div>
                  <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>{notif.message}</div>
                  <div className="text-[11px]" style={{ color: currentBg.textLight }}>
                    {notif.created_at?.split('T')[0]}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
