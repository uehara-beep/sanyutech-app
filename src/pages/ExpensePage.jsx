import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function ExpensePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [fuelPrice, setFuelPrice] = useState(170)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, categoriesRes, fuelPriceRes] = await Promise.all([
        fetch(`${API_BASE}/expenses/`),
        fetch(`${API_BASE}/expense-categories/`),
        fetch(`${API_BASE}/fuel-prices/latest`).catch(() => null),
      ])

      if (expensesRes.ok) {
        setExpenses(await expensesRes.json())
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
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="経費一覧"
        icon="💳"
        gradient="from-purple-800 to-purple-400"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => navigate('/expense/new')}
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

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
