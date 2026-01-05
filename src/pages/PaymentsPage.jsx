import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE, getAuthHeaders } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({ total_amount: 0, paid_amount: 0, unpaid_amount: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '' })
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders()
      const [paymentsRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/payments`, { headers }),
        fetch(`${API_BASE}/payments/summary`, { headers }),
      ])

      if (paymentsRes.ok) setPayments(await paymentsRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
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

  const handleOpenPayModal = (payment) => {
    setSelectedPayment(payment)
    setPayAmount(payment.remaining_amount?.toString() || payment.amount?.toString() || '')
    setShowPayModal(true)
  }

  const handlePay = async () => {
    if (!selectedPayment || !payAmount) return

    try {
      const res = await fetch(`${API_BASE}/payments/${selectedPayment.id}/pay`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(payAmount),
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bank_transfer',
        }),
      })

      if (res.ok) {
        showToast('支払を記録しました')
        setShowPayModal(false)
        setSelectedPayment(null)
        fetchData()
      } else {
        showToast('支払記録に失敗しました')
      }
    } catch (error) {
      showToast('通信エラー')
    }
  }

  const getStatusStyle = (status) => ({
    unpaid: 'bg-red-500/20 text-red-400',
    partial: 'bg-amber-500/20 text-amber-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
  }[status] || 'bg-slate-500/20 text-slate-400')

  const getStatusLabel = (status) => ({
    unpaid: '未払い',
    partial: '一部支払',
    paid: '支払済',
  }[status] || status)

  const getStatusIcon = (status) => ({
    unpaid: <AlertCircle size={14} className="text-red-400" />,
    partial: <Clock size={14} className="text-amber-400" />,
    paid: <CheckCircle size={14} className="text-emerald-400" />,
  }[status] || null)

  const filteredPayments = filter === 'all'
    ? payments
    : payments.filter(p => p.status === filter)

  const formatAmount = (amount) => `¥${(amount || 0).toLocaleString()}`

  // 今月の支払予定
  const thisMonth = new Date().toISOString().slice(0, 7)
  const thisMonthPayments = payments.filter(p =>
    p.status !== 'paid' && p.due_date?.startsWith(thisMonth)
  )
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + (p.remaining_amount || p.amount || 0), 0)

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="支払管理"
        icon="💳"
        gradient="from-orange-700 to-orange-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400 mb-1">支払総額</div>
            <div className="text-sm font-bold">{formatAmount(summary.total_amount)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400 mb-1">未払い</div>
            <div className="text-sm font-bold text-red-400">{formatAmount(summary.unpaid_amount)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400 mb-1">支払済</div>
            <div className="text-sm font-bold text-emerald-400">{formatAmount(summary.paid_amount)}</div>
          </Card>
        </div>

        {/* 今月の支払予定 */}
        {thisMonthPayments.length > 0 && (
          <Card className="mb-4 border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-400" />
              <span className="text-sm font-semibold">今月の支払予定</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{formatAmount(thisMonthTotal)}</div>
            <div className="text-xs text-slate-400 mt-1">{thisMonthPayments.length}件の支払い</div>
          </Card>
        )}

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'unpaid', label: '未払い' },
            { id: 'partial', label: '一部支払' },
            { id: 'paid', label: '支払済' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-orange-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <SectionTitle>💳 支払一覧（{filteredPayments.length}件）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">💳</div>
            <div>支払データがありません</div>
          </div>
        ) : (
          filteredPayments.map((payment, i) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`mb-3 ${payment.status === 'unpaid' && new Date(payment.due_date) < new Date() ? 'border-l-4 border-red-500' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{payment.vendor_name || '未設定'}</div>
                    {payment.order_number && (
                      <div className="text-xs text-orange-400 font-mono">{payment.order_number}</div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${getStatusStyle(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    {getStatusLabel(payment.status)}
                  </span>
                </div>

                {payment.project_name && (
                  <div className="text-xs text-slate-400 mb-2">📍 {payment.project_name}</div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-xs text-slate-400">支払金額</div>
                    <div className="font-bold">{formatAmount(payment.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">支払期限</div>
                    <div className={payment.status !== 'paid' && new Date(payment.due_date) < new Date() ? 'text-red-400 font-bold' : ''}>
                      {payment.due_date || '未設定'}
                    </div>
                  </div>
                </div>

                {payment.status === 'partial' && (
                  <div className="bg-amber-900/20 rounded-lg p-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">支払済</span>
                      <span className="text-emerald-400">{formatAmount(payment.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">残額</span>
                      <span className="text-amber-400 font-bold">{formatAmount(payment.remaining_amount)}</span>
                    </div>
                  </div>
                )}

                {payment.status !== 'paid' && (
                  <button
                    onClick={() => handleOpenPayModal(payment)}
                    className="w-full py-2 bg-orange-600 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    支払を記録
                  </button>
                )}

                {payment.status === 'paid' && payment.payment_date && (
                  <div className="text-xs text-emerald-400 text-center">
                    ✓ {payment.payment_date} に支払済
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 支払記録モーダル */}
      {showPayModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-800 rounded-2xl p-5"
          >
            <h3 className="text-lg font-bold mb-4">💳 支払記録</h3>

            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="text-sm font-semibold mb-1">{selectedPayment.vendor_name}</div>
              {selectedPayment.order_number && (
                <div className="text-xs text-orange-400">{selectedPayment.order_number}</div>
              )}
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-400">
                  {selectedPayment.status === 'partial' ? '残額' : '支払金額'}
                </span>
                <span className="font-bold">
                  {formatAmount(selectedPayment.remaining_amount || selectedPayment.amount)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">支払金額</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-700 rounded-lg pl-8 pr-4 py-3 text-sm"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setPayAmount(selectedPayment.remaining_amount?.toString() || selectedPayment.amount?.toString() || '')}
                  className="px-3 py-1 bg-slate-700 rounded text-xs"
                >
                  全額
                </button>
                <button
                  onClick={() => setPayAmount(Math.floor((selectedPayment.remaining_amount || selectedPayment.amount) / 2).toString())}
                  className="px-3 py-1 bg-slate-700 rounded text-xs"
                >
                  半額
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 bg-slate-700 rounded-xl text-sm font-semibold"
              >
                キャンセル
              </button>
              <button
                onClick={handlePay}
                className="flex-1 py-3 bg-orange-600 rounded-xl text-sm font-semibold"
              >
                支払を記録
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
