import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'

const API_BASE = '/api'

export default function ExpensePage() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [fuelPrice, setFuelPrice] = useState(170)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    category_id: '',
    project_id: '',
    amount: '',
    fuel_liter: '',
    fuel_type: 'regular',
    store_name: '',
    memo: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, projectsRes, categoriesRes, fuelPriceRes] = await Promise.all([
        fetch(`${API_BASE}/expenses/`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/expense-categories/`),
        fetch(`${API_BASE}/fuel-prices/latest`).catch(() => null),
      ])

      if (expensesRes.ok) {
        setExpenses(await expensesRes.json())
      }
      if (projectsRes.ok) {
        setProjects(await projectsRes.json())
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json())
      }
      if (fuelPriceRes?.ok) {
        const fp = await fuelPriceRes.json()
        if (fp.regular_price) setFuelPrice(fp.regular_price)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === parseInt(form.category_id))
  const isFuelCategory = selectedCategory?.is_fuel

  const handleSubmit = async () => {
    try {
      if (!form.project_id || !form.category_id) {
        showToast('現場とカテゴリを選択してください')
        return
      }

      const amount = isFuelCategory && form.fuel_liter
        ? Math.round(parseFloat(form.fuel_liter) * fuelPrice)
        : parseInt(form.amount) || 0

      const res = await fetch(`${API_BASE}/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(form.project_id),
          category_id: parseInt(form.category_id),
          expense_date: new Date().toISOString().split('T')[0],
          amount: isFuelCategory ? null : amount,
          fuel_type: isFuelCategory ? form.fuel_type : null,
          fuel_liter: isFuelCategory ? parseFloat(form.fuel_liter) : null,
          store_name: form.store_name || null,
          memo: form.memo || null,
        }),
      })

      if (res.ok) {
        showToast('申請しました')
        setShowForm(false)
        setForm({
          category_id: '',
          project_id: '',
          amount: '',
          fuel_liter: '',
          fuel_type: 'regular',
          store_name: '',
          memo: '',
        })
        fetchData()
      } else {
        const err = await res.json()
        showToast(`エラー: ${err.detail || '保存に失敗しました'}`)
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-500/20 text-amber-400',
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
    }
    return styles[status] || styles.pending
  }

  const getStatusLabel = (status) => {
    const labels = { pending: '申請中', approved: '承認済', rejected: '却下' }
    return labels[status] || status
  }

  const getCategoryInfo = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat ? { icon: cat.icon || '📋', label: cat.name } : { icon: '📋', label: '不明' }
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="経費精算"
        icon="💳"
        gradient="from-purple-800 to-purple-400"
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
        {/* 燃料単価表示 */}
        <Card className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">今月の燃料単価</div>
            <div className="text-lg font-bold text-app-primary">¥{fuelPrice}/L</div>
          </div>
          <span className="text-2xl">⛽</span>
        </Card>

        <SectionTitle>📋 申請一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>申請がありません</div>
          </div>
        ) : (
          expenses.map((expense, i) => {
            const cat = getCategoryInfo(expense.category_id)
            const displayAmount = expense.amount || (expense.fuel_liter ? Math.round(expense.fuel_liter * fuelPrice) : 0)
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">{cat.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(expense.status)}`}>
                          {getStatusLabel(expense.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-app-primary">
                          ¥{displayAmount?.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">{expense.expense_date}</span>
                      </div>
                      {expense.fuel_liter && (
                        <div className="text-xs text-slate-400 mt-1">{expense.fuel_liter}L × ¥{fuelPrice}</div>
                      )}
                      {expense.store_name && (
                        <div className="text-xs text-slate-400 mt-1">{expense.store_name}</div>
                      )}
                      {expense.memo && (
                        <div className="text-xs text-slate-400 mt-1">{expense.memo}</div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 申請フォームモーダル */}
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
            <div className="text-lg font-bold mb-6">経費申請</div>

            {/* カテゴリ選択 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">カテゴリ</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category_id: String(cat.id) })}
                    className={`py-3 rounded-xl text-center ${
                      form.category_id === String(cat.id)
                        ? 'bg-app-primary text-white'
                        : 'bg-app-card text-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon || '📋'}</div>
                    <div className="text-[10px]">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 現場選択 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">現場</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              >
                <option value="">選択してください</option>
                {projects.filter(p => p.status === '施工中').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 金額入力 */}
            {isFuelCategory ? (
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">給油量（L）</label>
                <input
                  type="number"
                  value={form.fuel_liter}
                  onChange={(e) => setForm({ ...form, fuel_liter: e.target.value })}
                  placeholder="例: 45"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
                {form.fuel_liter && (
                  <div className="mt-2 text-right text-app-primary font-bold">
                    計算金額: ¥{Math.round(parseFloat(form.fuel_liter) * fuelPrice).toLocaleString()}
                  </div>
                )}
                <div className="mt-2">
                  <label className="text-sm text-slate-400 mb-2 block">燃料タイプ</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForm({ ...form, fuel_type: 'regular' })}
                      className={`flex-1 py-2 rounded-xl text-sm ${
                        form.fuel_type === 'regular' ? 'bg-app-primary text-white' : 'bg-app-card text-slate-300'
                      }`}
                    >
                      レギュラー
                    </button>
                    <button
                      onClick={() => setForm({ ...form, fuel_type: 'diesel' })}
                      className={`flex-1 py-2 rounded-xl text-sm ${
                        form.fuel_type === 'diesel' ? 'bg-app-primary text-white' : 'bg-app-card text-slate-300'
                      }`}
                    >
                      軽油
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">金額</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="¥0"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
            )}

            {/* 店舗名 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">店舗名（任意）</label>
              <input
                type="text"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                placeholder="例: ENEOS、コンビニ"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* 備考 */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">備考（任意）</label>
              <input
                type="text"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
                placeholder="メモを入力"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* レシート写真 */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">レシート写真（任意）</label>
              <button className="w-full py-4 border-2 border-dashed border-app-border rounded-xl text-slate-400 flex items-center justify-center gap-2">
                <span className="text-2xl">📷</span>
                <span>写真を追加</span>
              </button>
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-app-primary rounded-xl font-bold text-white"
            >
              申請する
            </button>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
