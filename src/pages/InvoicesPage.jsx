import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Download, Send, Trash2 } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton } from '../components/ui/Skeleton'
import { api } from '../utils/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function InvoicesPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [invoices, setInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    project_id: '',
    customer_id: '',
    customer_name: '',
    due_date: '',
    progress_rate: 100,
    note: '',
    items: [{ name: '', spec: '', quantity: 1, unit: '式', unit_price: 0 }],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invoicesRes, projectsRes, clientsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/projects'),
        api.get('/clients').catch(() => ({ data: [] })),
      ])

      if (invoicesRes.success !== false) setInvoices(invoicesRes.data || invoicesRes || [])
      if (projectsRes.success !== false) setProjects(projectsRes.data || projectsRes || [])
      if (clientsRes.success !== false) setClients(clientsRes.data || clientsRes || [])
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
    const progressAmount = Math.floor(subtotal * (form.progress_rate / 100))
    const tax = Math.floor(progressAmount * 0.1)
    return { subtotal, progressAmount, tax, total: progressAmount + tax }
  }

  const handleSubmit = async () => {
    if (!form.customer_name && !form.customer_id) {
      showToast('請求先を入力してください', 'error')
      return
    }

    try {
      const { subtotal, tax, total } = calculateTotal()
      const result = await api.post('/invoices', {
        ...form,
        project_id: form.project_id ? parseInt(form.project_id) : null,
        customer_id: form.customer_id ? parseInt(form.customer_id) : null,
        amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        items: form.items.filter(item => item.name).map(item => ({
          ...item,
          amount: item.quantity * item.unit_price
        })),
      })

      if (result.success || result.id) {
        showToast('保存しました', 'success')
        setShowModal(false)
        setForm({
          project_id: '',
          customer_id: '',
          customer_name: '',
          due_date: '',
          progress_rate: 100,
          note: '',
          items: [{ name: '', spec: '', quantity: 1, unit: '式', unit_price: 0 }],
        })
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '作成に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    }
  }

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const result = await api.download(`/invoices/${invoiceId}/pdf`, `invoice-${invoiceId}.pdf`)
      if (result.success) {
        showToast('請求書をダウンロードしました', 'success')
      } else {
        showToast('エラー: ダウンロードに失敗しました', 'error')
      }
    } catch (error) {
      showToast('エラー: ダウンロードに失敗しました', 'error')
    }
  }

  const handleSend = async (invoiceId) => {
    try {
      const result = await api.put(`/invoices/${invoiceId}`, { status: 'sent' })
      if (result.success || result.id) {
        showToast('送付済みに変更しました', 'success')
        fetchData()
      } else {
        showToast('エラー: 更新に失敗しました', 'error')
      }
    } catch (error) {
      showToast('エラー: 更新に失敗しました', 'error')
    }
  }

  const handleDelete = async (invoiceId) => {
    if (!confirm('この請求書を削除しますか？')) return

    try {
      const result = await api.delete(`/invoices/${invoiceId}`)
      if (result.success || result.message) {
        showToast('削除しました', 'success')
        fetchData()
      } else {
        showToast('エラー: 削除に失敗しました', 'error')
      }
    } catch (error) {
      showToast('エラー: 削除に失敗しました', 'error')
    }
  }

  const getStatusStyle = (status) => ({
    draft: 'bg-slate-500/20 text-slate-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-emerald-500/20 text-emerald-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }[status] || 'bg-slate-500/20 text-slate-400')

  const getStatusLabel = (status) => ({
    draft: '下書き',
    sent: '送付済',
    paid: '入金済',
    overdue: '期限超過',
    cancelled: 'キャンセル',
  }[status] || status)

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter)

  const formatAmount = (amount) => `¥${(amount || 0).toLocaleString()}`

  // 集計
  const stats = {
    total: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
    unpaid: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0),
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="請求書発行"
        icon="📄"
        gradient="from-emerald-700 to-emerald-500"
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
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400">合計</div>
            <div className="text-sm font-bold text-emerald-400">{formatAmount(stats.total)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400">未入金</div>
            <div className="text-sm font-bold text-amber-400">{formatAmount(stats.unpaid)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400">入金済</div>
            <div className="text-sm font-bold text-blue-400">{formatAmount(stats.paid)}</div>
          </Card>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'draft', label: '下書き' },
            { id: 'sent', label: '送付済' },
            { id: 'paid', label: '入金済' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-emerald-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <SectionTitle>📄 請求書一覧（{filteredInvoices.length}件）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">📄</div>
            <div>請求書がありません</div>
          </div>
        ) : (
          filteredInvoices.map((invoice, i) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs text-emerald-400 font-mono">{invoice.invoice_number}</div>
                    <div className="font-semibold">{invoice.customer_name || '未設定'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>

                {invoice.project_name && (
                  <div className="text-xs text-slate-400 mb-2">📍 {invoice.project_name}</div>
                )}

                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-slate-400">発行日: {invoice.invoice_date}</span>
                  <span className="text-emerald-400 font-bold">{formatAmount(invoice.total_amount)}</span>
                </div>

                {invoice.progress_rate && invoice.progress_rate < 100 && (
                  <div className="text-xs text-amber-400 mb-2">
                    出来高: {invoice.progress_rate}%
                  </div>
                )}

                <div className="text-xs text-slate-400 mb-3">
                  支払期限: {invoice.due_date || '未設定'}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="flex-1 py-2 bg-slate-700 rounded-lg text-xs flex items-center justify-center gap-1"
                  >
                    <Download size={14} />
                    PDF
                  </button>
                  {invoice.status === 'draft' && (
                    <button
                      onClick={() => handleSend(invoice.id)}
                      className="flex-1 py-2 bg-emerald-600 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Send size={14} />
                      送付済に
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(invoice.id)}
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
              <h3 className="text-lg font-bold">📄 新規請求書</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-emerald-600 rounded-lg text-sm font-bold"
                >
                  作成
                </button>
                <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {/* 請求先 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">請求先 *</label>
                  {clients.length > 0 ? (
                    <select
                      value={form.customer_id}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === parseInt(e.target.value))
                        setForm({ ...form, customer_id: e.target.value, customer_name: client?.name || '' })
                      }}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                    >
                      <option value="">選択してください</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="請求先を入力"
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

                {/* 支払期限 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">支払期限</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                {/* 出来高率 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">出来高率（分割請求用）</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      value={form.progress_rate}
                      onChange={(e) => setForm({ ...form, progress_rate: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-emerald-400 w-12">{form.progress_rate}%</span>
                  </div>
                </div>

                {/* 明細 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-slate-400">明細</label>
                    <button
                      onClick={handleAddItem}
                      className="text-xs text-emerald-400"
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
                      <div className="text-right text-sm text-emerald-400 mt-2">
                        金額: {formatAmount(item.quantity * item.unit_price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 合計 */}
                <div className="bg-emerald-900/30 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>小計</span>
                    <span>{formatAmount(calculateTotal().subtotal)}</span>
                  </div>
                  {form.progress_rate < 100 && (
                    <div className="flex justify-between text-sm mb-1 text-amber-400">
                      <span>出来高（{form.progress_rate}%）</span>
                      <span>{formatAmount(calculateTotal().progressAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mb-1">
                    <span>消費税（10%）</span>
                    <span>{formatAmount(calculateTotal().tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-emerald-700 pt-2 mt-2">
                    <span>請求金額</span>
                    <span className="text-emerald-400">{formatAmount(calculateTotal().total)}</span>
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

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}
