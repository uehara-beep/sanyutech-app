import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAppStore, useThemeStore, useAuthStore, backgroundStyles, useDashboardStore, dashboardWidgets, kpiOptions } from '../store'
import {
  Bell, Settings as SettingsIcon, ChevronRight, ClipboardList, HardHat, FileText, BarChart3,
  FolderKanban, TrendingUp, AlertCircle, Percent, Receipt, CheckCircle, Clock, Users,
  LogOut, User
} from 'lucide-react'

// KPIアイコンマップ
const kpiIconMap = {
  FolderKanban, TrendingUp, AlertCircle, Percent, Receipt, CheckCircle, Clock, Users
}
import { API_BASE, authFetch } from '../config/api'

// モバイル用カテゴリ定義
const categories = [
  { id: 'sales', name: '営業', description: '見積・顧客・S-BASE', color: '#3A6AAF', icon: ClipboardList },
  { id: 'construction', name: '工事', description: '現場・安全・S-BASE', color: '#3D9968', icon: HardHat },
  { id: 'office', name: '事務', description: '経費・請求', color: '#7A5A9D', icon: FileText },
  { id: 'management', name: '経営', description: 'ダッシュボード', color: '#C4823B', icon: BarChart3 },
  { id: 'settings', name: '設定', description: 'マスタ・システム', color: '#6B7280', icon: SettingsIcon },
]


// 浅瀬の海背景（オーシャンテーマ用）
function OceanBackground() {
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
      <motion.div
        className="absolute"
        style={{
          top: '-30%', left: '50%', width: '200%', height: '80%',
          transformOrigin: 'top center',
          background: `conic-gradient(from 180deg at 50% 0%, transparent 30%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.06) 45%, transparent 50%, transparent 52%, rgba(255,255,255,0.04) 56%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0.04) 64%, transparent 70%, transparent 75%, rgba(255,255,255,0.03) 78%, rgba(255,255,255,0.08) 82%, rgba(255,255,255,0.03) 86%, transparent 92%)`,
        }}
        animate={{ x: ['-50%', '-47%', '-53%', '-50%'], rotate: [-3, 2, -2, -3], opacity: [0.5, 0.7, 0.4, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 120px 90px at 15% 10%, rgba(255,255,255,0.10) 0%, transparent 60%), radial-gradient(ellipse 100px 75px at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 55%), radial-gradient(ellipse 90px 70px at 25% 45%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 110px 85px at 70% 55%, rgba(255,255,255,0.07) 0%, transparent 55%)`,
        }}
        animate={{ scale: [1, 1.08, 0.97, 1], opacity: [0.6, 0.8, 0.5, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {bubbles.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: bubble.size, height: bubble.size, left: `${bubble.left}%`, bottom: '-20px',
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%)`,
          }}
          animate={{ y: [0, -900], opacity: [0, 0.6, 0.5, 0.4, 0] }}
          transition={{ duration: bubble.duration, delay: bubble.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// モバイル用カテゴリカード
function CategoryCard({ category, index, themeStyle }) {
  const navigate = useNavigate()
  const Icon = category.icon
  const isOcean = themeStyle?.hasOceanEffect

  const cardStyle = isOcean ? {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.35)',
  } : {
    background: `linear-gradient(145deg, ${category.color}, ${category.color}dd)`,
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl cursor-pointer w-full"
      style={{ ...cardStyle, aspectRatio: '1 / 0.75', minHeight: '120px', maxWidth: '400px' }}
      onClick={() => navigate(`/menu/${category.id}`)}
      initial={{ opacity: 0.8, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', transform: 'translate(30px, -30px)' }} />
      <div className="relative p-5 h-full flex flex-col justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <Icon size={20} className="text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white">{category.name}</h3>
          <p className="text-white/80 text-xs mt-1">{category.description}</p>
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <ChevronRight size={14} className="text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// PC用サイドバー
function Sidebar({ currentBg, isLightTheme }) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className="hidden md:flex flex-col w-56 fixed left-0 z-40"
      style={{
        background: '#ffffff',
        borderRight: `1px solid ${currentBg.border}`,
        top: '110px',
        height: 'calc(100vh - 110px)',
      }}
    >
      {/* カテゴリメニュー */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-3">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <motion.button
              key={category.id}
              onClick={() => navigate(`/menu/${category.id}`)}
              className="w-full relative overflow-hidden rounded-xl cursor-pointer text-left"
              style={{
                background: `linear-gradient(145deg, ${category.color}, ${category.color}dd)`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 装飾円 */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', transform: 'translate(20px, -20px)' }}
              />
              <div className="relative p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Icon size={20} className="text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white">{category.name}</h3>
                  <p className="text-white/70 text-xs truncate">{category.description}</p>
                </div>
                <ChevronRight size={16} className="text-white/60 flex-shrink-0" />
              </div>
            </motion.button>
          )
        })}
      </nav>

      {/* ログアウト */}
      <div className="p-3 border-t" style={{ borderColor: currentBg.border }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ background: '#fee2e2', color: '#ef4444' }}
        >
          <LogOut size={16} />
          ログアウト
        </button>
      </div>
    </aside>
  )
}

// KPIカード
function KPICard({ icon: Icon, label, value, subValue, color, isLightTheme }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: isLightTheme ? '#64748b' : '#94a3b8' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: isLightTheme ? '#1e293b' : '#f8fafc' }}>{value}</div>
      {subValue && <div className="text-xs mt-1" style={{ color: isLightTheme ? '#94a3b8' : '#64748b' }}>{subValue}</div>}
    </div>
  )
}

