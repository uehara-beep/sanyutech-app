import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Tabs, Card, SectionTitle, Badge, ProgressBar, Button, Modal, Input, Select, Toast, Empty, DatePickerInput } from '../components/common'
import { Plus, FileText, Download, Trash2, Edit3, ChevronRight, Upload, FileSpreadsheet, CheckCircle, X } from 'lucide-react'
import { useRef } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount) return '¥0'
  if (amount >= 10000) {
    return `¥${Math.round(amount / 10000)}万`
  }
  return `¥${amount.toLocaleString()}`
}

const formatMoneyFull = (amount) => {
  if (!amount) return '¥0'
  return `¥${Number(amount).toLocaleString()}`
}

// PDF生成関数
const generateEstimatePDF = (estimate, project) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  // フォント設定（日本語対応のため基本フォントを使用）
  doc.setFont('helvetica')

  // ヘッダー：見積書タイトル
  doc.setFontSize(24)
  doc.setTextColor(0, 0, 0)
  doc.text('見積書', pageWidth / 2, y + 10, { align: 'center' })
  y += 20

  // 見積番号と発行日
  doc.setFontSize(10)
  doc.text(`見積番号: ${estimate.estimate_no || '-'}`, pageWidth - margin - 50, y)
  doc.text(`発行日: ${estimate.issue_date || '-'}`, pageWidth - margin - 50, y + 5)
  if (estimate.valid_until) {
    doc.text(`有効期限: ${estimate.valid_until}`, pageWidth - margin - 50, y + 10)
  }

  // 宛先
  doc.setFontSize(14)
  doc.text(`${estimate.client_name || project?.client || '御中'}`, margin, y + 5)
  doc.setFontSize(10)
  doc.text('下記の通りお見積もり申し上げます。', margin, y + 15)
  y += 25

  // 合計金額ボックス
  doc.setDrawColor(0)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, pageWidth - margin * 2, 15, 'F')
  doc.setFontSize(12)
  doc.text('御見積金額', margin + 5, y + 10)
  doc.setFontSize(16)
  const totalText = `¥${Number(estimate.total || 0).toLocaleString()} (税込)`
  doc.text(totalText, pageWidth - margin - 5, y + 10, { align: 'right' })
  y += 25

  // 件名
  doc.setFontSize(11)
  doc.text(`件名: ${estimate.title || project?.name || '-'}`, margin, y)
  y += 10

  // 明細テーブル
  const items = estimate.items || []
  const tableData = items.map((item, index) => [
    index + 1,
    item.name || '',
    item.specification || '',
    item.quantity || 1,
    item.unit || '式',
    item.unit_price ? Number(item.unit_price).toLocaleString() : '0',
    item.amount ? Number(item.amount).toLocaleString() : '0'
  ])

  autoTable(doc, {
    startY: y,
    head: [['No.', '品名', '規格・仕様', '数量', '単位', '単価', '金額']],
    body: tableData.length > 0 ? tableData : [[1, '-', '-', 1, '式', '0', '0']],
    theme: 'grid',
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: [255, 255, 255],
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { halign: 'right', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 25 }
    },
    margin: { left: margin, right: margin }
  })

  y = doc.lastAutoTable?.finalY || y + 30

  // 小計・税・合計
  const summaryX = pageWidth - margin - 60
  doc.setFontSize(10)

  // 小計
  doc.text('小計:', summaryX, y + 5)
  doc.text(`¥${Number(estimate.subtotal || 0).toLocaleString()}`, pageWidth - margin, y + 5, { align: 'right' })

  // 消費税
  doc.text('消費税(10%):', summaryX, y + 12)
  doc.text(`¥${Number(estimate.tax_amount || 0).toLocaleString()}`, pageWidth - margin, y + 12, { align: 'right' })

  // 合計（太線）
  doc.setDrawColor(0)
  doc.line(summaryX - 5, y + 15, pageWidth - margin, y + 15)
  doc.setFontSize(12)
  doc.text('合計:', summaryX, y + 22)
  doc.text(`¥${Number(estimate.total || 0).toLocaleString()}`, pageWidth - margin, y + 22, { align: 'right' })
  y += 30

  // 備考
  if (estimate.notes) {
    doc.setFontSize(10)
    doc.text('備考:', margin, y)
    y += 5
    doc.setFontSize(9)
    const noteLines = doc.splitTextToSize(estimate.notes, pageWidth - margin * 2)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4 + 5
  }

  // フッター（会社情報の場所）
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40)
  doc.setFontSize(10)
  doc.text('三友建設株式会社', pageWidth - margin, pageHeight - 30, { align: 'right' })
  doc.setFontSize(8)
  doc.text('〒XXX-XXXX 住所', pageWidth - margin, pageHeight - 25, { align: 'right' })
  doc.text('TEL: XXX-XXXX-XXXX', pageWidth - margin, pageHeight - 20, { align: 'right' })

  return doc
}

