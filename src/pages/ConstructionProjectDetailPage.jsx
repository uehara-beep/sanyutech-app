import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, Toast } from '../components/common'
import { API_BASE, authGet, authFetch } from '../config/api'
import { useThemeStore, useAuthStore, backgroundStyles } from '../store'

// 原価カテゴリ定義（API側と同期）
const COST_CATEGORIES = {
  labor: '労務',
  material: '材料',
  machine: '重機',
  subcontract: '外注',
  fuel: '燃料',
  etc: 'その他',
}

export default function ConstructionProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { backgroundId } = useThemeStore()
  const { user } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('costs') // costs | progress
  const [showCostModal, setShowCostModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  // フォーム
  const [costForm, setCostForm] = useState({
    cost_date: new Date().toISOString().split('T')[0],
    cost_category: 'material',  // デフォルト: 材料
    amount: '',
    note: '',
  })
  const [progressForm, setProgressForm] = useState({
    target_month: new Date().toISOString().slice(0, 7),
    progress_amount: '',
    note: '',
  })
  const [budgetForm, setBudgetForm] = useState({
    contract_amount: 0,
    planned_cost_by_category: {
      labor: 0,
      material: 0,
      machine: 0,
      subcontract: 0,
      fuel: 0,
      etc: 0,
    },
  })

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const data = await authGet(`${API_BASE}/construction/projects/${id}`)
      setProject(data)
      // カテゴリ別予算をフォームに設定（不足は0で補完）
      const categoryBudget = { labor: 0, material: 0, machine: 0, subcontract: 0, fuel: 0, etc: 0 }
      if (data.planned_cost_by_category) {
        Object.keys(categoryBudget).forEach(key => {
          categoryBudget[key] = data.planned_cost_by_category[key] || 0
        })
      }
      setBudgetForm({
        contract_amount: data.contract_amount || 0,
        planned_cost_by_category: categoryBudget,
      })
    } catch (error) {
      console.error('Fetch error:', error)
      showToast('工事の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCost = async () => {
    if (!costForm.cost_date) {
      showToast('日付を入力してください')
      return
    }
    if (!costForm.amount) {
      showToast('金額を入力してください')
      return
    }
    const amount = parseInt(costForm.amount)
    if (amount < 0) {
      showToast('金額は0以上で入力してください')
      return
    }
    try {
      await authFetch(`${API_BASE}/construction/projects/${id}/costs`, {
        method: 'POST',
        body: JSON.stringify({
          ...costForm,
          amount,
        }),
      })
      showToast('原価を追加しました')
      setShowCostModal(false)
      setCostForm({
        cost_date: new Date().toISOString().split('T')[0],
        cost_category: 'material',
        amount: '',
        note: '',
      })
      fetchProject()
    } catch (error) {
      if (error.status === 409) {
        showToast('同一内容の原価が既に登録されています')
      } else {
        showToast(error.message || '原価の追加に失敗しました')
      }
    }
  }

  const handleAddProgress = async () => {
    if (!progressForm.target_month) {
      showToast('対象月を入力してください')
      return
    }
    if (!progressForm.progress_amount) {
      showToast('金額を入力してください')
      return
    }
    const amount = parseInt(progressForm.progress_amount)
    if (amount < 0) {
      showToast('金額は0以上で入力してください')
      return
    }
    try {
      await authFetch(`${API_BASE}/construction/projects/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          ...progressForm,
          progress_amount: amount,
        }),
      })
      showToast('出来高を追加しました')
      setShowProgressModal(false)
      setProgressForm({
        target_month: new Date().toISOString().slice(0, 7),
        progress_amount: '',
        note: '',
      })
      fetchProject()
    } catch (error) {
      if (error.status === 409) {
        showToast('同一内容の出来高が既に登録されています')
      } else {
        showToast(error.message || '出来高の追加に失敗しました')
      }
    }
  }

  const handleUpdateBudget = async () => {
    // カテゴリ別予算のバリデーション（空は0扱い、負は拒否）
    const categoryBudget = {}
    for (const key of Object.keys(COST_CATEGORIES)) {
      const val = parseInt(budgetForm.planned_cost_by_category[key]) || 0
      if (val < 0) {
        showToast(`${COST_CATEGORIES[key]}の金額は0以上で入力してください`)
        return
      }
      categoryBudget[key] = val
    }
    try {
      await authFetch(`${API_BASE}/construction/projects/${id}/budget`, {
        method: 'PATCH',
        body: JSON.stringify({
          contract_amount: parseInt(budgetForm.contract_amount) || 0,
          planned_cost_by_category: categoryBudget,
        }),
      })
      showToast('予算を更新しました')
      setShowBudgetModal(false)
      fetchProject()
    } catch (error) {
      showToast(error.message || '予算の更新に失敗しました')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return `¥${value.toLocaleString()}`
  }

  const formatRate = (value) => {
    if (!value && value !== 0) return '-'
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <div className="text-center" style={{ color: currentBg.textLight }}>読み込み中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <div className="text-center" style={{ color: currentBg.textLight }}>工事が見つかりません</div>
      </div>
    )
  }

  // 進捗率計算
  const progressRate = project.contract_amount > 0
    ? (project.progress_total / project.contract_amount * 100)
    : 0
  // 実績粗利率計算
  const actualProfitRate = project.progress_total > 0
    ? (project.actual_profit / project.progress_total * 100)
    : 0

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title={project.name}
        icon="🏗️"
        gradient="from-orange-600 to-orange-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 基本情報 */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>発注者</div>
              <div className="font-semibold" style={{ color: currentBg.text }}>{project.client || '-'}</div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              project.status === '進行中' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
            }`}>
              {project.status}
            </span>
          </div>
          {project.code && (
            <div className="text-xs" style={{ color: currentBg.textLight }}>
              工事番号: {project.code}
            </div>
          )}
        </Card>

        {/* サマリー（常時表示・全員閲覧可） */}
        <Card className="mb-4">
          <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: currentBg.text }}>
            📊 工事サマリー
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="rounded-lg p-2" style={{ background: inputBg }}>
              <div className="text-[10px]" style={{ color: currentBg.textLight }}>契約金額</div>
              <div className="text-sm font-bold" style={{ color: currentBg.text }}>{formatCurrency(project.contract_amount)}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: inputBg }}>
              <div className="text-[10px]" style={{ color: currentBg.textLight }}>累計出来高</div>
              <div className="text-sm font-bold text-blue-400">{formatCurrency(project.progress_total)}</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: inputBg }}>
              <div className="text-[10px]" style={{ color: currentBg.textLight }}>実績原価</div>
              <div className="text-sm font-bold" style={{ color: currentBg.text }}>{formatCurrency(project.actual_cost_total)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg p-2" style={{ background: inputBg }}>
              <div className="text-[10px]" style={{ color: currentBg.textLight }}>実績粗利</div>
              <div className={`text-sm font-bold ${project.actual_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(project.actual_profit)}
                <span className="text-[10px] ml-1">({formatRate(actualProfitRate)})</span>
              </div>
            </div>
            <div className="rounded-lg p-2" style={{ background: inputBg }}>
              <div className="text-[10px]" style={{ color: currentBg.textLight }}>進捗率</div>
              <div className="text-sm font-bold text-orange-400">{formatRate(progressRate)}</div>
            </div>
          </div>
          {/* 進捗バー */}
          <div className="mt-3">
            <div className="h-2 rounded-full" style={{ background: inputBg }}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
                style={{ width: `${Math.min(progressRate, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* カテゴリ別 予算/実績/差額（全員表示） */}
        <Card className="mb-4">
          <div className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: currentBg.text }}>
            📋 カテゴリ別 予算/実績/差額
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: currentBg.textLight }}>
                  <th className="text-left py-1 pr-2">カテゴリ</th>
                  <th className="text-right py-1 px-1">予算</th>
                  <th className="text-right py-1 px-1">実績</th>
                  <th className="text-right py-1 pl-1">差額</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(COST_CATEGORIES).map(([key, label]) => {
                  const planned = project.planned_cost_by_category?.[key] || 0
                  const actual = project.costs_by_category?.[key] || 0
                  const variance = project.variance_by_category?.[key] || (planned - actual)
                  return (
                    <tr key={key} style={{ borderTop: `1px solid ${cardBorder}` }}>
                      <td className="py-2 pr-2" style={{ color: currentBg.text }}>{label}</td>
                      <td className="text-right py-2 px-1" style={{ color: currentBg.textLight }}>{formatCurrency(planned)}</td>
                      <td className="text-right py-2 px-1" style={{ color: currentBg.text }}>{formatCurrency(actual)}</td>
                      <td className={`text-right py-2 pl-1 font-semibold ${variance < 0 ? 'text-amber-500' : ''}`} style={variance >= 0 ? { color: currentBg.text } : {}}>
                        {formatCurrency(variance)}
                      </td>
                    </tr>
                  )
                })}
                {/* 合計行 */}
                <tr style={{ borderTop: `2px solid ${cardBorder}` }}>
                  <td className="py-2 pr-2 font-bold" style={{ color: currentBg.text }}>合計</td>
                  <td className="text-right py-2 px-1 font-bold" style={{ color: currentBg.textLight }}>{formatCurrency(project.budget_amount)}</td>
                  <td className="text-right py-2 px-1 font-bold" style={{ color: currentBg.text }}>{formatCurrency(project.actual_cost_total)}</td>
                  <td className={`text-right py-2 pl-1 font-bold ${(project.budget_amount - project.actual_cost_total) < 0 ? 'text-amber-500' : ''}`} style={(project.budget_amount - project.actual_cost_total) >= 0 ? { color: currentBg.text } : {}}>
                    {formatCurrency(project.budget_amount - project.actual_cost_total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* 予算編集ボタン（adminのみ表示） */}
        {isAdmin && (
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: currentBg.text }}>🔒 予算管理（Admin）</span>
                <div className="text-xs" style={{ color: currentBg.textLight }}>
                  予定粗利: <span className="text-purple-400 font-semibold">{formatCurrency(project.planned_profit_amount)}</span>
                  <span className="ml-1">({formatRate(project.planned_profit_rate)})</span>
                </div>
              </div>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white"
              >
                予算編集
              </button>
            </div>
          </Card>
        )}

        {/* タブ */}
        <div className="flex gap-2 mb-4">
          {['costs', 'progress'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold ${
                activeTab === tab ? 'bg-orange-500/20 text-orange-400' : ''
              }`}
              style={activeTab !== tab ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {tab === 'costs' ? '原価' : '出来高'}
            </button>
          ))}
        </div>

        {/* 原価タブ */}
        {activeTab === 'costs' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCostModal(true)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white"
            >
              + 原価を追加
            </button>

            {project.costs?.length > 0 ? (
              <div className="space-y-2">
                {project.costs.map(cost => (
                  <Card key={cost.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>{cost.cost_date}</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">
                            {cost.category_label || COST_CATEGORIES[cost.cost_category] || cost.cost_category}
                          </span>
                          <span className="font-semibold text-sm" style={{ color: currentBg.text }}>{formatCurrency(cost.amount)}</span>
                        </div>
                        {cost.note && <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>{cost.note}</div>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                原価データがありません
              </div>
            )}
          </div>
        )}

        {/* 出来高タブ */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowProgressModal(true)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white"
            >
              + 出来高を追加
            </button>

            {project.progresses?.length > 0 ? (
              <div className="space-y-2">
                {project.progresses.map(pr => (
                  <Card key={pr.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: currentBg.text }}>{pr.target_month}</div>
                        {pr.note && <div className="text-xs" style={{ color: currentBg.textLight }}>{pr.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: currentBg.text }}>{formatCurrency(pr.progress_amount)}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                出来高データがありません
              </div>
            )}
          </div>
        )}
      </div>

      {/* 原価追加モーダル */}
      <AnimatePresence>
        {showCostModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCostModal(false)}
          >
            <motion.div
              className="w-full rounded-t-2xl p-5"
              style={{ background: cardBg }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>原価を追加</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>日付</label>
                  <input
                    type="date"
                    value={costForm.cost_date}
                    onChange={e => setCostForm({ ...costForm, cost_date: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>区分（必須）</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(COST_CATEGORIES).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setCostForm({ ...costForm, cost_category: key })}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                          costForm.cost_category === key ? 'bg-orange-500/20 text-orange-400' : ''
                        }`}
                        style={costForm.cost_category !== key ? { background: inputBg, color: currentBg.textLight } : {}}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>金額</label>
                  <input
                    type="number"
                    value={costForm.amount}
                    onChange={e => setCostForm({ ...costForm, amount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>メモ（任意）</label>
                  <input
                    type="text"
                    value={costForm.note}
                    onChange={e => setCostForm({ ...costForm, note: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCostModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAddCost}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                  >
                    追加
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 出来高追加モーダル */}
      <AnimatePresence>
        {showProgressModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProgressModal(false)}
          >
            <motion.div
              className="w-full rounded-t-2xl p-5"
              style={{ background: cardBg }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>出来高を追加</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>対象月</label>
                  <input
                    type="month"
                    value={progressForm.target_month}
                    onChange={e => setProgressForm({ ...progressForm, target_month: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>出来高金額</label>
                  <input
                    type="number"
                    value={progressForm.progress_amount}
                    onChange={e => setProgressForm({ ...progressForm, progress_amount: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>メモ（任意）</label>
                  <input
                    type="text"
                    value={progressForm.note}
                    onChange={e => setProgressForm({ ...progressForm, note: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowProgressModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAddProgress}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 text-white"
                  >
                    追加
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 予算編集モーダル（adminのみ） */}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBudgetModal(false)}
          >
            <motion.div
              className="w-full rounded-t-2xl p-5"
              style={{ background: cardBg }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>予算編集（Admin）</h3>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>受注金額</label>
                  <input
                    type="number"
                    value={budgetForm.contract_amount}
                    onChange={e => setBudgetForm({ ...budgetForm, contract_amount: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-2 block font-semibold" style={{ color: currentBg.text }}>カテゴリ別予算</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(COST_CATEGORIES).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[10px] mb-0.5 block" style={{ color: currentBg.textLight }}>{label}</label>
                        <input
                          type="number"
                          value={budgetForm.planned_cost_by_category[key] || ''}
                          onChange={e => setBudgetForm({
                            ...budgetForm,
                            planned_cost_by_category: {
                              ...budgetForm.planned_cost_by_category,
                              [key]: e.target.value
                            }
                          })}
                          placeholder="0"
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ background: inputBg, color: currentBg.text }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg p-3" style={{ background: inputBg }}>
                  <div className="text-xs space-y-1" style={{ color: currentBg.textLight }}>
                    <div>
                      予定原価合計: {formatCurrency(
                        Object.values(budgetForm.planned_cost_by_category).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
                      )}
                    </div>
                    <div>
                      予定利益: {formatCurrency(
                        (parseInt(budgetForm.contract_amount) || 0) -
                        Object.values(budgetForm.planned_cost_by_category).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateBudget}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                  >
                    保存
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
