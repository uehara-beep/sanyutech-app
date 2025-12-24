import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, FileText, CheckCircle, Send, ChevronRight, X } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Button, Modal, Input, Toast, Empty } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore } from '../store'

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount) return '¥0'
  return `¥${amount.toLocaleString()}`
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  // 見積一覧取得
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

  // 受注に変換
  const handleConvertToOrder = async (quoteId) => {
    if (!confirm('この見積書を受注に変換しますか？\n工事と工種が自動作成されます。')) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}/convert-to-order`, {
        method: 'POST'
      })

      if (res.ok) {
        const result = await res.json()
        showToast(`受注しました！工事「${result.project_name}」を作成しました`)
        await fetchQuotes()
        // 工事詳細ページへ遷移
        setTimeout(() => {
          navigate(`/sbase/${result.project_id}`)
        }, 1500)
      } else {
        const error = await res.json()
        showToast(error.detail || '変換に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Failed to convert quote:', error)
      showToast('エラーが発生しました', 'error')
    }
  }

  const getStatusBadge = (status, projectId) => {
    if (projectId) {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">受注済</span>
    }
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">下書き</span>
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">送付済</span>
      case 'ordered':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">受注済</span>
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">失注</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-[#1c1c1e]">
      <PageHeader title="見積書一覧" icon="📝" />

      <div className="p-4">
        {/* 新規作成ボタン */}
        <div className="flex justify-between items-center mb-4">
          <SectionTitle>見積書</SectionTitle>
          <Button onClick={() => { setEditData(null); setShowModal(true) }}>
            <Plus size={16} className="inline mr-1" />新規作成
          </Button>
        </div>

        {/* 説明 */}
        <Card className="mb-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
          <div className="text-sm text-orange-400 font-medium mb-1">💡 新しいフロー</div>
          <div className="text-xs text-gray-400">
            1. 見積書を作成（工事名・元請け・明細を入力）<br />
            2. 「受注する」ボタンで工事・工種を自動作成<br />
            3. 工事詳細で原価管理を開始
          </div>
        </Card>

        {/* 見積一覧 */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">読み込み中...</div>
        ) : quotes.length === 0 ? (
          <Empty
            icon="📝"
            title="見積書がありません"
            subtitle="「新規作成」ボタンから見積書を作成してください"
          />
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <motion.div
                key={quote.id}
                className="bg-[#2c2c2e] rounded-xl p-4 border border-[#3c3c3e]"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{quote.quote_no}</span>
                      {getStatusBadge(quote.status, quote.project_id)}
                    </div>
                    <div className="font-medium text-white">{quote.title || '無題'}</div>
                    <div className="text-sm text-gray-400">{quote.client_name || '元請け未設定'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: theme.primary }}>
                      {formatMoney(quote.total)}
                    </div>
                    <div className="text-xs text-gray-500">{quote.items?.length || 0}項目</div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#3c3c3e]">
                  {!quote.project_id && (
                    <>
                      <button
                        onClick={() => handleConvertToOrder(quote.id)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <CheckCircle size={16} />
                        受注する
                      </button>
                      <button
                        onClick={() => { setEditData(quote); setShowModal(true) }}
                        className="p-2 bg-[#3c3c3e] rounded-lg text-gray-400 hover:text-white"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(quote.id)}
                        className="p-2 bg-[#3c3c3e] rounded-lg text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {quote.project_id && (
                    <button
                      onClick={() => navigate(`/sbase/${quote.project_id}`)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1"
                    >
                      工事を見る
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
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
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#2c2c2e] rounded-xl w-full max-w-lg my-8"
      >
        <div className="p-4 border-b border-[#3c3c3e] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {data ? '見積書を編集' : '見積書を作成'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
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
              <label className="text-sm font-medium text-gray-300">明細</label>
              <button
                onClick={addItem}
                className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg"
              >
                + 行追加
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="bg-[#1c1c1e] rounded-lg p-3 border border-[#3c3c3e]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="品名・工種"
                      className="flex-1 px-2 py-1.5 bg-transparent border border-[#3c3c3e] rounded text-sm text-white"
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
                      className="px-2 py-1.5 bg-transparent border border-[#3c3c3e] rounded text-sm text-white text-right"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="単位"
                      className="px-2 py-1.5 bg-transparent border border-[#3c3c3e] rounded text-sm text-white text-center"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      placeholder="単価"
                      className="px-2 py-1.5 bg-transparent border border-[#3c3c3e] rounded text-sm text-white text-right"
                    />
                    <div className="px-2 py-1.5 bg-[#3c3c3e] rounded text-sm text-white text-right font-medium">
                      ¥{(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 合計 */}
          <div className="bg-[#1c1c1e] rounded-lg p-3 border border-[#3c3c3e]">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">小計</span>
              <span className="text-white">¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">消費税 (10%)</span>
              <span className="text-white">¥{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#3c3c3e]">
              <span className="text-white">合計</span>
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

        <div className="p-4 border-t border-[#3c3c3e] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#3c3c3e] text-gray-300 rounded-xl font-medium"
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
