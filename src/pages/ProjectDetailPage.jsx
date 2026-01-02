import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, Download, FileText, Wallet, Calculator, FolderOpen, Info, CheckCircle, PlayCircle, Flag, XCircle, X, Trash2, Receipt, Plus } from 'lucide-react'
import { Card, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

// ステータス定義
const STATUS_CONFIG = {
  pending: {
    label: '見積中',
    color: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    dotColor: '#f59e0b',
    icon: '🟡',
    nextAction: { label: '受注', status: '受注済み', icon: CheckCircle, color: '#3b82f6' },
    altAction: { label: '失注', status: '失注', icon: XCircle, color: '#ef4444' },
  },
  accepted: {
    label: '受注済み',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    dotColor: '#3b82f6',
    icon: '🔵',
    nextAction: { label: '施工開始', status: '施工中', icon: PlayCircle, color: '#10b981' },
  },
  working: {
    label: '施工中',
    color: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    dotColor: '#10b981',
    icon: '🟢',
    nextAction: { label: '完工', status: '完工', icon: Flag, color: '#8b5cf6' },
  },
  completed: {
    label: '完工',
    color: 'bg-slate-500/20',
    textColor: 'text-slate-400',
    dotColor: '#64748b',
    icon: '⚪',
  },
  lost: {
    label: '失注',
    color: 'bg-red-500/20',
    textColor: 'text-red-400',
    dotColor: '#ef4444',
    icon: '🔴',
  },
}

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount) return '¥0'
  return `¥${amount.toLocaleString()}`
}

// テーマスタイル
const useThemeStyles = () => {
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  return {
    currentBg,
    isOcean,
    isLightTheme,
    cardBg: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)',
    cardBorder: isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)',
    inputBg: isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f',
  }
}

