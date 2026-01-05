import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, X, Save, FileSpreadsheet,
  FileText, List, Edit3, ArrowLeft, Download,
  ArrowUp, ArrowDown, Copy, MoreVertical,
  ChevronDown, ChevronRight, BarChart3, ClipboardCheck
} from 'lucide-react'
import { Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

// シートの種類
const SHEET_TYPES = {
  COVER: 'cover',
  DETAIL: 'detail',
  CONDITIONS: 'conditions',
  CONFIRMATION: 'confirmation',
}

// 初期シート構成（表紙・内訳・条件書・確認書）
const createInitialSheets = () => [
  { id: 'cover', type: SHEET_TYPES.COVER, name: '表紙' },
  { id: 'detail-1', type: SHEET_TYPES.DETAIL, name: '内訳1', items: createEmptyRows(15) },
  { id: 'conditions', type: SHEET_TYPES.CONDITIONS, name: '条件書', items: [''] },
  { id: 'confirmation', type: SHEET_TYPES.CONFIRMATION, name: '確認書', data: null },
]

// 予算種別
const BUDGET_TYPES = [
  { value: '労務費', label: '労務', color: '#3b82f6' },
  { value: '外注費', label: '外注', color: '#8b5cf6' },
  { value: '材料費', label: '材料', color: '#10b981' },
  { value: '機械', label: '機械', color: '#f59e0b' },
  { value: '経費', label: '経費', color: '#6b7280' },
  { value: 'その他', label: '他', color: '#94a3b8' },
]

// 空の明細行を生成
const createEmptyRows = (count) => {
  return Array(count).fill(null).map(() => ({
    name: '',
    spec: '',
    quantity: '',
    unit: '',
    unitPrice: '',
    amount: '',
    note: '',
    budgets: [], // 予算内訳
  }))
}

// 空の予算行を生成
const createEmptyBudget = () => ({
  type: '労務費',
  spec: '',           // 規格（手入力）
  quantity: '',       // 数量（手入力、見積と連動しない）
  unit: '',           // 単位（手入力）
  unitPrice: '',      // 予算単価
  estimatePrice: '',  // 見積単価（上の見積行から反映可）
  amount: '',         // 予算金額（自動計算）
  estimateAmount: '', // 見積金額（自動計算）
  remarks: '',
})

// 集計行かどうかを判定（小計、中計、合計、直接工事費、計）
const isSummaryRow = (name) => {
  if (!name) return false
  const trimmedName = name.trim()
  // 集計行のパターン
  const summaryPatterns = [
    '小計', '小 計',
    '中計', '中 計',
    '合計', '合 計',
    '直接工事費',
  ]
  // パターンに含まれるかチェック
  if (summaryPatterns.some(pattern => trimmedName.includes(pattern))) {
    return true
  }
  // 「計」単独の場合（他の文字を含まない）
  if (trimmedName === '計') {
    return true
  }
  return false
}

// 表紙シートコンポーネント
function CoverSheet({ data, onChange, styles }) {
  const { inputBg, cardBorder, textColor, textLight } = styles

  const fields = [
    { key: 'projectName', label: '工事名・件名', required: true, placeholder: '例: ○○道路舗装工事' },
    { key: 'client', label: '発注者（元請け）', placeholder: '例: 株式会社○○建設' },
    { key: 'location', label: '工事場所', placeholder: '例: 福岡県○○市○○町' },
    { key: 'periodStart', label: '工期（自）', type: 'date' },
    { key: 'periodEnd', label: '工期（至）', type: 'date' },
    { key: 'validUntil', label: '有効期限', type: 'date' },
    { key: 'paymentTerms', label: '支払条件', placeholder: '例: 請求書発行後30日以内' },
    { key: 'manager', label: '担当者', placeholder: '例: 山田太郎' },
    { key: 'notes', label: '特記事項', multiline: true, placeholder: '特記事項があれば入力' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* 合計金額表示 */}
      <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white' }}>
        <div className="text-sm opacity-80 mb-1">見積金額（税込）</div>
        <div className="text-4xl font-bold tracking-tight">¥{(data.total || 0).toLocaleString()}</div>
        <div className="flex gap-4 text-sm opacity-80 mt-3">
          <span>小計: ¥{(data.subtotal || 0).toLocaleString()}</span>
          <span>消費税(10%): ¥{(data.tax || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* 入力フィールド */}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: textColor }}>
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            {field.multiline ? (
              <textarea
                value={data[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:ring-2 focus:ring-blue-500"
                style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={data[field.key] || ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500"
                style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 利益管理セクション（営業向け） */}
      <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${cardBorder}` }}>
        <div className="text-sm font-bold mb-4" style={{ color: textColor }}>
          💰 利益管理
        </div>

        {/* 利益計算表示 */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: inputBg }}>
          {/* 売上（税抜） */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm" style={{ color: textLight }}>売上（税抜）</span>
            <span className="text-lg font-bold" style={{ color: textColor }}>
              ¥{(data.subtotal || 0).toLocaleString()}
            </span>
          </div>

          {/* 営業利益（入力） */}
          <div className="flex justify-between items-center py-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <span className="text-sm" style={{ color: textLight }}>営業利益</span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: textLight }}>¥</span>
              <input
                type="number"
                value={data.salesProfit || ''}
                onChange={(e) => onChange('salesProfit', e.target.value)}
                placeholder="0"
                className="w-32 px-3 py-2 rounded-lg text-sm text-right transition-all focus:ring-2 focus:ring-emerald-500"
                style={{ background: cardBorder, border: 'none', color: '#10b981', fontWeight: 'bold' }}
              />
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                {((parseInt(data.salesProfit) || 0) / Math.max(data.subtotal || 1, 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 工事に回す金額（自動計算） */}
          <div className="flex justify-between items-center py-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <span className="text-sm font-medium" style={{ color: textLight }}>工事に回す金額</span>
            <span className="text-lg font-bold" style={{ color: '#3b82f6' }}>
              ¥{((data.subtotal || 0) - (parseInt(data.salesProfit) || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-xs mt-2" style={{ color: textLight }}>
          ※ 工事に回す金額 = 売上 - 営業利益（自動計算）
        </p>
      </div>
    </div>
  )
}

// 明細シートコンポーネント（Excel風グリッド）
function DetailSheet({ sheet, items, onChange, onAddRow, onDeleteRow, onSheetNameChange, styles }) {
  const { inputBg, cardBorder, textColor, textLight } = styles
  const scrollRef = useRef(null)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(sheet.name)
  const [menuRowIndex, setMenuRowIndex] = useState(null) // 行メニュー表示用
  const [expandedRows, setExpandedRows] = useState({}) // 展開状態

  // 行の展開/折りたたみを切り替え
  const toggleExpand = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }))
  }

  // 予算を追加（見積の連動フィールドを自動コピー）
  const addBudget = (rowIndex) => {
    const newItems = [...items]
    if (!newItems[rowIndex].budgets) {
      newItems[rowIndex].budgets = []
    }
    const parentItem = newItems[rowIndex]
    const newBudget = {
      ...createEmptyBudget(),
      // 見積から連動フィールドをコピー（単価は空のまま）
      name: parentItem.name || '',
      spec: parentItem.spec || '',
      quantity: parentItem.quantity || '',
      unit: parentItem.unit || '',
    }
    newItems[rowIndex].budgets.push(newBudget)
    onChange(newItems)
  }

  // 予算を更新（種別・単価・備考のみ）
  const updateBudget = (rowIndex, budgetIndex, key, value) => {
    const newItems = [...items]
    const budget = { ...newItems[rowIndex].budgets[budgetIndex], [key]: value }

    // 予算金額を再計算（数量 × 予算単価）
    if (key === 'quantity' || key === 'unitPrice') {
      const qty = parseFloat(key === 'quantity' ? value : budget.quantity) || 0
      const price = parseFloat(key === 'unitPrice' ? value : budget.unitPrice) || 0
      budget.amount = qty * price !== 0 ? Math.round(qty * price) : ''
    }

    // 見積金額を再計算（数量 × 見積単価）
    if (key === 'quantity' || key === 'estimatePrice') {
      const qty = parseFloat(key === 'quantity' ? value : budget.quantity) || 0
      const estPrice = parseFloat(key === 'estimatePrice' ? value : budget.estimatePrice) || 0
      budget.estimateAmount = qty * estPrice !== 0 ? Math.round(qty * estPrice) : ''
    }

    newItems[rowIndex].budgets[budgetIndex] = budget
    onChange(newItems)
  }

  // 見積から反映ボタン（見積行の数量・単位を予算行にコピー）
  const copyFromEstimate = (rowIndex, budgetIndex) => {
    const newItems = [...items]
    const parentItem = newItems[rowIndex]
    const budget = { ...newItems[rowIndex].budgets[budgetIndex] }

    // 見積行から数量・単位をコピー
    budget.quantity = parentItem.quantity || ''
    budget.unit = parentItem.unit || ''

    // 予算金額を再計算
    const qty = parseFloat(budget.quantity) || 0
    const price = parseFloat(budget.unitPrice) || 0
    budget.amount = qty * price !== 0 ? Math.round(qty * price) : ''

    // 見積金額を再計算
    const estPrice = parseFloat(budget.estimatePrice) || 0
    budget.estimateAmount = qty * estPrice !== 0 ? Math.round(qty * estPrice) : ''

    newItems[rowIndex].budgets[budgetIndex] = budget
    onChange(newItems)
  }

  // 予算を削除
  const deleteBudget = (rowIndex, budgetIndex) => {
    const newItems = [...items]
    newItems[rowIndex].budgets.splice(budgetIndex, 1)
    onChange(newItems)
  }

  // 予算合計を計算（各予算の数量を使用）
  const getBudgetTotal = (budgets) => {
    if (!budgets || budgets.length === 0) return 0
    return budgets.reduce((sum, b) => {
      const qty = parseFloat(b.quantity) || 0
      const price = parseFloat(b.unitPrice) || 0
      return sum + Math.round(qty * price)
    }, 0)
  }

  // 見積合計を計算（各予算の見積金額）
  const getEstimateTotal = (budgets) => {
    if (!budgets || budgets.length === 0) return 0
    return budgets.reduce((sum, b) => {
      const qty = parseFloat(b.quantity) || 0
      const estPrice = parseFloat(b.estimatePrice) || 0
      return sum + Math.round(qty * estPrice)
    }, 0)
  }

  // 粗利を計算（見積金額 - 予算金額）
  const getProfit = (budgets) => {
    const estimateTotal = getEstimateTotal(budgets)
    const budgetTotal = getBudgetTotal(budgets)
    return estimateTotal - budgetTotal
  }

  // 粗利率を計算
  const getProfitRate = (budgets) => {
    const estimateTotal = getEstimateTotal(budgets)
    if (estimateTotal === 0) return 0
    const profit = getProfit(budgets)
    return (profit / estimateTotal) * 100
  }

  const columns = [
    { key: 'name', label: '名称', width: 180 },
    { key: 'spec', label: '規格', width: 120 },
    { key: 'quantity', label: '数量', width: 80, type: 'number', align: 'right' },
    { key: 'unit', label: '単位', width: 60, align: 'center' },
    { key: 'unitPrice', label: '単価', width: 100, type: 'number', align: 'right' },
    { key: 'amount', label: '金額', width: 120, type: 'calculated', align: 'right' },
    { key: 'note', label: '備考', width: 140 },
  ]

  const handleCellChange = (rowIndex, key, value) => {
    const newItems = [...items]
    newItems[rowIndex] = { ...newItems[rowIndex], [key]: value }

    // 金額自動計算（マイナス値も対応）
    if (key === 'quantity' || key === 'unitPrice') {
      const qty = parseFloat(key === 'quantity' ? value : newItems[rowIndex].quantity) || 0
      const price = parseFloat(key === 'unitPrice' ? value : newItems[rowIndex].unitPrice) || 0
      const result = qty * price
      // 0以外の値（プラスもマイナスも）を設定
      newItems[rowIndex].amount = result !== 0 ? Math.round(result) : ''
    }

    // 金額を直接入力した場合もマイナス値を許可
    if (key === 'amount') {
      const amountValue = parseFloat(value)
      newItems[rowIndex].amount = !isNaN(amountValue) ? Math.round(amountValue) : value
    }

    // 見積単価が変更された場合、予算のestimatePrice/estimateAmountを更新
    if (key === 'unitPrice' && newItems[rowIndex].budgets) {
      newItems[rowIndex].budgets = newItems[rowIndex].budgets.map(budget => {
        const updatedBudget = { ...budget }
        // estimatePriceが未入力の場合のみ自動で反映
        if (!budget.estimatePrice || budget.estimatePrice === '') {
          updatedBudget.estimatePrice = value
        }
        // 見積金額を再計算
        const budgetQty = parseFloat(budget.quantity) || 0
        const estPrice = parseFloat(updatedBudget.estimatePrice) || 0
        updatedBudget.estimateAmount = budgetQty * estPrice !== 0 ? Math.round(budgetQty * estPrice) : ''
        return updatedBudget
      })
    }

    onChange(newItems)
  }

  // 集計行を除外して小計を計算
  const subtotal = items.reduce((sum, item) => {
    if (isSummaryRow(item.name)) return sum
    return sum + (parseFloat(item.amount) || 0)
  }, 0)

  const handleNameSave = () => {
    if (tempName.trim()) {
      onSheetNameChange(tempName.trim())
    }
    setEditingName(false)
  }

  // 行を上に挿入
  const insertRowAbove = (index) => {
    const newRow = { name: '', spec: '', quantity: '', unit: '', unitPrice: '', amount: '', note: '', budgets: [] }
    const newItems = [...items]
    newItems.splice(index, 0, newRow)
    onChange(newItems)
    setMenuRowIndex(null)
  }

  // 行を下に挿入
  const insertRowBelow = (index) => {
    const newRow = { name: '', spec: '', quantity: '', unit: '', unitPrice: '', amount: '', note: '', budgets: [] }
    const newItems = [...items]
    newItems.splice(index + 1, 0, newRow)
    onChange(newItems)
    setMenuRowIndex(null)
  }

  // 行をコピー（予算もコピー）
  const copyRow = (index) => {
    const original = items[index]
    const copiedRow = {
      ...original,
      budgets: original.budgets ? original.budgets.map(b => ({ ...b })) : []
    }
    const newItems = [...items]
    newItems.splice(index + 1, 0, copiedRow)
    onChange(newItems)
    setMenuRowIndex(null)
  }

  // 行を削除
  const deleteRow = (index) => {
    if (items.length <= 1) {
      // 最後の1行は空にする
      onChange([{ name: '', spec: '', quantity: '', unit: '', unitPrice: '', amount: '', note: '', budgets: [] }])
    } else {
      onChange(items.filter((_, i) => i !== index))
    }
    setMenuRowIndex(null)
    // 展開状態もクリア
    setExpandedRows(prev => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
  }

  // メニュー外クリックで閉じる
  const handleClickOutside = () => {
    if (menuRowIndex !== null) {
      setMenuRowIndex(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style={{
          background: styles.cardBg,
          borderBottom: `1px solid ${cardBorder}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* シート名編集 */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="px-2 py-1 text-sm rounded border-2 border-blue-500 focus:outline-none"
                style={{ background: inputBg, color: textColor, width: '120px' }}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(sheet.name)
                setEditingName(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-colors"
              style={{ color: textColor }}
            >
              <FileSpreadsheet size={16} className="text-blue-500" />
              {sheet.name}
              <Edit3 size={12} className="opacity-50" />
            </button>
          )}

          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus size={14} /> 行追加
          </button>
        </div>

        <div className="text-sm font-bold px-4 py-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
          シート小計: ¥{subtotal.toLocaleString()}
        </div>
      </div>

      {/* スプレッドシート */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <table className="w-full border-collapse" style={{ minWidth: columns.reduce((sum, c) => sum + c.width, 80) }}>
          {/* ヘッダー */}
          <thead className="sticky top-0 z-10">
            <tr style={{ background: '#2563eb' }}>
              <th className="w-12 p-2 text-white text-xs font-bold border-r border-blue-400 sticky left-0 bg-blue-600">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-white text-xs font-bold border-r border-blue-400"
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* データ行 */}
          <tbody>
            {items.map((item, rowIndex) => {
              const isSum = isSummaryRow(item.name)
              const isExpanded = expandedRows[rowIndex]
              const hasBudgets = item.budgets && item.budgets.length > 0
              const budgetTotal = getBudgetTotal(item.budgets)
              const estimateTotal = getEstimateTotal(item.budgets)
              const profit = getProfit(item.budgets)
              const profitRate = getProfitRate(item.budgets)
              const hasName = item.name && item.name.trim()

              return (
              <React.Fragment key={rowIndex}>
              <tr
                className="group hover:bg-blue-500/5 transition-colors"
                style={{
                  background: isSum ? 'rgba(156, 163, 175, 0.3)' : (rowIndex % 2 === 0 ? inputBg : 'transparent'),
                  borderBottom: isExpanded ? 'none' : `1px solid ${cardBorder}`,
                  fontWeight: isSum ? 'bold' : 'normal',
                }}
              >
                {/* 行番号（クリックでメニュー表示） */}
                <td
                  className="p-0 text-center text-xs font-mono font-bold sticky left-0 relative"
                  style={{
                    borderRight: `1px solid ${cardBorder}`,
                    background: isSum ? 'rgba(156, 163, 175, 0.3)' : (rowIndex % 2 === 0 ? inputBg : styles.cardBg),
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuRowIndex(menuRowIndex === rowIndex ? null : rowIndex)
                    }}
                    className="w-full h-full py-2.5 px-2 flex items-center justify-center gap-1 hover:bg-blue-500/10 transition-colors"
                    style={{ color: menuRowIndex === rowIndex ? '#3b82f6' : textLight }}
                  >
                    <span>{rowIndex + 1}</span>
                    <MoreVertical size={10} className="opacity-50" />
                  </button>

                  {/* 行メニュー */}
                  {menuRowIndex === rowIndex && (
                    <>
                      {/* オーバーレイ */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setMenuRowIndex(null)}
                      />
                      {/* メニュー */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-full top-0 ml-1 z-40 rounded-xl shadow-xl border overflow-hidden"
                        style={{
                          background: styles.cardBg,
                          borderColor: cardBorder,
                          minWidth: '140px',
                        }}
                      >
                        <button
                          onClick={() => insertRowAbove(rowIndex)}
                          className="w-full px-3 py-2.5 text-left text-xs font-medium flex items-center gap-2 hover:bg-blue-500/10 transition-colors"
                          style={{ color: textColor }}
                        >
                          <ArrowUp size={14} className="text-blue-500" />
                          上に行を挿入
                        </button>
                        <button
                          onClick={() => insertRowBelow(rowIndex)}
                          className="w-full px-3 py-2.5 text-left text-xs font-medium flex items-center gap-2 hover:bg-blue-500/10 transition-colors"
                          style={{ color: textColor }}
                        >
                          <ArrowDown size={14} className="text-blue-500" />
                          下に行を挿入
                        </button>
                        <div className="border-t" style={{ borderColor: cardBorder }} />
                        <button
                          onClick={() => copyRow(rowIndex)}
                          className="w-full px-3 py-2.5 text-left text-xs font-medium flex items-center gap-2 hover:bg-blue-500/10 transition-colors"
                          style={{ color: textColor }}
                        >
                          <Copy size={14} className="text-emerald-500" />
                          この行をコピー
                        </button>
                        <div className="border-t" style={{ borderColor: cardBorder }} />
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="w-full px-3 py-2.5 text-left text-xs font-medium flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
                        >
                          <Trash2 size={14} />
                          この行を削除
                        </button>
                      </motion.div>
                    </>
                  )}
                </td>

                {/* セル */}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="p-0"
                    style={{ borderRight: `1px solid ${cardBorder}` }}
                  >
                    {col.key === 'name' ? (
                      // 名称セル（展開ボタン付き）
                      <div className="flex items-center">
                        {hasName && !isSum && (
                          <button
                            onClick={() => toggleExpand(rowIndex)}
                            className="flex-shrink-0 p-1 ml-1 rounded hover:bg-blue-500/10 transition-colors"
                            style={{ color: isExpanded ? '#3b82f6' : textLight }}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        )}
                        <input
                          type="text"
                          value={item[col.key] || ''}
                          onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                          className="w-full h-full px-2 py-2.5 bg-transparent text-sm focus:outline-none focus:bg-blue-500/10 transition-colors"
                          style={{ color: textColor }}
                          placeholder=""
                        />
                      </div>
                    ) : col.type === 'calculated' ? (
                      <div
                        className="w-full h-full px-3 py-2.5 text-sm font-bold"
                        style={{
                          // マイナス値は赤、プラス値は青
                          color: item.amount ? (parseFloat(item.amount) < 0 ? '#ef4444' : '#3b82f6') : textLight,
                          textAlign: col.align || 'left',
                          background: parseFloat(item.amount) < 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                        }}
                      >
                        {item.amount ? `¥${parseInt(item.amount).toLocaleString()}` : ''}
                      </div>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'text' : 'text'}
                        inputMode={col.type === 'number' ? 'numeric' : 'text'}
                        value={item[col.key] || ''}
                        onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                        className="w-full h-full px-3 py-2.5 bg-transparent text-sm focus:outline-none focus:bg-blue-500/10 transition-colors"
                        style={{
                          color: textColor,
                          textAlign: col.align || 'left',
                        }}
                        placeholder={col.type === 'number' ? '0' : ''}
                      />
                    )}
                  </td>
                ))}

              </tr>

              {/* 予算内訳行（展開時） */}
              {isExpanded && hasName && !isSum && (
                <tr style={{ background: 'rgba(59, 130, 246, 0.03)' }}>
                  <td
                    colSpan={columns.length + 1}
                    className="p-0"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                  >
                    <div className="p-3">
                      {/* 予算ヘッダー */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 size={14} className="text-blue-500" />
                          <span className="text-xs font-bold" style={{ color: textColor }}>原価予算</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: profit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: profit >= 0 ? '#10b981' : '#ef4444'
                          }}>
                            粗利: ¥{profit.toLocaleString()} ({profitRate.toFixed(1)}%)
                          </span>
                        </div>
                        <button
                          onClick={() => addBudget(rowIndex)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Plus size={12} /> 追加
                        </button>
                      </div>

                      {/* 予算一覧 - テーブルレイアウト */}
                      {item.budgets && item.budgets.length > 0 ? (
                        <div className="space-y-1.5">
                          {/* ヘッダー行 */}
                          <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold" style={{ color: textLight }}>
                            <span className="w-16 text-center">種別</span>
                            <span className="w-20 text-center">規格</span>
                            <span className="w-14 text-center">数量</span>
                            <span className="w-12 text-center">単位</span>
                            <span className="w-20 text-center">予算単価</span>
                            <span className="w-20 text-center">見積単価</span>
                            <span className="w-24 text-center">予算金額</span>
                            <span className="w-24 text-center">見積金額</span>
                            <span className="flex-1 text-center" style={{ maxWidth: '80px' }}>備考</span>
                            <span className="w-20"></span>
                          </div>

                          {item.budgets.map((budget, budgetIndex) => {
                            const typeInfo = BUDGET_TYPES.find(t => t.value === budget.type) || BUDGET_TYPES[0]
                            const budgetQty = parseFloat(budget.quantity) || 0
                            const budgetPrice = parseFloat(budget.unitPrice) || 0
                            const estPrice = parseFloat(budget.estimatePrice) || 0
                            const budgetAmount = Math.round(budgetQty * budgetPrice)
                            const estAmount = Math.round(budgetQty * estPrice)
                            return (
                              <div
                                key={budgetIndex}
                                className="flex items-center gap-1 p-2 rounded-lg"
                                style={{ background: inputBg }}
                              >
                                {/* 種別 */}
                                <select
                                  value={budget.type}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'type', e.target.value)}
                                  className="w-16 px-1 py-1.5 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{
                                    background: `${typeInfo.color}20`,
                                    color: typeInfo.color,
                                    border: 'none'
                                  }}
                                >
                                  {BUDGET_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>

                                {/* 規格 */}
                                <input
                                  type="text"
                                  value={budget.spec || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'spec', e.target.value)}
                                  placeholder="規格"
                                  className="w-20 px-1.5 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: textColor }}
                                />

                                {/* 数量 */}
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={budget.quantity || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'quantity', e.target.value)}
                                  placeholder="数量"
                                  className="w-14 px-1.5 py-1.5 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: textColor }}
                                />

                                {/* 単位 */}
                                <input
                                  type="text"
                                  value={budget.unit || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'unit', e.target.value)}
                                  placeholder="単位"
                                  className="w-12 px-1.5 py-1.5 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: textColor }}
                                />

                                {/* 予算単価 */}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={budget.unitPrice || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'unitPrice', e.target.value)}
                                  placeholder="予算単価"
                                  className="w-20 px-1.5 py-1.5 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: textColor }}
                                />

                                {/* 見積単価 */}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={budget.estimatePrice || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'estimatePrice', e.target.value)}
                                  placeholder="見積単価"
                                  className="w-20 px-1.5 py-1.5 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: '#10b981' }}
                                />

                                {/* 予算金額（自動計算） */}
                                <div
                                  className="w-24 px-1.5 py-1.5 rounded text-xs text-right font-bold"
                                  style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}
                                >
                                  ¥{budgetAmount.toLocaleString()}
                                </div>

                                {/* 見積金額（自動計算） */}
                                <div
                                  className="w-24 px-1.5 py-1.5 rounded text-xs text-right font-bold"
                                  style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
                                >
                                  ¥{estAmount.toLocaleString()}
                                </div>

                                {/* 備考 */}
                                <input
                                  type="text"
                                  value={budget.remarks || ''}
                                  onChange={(e) => updateBudget(rowIndex, budgetIndex, 'remarks', e.target.value)}
                                  placeholder="備考"
                                  className="flex-1 px-1.5 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  style={{ background: 'transparent', border: `1px solid ${cardBorder}`, color: textColor, maxWidth: '80px' }}
                                />

                                {/* 見積から反映ボタン */}
                                <button
                                  onClick={() => copyFromEstimate(rowIndex, budgetIndex)}
                                  className="px-1.5 py-1 rounded text-xs font-semibold hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                                  style={{ color: '#10b981', border: '1px solid #10b981' }}
                                  title="見積行の数量・単位を反映"
                                >
                                  反映
                                </button>

                                {/* 削除 */}
                                <button
                                  onClick={() => deleteBudget(rowIndex, budgetIndex)}
                                  className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )
                          })}

                          {/* 予算合計 / 見積合計 */}
                          <div className="flex items-center justify-end gap-6 pt-2 border-t" style={{ borderColor: cardBorder }}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: textLight }}>予算合計:</span>
                              <span className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                                ¥{budgetTotal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: textLight }}>見積合計:</span>
                              <span className="text-sm font-bold" style={{ color: '#10b981' }}>
                                ¥{estimateTotal.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-xs" style={{ color: textLight }}>
                          予算項目がありません。「追加」ボタンで追加してください。
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 条件書シートコンポーネント
function ConditionsSheet({ items, onChange, styles }) {
  const { inputBg, cardBorder, textColor, textLight } = styles

  const handleChange = (index, value) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  const addItem = () => {
    onChange([...items, ''])
  }

  const removeItem = (index) => {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List size={20} className="text-blue-500" />
          <h3 className="text-lg font-bold" style={{ color: textColor }}>施工条件</h3>
        </div>
        <button
          onClick={addItem}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} /> 条件を追加
        </button>
      </div>

      {/* 条件リスト */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div
              className="w-8 h-10 flex items-center justify-center text-sm font-bold rounded-lg"
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
            >
              {index + 1}
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder="施工条件を入力してください"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500"
              style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
            />
            {items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12" style={{ color: textLight }}>
          <List size={48} className="mx-auto mb-3 opacity-30" />
          <p>施工条件がありません</p>
          <p className="text-sm mt-1">「条件を追加」ボタンで追加してください</p>
        </div>
      )}
    </div>
  )
}

