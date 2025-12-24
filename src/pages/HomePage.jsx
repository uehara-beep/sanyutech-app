import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAppStore, useThemeStore } from '../store'
import {
  BarChart3, Wrench, AlertTriangle, Calendar, FileText,
  DollarSign, Package, CreditCard, CheckCircle, Car,
  Settings, Bell, Cloud, Phone, ClipboardList, Users,
  ShoppingCart, QrCode, FileEdit, Search, HelpCircle,
  Camera, Clock, MapPin, Image, FileCheck, Shield,
  MessagesSquare, TrendingUp, Contact2, Home, ChevronRight
} from 'lucide-react'
import { API_BASE } from '../config/api'

// アプリ定義（モダンUI用）
const mainApps = [
  { id: 'sbase', name: 'S-BASE', subtitle: '原価管理', icon: BarChart3, emoji: '📊', color: 'bg-orange-500', path: '/sbase' },
  { id: 'dantori', name: '段取りくん', subtitle: '工程管理', icon: Wrench, emoji: '🔧', color: 'bg-emerald-500', path: '/dantori' },
  { id: 'ky', name: 'KY管理', subtitle: '安全管理', icon: AlertTriangle, emoji: '⚠️', color: 'bg-red-500', path: '/ky' },
  { id: 'schedule', name: '年間工程', subtitle: 'スケジュール', icon: Calendar, emoji: '📅', color: 'bg-purple-500', path: '/schedule' },
]

const officeApps = [
  { id: 'quotes', name: '見積書', subtitle: '受注まで一括', icon: FileText, emoji: '📝', color: 'bg-orange-500', path: '/quotes' },
  { id: 'invoice', name: '請求書AI', subtitle: '自動読取', icon: FileText, emoji: '📄', color: 'bg-amber-500', path: '/invoice' },
  { id: 'price', name: '単価マスタ', subtitle: '価格管理', icon: DollarSign, emoji: '💰', color: 'bg-yellow-500', path: '/price-master' },
  { id: 'inventory', name: '在庫管理', subtitle: '資材管理', icon: Package, emoji: '📦', color: 'bg-sky-500', path: '/inventory' },
  { id: 'expense', name: '経費精算', subtitle: '精算申請', icon: CreditCard, emoji: '💳', color: 'bg-violet-500', path: '/expense' },
]

const siteApps = [
  { id: 'weather', name: '天気予報', icon: Cloud, emoji: '🌤️', color: 'bg-cyan-500', path: '/weather' },
  { id: 'photos', name: '工事写真', icon: Image, emoji: '📷', color: 'bg-rose-500', path: '/photos' },
  { id: 'drawings', name: '図面管理', icon: FileEdit, emoji: '📐', color: 'bg-teal-500', path: '/drawings' },
  { id: 'inspections', name: '検査管理', icon: FileCheck, emoji: '✅', color: 'bg-amber-500', path: '/inspections' },
  { id: 'safety', name: '安全書類', icon: Shield, emoji: '🛡️', color: 'bg-green-500', path: '/safety' },
  { id: 'chat', name: 'チャット', icon: MessagesSquare, emoji: '💬', color: 'bg-purple-500', path: '/chat' },
  { id: 'hotel', name: 'ホテル検索', icon: Home, emoji: '🏨', color: 'bg-blue-500', path: '/hotel' },
]

const manageApps = [
  { id: 'car', name: '車両管理', icon: Car, emoji: '🚗', color: 'bg-gray-500', path: '/car' },
  { id: 'equipment', name: '機材管理', icon: Settings, emoji: '🔩', color: 'bg-orange-600', path: '/equipment' },
  { id: 'subcon', name: '協力会社', icon: Users, emoji: '👥', color: 'bg-yellow-500', path: '/subcon' },
  { id: 'cards', name: '名刺', icon: Contact2, emoji: '📇', color: 'bg-purple-500', path: '/business-cards' },
  { id: 'order', name: '資材発注', icon: ShoppingCart, emoji: '🛒', color: 'bg-indigo-500', path: '/order' },
  { id: 'attendance', name: '勤怠集計', icon: Clock, emoji: '⏰', color: 'bg-pink-500', path: '/attendance' },
]