// タブ定義
const TABS = [
  { id: 'info', label: '基本情報', icon: Info },
  { id: 'quote', label: '見積', icon: FileText },
  { id: 'budget', label: '予算', icon: Wallet },
  { id: 'cost', label: '原価', icon: Calculator },
  { id: 'billing', label: '請求', icon: Receipt },
  { id: 'docs', label: '書類', icon: FolderOpen },
]

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const styles = useThemeStyles()
  const { currentBg, cardBg, cardBorder, inputBg, isOcean, isLightTheme } = styles
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [toast, setToast] = useState({ show: false, message: '' })

  // 予算・原価用のstate
  const [budgetForm, setBudgetForm] = useState({
    sales_budget: '',
    construction_budget: '',
  })
  const [costItems, setCostItems] = useState([])
  const [showBudgetEdit, setShowBudgetEdit] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
        setBudgetForm({
          sales_budget: data.sales_budget || '',
          construction_budget: data.construction_budget || '',
        })
        // 原価データも取得
        fetchCosts()
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/costs`)
      if (res.ok) {
        setCostItems(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getProjectStatus = () => {
    if (!project) return 'pending'
    if (project.status === '失注' || project.status === 'rejected') return 'lost'
    if (project.status === '完工') return 'completed'
    if (project.status === '施工中') return 'working'
    if (project.status === '受注済' || project.status === 'ordered' || project.status === '受注済み' || project.project_id) return 'accepted'
    return 'pending'
  }

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`ステータスを「${newStatus}」に変更しますか？`)) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        showToast(`${newStatus}に変更しました`)
        fetchProject()
      } else {
        showToast('ステータス変更に失敗しました')
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleBudgetSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_budget: parseInt(budgetForm.sales_budget) || 0,
          construction_budget: parseInt(budgetForm.construction_budget) || 0,
        })
      })

      if (res.ok) {
        showToast('予算を保存しました')
        setShowBudgetEdit(false)
        fetchProject()
      } else {
        showToast('保存に失敗しました')
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleDownloadPDF = async () => {
    try {
      showToast('PDF生成中...')
      const res = await fetch(`${API_BASE}/quotes/${id}/pdf`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `見積書_${project?.project_name || '見積書'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('PDFをダウンロードしました')
      } else {
        showToast('PDF生成に失敗しました')
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
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
        <div className="text-center" style={{ color: currentBg.textLight }}>案件が見つかりません</div>
      </div>
    )
  }

  const status = getProjectStatus()
  const statusConfig = STATUS_CONFIG[status]
  const totalAmount = project.total_amount || project.total || 0
  const salesProfit = project.sales_profit || 0  // 営業利益（営業が入力）
  const constructionBudgetFrame = totalAmount - salesProfit  // 工事予算枠 = 売上 - 営業利益
  const actualCost = project.actual_cost || costItems.reduce((sum, c) => sum + (c.amount || 0), 0)

  // 予算内訳合計を計算（sheets[].items[].budgets を集計）
  const sheets = project.sheets || []
  const budgetTotal = sheets.reduce((total, sheet) => {
    return total + (sheet.items || []).reduce((sheetTotal, item) => {
      return sheetTotal + (item.budgets || []).reduce((budgetSum, budget) => {
        return budgetSum + ((budget.quantity || 0) * (budget.unit_price || budget.unitPrice || 0))
      }, 0)
    }, 0)
  }, 0)

  // 利益計算（指示書の構造）
  const constructionProfit = constructionBudgetFrame - budgetTotal  // 工事予定利益 = 工事予算枠 - 予算内訳合計
  const expectedGrossProfit = salesProfit + constructionProfit  // 予定粗利 = 営業利益 + 工事予定利益
  const finalProfit = totalAmount - actualCost  // 実績粗利 = 売上 - 実行原価

  // パーセンテージ計算
  const profitRate = totalAmount > 0 ? ((finalProfit / totalAmount) * 100).toFixed(1) : 0
  const salesProfitRate = totalAmount > 0 ? ((salesProfit / totalAmount) * 100).toFixed(1) : 0
  const constructionProfitRate = constructionBudgetFrame > 0 ? ((constructionProfit / constructionBudgetFrame) * 100).toFixed(1) : 0
  const expectedGrossProfitRate = totalAmount > 0 ? ((expectedGrossProfit / totalAmount) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: currentBg.headerBg,
          borderBottom: `1px solid ${currentBg.border}`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: inputBg }}
            >
              <ArrowLeft size={20} style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusConfig.color} ${statusConfig.textColor}`}>
                  <span>{statusConfig.icon}</span>
                  <span>{statusConfig.label}</span>
                </span>
              </div>
              <h1 className="text-base font-semibold mt-1" style={{ color: currentBg.text }}>
                {project.project_name || project.title || '無題'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: inputBg }}
            >
              <Download size={18} style={{ color: currentBg.textLight }} />
            </button>
            <button
              onClick={() => navigate(`/quotes/${id}/edit`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: inputBg }}
            >
              <Edit3 size={18} style={{ color: currentBg.textLight }} />
            </button>
          </div>
        </div>
      </header>

      {/* 全体サマリ（常に表示） */}
      <div className="px-4 py-3">
        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          {/* 売上と予定粗利 */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs" style={{ color: currentBg.textLight }}>売上（税抜）</div>
                <div className="text-2xl font-bold" style={{ color: theme.primary }}>{formatMoney(totalAmount)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: currentBg.textLight }}>予定粗利</div>
                <div className="text-2xl font-bold" style={{ color: expectedGrossProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatMoney(expectedGrossProfit)}
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full inline-block" style={{
                  background: expectedGrossProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: expectedGrossProfit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {expectedGrossProfitRate}%
                </div>
              </div>
            </div>

            {/* 利益内訳（4分割） */}
            <div className="grid grid-cols-4 gap-2 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <div className="text-center">
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>営業利益</div>
                <div className="text-sm font-bold" style={{ color: '#10b981' }}>{formatMoney(salesProfit)}</div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>{salesProfitRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>工事予定利益</div>
                <div className="text-sm font-bold" style={{ color: constructionProfit >= 0 ? '#3b82f6' : '#ef4444' }}>
                  {formatMoney(constructionProfit)}
                </div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>{constructionProfitRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>工事予算枠</div>
                <div className="text-sm font-bold" style={{ color: currentBg.text }}>{formatMoney(constructionBudgetFrame)}</div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>営業→工事</div>
              </div>
              <div className="text-center">
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>予算合計</div>
                <div className="text-sm font-bold" style={{ color: currentBg.text }}>{formatMoney(budgetTotal)}</div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>内訳合計</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive ? 'text-white' : ''
                }`}
                style={{
                  background: isActive ? theme.primary : inputBg,
                  color: isActive ? 'white' : currentBg.textLight,
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="px-4">
        {activeTab === 'info' && (
          <InfoTab
            project={project}
            status={status}
            statusConfig={statusConfig}
            onStatusChange={handleStatusChange}
            styles={styles}
            theme={theme}
          />
        )}

        {activeTab === 'quote' && (
          <QuoteTab
            project={project}
            onEdit={() => navigate(`/quotes/${id}/edit`)}
            onDownload={handleDownloadPDF}
            styles={styles}
            theme={theme}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            project={project}
            status={status}
            budgetForm={budgetForm}
            setBudgetForm={setBudgetForm}
            showEdit={showBudgetEdit}
            setShowEdit={setShowBudgetEdit}
            onSave={handleBudgetSave}
            styles={styles}
            theme={theme}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'cost' && (
          <CostTab
            project={project}
            status={status}
            costItems={costItems}
            onRefresh={fetchCosts}
            styles={styles}
            theme={theme}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            project={project}
            styles={styles}
            theme={theme}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'docs' && (
          <DocsTab
            project={project}
            styles={styles}
            theme={theme}
            onShowToast={showToast}
          />
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// 基本情報タブ
function InfoTab({ project, status, statusConfig, onStatusChange, styles, theme }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles

  const infoItems = [
    { label: '工事名', value: project.project_name || project.title || '未設定' },
    { label: '元請け（顧客）', value: project.client_name || '未設定' },
    { label: '工事場所', value: project.location || '未設定' },
    { label: '工期', value: project.start_date && project.end_date ? `${project.start_date} 〜 ${project.end_date}` : '未設定' },
    { label: '担当者', value: project.manager || '未設定' },
    { label: 'メモ', value: project.notes || project.memo || '−' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {infoItems.map((item, idx) => (
          <div
            key={idx}
            className={`py-3 ${idx < infoItems.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: cardBorder }}
          >
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>{item.label}</div>
            <div className="text-sm" style={{ color: currentBg.text }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ステータス変更ボタン */}
      {statusConfig.nextAction && (
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange(statusConfig.nextAction.status)}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: statusConfig.nextAction.color }}
          >
            <statusConfig.nextAction.icon size={18} />
            {statusConfig.nextAction.label}
          </button>
          {statusConfig.altAction && (
            <button
              onClick={() => onStatusChange(statusConfig.altAction.status)}
              className="py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
            >
              <statusConfig.altAction.icon size={18} />
              {statusConfig.altAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// 見積タブ
function QuoteTab({ project, onEdit, onDownload, styles, theme }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles

  // sheetsから明細を取得（sheets[].items を展開）
  const sheets = project.sheets || []
  const allItems = sheets.flatMap(sheet => sheet.items || [])
  const items = allItems.length > 0 ? allItems : (project.items || [])

  // 合計はDBの値を優先、なければ計算
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const subtotal = calculatedSubtotal || (project.total_amount || 0)
  const tax = Math.floor(subtotal * 0.1)
  const total = project.total_amount || (subtotal + tax)

  return (
    <div className="space-y-4">
      {/* 見積明細 */}
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>明細</div>
        {items.length === 0 ? (
          <div className="text-center py-6" style={{ color: currentBg.textLight }}>
            明細がありません
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: cardBorder }}>
                <div>
                  <div className="text-sm" style={{ color: currentBg.text }}>{item.name || '項目'}</div>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>
                    {item.quantity} {item.unit} × ¥{(item.unit_price || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: theme.primary }}>
                  ¥{(item.amount || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 合計 */}
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: currentBg.textLight }}>小計</span>
            <span style={{ color: currentBg.text }}>¥{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: currentBg.textLight }}>消費税 (10%)</span>
            <span style={{ color: currentBg.text }}>¥{tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span style={{ color: currentBg.text }}>合計</span>
            <span style={{ color: theme.primary }}>¥{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ background: inputBg, color: currentBg.text }}
        >
          <Edit3 size={16} />
          見積を編集
        </button>
        <button
          onClick={onDownload}
          className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary }}
        >
          <Download size={16} />
          PDF出力
        </button>
      </div>
    </div>
  )
}

// 予算タブ
function BudgetTab({ project, status, budgetForm, setBudgetForm, showEdit, setShowEdit, onSave, styles, theme, onShowToast }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles
  const canEdit = status === 'pending' || status === 'accepted'
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [vendorName, setVendorName] = useState('')
  const [creating, setCreating] = useState(false)

  // 予算明細を取得（sheets[].items[].budgets を展開）
  const sheets = project.sheets || []
  const allBudgetItems = []
  sheets.forEach((sheet, sheetIdx) => {
    (sheet.items || []).forEach((item, itemIdx) => {
      (item.budgets || []).forEach((budget, budgetIdx) => {
        if (budget.unit_price || budget.unitPrice) {
          allBudgetItems.push({
            id: `${sheetIdx}-${itemIdx}-${budgetIdx}`,
            parentName: item.name,
            type: budget.type || '労務費',
            spec: budget.spec || item.spec || '',
            quantity: budget.quantity || 0,
            unit: budget.unit || item.unit || '',
            unitPrice: budget.unit_price || budget.unitPrice || 0,
            amount: (budget.quantity || 0) * (budget.unit_price || budget.unitPrice || 0),
            remarks: budget.remarks || '',
          })
        }
      })
    })
  })

  // 種別別の集計
  const categoryTotals = allBudgetItems.reduce((acc, item) => {
    const type = item.type || 'その他'
    if (!acc[type]) acc[type] = 0
    acc[type] += item.amount || 0
    return acc
  }, {})

  const totalBudget = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

  // 新しい利益構造
  const totalAmount = project.total_amount || 0           // 売上（税抜）
  const salesProfit = project.sales_profit || 0           // 営業利益（営業が入力）
  const constructionBudget = totalAmount - salesProfit    // 工事予算枠 = 売上 - 営業利益
  const constructionProfit = constructionBudget - totalBudget  // 工事予定利益
  const constructionProfitRate = constructionBudget > 0 ? (constructionProfit / constructionBudget * 100).toFixed(1) : 0

  const toggleItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAllItems = () => {
    if (selectedItems.length === allBudgetItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(allBudgetItems.map(i => i.id))
    }
  }

  const handleCreatePurchaseOrder = async () => {
    if (!vendorName.trim()) {
      onShowToast && onShowToast('発注先を入力してください')
      return
    }
    if (selectedItems.length === 0) {
      onShowToast && onShowToast('発注項目を選択してください')
      return
    }

    setCreating(true)
    try {
      const items = allBudgetItems
        .filter(i => selectedItems.includes(i.id))
        .map(i => ({
          type: i.type,
          name: i.parentName,
          spec: i.spec,
          quantity: i.quantity,
          unit: i.unit,
          unit_price: i.unitPrice,
          remarks: i.remarks,
        }))

      const res = await fetch(`${API_BASE}/quotes/${project.id}/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: vendorName,
          items,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        onShowToast && onShowToast('発注書を作成しました')
        setShowPurchaseOrder(false)
        setSelectedItems([])
        setVendorName('')
        // PDF ダウンロード
        window.open(`${API_BASE}/purchase-orders/${result.id}/pdf`, '_blank')
      } else {
        onShowToast && onShowToast('発注書の作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      onShowToast && onShowToast('エラーが発生しました')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 工事部向け利益構造（新） */}
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {/* 工事予算枠（営業から） */}
        <div className="p-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
          <div className="text-xs text-white/80 mb-1">工事予算枠（営業から）</div>
          <div className="text-2xl font-bold text-white">¥{constructionBudget.toLocaleString()}</div>
          <div className="text-xs text-white/70 mt-1">
            売上 ¥{totalAmount.toLocaleString()} − 営業利益 ¥{salesProfit.toLocaleString()}
          </div>
        </div>

        {/* 予算内訳 */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-semibold" style={{ color: currentBg.text }}>予算内訳</div>
            <div className="text-lg font-bold" style={{ color: theme.primary }}>
              ¥{totalBudget.toLocaleString()}
            </div>
          </div>

          {allBudgetItems.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(categoryTotals).map(([type, amount]) => (
                <div key={type} className="flex justify-between items-center py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: currentBg.textLight }}>├</span>
                    <span style={{ color: currentBg.text }}>{type}</span>
                  </div>
                  <span className="font-medium" style={{ color: currentBg.text }}>¥{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm" style={{ color: currentBg.textLight }}>
              予算明細がありません
            </div>
          )}

          {/* 工事予定利益 */}
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold" style={{ color: currentBg.text }}>工事予定利益</div>
                <div className="text-xs" style={{ color: currentBg.textLight }}>
                  工事予算枠 − 予算内訳合計
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: constructionProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  ¥{constructionProfit.toLocaleString()}
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full inline-block" style={{
                  background: constructionProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: constructionProfit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {constructionProfitRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 発注書作成ボタン */}
      {allBudgetItems.length > 0 && (
        <button
          onClick={() => setShowPurchaseOrder(true)}
          className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: '#8b5cf6' }}
        >
          <FileText size={16} />
          発注書を作成
        </button>
      )}

      {/* 発注書作成モーダル */}
      {showPurchaseOrder && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-12 px-4 pb-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowPurchaseOrder(false)}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl"
            style={{ background: cardBg }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b" style={{ borderColor: cardBorder }}>
              <div className="text-lg font-bold" style={{ color: currentBg.text }}>発注書作成</div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  発注先 *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="例: 株式会社○○建設"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold" style={{ color: currentBg.textLight }}>
                    発注項目を選択
                  </label>
                  <button
                    onClick={selectAllItems}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: theme.primary }}
                  >
                    {selectedItems.length === allBudgetItems.length ? '選択解除' : '全選択'}
                  </button>
                </div>
                <div className="space-y-2">
                  {allBudgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                      style={{
                        background: selectedItems.includes(item.id) ? 'rgba(139, 92, 246, 0.1)' : inputBg,
                        border: selectedItems.includes(item.id) ? '1px solid #8b5cf6' : `1px solid ${cardBorder}`,
                      }}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center" style={{
                        background: selectedItems.includes(item.id) ? '#8b5cf6' : 'transparent',
                        border: selectedItems.includes(item.id) ? 'none' : `1px solid ${cardBorder}`,
                      }}>
                        {selectedItems.includes(item.id) && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: currentBg.text }}>{item.parentName}</div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          {item.type} / {item.quantity} {item.unit} × ¥{item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-medium" style={{ color: theme.primary }}>
                        ¥{item.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: cardBorder }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: currentBg.textLight }}>選択金額合計</span>
                    <span className="font-bold" style={{ color: theme.primary }}>
                      ¥{allBudgetItems
                        .filter(i => selectedItems.includes(i.id))
                        .reduce((sum, i) => sum + i.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-2" style={{ borderColor: cardBorder }}>
              <button
                onClick={() => setShowPurchaseOrder(false)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: inputBg, color: currentBg.textLight }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreatePurchaseOrder}
                disabled={creating}
                className="flex-1 py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#8b5cf6' }}
              >
                {creating ? '作成中...' : '発注書を作成'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// 原価タブ
function CostTab({ project, status, costItems, onRefresh, styles, theme }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles
  const canEdit = status === 'working'

  // 費目別集計
  const categories = [
    { id: 'labor', label: '労務費', icon: '👷' },
    { id: 'subcontract', label: '外注費', icon: '🏗️' },
    { id: 'material', label: '材料費', icon: '🧱' },
    { id: 'machine', label: '機械費', icon: '🚜' },
    { id: 'expense', label: '経費', icon: '💰' },
  ]

  const costByCategory = categories.map(cat => ({
    ...cat,
    amount: costItems.filter(c => c.category === cat.id).reduce((sum, c) => sum + (c.amount || 0), 0)
  }))

  const totalCost = costItems.reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* 費目別サマリ */}
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>費目別集計</div>
        <div className="space-y-2">
          {costByCategory.map(cat => (
            <div key={cat.id} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span className="text-sm" style={{ color: currentBg.text }}>{cat.label}</span>
              </div>
              <span className="font-medium" style={{ color: currentBg.text }}>
                ¥{cat.amount.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 mt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <span className="text-sm font-semibold" style={{ color: currentBg.text }}>合計</span>
            <span className="text-lg font-bold" style={{ color: theme.primary }}>
              ¥{totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 予算vs実績 */}
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>予算 vs 実績</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span style={{ color: currentBg.textLight }}>工事予算</span>
            <span style={{ color: currentBg.text }}>¥{(project.construction_budget || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: currentBg.textLight }}>実行原価</span>
            <span style={{ color: currentBg.text }}>¥{totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <span className="font-medium" style={{ color: currentBg.text }}>差額</span>
            <span className="font-bold" style={{
              color: (project.construction_budget || 0) - totalCost >= 0 ? '#10b981' : '#ef4444'
            }}>
              ¥{((project.construction_budget || 0) - totalCost).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {canEdit ? (
        <button
          className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: theme.primary }}
        >
          + 原価を入力
        </button>
      ) : (
        <div className="text-center text-xs py-2" style={{ color: currentBg.textLight }}>
          原価入力は施工中のみ可能です
        </div>
      )}
    </div>
  )
}

// 請求タブ
function BillingTab({ project, styles, theme, onShowToast }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showPaymentCreate, setShowPaymentCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeSection, setActiveSection] = useState('invoices') // 'invoices' or 'payments'
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: project.total_amount || 0,
    notes: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    vendor_name: '',
    description: '',
    amount: 0,
    due_date: '',
    category: '外注費',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [project.id])

  const fetchData = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE}/quotes/${project.id}/invoices`),
        fetch(`${API_BASE}/quotes/${project.id}/payments`),
      ])
      if (invoicesRes.ok) {
        setInvoices(await invoicesRes.json())
      }
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${project.id}/invoices`)
      if (res.ok) {
        setInvoices(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${project.id}/payments`)
      if (res.ok) {
        setPayments(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/quotes/${project.id}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm),
      })

      if (res.ok) {
        const result = await res.json()
        onShowToast && onShowToast('請求書を作成しました')
        setShowCreate(false)
        fetchInvoices()
        // PDF表示
        window.open(`${API_BASE}/invoices/${result.id}/pdf`, '_blank')
      } else {
        onShowToast && onShowToast('作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
      onShowToast && onShowToast('エラーが発生しました')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (invoiceId) => {
    if (!confirm('この請求書を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onShowToast && onShowToast('削除しました')
        fetchInvoices()
      } else {
        onShowToast && onShowToast('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      onShowToast && onShowToast('エラーが発生しました')
    }
  }

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const invoice = invoices.find(i => i.id === invoiceId)
      if (!invoice) return

      const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoice,
          status: newStatus,
        }),
      })

      if (res.ok) {
        onShowToast && onShowToast(`${newStatus}に更新しました`)
        fetchInvoices()
      }
    } catch (error) {
      console.error('Failed to update invoice:', error)
    }
  }

  // 支払登録
  const handleCreatePayment = async () => {
    if (!paymentForm.vendor_name) {
      onShowToast && onShowToast('支払先を入力してください')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/quotes/${project.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })

      if (res.ok) {
        onShowToast && onShowToast('支払を登録しました')
        setShowPaymentCreate(false)
        setPaymentForm({
          vendor_name: '',
          description: '',
          amount: 0,
          due_date: '',
          category: '外注費',
          notes: '',
        })
        fetchPayments()
      } else {
        onShowToast && onShowToast('登録に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create payment:', error)
      onShowToast && onShowToast('エラーが発生しました')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('この支払を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onShowToast && onShowToast('削除しました')
        fetchPayments()
      } else {
        onShowToast && onShowToast('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete payment:', error)
      onShowToast && onShowToast('エラーが発生しました')
    }
  }

  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const payment = payments.find(p => p.id === paymentId)
      if (!payment) return

      const res = await fetch(`${API_BASE}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payment,
          status: newStatus,
          payment_date: newStatus === '支払済み' ? new Date().toISOString().split('T')[0] : payment.payment_date,
        }),
      })

      if (res.ok) {
        onShowToast && onShowToast(`${newStatus}に更新しました`)
        fetchPayments()
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case '入金済み': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
      case '請求済み': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }
      case '支払済み': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
      case '未払い': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
      case '未請求':
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af' }
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case '外注費': return '#8b5cf6'
      case '材料費': return '#10b981'
      case '労務費': return '#3b82f6'
      case '機械費': return '#f59e0b'
      case '経費': return '#6b7280'
      default: return '#94a3b8'
    }
  }

  // 金額計算（すべて税込で統一）
  const quoteAmountExTax = project.total_amount || 0  // 見積金額（税抜）
  const quoteAmount = Math.floor(quoteAmountExTax * 1.1)  // 見積金額（税込）
  const orderAmount = project.order_amount || 0  // 注文金額（税込として扱う）
  const baseAmount = orderAmount > 0 ? orderAmount : quoteAmount  // 基準金額（税込）

  // 請求合計（税込）
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const totalPaid = invoices
    .filter(inv => inv.status === '入金済み')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const remainingAmount = baseAmount - totalInvoiced  // 残額（税込）

  // 支払合計
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaymentsPaid = payments
    .filter(p => p.status === '支払済み')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* 請求サマリ */}
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {/* 金額情報 */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>見積金額（税込）</div>
              <div className="text-sm font-semibold" style={{ color: currentBg.text }}>
                ¥{quoteAmount.toLocaleString()}
              </div>
            </div>
            {orderAmount > 0 && (
              <div>
                <div className="text-xs" style={{ color: currentBg.textLight }}>注文金額（税込）</div>
                <div className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                  ¥{orderAmount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>請求合計（税込）</div>
              <div className="text-lg font-bold" style={{ color: theme.primary }}>
                ¥{totalInvoiced.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>残額（税込）</div>
              <div className="text-lg font-bold" style={{
                color: remainingAmount >= 0 ? '#10b981' : '#ef4444'
              }}>
                ¥{remainingAmount.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>入金済み</div>
              <div className="text-sm font-semibold" style={{ color: '#10b981' }}>
                ¥{totalPaid.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>支払済み</div>
              <div className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                ¥{totalPaymentsPaid.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* セクション切り替え（横並び） */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('invoices')}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1"
          style={{
            background: activeSection === 'invoices' ? theme.primary : inputBg,
            color: activeSection === 'invoices' ? 'white' : currentBg.textLight,
          }}
        >
          請求 ({invoices.length})
        </button>
        <button
          onClick={() => setActiveSection('payments')}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1"
          style={{
            background: activeSection === 'payments' ? '#ef4444' : inputBg,
            color: activeSection === 'payments' ? 'white' : currentBg.textLight,
          }}
        >
          支払 ({payments.length})
        </button>
      </div>

      {/* 請求書一覧 */}
      {activeSection === 'invoices' && (
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>請求書一覧</div>

        {loading ? (
          <div className="text-center py-6" style={{ color: currentBg.textLight }}>
            読み込み中...
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">📄</div>
            <div className="text-sm">請求書がありません</div>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const statusStyle = getStatusColor(invoice.status)
              return (
                <div
                  key={invoice.id}
                  className="p-3 rounded-lg"
                  style={{ background: inputBg }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: currentBg.text }}>
                      {invoice.invoice_number}
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: statusStyle.bg, color: statusStyle.text }}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: currentBg.textLight }}>
                      {invoice.invoice_date} • 支払期限: {invoice.due_date || '未設定'}
                    </div>
                    <div className="text-sm font-bold" style={{ color: theme.primary }}>
                      ¥{(invoice.total_amount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <button
                      onClick={() => window.open(`${API_BASE}/invoices/${invoice.id}/pdf`, '_blank')}
                      className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                    >
                      <Download size={14} /> PDF
                    </button>
                    {invoice.status === '未請求' && (
                      <button
                        onClick={() => handleUpdateStatus(invoice.id, '請求済み')}
                        className="flex-1 py-2 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                      >
                        請求済みにする
                      </button>
                    )}
                    {invoice.status === '請求済み' && (
                      <button
                        onClick={() => handleUpdateStatus(invoice.id, '入金済み')}
                        className="flex-1 py-2 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                      >
                        入金済みにする
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}

      {/* 請求書作成ボタン */}
      {activeSection === 'invoices' && (
        <button
        onClick={() => setShowCreate(true)}
        className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: theme.primary }}
      >
        <Plus size={16} /> 請求書を作成
      </button>
      )}

      {/* 支払一覧 */}
      {activeSection === 'payments' && (
        <>
          <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>支払一覧</div>

            {loading ? (
              <div className="text-center py-6" style={{ color: currentBg.textLight }}>
                読み込み中...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                <div className="text-4xl mb-2">💸</div>
                <div className="text-sm">支払がありません</div>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const statusStyle = getStatusColor(payment.status)
                  return (
                    <div
                      key={payment.id}
                      className="p-3 rounded-lg"
                      style={{ background: inputBg }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: getCategoryColor(payment.category) + '20', color: getCategoryColor(payment.category) }}
                          >
                            {payment.category}
                          </span>
                          <span className="text-sm font-medium" style={{ color: currentBg.text }}>
                            {payment.vendor_name}
                          </span>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}
                        >
                          {payment.status}
                        </span>
                      </div>
                      {payment.description && (
                        <div className="text-xs mb-2" style={{ color: currentBg.textLight }}>
                          {payment.description}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          支払期限: {payment.due_date || '未設定'}
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#ef4444' }}>
                          ¥{(payment.amount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
                        {payment.status === '未払い' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(payment.id, '支払済み')}
                            className="flex-1 py-2 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                          >
                            支払済みにする
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowPaymentCreate(true)}
            className="w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#ef4444' }}
          >
            <Plus size={16} /> 支払を登録
          </button>
        </>
      )}

      {/* 請求書作成モーダル */}
      {showCreate && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: cardBg }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b" style={{ borderColor: cardBorder }}>
              <div className="text-lg font-bold" style={{ color: currentBg.text }}>請求書作成</div>
              <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                {project.client_name} / {project.project_name}
              </div>
            </div>

            {/* 金額サマリ */}
            <div className="p-4" style={{ background: inputBg }}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px]" style={{ color: currentBg.textLight }}>
                    {orderAmount > 0 ? '注文金額' : '見積金額'}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: currentBg.text }}>
                    ¥{baseAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: currentBg.textLight }}>請求済み</div>
                  <div className="text-xs font-semibold" style={{ color: theme.primary }}>
                    ¥{totalInvoiced.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: currentBg.textLight }}>残額</div>
                  <div className="text-xs font-semibold" style={{ color: remainingAmount >= 0 ? '#10b981' : '#ef4444' }}>
                    ¥{remainingAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                    請求日
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                    支払期限
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  請求金額（税抜）
                </label>
                <input
                  type="number"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="金額を入力"
                />
                <div className="flex justify-between mt-2 text-xs" style={{ color: currentBg.textLight }}>
                  <span>税込: ¥{Math.floor(invoiceForm.amount * 1.1).toLocaleString()}</span>
                  {remainingAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setInvoiceForm({ ...invoiceForm, amount: remainingAmount })}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                    >
                      残額を入力
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  備考（分割請求の場合は回数等を記載）
                </label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="例: 3回分割の1回目"
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2" style={{ borderColor: cardBorder }}>
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: inputBg, color: currentBg.textLight }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || invoiceForm.amount <= 0}
                className="flex-1 py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: theme.primary }}
              >
                {creating ? '作成中...' : '作成してPDF表示'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 支払登録モーダル */}
      {showPaymentCreate && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowPaymentCreate(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl"
            style={{ background: cardBg }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b" style={{ borderColor: cardBorder }}>
              <div className="text-lg font-bold" style={{ color: currentBg.text }}>支払登録</div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  支払先 *
                </label>
                <input
                  type="text"
                  value={paymentForm.vendor_name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, vendor_name: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="業者名・氏名"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  種別
                </label>
                <select
                  value={paymentForm.category}
                  onChange={(e) => setPaymentForm({ ...paymentForm, category: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                >
                  <option value="外注費">外注費</option>
                  <option value="材料費">材料費</option>
                  <option value="労務費">労務費</option>
                  <option value="機械費">機械費</option>
                  <option value="経費">経費</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  内容
                </label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="作業内容など"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  金額
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  支払期限
                </label>
                <input
                  type="date"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: currentBg.textLight }}>
                  備考
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
                  placeholder="備考があれば入力"
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2" style={{ borderColor: cardBorder }}>
              <button
                onClick={() => setShowPaymentCreate(false)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: inputBg, color: currentBg.textLight }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={creating}
                className="flex-1 py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#ef4444' }}
              >
                {creating ? '登録中...' : '登録する'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

// 書類タブ
function DocsTab({ project, styles, theme, onShowToast }) {
  const { currentBg, cardBg, cardBorder, inputBg } = styles
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [project.id])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes/${project.id}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/quotes/${project.id}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        onShowToast && onShowToast('ファイルをアップロードしました')
        fetchDocuments()
      } else {
        onShowToast && onShowToast('アップロードに失敗しました')
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
      onShowToast && onShowToast('エラーが発生しました')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('この書類を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/documents/${docId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onShowToast && onShowToast('削除しました')
        fetchDocuments()
      } else {
        onShowToast && onShowToast('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      onShowToast && onShowToast('エラーが発生しました')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return '📄'
    if (fileType === 'image') return '🖼️'
    return '📁'
  }

  return (
    <div className="space-y-4">
      {/* 書類一覧 */}
      <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>書類一覧</div>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            読み込み中...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">📁</div>
            <div className="text-sm">書類がありません</div>
            <div className="text-xs mt-1">PDFや画像をアップロードできます</div>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: inputBg }}
              >
                <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate cursor-pointer hover:underline"
                    style={{ color: theme.primary }}
                    onClick={() => {
                      if (doc.file_type === 'image' || doc.file_type === 'pdf') {
                        setPreviewDoc(doc)
                      } else {
                        window.open(`${API_BASE}/documents/${doc.id}/download`, '_blank')
                      }
                    }}
                  >
                    {doc.filename}
                  </div>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>
                    {formatFileSize(doc.file_size)} • {doc.created_at?.split('T')[0]}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => window.open(`${API_BASE}/documents/${doc.id}/download`, '_blank')}
                    className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                    title="ダウンロード"
                  >
                    <Download size={16} style={{ color: theme.primary }} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="削除"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アップロードボタン */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: inputBg, color: currentBg.text }}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            アップロード中...
          </>
        ) : (
          <>+ 書類をアップロード</>
        )}
      </button>

      {/* プレビューモーダル */}
      {previewDoc && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setPreviewDoc(null)}
        >
          <motion.div
            className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl"
            style={{ background: cardBg }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: cardBorder }}>
              <div className="text-sm font-semibold truncate" style={{ color: currentBg.text }}>
                {previewDoc.filename}
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg hover:bg-black/10"
              >
                <X size={20} style={{ color: currentBg.textLight }} />
              </button>
            </div>
            <div className="p-4">
              {previewDoc.file_type === 'image' ? (
                <img
                  src={`${API_BASE}/documents/${previewDoc.id}/view`}
                  alt={previewDoc.filename}
                  className="w-full h-auto rounded-lg"
                />
              ) : previewDoc.file_type === 'pdf' ? (
                <iframe
                  src={`${API_BASE}/documents/${previewDoc.id}/view`}
                  className="w-full h-[70vh] rounded-lg"
                  title={previewDoc.filename}
                />
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
