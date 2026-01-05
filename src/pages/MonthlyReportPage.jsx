import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function MonthlyReportPage() {
  const navigate = useNavigate()
  const { backgroundId, getCurrentTheme } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const theme = getCurrentTheme()
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'

  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [yearMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [summaryRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/reports/monthly-summary?year_month=${yearMonth}`),
        fetch(`${API_BASE}/reports/project-list?year_month=${yearMonth}`)
      ])

      if (summaryRes.ok) {
        setSummary(await summaryRes.json())
      }
      if (projectsRes.ok) {
        setProjects(await projectsRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (delta) => {
    const [year, month] = yearMonth.split('-').map(Number)
    let newYear = year
    let newMonth = month + delta
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    setYearMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億`
    if (amount >= 10000) return `${Math.round(amount / 10000)}万`
    return amount?.toLocaleString() || '0'
  }

  const [year, month] = yearMonth.split('-')

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      {/* ヘッダー */}
      <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }} className="p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">月次帳票</h1>
        </div>

        {/* 月選択 */}
        <div className="flex items-center justify-center mt-4 gap-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-2xl font-bold text-white">
            {year}年{month}月
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full bg-white/20">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* 売上・原価・粗利 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: theme.primary }} />
              <span className="font-bold" style={{ color: currentBg.text }}>損益サマリー</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>売上</div>
                <div className="text-lg font-bold" style={{ color: theme.primary }}>
                  ¥{formatAmount(summary?.sales || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>原価</div>
                <div className="text-lg font-bold text-red-400">
                  ¥{formatAmount(summary?.costs || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>粗利</div>
                <div className="text-lg font-bold text-emerald-400">
                  ¥{formatAmount(summary?.gross_profit || 0)}
                </div>
                <div className="text-xs text-emerald-400">
                  ({summary?.gross_profit_rate || 0}%)
                </div>
              </div>
            </div>
          </motion.div>

          {/* キャッシュフロー */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={18} style={{ color: theme.primary }} />
              <span className="font-bold" style={{ color: currentBg.text }}>キャッシュフロー</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>入金予定</div>
                <div className="text-lg font-bold text-emerald-400">
                  ¥{formatAmount(summary?.receivables || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>支払予定</div>
                <div className="text-lg font-bold text-red-400">
                  ¥{formatAmount(summary?.payables || 0)}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}>
                <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>収支</div>
                <div className={`text-lg font-bold ${(summary?.net_cashflow || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ¥{formatAmount(summary?.net_cashflow || 0)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 案件サマリー */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} style={{ color: theme.primary }} />
                <span className="font-bold" style={{ color: currentBg.text }}>進行中案件</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: theme.primary }}>
                {summary?.active_projects || 0}件
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-6" style={{ color: currentBg.textLight }}>
                案件がありません
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projects.slice(0, 10).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: currentBg.text }}>
                        {project.name}
                      </div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        {project.client}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: theme.primary }}>
                        ¥{formatAmount(project.amount)}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                        project.status === '施工中' ? 'bg-emerald-500/20 text-emerald-400' :
                        project.status === '受注済み' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {project.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
