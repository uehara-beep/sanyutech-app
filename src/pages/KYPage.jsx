import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function KYPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [kyReports, setKyReports] = useState([])
  const [projects, setProjects] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [scanningKY, setScanningKY] = useState(false)
  const [ocrFields, setOcrFields] = useState([])
  const [showOcrResult, setShowOcrResult] = useState(false)

  const [form, setForm] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    work_content: '',
    hazards: '',
    countermeasures: '',
    participants: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [kyRes, projectsRes, workersRes] = await Promise.all([
        fetch(`${API_BASE}/ky-reports/`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/workers/`),
      ])

      if (kyRes.ok) setKyReports(await kyRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (workersRes.ok) setWorkers(await workersRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/ky-reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(form.project_id),
          date: form.date,
          work_content: form.work_content,
          hazards: form.hazards,
          countermeasures: form.countermeasures,
          participants: form.participants.join(','),
          created_by: '田中太郎',
        }),
      })

      if (res.ok) {
        showToast('KYレポートを作成しました')
        setShowForm(false)
        setForm({
          project_id: '',
          date: new Date().toISOString().split('T')[0],
          work_content: '',
          hazards: '',
          countermeasures: '',
          participants: [],
        })
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleSign = async (reportId) => {
    try {
      const res = await fetch(`${API_BASE}/ky-reports/${reportId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: 1 }),
      })

      if (res.ok) {
        showToast('サインしました')
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const handleKYSheetOCR = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanningKY(true)
    setShowOcrResult(true)
    setOcrFields([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/ocr/ky-sheet`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setOcrFields(result.data.fields || [])

          // summaryからフォームに自動入力
          const summary = result.data.summary || {}
          setForm(prev => ({
            ...prev,
            date: summary.date || prev.date,
            work_content: summary.work_content || '',
            hazards: summary.hazards || '',
            countermeasures: summary.countermeasures || '',
          }))

          showToast('KYシートを読み取りました')
        } else {
          showToast(result.error || 'KYシートの読み取りに失敗しました')
        }
      } else {
        showToast('サーバーエラーが発生しました')
      }
    } catch (error) {
      console.error('KY OCR Error:', error)
      showToast('通信エラーが発生しました')
    } finally {
      setScanningKY(false)
    }
  }

  const toggleParticipant = (workerId) => {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(workerId)
        ? prev.participants.filter(id => id !== workerId)
        : [...prev.participants, workerId]
    }))
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || '不明'
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="KY管理"
        icon="⚠️"
        gradient="from-red-900 to-red-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* KYシート撮影ボタン */}
        <label className="flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-sm font-bold cursor-pointer text-white">
          📷 元請けKYシートを撮影して読取
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleKYSheetOCR}
          />
        </label>

        {/* 今日のKY状況 */}
        <Card className="mb-4 bg-gradient-to-r from-red-900/50 to-red-800/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">今日のKY記録</div>
              <div className="text-2xl font-bold">
                {kyReports.filter(k => k.date === new Date().toISOString().split('T')[0]).length}件
              </div>
            </div>
            <span className="text-4xl">⚠️</span>
          </div>
        </Card>

        <SectionTitle>📋 KY記録一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : kyReports.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>KY記録がありません</div>
          </div>
        ) : (
          kyReports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="mb-3 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-semibold">{getProjectName(report.project_id)}</div>
                    <div className="text-xs text-slate-400">{report.date}</div>
                  </div>
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="text-xs text-slate-300 mb-2 line-clamp-2">
                  {report.work_content || '作業内容未記載'}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">作成者: {report.created_by || '不明'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSign(report.id)
                    }}
                    className="px-3 py-1 bg-app-primary/20 text-app-primary rounded-full"
                  >
                    サイン
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 新規作成モーダル */}
      {showForm && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowForm(false)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（保存ボタン含む） */}
            <div className="flex justify-between items-center p-6 pb-3 flex-shrink-0">
              <div className="text-lg font-bold">⚠️ KYレポート作成</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-red-500 rounded-lg text-sm font-bold text-white"
                >
                  作成
                </button>
                <button onClick={() => setShowForm(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* 現場選択 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">現場</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              >
                <option value="">選択してください</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 日付 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* 作業内容 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">作業内容</label>
              <textarea
                value={form.work_content}
                onChange={(e) => setForm({ ...form, work_content: e.target.value })}
                placeholder="今日の作業内容を入力"
                rows={3}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>

            {/* 危険予知 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">危険予知（ハザード）</label>
              <textarea
                value={form.hazards}
                onChange={(e) => setForm({ ...form, hazards: e.target.value })}
                placeholder="考えられる危険を入力"
                rows={3}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>

            {/* 対策 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">対策</label>
              <textarea
                value={form.countermeasures}
                onChange={(e) => setForm({ ...form, countermeasures: e.target.value })}
                placeholder="危険への対策を入力"
                rows={3}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>

            {/* 参加者 */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">参加者</label>
              <div className="flex flex-wrap gap-2">
                {workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => toggleParticipant(worker.id)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      form.participants.includes(worker.id)
                        ? 'bg-app-primary text-white'
                        : 'bg-app-card text-slate-300'
                    }`}
                  >
                    {worker.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 写真アップロード */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">写真（任意）</label>
              <button className="w-full py-4 border-2 border-dashed border-app-border rounded-xl text-slate-400 flex items-center justify-center gap-2">
                <span className="text-2xl">📷</span>
                <span>写真を追加</span>
              </button>
            </div>
            </div>

          </motion.div>
        </motion.div>
      )}

      {/* 詳細モーダル */}
      {selectedReport && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedReport(null)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（サインボタン含む） */}
            <div className="flex justify-between items-center p-6 pb-3 flex-shrink-0">
              <div className="text-lg font-bold">⚠️ KY詳細</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSign(selectedReport.id)}
                  className="px-4 py-1.5 bg-app-primary rounded-lg text-sm font-bold text-white"
                >
                  サイン
                </button>
                <button onClick={() => setSelectedReport(null)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">現場</div>
                  <div className="text-sm font-semibold">{getProjectName(selectedReport.project_id)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">日付</div>
                  <div className="text-sm">{selectedReport.date}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">作業内容</div>
                  <div className="text-sm bg-app-card p-3 rounded-lg">{selectedReport.work_content || '未記載'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">危険予知</div>
                  <div className="text-sm bg-app-card p-3 rounded-lg">{selectedReport.hazards || '未記載'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">対策</div>
                  <div className="text-sm bg-app-card p-3 rounded-lg">{selectedReport.countermeasures || '未記載'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">参加者</div>
                  <div className="text-sm">{selectedReport.participants || '未記載'}</div>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}

      {/* OCR結果モーダル */}
      {showOcrResult && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowOcrResult(false)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（保存ボタン含む） */}
            <div className="flex justify-between items-center p-6 pb-3 flex-shrink-0">
              <div className="text-lg font-bold">
                {scanningKY ? '🔍 KYシートを読み取り中...' : '📋 KYシート読み取り結果'}
              </div>
              <div className="flex items-center gap-2">
                {!scanningKY && (
                  <button
                    onClick={() => {
                      setShowOcrResult(false)
                      setShowForm(true)
                    }}
                    className="px-4 py-1.5 bg-red-500 rounded-lg text-sm font-bold text-white"
                  >
                    保存
                  </button>
                )}
                <button onClick={() => setShowOcrResult(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {scanningKY ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 animate-pulse">📋</div>
                  <div className="text-slate-400">AIがKYシートを解析しています...</div>
                  <div className="text-xs mt-2 text-slate-500">手書き文字も読み取ります</div>
                </div>
              ) : (
                <>
                  {ocrFields.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {ocrFields.map((field, idx) => (
                        <div key={idx} className="bg-app-card rounded-xl p-3">
                          <div className="text-xs text-slate-400 mb-1">{field.key}</div>
                          <div className="text-sm text-white">{field.value || '（空欄）'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      読み取り結果がありません
                    </div>
                  )}
                </>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
