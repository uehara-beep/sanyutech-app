import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, Button, Modal, Input, Select, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function WorkersPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API_BASE}/workers/`)
      if (res.ok) {
        setWorkers(await res.json())
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

  const filteredWorkers = workers.filter(w => {
    if (filter && !w.name.includes(filter) && !w.team?.includes(filter)) return false
    if (typeFilter !== 'all' && w.employment_type !== typeFilter) return false
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
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="px-5 py-4 space-y-4">
        {/* 検索・フィルター */}
        <div className="flex gap-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="名前・班で検索..."
            className="flex-1 px-4 py-2.5 rounded-xl"
            style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
          >
            <option value="all">全て</option>
            <option value="社員">社員</option>
            <option value="契約">契約</option>
            <option value="外注">外注</option>
          </select>
        </div>

        {/* 集計 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-emerald-400">{activeWorkers.length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>稼働中</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-blue-400">
              {workers.filter(w => w.employment_type === '社員').length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>社員</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-amber-400">
              {workers.filter(w => w.employment_type === '外注').length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>外注</div>
          </Card>
        </div>

        {/* 作業員リスト */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : (
          <>
            <div className="text-sm font-bold" style={{ color: currentBg.text }}>
              稼働中（{activeWorkers.length}名）
            </div>
            {activeWorkers.length === 0 ? (
              <Card className="text-center py-6" style={{ color: currentBg.textLight }}>
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">作業員がいません</div>
              </Card>
            ) : (
              activeWorkers.map((worker, i) => (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      worker.employment_type === '社員' ? 'bg-emerald-500/20' :
                      worker.employment_type === '外注' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                    }`}>
                      👷
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: currentBg.text }}>{worker.name}</div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        {worker.team || '未配属'} / {worker.employment_type || '社員'}
                      </div>
                      {worker.daily_rate && (
                        <div className="text-xs text-emerald-400 mt-0.5">
                          ¥{worker.daily_rate.toLocaleString()}/日
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {worker.phone && (
                        <a href={`tel:${worker.phone}`} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: inputBg }}>
                          📞
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}

            {inactiveWorkers.length > 0 && (
              <>
                <div className="text-sm font-bold mt-6" style={{ color: currentBg.textLight }}>
                  非稼働（{inactiveWorkers.length}名）
                </div>
                {inactiveWorkers.map((worker, i) => (
                  <Card key={worker.id} className="flex items-center gap-3 opacity-50">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-500/20">
                      👷
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: currentBg.text }}>{worker.name}</div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        {worker.team || '未配属'} / {worker.employment_type || '社員'}
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        <Button block onClick={() => setShowAddModal(true)}>+ 作業員を追加</Button>
      </div>

      <AddWorkerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchWorkers}
        showToast={showToast}
      />
      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

function AddWorkerModal({ isOpen, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({
    name: '',
    team: '',
    employment_type: '社員',
    phone: '',
    daily_rate: '',
  })

  const handleSubmit = async () => {
    if (!form.name) {
      showToast('名前を入力してください')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/workers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          daily_rate: form.daily_rate ? parseInt(form.daily_rate) : null,
          is_active: true,
        }),
      })

      if (res.ok) {
        showToast('作業員を追加しました')
        setForm({ name: '', team: '', employment_type: '社員', phone: '', daily_rate: '' })
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
          { value: '土木班', label: '土木班' },
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
      <Input
        label="日当"
        type="number"
        placeholder="例: 15000"
        value={form.daily_rate}
        onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
      />
    </Modal>
  )
}
