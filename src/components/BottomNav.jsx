import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Camera, CheckCircle, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAppStore, useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

const navItems = [
  { path: '/', icon: Home, label: 'ホーム' },
  { path: '/talk', icon: MessageCircle, label: 'トーク', isLineWorks: true },
  { path: '/scan', icon: Camera, label: '撮影', isCenter: true },
  { path: '/approve', icon: CheckCircle, label: '承認', badge: 'pendingApprovals' },
  { path: '/settings', icon: Settings, label: '設定' },
]

// LINE WORKSディープリンク
const LINEWORKS_DEEPLINK = 'lineworks://'
const LINEWORKS_WEB_URL = 'https://talk.worksmobile.com'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pendingApprovals } = useAppStore()
  const { getCurrentTheme, backgroundId } = useThemeStore()
  const theme = getCurrentTheme()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'
  const [lineWorksUnread, setLineWorksUnread] = useState(0)

  const badges = { pendingApprovals }

  // LINE WORKS未読数を取得（設定されている場合）
  useEffect(() => {
    const fetchLineWorksUnread = async () => {
      try {
        const res = await fetch(`${API_BASE}/lineworks/unread-count`)
        if (res.ok) {
          const data = await res.json()
          setLineWorksUnread(data.count || 0)
        }
      } catch (e) {
        // LINE WORKS連携が設定されていない場合は無視
      }
    }
    fetchLineWorksUnread()
    // 30秒ごとに更新
    const interval = setInterval(fetchLineWorksUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  // LINE WORKSを開く
  const openLineWorks = () => {
    // まずディープリンクを試す
    const start = Date.now()
    window.location.href = LINEWORKS_DEEPLINK

    // 2秒後にアプリが開かなかった場合はWeb版を開く
    setTimeout(() => {
      if (Date.now() - start < 2500) {
        window.open(LINEWORKS_WEB_URL, '_blank')
      }
    }, 2000)
  }

  // 特定のページではナビを非表示
  const hiddenPaths = ['/scan-result']
  if (hiddenPaths.includes(location.pathname)) return null

  // テーマに応じたナビスタイル
  const navStyle = isOcean
    ? {
        background: 'rgba(0, 130, 150, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }
    : isLightTheme
    ? {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }
    : {
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #2a2a2a',
      }

  // アイコン・テキストの非アクティブカラー
  const inactiveColor = isOcean ? 'rgba(255,255,255,0.5)' : isLightTheme ? '#999' : '#666'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around items-end pb-safe z-50"
      style={navStyle}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path))
        const badgeCount = item.badge ? badges[item.badge] : 0
        const Icon = item.icon

        // 中央の撮影ボタン（大きめ・オレンジ）
        if (item.isCenter) {
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative -mt-5"
              whileTap={{ scale: 0.9 }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #ff6b35, #e55a25)'
                }}
              >
                <Icon size={24} className="text-white" strokeWidth={1.5} />
              </div>
              <span
                className="block text-[9px] mt-1 text-center font-light"
                style={{ color: isActive ? '#ff6b35' : '#666' }}
              >
                {item.label}
              </span>
            </motion.button>
          )
        }

        // LINE WORKSトークボタン
        if (item.isLineWorks) {
          return (
            <motion.button
              key={item.path}
              onClick={openLineWorks}
              className="flex flex-col items-center py-2 px-4 relative"
              whileTap={{ scale: 0.9 }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: lineWorksUnread > 0 ? '#22c55e15' : 'transparent'
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: lineWorksUnread > 0 ? '#22c55e' : inactiveColor }}
                />
              </div>
              <span
                className="text-[9px] font-light"
                style={{ color: lineWorksUnread > 0 ? '#22c55e' : inactiveColor }}
              >
                {item.label}
              </span>
              {lineWorksUnread > 0 && (
                <span className="absolute top-1 right-2 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center font-medium bg-green-500">
                  {lineWorksUnread > 99 ? '99+' : lineWorksUnread}
                </span>
              )}
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
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isActive ? `${theme.primary}15` : 'transparent'
              }}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                style={{ color: isActive ? theme.primary : inactiveColor }}
              />
            </div>
            <span
              className="text-[9px] font-light"
              style={{ color: isActive ? theme.primary : inactiveColor }}
            >
              {item.label}
            </span>
            {badgeCount > 0 && (
              <span
                className="absolute top-1 right-2 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center font-medium"
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