// 天気アイコン
function getWeatherEmoji(code) {
  if (!code) return '☀️'
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  return '⛈️'
}

export default function HomePage() {
  const navigate = useNavigate()
  const { unreadCount } = useAppStore()
  const { backgroundId } = useThemeStore()
  const { user } = useAuthStore()
  const { enabledWidgets, enabledKpis } = useDashboardStore()
  const [weather, setWeather] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    activeProjects: 0,
    monthlySales: 0,
    unpaidAmount: 0,
    profitRate: 28.5,
    monthlyExpense: 0,
    completedProjects: 0,
    pendingApprovals: 0,
    workerCount: 0,
    recentProjects: [],
    notifications: [],
  })

  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const showOceanEffect = currentBg?.hasOceanEffect
  const showNightEffect = currentBg?.hasNightEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // 背景スタイルを構築（画像背景とグラデーション/単色を分離）
  const bgStyle = {
    background: currentBg.bg,
    ...(currentBg.bgStyle || {}),
  }

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`

  // 天気データを取得
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=33.59&longitude=130.40&current=temperature_2m,weather_code&timezone=Asia%2FTokyo')
      .then(res => res.json())
      .then(data => setWeather({ temp: Math.round(data.current.temperature_2m), code: data.current.weather_code }))
      .catch(() => {})
  }, [])

  // ダッシュボードデータを取得
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // 案件数取得
        const projects = await authFetch(`${API_BASE}/projects/`)
        const active = projects.filter(p => p.status === '進行中' || p.status === '受注').length
        const completed = projects.filter(p => p.status === '完工').length
        setDashboardData(prev => ({
          ...prev,
          activeProjects: active,
          completedProjects: completed,
          recentProjects: projects.slice(0, 5),
        }))

        // 売上・請求データ取得
        const billings = await authFetch(`${API_BASE}/billing/`)
        const thisMonth = new Date().getMonth()
        const monthlySales = billings
          .filter(b => new Date(b.billing_date).getMonth() === thisMonth)
          .reduce((sum, b) => sum + (b.amount || 0), 0)
        const unpaid = billings
          .filter(b => !b.is_paid)
          .reduce((sum, b) => sum + (b.amount || 0), 0)
        setDashboardData(prev => ({
          ...prev,
          monthlySales,
          unpaidAmount: unpaid,
        }))

        // 経費データ取得
        const expenses = await authFetch(`${API_BASE}/expenses/`)
        const monthlyExpense = expenses
          .filter(e => new Date(e.expense_date).getMonth() === thisMonth)
          .reduce((sum, e) => sum + (e.amount || 0), 0)
        setDashboardData(prev => ({ ...prev, monthlyExpense }))

        // 承認待ち件数取得
        const approvalData = await authFetch(`${API_BASE}/approvals/count`)
        setDashboardData(prev => ({ ...prev, pendingApprovals: approvalData.count || 0 }))

        // 作業員数取得
        const workers = await authFetch(`${API_BASE}/workers/?field_only=true`)
        setDashboardData(prev => ({ ...prev, workerCount: workers.filter(w => w.is_field_worker).length }))
      } catch (e) {
        console.error('Dashboard fetch error:', e)
      }
    }
    fetchDashboard()
  }, [])

  // KPIの値を取得するヘルパー
  const getKpiValue = (kpiId) => {
    switch (kpiId) {
      case 'activeProjects': return `${dashboardData.activeProjects}件`
      case 'monthlySales': return `¥${dashboardData.monthlySales > 0 ? (dashboardData.monthlySales / 10000).toFixed(0) : '0'}万`
      case 'unpaidAmount': return `¥${dashboardData.unpaidAmount > 0 ? (dashboardData.unpaidAmount / 10000).toFixed(0) : '0'}万`
      case 'profitRate': return `${dashboardData.profitRate}%`
      case 'monthlyExpense': return `¥${dashboardData.monthlyExpense > 0 ? (dashboardData.monthlyExpense / 10000).toFixed(0) : '0'}万`
      case 'completedProjects': return `${dashboardData.completedProjects}件`
      case 'pendingApprovals': return `${dashboardData.pendingApprovals}件`
      case 'workerCount': return `${dashboardData.workerCount}人`
      default: return '0'
    }
  }

  return (
    <div className="min-h-screen relative" style={bgStyle}>
      {showOceanEffect && <OceanBackground />}
      {/* 夜の道路テーマ用オーバーレイ */}
      {showNightEffect && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.25) 100%)',
        }} />
      )}

      {/* PC用サイドバー */}
      <Sidebar currentBg={currentBg} isLightTheme={isLightTheme} />

      {/* メインコンテンツ */}
      <div className="md:ml-56 md:pt-[110px]">
        {/* PC用ヘッダー */}
        <header
          className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6"
          style={{ background: '#f3f4f6', height: '110px', borderBottom: '1px solid #e5e7eb' }}
        >
          {/* 左側：ロゴ + サブタイトル */}
          <div className="flex items-center gap-4">
            <img
              src="/logo/sunyuTECH_logo.png"
              alt="SunyuTEC"
              style={{ height: '80px', width: 'auto' }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">現場管理システム</span>
            </div>
          </div>

          {/* 右側：ユーザー名 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1a365d' }}>
                <User size={16} className="text-white" />
              </div>
              <span className="text-sm text-gray-700">
                {user?.display_name || user?.username || '田中太郎'}
              </span>
            </div>
          </div>
        </header>

        {/* モバイル用ヘッダー */}
        <header
          className="md:hidden sticky top-0 z-50"
          style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo/sunyuTECH_logo.png"
                alt="SunyuTEC"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{ background: 'rgba(128,128,128,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/notify')}
              >
                <Bell size={20} strokeWidth={1.5} style={{ color: '#666' }} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff6b35]" />}
              </motion.button>
              <motion.button
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(128,128,128,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu/settings')}
              >
                <SettingsIcon size={20} strokeWidth={1.5} style={{ color: '#666' }} />
              </motion.button>
            </div>
          </div>
        </header>

        {/* PC用ダッシュボード */}
        <main className="hidden md:block p-6 overflow-y-auto" style={{ height: 'calc(100vh - 110px)' }}>
          {/* KPIカード - カスタマイズ可能 */}
          <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${enabledKpis.length}, 1fr)` }}>
            {enabledKpis.map(kpiId => {
              const kpi = kpiOptions.find(k => k.id === kpiId)
              if (!kpi) return null
              const Icon = kpiIconMap[kpi.icon]
              return (
                <KPICard
                  key={kpiId}
                  icon={Icon}
                  label={kpi.name}
                  value={getKpiValue(kpiId)}
                  color={kpi.color}
                  isLightTheme={isLightTheme}
                />
              )
            })}
          </div>

          {/* カスタマイズ可能なウィジェットエリア */}
          <div className="grid grid-cols-3 gap-6">
            {/* 最近の案件（常に表示） */}
            <div className="col-span-2">
              <div
                className="rounded-xl p-5"
                style={{
                  background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold" style={{ color: currentBg.text }}>最近の案件</h2>
                  <button onClick={() => navigate('/sbase')} className="text-sm" style={{ color: '#FF6B00' }}>すべて見る →</button>
                </div>
                <div className="space-y-3">
                  {dashboardData.recentProjects.length > 0 ? (
                    dashboardData.recentProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                        style={{ background: isLightTheme ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-10 rounded-full" style={{ background: project.status === '進行中' ? '#10B981' : project.status === '受注' ? '#3B82F6' : '#94a3b8' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: currentBg.text }}>{project.name}</p>
                            <p className="text-xs" style={{ color: currentBg.textLight }}>{project.client_name || '取引先未設定'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium" style={{ color: currentBg.text }}>¥{(project.contract_amount || 0).toLocaleString()}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: project.status === '進行中' ? '#10B98120' : project.status === '受注' ? '#3B82F620' : '#94a3b820', color: project.status === '進行中' ? '#10B981' : project.status === '受注' ? '#3B82F6' : '#94a3b8' }}>{project.status || '未設定'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                      <FolderKanban size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">案件がありません</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 設定で有効なウィジェットを表示 */}
              {enabledWidgets.filter(id => {
                // 定義済みウィジェットのみ表示
                return dashboardWidgets.find(w => w.id === id)
              }).slice(0, 2).map(widgetId => {
                const widgetInfo = dashboardWidgets.find(w => w.id === widgetId)
                if (!widgetInfo) return null

                // 各ウィジェットの表示内容
                const widgetRoutes = {
                  projectList: '/sbase',
                  dantori: '/dantori',
                  expenseNew: '/expense/new',
                  analytics: '/analytics',
                  clients: '/clients',
                  businessCards: '/business-cards',
                  workers: '/workers',
                  dailyReport: '/daily-report',
                  kyManagement: '/ky',
                  photos: '/photos',
                  documents: '/documents',
                }

                return (
                  <div
                    key={widgetId}
                    className="rounded-xl p-5 mt-6 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                    }}
                    onClick={() => widgetRoutes[widgetId] && navigate(widgetRoutes[widgetId])}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold" style={{ color: currentBg.text }}>{widgetInfo.name}</h2>
                      <span className="text-sm" style={{ color: '#FF6B00' }}>開く →</span>
                    </div>
                    <div className="text-center py-4" style={{ color: currentBg.textLight }}>
                      <p className="text-sm">クリックして{widgetInfo.name}を開く</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 右カラム */}
            <div className="col-span-1">
              {/* お知らせ */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold" style={{ color: currentBg.text }}>お知らせ</h2>
                  <button onClick={() => navigate('/notify')} className="text-sm" style={{ color: '#FF6B00' }}>すべて見る →</button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ background: isLightTheme ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">システム</span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: currentBg.text }}>S-BASE v2.0 リリース</p>
                    <p className="text-xs mt-1" style={{ color: currentBg.textLight }}>新機能追加されました</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: isLightTheme ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">重要</span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: currentBg.text }}>月末請求締め切り</p>
                    <p className="text-xs mt-1" style={{ color: currentBg.textLight }}>12/28までに提出</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: isLightTheme ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">お知らせ</span>
                    </div>
                    <p className="text-sm mt-2" style={{ color: currentBg.text }}>年末年始休業のお知らせ</p>
                    <p className="text-xs mt-1" style={{ color: currentBg.textLight }}>12/29〜1/3</p>
                  </div>
                </div>
              </div>

              {/* 天気予報 */}
              <div
                className="rounded-xl p-5 mt-6"
                style={{
                  background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                <h2 className="text-base font-semibold mb-4" style={{ color: currentBg.text }}>天気予報</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{weather ? getWeatherEmoji(weather.code) : '☀️'}</span>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: currentBg.text }}>{weather?.temp || 15}°C</p>
                      <p className="text-xs" style={{ color: currentBg.textLight }}>福岡市</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: currentBg.text }}>{dateStr}</p>
                    <p className="text-xs" style={{ color: currentBg.textLight }}>現場作業日和</p>
                  </div>
                </div>
              </div>

              {/* 設定で有効な追加ウィジェット */}
              {enabledWidgets.filter(id => {
                return dashboardWidgets.find(w => w.id === id)
              }).slice(2, 4).map(widgetId => {
                const widgetInfo = dashboardWidgets.find(w => w.id === widgetId)
                if (!widgetInfo) return null

                const widgetRoutes = {
                  projectList: '/sbase',
                  dantori: '/dantori',
                  expenseNew: '/expense/new',
                  analytics: '/analytics',
                }

                return (
                  <div
                    key={widgetId}
                    className="rounded-xl p-5 mt-6 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: isLightTheme ? '#ffffff' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                    }}
                    onClick={() => widgetRoutes[widgetId] && navigate(widgetRoutes[widgetId])}
                  >
                    <h2 className="text-base font-semibold mb-2" style={{ color: currentBg.text }}>{widgetInfo.name}</h2>
                    <p className="text-sm" style={{ color: currentBg.textLight }}>クリックして開く</p>
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* モバイル用コンテンツ */}
        <main className="md:hidden px-4 pt-6 pb-24">
          <div className="grid grid-cols-2 gap-3 justify-items-center">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} themeStyle={currentBg} />
            ))}
          </div>
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs" style={{ color: currentBg.textLight }}>メニューをタップして各機能へ</p>
          </motion.div>
        </main>
      </div>

    </div>
  )
}
