import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function SitePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [project, setProject] = useState(null)
  const [weather, setWeather] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [kyReports, setKyReports] = useState([])
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [projectRes, assignmentsRes, kyRes, costsRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${id}`),
        fetch(`${API_BASE}/assignments/?date=${today}`),
        fetch(`${API_BASE}/ky-reports/`),
        fetch(`${API_BASE}/costs/project/${id}`),
      ])

      if (projectRes.ok) {
        const p = await projectRes.json()
        setProject(p)

        // 天気情報取得
        if (p.latitude && p.longitude) {
          try {
            const weatherRes = await fetch(`${API_BASE}/weather?lat=${p.latitude}&lon=${p.longitude}`)
            if (weatherRes.ok) setWeather(await weatherRes.json())
          } catch {}
        }
      }

      if (assignmentsRes.ok) {
        const allAssignments = await assignmentsRes.json()
        setAssignments(allAssignments.filter(a => a.project_id === parseInt(id)))
      }

      if (kyRes.ok) {
        const allKy = await kyRes.json()
        setKyReports(allKy.filter(k => k.project_id === parseInt(id)))
      }

      if (costsRes.ok) setCosts(await costsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">⏳</div>
          <div>読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">❌</div>
          <div>現場が見つかりません</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title={project.name}
        icon="🏗️"
        gradient="from-emerald-900 to-emerald-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 基本情報 */}
        <Card className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-slate-400">元請け</div>
              <div className="text-sm font-semibold">{project.client}</div>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
              project.status === '施工中' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
            }`}>
              {project.status}
            </span>
          </div>

          {project.address && (
            <div className="mb-2">
              <div className="text-xs text-slate-400">住所</div>
              <div className="text-sm">{project.address}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-xs text-slate-400">工期</div>
              <div className="text-sm">{project.period || '未設定'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">現場代理人</div>
              <div className="text-sm">{project.site_person || '未設定'}</div>
            </div>
          </div>
        </Card>

        {/* 天気予報 */}
        {weather && (
          <>
            <SectionTitle>🌤️ 天気予報</SectionTitle>
            <Card className="mb-4">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-5xl">{weather.current?.icon || '☀️'}</div>
                <div>
                  <div className="text-2xl font-bold">{weather.current?.temp || '--'}°C</div>
                  <div className="text-sm text-slate-400">{weather.current?.condition || '不明'}</div>
                </div>
              </div>
              {weather.weekly && (
                <div className="flex gap-2 overflow-x-auto">
                  {weather.weekly.slice(0, 5).map((day, i) => (
                    <div key={i} className="flex-shrink-0 text-center bg-app-bg p-2 rounded-lg min-w-[60px]">
                      <div className="text-xs text-slate-400">{day.day}</div>
                      <div className="text-xl my-1">{day.icon}</div>
                      <div className="text-xs">{day.temp}°</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* 今日の配置 */}
        <SectionTitle>👷 今日の配置</SectionTitle>
        <Card className="mb-4">
          {assignments.length === 0 ? (
            <div className="text-center py-4 text-slate-400">
              <div className="text-xl mb-1">📭</div>
              <div className="text-sm">配置なし</div>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-2 border-b border-app-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-app-primary/20 flex items-center justify-center text-sm">
                    👷
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">作業員 #{a.worker_id}</div>
                    <div className="text-xs text-slate-400">
                      {a.start_time} - {a.end_time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* KY状況 */}
        <SectionTitle>⚠️ 今日のKY</SectionTitle>
        <Card className="mb-4">
          {kyReports.filter(k => k.date === new Date().toISOString().split('T')[0]).length === 0 ? (
            <div className="text-center py-4">
              <div className="text-amber-400 text-xl mb-1">⚠️</div>
              <div className="text-sm text-amber-400">KY未作成</div>
              <button
                onClick={() => navigate('/ky')}
                className="mt-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm"
              >
                KYを作成
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-emerald-400 text-xl mb-1">✅</div>
              <div className="text-sm text-emerald-400">KY作成済</div>
            </div>
          )}
        </Card>

        {/* 原価サマリー */}
        <SectionTitle>💰 原価サマリー</SectionTitle>
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-xs text-slate-400">受注金額</div>
              <div className="text-lg font-bold">¥{(project.order_amount || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">実績原価</div>
              <div className="text-lg font-bold text-app-primary">¥{totalCost.toLocaleString()}</div>
            </div>
          </div>

          <div className="h-2 bg-app-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                totalCost / (project.order_amount || 1) > 0.9 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((totalCost / (project.order_amount || 1)) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-right text-slate-400 mt-1">
            原価率: {((totalCost / (project.order_amount || 1)) * 100).toFixed(1)}%
          </div>
        </Card>

        {/* クイックアクション */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/ky')}
            className="py-4 bg-app-card rounded-xl text-center"
          >
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-xs">KY作成</div>
          </button>
          <button
            onClick={() => navigate('/dantori')}
            className="py-4 bg-app-card rounded-xl text-center"
          >
            <div className="text-2xl mb-1">👷</div>
            <div className="text-xs">段取り</div>
          </button>
          <button
            onClick={() => navigate(`/sbase/${id}`)}
            className="py-4 bg-app-card rounded-xl text-center"
          >
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs">原価管理</div>
          </button>
        </div>
      </div>
    </div>
  )
}
