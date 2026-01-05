import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE, authPostFormData } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function SchedulePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const scrollRef = useRef(null)
  const [schedules, setSchedules] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('year') // year, month, week
  const [toast, setToast] = useState({ show: false, message: '' })

  // スキャン関連
  const [showScanner, setShowScanner] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [scannedImage, setScannedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedData, setScannedData] = useState({
    project_name: '',
    start_date: '',
    end_date: '',
    progress_rate: 0,
    color: '#3b82f6',
  })

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

  // ファイル選択処理
  const handleFileSelect = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    setShowScanner(false)
    setIsProcessing(true)

    // 画像プレビュー用URL
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file)
      setScannedImage(imageUrl)
    }

    // OCR処理（実際のAPIを呼び出す）
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'schedule')

      const data = await authPostFormData(`${API_BASE}/ocr/schedule`, formData)
      setScannedData({
        project_name: data.project_name || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        progress_rate: data.progress_rate || 0,
        color: data.color || '#3b82f6',
      })
    } catch (error) {
      console.error('OCR error:', error)
      // デモ用のダミーデータ
      setScannedData({
        project_name: '新規工事',
        start_date: `${currentYear}-04-01`,
        end_date: `${currentYear}-09-30`,
        progress_rate: 0,
        color: '#3b82f6',
      })
    } finally {
      setIsProcessing(false)
      setShowConfirm(true)
    }
  }

  // スケジュール登録
  const handleRegister = async () => {
    if (!scannedData.project_name || !scannedData.start_date || !scannedData.end_date) {
      showToast('必須項目を入力してください')
      return
    }

    try {
      // まずプロジェクトを作成または取得
      let projectId = null
      const existingProject = projects.find(p => p.name === scannedData.project_name)

      if (existingProject) {
        projectId = existingProject.id
      } else {
        // 新規プロジェクト作成
        const projectRes = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: scannedData.project_name,
            client: '',
            period: `${scannedData.start_date}〜${scannedData.end_date}`,
            status: '進行中',
          }),
        })
        if (projectRes.ok) {
          const newProject = await projectRes.json()
          projectId = newProject.id
        }
      }

      if (!projectId) {
        showToast('プロジェクト作成に失敗しました')
        return
      }

      // スケジュール登録
      const scheduleRes = await fetch(`${API_BASE}/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          start_date: scannedData.start_date,
          end_date: scannedData.end_date,
          progress_rate: scannedData.progress_rate,
          color: scannedData.color,
        }),
      })

      if (scheduleRes.ok) {
        showToast('工程を登録しました')
        setShowConfirm(false)
        setScannedImage(null)
        fetchData() // データ再読み込み
      } else {
        showToast('登録に失敗しました')
      }
    } catch (error) {
      console.error('Register error:', error)
      showToast('登録に失敗しました')
    }
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
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="年間工程"
        icon="📆"
        gradient="from-purple-900 to-purple-500"
        onBack={() => navigate(-1)}
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

        {/* 工程表読み取りボタン */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowScanner(true)}
          className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-lg"
        >
          <span className="mr-2">📷</span>
          工程表を読み取る
        </motion.button>
      </div>

      {/* スキャナーモーダル */}
      {showScanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end"
          onClick={() => setShowScanner(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-app-card rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center p-6 pb-3 flex-shrink-0">
              <div className="text-3xl mb-2">📷</div>
              <div className="text-lg font-bold">工程表を読み取る</div>
              <div className="text-xs text-slate-400">撮影または画像・PDFを選択</div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <label className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 cursor-pointer">
                  <div className="text-3xl">📸</div>
                  <div className="text-sm font-medium text-white">カメラ</div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'camera')}
                  />
                </label>
                <label className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 cursor-pointer">
                  <div className="text-3xl">🖼️</div>
                  <div className="text-sm font-medium text-white">画像</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'gallery')}
                  />
                </label>
                <label className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 cursor-pointer">
                  <div className="text-3xl">📄</div>
                  <div className="text-sm font-medium text-white">PDF</div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'pdf')}
                  />
                </label>
              </div>
            </div>

            {/* 固定フッター */}
            <div className="p-6 pt-3 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => setShowScanner(false)}
                className="w-full py-3 rounded-xl bg-slate-700 text-slate-300"
              >
                キャンセル
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 処理中 */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-app-card rounded-2xl p-8 text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <div className="font-bold">読み取り中...</div>
          </div>
        </div>
      )}

      {/* 確認モーダル */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-app-card rounded-2xl p-6"
          >
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-lg font-bold">工程情報を確認</div>
            </div>

            {scannedImage && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={scannedImage} alt="スキャン画像" className="w-full h-32 object-cover" />
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">現場名 *</label>
                <input
                  type="text"
                  value={scannedData.project_name}
                  onChange={(e) => setScannedData({ ...scannedData, project_name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#3c3c3e] border border-[#4c4c4e] text-white placeholder-gray-400"
                  placeholder="現場名を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">開始日 *</label>
                  <input
                    type="date"
                    value={scannedData.start_date}
                    onChange={(e) => setScannedData({ ...scannedData, start_date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#3c3c3e] border border-[#4c4c4e] text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">終了日 *</label>
                  <input
                    type="date"
                    value={scannedData.end_date}
                    onChange={(e) => setScannedData({ ...scannedData, end_date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#3c3c3e] border border-[#4c4c4e] text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">進捗率</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scannedData.progress_rate}
                  onChange={(e) => setScannedData({ ...scannedData, progress_rate: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-slate-400">{scannedData.progress_rate}%</div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">バーの色</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setScannedData({ ...scannedData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        scannedData.color === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setScannedImage(null)
                }}
                className="py-3 rounded-xl bg-slate-700 text-slate-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleRegister}
                className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold"
              >
                登録する
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
