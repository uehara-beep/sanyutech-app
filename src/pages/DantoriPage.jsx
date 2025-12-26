import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, HeaderButton, Tabs, Card, Badge, SectionTitle, Button, Modal, Input, Select, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const tabs = [
  { id: 'today', label: '今日' },
  { id: 'week', label: '週間' },
  { id: 'sites', label: '現場一覧' },
  { id: 'members', label: '作業員' },
]

export default function DantoriPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [activeTab, setActiveTab] = useState('today')
  const [showAddModal, setShowAddModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [workers, setWorkers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [projectsRes, workersRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/workers/`),
        fetch(`${API_BASE}/assignments/?date=${today}`),
      ])

      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (workersRes.ok) setWorkers(await workersRes.json())
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  // プロジェクトをサイト形式に変換
  const sites = projects.map(p => ({
    id: p.id,
    name: p.name,
    shortName: p.name?.split(' ')[0] || p.name,
    client: p.client,
    status: p.status === '施工中' ? 'active' : 'inactive',
    shift: 'day',
    lat: p.latitude,
    lng: p.longitude,
    members: assignments
      .filter(a => a.project_id === p.id)
      .map(a => workers.find(w => w.id === a.worker_id)?.name || '不明'),
    documents: 0,
    photos: 0,
  }))

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="配置管理"
        icon="🚧"
        gradient="from-emerald-900 to-emerald-500"
        onBack={() => navigate(-1)}
        rightAction={<HeaderButton onClick={() => setShowAddModal(true)}>＋ 現場</HeaderButton>}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="px-5">
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : (
          <>
            {activeTab === 'today' && <TodayView sites={sites} workers={workers} assignments={assignments} onRefresh={fetchData} showToast={showToast} />}
            {activeTab === 'week' && <WeekView sites={sites} workers={workers} />}
            {activeTab === 'sites' && <SitesView sites={sites} />}
            {activeTab === 'members' && <MembersView workers={workers} onRefresh={fetchData} showToast={showToast} />}
          </>
        )}
      </div>

      <AddSiteModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchData} showToast={showToast} />
      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

function TodayView({ sites, workers, assignments, onRefresh, showToast }) {
  const navigate = useNavigate()
  const [addWorkerModal, setAddWorkerModal] = useState({ open: false, siteId: null, siteName: '' })
  const [copying, setCopying] = useState(false)

  const activeSites = sites.filter(s => s.status === 'active')
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const todayDisplay = todayDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })

  // 現場ごとの配置を取得
  const getSiteAssignments = (siteId) => {
    return assignments.filter(a => a.project_id === siteId)
  }

  // 現場ごとの配置メンバーを取得
  const getSiteMembers = (siteId) => {
    const siteAssignments = getSiteAssignments(siteId)
    return siteAssignments.map(a => {
      const worker = workers.find(w => w.id === a.worker_id)
      return { ...worker, assignmentId: a.id }
    }).filter(w => w.id)
  }

  // 配置済みの作業員ID
  const assignedWorkerIds = new Set(assignments.map(a => a.worker_id))

  // 未配置の作業員
  const unassignedWorkers = workers.filter(w => !assignedWorkerIds.has(w.id) && w.is_active)

  // 作業員を配置から削除
  const handleRemoveWorker = async (assignmentId) => {
    if (!confirm('この配置を削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/assignments/${assignmentId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('配置を削除しました')
        onRefresh()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  // 前日の配置をコピー
  const handleCopyPreviousDay = async () => {
    setCopying(true)
    try {
      const yesterday = new Date(todayDate)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      // 前日の配置を取得
      const res = await fetch(`${API_BASE}/assignments/?date=${yesterdayStr}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const yesterdayAssignments = await res.json()

      if (yesterdayAssignments.length === 0) {
        showToast('前日の配置がありません')
        setCopying(false)
        return
      }

      // 今日の配置として登録
      let count = 0
      for (const a of yesterdayAssignments) {
        // 既に同じ配置があるかチェック
        const exists = assignments.some(
          existing => existing.project_id === a.project_id && existing.worker_id === a.worker_id
        )
        if (!exists) {
          await fetch(`${API_BASE}/assignments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: todayStr,
              project_id: a.project_id,
              worker_id: a.worker_id,
              start_time: a.start_time || '08:00',
              end_time: a.end_time || '17:00',
              note: ''
            })
          })
          count++
        }
      }
      showToast(`${count}件の配置をコピーしました`)
      onRefresh()
    } catch (error) {
      showToast('コピーに失敗しました')
    } finally {
      setCopying(false)
    }
  }

  // 先週同曜日の配置をコピー
  const handleCopyLastWeek = async () => {
    setCopying(true)
    try {
      const lastWeek = new Date(todayDate)
      lastWeek.setDate(lastWeek.getDate() - 7)
      const lastWeekStr = lastWeek.toISOString().split('T')[0]

      const res = await fetch(`${API_BASE}/assignments/?date=${lastWeekStr}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const lastWeekAssignments = await res.json()

      if (lastWeekAssignments.length === 0) {
        showToast('先週の配置がありません')
        setCopying(false)
        return
      }

      let count = 0
      for (const a of lastWeekAssignments) {
        const exists = assignments.some(
          existing => existing.project_id === a.project_id && existing.worker_id === a.worker_id
        )
        if (!exists) {
          await fetch(`${API_BASE}/assignments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: todayStr,
              project_id: a.project_id,
              worker_id: a.worker_id,
              start_time: a.start_time || '08:00',
              end_time: a.end_time || '17:00',
              note: ''
            })
          })
          count++
        }
      }
      showToast(`${count}件の配置をコピーしました`)
      onRefresh()
    } catch (error) {
      showToast('コピーに失敗しました')
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>📋 今日の配置編集 - {todayDisplay}</SectionTitle>
      </div>

      {/* 一括操作ボタン */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCopyPreviousDay}
          disabled={copying}
          className="flex-1 py-2.5 px-3 bg-blue-600/20 text-blue-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
        >
          📅 前日コピー
        </button>
        <button
          onClick={handleCopyLastWeek}
          disabled={copying}
          className="flex-1 py-2.5 px-3 bg-purple-600/20 text-purple-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
        >
          🔄 先週コピー
        </button>
      </div>

      {/* 現場ごとの配置 */}
      {activeSites.length === 0 ? (
        <Card className="text-center py-6 text-slate-400">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm">稼働中の現場はありません</div>
        </Card>
      ) : (
        activeSites.map((site, i) => {
          const siteMembers = getSiteMembers(site.id)
          return (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                {/* 現場ヘッダー */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      🚧 {site.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">🏢 {site.client}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${siteMembers.length > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {siteMembers.length}人
                    </div>
                  </div>
                </div>

                {/* 配置メンバー */}
                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-2">配置メンバー:</div>
                  {siteMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {siteMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-1 bg-app-bg rounded-lg px-2.5 py-1.5"
                        >
                          <span className="text-sm">👷</span>
                          <span className="text-sm font-medium">{member.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveWorker(member.assignmentId)
                            }}
                            className="ml-1 text-red-400 hover:text-red-300 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-400 bg-yellow-500/10 rounded-lg p-2 text-center">
                      ⚠️ 配置がありません
                    </div>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddWorkerModal({ open: true, siteId: site.id, siteName: site.name })}
                    className="flex-1 py-2.5 bg-emerald-600/20 text-emerald-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    ＋ 追加
                  </button>
                  <button
                    onClick={() => navigate(`/site/${site.id}`)}
                    className="px-4 py-2.5 bg-app-bg text-slate-300 rounded-xl text-sm"
                  >
                    詳細
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })
      )}

      {/* 未配置作業員 */}
      {unassignedWorkers.length > 0 && (
        <Card className="mt-4 border-2 border-dashed border-yellow-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <span className="font-bold text-yellow-300">未配置（{unassignedWorkers.length}人）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedWorkers.slice(0, 10).map((worker) => (
              <span
                key={worker.id}
                className="px-3 py-1.5 bg-yellow-500/10 text-yellow-300 rounded-lg text-sm"
              >
                {worker.name}
              </span>
            ))}
            {unassignedWorkers.length > 10 && (
              <span className="px-3 py-1.5 bg-app-bg text-slate-400 rounded-lg text-sm">
                他{unassignedWorkers.length - 10}人
              </span>
            )}
          </div>
        </Card>
      )}

      {/* 作業員追加モーダル */}
      <AddWorkerToSiteModal
        isOpen={addWorkerModal.open}
        siteId={addWorkerModal.siteId}
        siteName={addWorkerModal.siteName}
        workers={workers}
        assignments={assignments}
        todayStr={todayStr}
        onClose={() => setAddWorkerModal({ open: false, siteId: null, siteName: '' })}
        onSuccess={onRefresh}
        showToast={showToast}
      />
    </>
  )
}

// 作業員追加モーダル
function AddWorkerToSiteModal({ isOpen, siteId, siteName, workers, assignments, todayStr, onClose, onSuccess, showToast }) {
  const [selectedWorkers, setSelectedWorkers] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')

  // このサイトに既に配置済みの作業員ID
  const assignedToSite = new Set(
    assignments.filter(a => a.project_id === siteId).map(a => a.worker_id)
  )

  // フィルタリングされた作業員
  const filteredWorkers = workers.filter(w => {
    if (!w.is_active) return false
    if (assignedToSite.has(w.id)) return false  // 既に配置済みは除外
    if (filter && !w.name.includes(filter) && !w.team?.includes(filter)) return false
    return true
  })

  // チェックボックス切り替え
  const toggleWorker = (workerId) => {
    const newSet = new Set(selectedWorkers)
    if (newSet.has(workerId)) {
      newSet.delete(workerId)
    } else {
      newSet.add(workerId)
    }
    setSelectedWorkers(newSet)
  }

  // 全選択/解除
  const toggleAll = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set())
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map(w => w.id)))
    }
  }

  // 配置を保存
  const handleSave = async () => {
    if (selectedWorkers.size === 0) {
      showToast('作業員を選択してください')
      return
    }

    setSaving(true)
    try {
      for (const workerId of selectedWorkers) {
        await fetch(`${API_BASE}/assignments/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: todayStr,
            project_id: siteId,
            worker_id: workerId,
            start_time: '08:00',
            end_time: '17:00',
            note: ''
          })
        })
      }
      showToast(`${selectedWorkers.size}人を配置しました`)
      setSelectedWorkers(new Set())
      onSuccess()
      onClose()
    } catch (error) {
      showToast('配置に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // モーダルを閉じるときにリセット
  useEffect(() => {
    if (!isOpen) {
      setSelectedWorkers(new Set())
      setFilter('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full bg-app-bg-light rounded-t-3xl max-h-[85vh] flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-app-border">
          <div className="text-lg font-bold mb-1">作業員を選択</div>
          <div className="text-sm text-slate-400">🚧 {siteName}</div>
        </div>

        {/* 検索・フィルター */}
        <div className="p-4 border-b border-app-border">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="名前・班で検索..."
            className="w-full bg-app-card border border-app-border rounded-xl px-4 py-2.5 text-white"
          />
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={toggleAll}
              className="text-sm text-blue-400"
            >
              {selectedWorkers.size === filteredWorkers.length ? '全解除' : '全選択'}
            </button>
            <span className="text-sm text-slate-400">
              {selectedWorkers.size}人選択中
            </span>
          </div>
        </div>

        {/* 作業員リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredWorkers.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              配置可能な作業員がいません
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  onClick={() => toggleWorker(worker.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedWorkers.has(worker.id)
                      ? 'bg-emerald-600/20 border border-emerald-500'
                      : 'bg-app-card border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                    selectedWorkers.has(worker.id)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500'
                  }`}>
                    {selectedWorkers.has(worker.id) && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{worker.name}</div>
                    <div className="text-xs text-slate-400">
                      {worker.team || '班未設定'} • {worker.employment_type || ''}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    ¥{(worker.daily_rate || 0).toLocaleString()}/日
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッターボタン */}
        <div className="p-4 border-t border-app-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-app-card text-slate-300 rounded-xl font-semibold"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedWorkers.size === 0}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {saving ? '配置中...' : `${selectedWorkers.size}人を配置`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function WeekView({ sites, workers }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekAssignments, setWeekAssignments] = useState([])
  const [detailModal, setDetailModal] = useState({ open: false, site: null, date: null, members: [] })
  const [loading, setLoading] = useState(false)

  const days = ['月', '火', '水', '木', '金', '土', '日']

  // 週の開始日（月曜日）を計算
  const getMonday = (offset = 0) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (offset * 7))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const formatDate = (d) => d.toISOString().split('T')[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 週の配置データを取得
  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true)
      try {
        const weekStart = formatDate(monday)
        const res = await fetch(`${API_BASE}/assignments/?week=${weekStart}`)
        if (res.ok) {
          setWeekAssignments(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch week assignments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWeekData()
  }, [weekOffset])

  // 特定の日・現場の配置人数を取得
  const getAssignmentCount = (siteId, date) => {
    const dateStr = formatDate(date)
    return weekAssignments.filter(a => a.project_id === siteId && a.date === dateStr).length
  }

  // 特定の日・現場の配置メンバーを取得
  const getAssignmentMembers = (siteId, date) => {
    const dateStr = formatDate(date)
    const assignments = weekAssignments.filter(a => a.project_id === siteId && a.date === dateStr)
    return assignments.map(a => workers.find(w => w.id === a.worker_id)?.name || '不明')
  }

  // 人数に応じた色を返す
  const getCountColor = (count) => {
    if (count === 0) return 'bg-gray-600/30 text-gray-400'
    if (count <= 2) return 'bg-yellow-500/30 text-yellow-300'
    if (count <= 4) return 'bg-orange-500/30 text-orange-300'
    return 'bg-emerald-500/30 text-emerald-300'
  }

  // 週の範囲表示
  const weekRangeText = `${monday.getMonth() + 1}/${monday.getDate()}〜${sunday.getMonth() + 1}/${sunday.getDate()}`

  // 現場名を省略
  const truncateName = (name, maxLen = 8) => {
    if (!name) return ''
    return name.length > maxLen ? name.slice(0, maxLen) + '...' : name
  }

  const activeSites = sites.filter(s => s.status === 'active')

  // 週の集計
  const totalAssignments = weekAssignments.length
  const uniqueWorkers = new Set(weekAssignments.map(a => a.worker_id)).size

  return (
    <>
      {/* 週送りヘッダー */}
      <div className="flex items-center justify-between mb-4 bg-app-card rounded-xl p-3">
        <button
          onClick={() => setWeekOffset(prev => prev - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-app-bg text-slate-300 hover:bg-app-primary hover:text-white transition-colors"
        >
          ＜ 前週
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-white">{weekRangeText}</div>
          <div className="text-xs text-slate-400">
            {weekOffset === 0 ? '今週' : weekOffset > 0 ? `${weekOffset}週間後` : `${Math.abs(weekOffset)}週間前`}
          </div>
        </div>
        <button
          onClick={() => setWeekOffset(prev => prev + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-app-bg text-slate-300 hover:bg-app-primary hover:text-white transition-colors"
        >
          次週 ＞
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : (
        <div className="overflow-x-auto -mx-5">
          <div className="min-w-[700px] px-5">
            {/* テーブルヘッダー */}
            <div className="flex gap-1 mb-1 sticky top-0 z-10">
              {/* 左固定：現場名ヘッダー */}
              <div className="w-28 shrink-0 bg-gray-700 p-2 rounded-lg text-center text-sm font-bold text-white">
                現場
              </div>
              {/* 日付ヘッダー */}
              {dates.map((date, i) => {
                const isToday = date.getTime() === today.getTime()
                const isWeekend = i >= 5
                return (
                  <div
                    key={i}
                    className={`flex-1 min-w-[80px] p-2 rounded-lg text-center ${
                      isToday ? 'bg-orange-500 text-white' :
                      isWeekend ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-700 text-white'
                    }`}
                  >
                    <div className="text-lg font-bold">{days[i]}</div>
                    <div className="text-sm">{date.getDate()}日</div>
                  </div>
                )
              })}
            </div>

            {/* データ行 */}
            {activeSites.length === 0 ? (
              <Card className="text-center py-6 text-slate-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">稼働中の現場がありません</div>
              </Card>
            ) : (
              activeSites.map((site) => (
                <div key={site.id} className="flex gap-1 mb-1">
                  {/* 左固定：現場名 */}
                  <div
                    className="w-28 shrink-0 bg-app-card p-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600"
                    onClick={() => alert(site.name)}
                    title={site.name}
                  >
                    <span className="text-xs font-semibold text-slate-200 text-center leading-tight">
                      {truncateName(site.shortName || site.name)}
                    </span>
                  </div>
                  {/* 日付セル */}
                  {dates.map((date, colIdx) => {
                    const count = getAssignmentCount(site.id, date)
                    const isWeekend = colIdx >= 5
                    return (
                      <div
                        key={colIdx}
                        onClick={() => {
                          if (count > 0) {
                            setDetailModal({
                              open: true,
                              site: site,
                              date: date,
                              members: getAssignmentMembers(site.id, date)
                            })
                          }
                        }}
                        className={`flex-1 min-w-[80px] min-h-[70px] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                          isWeekend && count === 0 ? 'bg-gray-800/50 text-gray-500' :
                          getCountColor(count)
                        }`}
                      >
                        {count === 0 ? (
                          <span className="text-lg">-</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold">{count}</span>
                            <span className="text-xs">人</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 週間集計カード */}
      <Card className="mt-4">
        <div className="text-xs text-slate-400 mb-2">📊 週間集計</div>
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">{totalAssignments}</div>
            <div className="text-xs text-slate-400">総人工</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{activeSites.length}</div>
            <div className="text-xs text-slate-400">稼働現場</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{uniqueWorkers}</div>
            <div className="text-xs text-slate-400">稼働人数</div>
          </div>
        </div>
      </Card>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-gray-600/30"></span>
          <span className="text-gray-400">0人</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-500/30"></span>
          <span className="text-yellow-300">1-2人</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-500/30"></span>
          <span className="text-orange-300">3-4人</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-emerald-500/30"></span>
          <span className="text-emerald-300">5人+</span>
        </span>
      </div>

      {/* 配置詳細モーダル */}
      {detailModal.open && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setDetailModal({ open: false, site: null, date: null, members: [] })}
        >
          <motion.div
            className="w-full max-w-sm bg-app-card rounded-2xl p-5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-1">{detailModal.site?.name}</div>
            <div className="text-sm text-slate-400 mb-4">
              {detailModal.date?.getMonth() + 1}/{detailModal.date?.getDate()}（{days[detailModal.date?.getDay() === 0 ? 6 : detailModal.date?.getDay() - 1]}）
            </div>
            <div className="text-sm text-slate-300 mb-2">配置メンバー（{detailModal.members.length}名）</div>
            <div className="space-y-2">
              {detailModal.members.map((name, i) => (
                <div key={i} className="flex items-center gap-2 bg-app-bg rounded-lg p-3">
                  <span className="text-xl">👷</span>
                  <span className="font-semibold">{name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDetailModal({ open: false, site: null, date: null, members: [] })}
              className="w-full mt-4 py-3 bg-app-primary text-white rounded-xl font-semibold"
            >
              閉じる
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

function SitesView({ sites }) {
  const navigate = useNavigate()

  return (
    <>
      <SectionTitle>🏗️ 現場一覧</SectionTitle>

      {sites.length === 0 ? (
        <Card className="text-center py-6 text-slate-400">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm">現場がありません</div>
        </Card>
      ) : (
        sites.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="mb-3" onClick={() => navigate(`/site/${site.id}`)}>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-11 h-11 bg-app-primary rounded-xl flex items-center justify-center text-xl">
                  🏗️
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{site.shortName || site.name}</div>
                  <div className="text-xs text-slate-400">🏢 {site.client}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2 py-1 rounded text-[10px] ${
                  site.lat ? 'bg-blue-500/15 text-blue-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  📍 {site.lat ? '位置登録済' : '未登録'}
                </span>
                <span className={`px-2 py-1 rounded text-[10px] ${
                  site.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'
                }`}>
                  {site.status === 'active' ? '稼働中' : '停止中'}
                </span>
              </div>
            </Card>
          </motion.div>
        ))
      )}

      <Button block>＋ 現場を追加</Button>
    </>
  )
}

function MembersView({ workers, onRefresh, showToast }) {
  const [showAddWorker, setShowAddWorker] = useState(false)

  return (
    <>
      <SectionTitle>👷 作業員一覧（{workers.length}名）</SectionTitle>

      {workers.length === 0 ? (
        <Card className="text-center py-6 text-slate-400">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm">作業員がいません</div>
        </Card>
      ) : (
        workers.map((worker, i) => (
          <motion.div
            key={worker.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="mb-2.5 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                worker.employment_type === '社員' ? 'bg-app-primary' : 'bg-amber-500'
              }`}>
                👷
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{worker.name}</div>
                <div className="text-xs text-slate-400">
                  {worker.team || '未配属'} / {worker.employment_type || '社員'}
                </div>
              </div>
              {worker.phone && (
                <a href={`tel:${worker.phone}`} className="text-xl">📞</a>
              )}
            </Card>
          </motion.div>
        ))
      )}

      <Button block onClick={() => setShowAddWorker(true)}>＋ 作業員を追加</Button>

      <AddWorkerModal
        isOpen={showAddWorker}
        onClose={() => setShowAddWorker(false)}
        onSuccess={onRefresh}
        showToast={showToast}
      />
    </>
  )
}

function ActionButton({ icon, label }) {
  return (
    <button className="px-3 py-2 bg-app-bg rounded-lg text-xs flex items-center gap-1">
      {icon} {label}
    </button>
  )
}

function AddSiteModal({ isOpen, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ name: '', client: '', address: '' })

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `PRJ-${Date.now()}`,
          name: form.name,
          client: form.client,
          address: form.address,
          status: '施工中',
        }),
      })

      if (res.ok) {
        showToast('現場を追加しました')
        setForm({ name: '', client: '', address: '' })
        onClose()
        onSuccess()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏗️ 現場を追加"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">登録</Button>
        </>
      }
    >
      <Input
        label="現場名 *"
        placeholder="例: 九州自動車道 久留米管内舗装補修"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="元請け"
        placeholder="例: 鹿島道路㈱"
        value={form.client}
        onChange={(e) => setForm({ ...form, client: e.target.value })}
      />
      <Input
        label="住所"
        placeholder="例: 福岡県久留米市東合川1-2-3"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
    </Modal>
  )
}

function AddWorkerModal({ isOpen, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ name: '', team: '', employment_type: '社員', phone: '' })

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/workers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        showToast('作業員を追加しました')
        setForm({ name: '', team: '', employment_type: '社員', phone: '' })
        onClose()
        onSuccess()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="👷 作業員を追加"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">登録</Button>
        </>
      }
    >
      <Input
        label="名前 *"
        placeholder="例: 田中太郎"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Select
        label="班"
        value={form.team}
        onChange={(e) => setForm({ ...form, team: e.target.value })}
        options={[
          { value: '', label: '選択してください' },
          { value: '舗装班', label: '舗装班' },
          { value: '高速班', label: '高速班' },
        ]}
      />
      <Select
        label="雇用形態"
        value={form.employment_type}
        onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
        options={[
          { value: '社員', label: '社員' },
          { value: '契約', label: '契約' },
          { value: '外注', label: '外注' },
        ]}
      />
      <Input
        label="電話番号"
        placeholder="例: 090-1234-5678"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
    </Modal>
  )
}

function AssignmentModal({ isOpen, onClose, sites, workers, onSuccess, showToast }) {
  const [form, setForm] = useState({ project_id: '', worker_id: '', start_time: '08:00', end_time: '17:00' })

  const handleSubmit = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`${API_BASE}/assignments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          project_id: parseInt(form.project_id),
          worker_id: parseInt(form.worker_id),
          start_time: form.start_time,
          end_time: form.end_time,
        }),
      })

      if (res.ok) {
        showToast('配置を追加しました')
        setForm({ project_id: '', worker_id: '', start_time: '08:00', end_time: '17:00' })
        onClose()
        onSuccess()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📍 配置を追加"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">登録</Button>
        </>
      }
    >
      <Select
        label="現場 *"
        value={form.project_id}
        onChange={(e) => setForm({ ...form, project_id: e.target.value })}
        options={[
          { value: '', label: '選択してください' },
          ...sites.map(s => ({ value: s.id.toString(), label: s.name })),
        ]}
      />
      <Select
        label="作業員 *"
        value={form.worker_id}
        onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
        options={[
          { value: '', label: '選択してください' },
          ...workers.map(w => ({ value: w.id.toString(), label: w.name })),
        ]}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="開始時間"
          type="time"
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
        />
        <Input
          label="終了時間"
          type="time"
          value={form.end_time}
          onChange={(e) => setForm({ ...form, end_time: e.target.value })}
        />
      </div>
    </Modal>
  )
}
