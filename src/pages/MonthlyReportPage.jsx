import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, Wallet, FileText, Download } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { SummaryCardSkeleton, ListSkeleton } from '../components/ui/Skeleton'
import { api } from '../utils/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function MonthlyReportPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    fetchData()
  }, [yearMonth])

  const fetchData = async () => {
    setLoading(true)
    const ymStr = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`
    try {
      const [summaryRes, projectsRes] = await Promise.all([
        api.get(`/reports/monthly-summary?year_month=${ymStr}`),
        api.get(`/reports/project-list?year_month=${ymStr}`)
      ])

      if (summaryRes.success !== false) setSummary(summaryRes.data || summaryRes)
      if (projectsRes.success !== false) setProjects(projectsRes.data || projectsRes || [])
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
    setYearMonth(prev => {
      let newMonth = prev.month + delta
      let newYear = prev.year
      if (newMonth < 1) {
        newMonth = 12
        newYear--
      } else if (newMonth > 12) {
        newMonth = 1
        newYear++
      }
      return { year: newYear, month: newMonth }
    })
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億`
    if (amount >= 10000) return `${Math.round(amount / 10000)}万`
    return amount?.toLocaleString() || '0'
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const ymStr = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`
      const result = await api.download(
        `/reports/monthly-export?year_month=${ymStr}`,
        `monthly_report_${ymStr}.pdf`
      )
      if (result.success) {
        showToast('帳票を出力しました', 'success')
      } else {
        showToast(`エラー: ${result.error || '出力に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 出力に失敗しました', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="月次帳票"
        icon="📊"
        gradient="from-teal-700 to-teal-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
          >
            {exporting ? '...' : <Download size={18} />}
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* 月選択 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-xl font-bold">
            {yearMonth.year}年{yearMonth.month}月
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 損益サマリー */}
        <SectionTitle>📈 損益サマリー</SectionTitle>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-teal-400" />
              <span className="font-bold">損益</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">売上</div>
                <div className="text-lg font-bold text-teal-400">
                  ¥{formatAmount(summary?.total_income || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">原価</div>
                <div className="text-lg font-bold text-red-400">
                  ¥{formatAmount(summary?.total_expense || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">粗利</div>
                <div className="text-lg font-bold text-emerald-400">
                  ¥{formatAmount(summary?.gross_profit || 0)}
                </div>
                <div className="text-xs text-emerald-400">
                  ({((summary?.gross_profit || 0) / Math.max(summary?.total_income || 1, 1) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>

            {/* 粗利バー */}
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(((summary?.gross_profit || 0) / Math.max(summary?.total_income || 1, 1) * 100), 100)}%`
                }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
              />
            </div>
          </Card>
        )}

        {/* キャッシュフロー */}
        <SectionTitle>💰 キャッシュフロー</SectionTitle>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={18} className="text-teal-400" />
              <span className="font-bold">入出金</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">入金予定</div>
                <div className="text-lg font-bold text-emerald-400">
                  ¥{formatAmount(summary?.receivables || summary?.total_income || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">支払予定</div>
                <div className="text-lg font-bold text-red-400">
                  ¥{formatAmount(summary?.payables || summary?.total_expense || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <div className="text-xs text-slate-400 mb-1">収支</div>
                <div className={`text-lg font-bold ${
                  (summary?.net_cashflow || summary?.gross_profit || 0) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}>
                  ¥{formatAmount(summary?.net_cashflow || summary?.gross_profit || 0)}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 進行中案件 */}
        <SectionTitle>📋 進行中案件（{projects.length}件）</SectionTitle>

        {loading ? (
          <ListSkeleton count={5} showHeader={false} />
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <div>案件がありません</div>
          </div>
        ) : (
          projects.slice(0, 10).map((project, i) => (
            <motion.div
              key={project.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{project.name}</div>
                    <div className="text-xs text-slate-400">{project.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-400">
                      ¥{formatAmount(project.amount)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                      project.status === '施工中' ? 'bg-emerald-500/20 text-emerald-400' :
                      project.status === '受注済み' ? 'bg-blue-500/20 text-blue-400' :
                      project.status === '完了' ? 'bg-slate-500/20 text-slate-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
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
