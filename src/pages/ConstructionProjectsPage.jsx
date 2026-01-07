import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card } from '../components/common'
import { API_BASE, authGet } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const STATUS_COLORS = {
  '進行中': 'bg-blue-500/20 text-blue-400',
  '完了': 'bg-green-500/20 text-green-400',
}

export default function ConstructionProjectsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [statusFilter])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const data = await authGet(`${API_BASE}/construction/projects?${params}`)
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return `¥${value.toLocaleString()}`
  }

  const formatRate = (value) => {
    if (!value && value !== 0) return '-'
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="工事管理"
        icon="🏗️"
        gradient="from-orange-600 to-orange-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
              !statusFilter ? 'bg-orange-500/20 text-orange-400' : ''
            }`}
            style={statusFilter ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            すべて
          </button>
          <button
            onClick={() => setStatusFilter('進行中')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
              statusFilter === '進行中' ? 'bg-blue-500/20 text-blue-400' : ''
            }`}
            style={statusFilter !== '進行中' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            進行中
          </button>
          <button
            onClick={() => setStatusFilter('完了')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
              statusFilter === '完了' ? 'bg-green-500/20 text-green-400' : ''
            }`}
            style={statusFilter !== '完了' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            完了
          </button>
        </div>

        {/* 工事一覧 */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">🏗️</div>
            <div className="text-lg mb-1">工事がありません</div>
            <div className="text-xs">見積を受注すると工事が自動作成されます</div>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/construction/projects/${project.id}`)}
              >
                <Card className="cursor-pointer hover:opacity-80">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏗️</span>
                      <div>
                        <div className="font-bold text-sm" style={{ color: currentBg.text }}>{project.name}</div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>{project.client || '-'}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[project.status] || 'bg-slate-500/20 text-slate-400'}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* 数値情報 */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg p-2" style={{ background: inputBg }}>
                      <div className="text-[10px] mb-1" style={{ color: currentBg.textLight }}>受注金額</div>
                      <div className="text-xs font-bold" style={{ color: currentBg.text }}>{formatCurrency(project.contract_amount)}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: inputBg }}>
                      <div className="text-[10px] mb-1" style={{ color: currentBg.textLight }}>予定粗利</div>
                      <div className="text-xs font-bold text-blue-400">
                        {formatCurrency(project.planned_profit_amount)}
                        <span className="text-[10px] ml-1">({formatRate(project.planned_profit_rate)})</span>
                      </div>
                    </div>
                    <div className="rounded-lg p-2" style={{ background: inputBg }}>
                      <div className="text-[10px] mb-1" style={{ color: currentBg.textLight }}>実績粗利</div>
                      <div className={`text-xs font-bold ${(project.actual_profit_amount ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(project.actual_profit_amount ?? 0)}
                      </div>
                    </div>
                  </div>

                  {/* 進捗バー */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: currentBg.textLight }}>
                      <span>原価: {formatCurrency(project.actual_cost_total)}</span>
                      <span>出来高: {formatCurrency(project.progress_total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: inputBg }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
                        style={{
                          width: `${Math.min((project.progress_total / (project.contract_amount || 1)) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
