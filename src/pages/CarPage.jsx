import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Plus, Car, Calendar, Shield } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton, SummaryCardSkeleton } from '../components/ui/Skeleton'
import FormField, { Input, Select, DateInput, SubmitButton } from '../components/form/FormField'
import { api } from '../utils/api'
import { required, validateForm } from '../utils/validators'
import { useThemeStore, backgroundStyles } from '../store'

const VEHICLE_TYPES = [
  { value: '乗用車', label: '乗用車' },
  { value: 'バン', label: 'バン' },
  { value: 'トラック', label: 'トラック' },
  { value: 'ダンプ', label: 'ダンプ' },
  { value: '重機', label: '重機' },
]

export default function CarPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [vehicles, setVehicles] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [errors, setErrors] = useState({})
  const [filter, setFilter] = useState('all') // all, alert, available

  const [form, setForm] = useState({
    name: '',
    plate_number: '',
    type: '',
    inspection_date: '',
    insurance_date: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vehiclesRes, alertsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/vehicles/alerts'),
      ])

      if (vehiclesRes.success !== false) setVehicles(vehiclesRes.data || vehiclesRes || [])
      if (alertsRes.success !== false) setAlerts(alertsRes.data || alertsRes || [])
    } catch (error) {
      showToast('データの取得に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const handleShakenUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    // OCR処理（デモ用に2秒待機）
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
    showToast('車検証を読み取りました', 'success')
  }

  const validateVehicleForm = () => {
    const schema = {
      name: [(v) => required(v, '車名')],
      plate_number: [(v) => required(v, 'ナンバー')],
    }
    const { isValid, errors: validationErrors } = validateForm(form, schema)
    setErrors(validationErrors)
    return { isValid, errors: validationErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid } = validateVehicleForm()
    if (!isValid) return

    setSubmitting(true)
    try {
      const result = await api.post('/vehicles', form)
      if (result.success || result.id) {
        showToast('保存しました', 'success')
        setShowModal(false)
        setForm({ name: '', plate_number: '', type: '', inspection_date: '', insurance_date: '' })
        setErrors({})
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '登録に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusStyle = (status) => ({
    available: 'bg-emerald-500/20 text-emerald-400',
    'in-use': 'bg-blue-500/20 text-blue-400',
    in_use: 'bg-blue-500/20 text-blue-400',
    maintenance: 'bg-amber-500/20 text-amber-400',
  }[status] || 'bg-emerald-500/20 text-emerald-400')

  const getStatusLabel = (status) => ({
    available: '空き',
    'in-use': '使用中',
    in_use: '使用中',
    maintenance: '点検中',
  }[status] || status || '空き')

  const isAlertVehicle = (vehicle) => {
    return alerts.some(a => a.vehicle_id === vehicle.id)
  }

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null
    const target = new Date(dateStr)
    const today = new Date()
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getAlertLevel = (days) => {
    if (days === null) return null
    if (days <= 0) return 'expired'
    if (days <= 30) return 'danger'
    if (days <= 60) return 'warning'
    return null
  }

  const filteredVehicles = filter === 'all'
    ? vehicles
    : filter === 'alert'
      ? vehicles.filter(v => isAlertVehicle(v))
      : vehicles.filter(v => v.status === 'available' || !v.status)

  const alertCount = vehicles.filter(v => {
    const inspDays = getDaysUntil(v.inspection_date)
    const insDays = getDaysUntil(v.insurance_date)
    return (inspDays !== null && inspDays <= 60) || (insDays !== null && insDays <= 60)
  }).length

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="車両管理"
        icon="🚗"
        gradient="from-slate-700 to-slate-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* 車検証撮影ボタン */}
        <label className="block w-full py-3.5 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-center text-sm font-bold cursor-pointer text-white">
          📷 車検証を撮影して登録
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleShakenUpload}
          />
        </label>

        {/* アラートサマリー */}
        {loading ? (
          <SummaryCardSkeleton />
        ) : alertCount > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-400" size={28} />
              <div>
                <div className="text-sm font-bold text-amber-400">車検・保険アラート</div>
                <div className="text-xs text-slate-300">
                  {alertCount}件の車両の期限が近づいています
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'alert', label: '要注意' },
            { id: 'available', label: '空き' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-slate-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
              {f.id === 'alert' && alertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-[10px] rounded-full">{alertCount}</span>
              )}
            </button>
          ))}
        </div>

        <SectionTitle>🚗 車両一覧（{filteredVehicles.length}台）</SectionTitle>

        {loading ? (
          <ListSkeleton count={5} showHeader={false} />
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Car size={48} className="mx-auto mb-4 opacity-50" />
            <div>車両がありません</div>
            <div className="text-xs mt-2">車検証を撮影して登録しましょう</div>
          </div>
        ) : (
          filteredVehicles.map((vehicle, i) => {
            const inspDays = getDaysUntil(vehicle.inspection_date)
            const insDays = getDaysUntil(vehicle.insurance_date)
            const inspAlert = getAlertLevel(inspDays)
            const insAlert = getAlertLevel(insDays)

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`mb-3 ${(inspAlert || insAlert) ? 'border-l-2 border-amber-400' : ''}`}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-2xl">
                      {vehicle.name?.includes('ダンプ') || vehicle.type?.includes('ダンプ') ? '🚚' :
                       vehicle.type?.includes('重機') ? '🚜' : '🚗'}
                    </span>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold">{vehicle.name}</div>
                      <div className="text-xs text-slate-400">{vehicle.plate_number}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(vehicle.status)}`}>
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    {vehicle.inspection_date && (
                      <span className={`flex items-center gap-1 ${
                        inspAlert === 'expired' ? 'text-red-400' :
                        inspAlert === 'danger' ? 'text-red-400' :
                        inspAlert === 'warning' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        <Calendar size={12} />
                        車検: {vehicle.inspection_date}
                        {inspDays !== null && inspDays <= 60 && (
                          <span className="text-[10px]">（{inspDays <= 0 ? '期限切れ' : `残${inspDays}日`}）</span>
                        )}
                      </span>
                    )}
                    {vehicle.insurance_date && (
                      <span className={`flex items-center gap-1 ${
                        insAlert === 'expired' ? 'text-red-400' :
                        insAlert === 'danger' ? 'text-red-400' :
                        insAlert === 'warning' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        <Shield size={12} />
                        保険: {vehicle.insurance_date}
                        {insDays !== null && insDays <= 60 && (
                          <span className="text-[10px]">（{insDays <= 0 ? '期限切れ' : `残${insDays}日`}）</span>
                        )}
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 車両追加モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold">
                {scanning ? '🔍 車検証を読み取り中...' : '🚗 車両を追加'}
              </h3>
              <button onClick={() => { setShowModal(false); setScanning(false); setErrors({}) }} className="text-2xl text-slate-400">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {scanning ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 animate-pulse">📄</div>
                  <div className="text-slate-300">AI が車検証を解析しています...</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField label="車名" required error={errors.name}>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="例: トヨタ ハイエース"
                      error={errors.name}
                    />
                  </FormField>

                  <FormField label="ナンバー" required error={errors.plate_number}>
                    <Input
                      value={form.plate_number}
                      onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                      placeholder="例: 品川 300 あ 1234"
                      error={errors.plate_number}
                    />
                  </FormField>

                  <FormField label="車種">
                    <Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      placeholder="選択してください"
                    >
                      {VEHICLE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </Select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="車検期限">
                      <DateInput
                        value={form.inspection_date}
                        onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                      />
                    </FormField>
                    <FormField label="保険期限">
                      <DateInput
                        value={form.insurance_date}
                        onChange={(e) => setForm({ ...form, insurance_date: e.target.value })}
                      />
                    </FormField>
                  </div>

                  <SubmitButton loading={submitting} variant="primary">
                    登録する
                  </SubmitButton>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}
