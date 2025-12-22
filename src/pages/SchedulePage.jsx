import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'

const API_BASE = '/api'

export default function SchedulePage() {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const [schedules, setSchedules] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('year') // year, month, week
  const [toast, setToast] = useState({ show: false, message: '' })

  // 現在の年月
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // 月の配列
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schedulesRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/schedules/`),
        fetch(`${API_BASE}/projects`),
      ])

      if (schedulesRes.ok) setSchedules(await schedulesRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || '不明'
  }

  const getProjectInfo = (projectId) => {
    return projects.find(p => p.id === projectId) || {}
  }

  const calculatePosition = (schedule) => {
    if (!schedule.start_date || !schedule.end_date) return null

    const start = new Date(schedule.start_date)
    const end = new Date(schedule.end_date)

    // 年間ビューでの位置計算
    const startMonth = start.getMonth()
    const endMonth = end.getMonth()
    const startDay = start.getDate()
    const endDay = end.getDate()

    // 月の幅を基準に計算（1月 = 0%から始まる）
    const startPercent = (startMonth + startDay / 31) * (100 / 12)
    const endPercent = (endMonth + endDay / 31) * (100 / 12)
    const widthPercent = endPercent - startPercent

    return {
      left: `${startPercent}%`,
      width: `${Math.max(widthPercent, 2)}%`,
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getProgressColor = (rate) => {
    if (rate >= 80) return 'bg-emerald-500'
    if (rate >= 50) return 'bg-amber-500'
    return 'bg-blue-500'
  }

  // プロジェクトからスケジュールを生成（APIにない場合のフォールバック）
  const displaySchedules = schedules.length > 0 ? schedules : projects.map(p => ({
    id: p.id,
    project_id: p.id,
    start_date: p.period?.split('〜')[0] || '2024-04-01',
    end_date: p.period?.split('〜')[1] || '2025-03-31',
    progress_rate: p.progress || 0,
    color: '#3b82f6',
  }))

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="年間工程"
        icon="📆"
        gradient="from-purple-900 to-purple-500"
        onBack={() => navigate('/')}
      />

      <div className="px-5 py-4">
        {/* 表示切替 */}
        <div className="flex bg-app-bg-light p-1 mb-4 rounded-xl">
          {[
            { id: 'year', label: '年間' },
            { id: 'month', label: '月間' },
            { id: 'week', label: '週間' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium ${
                viewMode === mode.id ? 'bg-app-primary text-white' : 'text-slate-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* 年選択 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentYear(y => y - 1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            ←
          </button>
          <div className="text-xl font-bold">{currentYear}年</div>
          <button
            onClick={() => setCurrentYear(y => y + 1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : (
          <Card className="p-0 overflow-hidden">
            {/* 月ヘッダー */}
            <div className="flex border-b border-app-border">
              <div className="w-32 shrink-0 p-2 text-xs text-slate-400 border-r border-app-border">
                現場名
              </div>
              <div className="flex-1 flex overflow-x-auto" ref={scrollRef}>
                {months.map((month) => (
                  <div
                    key={month}
                    className="flex-1 min-w-12 p-2 text-center text-xs text-slate-400 border-r border-app-border last:border-r-0"
                  >
                    {month}月
                  </div>
                ))}
              </div>
            </div>

            {/* ガントチャート */}
            {displaySchedules.map((schedule, i) => {
              const project = getProjectInfo(schedule.project_id)
              const position = calculatePosition(schedule)

              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex border-b border-app-border last:border-b-0"
                >
                  <div className="w-32 shrink-0 p-2 text-xs border-r border-app-border">
                    <div className="font-semibold line-clamp-1">{project.name || getProjectName(schedule.project_id)}</div>
                    <div className="text-slate-400 text-[10px]">{project.client}</div>
                  </div>
                  <div className="flex-1 relative h-14">
                    {/* 月のグリッド */}
                    <div className="absolute inset-0 flex">
                      {months.map((month) => (
                        <div
                          key={month}
                          className="flex-1 border-r border-app-border/30 last:border-r-0"
                        />
                      ))}
                    </div>

                    {/* 進捗バー */}
                    {position && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center px-2"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: schedule.color || '#3b82f6',
                        }}
                      >
                        <div
                          className={`h-full rounded-full ${getProgressColor(schedule.progress_rate)}`}
                          style={{ width: `${schedule.progress_rate || 0}%` }}
                        />
                        <span className="absolute right-2 text-[10px] font-bold text-white">
                          {schedule.progress_rate || 0}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {displaySchedules.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">工程がありません</div>
              </div>
            )}
          </Card>
        )}

        {/* 凡例 */}
        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>~50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>50~80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>80%~</span>
          </div>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
