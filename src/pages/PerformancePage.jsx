import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Building, ChevronLeft, ChevronRight, Award } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton, SummaryCardSkeleton } from '../components/ui/Skeleton'
import { api } from '../utils/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function PerformancePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('staff') // staff, client
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  useEffect(() => {
    fetchData()
  }, [period, viewType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/performance/by-${viewType}?year=${period.year}&month=${period.month}`)
      if (res.success !== false) {
        setPerformanceData(res.data || res || [])
      }
    } catch (error) {
      showToast('データの取得に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const changeMonth = (delta) => {
    setPeriod(prev => {
      let newMonth = prev.month + delta
      let newYear = prev.year
      if (newMonth > 12) {
        newMonth = 1
        newYear++
      } else if (newMonth < 1) {
        newMonth = 12
        newYear--
      }
      return { year: newYear, month: newMonth }
    })
  }

  const totalSales = performanceData.reduce((sum, p) => sum + (p.total_sales || 0), 0)
  const totalProjects = performanceData.reduce((sum, p) => sum + (p.project_count || 0), 0)

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-amber-400'
    if (rank === 2) return 'text-slate-300'
    if (rank === 3) return 'text-amber-700'
    return 'text-slate-500'
  }

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}`
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="成績管理"
        icon="📊"
        gradient="from-purple-700 to-purple-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 月選択 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-bold">
            {period.year}年{period.month}月
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 集計タブ */}
        <div className="flex bg-slate-800/50 p-1 mb-4 rounded-xl">
          {[
            { id: 'staff', label: '担当者別', icon: Users },
            { id: 'client', label: '得意先別', icon: Building },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewType(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                viewType === tab.id ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* サマリー */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="text-center py-4">
              <TrendingUp className="mx-auto mb-2 text-emerald-400" size={24} />
              <div className="text-xs text-slate-400">総売上</div>
              <div className="text-xl font-bold text-emerald-400">
                ¥{totalSales.toLocaleString()}
              </div>
            </Card>
            <Card className="text-center py-4">
              <Award className="mx-auto mb-2 text-purple-400" size={24} />
              <div className="text-xs text-slate-400">工事件数</div>
              <div className="text-xl font-bold text-purple-400">
                {totalProjects}件
              </div>
            </Card>
          </div>
        )}

        <SectionTitle>
          {viewType === 'staff' ? '👷 担当者別成績' : '🏢 得意先別成績'}
        </SectionTitle>

        {loading ? (
          <ListSkeleton count={8} showHeader={false} />
        ) : performanceData.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <div>データがありません</div>
          </div>
        ) : (
          performanceData.map((item, i) => {
            const rank = i + 1
            const salesRatio = totalSales > 0 ? (item.total_sales / totalSales) * 100 : 0

            return (
              <motion.div
                key={item.target_id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-2xl font-bold ${getRankColor(rank)}`}>
                      {getRankEmoji(rank)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.target_name}</div>
                      <div className="text-xs text-slate-400">
                        {item.project_count}件の工事
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">
                        ¥{(item.total_sales || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        構成比 {salesRatio.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* 売上バー */}
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${salesRatio}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>

                  {/* 詳細指標 */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-slate-800/50 rounded-lg py-2">
                      <div className="text-sm font-bold text-blue-400">
                        ¥{Math.round((item.total_sales || 0) / Math.max(item.project_count || 1, 1)).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">件単価</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg py-2">
                      <div className="text-sm font-bold text-amber-400">
                        {item.gross_profit_rate?.toFixed(1) || '-'}%
                      </div>
                      <div className="text-[10px] text-slate-400">粗利率</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg py-2">
                      <div className="text-sm font-bold text-emerald-400">
                        {item.completion_rate?.toFixed(1) || '-'}%
                      </div>
                      <div className="text-[10px] text-slate-400">完了率</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}
