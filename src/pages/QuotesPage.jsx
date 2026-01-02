import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, FileText, CheckCircle, Send, ChevronRight, X, Download, PlayCircle, XCircle, Flag } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Button, Modal, Input, Toast, Empty } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

// テーマ対応スタイル生成
const useThemeStyles = () => {
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  return {
    currentBg,
    isOcean,
    isLightTheme,
    cardBg: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)',
    cardBorder: isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)',
    inputBg: isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f',
    secondaryBg: isOcean ? 'rgba(255,255,255,0.08)' : isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(60,60,62,0.5)',
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }
}

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount) return '¥0'
  return `¥${amount.toLocaleString()}`
}

// ステータス定義（現場台帳用）
const STATUS_CONFIG = {
  pending: {
    label: '見積中',
    color: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    dotColor: '#f59e0b',
    icon: '🟡'
  },
  accepted: {
    label: '受注済み',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    dotColor: '#3b82f6',
    icon: '🔵'
  },
  working: {
    label: '施工中',
    color: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    dotColor: '#10b981',
    icon: '🟢'
  },
  completed: {
    label: '完工',
    color: 'bg-slate-500/20',
    textColor: 'text-slate-400',
    dotColor: '#64748b',
    icon: '⚪'
  },
  lost: {
    label: '失注',
    color: 'bg-red-500/20',
    textColor: 'text-red-400',
    dotColor: '#ef4444',
    icon: '🔴'
  },
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()
  const styles = useThemeStyles()
  const { currentBg, cardBg, cardBorder, inputBg, isOcean } = styles
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  // ステータス: 見積中 → 受注済み → 施工中 → 完工 / 失注
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'accepted' | 'working' | 'completed' | 'lost'

  // ステータスマッピング
  const STATUS_MAP = {
    pending: ['見積中', '下書き', 'draft', '送付済', 'sent', '未受注'],
    accepted: ['受注済', 'ordered', '受注済み'],
    working: ['施工中'],
    completed: ['完工'],
    lost: ['失注', 'rejected'],
  }

  const getQuoteStatus = (q) => {
    if (q.status === '失注' || q.status === 'rejected') return 'lost'
    if (q.status === '完工') return 'completed'
    if (q.status === '施工中') return 'working'
    if (q.status === '受注済' || q.status === 'ordered' || q.status === '受注済み' || q.project_id) return 'accepted'
    return 'pending'
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  // 見積一覧取得（全件）
  const fetchQuotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  // ステータスでフィルタリング
  const filteredQuotes = quotes.filter(q => {
    if (statusFilter === 'all') return true
    return getQuoteStatus(q) === statusFilter
  })

  // 件数計算用
  const countByStatus = (status) => quotes.filter(q => getQuoteStatus(q) === status).length

  useEffect(() => {
    fetchQuotes()
  }, [])

  // 見積保存
  const handleSave = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/quotes/${data.id}` : `${API_BASE}/quotes`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        showToast(data.id ? '見積書を更新しました' : '見積書を作成しました')
        setShowModal(false)
        setEditData(null)
        await fetchQuotes()
      }
    } catch (error) {
      console.error('Failed to save quote:', error)
      showToast('保存に失敗しました', 'error')
    }
  }

  // 見積削除
  const handleDelete = async (quoteId) => {
    if (!confirm('この見積書を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('見積書を削除しました')
        await fetchQuotes()
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
    }
  }

  // ステータス変更共通処理
  const handleStatusChange = async (quoteId, projectName, newStatus, message) => {
    if (!confirm(`「${projectName}」を${message}にしますか？`)) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        showToast(`${message}にしました`)
        await fetchQuotes()
      } else {
        const error = await res.json()
        showToast(error.detail || 'ステータス変更に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Failed to change status:', error)
      showToast('エラーが発生しました', 'error')
    }
  }

  // 受注に変換
  const handleAcceptOrder = async (quoteId, projectName) => {
    if (!confirm(`「${projectName}」を受注しますか？`)) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}/accept`, {
        method: 'PUT'
      })

      if (res.ok) {
        const result = await res.json()
        showToast(result.message || '受注しました')
        await fetchQuotes()
      } else {
        const error = await res.json()
        showToast(error.detail || '受注処理に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Failed to accept order:', error)
      showToast('エラーが発生しました', 'error')
    }
  }

  // 失注
  const handleLostOrder = (quoteId, projectName) => {
    handleStatusChange(quoteId, projectName, '失注', '失注')
  }

  // 施工開始
  const handleStartWork = (quoteId, projectName) => {
    handleStatusChange(quoteId, projectName, '施工中', '施工中')
  }

  // 完工
  const handleComplete = (quoteId, projectName) => {
    handleStatusChange(quoteId, projectName, '完工', '完工')
  }

  // PDF出力
  const handleDownloadPDF = async (quoteId, projectName) => {
    try {
      showToast('PDF生成中...')
      const res = await fetch(`${API_BASE}/quotes/${quoteId}/pdf`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `見積書_${projectName || '見積書'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('PDFをダウンロードしました')
      } else {
        showToast('PDF生成に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
      showToast('エラーが発生しました', 'error')
    }
  }

  const getStatusBadge = (quote) => {
    const status = getQuoteStatus(quote)
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${config.color} ${config.textColor}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBg.bg }}>
      <PageHeader title="現場台帳" icon="📋" onBack={() => navigate(-1)} />

      <div className="p-4">
        {/* 新規作成ボタン */}
        <div className="flex gap-2 mb-4">
          <Button className="flex-1" onClick={() => navigate('/quotes/new')}>
            <Plus size={16} className="inline mr-1" />新規案件
          </Button>
          <Button onClick={() => navigate('/quotes/import')} style={{ background: inputBg }}>
            📥 取込
          </Button>
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {[
            { value: 'all', label: '全て', count: quotes.length, icon: null },
            { value: 'pending', label: '見積中', count: countByStatus('pending'), icon: '🟡' },
            { value: 'accepted', label: '受注済み', count: countByStatus('accepted'), icon: '🔵' },
            { value: 'working', label: '施工中', count: countByStatus('working'), icon: '🟢' },
            { value: 'completed', label: '完工', count: countByStatus('completed'), icon: '⚪' },
            { value: 'lost', label: '失注', count: countByStatus('lost'), icon: '🔴' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === tab.value ? 'text-white' : ''
              }`}
              style={{
                background: statusFilter === tab.value ? theme.primary : inputBg,
                color: statusFilter === tab.value ? 'white' : currentBg.textLight,
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              <span className="opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>

        <SectionTitle>
          {statusFilter === 'all' ? '案件一覧' : STATUS_CONFIG[statusFilter]?.label || '案件一覧'}
        </SectionTitle>

        {/* 見積一覧 */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : filteredQuotes.length === 0 ? (
          <Empty
            icon="📝"
            title={statusFilter === 'accepted' ? '受注済みの見積書がありません' : '見積書がありません'}
            subtitle={statusFilter === 'pending' ? '「新規作成」ボタンから見積書を作成してください' : ''}
          />
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              const status = getQuoteStatus(quote)
              const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending
              const totalAmount = quote.total_amount || quote.total || 0
              const grossProfit = totalAmount - (quote.actual_cost || quote.sales_budget || 0)
              const profitRate = totalAmount > 0 ? ((grossProfit / totalAmount) * 100).toFixed(1) : 0

              return (
                <motion.div
                  key={quote.id}
                  className="rounded-xl p-4 cursor-pointer"
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    backdropFilter: isOcean ? 'blur(10px)' : 'none',
                    borderLeft: `4px solid ${statusConfig.dotColor}`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/projects/${quote.id}`)}
                >
                  {/* ステータスバッジ */}
                  <div className="mb-2">
                    {getStatusBadge(quote)}
                  </div>

                  {/* 工事名 */}
                  <div className="font-semibold text-base mb-1" style={{ color: currentBg.text }}>
                    {quote.project_name || quote.title || '無題'}
                  </div>

                  {/* 元請け */}
                  <div className="text-sm mb-1" style={{ color: currentBg.textLight }}>
                    {quote.client_name || '元請け未設定'}
                  </div>

                  {/* 場所 */}
                  {quote.location && (
                    <div className="text-xs mb-2" style={{ color: currentBg.textLight }}>
                      📍 {quote.location}
                    </div>
                  )}

                  {/* 金額と利益 */}
                  <div className="flex items-end justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>見積金額</div>
                      <div className="text-lg font-bold" style={{ color: theme.primary }}>
                        {formatMoney(totalAmount)}
                      </div>
                    </div>
                    {status !== 'lost' && totalAmount > 0 && (
                      <div className="text-right">
                        <div className="text-xs" style={{ color: currentBg.textLight }}>粗利</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold" style={{ color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
                            {formatMoney(grossProfit)}
                          </span>
                          <span className="text-xs" style={{ color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
                            （{profitRate}%）
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* 見積作成/編集モーダル */}
      {showModal && (
        <QuoteModal
          data={editData}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={handleSave}
        />
      )}

      {/* トースト */}
      <Toast
        message={toast.message}
        isVisible={toast.show}
        type={toast.type}
      />
    </div>
  )
}

// 見積作成/編集モーダル
function QuoteModal({ data, onClose, onSave }) {
  const styles = useThemeStyles()
  const { currentBg, cardBg, cardBorder, inputBg, isOcean } = styles
  const [form, setForm] = useState({
    title: '',
    client_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
    items: [{ name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        title: data.title || '',
        client_name: data.client_name || '',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        valid_until: data.valid_until || '',
        notes: data.notes || '',
        items: data.items?.length > 0 ? data.items : [{ name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
      })
    }
  }, [data])

  const updateItem = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0
      const price = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(newItems[index].unit_price) || 0
      newItems[index].amount = Math.round(qty * price)
    }

    setForm({ ...form, items: newItems })
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
    })
  }

  const removeItem = (index) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const subtotal = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const taxAmount = Math.floor(subtotal * 0.1)
  const total = subtotal + taxAmount

  const handleSubmit = () => {
    if (!form.title) {
      alert('工事名を入力してください')
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl w-full max-w-lg flex flex-col"
        style={{
          background: cardBg,
          backdropFilter: isOcean ? 'blur(10px)' : 'none',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <h2 className="text-lg font-bold" style={{ color: currentBg.text }}>
            {data ? '見積書を編集' : '見積書を作成'}
          </h2>
          <button onClick={onClose} className="p-2 hover:opacity-80" style={{ color: currentBg.textLight }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Input
            label="工事名・件名 *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例: ○○道路舗装工事"
          />

          <Input
            label="元請け・発注者"
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            placeholder="例: 福岡県"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="発行日"
              type="date"
              value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            />
            <Input
              label="有効期限"
              type="date"
              value={form.valid_until}
              onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            />
          </div>

          {/* 明細 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: currentBg.textLight }}>明細</label>
              <button
                onClick={addItem}
                className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg"
              >
                + 行追加
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="rounded-lg p-3" style={{ background: inputBg, border: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs w-6" style={{ color: currentBg.textLight }}>{index + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="品名・工種"
                      className="flex-1 px-2 py-1.5 bg-transparent rounded text-sm"
                      style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                    />
                    {form.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-400 p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder="数量"
                      className="px-2 py-1.5 bg-transparent rounded text-sm text-right"
                      style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="単位"
                      className="px-2 py-1.5 bg-transparent rounded text-sm text-center"
                      style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      placeholder="単価"
                      className="px-2 py-1.5 bg-transparent rounded text-sm text-right"
                      style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                    />
                    <div className="px-2 py-1.5 rounded text-sm text-right font-medium" style={{ background: cardBorder, color: currentBg.text }}>
                      ¥{(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 合計 */}
          <div className="rounded-lg p-3" style={{ background: inputBg, border: `1px solid ${cardBorder}` }}>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: currentBg.textLight }}>小計</span>
              <span style={{ color: currentBg.text }}>¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: currentBg.textLight }}>消費税 (10%)</span>
              <span style={{ color: currentBg.text }}>¥{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <span style={{ color: currentBg.text }}>合計</span>
              <span className="text-orange-500">¥{total.toLocaleString()}</span>
            </div>
          </div>

          <Input
            label="備考"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="備考・特記事項"
          />
        </div>

        <div className="p-4 flex gap-3 flex-shrink-0" style={{ borderTop: `1px solid ${cardBorder}`, paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium"
            style={{ background: inputBg, color: currentBg.textLight }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium"
          >
            保存
          </button>
        </div>
      </motion.div>
    </div>
  )
}
