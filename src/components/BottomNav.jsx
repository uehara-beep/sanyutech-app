import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BarChart3, Camera, CheckCircle, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store'

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

  const badges = { pendingApprovals }

  // 特定のページではナビを非表示
  const hiddenPaths = ['/scan-result']
  if (hiddenPaths.includes(location.pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-end pb-safe z-50 shadow-lg">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path))
        const badgeCount = item.badge ? badges[item.badge] : 0
        const Icon = item.icon

        // 中央の撮影ボタン（大きめ）
        if (item.isCenter) {
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative -mt-6"
              whileTap={{ scale: 0.9 }}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isActive
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                  : 'bg-gradient-to-br from-orange-400 to-orange-500'
              }`}>
                <Icon size={28} className="text-white" />
              </div>
              <span className={`block text-[10px] mt-1 text-center ${
                isActive ? 'text-orange-500 font-bold' : 'text-gray-500'
              }`}>
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-orange-50' : ''
            }`}>
              <Icon
                size={22}
                className={isActive ? 'text-orange-500' : 'text-gray-400'}
              />
            </div>
            <span className={`text-[10px] ${
              isActive ? 'text-orange-500 font-bold' : 'text-gray-400'
            }`}>
              {item.label}
            </span>
            {badgeCount > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold">
                {badgeCount}
              </span>
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