// ========================================
// S-BASE 工事一覧ページ
// ========================================
export default function SbasePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'list'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [projects, setProjects] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projectModal, setProjectModal] = useState({ open: false, data: null })
  const [toast, setToast] = useState({ show: false, message: '' })
  const [filter, setFilter] = useState('all') // all, ordered, in_progress, completed
  const fileInputRef = useRef(null)

  const tabs = [
    { id: 'list', label: '案件一覧' },
    { id: 'report', label: 'レポート' },
  ]

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  // クエリパラメータが変わったらタブを切り替え
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['list', 'report'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, dashboardRes] = await Promise.all([
        fetch(`${API_BASE}/projects/`),
        fetch(`${API_BASE}/projects/dashboard`)
      ])

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data)
      }

      if (dashboardRes.ok) {
        const data = await dashboardRes.json()
        setDashboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalProfit = dashboard?.total_profit || projects.reduce((sum, p) => sum + (p.contract_amount - (p.actual_cost || 0)), 0)
  const totalContract = dashboard?.total_contract || projects.reduce((sum, p) => sum + p.contract_amount, 0)
  const profitRate = totalContract > 0 ? ((totalProfit / totalContract) * 100).toFixed(1) : 0

  // 工事保存（追加・編集）
  const handleSaveProject = async (data) => {
    console.log('handleSaveProject called with:', data)
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/projects/${data.id}` : `${API_BASE}/projects/`
      console.log('API call:', method, url)

      // 新規作成時にコードを自動生成
      const saveData = { ...data }
      if (!data.id && !data.code) {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        saveData.code = `P${year}${month}-${random}`
      }
      console.log('Sending data:', saveData)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })
      console.log('Response status:', res.status)

      if (res.ok) {
        const result = await res.json()
        console.log('Success:', result)
        showToast(data.id ? '工事を更新しました' : '工事を登録しました')
        setProjectModal({ open: false, data: null })
        fetchData()
      } else {
        const errorText = await res.text()
        console.error('API Error:', res.status, errorText)
        alert(`保存に失敗しました: ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      alert(`エラー: ${error.message}`)
    }
  }

  // 工事削除
  const handleDeleteProject = async (projectId) => {
    if (!confirm('この工事を削除しますか？関連する予算・原価・見積データも削除されます。')) return

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('工事を削除しました')
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  // 見積書Excel取込
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/projects/import-estimate`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        showToast(`「${result.project_name}」を取込みました（工種: ${result.work_types_count}件）`)
        fetchData()
        // 詳細ページへ移動
        if (result.project_id) {
          navigate(`/sbase/${result.project_id}`)
        }
      } else {
        const error = await res.json()
        alert(`取込に失敗しました: ${error.detail || 'エラー'}`)
      }
    } catch (error) {
      console.error('Failed to import:', error)
      alert('Excelファイルの取込に失敗しました')
    } finally {
      // ファイル入力をリセット
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 見積書Excel出力
  const handleExportEstimate = async (projectId, projectName) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/export-estimate`, {
        method: 'POST'
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `見積書_${projectName}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('見積書をダウンロードしました')
      } else {
        alert('見積書の出力に失敗しました')
      }
    } catch (error) {
      console.error('Failed to export:', error)
      alert('見積書の出力に失敗しました')
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="案件一覧"
        icon="📊"
        gradient="from-orange-500 to-orange-600"
        onBack={() => navigate(-1)}
      />

      {/* サマリーカード */}
      <motion.div
        className="mx-5 my-4 p-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs opacity-80">全現場 最終利益</div>
        <div className="text-3xl font-bold my-2">{formatMoney(totalProfit)}</div>
        <div className="text-emerald-300 text-sm">利益率 {profitRate}%</div>
      </motion.div>

      {/* 追加ボタン */}
      <div className="px-5 mb-4 space-y-2">
        <Button block onClick={() => setProjectModal({ open: true, data: null })}>
          <Plus size={18} className="inline mr-2" />工事を追加
        </Button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <Upload size={18} />見積書Excel取込
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="px-5">
        {/* フィルターチップ */}
        {activeTab === 'list' && (
          <div className="flex gap-2 mb-4 overflow-x-auto py-1">
            {[
              { id: 'all', label: '全て' },
              { id: 'confirmed', label: '確定' },
              { id: 'prospect', label: '見込み有' },
              { id: 'lost', label: '見込み無' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-app-card border border-app-border text-slate-400'
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-60">
                  {f.id === 'all' ? projects.length :
                   f.id === 'confirmed' ? projects.filter(p => p.status === '受注確定' || p.status === '施工中' || p.status === '完了').length :
                   f.id === 'prospect' ? projects.filter(p => p.status === '見込み有' || p.status === '見積中').length :
                   projects.filter(p => p.status === '失注' || p.status === '見込み無').length}
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : (
          <>
            {activeTab === 'list' && (
              <ProjectList
                projects={projects}
                filter={filter}
                onEdit={(p) => setProjectModal({ open: true, data: p })}
                onDelete={handleDeleteProject}
                onExport={handleExportEstimate}
              />
            )}
            {activeTab === 'quotes' && (
              <QuotesTab onProjectCreated={fetchData} showToast={showToast} />
            )}
            {activeTab === 'report' && <ReportView projects={projects} dashboard={dashboard} />}
          </>
        )}
      </div>

      {/* 工事追加モーダル */}
      <ProjectModal
        isOpen={projectModal.open}
        data={projectModal.data}
        onClose={() => setProjectModal({ open: false, data: null })}
        onSave={handleSaveProject}
      />

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// 工事一覧
function ProjectList({ projects, filter, onEdit, onDelete, onExport }) {
  const navigate = useNavigate()

  // フィルター適用
  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true
    if (filter === 'confirmed') return ['受注確定', '施工中', '完了'].includes(p.status)
    if (filter === 'prospect') return ['見込み有', '見積中'].includes(p.status)
    if (filter === 'lost') return ['失注', '見込み無'].includes(p.status)
    return true
  })

  if (filteredProjects.length === 0) {
    return <Empty icon="📋" title="工事がありません" subtitle={filter === 'all' ? '新しい工事を登録してください' : '該当する工事がありません'} />
  }

  return (
    <>
      {filteredProjects.map((project, i) => {
        // 新しい利益構造
        const salesProfit = project.sales_profit || 0
        const constructionProfit = project.construction_profit || 0
        const totalProfit = project.total_profit || 0
        const salesProfitRate = project.sales_profit_rate || 0
        const constructionProfitRate = project.construction_profit_rate || 0
        const totalProfitRate = project.total_profit_rate || 0
        const progress = project.progress || 0

        return (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="mb-3">
              {/* ヘッダー: 工事番号 + ステータス */}
              <div className="flex justify-between items-center mb-2">
                <div className="text-[10px] text-slate-500 font-mono">
                  {project.project_code || `#${String(project.id).padStart(4, '0')}`}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    project.status === '施工中' ? 'success' :
                    project.status === '見積中' ? 'warning' :
                    project.status === '見込み有' ? 'default' :
                    project.status === '受注確定' ? 'success' :
                    project.status === '完了' ? 'default' :
                    project.status === '失注' ? 'danger' :
                    'default'
                  }>
                    {project.status || '未設定'}
                  </Badge>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExport(project.id, project.name); }}
                    className="p-1.5 rounded-lg bg-app-bg text-emerald-500 hover:bg-emerald-500/20"
                    title="見積書Excel出力"
                  >
                    <FileSpreadsheet size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                    className="p-1.5 rounded-lg bg-app-bg text-orange-500 hover:bg-orange-500/20"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                    className="p-1.5 rounded-lg bg-app-bg text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div
                className="cursor-pointer"
                onClick={() => navigate(`/sbase/${project.id}`)}
              >
                {/* 工事名 */}
                <div className="text-sm font-semibold mb-1">{project.name}</div>
                {/* 発注者 */}
                <div className="text-xs text-slate-400 mb-3">🏢 {project.client || '発注者未設定'}</div>

                {/* 金額グリッド */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* 受注金額 */}
                  <div className="bg-app-bg rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 mb-0.5">受注金額</div>
                    <div className="text-sm font-bold">{formatMoney(project.contract_amount)}</div>
                  </div>
                  {/* 工事部予算 */}
                  <div className="bg-app-bg rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 mb-0.5">工事部予算</div>
                    <div className="text-sm font-bold">{project.budget_amount ? formatMoney(project.budget_amount) : '-'}</div>
                  </div>
                </div>

                {/* 利益構造 */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {/* 営業利益 */}
                  <div className="bg-app-bg rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 mb-0.5">営業利益</div>
                    <div className={`text-xs font-bold ${salesProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {formatMoney(salesProfit)}
                      <div className="text-[10px] opacity-70">({salesProfitRate}%)</div>
                    </div>
                  </div>
                  {/* 工事利益 */}
                  <div className="bg-app-bg rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 mb-0.5">工事利益</div>
                    <div className={`text-xs font-bold ${constructionProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                      {formatMoney(constructionProfit)}
                      <div className="text-[10px] opacity-70">({constructionProfitRate}%)</div>
                    </div>
                  </div>
                  {/* 合計利益 */}
                  <div className="bg-app-bg rounded-lg p-2">
                    <div className="text-[9px] text-slate-500 mb-0.5">合計利益</div>
                    <div className={`text-xs font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMoney(totalProfit)}
                      <div className="text-[10px] opacity-70">({totalProfitRate}%)</div>
                    </div>
                  </div>
                </div>

                {/* 進捗バー */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">進捗</span>
                    <span className="text-emerald-400">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} color="bg-emerald-500" size="sm" />
                </div>

                <div className="flex items-center justify-end mt-3 text-xs text-slate-400">
                  <span>詳細を見る</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </>
  )
}

// 見積書タブ
function QuotesTab({ onProjectCreated, showToast }) {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)

  // 見積一覧取得
  const fetchQuotes = async () => {
    try {
      const res = await fetch(`${API_BASE}/quotes`)
      if (res.ok) {
        const data = await res.json()
        setQuotes(data)
      } else {
        console.error('Failed to fetch quotes:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  // 見積保存
  const handleSave = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/quotes/${data.id}` : `${API_BASE}/quotes`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        showToast(data.id ? '見積書を更新しました' : '見積書を作成しました')
        setShowModal(false)
        setEditData(null)
        await fetchQuotes()
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Quote save failed:', res.status, errorData)
        showToast(`保存に失敗しました: ${errorData.detail || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save quote:', error)
      showToast('保存に失敗しました')
    }
  }

  // 見積削除
  const handleDelete = async (quoteId) => {
    if (!confirm('この見積書を削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('見積書を削除しました')
        await fetchQuotes()
      }
    } catch (error) {
      console.error('Failed to delete quote:', error)
    }
  }

  // 受注に変換
  const handleConvertToOrder = async (quoteId) => {
    if (!confirm('この見積書を受注に変換しますか？\n工事と工種が自動作成されます。')) return

    try {
      const res = await fetch(`${API_BASE}/quotes/${quoteId}/convert-to-order`, {
        method: 'POST'
      })

      if (res.ok) {
        const result = await res.json()
        showToast(`受注しました！工事「${result.project_name}」を作成しました`)
        await fetchQuotes()
        onProjectCreated() // 工事一覧を更新
        // 工事詳細の予算タブへ遷移
        setTimeout(() => {
          navigate(`/sbase/${result.project_id}?tab=budget`)
        }, 1500)
      } else {
        const error = await res.json()
        showToast(error.detail || '変換に失敗しました')
      }
    } catch (error) {
      console.error('Failed to convert quote:', error)
      showToast('エラーが発生しました')
    }
  }

  const getStatusBadge = (status, projectId) => {
    if (projectId) {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">受注済</span>
    }
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">下書き</span>
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">送付済</span>
      case 'ordered':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">受注済</span>
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">失注</span>
      default:
        return null
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-8">読み込み中...</div>
  }

  return (
    <>
      {/* 新規作成ボタン */}
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>見積書</SectionTitle>
        <Button onClick={() => { setEditData(null); setShowModal(true) }}>
          <Plus size={16} className="inline mr-1" />新規作成
        </Button>
      </div>

      {/* 説明 */}
      <Card className="mb-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
        <div className="text-sm text-orange-400 font-medium mb-1">見積書から工事を作成</div>
        <div className="text-xs text-gray-400">
          1. 見積書を作成（工事名・元請け・明細を入力）<br />
          2. 「受注する」ボタンで工事・工種を自動作成<br />
          3. 工事詳細で原価管理を開始
        </div>
      </Card>

      {/* 見積一覧 */}
      {quotes.length === 0 ? (
        <Empty
          icon="📝"
          title="見積書がありません"
          subtitle="「新規作成」ボタンから見積書を作成してください"
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <motion.div
              key={quote.id}
              className="bg-app-card rounded-xl p-4 border border-app-border"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">{quote.quote_no}</span>
                    {getStatusBadge(quote.status, quote.project_id)}
                  </div>
                  <div className="font-medium text-white">{quote.title || '無題'}</div>
                  <div className="text-sm text-gray-400">{quote.client_name || '元請け未設定'}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-500">
                    {formatMoneyFull(quote.total)}
                  </div>
                  <div className="text-xs text-gray-500">{quote.items?.length || 0}項目</div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-app-border">
                {!quote.project_id && (
                  <>
                    <button
                      onClick={() => handleConvertToOrder(quote.id)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-1 bg-orange-500"
                    >
                      <CheckCircle size={16} />
                      受注する
                    </button>
                    <button
                      onClick={() => { setEditData(quote); setShowModal(true) }}
                      className="p-2 bg-app-bg rounded-lg text-gray-400 hover:text-white"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="p-2 bg-app-bg rounded-lg text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                {quote.project_id && (
                  <button
                    onClick={() => navigate(`/sbase/${quote.project_id}`)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1"
                  >
                    工事を見る
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 見積作成/編集モーダル */}
      {showModal && (
        <QuoteFormModal
          data={editData}
          onClose={() => { setShowModal(false); setEditData(null) }}
          onSave={handleSave}
        />
      )}
    </>
  )
}

// 見積作成/編集モーダル
function QuoteFormModal({ data, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    client_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
    items: [{ name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        title: data.title || '',
        client_name: data.client_name || '',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        valid_until: data.valid_until || '',
        notes: data.notes || '',
        items: data.items?.length > 0 ? data.items : [{ name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
      })
    }
  }, [data])

  const updateItem = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0
      const price = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(newItems[index].unit_price) || 0
      newItems[index].amount = Math.round(qty * price)
    }

    setForm({ ...form, items: newItems })
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
    })
  }

  const removeItem = (index) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const subtotal = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const taxAmount = Math.floor(subtotal * 0.1)
  const total = subtotal + taxAmount

  const handleSubmit = () => {
    if (!form.title) {
      alert('工事名を入力してください')
      return
    }
    onSave(form)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={data ? '見積書を編集' : '見積書を作成'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <Input
          label="工事名・件名 *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="例: ○○道路舗装工事"
        />

        <Input
          label="元請け・発注者"
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          placeholder="例: 福岡県"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="発行日"
            type="date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
          <Input
            label="有効期限"
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
          />
        </div>

        {/* 明細 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">明細</label>
            <button
              onClick={addItem}
              className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg"
            >
              + 行追加
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="bg-app-bg rounded-lg p-3 border border-app-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="品名・工種"
                    className="flex-1 px-2 py-1.5 bg-transparent border border-app-border rounded text-sm text-white"
                  />
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="数量"
                    className="px-2 py-1.5 bg-transparent border border-app-border rounded text-sm text-white text-right"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="単位"
                    className="px-2 py-1.5 bg-transparent border border-app-border rounded text-sm text-white text-center"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    placeholder="単価"
                    className="px-2 py-1.5 bg-transparent border border-app-border rounded text-sm text-white text-right"
                  />
                  <div className="px-2 py-1.5 bg-app-card rounded text-sm text-white text-right font-medium">
                    ¥{(item.amount || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 合計 */}
        <div className="bg-app-bg rounded-lg p-3 border border-app-border">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">小計</span>
            <span className="text-white">¥{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">消費税 (10%)</span>
            <span className="text-white">¥{taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-app-border">
            <span className="text-white">合計</span>
            <span className="text-orange-500">¥{total.toLocaleString()}</span>
          </div>
        </div>

        <Input
          label="備考"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="備考・特記事項"
        />
      </div>
    </Modal>
  )
}

// レポート表示
function ReportView({ projects, dashboard }) {
  const monthlyData = {
    sales: dashboard?.total_contract || projects.reduce((sum, p) => sum + p.contract_amount, 0),
    cost: dashboard?.total_cost || projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0),
    profit: dashboard?.total_profit || projects.reduce((sum, p) => sum + (p.contract_amount - (p.actual_cost || 0)), 0),
  }
  monthlyData.profitRate = monthlyData.sales > 0 ? ((monthlyData.profit / monthlyData.sales) * 100).toFixed(1) : 0

  return (
    <>
      <SectionTitle>📊 月次レポート - {new Date().getFullYear()}年{new Date().getMonth() + 1}月</SectionTitle>

      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">売上</span>
            <span className="font-bold">{formatMoneyFull(monthlyData.sales)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">原価</span>
            <span className="font-bold">{formatMoneyFull(monthlyData.cost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">粗利</span>
            <span className={`font-bold ${monthlyData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoneyFull(monthlyData.profit)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">粗利率</span>
            <span className={`font-bold ${monthlyData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {monthlyData.profitRate}%
            </span>
          </div>
        </div>
      </Card>

      <SectionTitle>📈 工事別利益</SectionTitle>
      {projects.map((project) => {
        const profit = project.contract_amount - (project.actual_cost || 0)
        const rate = project.contract_amount > 0 ? ((profit / project.contract_amount) * 100).toFixed(1) : 0
        return (
          <Card key={project.id} className="mb-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{project.name}</div>
                <div className="text-xs text-slate-400">{project.client}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMoney(profit)}
                </div>
                <div className="text-xs text-slate-400">{rate}%</div>
              </div>
            </div>
          </Card>
        )
      })}
    </>
  )
}

// ========================================
// 工事詳細ページ (ProjectDetailPage)
// ========================================
export function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  const [project, setProject] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [costs, setCosts] = useState([])
  const [estimates, setEstimates] = useState([])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ show: false, message: '' })

  // モーダル状態
  const [budgetModal, setBudgetModal] = useState({ open: false, data: null })
  const [costModal, setCostModal] = useState({ open: false, data: null })
  const [estimateModal, setEstimateModal] = useState({ open: false, data: null })

  const tabs = [
    { id: 'overview', label: '概要' },
    { id: 'budget', label: '予算' },
    { id: 'worktype', label: '工種' },
    { id: 'cost', label: '原価' },
    { id: 'estimate', label: '見積' },
    { id: 'progress', label: '出来高' },
  ]

  // 工種データ（ローカル管理）
  const [workTypes, setWorkTypes] = useState([])
  const [workTypeModal, setWorkTypeModal] = useState({ open: false, data: null })
  const [detailModal, setDetailModal] = useState({ open: false, workType: null })

  // 出来高データ
  const [progressData, setProgressData] = useState([])
  const [progressModal, setProgressModal] = useState({ open: false, data: null })

  // 工種データをAPIから読み込む
  const fetchWorkTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/work-types/`)
      if (res.ok) {
        const data = await res.json()
        setWorkTypes(data)
      }
    } catch (error) {
      console.error('Failed to fetch work types:', error)
    }
  }

  useEffect(() => {
    if (id) fetchWorkTypes()
  }, [id])

  // 工種を保存（API経由）
  const handleSaveWorkType = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      // PUT: /api/work-types/{id}, POST: /api/projects/{project_id}/work-types/
      const url = data.id
        ? `${API_BASE}/work-types/${data.id}`
        : `${API_BASE}/projects/${id}/work-types/`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          unit: data.unit || '式',
          quantity: data.quantity || 1,
          budget_unit_price: parseFloat(data.budget_unit_price) || 0,
          budget_amount: parseFloat(data.budget_amount) || 0,
          dimension: data.dimension || '',
          design_qty: parseFloat(data.design_qty) || 0,
          rate: parseFloat(data.rate) || 1,
          remarks: data.remarks || '',
          no: data.no || ''
        })
      })

      if (res.ok) {
        showToast(data.id ? '工種を更新しました' : '工種を追加しました')
        setWorkTypeModal({ open: false, data: null })
        await fetchWorkTypes()  // awaitで確実に待つ
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('API Error:', res.status, errorData)
        showToast('保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save work type:', error)
      showToast('エラーが発生しました')
    }
  }

  // 工種を削除（API経由）
  const handleDeleteWorkType = async (workTypeId) => {
    if (!confirm('この工種を削除しますか？関連する明細データも削除されます。')) return
    try {
      const res = await fetch(`${API_BASE}/work-types/${workTypeId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast('工種を削除しました')
        await fetchWorkTypes()  // awaitで確実に待つ
      } else {
        showToast('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete work type:', error)
      showToast('エラーが発生しました')
    }
  }

  // 明細を保存（API経由）
  const handleSaveDetails = async (workTypeId, details) => {
    try {
      // 各明細を保存
      for (const detail of details) {
        const isExisting = detail.id && !String(detail.id).startsWith('new_')
        const method = isExisting ? 'PUT' : 'POST'
        // PUT: /api/work-type-details/{id}, POST: /api/work-types/{work_type_id}/details/
        const url = isExisting
          ? `${API_BASE}/work-type-details/${detail.id}`
          : `${API_BASE}/work-types/${workTypeId}/details/`

        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: detail.name,
            unit: detail.unit || '式',
            budget_quantity: parseFloat(detail.budget_quantity || detail.quantity) || 0,
            budget_unit_price: parseFloat(detail.budget_unit_price || detail.unit_price) || 0,
            budget_amount: parseFloat(detail.budget_amount || detail.amount) || 0,
            cost_category: detail.cost_category || '材料費'
          })
        })
      }
      showToast('明細を保存しました')
      setDetailModal({ open: false, workType: null })
      await fetchWorkTypes()  // awaitで確実に待つ
    } catch (error) {
      console.error('Failed to save details:', error)
      showToast('明細の保存に失敗しました')
    }
  }

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    setLoading(true)
    try {
      const [projectRes, budgetRes, costRes, estimateRes, progressRes] = await Promise.all([
        fetch(`${API_BASE}/projects/${id}`),
        fetch(`${API_BASE}/budgets/project/${id}`),
        fetch(`${API_BASE}/costs/project/${id}`),
        fetch(`${API_BASE}/estimates/project/${id}`),
        fetch(`${API_BASE}/progress/project/${id}`)
      ])

      if (projectRes.ok) setProject(await projectRes.json())
      if (budgetRes.ok) setBudgets(await budgetRes.json())
      if (costRes.ok) setCosts(await costRes.json())
      if (estimateRes.ok) setEstimates(await estimateRes.json())
      if (progressRes.ok) setProgressData(await progressRes.json())
    } catch (error) {
      console.error('Failed to fetch project data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  // 見積書Excel出力
  const handleExportEstimate = async () => {
    if (!project) return
    try {
      const res = await fetch(`${API_BASE}/projects/${id}/export-estimate`, {
        method: 'POST'
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `見積書_${project.name}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        showToast('見積書をダウンロードしました')
      } else {
        alert('見積書の出力に失敗しました')
      }
    } catch (error) {
      console.error('Failed to export:', error)
      alert('見積書の出力に失敗しました')
    }
  }

  // 予算登録
  const handleSaveBudget = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/budgets/${data.id}` : `${API_BASE}/budgets/`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: parseInt(id) })
      })

      if (res.ok) {
        fetchProjectData()  // データを再読み込み
      }
    } catch (error) {
      console.error('Failed to save budget:', error)
    }
  }

  // 原価登録
  const handleSaveCost = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/costs/${data.id}` : `${API_BASE}/costs/`

      // 更新時はdateを除外（CostUpdateスキーマの制約）
      const payload = data.id
        ? { category: data.category, description: data.description, amount: data.amount, vendor: data.vendor, notes: data.notes }
        : { ...data, project_id: parseInt(id) }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast(data.id ? '原価を更新しました' : '原価を登録しました')
        setCostModal({ open: false, data: null })
        fetchProjectData()
      }
    } catch (error) {
      console.error('Failed to save cost:', error)
    }
  }

  // 見積登録
  const handleSaveEstimate = async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      const url = data.id ? `${API_BASE}/estimates/${data.id}` : `${API_BASE}/estimates/`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: parseInt(id) })
      })

      if (res.ok) {
        showToast(data.id ? '見積を更新しました' : '見積を登録しました')
        setEstimateModal({ open: false, data: null })
        fetchProjectData()
      }
    } catch (error) {
      console.error('Failed to save estimate:', error)
    }
  }

  // 削除処理
  const handleDelete = async (type, itemId) => {
    if (!confirm('削除しますか？')) return

    try {
      const res = await fetch(`${API_BASE}/${type}/${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchProjectData()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  // 出来高登録
  const handleSaveProgress = async (data) => {
    try {
      const res = await fetch(`${API_BASE}/progress/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, project_id: parseInt(id) })
      })

      if (res.ok) {
        showToast('出来高を登録しました（入金予定も自動作成）')
        setProgressModal({ open: false, data: null })
        fetchProjectData()
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // PDF出力（フロントエンドで生成）
  const handleDownloadPDF = (estimateId) => {
    const estimate = estimates.find(e => e.id === estimateId)
    console.log('Generating PDF for estimate:', estimate)

    if (!estimate) {
      showToast('見積データが見つかりません')
      return
    }

    try {
      // itemsが無い場合は空配列をセット
      const estimateWithItems = {
        ...estimate,
        items: estimate.items || []
      }
      const doc = generateEstimatePDF(estimateWithItems, project)
      doc.save(`見積書_${estimate.estimate_no || estimateId}.pdf`)
      showToast('PDFをダウンロードしました')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      console.error('Error details:', error.message, error.stack)
      showToast('PDF出力に失敗しました: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
        <Header title="工事詳細" icon="📊" gradient="from-orange-500 to-orange-600" onBack={() => navigate('/sbase')} />
        <div className="text-center py-12 text-slate-400">読み込み中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
        <Header title="工事詳細" icon="📊" gradient="from-orange-500 to-orange-600" onBack={() => navigate('/sbase')} />
        <Empty icon="❌" title="工事が見つかりません" />
      </div>
    )
  }

  // 費目別予算の合計（内訳）
  const totalBudgetBreakdown = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
  // 実行原価の合計
  const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

  // 新しい利益構造
  const orderAmount = project.order_amount || project.contract_amount || 0
  const salesProfit = project.sales_profit || 0
  const constructionBudget = orderAmount - salesProfit  // 工事予算
  const constructionProfit = constructionBudget - totalCost  // 工事利益
  const totalProfit = salesProfit + constructionProfit  // 合計利益
  const totalProfitRate = orderAmount > 0 ? ((totalProfit / orderAmount) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title={project.name}
        icon="📊"
        gradient="from-orange-500 to-orange-600"
        onBack={() => navigate('/sbase')}
      />

      {/* サマリー - 新しい利益構造 */}
      <motion.div
        className="mx-5 my-4 p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs opacity-80 mb-1">🏢 {project.client}</div>

        {/* 1段目: 受注金額 → 営業利益 → 工事予算 */}
        <div className="grid grid-cols-3 gap-2 mt-3 mb-2">
          <div className="text-center">
            <div className="text-lg font-bold">{formatMoney(orderAmount)}</div>
            <div className="text-[10px] opacity-70">受注金額</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-200">{formatMoney(salesProfit)}</div>
            <div className="text-[10px] opacity-70">営業利益</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatMoney(constructionBudget)}</div>
            <div className="text-[10px] opacity-70">工事予算</div>
          </div>
        </div>

        {/* 2段目: 実行原価 → 工事利益 → 合計利益 */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
          <div className="text-center">
            <div className="text-lg font-bold">{formatMoney(totalCost)}</div>
            <div className="text-[10px] opacity-70">実行原価</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${constructionProfit >= 0 ? 'text-sky-200' : 'text-red-300'}`}>
              {formatMoney(constructionProfit)}
            </div>
            <div className="text-[10px] opacity-70">工事利益</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatMoney(totalProfit)}
            </div>
            <div className="text-[10px] opacity-70">合計利益({totalProfitRate}%)</div>
          </div>
        </div>
      </motion.div>

      {/* 見積書出力ボタン */}
      <div className="px-5 mb-4">
        <button
          onClick={handleExportEstimate}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <FileSpreadsheet size={18} />見積書Excel出力
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="px-5">
        {/* 概要タブ */}
        {activeTab === 'overview' && (
          <OverviewTab
            project={project}
            budgets={budgets}
            costs={costs}
            constructionBudget={constructionBudget}
            salesProfit={salesProfit}
            constructionProfit={constructionProfit}
            totalProfit={totalProfit}
          />
        )}

        {/* 予算タブ */}
        {activeTab === 'budget' && (
          <BudgetTab
            budgets={budgets}
            constructionBudget={constructionBudget}
            totalCost={totalCost}
            projectId={id}
            onSaveBudget={(data) => handleSaveBudget({ ...data, project_id: parseInt(id) })}
            onEdit={(data) => handleSaveBudget(data)}
            onDelete={(budgetId) => handleDelete('budgets', budgetId)}
          />
        )}

        {/* 工種タブ（60社形式） */}
        {activeTab === 'worktype' && (
          <WorkTypeTab
            workTypes={workTypes}
            estimates={estimates}
            onAdd={() => setWorkTypeModal({ open: true, data: null })}
            onEdit={(w) => setWorkTypeModal({ open: true, data: w })}
            onDelete={handleDeleteWorkType}
            onViewDetails={(w) => setDetailModal({ open: true, workType: w })}
            onRefresh={fetchWorkTypes}
            projectId={id}
          />
        )}

        {/* 原価タブ */}
        {activeTab === 'cost' && (
          <CostTab
            costs={costs}
            onAdd={() => setCostModal({ open: true, data: null })}
            onEdit={(c) => setCostModal({ open: true, data: c })}
            onDelete={(id) => handleDelete('costs', id)}
          />
        )}

        {/* 見積タブ */}
        {activeTab === 'estimate' && (
          <EstimateTab
            estimates={estimates}
            onAdd={() => setEstimateModal({ open: true, data: null })}
            onEdit={(e) => setEstimateModal({ open: true, data: e })}
            onDelete={(id) => handleDelete('estimates', id)}
            onDownloadPDF={handleDownloadPDF}
          />
        )}

        {/* 出来高タブ */}
        {activeTab === 'progress' && (
          <ProgressTab
            progressData={progressData}
            project={project}
            onAdd={() => setProgressModal({ open: true, data: null })}
            onEdit={(p) => setProgressModal({ open: true, data: p })}
            onDelete={(id) => handleDelete('progress', id)}
          />
        )}
      </div>

      {/* モーダル */}
      <WorkTypeModal
        isOpen={workTypeModal.open}
        data={workTypeModal.data}
        onClose={() => setWorkTypeModal({ open: false, data: null })}
        onSave={handleSaveWorkType}
      />

      <WorkTypeDetailModal
        isOpen={detailModal.open}
        workType={detailModal.workType}
        onClose={() => setDetailModal({ open: false, workType: null })}
        onSave={(details) => handleSaveDetails(detailModal.workType?.id, details)}
      />

      <CostModal
        isOpen={costModal.open}
        data={costModal.data}
        onClose={() => setCostModal({ open: false, data: null })}
        onSave={handleSaveCost}
      />

      <EstimateModal
        isOpen={estimateModal.open}
        data={estimateModal.data}
        onClose={() => setEstimateModal({ open: false, data: null })}
        onSave={handleSaveEstimate}
      />

      <ProgressModal
        isOpen={progressModal.open}
        data={progressModal.data}
        project={project}
        onClose={() => setProgressModal({ open: false, data: null })}
        onSave={handleSaveProgress}
      />

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// 概要タブ
function OverviewTab({ project, budgets, costs, constructionBudget, salesProfit, constructionProfit, totalProfit }) {
  const categories = ['労務費', '外注費', '材料費', '機械費', '経費', 'その他']
  const orderAmount = project.order_amount || project.contract_amount || 0
  const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

  const budgetByCategory = categories.map(cat => ({
    category: cat,
    budget: budgets.filter(b => b.category === cat).reduce((sum, b) => sum + (b.amount || 0), 0),
    cost: costs.filter(c => c.category === cat).reduce((sum, c) => sum + (c.amount || 0), 0),
  }))

  return (
    <>
      <SectionTitle>📋 工事情報</SectionTitle>
      <Card className="mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">工事名</span>
            <span>{project.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">発注者</span>
            <span>{project.client}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">工期</span>
            <span>{project.start_date} 〜 {project.end_date}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">ステータス</span>
            <Badge variant={
              project.status === '施工中' ? 'success' :
              project.status === '受注確定' ? 'success' :
              project.status === '見積中' ? 'warning' :
              project.status === '失注' ? 'danger' :
              'default'
            }>
              {project.status || '未設定'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 利益構造サマリー */}
      <SectionTitle>💰 利益構造</SectionTitle>
      <Card className="mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">受注金額</span>
            <span className="font-bold">{formatMoneyFull(orderAmount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">営業利益</span>
            <span className="font-bold text-amber-400">{formatMoneyFull(salesProfit)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">工事予算</span>
            <span className="font-bold">{formatMoneyFull(constructionBudget)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">実行原価</span>
            <span className="font-bold">{formatMoneyFull(totalCost)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-app-border">
            <span className="text-slate-400">工事利益</span>
            <span className={`font-bold ${constructionProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
              {formatMoneyFull(constructionProfit)}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">合計利益</span>
            <span className={`font-bold text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoneyFull(totalProfit)}
            </span>
          </div>
        </div>
      </Card>

      <SectionTitle>📊 カテゴリ別予実</SectionTitle>
      {budgetByCategory.map(({ category, budget, cost }) => {
        const diff = budget - cost
        const rate = budget > 0 ? ((cost / budget) * 100).toFixed(0) : 0
        return (
          <Card key={category} className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{category}</span>
              <span className={`text-xs ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {diff >= 0 ? '+' : ''}{formatMoney(diff)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>予算: {formatMoney(budget)}</span>
              <span>原価: {formatMoney(cost)} ({rate}%)</span>
            </div>
            <ProgressBar
              value={Math.min(cost, budget)}
              max={budget || 1}
              color={cost > budget ? 'bg-red-500' : 'bg-emerald-500'}
              size="sm"
            />
          </Card>
        )
      })}
    </>
  )
}

