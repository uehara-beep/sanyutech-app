import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'

const BILLING_CATEGORIES = [
  { id: 'material', label: '材料費', icon: '🧱' },
  { id: 'subcontract', label: '外注費', icon: '👷' },
  { id: 'machine', label: '機械費', icon: '🚜' },
  { id: 'expense', label: '経費', icon: '💰' },
]

export default function InvoicePage() {
  const navigate = useNavigate()
  const [billings, setBillings] = useState([])
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    vendor_name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    items: '',
    category: 'material',
    project_id: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [billingsRes, projectsRes, vendorsRes] = await Promise.all([
        fetch(`${API_BASE}/billings/`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/vendors/`),
      ])

      if (billingsRes.ok) setBillings(await billingsRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (vendorsRes.ok) setVendors(await vendorsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = () => {
    // AI解析のシミュレーション
    setAnalyzing(true)
    setTimeout(() => {
      setForm({
        ...form,
        vendor_name: '〇〇建材株式会社',
        amount: '350000',
        date: '2024-12-18',
        items: 'アスファルト合材 35t',
        category: 'material',
      })
      setAnalyzing(false)
      showToast('AI解析完了')
    }, 1500)
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/billings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: form.vendor_name,
          amount: parseInt(form.amount) || 0,
          date: form.date,
          items: form.items,
          category: form.category,
          project_id: form.project_id ? parseInt(form.project_id) : null,
          status: 'pending',
        }),
      })

      if (res.ok) {
        showToast('承認フローへ送信しました')
        setShowForm(false)
        setForm({
          vendor_name: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          items: '',
          category: 'material',
          project_id: '',
        })
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

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-500/20 text-amber-400',
      approved: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
    }
    return styles[status] || styles.pending
  }

  const getStatusLabel = (status) => {
    const labels = { pending: '承認待ち', approved: '承認済', rejected: '却下' }
    return labels[status] || status
  }

  const getCategoryInfo = (category) => {
    return BILLING_CATEGORIES.find(c => c.id === category) || { icon: '📄', label: category }
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="請求書AI"
        icon="📄"
        gradient="from-orange-900 to-orange-500"
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
        {/* アップロードエリア */}
        <Card
          className="mb-6 py-8 text-center border-2 border-dashed border-app-primary/50 cursor-pointer"
          onClick={() => setShowForm(true)}
        >
          <div className="text-4xl mb-3">📤</div>
          <div className="text-sm font-semibold mb-1">請求書をアップロード</div>
          <div className="text-xs text-slate-400">PDF/画像をAIが自動解析</div>
        </Card>

        <SectionTitle>📋 請求書一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : billings.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>請求書がありません</div>
          </div>
        ) : (
          billings.map((billing, i) => {
            const cat = getCategoryInfo(billing.category)
            return (
              <motion.div
                key={billing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-semibold">{billing.vendor || '不明'}</div>
                      <div className="text-xs text-slate-400">{billing.items || billing.category}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(billing.status)}`}>
                      {getStatusLabel(billing.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="text-xs text-slate-400">{cat.label}</span>
                    </div>
                    <span className="text-lg font-bold text-app-primary">
                      ¥{billing.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">{billing.date}</div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 入力フォームモーダル */}
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
            <div className="text-lg font-bold mb-6">請求書登録</div>

            {/* AI解析ボタン */}
            <button
              onClick={handleFileUpload}
              className="w-full py-4 mb-6 border-2 border-dashed border-app-primary/50 rounded-xl text-center"
              disabled={analyzing}
            >
              {analyzing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
                  <span>AI解析中...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl mb-1">🤖</div>
                  <div className="text-sm">PDF/画像をAI解析</div>
                </>
              )}
            </button>

            {/* 業者名 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">業者名</label>
              <input
                type="text"
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                placeholder="〇〇建材株式会社"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* 金額 */}
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

            {/* 日付 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">日付</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* 品目 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">品目</label>
              <input
                type="text"
                value={form.items}
                onChange={(e) => setForm({ ...form, items: e.target.value })}
                placeholder="アスファルト合材 35t"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            {/* 分類 */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">分類</label>
              <div className="grid grid-cols-4 gap-2">
                {BILLING_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`py-3 rounded-xl text-center ${
                      form.category === cat.id
                        ? 'bg-app-primary text-white'
                        : 'bg-app-card text-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon}</div>
                    <div className="text-[10px]">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 現場 */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">現場</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              >
                <option value="">選択してください</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-app-primary rounded-xl font-bold text-white"
            >
              承認フローへ送信
            </button>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
