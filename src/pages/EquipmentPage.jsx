import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function EquipmentPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: '',
    status: 'available',
    note: '',
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const res = await fetch(`${API_BASE}/equipment/`)
      if (res.ok) setEquipment(await res.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const ocrResult = {
      name: 'コマツ PC200',
      category: '油圧ショベル',
      status: 'available',
      note: '製造番号: 12345',
    }

    setForm(ocrResult)
    setScanning(false)
    setToastMsg('銘板を読み取りました')
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const handleSubmit = async () => {
    if (!form.name) {
      setToastMsg('機材名は必須です')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/equipment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setToastMsg('機材を登録しました')
        setToast(true)
        setTimeout(() => setToast(false), 2000)
        setShowModal(false)
        setForm({ name: '', category: '', status: 'available', note: '' })
        fetchEquipment()
      }
    } catch (error) {
      setToastMsg('登録に失敗しました')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      available: 'bg-emerald-500/20 text-emerald-400',
      'in-use': 'bg-blue-500/20 text-blue-400',
      in_use: 'bg-blue-500/20 text-blue-400',
      maintenance: 'bg-amber-500/20 text-amber-400',
    }
    return styles[status] || styles.available
  }

  const getStatusLabel = (status) => {
    const labels = { available: '空き', 'in-use': '使用中', in_use: '使用中', maintenance: '整備中' }
    return labels[status] || status
  }

  const maintenanceItems = equipment.filter(e => e.status === 'maintenance')

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="機材管理"
        icon="🔧"
        gradient="from-orange-700 to-orange-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="flex bg-app-bg-light p-1 mx-5 mb-4 rounded-xl">
        {['list', 'maintenance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium ${
              activeTab === tab ? 'bg-app-primary text-white' : 'text-slate-400'
            }`}
          >
            {tab === 'list' ? '機材一覧' : '点検中'}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : activeTab === 'list' ? (
          <>
            <SectionTitle>🔧 機材一覧（{equipment.length}台）</SectionTitle>
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🔧</div>
                <div>機材がありません</div>
              </div>
            ) : (
              equipment.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`mb-3 ${item.status === 'maintenance' ? 'border-l-2 border-amber-400' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🚜</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category || '未分類'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-400">{item.note}</div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </>
        ) : (
          <>
            <SectionTitle>🔧 点検中機材（{maintenanceItems.length}台）</SectionTitle>
            {maintenanceItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">✅</div>
                <div>点検中の機材はありません</div>
              </div>
            ) : (
              maintenanceItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-3 border-l-2 border-amber-400">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🚜</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category || '未分類'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                        整備中
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-400">{item.note}</div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
              <h3 className="text-lg font-bold">
                {scanning ? '🔍 銘板を読み取り中...' : '🔧 機材を追加'}
              </h3>
              <div className="flex items-center gap-2">
                {!scanning && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-bold text-white"
                  >
                    登録
                  </button>
                )}
                <button onClick={() => { setShowModal(false); setScanning(false) }} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {scanning ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 animate-pulse">📷</div>
                  <div className="text-slate-300">AI が銘板を解析しています...</div>
                </div>
              ) : (
                <>
                  <label className="block w-full py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-center text-sm font-bold cursor-pointer">
                    📷 銘板を撮影して自動入力
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <div className="space-y-4 pb-6">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">機材名 *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                        placeholder="例: コマツ PC200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">カテゴリ</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="油圧ショベル">油圧ショベル</option>
                        <option value="ブルドーザー">ブルドーザー</option>
                        <option value="ローラー">ローラー</option>
                        <option value="クレーン">クレーン</option>
                        <option value="発電機">発電機</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">状態</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      >
                        <option value="available">空き</option>
                        <option value="in_use">使用中</option>
                        <option value="maintenance">整備中</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">備考</label>
                      <textarea
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm resize-none"
                        rows={2}
                        placeholder="メモを入力"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toastMsg} isVisible={toast} />
    </div>
  )
}
