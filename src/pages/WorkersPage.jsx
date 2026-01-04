import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, Button, Modal, Input, Select, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles, useAuthStore } from '../store'
import { Edit2, Trash2, Search, ExternalLink } from 'lucide-react'

export default function WorkersPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const { user, token } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingWorker, setEditingWorker] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [filter, setFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      // 現場作業員のみ取得
      const res = await fetch(`${API_BASE}/workers/?field_only=true`)
      if (res.ok) {
        const data = await res.json()
        // バックエンドが対応していない場合はフロントでフィルタ
        setWorkers(data.filter(w => w.is_field_worker))
      }
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

  // 作業員削除（現場作業員フラグをオフにする）
  const handleRemoveFromField = async (worker) => {
    try {
      const res = await fetch(`${API_BASE}/workers/${worker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...worker,
          is_field_worker: false
        })
      })
      if (res.ok) {
        showToast('作業員リストから外しました')
        fetchWorkers()
      } else {
        showToast('エラーが発生しました')
      }
    } catch (e) {
      showToast('エラーが発生しました')
    }
    setShowDeleteConfirm(null)
  }

  // 班リスト取得
  const teams = [...new Set(workers.map(w => w.team).filter(Boolean))]

  const filteredWorkers = workers.filter(w => {
    if (filter && !w.name.includes(filter) && !w.team?.includes(filter)) return false
    if (teamFilter !== 'all' && w.team !== teamFilter) return false
    return true
  })

  const activeWorkers = filteredWorkers.filter(w => w.is_active !== false)
  const inactiveWorkers = filteredWorkers.filter(w => w.is_active === false)

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="作業員管理"
        icon="👷"
        gradient="from-emerald-700 to-emerald-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4 space-y-4">
        {/* ユーザー管理へのリンク */}
        {user?.role === 'admin' && (
          <Card
            className="p-3 cursor-pointer"
            onClick={() => navigate('/settings/users')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  👥
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: currentBg.text }}>ユーザー管理で社員を管理</div>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>
                    「現場作業員」にチェックした人がここに表示されます
                  </div>
                </div>
              </div>
              <ExternalLink size={16} style={{ color: currentBg.textLight }} />
            </div>
          </Card>
        )}

        {/* 検索・フィルター */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: currentBg.text }} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="名前・班で検索..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl"
              style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
            />
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
          >
            <option value="all">全班</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 集計 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-emerald-400">{activeWorkers.length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>作業員</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-blue-400">
              {workers.filter(w => w.employment_type === '社員' && w.is_active !== false).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>社員</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-amber-400">
              {workers.filter(w => w.employment_type === '外注' && w.is_active !== false).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>外注</div>
          </Card>
        </div>

        {/* 作業員リスト */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : activeWorkers.length === 0 ? (
          <Card className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-3xl mb-3">👷</div>
            <div className="text-sm mb-1">現場作業員がいません</div>
            <div className="text-xs mb-4">ユーザー管理で「現場作業員」にチェックしてください</div>
            {user?.role === 'admin' && (
              <Button onClick={() => navigate('/settings/users')}>
                ユーザー管理を開く
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="text-sm font-bold" style={{ color: currentBg.text }}>
              作業員一覧（{activeWorkers.length}名）
            </div>
            {activeWorkers.map((worker, i) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      worker.employment_type === '社員' ? 'bg-emerald-500/20' :
                      worker.employment_type === '外注' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                    }`}>
                      👷
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: currentBg.text }}>{worker.name}</span>
                        {worker.position && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">
                            {worker.position}
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        {worker.team || '未配属'} / {worker.employment_type || '社員'}
                      </div>
                      {worker.daily_rate > 0 && (
                        <div className="text-[10px] mt-0.5" style={{ color: currentBg.textLight }}>
                          日当: ¥{worker.daily_rate.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {worker.phone && (
                        <a
                          href={`tel:${worker.phone}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                          style={{ background: inputBg }}
                        >
                          📞
                        </a>
                      )}
                      <button
                        onClick={() => { setEditingWorker(worker); setShowEditModal(true) }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: inputBg }}
                      >
                        <Edit2 size={16} style={{ color: currentBg.textLight }} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(worker)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/20"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {inactiveWorkers.length > 0 && (
              <>
                <div className="text-sm font-bold mt-6" style={{ color: currentBg.textLight }}>
                  非稼働（{inactiveWorkers.length}名）
                </div>
                {inactiveWorkers.map((worker) => (
                  <Card key={worker.id} className="p-3 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-500/20">
                        👷
                      </div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: currentBg.text }}>{worker.name}</div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          {worker.team || '未配属'} / {worker.employment_type || '社員'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <EditWorkerModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingWorker(null) }}
        onSuccess={fetchWorkers}
        showToast={showToast}
        worker={editingWorker}
        token={token}
      />

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 max-w-sm w-full"
              style={{ background: currentBg.cardBg || currentBg.bg }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: currentBg.text }}>作業員リストから外す</h3>
              <p className="text-sm mb-4" style={{ color: currentBg.textLight }}>
                「{showDeleteConfirm.name}」を作業員リストから外しますか？
                <br />
                <span className="text-xs">※社員マスタからは削除されません</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                  キャンセル
                </Button>
                <button
                  onClick={() => handleRemoveFromField(showDeleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
                >
                  外す
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

function EditWorkerModal({ isOpen, onClose, onSuccess, showToast, worker, token }) {
  const [form, setForm] = useState({
    team: '',
    daily_rate: '',
  })

  useEffect(() => {
    if (worker) {
      setForm({
        team: worker.team || '',
        daily_rate: worker.daily_rate || '',
      })
    }
  }, [worker, isOpen])

  const handleSubmit = async () => {
    if (!worker) return

    try {
      const res = await fetch(`${API_BASE}/workers/${worker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...worker,
          team: form.team,
          daily_rate: form.daily_rate ? parseInt(form.daily_rate) : null,
        }),
      })

      if (res.ok) {
        showToast('更新しました')
        onClose()
        onSuccess()
      } else {
        showToast('エラーが発生しました')
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  if (!worker) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`👷 ${worker.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">更新</Button>
        </>
      }
    >
      <div className="text-sm mb-4 opacity-70">
        {worker.department || '未配属'} / {worker.employment_type || '社員'}
      </div>

      <Select
        label="班"
        value={form.team}
        onChange={(e) => setForm({ ...form, team: e.target.value })}
        options={[
          { value: '', label: '選択してください' },
          { value: '舗装班', label: '舗装班' },
          { value: '高速班', label: '高速班' },
          { value: '土木班', label: '土木班' },
        ]}
      />
      <Input
        label="日当"
        type="number"
        placeholder="例: 15000"
        value={form.daily_rate}
        onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
      />

      <p className="text-xs opacity-50 mt-4">
        ※名前・部署・役職などは社員マスタで編集してください
      </p>
    </Modal>
  )
}
