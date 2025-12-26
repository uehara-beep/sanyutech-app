import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function OrderPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [orders, setOrders] = useState([])
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('all') // all, draft, ordered, delivered
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    project_id: '',
    vendor_id: '',
    item_name: '',
    quantity: '',
    unit: '',
    unit_price: '',
    note: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, projectsRes, vendorsRes] = await Promise.all([
        fetch(`${API_BASE}/orders/`),
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/vendors/`),
      ])

      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (vendorsRes.ok) setVendors(await vendorsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const total = (parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)

      const res = await fetch(`${API_BASE}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(form.project_id),
          vendor_id: form.vendor_id ? parseInt(form.vendor_id) : null,
          item_name: form.item_name,
          quantity: parseFloat(form.quantity) || 0,
          unit: form.unit,
          unit_price: parseFloat(form.unit_price) || 0,
          total: total,
          status: 'draft',
          note: form.note,
        }),
      })

      if (res.ok) {
        showToast('発注書を作成しました')
        setShowForm(false)
        setForm({
          project_id: '',
          vendor_id: '',
          item_name: '',
          quantity: '',
          unit: '',
          unit_price: '',
          note: '',
        })
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        showToast('ステータスを更新しました')
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
      draft: 'bg-slate-500/20 text-slate-400',
      ordered: 'bg-blue-500/20 text-blue-400',
      delivered: 'bg-emerald-500/20 text-emerald-400',
    }
    return styles[status] || styles.draft
  }

  const getStatusLabel = (status) => {
    const labels = { draft: '下書き', ordered: '発注済', delivered: '納品済' }
    return labels[status] || status
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || '不明'
  }

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="資材発注"
        icon="🏷️"
        gradient="from-violet-700 to-violet-400"
        onBack={() => navigate(-1)}
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
        {/* タブ */}
        <div className="flex bg-app-bg-light p-1 mb-4 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: '全て' },
            { id: 'draft', label: '下書き' },
            { id: 'ordered', label: '発注済' },
            { id: 'delivered', label: '納品済' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'bg-app-primary text-white' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SectionTitle>📋 発注一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>発注がありません</div>
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
                    <div className="text-sm font-semibold">{order.item_name}</div>
                    <div className="text-xs text-slate-400">{getProjectName(order.project_id)}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-400">
                    {order.quantity} {order.unit} × ¥{order.unit_price?.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-app-primary">
                    ¥{order.total?.toLocaleString()}
                  </span>
                </div>

                {order.status === 'draft' && (
                  <button
                    onClick={() => updateStatus(order.id, 'ordered')}
                    className="w-full py-2 bg-app-primary/20 text-app-primary rounded-lg text-sm font-semibold"
                  >
                    発注する
                  </button>
                )}
                {order.status === 'ordered' && (
                  <button
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold"
                  >
                    納品完了
                  </button>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 新規発注モーダル */}
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
            <div className="text-lg font-bold mb-6">新規発注</div>

            <div className="mb-4">
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

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">業者</label>
              <select
                value={form.vendor_id}
                onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              >
                <option value="">選択してください</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">品名</label>
              <input
                type="text"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                placeholder="アスファルト合材"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">数量</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder="0"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">単位</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="t"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">単価</label>
                <input
                  type="number"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  placeholder="0"
                  className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                />
              </div>
            </div>

            {form.quantity && form.unit_price && (
              <div className="mb-4 p-3 bg-app-card rounded-xl text-right">
                <span className="text-sm text-slate-400">合計: </span>
                <span className="text-xl font-bold text-app-primary">
                  ¥{((parseFloat(form.quantity) || 0) * (parseFloat(form.unit_price) || 0)).toLocaleString()}
                </span>
              </div>
            )}

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">備考</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="備考を入力"
                rows={2}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-app-primary rounded-xl font-bold text-white"
            >
              発注書を作成
            </button>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
