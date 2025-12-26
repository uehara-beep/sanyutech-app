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

// 浅瀬の海背景（オーシャンテーマ用）- 光芒とコースティクス
function OceanBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 光芒（ゴッドレイ）- 6秒周期 */}
      <motion.div
        className="absolute"
        style={{
          top: '-20%',
          left: '50%',
          width: '180%',
          height: '70%',
          transformOrigin: 'top center',
          background: `conic-gradient(
            from 180deg at 50% 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.08) 40%,
            rgba(255, 255, 255, 0.12) 43%,
            rgba(255, 255, 255, 0.08) 46%,
            transparent 51%,
            transparent 55%,
            rgba(255, 255, 255, 0.05) 59%,
            rgba(255, 255, 255, 0.08) 62%,
            rgba(255, 255, 255, 0.05) 65%,
            transparent 70%
          )`,
        }}
        animate={{
          x: ['-50%', '-48%', '-52%', '-50%'],
          rotate: [-2, 1, -1, -2],
          opacity: [0.4, 0.6, 0.3, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* コースティクス - 5秒周期 */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 100px 80px at 20% 15%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80px 65px at 75% 25%, rgba(255,255,255,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 90px 70px at 35% 60%, rgba(255,255,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 70px 55px at 65% 80%, rgba(255,255,255,0.04) 0%, transparent 55%)
          `,
        }}
        animate={{
          scale: [1, 1.05, 1],
          x: ['0%', '0.5%', '0%'],
          y: ['0%', '0.5%', '0%'],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 泡（ゆっくり、薄く）- 12秒周期 */}
      {[10, 30, 50, 70, 90].map((left, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + i,
            height: 4 + i,
            left: `${left}%`,
            bottom: '-20px',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5), rgba(255,255,255,0.1))',
          }}
          animate={{
            y: [0, -800],
            opacity: [0, 0.3, 0.3, 0],
            x: [0, 10 - i * 2, -5 + i, 0],
          }}
          transition={{
            duration: 12,
            delay: i * 2,
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
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  } : {
    background: `linear-gradient(145deg, ${category.color}, ${category.color}dd)`,
    boxShadow: themeStyle?.shadow || '0 4px 20px rgba(0,0,0,0.08)',
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        ...cardStyle,
        aspectRatio: '1 / 0.75',
      }}
      onClick={() => navigate(`/menu/${category.id}`)}
      initial={{ opacity: 0, y: 20 }}
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
        <div className="px-6 py-5 flex items-center justify-between">
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
      <div className="px-6 pt-6 relative z-10">
        <div className="grid grid-cols-2 gap-3.5">
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
        className="text-center mt-10 px-4"
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
