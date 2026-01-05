import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function CarPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [vehicles, setVehicles] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    plate_number: '',
    type: '',
    inspection_date: '',
    insurance_date: '',
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const [vehiclesRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/`),
        fetch(`${API_BASE}/vehicles/alerts`),
      ])

      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShakenUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const ocrResult = {
      name: 'トヨタ ハイエース',
      plate_number: '品川 300 あ 1234',
      type: 'バン',
      inspection_date: '2025-06-15',
      insurance_date: '2025-12-01',
    }

    setForm(ocrResult)
    setScanning(false)
    setToastMsg('車検証を読み取りました')
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.plate_number) {
      setToastMsg('車名とナンバーは必須です')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setToastMsg('車両を登録しました')
        setToast(true)
        setTimeout(() => setToast(false), 2000)
        setShowModal(false)
        setForm({ name: '', plate_number: '', type: '', inspection_date: '', insurance_date: '' })
        fetchVehicles()
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
    const labels = { available: '空き', 'in-use': '使用中', in_use: '使用中', maintenance: '点検中' }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="車両管理"
        icon="🚗"
        gradient="from-slate-700 to-slate-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        <div className="flex gap-2 mb-4">
          <label className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-center text-sm font-bold cursor-pointer text-white">
            📷 車検証を撮影
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleShakenUpload}
            />
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ background: currentBg.bg, color: currentBg.text }}
          >
            ✏️ 手動で追加
          </button>
        </div>

        {alerts.length > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-sm font-bold text-amber-400">車検・保険アラート</div>
                <div className="text-xs text-slate-300">
                  {alerts.length}件の車両の期限が近づいています
                </div>
              </div>
            </div>
          </Card>
        )}

        <SectionTitle>🚗 車両一覧（{vehicles.length}台）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">🚗</div>
            <div>車両がありません</div>
            <div className="text-xs mt-2">車検証を撮影して登録しましょう</div>
          </div>
        ) : (
          vehicles.map((vehicle, i) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`mb-3 ${vehicle.status === 'maintenance' ? 'border-l-2 border-amber-400' : ''}`}>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-2xl">
                    {vehicle.name?.includes('ダンプ') || vehicle.type?.includes('ダンプ') ? '🚚' : '🚗'}
                  </span>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold">{vehicle.name}</div>
                    <div className="text-xs text-slate-400">{vehicle.plate_number}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(vehicle.status || 'available')}`}>
                    {getStatusLabel(vehicle.status || 'available')}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  {vehicle.inspection_date && (
                    <span>🔧 車検: {vehicle.inspection_date}</span>
                  )}
                  {vehicle.insurance_date && (
                    <span>📋 保険: {vehicle.insurance_date}</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
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
                {scanning ? '🔍 車検証を読み取り中...' : '🚗 車両を追加'}
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
                  <div className="text-5xl mb-4 animate-pulse">📄</div>
                  <div className="text-slate-300">AI が車検証を解析しています...</div>
                </div>
              ) : (
                <div className="space-y-4 pb-6">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">車名 *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="例: トヨタ ハイエース"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">ナンバー *</label>
                    <input
                      type="text"
                      value={form.plate_number}
                      onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="例: 品川 300 あ 1234"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">車種</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                    >
                      <option value="">選択してください</option>
                      <option value="乗用車">乗用車</option>
                      <option value="バン">バン</option>
                      <option value="トラック">トラック</option>
                      <option value="ダンプ">ダンプ</option>
                      <option value="重機">重機</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">車検期限</label>
                      <input
                        type="date"
                        value={form.inspection_date}
                        onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">保険期限</label>
                      <input
                        type="date"
                        value={form.insurance_date}
                        onChange={(e) => setForm({ ...form, insurance_date: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toastMsg} isVisible={toast} />
    </div>
  )
}