// 工種タブ（60社形式）
function WorkTypeTab({ workTypes, estimates, onAdd, onEdit, onDelete, onViewDetails, onRefresh, projectId }) {
  const [pasteMode, setPasteMode] = useState(false)
  const [importModal, setImportModal] = useState(false)

  // 見積書から工種に取り込む（API経由）
  const handleImportFromEstimate = async (estimate) => {
    if (!estimate?.items?.length) return

    try {
      for (const item of estimate.items) {
        await fetch(`${API_BASE}/projects/${projectId}/work-types/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name || '',
            spec: item.specification || '',
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit || '式',
            budget_unit_price: parseFloat(item.unit_price) || 0,
            budget_amount: parseFloat(item.amount) || 0,
          })
        })
      }
      onRefresh()
      setImportModal(false)
    } catch (error) {
      console.error('Failed to import work types:', error)
    }
  }

  // 合計計算
  const totalBudget = workTypes.reduce((sum, w) => sum + (parseFloat(w.budget_amount) || 0), 0)
  const totalEstimate = workTypes.reduce((sum, w) => {
    const budgetAmt = parseFloat(w.budget_amount) || 0
    const rate = parseFloat(w.rate) || 1
    return sum + (budgetAmt * rate)
  }, 0)

  // Excel貼り付け処理（API経由）
  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData
    const pastedText = clipboardData.getData('text')
    if (!pastedText) return

    const rows = pastedText.trim().split('\n')
    e.preventDefault()

    try {
      for (const row of rows) {
        const cols = row.includes('\t') ? row.split('\t') : row.split(',')
        if (cols.length < 2) continue

        await fetch(`${API_BASE}/projects/${projectId}/work-types/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cols[1]?.trim() || '',
            spec: cols[2]?.trim() || '',
            quantity: parseFloat(cols[3]?.replace(/,/g, '')) || 1,
            unit: cols[4]?.trim() || '式',
            budget_unit_price: parseFloat(cols[5]?.replace(/,/g, '')) || 0,
            budget_amount: parseFloat(cols[6]?.replace(/,/g, '')) || 0,
          })
        })
      }
      onRefresh()
      setPasteMode(false)
    } catch (error) {
      console.error('Failed to paste work types:', error)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🏗️ 工種一覧（60社形式）</SectionTitle>
        <div className="flex gap-2">
          {estimates?.length > 0 && (
            <button
              onClick={() => setImportModal(true)}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"
            >
              <Download size={14} />見積書から取込
            </button>
          )}
          <button
            onClick={() => setPasteMode(!pasteMode)}
            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg ${pasteMode ? 'bg-amber-500/20 text-amber-400' : 'bg-app-card text-amber-400'}`}
          >
            <FileText size={14} />Excel
          </button>
          <Button size="sm" onClick={onAdd}>
            <Plus size={16} className="inline mr-1" />追加
          </Button>
        </div>
      </div>

      {/* 見積書選択モーダル */}
      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setImportModal(false)}>
          <div className="bg-app-card rounded-xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">見積書から工種を取り込み</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {estimates.map(est => (
                <div
                  key={est.id}
                  className="p-3 bg-app-bg rounded-lg cursor-pointer hover:bg-app-card/50 transition"
                  onClick={() => handleImportFromEstimate(est)}
                >
                  <div className="font-medium">{est.title || est.estimate_no}</div>
                  <div className="text-xs text-slate-400">
                    {est.items?.length || 0}件の項目 ・ {formatMoneyFull(est.total || 0)}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setImportModal(false)}
              className="mt-4 w-full py-2 bg-slate-600 rounded-lg text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Excel貼り付けエリア */}
      {pasteMode && (
        <Card className="mb-4 bg-amber-500/10 border-2 border-dashed border-amber-500/30">
          <div className="text-sm text-amber-400 mb-2">Excelからコピーした工種データを貼り付け</div>
          <div className="text-xs text-slate-400 mb-2">
            列順: No / 工種 / 形状寸法 / 設計数量 / 単位 / 予算単価 / 予算金額 / 掛率 / 見積単価 / 見積金額 / 摘要
          </div>
          <textarea
            placeholder="ここにExcelからコピーしたデータを貼り付け"
            className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm resize-none"
            onPaste={handlePaste}
          />
        </Card>
      )}

      {/* 合計サマリー */}
      <Card className="mb-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-400">予算金額合計</div>
            <div className="text-lg font-bold">{formatMoneyFull(totalBudget)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">見積金額合計</div>
            <div className="text-lg font-bold text-emerald-400">{formatMoneyFull(totalEstimate)}</div>
          </div>
        </div>
      </Card>

      {workTypes.length === 0 ? (
        <Empty icon="🏗️" title="工種データがありません" subtitle="工種を追加してください" />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="bg-app-card text-slate-400">
                <th className="px-2 py-2 text-left w-12">No</th>
                <th className="px-2 py-2 text-left">工種</th>
                <th className="px-2 py-2 text-left w-20">形状寸法</th>
                <th className="px-2 py-2 text-right w-16">設計数量</th>
                <th className="px-2 py-2 text-center w-12">単位</th>
                <th className="px-2 py-2 text-right w-20">予算単価</th>
                <th className="px-2 py-2 text-right w-24">予算金額</th>
                <th className="px-2 py-2 text-center w-14">掛率</th>
                <th className="px-2 py-2 text-right w-20">見積単価</th>
                <th className="px-2 py-2 text-right w-24">見積金額</th>
                <th className="px-2 py-2 text-left w-20">摘要</th>
                <th className="px-2 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {workTypes.map((wt, idx) => {
                const budgetAmt = parseFloat(wt.budget_amount) || 0
                const budgetUnitPrice = parseFloat(wt.budget_unit_price) || 0
                const rate = parseFloat(wt.rate) || 1
                const estimateUnitPrice = Math.round(budgetUnitPrice * rate)
                const estimateAmount = Math.round(budgetAmt * rate)

                return (
                  <tr
                    key={wt.id}
                    className="border-b border-app-border hover:bg-app-card/50 cursor-pointer"
                    onClick={() => onViewDetails(wt)}
                  >
                    <td className="px-2 py-2.5 text-slate-400">{wt.no || idx + 1}</td>
                    <td className="px-2 py-2.5 font-medium text-orange-500">{wt.name}</td>
                    <td className="px-2 py-2.5 text-slate-400">{wt.dimension}</td>
                    <td className="px-2 py-2.5 text-right">{wt.design_qty?.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center">{wt.unit}</td>
                    <td className="px-2 py-2.5 text-right">{budgetUnitPrice.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-right font-medium">{budgetAmt.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center text-amber-400">{rate}</td>
                    <td className="px-2 py-2.5 text-right">{estimateUnitPrice.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-right font-medium text-emerald-400">{estimateAmount.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-slate-400 truncate">{wt.remarks}</td>
                    <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => onEdit(wt)} className="p-1 text-orange-500 hover:bg-orange-500/20 rounded">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => onDelete(wt.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// 工種追加・編集モーダル
function WorkTypeModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    no: '',
    name: '',
    dimension: '',
    design_qty: '',
    unit: '式',
    budget_unit_price: '',
    budget_amount: '',
    rate: '1',
    remarks: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        no: data.no || '',
        name: data.name || '',
        dimension: data.dimension || '',
        design_qty: data.design_qty || '',
        unit: data.unit || '式',
        budget_unit_price: data.budget_unit_price || '',
        budget_amount: data.budget_amount || '',
        rate: data.rate || '1',
        remarks: data.remarks || '',
        details: data.details || []
      })
    } else {
      setForm({
        no: '',
        name: '',
        dimension: '',
        design_qty: '',
        unit: '式',
        budget_unit_price: '',
        budget_amount: '',
        rate: '1',
        remarks: ''
      })
    }
  }, [data, isOpen])

  // 予算金額を自動計算
  useEffect(() => {
    const qty = parseFloat(form.design_qty) || 0
    const price = parseFloat(form.budget_unit_price) || 0
    if (qty > 0 && price > 0) {
      setForm(f => ({ ...f, budget_amount: qty * price }))
    }
  }, [form.design_qty, form.budget_unit_price])

  const handleSubmit = () => {
    if (!form.name) {
      alert('工種名を入力してください')
      return
    }
    onSave(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '工種を編集' : '工種を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="No"
          value={form.no}
          onChange={(e) => setForm({ ...form, no: e.target.value })}
          placeholder="1"
        />
        <Input
          label="工種名 *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="例：アスファルト舗装工"
        />
      </div>
      <Input
        label="形状寸法"
        value={form.dimension}
        onChange={(e) => setForm({ ...form, dimension: e.target.value })}
        placeholder="例：t=50mm"
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="設計数量"
          type="number"
          value={form.design_qty}
          onChange={(e) => setForm({ ...form, design_qty: e.target.value })}
          placeholder="100"
        />
        <Input
          label="単位"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="m2"
        />
        <Input
          label="予算単価"
          type="number"
          value={form.budget_unit_price}
          onChange={(e) => setForm({ ...form, budget_unit_price: e.target.value })}
          placeholder="5000"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="予算金額"
          type="number"
          value={form.budget_amount}
          onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
          placeholder="自動計算"
        />
        <Input
          label="掛率"
          type="number"
          step="0.01"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder="1.0"
        />
      </div>
      <Input
        label="摘要"
        value={form.remarks}
        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
        placeholder="備考"
      />
    </Modal>
  )
}

// 工種明細モーダル（60社形式 明細レベル）
function WorkTypeDetailModal({ isOpen, workType, onClose, onSave }) {
  const [details, setDetails] = useState([])
  const [pasteMode, setPasteMode] = useState(false)

  const emptyDetail = {
    seq: '',
    item_name: '',
    specification: '',
    formula: '',
    expense_category: '',
    budget_qty: '',
    unit: '式',
    budget_unit_price: '',
    budget_amount: ''
  }

  useEffect(() => {
    if (workType?.details?.length > 0) {
      setDetails(workType.details)
    } else {
      setDetails([{ ...emptyDetail, seq: '1' }])
    }
  }, [workType, isOpen])

  // 明細の金額を自動計算
  const updateDetail = (index, field, value) => {
    const newDetails = [...details]
    newDetails[index] = { ...newDetails[index], [field]: value }

    if (field === 'budget_qty' || field === 'budget_unit_price') {
      const qty = parseFloat(field === 'budget_qty' ? value : newDetails[index].budget_qty) || 0
      const price = parseFloat(field === 'budget_unit_price' ? value : newDetails[index].budget_unit_price) || 0
      newDetails[index].budget_amount = qty * price
    }

    setDetails(newDetails)
  }

  const addDetail = () => {
    setDetails([...details, { ...emptyDetail, seq: String(details.length + 1) }])
  }

  const removeDetail = (index) => {
    if (details.length <= 1) return
    setDetails(details.filter((_, i) => i !== index))
  }

  // Excel貼り付け処理
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData
    const pastedText = clipboardData.getData('text')
    if (!pastedText) return

    const rows = pastedText.trim().split('\n')
    const newDetails = []

    rows.forEach((row, index) => {
      const cols = row.includes('\t') ? row.split('\t') : row.split(',')
      if (cols.length < 2) return

      newDetails.push({
        seq: cols[0]?.trim() || String(index + 1),
        item_name: cols[1]?.trim() || '',
        specification: cols[2]?.trim() || '',
        formula: cols[3]?.trim() || '',
        expense_category: cols[4]?.trim() || '',
        budget_qty: parseFloat(cols[5]?.replace(/,/g, '')) || 0,
        unit: cols[6]?.trim() || '式',
        budget_unit_price: parseFloat(cols[7]?.replace(/,/g, '')) || 0,
        budget_amount: parseFloat(cols[8]?.replace(/,/g, '')) || 0
      })
    })

    if (newDetails.length > 0) {
      setDetails(newDetails)
      setPasteMode(false)
      e.preventDefault()
    }
  }

  const totalAmount = details.reduce((sum, d) => sum + (parseFloat(d.budget_amount) || 0), 0)

  if (!workType) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`明細: ${workType.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={() => onSave(details)} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Excel貼り付けボタン */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            明細合計: <span className="font-bold text-white">{formatMoneyFull(totalAmount)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPasteMode(!pasteMode)}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${pasteMode ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400'}`}
            >
              <FileText size={14} />Excel貼付
            </button>
            <button onClick={addDetail} className="text-xs text-orange-500 flex items-center gap-1">
              <Plus size={14} />行追加
            </button>
          </div>
        </div>

        {/* Excel貼り付けエリア */}
        {pasteMode && (
          <div className="p-3 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-lg">
            <div className="text-xs text-amber-400 mb-1">列順: SEQ / 品名 / 規格 / 計算式 / 費目 / 予算数量 / 単位 / 予算単価 / 予算金額</div>
            <textarea
              placeholder="Excelからコピーしたデータを貼り付け"
              className="w-full h-20 px-2 py-1 bg-slate-800 border border-app-border rounded text-white text-xs resize-none"
              onPaste={handlePaste}
            />
          </div>
        )}

        {/* 明細テーブル */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr className="bg-app-card text-slate-400">
                <th className="px-1 py-1.5 w-10">SEQ</th>
                <th className="px-1 py-1.5 text-left">品名</th>
                <th className="px-1 py-1.5 text-left w-20">規格</th>
                <th className="px-1 py-1.5 text-left w-16">計算式</th>
                <th className="px-1 py-1.5 w-14">費目</th>
                <th className="px-1 py-1.5 text-right w-14">数量</th>
                <th className="px-1 py-1.5 w-10">単位</th>
                <th className="px-1 py-1.5 text-right w-16">単価</th>
                <th className="px-1 py-1.5 text-right w-20">金額</th>
                <th className="px-1 py-1.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <tr key={index} className="border-b border-app-border">
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.seq}
                      onChange={(e) => updateDetail(index, 'seq', e.target.value)}
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs text-center"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.item_name}
                      onChange={(e) => updateDetail(index, 'item_name', e.target.value)}
                      placeholder="品名"
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.specification}
                      onChange={(e) => updateDetail(index, 'specification', e.target.value)}
                      placeholder="規格"
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.formula}
                      onChange={(e) => updateDetail(index, 'formula', e.target.value)}
                      placeholder="式"
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.expense_category}
                      onChange={(e) => updateDetail(index, 'expense_category', e.target.value)}
                      placeholder="費目"
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs text-center"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={detail.budget_qty}
                      onChange={(e) => updateDetail(index, 'budget_qty', e.target.value)}
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs text-right"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={detail.unit}
                      onChange={(e) => updateDetail(index, 'unit', e.target.value)}
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs text-center"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={detail.budget_unit_price}
                      onChange={(e) => updateDetail(index, 'budget_unit_price', e.target.value)}
                      className="w-full px-1 py-1 bg-slate-800 border border-app-border rounded text-xs text-right"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <div className="px-1 py-1 bg-app-card/50 rounded text-xs text-right font-medium">
                      {(parseFloat(detail.budget_amount) || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    {details.length > 1 && (
                      <button onClick={() => removeDetail(index)} className="text-red-400 p-0.5">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

// 予算タブ
function BudgetTab({ budgets, constructionBudget, totalCost, onEdit, onDelete, onSaveBudget, projectId }) {
  const categories = ['材料費', '外注費', '労務費', '機械費', '経費', 'その他']

  // 各カテゴリの予算を取得
  const getBudgetByCategory = (category) => {
    return budgets.find(b => b.category === category) || null
  }

  // 各カテゴリの予算金額を取得
  const getAmountByCategory = (category) => {
    const budget = getBudgetByCategory(category)
    return budget ? budget.amount : 0
  }

  const totalBreakdown = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const remainingBudget = constructionBudget - totalBreakdown
  const constructionProfit = constructionBudget - totalCost

  // 予算を保存
  const handleSaveBudget = async (category, amount) => {
    const existingBudget = getBudgetByCategory(category)
    const numAmount = parseFloat(amount) || 0

    if (numAmount === 0 && existingBudget) {
      // 金額が0なら削除
      onDelete(existingBudget.id)
    } else if (numAmount > 0) {
      // 保存または更新
      if (existingBudget) {
        onEdit({ ...existingBudget, amount: numAmount })
      } else {
        onSaveBudget({ category, amount: numAmount })
      }
    }
  }

  return (
    <>
      <SectionTitle>💰 費目別予算</SectionTitle>

      {/* 工事予算サマリー */}
      <Card className={`mb-4 ${remainingBudget < 0 ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50' : 'bg-gradient-to-r from-orange-500/20 to-orange-600/20'}`}>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">工事予算（受注額-営業利益）</span>
            <span className="text-xl font-bold">{formatMoneyFull(constructionBudget)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-app-border">
            <span className="text-sm">費目別予算 合計</span>
            <span className={`font-bold ${remainingBudget < 0 ? 'text-red-400' : ''}`}>{formatMoneyFull(totalBreakdown)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">残り（未配分）</span>
            <span className={`font-bold ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoneyFull(remainingBudget)}
            </span>
          </div>
        </div>
        {/* 予算超過警告 */}
        {remainingBudget < 0 && (
          <div className="mt-3 pt-3 border-t border-red-500/30">
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium">予算オーバー！工事予算を{formatMoneyFull(Math.abs(remainingBudget))}超えています</span>
            </div>
          </div>
        )}
      </Card>

      {/* 費目別入力フォーム */}
      <Card className="mb-4">
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryBudgetInput
              key={category}
              category={category}
              amount={getAmountByCategory(category)}
              onSave={(amount) => handleSaveBudget(category, amount)}
            />
          ))}
        </div>
      </Card>

      {/* 実行原価との比較 */}
      <Card className="mb-4 bg-gradient-to-r from-sky-500/10 to-sky-600/10 border-sky-500/30">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">実行原価</span>
            <span className="font-bold">{formatMoneyFull(totalCost)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-app-border">
            <span className="text-sm">工事利益（工事予算-実行原価）</span>
            <span className={`text-lg font-bold ${constructionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoneyFull(constructionProfit)}
            </span>
          </div>
        </div>
      </Card>
    </>
  )
}

// 費目別予算入力コンポーネント
function CategoryBudgetInput({ category, amount, onSave }) {
  const [value, setValue] = useState(amount || '')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setValue(amount || '')
  }, [amount])

  const handleBlur = () => {
    setIsEditing(false)
    const numValue = parseFloat(value) || 0
    if (numValue !== (amount || 0)) {
      onSave(numValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  const categoryIcons = {
    '材料費': '🧱',
    '外注費': '🏗️',
    '労務費': '👷',
    '機械費': '🚜',
    '経費': '📋',
    'その他': '📦'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 flex items-center gap-1.5">
        <span className="text-sm">{categoryIcons[category]}</span>
        <span className="text-sm font-medium">{category}</span>
      </div>
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className={`w-full pl-7 pr-3 py-2 rounded-lg text-right text-sm font-medium
            ${isEditing
              ? 'bg-app-bg border-2 border-orange-500 text-white'
              : 'bg-app-bg border border-app-border text-white'
            }`}
        />
      </div>
    </div>
  )
}

// 原価タブ
function CostTab({ costs, onAdd, onEdit, onDelete }) {
  const total = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>📉 原価一覧</SectionTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      <Card className="mb-4 bg-gradient-to-r from-red-800/30 to-red-600/30">
        <div className="flex justify-between items-center">
          <span className="text-sm">原価合計</span>
          <span className="text-xl font-bold">{formatMoneyFull(total)}</span>
        </div>
      </Card>

      {costs.length === 0 ? (
        <Empty icon="📉" title="原価データがありません" subtitle="原価を追加してください" />
      ) : (
        costs.map((cost) => (
          <Card key={cost.id} className="mb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm font-medium">{cost.description || cost.category}</div>
                <div className="text-xs text-slate-400">
                  {cost.category} | {cost.date}
                </div>
                {cost.vendor && <div className="text-xs text-slate-500">{cost.vendor}</div>}
              </div>
              <div className="text-right">
                <div className="font-bold">{formatMoneyFull(cost.amount)}</div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => onEdit(cost)} className="text-orange-500">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(cost.id)} className="text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </>
  )
}

// 見積タブ
function EstimateTab({ estimates, onAdd, onEdit, onDelete, onDownloadPDF }) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>📄 見積一覧</SectionTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {estimates.length === 0 ? (
        <Empty icon="📄" title="見積データがありません" subtitle="見積を追加してください" />
      ) : (
        estimates.map((estimate) => (
          <Card key={estimate.id} className="mb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium">{estimate.title || `見積 #${estimate.id}`}</div>
                <div className="text-xs text-slate-400">
                  {estimate.estimate_no && `${estimate.estimate_no} | `}
                  {estimate.issue_date || estimate.created_at?.split('T')[0]}
                </div>
                {estimate.client_name && (
                  <div className="text-xs text-slate-500 mt-1">宛先: {estimate.client_name}</div>
                )}
              </div>
            </div>

            <div className="bg-app-bg rounded-lg p-3 mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">小計</span>
                <span>{formatMoneyFull(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">消費税</span>
                <span>{formatMoneyFull(estimate.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-app-border pt-1">
                <span>合計</span>
                <span className="text-orange-500">{formatMoneyFull(estimate.total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => onDownloadPDF(estimate.id)}>
                <Download size={14} className="inline mr-1" />PDF出力
              </Button>
              <button onClick={() => onEdit(estimate)} className="p-2 bg-app-bg rounded-lg text-orange-500">
                <Edit3 size={16} />
              </button>
              <button onClick={() => onDelete(estimate.id)} className="p-2 bg-app-bg rounded-lg text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))
      )}
    </>
  )
}

// ========================================
// モーダルコンポーネント
// ========================================

// 予算モーダル
function BudgetModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    category: '',
    work_type_name: '',
    amount: '',
    notes: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        category: data.category || '',
        work_type_name: data.work_type_name || '',
        amount: data.amount || '',
        notes: data.notes || ''
      })
    } else {
      setForm({ category: '', work_type_name: '', amount: '', notes: '' })
    }
  }, [data, isOpen])

  const categoryOptions = [
    { value: '労務費', label: '労務費' },
    { value: '外注費', label: '外注費' },
    { value: '材料費', label: '材料費' },
    { value: '機械費', label: '機械費' },
    { value: '経費', label: '経費' },
    { value: 'その他', label: 'その他' },
  ]

  const handleSubmit = () => {
    if (!form.category || !form.amount) {
      alert('必須項目を入力してください')
      return
    }
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '予算を編集' : '予算を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Select
        label="カテゴリ *"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        options={categoryOptions}
        placeholder="選択してください"
      />
      <Input
        label="項目名"
        value={form.work_type_name}
        onChange={(e) => setForm({ ...form, work_type_name: e.target.value })}
        placeholder="例：作業員人件費"
      />
      <Input
        label="金額 *"
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        placeholder="例：1000000"
      />
      <Input
        label="備考"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="メモ"
      />
    </Modal>
  )
}

// 原価モーダル
function CostModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        category: data.category || '',
        description: data.description || '',
        amount: data.amount || '',
        vendor: data.vendor || '',
        date: data.date || new Date().toISOString().split('T')[0],
        notes: data.notes || ''
      })
    } else {
      setForm({
        category: '',
        description: '',
        amount: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
    }
  }, [data, isOpen])

  const categoryOptions = [
    { value: '労務費', label: '労務費' },
    { value: '外注費', label: '外注費' },
    { value: '材料費', label: '材料費' },
    { value: '機械費', label: '機械費' },
    { value: '経費', label: '経費' },
    { value: 'その他', label: 'その他' },
  ]

  const handleSubmit = () => {
    if (!form.category || !form.amount || !form.date) {
      alert('必須項目を入力してください')
      return
    }
    onSave({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '原価を編集' : '原価を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Select
        label="カテゴリ *"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        options={categoryOptions}
        placeholder="選択してください"
      />
      <Input
        label="内容"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="例：アスファルト合材"
      />
      <Input
        label="金額 *"
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        placeholder="例：500000"
      />
      <Input
        label="取引先"
        value={form.vendor}
        onChange={(e) => setForm({ ...form, vendor: e.target.value })}
        placeholder="例：〇〇建材"
      />
      <DatePickerInput
        label="日付 *"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        placeholder="日付を選択"
      />
      <Input
        label="備考"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="メモ"
      />
    </Modal>
  )
}

// 見積モーダル
function EstimateModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    estimate_no: '',
    title: '',
    client_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
    items: []
  })
  const [pasteMode, setPasteMode] = useState(false)

  const emptyItem = { name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        estimate_no: data.estimate_no || '',
        title: data.title || '',
        client_name: data.client_name || '',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        valid_until: data.valid_until || '',
        notes: data.notes || '',
        items: data.items?.length > 0 ? data.items : [{ ...emptyItem }]
      })
    } else {
      // 新規作成時のデフォルト雛形
      setForm({
        estimate_no: `EST-${Date.now().toString().slice(-6)}`,
        title: '',
        client_name: '',
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        notes: '',
        items: [
          { name: '舗装工事', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 },
        ]
      })
    }
  }, [data, isOpen])

  // Excel貼り付け処理
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData
    const pastedText = clipboardData.getData('text')

    if (!pastedText) return

    // タブ区切りまたはカンマ区切りで行を分割
    const rows = pastedText.trim().split('\n')
    const newItems = []

    for (const row of rows) {
      // タブまたはカンマで列を分割
      const cols = row.includes('\t') ? row.split('\t') : row.split(',')
      if (cols.length < 1 || !cols[0].trim()) continue

      // 列の解析（品名, 規格, 数量, 単位, 単価, 金額）
      let name = '', specification = '', quantity = 1, unit = '式', unit_price = 0, amount = 0

      cols.forEach((col, i) => {
        const val = col.trim()
        if (!val) return

        // 数値判定
        const numVal = parseFloat(val.replace(/,/g, ''))

        if (i === 0) {
          // 最初の列は品名
          name = val
        } else if (!isNaN(numVal)) {
          // 数値の場合
          if (quantity === 1 && numVal > 0 && numVal < 100000) {
            quantity = numVal
          } else if (unit_price === 0 && numVal >= 100) {
            unit_price = numVal
          } else if (amount === 0 && numVal >= quantity * 100) {
            amount = numVal
          }
        } else if (['式', 'm2', 'm3', 'm', '㎡', '㎥', 't', 'kg', '台', '日', '人工', '本', '個', 'L', '往復'].includes(val)) {
          unit = val
        } else if (!specification && val.length > 0) {
          specification = val
        }
      })

      // 金額が設定されていなければ計算
      if (amount === 0 && quantity > 0 && unit_price > 0) {
        amount = quantity * unit_price
      }

      if (name) {
        newItems.push({ name, specification, quantity, unit, unit_price, amount })
      }
    }

    if (newItems.length > 0) {
      setForm({ ...form, items: newItems })
      setPasteMode(false)
      e.preventDefault()
    }
  }

  // 明細行の更新
  const updateItem = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // 数量×単価で金額を自動計算
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0
      const price = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(newItems[index].unit_price) || 0
      newItems[index].amount = qty * price
    }

    setForm({ ...form, items: newItems })
  }

  // 明細行の追加
  const addItem = () => {
    setForm({ ...form, items: [...form.items, { ...emptyItem }] })
  }

  // 明細行の削除
  const removeItem = (index) => {
    if (form.items.length <= 1) return
    const newItems = form.items.filter((_, i) => i !== index)
    setForm({ ...form, items: newItems })
  }

  // 小計・税額・合計の計算
  const subtotal = form.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const taxRate = 0.1
  const taxAmount = Math.floor(subtotal * taxRate)
  const total = subtotal + taxAmount

  const handleSubmit = () => {
    if (!form.title) {
      alert('見積タイトルを入力してください')
      return
    }
    if (form.items.some(item => !item.name)) {
      alert('明細の品名を入力してください')
      return
    }

    onSave({
      ...form,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      items: form.items.map((item, i) => ({
        ...item,
        sort_order: i,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        amount: parseFloat(item.amount) || 0
      }))
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '見積を編集' : '見積を作成'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 基本情報 */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="見積番号"
            value={form.estimate_no}
            onChange={(e) => setForm({ ...form, estimate_no: e.target.value })}
            placeholder="EST-001"
          />
          <Input
            label="タイトル *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例：舗装工事見積"
          />
        </div>

        <Input
          label="宛先"
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          placeholder="例：〇〇建設株式会社 御中"
        />

        <div className="grid grid-cols-2 gap-3">
          <DatePickerInput
            label="発行日"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
          <DatePickerInput
            label="有効期限"
            value={form.valid_until}
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
          />
        </div>

        {/* 明細行 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-400">明細</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPasteMode(!pasteMode)}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${pasteMode ? 'bg-amber-500/20 text-amber-400' : 'text-amber-400'}`}
              >
                <FileText size={14} />Excel貼付
              </button>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-orange-500 flex items-center gap-1"
              >
                <Plus size={14} />行を追加
              </button>
            </div>
          </div>

          {/* Excel貼り付けエリア */}
          {pasteMode && (
            <div className="mb-3 p-4 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-lg">
              <div className="text-sm text-amber-400 mb-2">Excelからコピーした明細をここに貼り付けてください</div>
              <div className="text-xs text-slate-400 mb-2">
                列順: 品名, 規格, 数量, 単位, 単価, 金額
              </div>
              <textarea
                placeholder="ここにExcelからコピーしたデータを貼り付け（Ctrl+V / Cmd+V）"
                className="w-full h-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm resize-none"
                onPaste={handlePaste}
              />
            </div>
          )}

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="bg-app-bg rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-500">#{index + 1}</span>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="品名 *"
                  className="w-full px-3 py-2 bg-app-card border border-app-border rounded-lg text-white text-sm mb-2"
                />

                <input
                  type="text"
                  value={item.specification}
                  onChange={(e) => updateItem(index, 'specification', e.target.value)}
                  placeholder="規格・仕様"
                  className="w-full px-3 py-2 bg-app-card border border-app-border rounded-lg text-white text-sm mb-2"
                />

                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="数量"
                    className="px-2 py-2 bg-app-card border border-app-border rounded-lg text-white text-sm text-right"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="単位"
                    className="px-2 py-2 bg-app-card border border-app-border rounded-lg text-white text-sm text-center"
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    placeholder="単価"
                    className="px-2 py-2 bg-app-card border border-app-border rounded-lg text-white text-sm text-right"
                  />
                  <div className="px-2 py-2 bg-app-card/50 border border-app-border rounded-lg text-white text-sm text-right">
                    {(parseFloat(item.amount) || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 合計 */}
        <div className="bg-app-bg rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">小計</span>
            <span>¥{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">消費税 (10%)</span>
            <span>¥{taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-app-border pt-2">
            <span>合計</span>
            <span className="text-orange-500">¥{total.toLocaleString()}</span>
          </div>
        </div>

        <Input
          label="備考"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="備考・特記事項"
        />
      </div>
    </Modal>
  )
}

// 工事追加モーダル
function ProjectModal({ isOpen, data, onClose, onSave }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    client: '',
    order_amount: '',
    sales_profit: '',
    start_date: '',
    end_date: '',
    status: '見積中',
    address: '',
    latitude: null,
    longitude: null
  })
  const [pasteMode, setPasteMode] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const modalFileInputRef = useRef(null)

  // 見積書Excelアップロードで新規案件作成
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/projects/import-estimate`, {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        alert(`「${result.project_name}」を取込みました（工種: ${result.work_types_count}件）`)
        onClose()
        // 詳細ページへ移動
        if (result.project_id) {
          navigate(`/sbase/${result.project_id}`)
        }
      } else {
        const error = await res.json()
        alert(`取込に失敗しました: ${error.detail || 'エラー'}`)
      }
    } catch (error) {
      console.error('Failed to import:', error)
      alert('Excelファイルの取込に失敗しました')
    } finally {
      setUploading(false)
      if (modalFileInputRef.current) modalFileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (data) {
      // 既存のperiodをstart_dateとend_dateに分割
      let startDate = data.start_date || ''
      let endDate = data.end_date || ''
      if (!startDate && data.period) {
        const parts = data.period.split('～').map(s => s.trim())
        startDate = parts[0] || ''
        endDate = parts[1] || ''
      }
      setForm({
        id: data.id,
        name: data.name || '',
        client: data.client || '',
        order_amount: data.order_amount || '',
        sales_profit: data.sales_profit || '',
        start_date: startDate,
        end_date: endDate,
        status: data.status || '見積中',
        address: data.address || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null
      })
    } else {
      setForm({
        name: '',
        client: '',
        order_amount: '',
        sales_profit: '',
        start_date: '',
        end_date: '',
        status: '見積中',
        address: '',
        latitude: null,
        longitude: null
      })
    }
    setPasteMode(false)
  }, [data, isOpen])

  // 住所から緯度経度を取得
  const handleGeocode = async () => {
    if (!form.address) return
    setGeocoding(true)
    try {
      const res = await fetch(`${API_BASE}/geocode?address=${encodeURIComponent(form.address)}`)
      const result = await res.json()
      if (result.success) {
        setForm({
          ...form,
          latitude: result.latitude,
          longitude: result.longitude
        })
      } else {
        alert('住所から位置情報を取得できませんでした')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('位置情報の取得に失敗しました')
    } finally {
      setGeocoding(false)
    }
  }

  const statusOptions = [
    { value: '見積中', label: '見積中' },
    { value: '見込み有', label: '見込み有' },
    { value: '受注確定', label: '受注確定' },
    { value: '施工中', label: '施工中' },
    { value: '完了', label: '完了' },
    { value: '保留', label: '保留' },
    { value: '失注', label: '失注' },
  ]

  // Excel貼り付け処理
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData
    const pastedText = clipboardData.getData('text')

    if (!pastedText) return

    // タブ区切りまたはカンマ区切りで列を分割
    const cols = pastedText.includes('\t') ? pastedText.split('\t') : pastedText.split(',')

    if (cols.length >= 1) {
      const newForm = { ...form }

      cols.forEach((col, i) => {
        const val = col.trim()
        if (!val) return

        // 数値判定（金額）
        const numVal = parseFloat(val.replace(/,/g, '').replace(/円/g, ''))

        // 日付判定（YYYY/MM/DD, YYYY-MM-DD, YYYY年MM月DD日）
        const dateMatch = val.match(/(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})/)

        if (i === 0 && !numVal) {
          // 最初の列で数値でなければ工事名
          newForm.name = val
        } else if (i === 1 && !numVal && !dateMatch) {
          // 2列目で数値・日付でなければ発注者
          newForm.client = val
        } else if (!isNaN(numVal) && numVal > 10000) {
          // 大きな数値は金額（受注金額、営業利益の順）
          if (!newForm.order_amount) {
            newForm.order_amount = numVal
          } else if (!newForm.sales_profit) {
            newForm.sales_profit = numVal
          }
        } else if (dateMatch) {
          // 日付の場合は工期に追加
          const dateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
          if (!newForm.start_date) {
            newForm.start_date = dateStr
          } else if (!newForm.end_date) {
            newForm.end_date = dateStr
          }
        }
      })

      setForm(newForm)
      setPasteMode(false)
      e.preventDefault()
    }
  }

  const handleSubmit = () => {
    console.log('handleSubmit called', form)
    if (!form.name) {
      alert('工事名を入力してください')
      return
    }
    const saveData = {
      ...form,
      order_amount: form.order_amount ? parseFloat(form.order_amount) : 0,
      sales_profit: form.sales_profit ? parseFloat(form.sales_profit) : 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null
    }
    console.log('Saving project:', saveData)
    onSave(saveData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '工事を編集' : '工事を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      {/* Excel貼り付け・アップロードボタン */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setPasteMode(!pasteMode)}
          className={`text-xs flex items-center gap-1 px-3 py-2 rounded-lg ${pasteMode ? 'bg-amber-500/20 text-amber-400' : 'bg-app-bg text-amber-400'}`}
        >
          <FileText size={14} />Excelから貼り付け
        </button>
        <button
          type="button"
          onClick={() => modalFileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs flex items-center gap-1 px-3 py-2 rounded-lg bg-app-bg text-emerald-400"
        >
          <Upload size={14} />{uploading ? '取込中...' : '見積書Excelをアップロード'}
        </button>
        <input
          ref={modalFileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleExcelUpload}
          className="hidden"
        />
      </div>

      {/* Excel貼り付けエリア */}
      {pasteMode && (
        <div className="mb-4 p-4 bg-amber-500/10 border-2 border-dashed border-amber-500/30 rounded-lg">
          <div className="text-sm text-amber-400 mb-2">Excelからコピーしたデータを貼り付けてください</div>
          <div className="text-xs text-slate-400 mb-2">
            列順: 工事名, 発注者, 受注金額, 開始日, 終了日
          </div>
          <textarea
            placeholder="ここにExcelからコピーしたデータを貼り付け（Ctrl+V / Cmd+V）"
            className="w-full h-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm resize-none"
            onPaste={handlePaste}
          />
        </div>
      )}

      <Input
        label="工事名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：〇〇舗装補修工事"
      />
      <Input
        label="発注者"
        value={form.client}
        onChange={(e) => setForm({ ...form, client: e.target.value })}
        placeholder="例：〇〇建設株式会社"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="受注金額"
          type="number"
          value={form.order_amount}
          onChange={(e) => setForm({ ...form, order_amount: e.target.value })}
          placeholder="例：10000000"
        />
        <Input
          label="営業利益"
          type="number"
          value={form.sales_profit}
          onChange={(e) => setForm({ ...form, sales_profit: e.target.value })}
          placeholder="例：2000000"
        />
      </div>
      {/* 工事予算（自動計算） */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1">工事予算（自動計算）</label>
        <div className="px-3 py-2 bg-app-bg border border-app-border rounded-lg text-gray-300 text-sm">
          {(parseFloat(form.order_amount) || 0) - (parseFloat(form.sales_profit) || 0) > 0
            ? ((parseFloat(form.order_amount) || 0) - (parseFloat(form.sales_profit) || 0)).toLocaleString() + ' 円'
            : '-'}
        </div>
        <div className="text-xs text-slate-500 mt-1">※ 受注金額 - 営業利益</div>
      </div>
      {/* 工期（開始日・終了日） */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">工期</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">開始日</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">終了日</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm"
            />
          </div>
        </div>
      </div>
      <Select
        label="ステータス"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        options={statusOptions}
      />

      {/* 現場住所 */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1">現場住所</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="例：東京都渋谷区..."
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm"
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={geocoding || !form.address}
            className="px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {geocoding ? '取得中...' : '位置取得'}
          </button>
        </div>
        {form.latitude && form.longitude && (
          <div className="mt-2 text-xs text-emerald-400">
            位置情報取得済み（緯度: {form.latitude.toFixed(4)}, 経度: {form.longitude.toFixed(4)}）
          </div>
        )}
      </div>
    </Modal>
  )
}

// 出来高タブ
function ProgressTab({ progressData, project, onAdd, onEdit, onDelete }) {
  // 累計計算
  const totalProgress = progressData.reduce((sum, p) => sum + (p.progress_amount || 0), 0)
  const totalCost = progressData.reduce((sum, p) => sum + (p.cost_amount || 0), 0)
  const totalProfit = progressData.reduce((sum, p) => sum + (p.gross_profit || 0), 0)
  const orderAmount = project?.order_amount || 0
  const progressRate = orderAmount > 0 ? Math.round((totalProgress / orderAmount) * 100) : 0

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>📊 出来高調書</SectionTitle>
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} className="inline mr-1" />月次追加
        </Button>
      </div>

      {/* サマリーカード */}
      <Card className="mb-4 bg-gradient-to-r from-orange-500/20 to-emerald-500/20">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-400">受注金額</div>
            <div className="text-lg font-bold">{formatMoneyFull(orderAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">出来高累計</div>
            <div className="text-lg font-bold text-orange-500">{formatMoneyFull(totalProgress)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-400">原価累計</div>
            <div className="font-medium text-amber-400">{formatMoneyFull(totalCost)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">粗利累計</div>
            <div className="font-medium text-emerald-400">{formatMoneyFull(totalProfit)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">進捗率</div>
            <div className="font-medium">{progressRate}%</div>
          </div>
        </div>
      </Card>

      {progressData.length === 0 ? (
        <Empty icon="📊" title="出来高データがありません" subtitle="月次データを追加してください" />
      ) : (
        <div className="space-y-3">
          {progressData.map((p) => {
            const profitRate = p.progress_amount > 0 ? Math.round((p.gross_profit / p.progress_amount) * 100) : 0
            return (
              <Card key={p.id} className="hover:bg-app-card/80 transition">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-lg font-bold text-orange-500">{p.year_month}</div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(p)} className="p-1 text-orange-500 hover:bg-orange-500/20 rounded">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">出来高</div>
                    <div className="font-medium">{formatMoneyFull(p.progress_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">原価</div>
                    <div className="font-medium text-amber-400">{formatMoneyFull(p.cost_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">粗利 ({profitRate}%)</div>
                    <div className="font-medium text-emerald-400">{formatMoneyFull(p.gross_profit)}</div>
                  </div>
                </div>
                {p.note && <div className="text-xs text-slate-400 mt-2">{p.note}</div>}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

// 出来高登録モーダル
function ProgressModal({ isOpen, data, project, onClose, onSave }) {
  const [form, setForm] = useState({
    year_month: '',
    progress_amount: '',
    cost_amount: '',
    note: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        year_month: data.year_month || '',
        progress_amount: data.progress_amount || '',
        cost_amount: data.cost_amount || '',
        note: data.note || ''
      })
    } else {
      // デフォルトで今月を設定
      const now = new Date()
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setForm({
        year_month: defaultMonth,
        progress_amount: '',
        cost_amount: '',
        note: ''
      })
    }
  }, [data, isOpen])

  // 粗利を自動計算
  const progressAmt = parseFloat(form.progress_amount) || 0
  const costAmt = parseFloat(form.cost_amount) || 0
  const grossProfit = progressAmt - costAmt
  const grossProfitRate = progressAmt > 0 ? Math.round((grossProfit / progressAmt) * 100) : 0

  const handleSubmit = () => {
    if (!form.year_month) {
      alert('月を入力してください')
      return
    }
    onSave({
      ...form,
      progress_amount: progressAmt,
      cost_amount: costAmt,
      gross_profit: grossProfit,
      gross_profit_rate: grossProfitRate
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '出来高を編集' : '月次出来高を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="対象月 *"
          type="month"
          value={form.year_month}
          onChange={(e) => setForm({ ...form, year_month: e.target.value })}
        />
        <Input
          label="出来高金額"
          type="number"
          value={form.progress_amount}
          onChange={(e) => setForm({ ...form, progress_amount: e.target.value })}
          placeholder="出来高金額を入力"
        />
        <Input
          label="原価金額"
          type="number"
          value={form.cost_amount}
          onChange={(e) => setForm({ ...form, cost_amount: e.target.value })}
          placeholder="原価金額を入力"
        />

        {/* 粗利プレビュー */}
        <div className="bg-app-bg rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">粗利</span>
            <span className={grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatMoneyFull(grossProfit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">粗利率</span>
            <span className={grossProfitRate >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {grossProfitRate}%
            </span>
          </div>
        </div>

        <div className="text-xs text-orange-500 bg-orange-500/10 p-2 rounded">
          💡 保存時に入金予定が自動作成されます（元請けの締め日・支払日に基づく）
        </div>

        <Input
          label="備考"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="備考・特記事項"
        />
      </div>
    </Modal>
  )
}
