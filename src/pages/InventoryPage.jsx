import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'

const API_BASE = '/api'

export default function InventoryPage() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTransaction, setShowTransaction] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    quantity: '',
    min_quantity: '',
    location: '',
  })

  const [transactionForm, setTransactionForm] = useState({
    quantity: '',
    note: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [inventoryRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/inventory/`),
        fetch(`${API_BASE}/inventory/alerts`),
      ])

      if (inventoryRes.ok) setInventory(await inventoryRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          unit: form.unit,
          quantity: parseFloat(form.quantity) || 0,
          min_quantity: parseFloat(form.min_quantity) || 0,
          location: form.location,
        }),
      })

      if (res.ok) {
        showToast('在庫を追加しました')
        setShowForm(false)
        setForm({
          name: '',
          category: '',
          unit: '',
          quantity: '',
          min_quantity: '',
          location: '',
        })
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleTransaction = async (type) => {
    if (!showTransaction || !transactionForm.quantity) return

    try {
      const res = await fetch(`${API_BASE}/inventory/${showTransaction.id}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(transactionForm.quantity),
          note: transactionForm.note,
        }),
      })

      if (res.ok) {
        showToast(type === 'in' ? '入庫しました' : '出庫しました')
        setShowTransaction(null)
        setTransactionForm({ quantity: '', note: '' })
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const isLowStock = (item) => {
    return item.quantity <= item.min_quantity
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="在庫管理"
        icon="📦"
        gradient="from-blue-800 to-blue-400"
        onBack={() => navigate('/')}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* アラート */}
        {alerts.length > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-red-900/50 to-red-800/50 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <div className="text-sm font-bold text-red-400">在庫少アラート</div>
                <div className="text-xs text-slate-300">
                  {alerts.length}件の在庫が最小数量を下回っています
                </div>
              </div>
            </div>
          </Card>
        )}

        <SectionTitle>📦 在庫一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>在庫がありません</div>
          </div>
        ) : (
          inventory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
                      <span className={`text-lg font-bold ${isLowStock(item) ? 'text-red-400' : 'text-app-primary'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      最小数量: {item.min_quantity} {item.unit}
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
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowForm(false)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-6">在庫追加</div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">品名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ヘルメット"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">カテゴリ</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="安全用品"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">単位</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="個"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">在庫数量</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="10"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">最小数量</label>
                <input
                  type="number"
                  value={form.min_quantity}
                  onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                  placeholder="5"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">保管場所</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="倉庫A"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-app-primary rounded-xl font-bold text-white"
            >
              追加する
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* 入出庫モーダル */}
      {showTransaction && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowTransaction(null)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl p-6"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-2">{showTransaction.name}</div>
            <div className="text-sm text-slate-400 mb-6">
              現在庫: {showTransaction.quantity} {showTransaction.unit}
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">数量</label>
              <input
                type="number"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                placeholder="0"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">メモ（任意）</label>
              <input
                type="text"
                value={transactionForm.note}
                onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                placeholder="備考を入力"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTransaction('in')}
                className="py-4 bg-emerald-500 rounded-xl font-bold text-white"
              >
                入庫
              </button>
              <button
                onClick={() => handleTransaction('out')}
                className="py-4 bg-red-500 rounded-xl font-bold text-white"
              >
                出庫
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
