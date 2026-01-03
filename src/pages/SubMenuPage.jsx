import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  ArrowLeft, ChevronRight,
  // 営業
  FilePlus, FolderOpen, FileSpreadsheet, Users, Trophy, Briefcase, CreditCard, CalendarDays,
  // 工事
  Calendar, HardHat, FileEdit, AlertTriangle, Camera, FileText, MapPin,
  Cloud, List as ListIcon, Package, Car, User, ClipboardEdit,
  // 事務
  Receipt, List, Bot, DollarSign, CheckCircle, Building,
  // 経営
  BarChart3,
  // カテゴリ用
  ClipboardList,
  // 設定
  Settings, UserCog
} from 'lucide-react'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles, useAuthStore } from '../store'

// 浅瀬の海背景（オーシャンテーマ用）
function OceanBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 100px 80px at 20% 15%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80px 65px at 75% 25%, rgba(255,255,255,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 90px 70px at 35% 60%, rgba(255,255,255,0.05) 0%, transparent 60%)
          `,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

// カテゴリ定義（Lucide Icons使用、S-BASE追加）
const categories = {
  sales: {
    title: '営業',
    description: '現場台帳・顧客管理',
    color: '#3A6AAF',
    icon: ClipboardList,
    sections: [
      {
        title: '現場台帳',
        items: [
          { name: '現場台帳', description: '見積〜完工まで一元管理', path: '/quotes', icon: FolderOpen, badge: 'NEW' },
          { name: '新規案件', description: '見積書を新規作成', path: '/quotes/new', icon: FilePlus },
          { name: 'Excel取込', description: '過去見積の再利用', path: '/quotes/import', icon: FileSpreadsheet },
        ]
      },
      {
        title: '顧客管理',
        items: [
          { name: '顧客管理', description: '元請け・発注者の管理', path: '/clients', icon: Users },
          { name: '顧客別ランキング', description: '受注分析', path: '/clients/ranking', icon: Trophy },
          { name: '名刺管理', description: '写真読み込み・保管（表裏対応）', path: '/business-cards', icon: CreditCard },
        ]
      },
      {
        title: '営業活動',
        items: [
          { name: '営業スケジュール', description: '商談・訪問予定', path: '/sales-schedule', icon: CalendarDays },
        ]
      },
    ]
  },
  construction: {
    title: '工事',
    description: '現場・安全・S-BASE',
    color: '#3D9968',
    icon: HardHat,
    sections: [
      {
        title: '段取りくん',
        items: [
          { name: '配置管理', description: '日別・週間の現場配置', path: '/dantori', icon: Calendar },
          { name: '作業員管理', description: '社員・協力会社', path: '/workers', icon: User },
          { name: '日報入力', description: '作業報告', path: '/daily-report', icon: ClipboardEdit, badgeType: 'dailyReportConfirmation' },
        ]
      },
      {
        title: '安全管理',
        items: [
          { name: 'KY管理', description: '危険予知活動', path: '/ky', icon: AlertTriangle },
        ]
      },
      {
        title: '現場情報',
        items: [
          { name: '工事写真', description: '電子黒板対応', path: '/photos', icon: Camera },
          { name: '書類管理', description: '元請けPDF保存・閲覧', path: '/documents', icon: FileText },
          { name: '現場位置', description: 'Googleマップ連携', path: '/sites', icon: MapPin },
        ]
      },
      {
        title: 'その他',
        items: [
          { name: '天気予報', description: '14日間予報', path: '/weather', icon: Cloud },
          { name: '年間工程', description: 'ガントチャート', path: '/schedule', icon: ListIcon },
          { name: '在庫管理', description: '部材・消耗品', path: '/inventory', icon: Package },
          { name: '材料伝票', description: '廃材・建材・産廃', path: '/material-slip', icon: FileText },
          { name: '車両管理', description: '車検・給油記録', path: '/car', icon: Car },
        ]
      },
      {
        title: '現場台帳',
        items: [
          { name: '現場台帳', description: '工種・原価・出来高', path: '/quotes', icon: Briefcase },
        ]
      }
    ]
  },
  office: {
    title: '事務',
    description: '経費・請求管理',
    color: '#7A5A9D',
    icon: FileText,
    sections: [
      {
        title: '経費精算',
        items: [
          { name: '経費申請', description: 'レシート撮影→OCR', path: '/expense/new', icon: Receipt },
          { name: '経費一覧', description: '月次集計・Excel出力', path: '/expense', icon: List },
        ]
      },
      {
        title: '請求・入出金',
        items: [
          { name: '請求書AI', description: 'PDF読取・自動仕分け', path: '/invoice', icon: Bot, badge: 'NEW' },
          { name: '入金管理', description: '入金予定・消込', path: '/income', icon: DollarSign },
          { name: '支払管理', description: '支払予定・協力会社', path: '/expense-pay', icon: DollarSign },
        ]
      },
      {
        title: '承認',
        items: [
          { name: '承認センター', description: '全申請をまとめて承認', path: '/approve', icon: CheckCircle, badgeType: 'approval' },
        ]
      },
      {
        title: 'マスタ',
        items: [
          { name: '業者マスタ', description: '協力会社情報', path: '/subcon', icon: Building },
        ]
      }
    ]
  },
  management: {
    title: '経営',
    description: 'ダッシュボード',
    color: '#C4823B',
    icon: BarChart3,
    sections: [
      {
        title: 'ダッシュボード',
        items: [
          { name: '経営ダッシュボード', description: '売上・粗利・推移グラフ', path: '/analytics', icon: BarChart3 },
        ]
      }
    ]
  },
  settings: {
    title: '設定',
    description: 'マスタ・システム設定',
    color: '#6B7280',
    icon: Settings,
    sections: [
      {
        title: 'マスタ管理',
        items: [
          { name: '社員マスタ', description: '全社員を管理・LINE WORKSインポート', path: '/settings/employees', icon: UserCog, badge: 'NEW' },
          { name: '業者マスタ', description: '協力会社情報', path: '/subcon', icon: Building },
        ]
      },
      {
        title: 'システム',
        items: [
          { name: 'テーマ設定', description: '背景・カラー変更', path: '/settings', icon: Settings },
        ]
      }
    ]
  }
}

// メニューアイテムコンポーネント
function MenuItem({ item, pendingApprovals, pendingDailyReportConfirmations, themeStyle }) {
  const navigate = useNavigate()
  const Icon = item.icon
  const isOcean = themeStyle?.hasOceanEffect
  const isLightTheme = !isOcean && themeStyle?.text === '#333333'

  return (
    <motion.div
      className="flex items-center py-3.5 px-4 cursor-pointer rounded-xl mb-2"
      style={{
        background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.5)',
        border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
        backdropFilter: isOcean ? 'blur(10px)' : 'none',
      }}
      onClick={() => navigate(item.path)}
      whileTap={{ scale: 0.98 }}
      whileHover={{ x: 4 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mr-3"
        style={{
          background: isOcean ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <Icon
          size={18}
          strokeWidth={1.5}
          style={{ color: isOcean ? 'rgba(255,255,255,0.9)' : '#666' }}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-normal"
            style={{ color: themeStyle?.text }}
          >
            {item.name}
          </span>
          {item.badge && (
            <span className="px-2 py-0.5 bg-[#ff6b35] text-white text-[10px] font-medium rounded-full">
              {item.badge}
            </span>
          )}
          {item.badgeType === 'approval' && pendingApprovals > 0 && (
            <span className="px-2 py-0.5 bg-[#ff6b35] text-white text-[10px] font-medium rounded-full min-w-[20px] text-center">
              {pendingApprovals}
            </span>
          )}
          {item.badgeType === 'dailyReportConfirmation' && pendingDailyReportConfirmations > 0 && (
            <span className="px-2 py-0.5 bg-[#10b981] text-white text-[10px] font-medium rounded-full min-w-[20px] text-center">
              {pendingDailyReportConfirmations}
            </span>
          )}
        </div>
        {item.description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: themeStyle?.textLight }}
          >
            {item.description}
          </p>
        )}
      </div>
      <ChevronRight
        size={16}
        strokeWidth={1.5}
        style={{ color: isOcean ? 'rgba(255,255,255,0.5)' : '#aaa' }}
      />
    </motion.div>
  )
}

// セクションコンポーネント
function MenuSection({ section, pendingApprovals, pendingDailyReportConfirmations, themeStyle }) {
  return (
    <div className="mb-6">
      {section.title && (
        <div
          className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: themeStyle?.textLight }}
        >
          {section.title}
        </div>
      )}
      <div>
        {section.items.map((item, idx) => (
          <MenuItem key={idx} item={item} pendingApprovals={pendingApprovals} pendingDailyReportConfirmations={pendingDailyReportConfirmations} themeStyle={themeStyle} />
        ))}
      </div>
    </div>
  )
}

export default function SubMenuPage() {
  const navigate = useNavigate()
  const { category } = useParams()
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [pendingDailyReportConfirmations, setPendingDailyReportConfirmations] = useState(0)
  const { backgroundId } = useThemeStore()
  const { token } = useAuthStore()

  const categoryData = categories[category]
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const showOceanEffect = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const res = await fetch(`${API_BASE}/approvals/count`)
        if (res.ok) {
          const data = await res.json()
          setPendingApprovals(data.count || 0)
        }
      } catch (e) {
        console.error('Failed to fetch approvals:', e)
      }
    }

    const fetchDailyReportConfirmations = async () => {
      if (!token) return

      try {
        const res = await fetch(`${API_BASE}/daily-reports/pending-confirmations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPendingDailyReportConfirmations(data.length || 0)
        }
      } catch (e) {
        console.error('Failed to fetch daily report confirmations:', e)
      }
    }

    fetchApprovals()
    fetchDailyReportConfirmations()
  }, [token])

  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <p style={{ color: currentBg.textLight }}>カテゴリが見つかりません</p>
      </div>
    )
  }

  const CategoryIcon = categoryData.icon

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: currentBg.bg }}>
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
        <div className="flex items-center gap-3.5 px-6 py-4">
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              background: showOceanEffect ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
            }}
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft
              size={20}
              strokeWidth={1.5}
              style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }}
            />
          </motion.button>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: showOceanEffect
                ? 'rgba(255,255,255,0.2)'
                : `linear-gradient(145deg, ${categoryData.color}, ${categoryData.color}dd)`,
            }}
          >
            <CategoryIcon size={20} className="text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2
              className="text-lg font-medium tracking-wide"
              style={{ color: currentBg.text }}
            >
              {categoryData.title}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: currentBg.textLight }}
            >
              {categoryData.description}
            </p>
          </div>
        </div>
      </header>

      {/* カテゴリカラーバー */}
      <div className="h-0.5" style={{ backgroundColor: categoryData.color, opacity: 0.6 }} />

      {/* メニューセクション */}
      <div className="px-6 pt-6 relative z-10">
        {categoryData.sections.map((section, idx) => (
          <MenuSection
            key={idx}
            section={section}
            pendingApprovals={pendingApprovals}
            pendingDailyReportConfirmations={pendingDailyReportConfirmations}
            themeStyle={currentBg}
          />
        ))}
      </div>
    </div>
  )
}
