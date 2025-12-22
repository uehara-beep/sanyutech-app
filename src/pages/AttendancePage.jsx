import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'

const API_BASE = '/api'

export default function AttendancePage() {
  const navigate = useNavigate()
  const [attendances, setAttendances] = useState([])
  const [summary, setSummary] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('daily') // daily, summary
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7))
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    try {
      const [attendancesRes, summaryRes, workersRes] = await Promise.all([
        fetch(`${API_BASE}/attendances/`),
        fetch(`${API_BASE}/attendances/summary?month=${currentMonth}`),
        fetch(`${API_BASE}/workers/`),
      ])

      if (attendancesRes.ok) setAttendances(await attendancesRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (workersRes.ok) setWorkers(await workersRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId)
    return worker?.name || '不明'
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--'
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const changeMonth = (delta) => {
    const date = new Date(currentMonth + '-01')
    date.setMonth(date.getMonth() + delta)
    setCurrentMonth(date.toISOString().slice(0, 7))
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="勤怠集計"
        icon="📊"
        gradient="from-cyan-800 to-cyan-400"
        onBack={() => navigate('/')}
      />

      <div className="px-5 py-4">
        {/* 月選択 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            ←
          </button>
          <div className="text-xl font-bold">
            {new Date(currentMonth + '-01').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            →
          </button>
        </div>

        {/* タブ */}
        <div className="flex bg-app-bg-light p-1 mb-4 rounded-xl">
          {[
            { id: 'daily', label: '日別一覧' },
            { id: 'summary', label: '作業員別' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium ${
                activeTab === tab.id ? 'bg-app-primary text-white' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : activeTab === 'daily' ? (
          /* 日別一覧 */
          attendances.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <div>勤怠記録がありません</div>
            </div>
          ) : (
            attendances.map((att, i) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-app-primary/20 flex items-center justify-center text-lg">
                      👷
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">{getWorkerName(att.worker_id)}</span>
                        <span className="text-xs text-slate-400">{att.date}</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-emerald-400">出勤: {formatTime(att.check_in)}</span>
                        <span className="text-red-400">退勤: {formatTime(att.check_out)}</span>
                        {att.overtime_hours > 0 && (
                          <span className="text-amber-400">残業: {att.overtime_hours}h</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )
        ) : (
          /* 作業員別サマリー */
          <div>
            <SectionTitle>👷 作業員別集計</SectionTitle>
            {summary.length === 0 ? (
              // サマリーがない場合はダミーデータを表示
              workers.map((worker, i) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-app-primary/20 flex items-center justify-center text-lg">
                          👷
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{worker.name}</div>
                          <div className="text-[11px] text-slate-400">{worker.team || '未配属'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-app-primary">0</div>
                        <div className="text-[10px] text-slate-400">出勤日数</div>
                      </div>
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-amber-400">0h</div>
                        <div className="text-[10px] text-slate-400">残業時間</div>
                      </div>
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-emerald-400">¥0</div>
                        <div className="text-[10px] text-slate-400">人件費</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              summary.map((s, i) => (
                <motion.div
                  key={s.worker_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-app-primary/20 flex items-center justify-center text-lg">
                          👷
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{getWorkerName(s.worker_id)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-app-primary">{s.work_days || 0}</div>
                        <div className="text-[10px] text-slate-400">出勤日数</div>
                      </div>
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-amber-400">{s.total_overtime || 0}h</div>
                        <div className="text-[10px] text-slate-400">残業時間</div>
                      </div>
                      <div className="bg-app-bg p-2 rounded-lg">
                        <div className="text-lg font-bold text-emerald-400">¥{(s.total_cost || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">人件費</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
