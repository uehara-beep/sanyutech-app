import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Package, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, Calendar, Truck, Plus, Minus, RefreshCw,
  ChevronRight, Box, Droplets, FlaskConical
} from 'lucide-react'
import { useThemeStore } from '../store'
import { API_BASE, getAuthHeaders } from '../config/api'

// 材料アイコンマッピング
const materialIcons = {
  'ミニパック13mm': Box,
  '混和液': Droplets,
  '遅延剤': FlaskConical,
  'PDプライマー': Package,
  'PDボンド': Package,
  '仕上養生材': Package
}

export default function PDMaterialsPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/pd-materials/dashboard`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('データ取得失敗')
      const data = await res.json()
      setDashboard(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getAlertColor = (alert) => {
    switch (alert) {
      case 'danger': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
      case 'warning': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
      default: return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
    }
  }

  const getAlertIcon = (alert) => {
    switch (alert) {
      case 'danger': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'warning': return <Clock className="w-4 h-4 text-yellow-400" />
      default: return <CheckCircle className="w-4 h-4 text-green-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 p-4">
        <div className="text-center text-red-400 py-12">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">PD材料管理</h1>
            <p className="text-xs text-white/60">PDジェットスラブ工法</p>
          </div>
          <button onClick={fetchDashboard} className="ml-auto p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-4 gap-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div className="text-2xl font-bold text-white">{dashboard?.summary?.total_materials}</div>
            <div className="text-xs text-white/60">材料数</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-xl text-center bg-red-500/20"
          >
            <div className="text-2xl font-bold text-red-400">{dashboard?.summary?.danger_count}</div>
            <div className="text-xs text-red-300">要発注</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-xl text-center bg-yellow-500/20"
          >
            <div className="text-2xl font-bold text-yellow-400">{dashboard?.summary?.warning_count}</div>
            <div className="text-xs text-yellow-300">準備</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl text-center bg-green-500/20"
          >
            <div className="text-2xl font-bold text-green-400">{dashboard?.summary?.ok_count}</div>
            <div className="text-xs text-green-300">十分</div>
          </motion.div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/pd-materials/inventory')}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${theme.primary}40, ${theme.primary}20)` }}
          >
            <div className="p-2 rounded-lg" style={{ background: theme.primary }}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">在庫管理</div>
              <div className="text-xs text-white/60">入出庫・履歴</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/pd-materials/usage')}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(59,130,246,0.2))' }}
          >
            <div className="p-2 rounded-lg bg-blue-500">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">使用報告</div>
              <div className="text-xs text-white/60">現場から報告</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </motion.button>
        </div>

        {/* 在庫状況 */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: theme.primary }} />
              在庫状況
            </h2>
          </div>
          <div className="divide-y divide-white/10">
            {dashboard?.inventory?.map((item, idx) => {
              const colors = getAlertColor(item.alert)
              const Icon = materialIcons[item.name] || Package

              return (
                <motion.div
                  key={item.material_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 ${colors.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {item.name}
                          {getAlertIcon(item.alert)}
                        </div>
                        <div className="text-xs text-white/60">{item.unit}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${colors.text}`}>
                        {item.stock.toLocaleString()}
                      </div>
                      {item.required > 0 && (
                        <div className="text-xs text-white/60">
                          必要: {item.required.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.shortage > 0 && (
                    <div className="mt-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5">
                      不足: {item.shortage.toLocaleString()} {item.unit}（発注推奨）
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 発注推奨 */}
        {dashboard?.order_recommendations?.length > 0 && (
          <div className="rounded-xl overflow-hidden border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/20">
              <h2 className="font-bold text-red-400 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                発注推奨リスト
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {dashboard.order_recommendations.map((rec) => (
                <div key={rec.material_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="font-medium text-white">{rec.name}</div>
                    <div className="text-sm text-red-300">
                      推奨発注: {rec.recommended_order.toLocaleString()} {rec.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      ¥{rec.estimated_cost.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/60">概算費用</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 今後の施工予定 */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" style={{ color: theme.primary }} />
              今後1ヶ月の施工予定
            </h2>
            <button
              onClick={() => navigate('/pd-materials/plans')}
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: theme.primary, color: 'white' }}
            >
              登録
            </button>
          </div>
          {dashboard?.upcoming_plans?.length > 0 ? (
            <div className="divide-y divide-white/10">
              {dashboard.upcoming_plans.map((plan) => (
                <div key={plan.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white">{plan.project_name}</div>
                    <div className="text-sm px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      {plan.planned_date}
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-white/60">
                    {plan.planned_volume_m3 > 0 && (
                      <span>体積: {plan.planned_volume_m3} m³</span>
                    )}
                    {plan.planned_area_m2 > 0 && (
                      <span>面積: {plan.planned_area_m2} m²</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/40">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>予定なし</p>
              <button
                onClick={() => navigate('/pd-materials/plans')}
                className="mt-3 text-sm underline"
                style={{ color: theme.primary }}
              >
                施工予定を登録
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 在庫管理ページ
export function PDInventoryPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [inventory, setInventory] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('in') // 'in' or 'out'
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' or 'logs'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [invRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/pd-materials/inventory`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/pd-materials/logs?limit=50`, { headers: getAuthHeaders() })
      ])

      if (invRes.ok) setInventory(await invRes.json())
      if (logsRes.ok) setLogs(await logsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (material, type) => {
    setSelectedMaterial(material)
    setModalType(type)
    setQuantity('')
    setNote('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/pd-materials/inventory`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: selectedMaterial.id,
          type: modalType,
          quantity: parseFloat(quantity),
          note: note || null
        })
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || 'エラーが発生しました')
        return
      }

      setShowModal(false)
      fetchData()
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pd-materials')} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">在庫管理</h1>
        </div>

        {/* タブ */}
        <div className="flex mt-3 gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inventory' ? 'text-white' : 'text-white/50'
            }`}
            style={{ background: activeTab === 'inventory' ? theme.primary : 'rgba(255,255,255,0.1)' }}
          >
            在庫一覧
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs' ? 'text-white' : 'text-white/50'
            }`}
            style={{ background: activeTab === 'logs' ? theme.primary : 'rgba(255,255,255,0.1)' }}
          >
            入出庫履歴
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : activeTab === 'inventory' ? (
        <div className="p-4 space-y-3">
          {inventory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-white">{item.name}</div>
                  <div className="text-xs text-white/60">{item.package_info}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{item.quantity.toLocaleString()}</div>
                  <div className="text-xs text-white/60">{item.unit}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(item, 'in')}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  入庫
                </button>
                <button
                  onClick={() => openModal(item, 'out')}
                  className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                  出庫
                </button>
              </div>

              <div className="mt-2 text-xs text-white/40 flex justify-between">
                <span>仕入: ¥{item.purchase_price.toLocaleString()}</span>
                <span>販売: ¥{item.selling_price.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          {logs.length === 0 ? (
            <div className="text-center text-white/40 py-12">履歴なし</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <div className={`p-2 rounded-lg ${log.type === 'in' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {log.type === 'in' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{log.material_name}</div>
                    <div className="text-xs text-white/60 truncate">
                      {log.project_name || log.note || (log.type === 'in' ? '入庫' : '出庫')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${log.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                      {log.type === 'in' ? '+' : '-'}{log.quantity} {log.unit}
                    </div>
                    <div className="text-xs text-white/40">
                      {new Date(log.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 入出庫モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'rgba(30,41,59,0.98)' }}
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {selectedMaterial?.name} - {modalType === 'in' ? '入庫' : '出庫'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">数量 ({selectedMaterial?.unit})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">備考（任意）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例: ○○商店から仕入"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !quantity}
                  className={`flex-1 py-3 rounded-xl text-white font-medium ${
                    modalType === 'in' ? 'bg-green-500' : 'bg-red-500'
                  } disabled:opacity-50`}
                >
                  {submitting ? '...' : modalType === 'in' ? '入庫する' : '出庫する'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// 使用報告ページ
export function PDUsagePage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [materials, setMaterials] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedProject, setSelectedProject] = useState('')
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0])
  const [quantities, setQuantities] = useState({})
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [matRes, projRes] = await Promise.all([
        fetch(`${API_BASE}/pd-materials`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/projects?status=active&limit=100`, { headers: getAuthHeaders() })
      ])

      if (matRes.ok) {
        const mats = await matRes.json()
        setMaterials(mats)
        // 初期値設定
        const initQty = {}
        mats.forEach(m => { initQty[m.id] = '' })
        setQuantities(initQty)
      }
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data.projects || data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProject) {
      alert('現場を選択してください')
      return
    }

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty && parseFloat(qty) > 0)
      .map(([id, qty]) => ({ material_id: parseInt(id), quantity: parseFloat(qty) }))

    if (items.length === 0) {
      alert('使用数量を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/pd-materials/usage`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(selectedProject),
          date: usageDate,
          items,
          note: note || null
        })
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || 'エラーが発生しました')
        return
      }

      alert('報告完了しました')
      navigate('/pd-materials')
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pd-materials')} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">使用報告</h1>
            <p className="text-xs text-white/60">現場で使った材料を報告</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 現場選択 */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <label className="block text-sm text-white/60 mb-2">現場 *</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
          >
            <option value="">現場を選択...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* 日付 */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <label className="block text-sm text-white/60 mb-2">使用日</label>
          <input
            type="date"
            value={usageDate}
            onChange={(e) => setUsageDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
          />
        </div>

        {/* 材料入力 */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="font-bold text-white">使用数量</h2>
          </div>
          <div className="divide-y divide-white/10">
            {materials.map((mat) => (
              <div key={mat.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-white">{mat.name}</div>
                  <div className="text-xs text-white/60">在庫: {mat.stock} {mat.unit}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quantities[mat.id] || ''}
                    onChange={(e) => setQuantities({ ...quantities, [mat.id]: e.target.value })}
                    placeholder="0"
                    className="w-20 px-3 py-2 rounded-lg bg-white/10 text-white text-right"
                  />
                  <span className="text-sm text-white/60 w-12">{mat.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 備考 */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <label className="block text-sm text-white/60 mb-2">備考（任意）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例: 養生剤は使い切り"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white resize-none"
          />
        </div>

        {/* 報告ボタン */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
        >
          {submitting ? '送信中...' : '報告する'}
        </motion.button>
      </div>
    </div>
  )
}

// 施工計画ページ
export function PDPlansPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [plans, setPlans] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    project_id: '',
    planned_volume_m3: '',
    planned_area_m2: '',
    planned_date: '',
    note: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, projRes] = await Promise.all([
        fetch(`${API_BASE}/pd-materials/plans`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/projects?limit=100`, { headers: getAuthHeaders() })
      ])

      if (plansRes.ok) setPlans(await plansRes.json())
      if (projRes.ok) {
        const data = await projRes.json()
        setProjects(data.projects || data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.project_id || !formData.planned_date) {
      alert('案件と施工予定日は必須です')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/pd-materials/plans`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(formData.project_id),
          planned_volume_m3: parseFloat(formData.planned_volume_m3) || 0,
          planned_area_m2: parseFloat(formData.planned_area_m2) || 0,
          planned_date: formData.planned_date,
          note: formData.note || null
        })
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.detail || 'エラーが発生しました')
        return
      }

      setShowModal(false)
      setFormData({ project_id: '', planned_volume_m3: '', planned_area_m2: '', planned_date: '', note: '' })
      fetchData()
    } catch (e) {
      alert('エラー: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pd-materials')} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white flex-1">施工計画</h1>
          <button
            onClick={() => setShowModal(true)}
            className="p-2 rounded-full"
            style={{ background: theme.primary }}
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center text-white/40 py-12">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>施工計画なし</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{ background: theme.primary }}
          >
            計画を登録
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-white">{plan.project_name}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  plan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  plan.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {plan.status === 'completed' ? '完了' : plan.status === 'in_progress' ? '進行中' : '予定'}
                </div>
              </div>
              <div className="text-sm text-white/60 mb-2">{plan.client}</div>
              <div className="flex gap-4 text-sm">
                <span className="text-white/80">施工日: {plan.planned_date}</span>
                {plan.planned_volume_m3 > 0 && <span className="text-white/60">{plan.planned_volume_m3} m³</span>}
                {plan.planned_area_m2 > 0 && <span className="text-white/60">{plan.planned_area_m2} m²</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'rgba(30,41,59,0.98)' }}
          >
            <h3 className="text-lg font-bold text-white mb-4">施工計画を登録</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">案件 *</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                >
                  <option value="">選択...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">施工予定日 *</label>
                <input
                  type="date"
                  value={formData.planned_date}
                  onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">体積 (m³)</label>
                  <input
                    type="number"
                    value={formData.planned_volume_m3}
                    onChange={(e) => setFormData({ ...formData, planned_volume_m3: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">面積 (m²)</label>
                  <input
                    type="number"
                    value={formData.planned_area_m2}
                    onChange={(e) => setFormData({ ...formData, planned_area_m2: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">備考</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                  style={{ background: theme.primary }}
                >
                  {submitting ? '...' : '登録'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
