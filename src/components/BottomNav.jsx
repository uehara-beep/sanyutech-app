import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BarChart3, Camera, CheckCircle, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore, useThemeStore } from '../store'

const navItems = [
  { path: '/', icon: Home, label: 'ホーム' },
  { path: '/sbase', icon: BarChart3, label: 'S-BASE' },
  { path: '/scan', icon: Camera, label: '撮影', isCenter: true },
  { path: '/approve', icon: CheckCircle, label: '承認', badge: 'pendingApprovals' },
  { path: '/settings', icon: Settings, label: '設定' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pendingApprovals } = useAppStore()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const badges = { pendingApprovals }

  // 特定のページではナビを非表示
  const hiddenPaths = ['/scan-result']
  if (hiddenPaths.includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-end pb-safe z-50 shadow-lg" style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path))
        const badgeCount = item.badge ? badges[item.badge] : 0
        const Icon = item.icon

        // 中央の撮影ボタン（大きめ）- テーマカラー対応
        if (item.isCenter) {
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative -mt-6"
              whileTap={{ scale: 0.9 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})`
                }}
              >
                <Icon size={28} className="text-white" />
              </div>
              <span
                className="block text-[10px] mt-1 text-center font-medium"
                style={{ color: isActive ? theme.primary : '#9ca3af' }}
              >
                {item.label}
              </span>
            </motion.button>
          )
        }

        return (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center py-2 px-4 relative"
            whileTap={{ scale: 0.9 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: isActive ? `${theme.primary}20` : 'transparent'
              }}
            >
              <Icon
                size={22}
                style={{ color: isActive ? theme.primary : '#9ca3af' }}
              />
            </div>
            <span
              className={`text-[10px] ${isActive ? 'font-bold' : ''}`}
              style={{ color: isActive ? theme.primary : '#9ca3af' }}
            >
              {item.label}
            </span>
            {badgeCount > 0 && (
              <span
                className="absolute top-1 right-2 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: theme.primary }}
              >
                {badgeCount}
              </span>
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
