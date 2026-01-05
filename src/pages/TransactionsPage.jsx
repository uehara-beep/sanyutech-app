import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE, getAuthHeaders } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const CATEGORIES = {
  income: [
    { id: 'construction', label: '工事売上', icon: '🏗️' },
    { id: 'other_income', label: 'その他収入', icon: '💰' },
  ],
  expense: [
    { id: 'subcontract', label: '外注費', icon: '👷' },
    { id: 'material', label: '材料費', icon: '🧱' },
    { id: 'labor', label: '労務費', icon: '💼' },
    { id: 'equipment', label: '機械費', icon: '🚜' },
    { id: 'expense', label: '経費', icon: '📝' },
    { id: 'fuel', label: '燃料費', icon: '⛽' },
    { id: 'transport', label: '交通費', icon: '🚗' },
    { id: 'other_expense', label: 'その他', icon: '📦' },
  ],
}

export default function TransactionsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    project_id: '',
    description: '',
    note: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders()
      const [transactionsRes, summaryRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/transactions`, { headers }),
        fetch(`${API_BASE}/transactions/summary`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
      ])

      if (transactionsRes.ok) setTransactions(await transactionsRes.json())
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
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

  const handleSubmit = async () => {
    if (!form.amount || !form.category) {
      showToast('金額とカテゴリを入力してください')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseInt(form.amount),
          project_id: form.project_id ? parseInt(form.project_id) : null,
        }),
      })

      if (res.ok) {
        showToast('登録しました')
        setShowModal(false)
        setForm({
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          category: '',
          project_id: '',
          description: '',
          note: '',
        })
        fetchData()
      } else {
        showToast('登録に失敗しました')
      }
    } catch (error) {
      showToast('通信エラー')
    }
  }

  const handleDelete = async (transactionId) => {
    if (!confirm('この取引を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/transactions/${transactionId}`, {
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

  const getCategoryInfo = (type, categoryId) => {
    const categories = CATEGORIES[type] || []
    return categories.find(c => c.id === categoryId) || { label: categoryId, icon: '📋' }
  }

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  const formatAmount = (amount) => `¥${(amount || 0).toLocaleString()}`

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="入出金管理"
        icon="💰"
        gradient="from-purple-700 to-purple-500"
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
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="text-center py-3">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <TrendingUp size={12} className="text-emerald-400" />
              収入
            </div>
            <div className="text-sm font-bold text-emerald-400">{formatAmount(summary.total_income)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-1">
              <TrendingDown size={12} className="text-red-400" />
              支出
            </div>
            <div className="text-sm font-bold text-red-400">{formatAmount(summary.total_expense)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs text-slate-400 mb-1">収支</div>
            <div className={`text-sm font-bold ${summary.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatAmount(summary.balance)}
            </div>
          </Card>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: '全て', icon: '📋' },
            { id: 'income', label: '収入', icon: '📈' },
            { id: 'expense', label: '支出', icon: '📉' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 ${
                filter === f.id ? 'bg-purple-500 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <SectionTitle>💰 取引履歴（{filteredTransactions.length}件）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">💰</div>
            <div>取引がありません</div>
          </div>
        ) : (
          filteredTransactions.map((tx, i) => {
            const catInfo = getCategoryInfo(tx.type, tx.category)
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {catInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{tx.description || catInfo.label}</div>
                          <div className="text-xs text-slate-400">{catInfo.label}</div>
                        </div>
                        <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">{tx.date}</span>
                        {tx.project_name && (
                          <span className="text-xs text-purple-400">📍 {tx.project_name}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-red-400/50 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 新規登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            <div className="flex justify-between items-center p-5 pb-3 border-b border-slate-700">
              <h3 className="text-lg font-bold">💰 入出金登録</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-purple-600 rounded-lg text-sm font-bold"
                >
                  登録
                </button>
                <button onClick={() => setShowModal(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {/* 種別 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, type: 'income', category: '' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                      form.type === 'income' ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <TrendingUp size={16} />
                    収入
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: 'expense', category: '' })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                      form.type === 'expense' ? 'bg-red-600' : 'bg-slate-700'
                    }`}
                  >
                    <TrendingDown size={16} />
                    支出
                  </button>
                </div>

                {/* 日付 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">日付 *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                  />
                </div>

                {/* 金額 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">金額 *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg pl-8 pr-4 py-3 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* カテゴリ */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">カテゴリ *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES[form.type].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={`py-2 rounded-lg text-xs flex flex-col items-center gap-1 ${
                          form.category === cat.id
                            ? form.type === 'income' ? 'bg-emerald-600' : 'bg-red-600'
                            : 'bg-slate-700'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 工事 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">関連工事（任意）</label>
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

                {/* 摘要 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">摘要</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                    placeholder="取引の内容を入力"
                  />
                </div>

                {/* 備考 */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">備考</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={2}
                    placeholder="メモを入力"
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
