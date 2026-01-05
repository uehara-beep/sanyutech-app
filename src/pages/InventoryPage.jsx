import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton, SummaryCardSkeleton } from '../components/ui/Skeleton'
import FormField, { Input, Select, SubmitButton } from '../components/form/FormField'
import { api } from '../utils/api'
import { required, validateForm, isPositive } from '../utils/validators'
import { useThemeStore, backgroundStyles } from '../store'

const CATEGORIES = [
  { value: '安全用品', label: '安全用品' },
  { value: '工具', label: '工具' },
  { value: '資材', label: '資材' },
  { value: '消耗品', label: '消耗品' },
  { value: 'その他', label: 'その他' },
]

export default function InventoryPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [inventory, setInventory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showTransaction, setShowTransaction] = useState(null)
  const [filter, setFilter] = useState('all') // all, low
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '個',
    quantity: '',
    min_quantity: '',
    location: '',
  })

  const [transactionForm, setTransactionForm] = useState({
    quantity: '',
    note: '',
  })
  const [transactionErrors, setTransactionErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [inventoryRes, lowStockRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/low-stock'),
      ])

      if (inventoryRes.success !== false) setInventory(inventoryRes.data || inventoryRes || [])
      if (lowStockRes.success !== false) setLowStockItems(lowStockRes.data || lowStockRes || [])
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

  const validateInventoryForm = () => {
    const schema = {
      name: [(v) => required(v, '品名')],
      quantity: [(v) => required(v, '在庫数量')],
    }
    const { isValid, errors: validationErrors } = validateForm(form, schema)
    setErrors(validationErrors)
    return { isValid, errors: validationErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { isValid } = validateInventoryForm()
    if (!isValid) return

    setSubmitting(true)
    try {
      const result = await api.post('/inventory', {
        ...form,
        quantity: parseFloat(form.quantity) || 0,
        min_quantity: parseFloat(form.min_quantity) || 0,
      })
      if (result.success || result.id) {
        showToast('保存しました', 'success')
        setShowForm(false)
        setForm({ name: '', category: '', unit: '個', quantity: '', min_quantity: '', location: '' })
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

  const validateTransactionForm = () => {
    const schema = {
      quantity: [
        (v) => required(v, '数量'),
        (v) => isPositive(v, '数量'),
      ],
    }
    const { isValid, errors: validationErrors } = validateForm(transactionForm, schema)
    setTransactionErrors(validationErrors)
    return { isValid, errors: validationErrors }
  }

  const handleTransaction = async (type) => {
    const { isValid } = validateTransactionForm()
    if (!isValid || !showTransaction) return

    setSubmitting(true)
    try {
      const result = await api.post('/inventory/adjust', {
        item_id: showTransaction.id,
        adjustment_type: type,
        quantity: parseFloat(transactionForm.quantity),
        note: transactionForm.note,
      })
      if (result.success || result.id || result.message) {
        showToast(type === 'in' ? '入庫しました' : '出庫しました', 'success')
        setShowTransaction(null)
        setTransactionForm({ quantity: '', note: '' })
        setTransactionErrors({})
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '処理に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const isLowStock = (item) => {
    return item.quantity <= (item.min_quantity || 0)
  }

  const filteredInventory = filter === 'all'
    ? inventory
    : inventory.filter(item => isLowStock(item))

  const lowStockCount = inventory.filter(item => isLowStock(item)).length

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="在庫管理"
        icon="📦"
        gradient="from-blue-800 to-blue-400"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* アラートサマリー */}
        {loading ? (
          <SummaryCardSkeleton />
        ) : lowStockCount > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" size={28} />
              <div>
                <div className="text-sm font-bold text-red-400">在庫少アラート</div>
                <div className="text-xs text-slate-300">
                  {lowStockCount}件の在庫が最小数量を下回っています
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* サマリー */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">在庫品目数</div>
              <div className="text-lg font-bold text-blue-400">{inventory.length}件</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">在庫少</div>
              <div className="text-lg font-bold text-red-400">{lowStockCount}件</div>
            </Card>
          </div>
        )}

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { id: 'all', label: '全て' },
            { id: 'low', label: '在庫少' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                filter === f.id ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.label}
              {f.id === 'low' && lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-[10px] rounded-full">{lowStockCount}</span>
              )}
            </button>
          ))}
        </div>

        <SectionTitle>📦 在庫一覧（{filteredInventory.length}件）</SectionTitle>

        {loading ? (
          <ListSkeleton count={8} showHeader={false} />
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <div>在庫がありません</div>
          </div>
        ) : (
          filteredInventory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={`mb-3 cursor-pointer ${isLowStock(item) ? 'border-l-4 border-red-500' : ''}`}
                onClick={() => setShowTransaction(item)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">{item.name}</span>
                      {isLowStock(item) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400">
                          在庫少
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {item.category || '未分類'} / {item.location || '未設定'}
                      </span>
                      <span className={`text-lg font-bold ${isLowStock(item) ? 'text-red-400' : 'text-blue-400'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      最小数量: {item.min_quantity || 0} {item.unit}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 新規追加モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold">📦 在庫追加</h3>
              <button onClick={() => { setShowForm(false); setErrors({}) }} className="text-2xl text-slate-400">×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <FormField label="品名" required error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ヘルメット"
                    error={errors.name}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="カテゴリ">
                    <Select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="選択"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="単位">
                    <Input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="個"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="在庫数量" required error={errors.quantity}>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="10"
                      error={errors.quantity}
                    />
                  </FormField>
                  <FormField label="最小数量">
                    <Input
                      type="number"
                      value={form.min_quantity}
                      onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                      placeholder="5"
                    />
                  </FormField>
                </div>

                <FormField label="保管場所">
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="倉庫A"
                  />
                </FormField>

                <SubmitButton loading={submitting} variant="primary">
                  追加する
                </SubmitButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 入出庫モーダル */}
      {showTransaction && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-bold">📦 {showTransaction.name}</h3>
                <div className="text-sm text-slate-400">
                  現在庫: {showTransaction.quantity} {showTransaction.unit}
                </div>
              </div>
              <button onClick={() => { setShowTransaction(null); setTransactionErrors({}) }} className="text-2xl text-slate-400">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <FormField label="数量" required error={transactionErrors.quantity}>
                  <Input
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                    placeholder="0"
                    error={transactionErrors.quantity}
                  />
                </FormField>

                <FormField label="メモ">
                  <Input
                    value={transactionForm.note}
                    onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                    placeholder="備考を入力（任意）"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTransaction('in')}
                    disabled={submitting}
                    className="py-3 bg-emerald-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? '...' : <><ArrowDownToLine size={18} /> 入庫</>}
                  </button>
                  <button
                    onClick={() => handleTransaction('out')}
                    disabled={submitting}
                    className="py-3 bg-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? '...' : <><ArrowUpFromLine size={18} /> 出庫</>}
                  </button>
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
