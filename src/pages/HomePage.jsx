import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { useAppStore, useThemeStore, backgroundStyles } from '../store'
import { Bell, Settings, ChevronRight, ClipboardList, HardHat, FileText, BarChart3, MessageCircle } from 'lucide-react'

// カテゴリ定義（Lucide Icons使用、説明更新）
const categories = [
  {
    id: 'sales',
    name: '営業',
    description: '見積・顧客・S-BASE',
    color: '#3A6AAF',
    icon: ClipboardList,
  },
  {
    id: 'construction',
    name: '工事',
    description: '現場・安全・S-BASE',
    color: '#3D9968',
    icon: HardHat,
  },
  {
    id: 'office',
    name: '事務',
    description: '経費・請求',
    color: '#7A5A9D',
    icon: FileText,
  },
  {
    id: 'management',
    name: '経営',
    description: 'ダッシュボード',
    color: '#C4823B',
    icon: BarChart3,
  },
]

// 浅瀬の海背景（オーシャンテーマ用）- 光芒とコースティクスと泡
function OceanBackground() {
  // 泡のデータ（10個、様々なサイズと位置）
  const bubbles = [
    { left: 5, size: 6, duration: 10, delay: 0 },
    { left: 15, size: 4, duration: 12, delay: 1.5 },
    { left: 25, size: 8, duration: 11, delay: 0.5 },
    { left: 35, size: 5, duration: 13, delay: 2 },
    { left: 45, size: 7, duration: 10, delay: 1 },
    { left: 55, size: 4, duration: 14, delay: 3 },
    { left: 65, size: 9, duration: 11, delay: 0.8 },
    { left: 75, size: 5, duration: 12, delay: 2.5 },
    { left: 85, size: 6, duration: 13, delay: 1.2 },
    { left: 95, size: 4, duration: 11, delay: 3.5 },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {/* 光芒（ゴッドレイ）- 8秒周期、ゆっくり揺れる */}
      <motion.div
        className="absolute"
        style={{
          top: '-30%',
          left: '50%',
          width: '200%',
          height: '80%',
          transformOrigin: 'top center',
          background: `conic-gradient(
            from 180deg at 50% 0%,
            transparent 30%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0.12) 40%,
            rgba(255, 255, 255, 0.06) 45%,
            transparent 50%,
            transparent 52%,
            rgba(255, 255, 255, 0.04) 56%,
            rgba(255, 255, 255, 0.10) 60%,
            rgba(255, 255, 255, 0.04) 64%,
            transparent 70%,
            transparent 75%,
            rgba(255, 255, 255, 0.03) 78%,
            rgba(255, 255, 255, 0.08) 82%,
            rgba(255, 255, 255, 0.03) 86%,
            transparent 92%
          )`,
        }}
        animate={{
          x: ['-50%', '-47%', '-53%', '-50%'],
          rotate: [-3, 2, -2, -3],
          opacity: [0.5, 0.7, 0.4, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* コースティクス（水面の光の揺らぎ）- 6秒周期 */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 120px 90px at 15% 10%, rgba(255,255,255,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 100px 75px at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 90px 70px at 25% 45%, rgba(255,255,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 110px 85px at 70% 55%, rgba(255,255,255,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 80px 60px at 40% 75%, rgba(255,255,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 95px 72px at 85% 85%, rgba(255,255,255,0.06) 0%, transparent 55%)
          `,
        }}
        animate={{
          scale: [1, 1.08, 0.97, 1],
          x: ['0%', '1%', '-0.5%', '0%'],
          y: ['0%', '0.5%', '-0.3%', '0%'],
          opacity: [0.6, 0.8, 0.5, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 泡（10個、ゆっくり上昇）*/}
      {bubbles.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            bottom: '-20px',
            background: `radial-gradient(circle at 30% 30%,
              rgba(255,255,255,0.7),
              rgba(255,255,255,0.3) 50%,
              rgba(255,255,255,0.1) 100%)`,
            boxShadow: '0 0 4px rgba(255,255,255,0.3)',
          }}
          animate={{
            y: [0, -900],
            opacity: [0, 0.6, 0.5, 0.4, 0],
            x: [0, 15 * Math.sin(i), -10 * Math.cos(i), 8 * Math.sin(i), 0],
            scale: [1, 1.1, 1.05, 0.95, 0.9],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* 追加の大きな泡（3個、よりゆっくり）*/}
      {[
        { left: 20, size: 12, duration: 16, delay: 4 },
        { left: 50, size: 14, duration: 18, delay: 6 },
        { left: 80, size: 10, duration: 15, delay: 2 },
      ].map((bubble, i) => (
        <motion.div
          key={`big-${i}`}
          className="absolute rounded-full"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            bottom: '-30px',
            background: `radial-gradient(circle at 25% 25%,
              rgba(255,255,255,0.5),
              rgba(255,255,255,0.2) 60%,
              rgba(255,255,255,0.05) 100%)`,
            boxShadow: '0 0 8px rgba(255,255,255,0.2), inset 0 0 4px rgba(255,255,255,0.1)',
          }}
          animate={{
            y: [0, -1000],
            opacity: [0, 0.4, 0.35, 0.3, 0],
            x: [0, 20, -15, 10, 0],
            scale: [0.8, 1, 1.1, 1, 0.9],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// カテゴリカードコンポーネント
function CategoryCard({ category, index, themeStyle }) {
  const navigate = useNavigate()
  const Icon = category.icon
  const isOcean = themeStyle?.hasOceanEffect

  const cardStyle = isOcean ? {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.35)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  } : {
    background: `linear-gradient(145deg, ${category.color}, ${category.color}dd)`,
    boxShadow: themeStyle?.shadow || '0 4px 20px rgba(0,0,0,0.08)',
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer w-full"
      style={{
        ...cardStyle,
        aspectRatio: '1 / 0.75',
        minHeight: '120px',
        maxWidth: '400px',
      }}
      onClick={() => navigate(`/menu/${category.id}`)}
      initial={{ opacity: 0.8, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: 'easeOut' }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -3 }}
    >
      {/* 背景装飾 */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full"
        style={{
          background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)',
          transform: 'translate(30px, -30px)',
        }}
      />

      <div className="relative p-5 h-full flex flex-col justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.2)',
          }}
        >
          <Icon size={20} className="text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white tracking-wide">{category.name}</h3>
          <p className="text-white/80 text-xs mt-1 font-light">{category.description}</p>
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <ChevronRight size={14} className="text-white" strokeWidth={2} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 天気アイコンを絵文字に変換
function getWeatherEmoji(code) {
  if (!code) return '☀️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

export default function HomePage() {
  const navigate = useNavigate()
  const { unreadCount } = useAppStore()
  const { backgroundId } = useThemeStore()
  const [weather, setWeather] = useState(null)

  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const showOceanEffect = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`

  // 天気データを取得
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=33.59&longitude=130.40&current=temperature_2m,weather_code&timezone=Asia%2FTokyo'
        )
        if (res.ok) {
          const data = await res.json()
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
          })
        }
      } catch (e) {
        console.error('Weather fetch error:', e)
      }
    }
    fetchWeather()
  }, [])

  return (
    <div
      className="min-h-screen pb-24 relative"
      style={{ background: currentBg.bg }}
    >
      {/* 海の背景（オーシャンテーマ時のみ） */}
      {showOceanEffect && <OceanBackground />}

      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: currentBg.headerBg,
          borderBottom: `1px solid ${currentBg.border}`,
        }}
      >
        <div className="px-4 sm:px-6 py-5 flex items-center justify-between max-w-[900px] mx-auto">
          <div>
            <h1
              className="text-base font-medium tracking-wide"
              style={{ color: currentBg.text }}
            >
              サンユウテック
            </h1>
            <p
              className="text-xs mt-1 font-light"
              style={{ color: currentBg.textLight }}
            >
              {dateStr}
              {weather && (
                <span className="ml-2">
                  {getWeatherEmoji(weather.code)} {weather.temp}℃
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{
                background: showOceanEffect ? 'rgba(255,255,255,0.1)' : 'rgba(128,128,128,0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notify')}
            >
              <Bell
                size={22}
                strokeWidth={1.5}
                style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }}
              />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff6b35]" />
              )}
            </motion.button>
            <motion.button
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: showOceanEffect ? 'rgba(255,255,255,0.1)' : 'rgba(128,128,128,0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
            >
              <Settings
                size={22}
                strokeWidth={1.5}
                style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }}
              />
            </motion.button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ：4カテゴリグリッド */}
      <div className="px-4 sm:px-6 pt-6 max-w-[900px] mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 justify-items-center">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              themeStyle={currentBg}
            />
          ))}
        </div>
      </div>

      {/* フッターメッセージ */}
      <motion.div
        className="text-center mt-10 px-4 max-w-[900px] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p
          className="text-xs font-light tracking-wide"
          style={{ color: currentBg.textLight }}
        >
          メニューをタップして各機能へ
        </p>
      </motion.div>

      {/* AIチャットボタン */}
      <motion.button
        className="fixed bottom-28 right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-40"
        style={{
          background: showOceanEffect
            ? 'rgba(255,255,255,0.2)'
            : 'linear-gradient(145deg, #3B82F6, #2563EB)',
          backdropFilter: showOceanEffect ? 'blur(20px)' : 'none',
          boxShadow: showOceanEffect
            ? '0 8px 24px rgba(0,0,0,0.15)'
            : '0 8px 24px rgba(59, 130, 246, 0.3)',
        }}
        onClick={() => navigate('/ai-chat')}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        whileHover={{ y: -2, boxShadow: showOceanEffect ? '0 12px 32px rgba(0,0,0,0.2)' : '0 12px 32px rgba(59, 130, 246, 0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle
          size={24}
          strokeWidth={1.5}
          className="text-white"
        />
      </motion.button>
    </div>
  )
}
