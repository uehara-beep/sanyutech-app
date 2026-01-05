import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Download, CheckCircle, Trash2 } from 'lucide-react'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE, getAuthHeaders } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [orders, setOrders] = useState([])
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    project_id: '',
    vendor_id: '',
    vendor_name: '',
    delivery_date: '',
    payment_terms: '末締め翌月末払い',
    note: '',
    items: [{ name: '', spec: '', quantity: 1, unit: '式', unit_price: 0 }],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders()
      const [ordersRes, projectsRes, vendorsRes] = await Promise.all([
        fetch(`${API_BASE}/purchase-orders`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/subcontractors`, { headers }).catch(() => null),
      ])

      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (vendorsRes?.ok) setVendors(await vendorsRes.json())
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

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', spec: '', quantity: 1, unit: '式', unit_price: 0 }]
    }))
  }

  const handleRemoveItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotal = () => {
    const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax = Math.floor(subtotal * 0.1)
    return { subtotal, tax, total: subtotal + tax }
  }

  const handleSubmit = async () => {
    if (!form.vendor_name && !form.vendor_id) {
      showToast('発注先を入力してください')
      return
    }

    if (form.items.every(item => !item.name)) {
      showToast('明細を入力してください')
      return
    }

    try {
      const { subtotal, tax, total } = calculateTotal()
      const res = await fetch(`${API_BASE}/purchase-orders`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          project_id: form.project_id ? parseInt(form.project_id) : null,
          vendor_id: form.vendor_id ? parseInt(form.vendor_id) : null,
          subtotal,
          tax_amount: tax,
          total_amount: total,
          items: form.items.filter(item => item.name).map(item => ({
            ...item,
            amount: item.quantity * item.unit_price
          })),
        }),
      })

      if (res.ok) {
        showToast('発注書を作成しました')
        setShowModal(false)
        setForm({
          project_id: '',
          vendor_id: '',
          vendor_name: '',
          delivery_date: '',
          payment_terms: '末締め翌月末払い',
          note: '',
          items: [{ name: '', spec: '', quantity: 1, unit: '式', unit_price: 0 }],
        })
        fetchData()
      } else {
        showToast('作成に失敗しました')
      }
    } catch (error) {
      showToast('通信エラー')
    }
  }

  const handleDownloadPDF = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/purchase-orders/${orderId}/pdf`, {
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `purchase-order-${orderId}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
        showToast('PDFをダウンロードしました')
      }
    } catch (error) {
      showToast('ダウンロードに失敗しました')
    }
  }

  const handleReceiveAcceptance = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptance_received: true,
          acceptance_date: new Date().toISOString().split('T')[0],
          status: 'confirmed',
        }),
      })

      if (res.ok) {
        showToast('注文請書を受領しました')
        fetchData()
      }
    } catch (error) {
      showToast('更新に失敗しました')
    }
  }

  const handleDelete = async (orderId) => {
    if (!confirm('この発注書を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/purchase-orders/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (error) {
      showToast('削除に失敗しました')
    }
  }

  const getStatusStyle = (status) => ({
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    confirmed: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-purple-500/20 text-purple-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }[status] || 'bg-slate-500/20 text-slate-400')

  const getStatusLabel = (status) => ({
    draft: '下書き',
    sent: '発注済',
    confirmed: '請書受領',
    completed: '完了',
    cancelled: 'キャンセル',
  }[status] || status)

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const formatAmount = (amount) => `¥${(amount || 0).toLocaleString()}`

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="発注書（注文書）"
        icon="📝"
        gradient="from-blue-700 to-blue-500"
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
        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'draft', label: '下書き' },
            { id: 'sent', label: '発注済' },
            { id: 'confirmed', label: '請書受領' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <SectionTitle>📝 発注書一覧（{filteredOrders.length}件）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">📝</div>
            <div>発注書がありません</div>
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs text-blue-400 font-mono">{order.order_number}</div>
                    <div className="font-semibold">{order.vendor_name || '未設定'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {order.project_name && (
                  <div className="text-xs text-slate-400 mb-2">📍 {order.project_name}</div>
                )}

                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-slate-400">{order.order_date}</span>
                  <span className="text-blue-400 font-bold">{formatAmount(order.total_amount)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(order.id)}
                    className="flex-1 py-2 bg-slate-700 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                  {order.status === 'sent' && !order.acceptance_received && (
                    <button
                      onClick={() => handleReceiveAcceptance(order.id)}
                      className="flex-1 py-2 bg-emerald-600 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={14} />
                      請書受領
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 新規作成モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold">📝 新規発注書</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-blue-600 rounded-lg text-sm font-bold"
                >
                  作成
                </button>
                <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {/* 発注先 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">発注先 *</label>
                  {vendors.length > 0 ? (
                    <select
                      value={form.vendor_id}
                      onChange={(e) => {
                        const vendor = vendors.find(v => v.id === parseInt(e.target.value))
                        setForm({ ...form, vendor_id: e.target.value, vendor_name: vendor?.name || '' })
                      }}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                    >
                      <option value="">選択してください</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.vendor_name}
                      onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="業者名を入力"
                    />
                  )}
                </div>

                {/* 工事 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">工事（任意）</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                  >
                    <option value="">選択してください</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* 納期 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">納期</label>
                  <input
                    type="date"
                    value={form.delivery_date}
                    onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                {/* 支払条件 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">支払条件</label>
                  <select
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                  >
                    <option value="末締め翌月末払い">末締め翌月末払い</option>
                    <option value="20日締め翌月末払い">20日締め翌月末払い</option>
                    <option value="都度払い">都度払い</option>
                  </select>
                </div>

                {/* 明細 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-slate-400">明細</label>
                    <button
                      onClick={handleAddItem}
                      className="text-xs text-blue-400"
                    >
                      + 行追加
                    </button>
                  </div>

                  {form.items.map((item, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-3 mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-slate-400">明細 {index + 1}</span>
                        {form.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 text-xs"
                          >
                            削除
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="品名"
                        className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm mb-2"
                      />
                      <input
                        type="text"
                        value={item.spec}
                        onChange={(e) => handleItemChange(index, 'spec', e.target.value)}
                        placeholder="規格・仕様"
                        className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm mb-2"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="数量"
                          className="bg-slate-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          placeholder="単位"
                          className="bg-slate-600 rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseInt(e.target.value) || 0)}
                          placeholder="単価"
                          className="bg-slate-600 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="text-right text-sm text-blue-400 mt-2">
                        金額: {formatAmount(item.quantity * item.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 合計 */}
                <div className="bg-blue-900/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>小計</span>
                    <span>{formatAmount(calculateTotal().subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>消費税（10%）</span>
                    <span>{formatAmount(calculateTotal().tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-blue-700 pt-2 mt-2">
                    <span>合計</span>
                    <span className="text-blue-400">{formatAmount(calculateTotal().total)}</span>
                  </div>
                </div>

                {/* 備考 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">備考</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={3}
                    placeholder="備考を入力"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