// 確認書の初期データを生成
const createInitialConfirmationData = () => ({
  // 左側テーブル
  leftItems: [
    { category: '材料費', name: 'As合材', kisha: false, tosha: true, yusho: '', remarks: '' },
    { category: '材料費', name: 'RC-40　RM-25', kisha: false, tosha: true, yusho: '', remarks: '' },
    { category: '施工管理', name: '写真管理', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '施工管理', name: '出来形管理', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '施工管理', name: '品質管理', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '安全費', name: '保安要員', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
    { category: '安全費', name: '保安施設', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
    { category: '仮設経費', name: '看板・標識類', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
    { category: '仮設経費', name: '保安関係費', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
    { category: '仮設経費', name: '電気引込費', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '土捨場代', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '丁張材料', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
  ],
  // 右側テーブル
  rightItems: [
    { category: '仮設経費', name: '基本測量', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '仮設経費', name: '施工測量', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '仮設経費', name: '測量機器', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '仮設経費', name: '仮設道路', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '工事用電気', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '仮設経費', name: '工事用水道', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: '仮設経費', name: '工事用借地料', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '重機仮置場', kisha: true, tosha: false, yusho: '', remarks: '必要に応じて' },
    { category: '仮設経費', name: '現場事務所', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '宿舎', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '倉庫', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '電気・水道・ガス', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: '仮設経費', name: '借地料', kisha: false, tosha: false, yusho: '', remarks: '必要なし' },
    { category: 'その他', name: '労災保険料', kisha: true, tosha: false, yusho: '', remarks: '' },
    { category: 'その他', name: '建退協証紙代', kisha: true, tosha: false, yusho: '', remarks: '退職金制度あり' },
    { category: 'その他', name: 'その他', kisha: true, tosha: true, yusho: '', remarks: '' },
  ],
  // 特記事項（左）
  specialNotesLeft: [
    { name: '職員', value: '' },
    { name: '家屋調査', value: 'なし' },
    { name: '施工前調査', value: 'なし' },
    { name: '工期延期', value: '別途協議願います' },
    { name: '回送費', value: '1往復' },
    { name: '施工回数', value: '1回施工' },
    { name: '新規工種', value: '別途協議願います' },
    { name: '数量増減', value: '別途協議願います' },
  ],
  // 特記事項（右）
  specialNotesRight: [
    { name: '工法・構造の変更', value: '別途協議願います' },
    { name: '軟弱路床', value: '別途協議願います' },
    { name: '軟弱路盤', value: '別途協議願います' },
    { name: 'その他', value: '' },
  ],
})

// 確認書シートコンポーネント
function ConfirmationSheet({ data, onChange, projectName, styles }) {
  const { inputBg, cardBorder, textColor, textLight } = styles
  const [editingItem, setEditingItem] = useState(null) // { side, index }

  // カテゴリでグループ化
  const groupByCategory = (items) => {
    const groups = {}
    items.forEach((item, idx) => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push({ ...item, originalIndex: idx })
    })
    return groups
  }

  const leftGroups = groupByCategory(data.leftItems || [])
  const rightGroups = groupByCategory(data.rightItems || [])

  // アイテム更新
  const updateItem = (side, index, field, value) => {
    const key = side === 'left' ? 'leftItems' : 'rightItems'
    const newItems = [...(data[key] || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange({ ...data, [key]: newItems })
  }

  // アイテム追加
  const addItem = (side, category) => {
    const key = side === 'left' ? 'leftItems' : 'rightItems'
    const newItems = [...(data[key] || [])]
    const newItem = { category, name: '新規項目', kisha: false, tosha: false, yusho: '', remarks: '' }

    // 同じカテゴリの最後に追加
    const lastIndexOfCategory = newItems.reduce((lastIdx, item, idx) =>
      item.category === category ? idx : lastIdx, -1)

    if (lastIndexOfCategory >= 0) {
      newItems.splice(lastIndexOfCategory + 1, 0, newItem)
    } else {
      newItems.push(newItem)
    }

    onChange({ ...data, [key]: newItems })
  }

  // アイテム削除
  const deleteItem = (side, index) => {
    const key = side === 'left' ? 'leftItems' : 'rightItems'
    const newItems = [...(data[key] || [])]
    newItems.splice(index, 1)
    onChange({ ...data, [key]: newItems })
    setEditingItem(null)
  }

  // 特記事項更新
  const updateSpecialNote = (side, index, field, value) => {
    const key = side === 'left' ? 'specialNotesLeft' : 'specialNotesRight'
    const newNotes = [...(data[key] || [])]
    newNotes[index] = { ...newNotes[index], [field]: value }
    onChange({ ...data, [key]: newNotes })
  }

  // 特記事項追加
  const addSpecialNote = (side) => {
    const key = side === 'left' ? 'specialNotesLeft' : 'specialNotesRight'
    const newNotes = [...(data[key] || []), { name: '新規項目', value: '' }]
    onChange({ ...data, [key]: newNotes })
  }

  // 特記事項削除
  const deleteSpecialNote = (side, index) => {
    const key = side === 'left' ? 'specialNotesLeft' : 'specialNotesRight'
    const newNotes = [...(data[key] || [])]
    newNotes.splice(index, 1)
    onChange({ ...data, [key]: newNotes })
  }

  // テーブルヘッダー
  const TableHeader = () => (
    <tr style={{ background: '#2563eb' }}>
      <th className="p-2 text-white text-xs font-bold border-r border-blue-400 text-left" style={{ width: '100px' }}>項目</th>
      <th className="p-2 text-white text-xs font-bold border-r border-blue-400 text-center" style={{ width: '40px' }}>貴社</th>
      <th className="p-2 text-white text-xs font-bold border-r border-blue-400 text-center" style={{ width: '40px' }}>当社</th>
      <th className="p-2 text-white text-xs font-bold border-r border-blue-400 text-center" style={{ width: '70px' }}>有償支給</th>
      <th className="p-2 text-white text-xs font-bold border-r border-blue-400 text-left" style={{ width: '90px' }}>備考</th>
      <th className="p-2 text-white text-xs font-bold text-center" style={{ width: '50px' }}>操作</th>
    </tr>
  )

  // テーブル行
  const TableRow = ({ item, index, side }) => {
    const isEditing = editingItem?.side === side && editingItem?.index === index

    return (
      <tr
        className="hover:bg-blue-500/5 transition-colors"
        style={{ borderBottom: `1px solid ${cardBorder}` }}
      >
        <td className="p-1" style={{ color: textColor, borderRight: `1px solid ${cardBorder}` }}>
          {isEditing ? (
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(side, index, 'name', e.target.value)}
              className="w-full px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
              autoFocus
            />
          ) : (
            <span className="text-sm px-1">{item.name}</span>
          )}
        </td>
        <td className="p-1 text-center" style={{ borderRight: `1px solid ${cardBorder}` }}>
          <input
            type="checkbox"
            checked={item.kisha}
            onChange={(e) => updateItem(side, index, 'kisha', e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: '#3b82f6' }}
          />
        </td>
        <td className="p-1 text-center" style={{ borderRight: `1px solid ${cardBorder}` }}>
          <input
            type="checkbox"
            checked={item.tosha}
            onChange={(e) => updateItem(side, index, 'tosha', e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: '#10b981' }}
          />
        </td>
        <td className="p-1" style={{ borderRight: `1px solid ${cardBorder}` }}>
          <input
            type="text"
            value={item.yusho || ''}
            onChange={(e) => updateItem(side, index, 'yusho', e.target.value)}
            className="w-full px-1 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
          />
        </td>
        <td className="p-1" style={{ borderRight: `1px solid ${cardBorder}` }}>
          <input
            type="text"
            value={item.remarks || ''}
            onChange={(e) => updateItem(side, index, 'remarks', e.target.value)}
            className="w-full px-1 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
          />
        </td>
        <td className="p-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setEditingItem(isEditing ? null : { side, index })}
              className="p-1 rounded hover:bg-blue-500/10 transition-colors"
              title={isEditing ? '完了' : '編集'}
            >
              {isEditing ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Edit3 size={14} className="text-blue-500" />
              )}
            </button>
            <button
              onClick={() => deleteItem(side, index)}
              className="p-1 rounded hover:bg-red-500/10 transition-colors"
              title="削除"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  // カテゴリヘッダー行
  const CategoryHeader = ({ category, side }) => (
    <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
      <td
        colSpan={5}
        className="p-2 text-xs font-bold"
        style={{ color: '#3b82f6', borderBottom: `1px solid ${cardBorder}` }}
      >
        {category}
      </td>
      <td
        className="p-1 text-center"
        style={{ borderBottom: `1px solid ${cardBorder}` }}
      >
        <button
          onClick={() => addItem(side, category)}
          className="p-1 rounded hover:bg-blue-500/10 transition-colors"
          title="項目を追加"
        >
          <Plus size={14} className="text-blue-500" />
        </button>
      </td>
    </tr>
  )

  // テーブルをレンダリング
  const renderTable = (groups, items, side) => {
    return (
      <table className="w-full border-collapse" style={{ border: `1px solid ${cardBorder}` }}>
        <thead>
          <TableHeader />
        </thead>
        <tbody>
          {Object.entries(groups).map(([category, categoryItems]) => (
            <React.Fragment key={category}>
              <CategoryHeader category={category} side={side} />
              {categoryItems.map((item) => (
                <TableRow key={`${category}-${item.originalIndex}`} item={item} index={item.originalIndex} side={side} />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    )
  }

  // カテゴリ一覧を取得（左側用）
  const leftCategories = [...new Set((data.leftItems || []).map(i => i.category))]
  const rightCategories = [...new Set((data.rightItems || []).map(i => i.category))]

  return (
    <div className="p-4 space-y-6">
      {/* タイトル */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
          <ClipboardCheck size={24} className="text-white" />
          <h2 className="text-xl font-bold text-white">工事見積確認書</h2>
        </div>
      </div>

      {/* 工事名 */}
      <div
        className="p-4 rounded-xl"
        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: textColor }}>工事名：</span>
          <span className="text-sm" style={{ color: textColor }}>{projectName || '（未設定）'}</span>
        </div>
      </div>

      {/* 負担区分テーブル（2列レイアウト） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左側テーブル */}
        <div>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
            {renderTable(leftGroups, data.leftItems || [], 'left')}
          </div>
          {/* 新規カテゴリ追加ボタン */}
          <button
            onClick={() => {
              const category = prompt('カテゴリ名を入力してください', '新規カテゴリ')
              if (category) addItem('left', category)
            }}
            className="mt-2 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
          >
            <Plus size={14} />
            新規カテゴリを追加
          </button>
        </div>

        {/* 右側テーブル */}
        <div>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
            {renderTable(rightGroups, data.rightItems || [], 'right')}
          </div>
          {/* 新規カテゴリ追加ボタン */}
          <button
            onClick={() => {
              const category = prompt('カテゴリ名を入力してください', '新規カテゴリ')
              if (category) addItem('right', category)
            }}
            className="mt-2 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
          >
            <Plus size={14} />
            新規カテゴリを追加
          </button>
        </div>
      </div>

      {/* 凡例 */}
      <div className="text-xs text-right" style={{ color: textLight }}>
        ○印は負担
      </div>

      {/* 特記事項 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-blue-500" />
          <h3 className="text-sm font-bold" style={{ color: textColor }}>特記事項</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左側特記事項 */}
          <div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${cardBorder}` }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: '#2563eb' }}>
                    <th className="p-2 text-white text-xs font-bold text-left border-r border-blue-400" style={{ width: '120px' }}>特記事項</th>
                    <th className="p-2 text-white text-xs font-bold text-left border-r border-blue-400">備考</th>
                    <th className="p-2 text-white text-xs font-bold text-center" style={{ width: '50px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.specialNotesLeft || []).map((note, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="p-1" style={{ color: textColor, borderRight: `1px solid ${cardBorder}` }}>
                        <input
                          type="text"
                          value={note.name}
                          onChange={(e) => updateSpecialNote('left', index, 'name', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
                        />
                      </td>
                      <td className="p-1" style={{ borderRight: `1px solid ${cardBorder}` }}>
                        <input
                          type="text"
                          value={note.value || ''}
                          onChange={(e) => updateSpecialNote('left', index, 'value', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => deleteSpecialNote('left', index)}
                          className="p-1 rounded hover:bg-red-500/10 transition-colors"
                          title="削除"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => addSpecialNote('left')}
              className="mt-2 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
            >
              <Plus size={14} />
              特記事項を追加
            </button>
          </div>

          {/* 右側特記事項 */}
          <div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${cardBorder}` }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: '#2563eb' }}>
                    <th className="p-2 text-white text-xs font-bold text-left border-r border-blue-400" style={{ width: '150px' }}>特記事項</th>
                    <th className="p-2 text-white text-xs font-bold text-left border-r border-blue-400">備考</th>
                    <th className="p-2 text-white text-xs font-bold text-center" style={{ width: '50px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.specialNotesRight || []).map((note, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="p-1" style={{ color: textColor, borderRight: `1px solid ${cardBorder}` }}>
                        <input
                          type="text"
                          value={note.name}
                          onChange={(e) => updateSpecialNote('right', index, 'name', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
                        />
                      </td>
                      <td className="p-1" style={{ borderRight: `1px solid ${cardBorder}` }}>
                        <input
                          type="text"
                          value={note.value || ''}
                          onChange={(e) => updateSpecialNote('right', index, 'value', e.target.value)}
                          className="w-full px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => deleteSpecialNote('right', index)}
                          className="p-1 rounded hover:bg-red-500/10 transition-colors"
                          title="削除"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => addSpecialNote('right')}
              className="mt-2 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors hover:opacity-80"
              style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
            >
              <Plus size={14} />
              特記事項を追加
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

// メインコンポーネント
export default function QuoteCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const styles = {
    cardBg: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.98)' : 'rgba(26,26,30,0.98)',
    cardBorder: isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,65,1)',
    inputBg: isOcean ? 'rgba(255,255,255,0.08)' : isLightTheme ? 'rgba(0,0,0,0.02)' : 'rgba(40,40,45,1)',
    textColor: currentBg.text,
    textLight: currentBg.textLight,
  }

  const [toast, setToast] = useState({ show: false, message: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [sheets, setSheets] = useState(createInitialSheets())
  const [activeSheet, setActiveSheet] = useState('cover')
  const [coverData, setCoverData] = useState({
    projectName: '',
    client: '',
    location: '',
    periodStart: '',
    periodEnd: '',
    validUntil: '',
    paymentTerms: '',
    manager: '',
    notes: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    // 利益管理フィールド
    salesProfit: 0,         // 営業利益（入力）→ 工事予算枠は自動計算
    salesBudget: 0,         // 営業予算（旧）
    constructionBudget: 0,  // 工事予算（旧）
    actualCost: 0,          // 実行原価
  })
  const [confirmationData, setConfirmationData] = useState(createInitialConfirmationData())

  // 編集モード時にデータを読み込む
  useEffect(() => {
    if (!isEditMode) return

    const loadQuote = async () => {
      try {
        const res = await fetch(`${API_BASE}/quotes/${id}`)
        if (!res.ok) {
          showToast('見積書が見つかりません')
          navigate('/quotes')
          return
        }

        const data = await res.json()
        console.log('Loaded quote data:', data)

        // 表紙データを設定
        setCoverData({
          projectName: data.project_name || '',
          client: data.client_name || '',
          location: data.location || '',
          periodStart: data.start_date || '',
          periodEnd: data.end_date || '',
          validUntil: data.valid_until || '',
          paymentTerms: data.payment_terms || '',
          manager: data.manager || '',
          notes: data.notes || '',
          subtotal: 0,
          tax: 0,
          total: data.total_amount || 0,
          // 利益管理フィールド
          salesProfit: data.sales_profit || 0,       // 営業利益
          salesBudget: data.sales_budget || 0,
          constructionBudget: data.construction_budget || 0,
          actualCost: data.actual_cost || 0,
          status: data.status || '',
        })

        // シート構成を作成
        const loadedSheets = [
          { id: 'cover', type: SHEET_TYPES.COVER, name: '表紙' },
        ]

        // シートを追加（新フォーマット: sheet_type対応）
        if (data.sheets && data.sheets.length > 0) {
          let detailCount = 0
          let conditionsCount = 0

          data.sheets.forEach((sheet, idx) => {
            const sheetType = sheet.sheet_type || 'detail'

            if (sheetType === 'detail') {
              detailCount++
              const items = sheet.items?.map(item => ({
                name: item.name || '',
                spec: item.spec || '',
                quantity: item.quantity?.toString() || '',
                unit: item.unit || '',
                unitPrice: item.unit_price?.toString() || '',
                amount: item.amount?.toString() || '',
                note: item.remarks || '',
                budgets: item.budgets?.map(b => ({
                  type: b.type || '労務費',
                  spec: b.spec || '',
                  quantity: b.quantity?.toString() || '',
                  unit: b.unit || '',
                  unitPrice: b.unit_price?.toString() || '',
                  amount: b.amount?.toString() || '',
                  estimatePrice: b.estimate_price?.toString() || '',
                  estimateAmount: b.estimate_amount?.toString() || '',
                  remarks: b.remarks || '',
                })) || [],
              })) || []

              // 空行を追加（最低15行）
              while (items.length < 15) {
                items.push({ name: '', spec: '', quantity: '', unit: '', unitPrice: '', amount: '', note: '', budgets: [] })
              }

              loadedSheets.push({
                id: `detail-${sheet.id || idx}`,
                type: SHEET_TYPES.DETAIL,
                name: sheet.sheet_name || `内訳${detailCount}`,
                items,
              })
            } else if (sheetType === 'conditions') {
              conditionsCount++
              const conditions = sheet.conditions?.length > 0 ? sheet.conditions : ['']
              loadedSheets.push({
                id: `conditions-${sheet.id || idx}`,
                type: SHEET_TYPES.CONDITIONS,
                name: sheet.sheet_name || (conditionsCount === 1 ? '条件書' : `条件書${conditionsCount}`),
                items: conditions,
              })
            } else if (sheetType === 'confirmation') {
              // 確認書シートのデータを読み込む
              if (sheet.confirmation_data) {
                setConfirmationData(sheet.confirmation_data)
              }
              loadedSheets.push({
                id: `confirmation-${sheet.id || idx}`,
                type: SHEET_TYPES.CONFIRMATION,
                name: sheet.sheet_name || '確認書',
                data: sheet.confirmation_data || null,
              })
            }
          })

          // 内訳シートがない場合は空のシートを追加
          if (detailCount === 0) {
            loadedSheets.push({
              id: 'detail-1',
              type: SHEET_TYPES.DETAIL,
              name: '内訳1',
              items: createEmptyRows(15),
            })
          }

          // 条件書シートがない場合は空の条件書を追加
          if (conditionsCount === 0) {
            loadedSheets.push({
              id: 'conditions',
              type: SHEET_TYPES.CONDITIONS,
              name: '条件書',
              items: [''],
            })
          }

          // 確認書シートがない場合は追加
          const hasConfirmation = loadedSheets.some(s => s.type === SHEET_TYPES.CONFIRMATION)
          if (!hasConfirmation) {
            loadedSheets.push({
              id: 'confirmation',
              type: SHEET_TYPES.CONFIRMATION,
              name: '確認書',
              data: null,
            })
          }
        } else {
          // シートがない場合は空の内訳シートを追加
          loadedSheets.push({
            id: 'detail-1',
            type: SHEET_TYPES.DETAIL,
            name: '内訳1',
            items: createEmptyRows(15),
          })

          // 旧フォーマット: 別テーブルの条件がある場合
          if (data.conditions?.length > 0) {
            loadedSheets.push({
              id: 'conditions',
              type: SHEET_TYPES.CONDITIONS,
              name: '条件書',
              items: data.conditions,
            })
          } else {
            // 条件がない場合も空の条件書を追加
            loadedSheets.push({
              id: 'conditions',
              type: SHEET_TYPES.CONDITIONS,
              name: '条件書',
              items: [''],
            })
          }

          // 確認書シートも追加
          loadedSheets.push({
            id: 'confirmation',
            type: SHEET_TYPES.CONFIRMATION,
            name: '確認書',
            data: null,
          })
        }

        setSheets(loadedSheets)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load quote:', error)
        showToast('読み込みに失敗しました')
        setLoading(false)
      }
    }

    loadQuote()
  }, [id, isEditMode])

  // 合計金額を計算（集計行を除外）
  useEffect(() => {
    let subtotal = 0
    sheets.forEach((sheet) => {
      if (sheet.type === SHEET_TYPES.DETAIL && sheet.items) {
        subtotal += sheet.items.reduce((sum, item) => {
          // 集計行は合計に含めない
          if (isSummaryRow(item.name)) return sum
          return sum + (parseFloat(item.amount) || 0)
        }, 0)
      }
    })
    const tax = Math.floor(subtotal * 0.1)
    const total = subtotal + tax

    setCoverData((prev) => ({ ...prev, subtotal, tax, total }))
  }, [sheets])

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  // PDF出力
  const handleDownloadPDF = async () => {
    if (!isEditMode || !id) return

    try {
      showToast('PDF生成中...')
      const res = await fetch(`${API_BASE}/quotes/${id}/pdf`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `見積書_${coverData.projectName || '見積書'}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('PDFをダウンロードしました')
      } else {
        showToast('PDF生成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
      showToast('エラーが発生しました')
    }
  }

  // シート追加メニュー表示状態
  const [showAddMenu, setShowAddMenu] = useState(false)

  // 内訳シートを追加
  const addDetailSheet = () => {
    console.log('addDetailSheet called')
    const detailCount = sheets.filter((s) => s.type === SHEET_TYPES.DETAIL).length
    const newSheet = {
      id: `detail-${Date.now()}`,
      type: SHEET_TYPES.DETAIL,
      name: `内訳${detailCount + 1}`,
      items: createEmptyRows(15),
    }

    setSheets([...sheets, newSheet])
    setActiveSheet(newSheet.id)
    setShowAddMenu(false)
  }

  // 条件書シートを追加
  const addConditionsSheet = () => {
    console.log('addConditionsSheet called')
    const conditionsCount = sheets.filter((s) => s.type === SHEET_TYPES.CONDITIONS).length
    const newSheet = {
      id: `conditions-${Date.now()}`,
      type: SHEET_TYPES.CONDITIONS,
      name: conditionsCount === 0 ? '条件書' : `条件書${conditionsCount + 1}`,
      items: [''],
    }

    setSheets([...sheets, newSheet])
    setActiveSheet(newSheet.id)
    setShowAddMenu(false)
  }

  // シートを削除（内訳・条件書両方可）
  const removeSheet = (sheetId, e) => {
    e.stopPropagation()
    const sheet = sheets.find((s) => s.id === sheetId)
    if (!sheet) return

    // 表紙は削除不可
    if (sheet.type === SHEET_TYPES.COVER) return

    // 内訳シートは最低1つ必要
    if (sheet.type === SHEET_TYPES.DETAIL) {
      if (sheets.filter((s) => s.type === SHEET_TYPES.DETAIL).length <= 1) {
        showToast('最低1つの内訳シートが必要です')
        return
      }
    }

    setSheets(sheets.filter((s) => s.id !== sheetId))
    setActiveSheet('cover')
  }

  // シート名を更新
  const updateSheetName = (sheetId, name) => {
    setSheets(sheets.map((s) => (s.id === sheetId ? { ...s, name } : s)))
  }

  // シート内容を更新
  const updateSheetItems = (sheetId, items) => {
    setSheets(sheets.map((s) => (s.id === sheetId ? { ...s, items } : s)))
  }

  // 行を追加
  const addRow = (sheetId) => {
    const sheet = sheets.find((s) => s.id === sheetId)
    if (!sheet || sheet.type !== SHEET_TYPES.DETAIL) return

    updateSheetItems(sheetId, [
      ...sheet.items,
      { name: '', spec: '', quantity: '', unit: '', unitPrice: '', amount: '', note: '', budgets: [] },
    ])
  }

  // 行を削除
  const deleteRow = (sheetId, rowIndex) => {
    const sheet = sheets.find((s) => s.id === sheetId)
    if (!sheet || sheet.type !== SHEET_TYPES.DETAIL) return

    const newItems = sheet.items.filter((_, i) => i !== rowIndex)
    updateSheetItems(sheetId, newItems.length ? newItems : createEmptyRows(1))
  }

  // 保存
  const handleSave = async () => {
    if (!coverData.projectName) {
      showToast('工事名を入力してください')
      setActiveSheet('cover')
      return
    }

    setSaving(true)
    try {
      // すべてのシート（内訳・条件書・確認書）を順序通りに変換
      const allSheets = sheets
        .filter((s) => s.type !== SHEET_TYPES.COVER)
        .map((sheet, index) => {
          if (sheet.type === SHEET_TYPES.DETAIL) {
            return {
              type: 'detail',
              name: sheet.name,
              order: index,
              items: sheet.items.map((item) => {
                return {
                  name: item.name || '',
                  spec: item.spec || '',
                  quantity: parseFloat(item.quantity) || 0,
                  unit: item.unit || '',
                  unit_price: parseInt(item.unitPrice) || 0,
                  amount: parseInt(item.amount) || 0,
                  remarks: item.note || '',
                  budgets: (item.budgets || []).map((b) => {
                    const budgetQty = parseFloat(b.quantity) || 0
                    const budgetPrice = parseInt(b.unitPrice) || 0
                    const estPrice = parseInt(b.estimatePrice) || 0
                    return {
                      type: b.type || '労務費',
                      spec: b.spec || '',
                      quantity: budgetQty,
                      unit: b.unit || '',
                      unit_price: budgetPrice,
                      amount: Math.round(budgetQty * budgetPrice),
                      estimate_price: estPrice,
                      estimate_amount: Math.round(budgetQty * estPrice),
                      remarks: b.remarks || '',
                    }
                  }),
                }
              }),
            }
          } else if (sheet.type === SHEET_TYPES.CONDITIONS) {
            // 条件書シート
            return {
              type: 'conditions',
              name: sheet.name,
              order: index,
              conditions: (sheet.items || []).filter(Boolean),
            }
          } else if (sheet.type === SHEET_TYPES.CONFIRMATION) {
            // 確認書シート
            return {
              type: 'confirmation',
              name: sheet.name,
              order: index,
              confirmation_data: confirmationData,
            }
          }
          return null
        }).filter(Boolean)

      const payload = {
        project_name: coverData.projectName,
        client_name: coverData.client,
        location: coverData.location,
        start_date: coverData.periodStart || '',
        end_date: coverData.periodEnd || '',
        valid_until: coverData.validUntil || '',
        payment_terms: coverData.paymentTerms || '',
        manager: coverData.manager || '',
        notes: coverData.notes || '',
        all_sheets: allSheets,
        // 利益管理フィールド
        sales_profit: parseInt(coverData.salesProfit) || 0,     // 営業利益
        sales_budget: parseInt(coverData.salesBudget) || 0,
        construction_budget: parseInt(coverData.constructionBudget) || 0,
        actual_cost: parseInt(coverData.actualCost) || 0,
      }

      console.log('Saving quote payload:', payload)

      const url = isEditMode ? `${API_BASE}/quotes/${id}` : `${API_BASE}/quotes`
      const method = isEditMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const result = await res.json()
        console.log('Quote saved:', result)
        showToast(isEditMode ? '見積書を更新しました' : '見積書を作成しました')
        setTimeout(() => navigate('/quotes'), 1500)
      } else {
        const errorText = await res.text()
        console.error('Failed to save quote:', res.status, errorText)
        showToast('保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save quote:', error)
      showToast('ネットワークエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const activeSheetData = sheets.find((s) => s.id === activeSheet)

  // シートアイコンを取得
  const getSheetIcon = (type) => {
    switch (type) {
      case SHEET_TYPES.COVER:
        return <FileText size={14} />
      case SHEET_TYPES.DETAIL:
        return <FileSpreadsheet size={14} />
      case SHEET_TYPES.CONDITIONS:
        return <List size={14} />
      case SHEET_TYPES.CONFIRMATION:
        return <ClipboardCheck size={14} />
      default:
        return null
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBg.bg }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: styles.textLight }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: currentBg.bg }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: currentBg.headerBg,
          borderBottom: `1px solid ${styles.cardBorder}`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
              style={{ color: styles.textColor }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: styles.textColor }}>
                {isEditMode ? '見積編集' : '見積作成'}
              </h1>
              <p className="text-xs" style={{ color: styles.textLight }}>
                {coverData.projectName || '新規見積書'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* シートタブ（上部） */}
      <div
        className="sticky top-14 z-40 flex items-center border-b"
        style={{
          background: isLightTheme ? '#f3f4f6' : '#18181b',
          borderColor: styles.cardBorder,
        }}
      >
        {/* タブエリア（スクロール可能） */}
        <div className="flex-1 flex items-center gap-1 px-3 py-2 overflow-x-auto">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheet(sheet.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeSheet === sheet.id ? 'shadow-sm' : 'hover:bg-white/50'
              }`}
              style={{
                background: activeSheet === sheet.id ? styles.cardBg : 'transparent',
                color: activeSheet === sheet.id
                  ? (sheet.type === SHEET_TYPES.CONDITIONS ? '#8b5cf6' : sheet.type === SHEET_TYPES.CONFIRMATION ? '#10b981' : '#3b82f6')
                  : styles.textLight,
                borderBottom: activeSheet === sheet.id
                  ? `2px solid ${sheet.type === SHEET_TYPES.CONDITIONS ? '#8b5cf6' : sheet.type === SHEET_TYPES.CONFIRMATION ? '#10b981' : '#3b82f6'}`
                  : '2px solid transparent',
              }}
            >
              {getSheetIcon(sheet.type)}
              <span>{sheet.name}</span>

              {/* 内訳・条件書の削除ボタン（表紙以外、内訳は最低1つ必要） */}
              {sheet.type !== SHEET_TYPES.COVER && (
                (sheet.type === SHEET_TYPES.CONDITIONS ||
                 (sheet.type === SHEET_TYPES.DETAIL && sheets.filter((s) => s.type === SHEET_TYPES.DETAIL).length > 1)
                ) && (
                  <button
                    onClick={(e) => removeSheet(sheet.id, e)}
                    className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )
              )}
            </button>
          ))}
        </div>

        {/* シート追加ボタン（スクロール外） */}
        <div className="relative px-2 flex-shrink-0">
          <button
            onClick={() => {
              console.log('+ button clicked, showAddMenu:', showAddMenu)
              setShowAddMenu(!showAddMenu)
            }}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-blue-500/10 text-blue-500 transition-colors"
            title="シートを追加"
          >
            <Plus size={18} />
          </button>

          {/* 追加メニュー */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl border overflow-hidden"
                style={{
                  background: styles.cardBg,
                  borderColor: styles.cardBorder,
                  minWidth: '140px',
                }}
              >
                <button
                  onClick={addDetailSheet}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 hover:bg-blue-500/10 transition-colors"
                  style={{ color: styles.textColor }}
                >
                  <FileSpreadsheet size={16} className="text-blue-500" />
                  内訳追加
                </button>
                <div className="border-t" style={{ borderColor: styles.cardBorder }} />
                <button
                  onClick={addConditionsSheet}
                  className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2 hover:bg-purple-500/10 transition-colors"
                  style={{ color: styles.textColor }}
                >
                  <List size={16} className="text-purple-500" />
                  条件書追加
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ background: styles.cardBg, paddingBottom: '180px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSheet}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeSheetData?.type === SHEET_TYPES.COVER && (
              <CoverSheet
                data={coverData}
                onChange={(key, value) => setCoverData({ ...coverData, [key]: value })}
                styles={styles}
              />
            )}

            {activeSheetData?.type === SHEET_TYPES.DETAIL && (
              <DetailSheet
                sheet={activeSheetData}
                items={activeSheetData.items}
                onChange={(items) => updateSheetItems(activeSheet, items)}
                onAddRow={() => addRow(activeSheet)}
                onDeleteRow={(index) => deleteRow(activeSheet, index)}
                onSheetNameChange={(name) => updateSheetName(activeSheet, name)}
                styles={styles}
              />
            )}

            {activeSheetData?.type === SHEET_TYPES.CONDITIONS && (
              <ConditionsSheet
                items={activeSheetData.items}
                onChange={(items) => updateSheetItems(activeSheet, items)}
                styles={styles}
              />
            )}

            {activeSheetData?.type === SHEET_TYPES.CONFIRMATION && (
              <ConfirmationSheet
                data={confirmationData}
                onChange={setConfirmationData}
                projectName={coverData.projectName}
                styles={styles}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ボタンエリア（フッターナビの上に固定） */}
      <div
        className="fixed left-0 right-0 flex items-center gap-3 px-4 py-3"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          background: styles.cardBg,
          borderTop: `1px solid ${styles.cardBorder}`,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="py-3.5 px-4 rounded-xl font-bold text-sm transition-colors"
          style={{ background: styles.inputBg, color: styles.textLight }}
        >
          キャンセル
        </button>

        {isEditMode && (
          <button
            onClick={handleDownloadPDF}
            className="py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
          >
            <Download size={18} />
            PDF
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-lg"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save size={18} />
              {isEditMode ? '変更を保存' : '見積書を作成'}
            </>
          )}
        </button>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