const otherApps = [
  { id: 'analytics', name: '経営分析', icon: TrendingUp, emoji: '📈', path: '/analytics' },
  { id: 'settings', name: '設定', icon: Settings, emoji: '⚙️', path: '/settings' },
  { id: 'search', name: '検索', icon: Search, emoji: '🔍', path: '/search' },
  { id: 'calendar', name: 'カレンダー', icon: Calendar, emoji: '📆', path: '/calendar' },
  { id: 'qr', name: 'QR打刻', icon: QrCode, emoji: '📱', path: '/qr' },
  { id: 'help', name: '使い方', icon: HelpCircle, emoji: '❓', path: '/help' },
]

// モダンカードコンポーネント（ダークテーマ）
function ModernCard({ app, size = 'normal' }) {
  const navigate = useNavigate()
  const Icon = app.icon

  if (size === 'large') {
    return (
      <motion.div
        className="bg-[#2c2c2e] rounded-2xl shadow-lg p-4 cursor-pointer border border-[#3c3c3e]"
        onClick={() => navigate(app.path)}
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -2, backgroundColor: '#3c3c3e' }}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${app.color} rounded-xl flex items-center justify-center shadow-lg`}>
            <span className="text-2xl text-white">{app.emoji}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">{app.name}</h3>
            <p className="text-sm text-gray-400">{app.subtitle}</p>
          </div>
          <ChevronRight size={20} className="text-gray-500" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-[#2c2c2e] rounded-xl shadow-lg p-3 cursor-pointer text-center border border-[#3c3c3e]"
      onClick={() => navigate(app.path)}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2, backgroundColor: '#3c3c3e' }}
    >
      <div className={`w-12 h-12 ${app.color || 'bg-gray-600'} rounded-xl mx-auto mb-2 flex items-center justify-center shadow-md`}>
        <span className="text-xl">{app.emoji}</span>
      </div>
      <div className="text-xs font-medium text-white">{app.name}</div>
      {app.subtitle && <div className="text-[10px] text-gray-400">{app.subtitle}</div>}
    </motion.div>
  )
}

// ミニカード（ダークテーマ）
function MiniCard({ app }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="bg-[#2c2c2e] rounded-lg shadow-lg p-2.5 cursor-pointer text-center border border-[#3c3c3e]"
      onClick={() => navigate(app.path)}
      whileTap={{ scale: 0.95 }}
      whileHover={{ backgroundColor: '#3c3c3e' }}
    >
      <div className="text-xl mb-1">{app.emoji}</div>
      <div className="text-[10px] font-medium text-gray-300">{app.name}</div>
    </motion.div>
  )
}

// セクションタイトル（ダークテーマ）
function SectionTitle({ children }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h3 className="text-sm font-bold text-white">{children}</h3>
    </div>
  )
}

// ステータスカード（ダークテーマ）
function StatusCard({ value, label, color, onClick }) {
  // CSS変数かTailwindクラスかを判定
  const isVar = color?.startsWith('var(')
  return (
    <motion.div
      className="bg-[#2c2c2e] rounded-xl shadow-lg p-4 text-center cursor-pointer border border-[#3c3c3e]"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2, backgroundColor: '#3c3c3e' }}
    >
      <div
        className={`text-2xl font-bold ${isVar ? '' : color}`}
        style={isVar ? { color } : {}}
      >
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </motion.div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { unreadCount } = useAppStore()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()
  const [dashboard, setDashboard] = useState(null)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${'日月火水木金土'[today.getDay()]}）`

  // ダッシュボードデータを取得
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, approvalRes, inventoryRes, projectsRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/summary`),
          fetch(`${API_BASE}/approvals/count`),
          fetch(`${API_BASE}/inventory/alerts`),
          fetch(`${API_BASE}/projects/`)
        ])
        if (dashRes.ok) {
          setDashboard(await dashRes.json())
        }
        if (approvalRes.ok) {
          const data = await approvalRes.json()
          setPendingApprovals(data.count || 0)
        }
        if (inventoryRes.ok) {
          const data = await inventoryRes.json()
          setLowStockCount(Array.isArray(data) ? data.length : 0)
        }
        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjectCount(Array.isArray(data) ? data.filter(p => p.status === '施工中').length : 0)
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      }
    }
    fetchDashboard()
  }, [])

  return (
    <div className="min-h-screen pb-28 bg-[#1c1c1e]">
      {/* ダークヘッダー（テーマカラーアクセント） */}
      <header className="bg-[#1c1c1e] border-b border-[#3c3c3e] sticky top-0 z-50">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
            >
              <span className="text-lg">🏗️</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">サンユウテック</h1>
              <p className="text-[10px] text-gray-400">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              className="w-10 h-10 bg-[#2c2c2e] rounded-xl flex items-center justify-center relative border border-[#3c3c3e]"
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notify')}
            >
              <Bell size={20} className="text-gray-300" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {unreadCount}
                </span>
              )}
            </motion.button>
            <motion.button
              className="w-10 h-10 bg-[#2c2c2e] rounded-xl flex items-center justify-center border border-[#3c3c3e]"
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
            >
              <Settings size={20} className="text-gray-300" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* 撮影ステーションバナー（テーマカラーグラデーション） */}
      <motion.div
        className="mx-4 mt-4 p-4 rounded-2xl shadow-xl cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
        onClick={() => navigate('/scan')}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Camera size={28} className="text-white" />
          </div>
          <div className="flex-1 text-white">
            <div className="text-lg font-bold">撮影ステーション</div>
            <div className="text-xs opacity-90">書類をAIが自動仕分け・データ化</div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ChevronRight size={20} className="text-white" />
          </div>
        </div>
      </motion.div>

      {/* クイックステータス */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-4">
        <StatusCard
          value={projectCount}
          label="進行中現場"
          color="text-emerald-500"
          onClick={() => navigate('/sbase')}
        />
        <StatusCard
          value={pendingApprovals}
          label="承認待ち"
          color="var(--primary)"
          onClick={() => navigate('/approve')}
        />
        <StatusCard
          value={lowStockCount}
          label="在庫少"
          color="text-red-500"
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* 経営サマリー（ダークテーマ） */}
      {dashboard && (
        <motion.div
          className="mx-4 mt-4 p-4 bg-[#2c2c2e] rounded-2xl shadow-lg cursor-pointer border border-[#3c3c3e]"
          onClick={() => navigate('/analytics')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-bold text-white">今期実績</span>
            </div>
            <span className="text-xs text-gray-400">詳細を見る →</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1c1c1e] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">受注高</div>
              <div className="text-sm font-bold text-white">
                {dashboard.total_order ? `${Math.round(dashboard.total_order / 10000).toLocaleString()}万` : '0'}
              </div>
            </div>
            <div className="bg-[#1c1c1e] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">粗利</div>
              <div className={`text-sm font-bold ${dashboard.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dashboard.total_profit ? `${dashboard.total_profit >= 0 ? '+' : ''}${Math.round(dashboard.total_profit / 10000).toLocaleString()}万` : '0'}
              </div>
            </div>
            <div className="bg-[#1c1c1e] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-400">粗利率</div>
              <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                {dashboard.total_order > 0
                  ? `${Math.round((dashboard.total_profit / dashboard.total_order) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* メインアプリ */}
      <div className="px-4 mt-6">
        <SectionTitle>⭐ メインアプリ</SectionTitle>
        <div className="space-y-3">
          {mainApps.map((app) => (
            <ModernCard key={app.id} app={app} size="large" />
          ))}
        </div>
      </div>

      {/* 経理・事務 */}
      <div className="px-4 mt-6">
        <SectionTitle>💼 経理・事務</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {officeApps.map((app) => (
            <ModernCard key={app.id} app={app} />
          ))}
        </div>
      </div>

      {/* 現場管理 */}
      <div className="px-4 mt-6">
        <SectionTitle>🏗️ 現場管理</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {siteApps.map((app) => (
            <ModernCard key={app.id} app={app} />
          ))}
        </div>
      </div>

      {/* 管理 */}
      <div className="px-4 mt-6">
        <SectionTitle>🔧 管理</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {manageApps.map((app) => (
            <ModernCard key={app.id} app={app} />
          ))}
        </div>
      </div>

      {/* その他 */}
      <div className="px-4 mt-6 mb-6">
        <SectionTitle>📌 その他</SectionTitle>
        <div className="grid grid-cols-6 gap-2">
          {otherApps.map((app) => (
            <MiniCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </div>
  )
}
