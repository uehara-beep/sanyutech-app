import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Calendar, Check, X, Clock } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton, SummaryCardSkeleton } from '../components/ui/Skeleton'
import FormField, { Input, Select, Textarea, DateInput, SubmitButton } from '../components/form/FormField'
import { api } from '../utils/api'
import { required, isDateRange, validateForm } from '../utils/validators'
import { useThemeStore, backgroundStyles, useAuthStore } from '../store'

const LEAVE_TYPES = [
  { value: '有給', label: '有給休暇' },
  { value: '慶弔', label: '慶弔休暇' },
  { value: '特別', label: '特別休暇' },
  { value: '欠勤', label: '欠勤' },
]

export default function LeavesPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const { user } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isAdmin = user?.role === 'admin'

  const [leaves, setLeaves] = useState([])
  const [balance, setBalance] = useState({ total_days: 0, used_days: 0, remaining_days: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    days: 1,
    reason: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/leaves'),
        api.get('/leaves/balance'),
      ])
      if (leavesRes.success) setLeaves(leavesRes.data || leavesRes)
      if (balanceRes.success) setBalance(balanceRes.data || balanceRes)
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

  const validateLeaveForm = () => {
    const schema = {
      leave_type: [(v) => required(v, '休暇種類')],
      start_date: [(v) => required(v, '開始日')],
      end_date: [(v) => required(v, '終了日')],
      days: [(v) => required(v, '日数')],
    }
    const { isValid, errors: validationErrors } = validateForm(form, schema)

    // 日付範囲チェック
    if (form.start_date && form.end_date) {
      const rangeCheck = isDateRange(form.start_date, form.end_date)
      if (!rangeCheck.valid) {
        validationErrors.end_date = rangeCheck.error
        return { isValid: false, errors: validationErrors }
      }
    }

    setErrors(validationErrors)
    return { isValid, errors: validationErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid } = validateLeaveForm()
    if (!isValid) return

    setSubmitting(true)
    try {
      const result = await api.post('/leaves', form)
      if (result.success || result.id) {
        showToast('保存しました', 'success')
        setShowModal(false)
        setForm({ leave_type: '', start_date: '', end_date: '', days: 1, reason: '' })
        setErrors({})
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '申請に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (leaveId) => {
    try {
      const result = await api.put(`/leaves/${leaveId}/approve`)
      if (result.success || result.message) {
        showToast('承認しました', 'success')
        fetchData()
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 承認に失敗しました', 'error')
    }
  }

  const handleReject = async (leaveId) => {
    const reason = prompt('却下理由を入力してください')
    if (reason === null) return

    try {
      const result = await api.put(`/leaves/${leaveId}/reject?reason=${encodeURIComponent(reason)}`)
      if (result.success || result.message) {
        showToast('却下しました', 'success')
        fetchData()
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 却下に失敗しました', 'error')
    }
  }

  const getStatusStyle = (status) => ({
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  }[status] || 'bg-slate-500/20 text-slate-400')

  const getStatusLabel = (status) => ({
    pending: '申請中',
    approved: '承認済',
    rejected: '却下',
  }[status] || status)

  const filteredLeaves = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="休暇申請"
        icon="📅"
        gradient="from-indigo-700 to-indigo-500"
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
        {/* 有給残高 */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">付与日数</div>
              <div className="text-lg font-bold text-indigo-400">{balance.total_days}日</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">使用日数</div>
              <div className="text-lg font-bold text-amber-400">{balance.used_days}日</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">残日数</div>
              <div className="text-lg font-bold text-emerald-400">{balance.remaining_days}日</div>
            </Card>
          </div>
        )}

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'pending', label: '申請中' },
            { id: 'approved', label: '承認済' },
            { id: 'rejected', label: '却下' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <SectionTitle>📅 申請一覧（{filteredLeaves.length}件）</SectionTitle>

        {loading ? (
          <ListSkeleton count={5} showHeader={false} />
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <div>申請がありません</div>
          </div>
        ) : (
          filteredLeaves.map((leave, i) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{leave.leave_type}</div>
                    <div className="text-sm text-slate-400">
                      {leave.start_date} ～ {leave.end_date}（{leave.days}日）
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(leave.status)}`}>
                    {getStatusLabel(leave.status)}
                  </span>
                </div>
                {leave.reason && (
                  <div className="text-xs text-slate-400 mb-2">理由: {leave.reason}</div>
                )}
                {isAdmin && leave.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      className="flex-1 py-2 bg-emerald-600 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> 承認
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      className="flex-1 py-2 bg-red-600 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <X size={14} /> 却下
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 申請モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold">📅 休暇申請</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400">×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <FormField label="休暇種類" required error={errors.leave_type}>
                  <Select
                    value={form.leave_type}
                    onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                    error={errors.leave_type}
                    placeholder="選択してください"
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="開始日" required error={errors.start_date}>
                    <DateInput
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      error={errors.start_date}
                    />
                  </FormField>
                  <FormField label="終了日" required error={errors.end_date}>
                    <DateInput
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      error={errors.end_date}
                    />
                  </FormField>
                </div>

                <FormField label="取得日数" required error={errors.days} hint="0.5日単位で入力可能">
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: parseFloat(e.target.value) || 0 })}
                    error={errors.days}
                  />
                </FormField>

                <FormField label="理由">
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="理由を入力（任意）"
                  />
                </FormField>

                <SubmitButton loading={submitting} variant="primary">
                  申請する
                </SubmitButton>
              </div>
            </form>
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
