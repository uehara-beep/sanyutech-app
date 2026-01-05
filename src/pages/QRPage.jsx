import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function QRPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [mode, setMode] = useState(null) // 'checkin' | 'checkout'
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        if (data.length > 0) setSelectedProject(data[0].id)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleScan = async (type) => {
    setMode(type)
    setScanning(true)

    // QRスキャンのシミュレーション
    setTimeout(async () => {
      try {
        const now = new Date().toISOString()
        const today = now.split('T')[0]

        const res = await fetch(`${API_BASE}/attendances/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worker_id: 1, // 現在のユーザー
            date: today,
            project_id: parseInt(selectedProject),
            check_in: type === 'checkin' ? now : null,
            check_out: type === 'checkout' ? now : null,
          }),
        })

        if (res.ok) {
          showToast(type === 'checkin' ? '出勤しました' : '退勤しました')
        }
      } catch (error) {
        showToast('エラーが発生しました')
      } finally {
        setScanning(false)
        setMode(null)
      }
    }, 1500)
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const now = new Date()
  const timeString = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  const dateString = now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="QR出退勤"
        icon="📱"
        gradient="from-slate-700 to-slate-400"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 現在時刻 */}
        <Card className="mb-6 text-center py-8">
          <div className="text-5xl font-bold mb-2">{timeString}</div>
          <div className="text-sm text-slate-400">{dateString}</div>
        </Card>

        {/* 現場選択 */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">現場を選択</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* QRスキャンエリア */}
        {scanning ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-app-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-bold mb-2">
                {mode === 'checkin' ? '出勤処理中...' : '退勤処理中...'}
              </div>
              <div className="text-sm text-slate-400">しばらくお待ちください</div>
            </Card>
          </motion.div>
        ) : (
          <div className="mb-6">
            <Card className="py-8 text-center border-2 border-dashed border-app-border">
              <div className="text-6xl mb-4">📷</div>
              <div className="text-sm text-slate-400 mb-2">QRコードをスキャン</div>
              <div className="text-xs text-slate-500">
                または下のボタンで直接打刻
              </div>
            </Card>
          </div>
        )}

        {/* 出退勤ボタン */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleScan('checkin')}
            disabled={scanning}
            className="py-6 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            <div className="text-3xl mb-2">🌅</div>
            <div>出勤</div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleScan('checkout')}
            disabled={scanning}
            className="py-6 bg-gradient-to-br from-orange-600 to-orange-400 rounded-2xl font-bold text-lg disabled:opacity-50"
          >
            <div className="text-3xl mb-2">🌆</div>
            <div>退勤</div>
          </motion.button>
        </div>

        {/* 本日の記録 */}
        <div className="mt-6">
          <Card className="bg-app-bg-light">
            <div className="text-sm font-semibold mb-3">本日の記録</div>
            <div className="flex justify-around text-center">
              <div>
                <div className="text-xs text-slate-400 mb-1">出勤</div>
                <div className="text-lg font-bold text-emerald-400">--:--</div>
              </div>
              <div className="w-px bg-app-border" />
              <div>
                <div className="text-xs text-slate-400 mb-1">退勤</div>
                <div className="text-lg font-bold text-orange-400">--:--</div>
              </div>
              <div className="w-px bg-app-border" />
              <div>
                <div className="text-xs text-slate-400 mb-1">勤務時間</div>
                <div className="text-lg font-bold">--h --m</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
