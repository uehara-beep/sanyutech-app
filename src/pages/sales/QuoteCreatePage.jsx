/**
 * 見積作成画面（設計書3.1準拠）
 * 画面ID: SCR-SALES-002
 * URL: /sales/quote-create
 * アクセス権限: 営業、管理者
 *
 * 機能:
 * - 手入力による見積作成
 * - Excel取込（フロント解析→プレビュー→保存）
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertCircle, Upload, X, CheckCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { API_BASE, authGet, authPost, authPut } from '../../config/api'
import { useThemeStore, backgroundStyles } from '../../store'

// 単位の選択肢（設計書3.1.3）
const UNIT_OPTIONS = ['式', 'm', 'm2', '個', '台']

// 空の明細行を生成
const createEmptyItem = (seq = 0) => ({
  seq,
  category: '',      // 分類
  name: '',          // 項目名（必須）
  specification: '', // 仕様
  quantity: '',      // 数量（必須）
  unit: '式',        // 単位（必須、デフォルト「式」）
  unit_price: '',    // 単価（必須）
  cost_price: '',    // 原価
  amount: 0,         // 金額（自動計算）
})

// 今日から30日後の日付を取得
const getDefaultValidUntil = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

// 今日の日付
const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

// 列名とフィールドのマッピング
const COLUMN_MAPPING = {
  '分類': 'category',
  'カテゴリ': 'category',
  '項目名': 'name',
  '名称': 'name',
  '品名': 'name',
  '仕様': 'specification',
  '規格': 'specification',
  'スペック': 'specification',
  '数量': 'quantity',
  '単位': 'unit',
  '単価': 'unit_price',
  '原価': 'cost_price',
  '金額': 'amount',
  '合計': 'amount',
}

// フィールド定義（列マッピングUI用）
const FIELD_DEFINITIONS = [
  { key: 'category', label: '分類', required: false },
  { key: 'name', label: '項目名', required: true },
  { key: 'specification', label: '仕様', required: false },
  { key: 'quantity', label: '数量', required: true },
  { key: 'unit', label: '単位', required: false },
  { key: 'unit_price', label: '単価', required: true },
  { key: 'cost_price', label: '原価', required: false },
  { key: 'amount', label: '金額', required: false },
]

// テンプレートヘッダー
const TEMPLATE_HEADERS = ['分類', '項目名', '仕様', '数量', '単位', '単価', '原価', '金額']

export default function QuoteCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()  // 編集モード時のID
  const isEditMode = !!id
  const fileInputRef = useRef(null)

  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  // スタイル
  const cardBg = currentBg.cardBg || 'rgba(255, 255, 255, 0.95)'
  const textColor = currentBg.textColor || '#1e293b'
  const textLight = currentBg.textLight || '#64748b'
  const inputBg = currentBg.inputBg || '#f8fafc'
  const cardBorder = currentBg.cardBorder || '#e2e8f0'

  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',           // 案件名
    client_id: '',      // 得意先ID
    client_name: '',    // 得意先名（表示用）
    valid_until: getDefaultValidUntil(), // 有効期限
    notes: '',          // 備考
  })

  // 明細データ
  const [items, setItems] = useState([createEmptyItem(0)])

  // 得意先マスタ
  const [clients, setClients] = useState([])

  // バリデーションエラー
  const [errors, setErrors] = useState({})

  // ローディング・トースト
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // 合計金額
  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 })

  // Excel取込用State
  const [excelPreview, setExcelPreview] = useState({
    show: false,
    items: [],
    errors: [],
    columnMap: {},        // フィールド→列インデックス
    detectedFields: [],   // 自動検出されたフィールド
    headers: [],          // Excelのヘッダー行
    rawData: [],          // 生データ（再解析用）
    importMode: 'add',    // 'add' or 'replace'
  })
  const [excelParsing, setExcelParsing] = useState(false)

  // 得意先マスタを取得
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await authGet(`${API_BASE}/clients`)
        setClients(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('得意先取得エラー:', error)
      }
    }
    fetchClients()
  }, [])

  // 編集モード時にデータ取得
  useEffect(() => {
    if (isEditMode) {
      const fetchQuote = async () => {
        setLoading(true)
        try {
          const data = await authGet(`${API_BASE}/quotes/${id}`)
          setFormData({
            name: data.title || data.name || '',
            client_id: data.client_id || '',
            client_name: data.client_name || '',
            valid_until: data.valid_until || getDefaultValidUntil(),
            notes: data.notes || '',
          })
          if (data.items && data.items.length > 0) {
            setItems(data.items.map((item, idx) => ({
              ...createEmptyItem(idx),
              ...item,
              quantity: item.quantity?.toString() || '',
              unit_price: item.unit_price?.toString() || '',
              cost_price: item.cost_price?.toString() || '',
            })))
          }
        } catch (error) {
          showToast('データの取得に失敗しました', 'error')
        } finally {
          setLoading(false)
        }
      }
      fetchQuote()
    }
  }, [id, isEditMode])

  // 合計金額の計算
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const tax = Math.floor(subtotal * 0.1)
    setTotals({ subtotal, tax, total: subtotal + tax })
  }, [items])

  // トースト表示
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  // フォーム入力変更
  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // エラーをクリア
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }))
    }
  }

  // 得意先選択
  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === parseInt(clientId))
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client?.name || '',
    }))
    if (errors.client_id) {
      setErrors(prev => ({ ...prev, client_id: '' }))
    }
  }

  // 明細変更
  const handleItemChange = (index, key, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [key]: value }

    // 金額の自動計算（数量 × 単価）
    if (key === 'quantity' || key === 'unit_price') {
      const qty = parseFloat(key === 'quantity' ? value : newItems[index].quantity) || 0
      const price = parseFloat(key === 'unit_price' ? value : newItems[index].unit_price) || 0
      newItems[index].amount = Math.floor(qty * price)
    }

    setItems(newItems)

    // 明細エラーをクリア
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }))
    }
  }

  // 行追加
  const handleAddRow = () => {
    setItems(prev => [...prev, createEmptyItem(prev.length)])
  }

  // 行削除
  const handleDeleteRow = (index) => {
    if (items.length === 1) {
      showToast('明細は1行以上必要です', 'error')
      return
    }
    if (window.confirm('この明細行を削除しますか？')) {
      setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, seq: i })))
    }
  }

  // Excel取込: ファイル選択
  const handleExcelSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイル形式チェック
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      showToast('Excel形式(.xlsx, .xls)を選択してください', 'error')
      return
    }

    setExcelParsing(true)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 最初のシートを読み込み
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        parseExcelData(jsonData)
      } catch (error) {
        console.error('Excel解析エラー:', error)
        showToast('Excelファイルの読み込みに失敗しました', 'error')
      } finally {
        setExcelParsing(false)
        // inputをリセット
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
    reader.onerror = () => {
      showToast('ファイルの読み込みに失敗しました', 'error')
      setExcelParsing(false)
    }
    reader.readAsArrayBuffer(file)
  }

  // Excelテンプレートダウンロード
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ['電気工事', '配線工事', 'VVF2.0-2C', '100', 'm', '500', '300', '50000'],
      ['', '照明器具取付', 'LED100W', '10', '台', '15000', '10000', '150000'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '見積明細')
    // 列幅設定
    ws['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
    ]
    XLSX.writeFile(wb, '見積明細テンプレート.xlsx')
  }

  // Excel解析（ヘッダー検出・列マッピング）
  const parseExcelData = (rows) => {
    if (!rows || rows.length < 2) {
      showToast('データが見つかりません', 'error')
      return
    }

    // ヘッダー行を検出
    let headerRowIndex = -1
    let columnMap = {}
    let detectedFields = []

    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i]
      if (!row) continue

      const tempMap = {}
      const tempDetected = []

      for (let j = 0; j < row.length; j++) {
        const cellValue = String(row[j] || '').trim()
        for (const [key, field] of Object.entries(COLUMN_MAPPING)) {
          if (cellValue.includes(key) && tempMap[field] === undefined) {
            tempMap[field] = j
            tempDetected.push(field)
            break
          }
        }
      }

      if (tempDetected.length >= 2) {
        headerRowIndex = i
        columnMap = tempMap
        detectedFields = tempDetected
        break
      }
    }

    // ヘッダーが見つからない場合
    if (headerRowIndex === -1) {
      headerRowIndex = 0
      columnMap = { name: 0, specification: 1, quantity: 2, unit: 3, unit_price: 4, amount: 5 }
      detectedFields = []
    }

    const headers = rows[headerRowIndex] || []
    const rawData = rows.slice(headerRowIndex + 1)

    // アイテム解析
    const { parsedItems, parseErrors } = parseItemsFromRaw(rawData, columnMap)

    setExcelPreview({
      show: true,
      items: parsedItems,
      errors: parseErrors,
      columnMap,
      detectedFields,
      headers: headers.map((h, i) => ({ index: i, label: String(h || `列${i + 1}`) })),
      rawData,
      importMode: 'add',
    })
  }

  // 生データからアイテム解析（列マッピング指定）
  const parseItemsFromRaw = (rawData, columnMap) => {
    const parseErrors = []
    const parsedItems = []

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.every(cell => !cell && cell !== 0)) continue

      const item = createEmptyItem(parsedItems.length)
      let hasData = false

      // 各フィールドを取得（B-2: 数値型変換、空値は安全に扱う）
      if (columnMap.category !== undefined) {
        item.category = String(row[columnMap.category] || '').trim()
      }
      if (columnMap.name !== undefined) {
        item.name = String(row[columnMap.name] || '').trim()
        if (item.name) hasData = true
      }
      if (columnMap.specification !== undefined) {
        item.specification = String(row[columnMap.specification] || '').trim()
      }
      if (columnMap.quantity !== undefined) {
        const qtyVal = row[columnMap.quantity]
        const qty = parseFloat(qtyVal)
        if (qtyVal !== undefined && qtyVal !== '' && isNaN(qty)) {
          parseErrors.push({ row: i + 2, message: `数量「${qtyVal}」を数値に変換できません` })
        }
        // B-2: 空値は0として扱う
        item.quantity = isNaN(qty) ? '0' : qty.toString()
      }
      if (columnMap.unit !== undefined) {
        const unitVal = String(row[columnMap.unit] || '').trim()
        item.unit = UNIT_OPTIONS.includes(unitVal) ? unitVal : '式'
      }
      if (columnMap.unit_price !== undefined) {
        const priceVal = row[columnMap.unit_price]
        const price = parseFloat(String(priceVal).replace(/[,，]/g, ''))
        if (priceVal !== undefined && priceVal !== '' && isNaN(price)) {
          parseErrors.push({ row: i + 2, message: `単価「${priceVal}」を数値に変換できません` })
        }
        // B-2: 空値は0として扱う
        item.unit_price = isNaN(price) ? '0' : Math.floor(price).toString()
      }
      if (columnMap.cost_price !== undefined) {
        const costVal = row[columnMap.cost_price]
        const cost = parseFloat(String(costVal).replace(/[,，]/g, ''))
        // B-2: 空値は0として扱う
        item.cost_price = isNaN(cost) ? '0' : Math.floor(cost).toString()
      }
      if (columnMap.amount !== undefined) {
        const amtVal = row[columnMap.amount]
        const amt = parseFloat(String(amtVal).replace(/[,，]/g, ''))
        item.amount = isNaN(amt) ? 0 : Math.floor(amt)
      }

      // B-3: 金額がない場合は quantity * unit_price を生成
      if (!item.amount || item.amount === 0) {
        const qty = parseFloat(item.quantity) || 0
        const price = parseFloat(item.unit_price) || 0
        item.amount = Math.floor(qty * price)
      }

      if (hasData) {
        parsedItems.push(item)
      }
    }

    return { parsedItems, parseErrors }
  }

  // 列マッピング変更時の再解析
  const handleColumnMapChange = (field, columnIndex) => {
    const newColumnMap = { ...excelPreview.columnMap }
    if (columnIndex === '') {
      delete newColumnMap[field]
    } else {
      newColumnMap[field] = parseInt(columnIndex)
    }

    const { parsedItems, parseErrors } = parseItemsFromRaw(excelPreview.rawData, newColumnMap)

    setExcelPreview(prev => ({
      ...prev,
      columnMap: newColumnMap,
      items: parsedItems,
      errors: parseErrors,
    }))
  }

  // インポートモード変更
  const handleImportModeChange = (mode) => {
    setExcelPreview(prev => ({ ...prev, importMode: mode }))
  }

  // 必須フィールドが揃っているかチェック
  const hasRequiredFields = () => {
    const requiredFields = FIELD_DEFINITIONS.filter(f => f.required).map(f => f.key)
    return requiredFields.every(field => excelPreview.columnMap[field] !== undefined)
  }

  // Excel取込: プレビュー確定
  const handleExcelConfirm = () => {
    // 必須フィールドチェック
    if (!hasRequiredFields()) {
      showToast('必須項目（項目名、数量、単価）を割り当ててください', 'error')
      return
    }

    // 置換モードの場合は確認ダイアログ
    if (excelPreview.importMode === 'replace') {
      const existingCount = items.filter(item => item.name.trim()).length
      if (existingCount > 0) {
        if (!window.confirm(`既存の明細 ${existingCount}件 を削除して置換します。\nこの操作は元に戻せません。続行しますか？`)) {
          return
        }
      }
    }

    // B-1: QuoteItem正規化
    const normalizedItems = excelPreview.items.map((item, idx) => ({
      seq: idx,
      category: item.category || '',
      name: item.name || '',
      specification: item.specification || '',
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit || '式',
      unit_price: parseInt(item.unit_price) || 0,
      cost_price: parseInt(item.cost_price) || 0,
      amount: item.amount || 0,
    }))

    if (excelPreview.importMode === 'replace') {
      // 置換: 既存明細をクリアして新規追加
      setItems(normalizedItems.map((item, idx) => ({
        ...item,
        seq: idx,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        cost_price: item.cost_price.toString(),
      })))
    } else {
      // 追加: 既存明細の後ろに追加
      const existingItems = items.filter(item => item.name.trim())
      const startSeq = existingItems.length
      const newItems = normalizedItems.map((item, idx) => ({
        ...item,
        seq: startSeq + idx,
        quantity: item.quantity.toString(),
        unit_price: item.unit_price.toString(),
        cost_price: item.cost_price.toString(),
      }))

      if (existingItems.length === 0) {
        setItems(newItems)
      } else {
        setItems([...existingItems, ...newItems])
      }
    }

    setExcelPreview({
      show: false, items: [], errors: [], columnMap: {},
      detectedFields: [], headers: [], rawData: [], importMode: 'add',
    })
    showToast(`${normalizedItems.length}件の明細を${excelPreview.importMode === 'replace' ? '置換' : '追加'}しました`, 'success')
  }

  // Excel取込: プレビューキャンセル
  const handleExcelCancel = () => {
    setExcelPreview({
      show: false, items: [], errors: [], columnMap: {},
      detectedFields: [], headers: [], rawData: [], importMode: 'add',
    })
  }

  // バリデーション（設計書3.1.5）
  const validate = () => {
    const newErrors = {}

    // 案件名チェック
    if (!formData.name.trim()) {
      newErrors.name = '案件名を入力してください'
    } else if (formData.name.length > 100) {
      newErrors.name = '案件名は100文字以内で入力してください'
    }

    // 得意先チェック
    if (!formData.client_id) {
      newErrors.client_id = '得意先を選択してください'
    }

    // 有効期限チェック
    if (!formData.valid_until) {
      newErrors.valid_until = '有効期限を入力してください'
    } else if (formData.valid_until < getTodayString()) {
      newErrors.valid_until = '有効期限は今日以降を指定してください'
    }

    // 備考チェック
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = '備考は500文字以内で入力してください'
    }

    // 明細チェック
    const validItems = items.filter(item => item.name.trim())
    if (validItems.length === 0) {
      newErrors.items = '明細を1行以上入力してください'
    }

    // 明細の個別チェック
    items.forEach((item, index) => {
      if (item.name.trim()) {
        // 項目名があれば他の必須項目もチェック
        if (item.name.length > 100) {
          newErrors[`item_${index}_name`] = '項目名は100文字以内で入力してください'
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          newErrors[`item_${index}_quantity`] = '数量は1以上を入力してください'
        }
        if (!item.unit) {
          newErrors[`item_${index}_unit`] = '単位を選択してください'
        }
        if (!item.unit_price || parseFloat(item.unit_price) < 0) {
          newErrors[`item_${index}_unit_price`] = '単価を入力してください'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 下書き保存（設計書3.1.4）
  const handleSaveDraft = async () => {
    // 下書きはバリデーションを緩くする（案件名のみ必須）
    if (!formData.name.trim()) {
      setErrors({ name: '案件名を入力してください' })
      showToast('案件名を入力してください', 'error')
      return
    }

    await saveQuote('draft')
  }

  // 見積を作成（提出）（設計書3.1.4）
  const handleSubmit = async () => {
    if (!validate()) {
      showToast('入力内容を確認してください', 'error')
      return
    }

    await saveQuote('submitted')
  }

  // 保存処理
  const saveQuote = async (status) => {
    setSaving(true)
    try {
      const validItems = items.filter(item => item.name.trim())
      const payload = {
        title: formData.name,
        project_name: formData.name,
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
        client_name: formData.client_name,
        valid_until: formData.valid_until,
        notes: formData.notes,
        status: status === 'submitted' ? '提出済' : '下書き',
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        items: validItems.map((item, idx) => ({
          seq: idx,
          name: item.name,
          specification: item.specification || item.spec || '',
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit || '式',
          unit_price: parseInt(item.unit_price) || 0,
          amount: item.amount || 0,
        })),
      }

      if (isEditMode) {
        await authPut(`${API_BASE}/quotes/${id}`, payload)
        showToast('保存しました', 'success')
      } else {
        const result = await authPost(`${API_BASE}/quotes`, payload)
        showToast('見積を作成しました', 'success')

        // 提出の場合は見積詳細へ、下書きは一覧へ
        if (status === 'submitted' && result.id) {
          setTimeout(() => navigate(`/quotes/${result.id}/edit`), 500)
        } else {
          setTimeout(() => navigate('/quotes'), 500)
        }
        return
      }

      // 編集モードの場合は一覧に戻る
      setTimeout(() => navigate('/quotes'), 500)
    } catch (error) {
      console.error('保存エラー:', error)
      showToast('保存に失敗しました。再度お試しください。', 'error')
    } finally {
      setSaving(false)
    }
  }

  // キャンセル
  const handleCancel = () => {
    if (window.confirm('入力内容を破棄して戻りますか？')) {
      navigate('/quotes')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ color: textColor }}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: cardBg }}>
        <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{isEditMode ? '見積編集' : '見積作成'}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 基本情報カード */}
        <div className="rounded-2xl p-5" style={{ background: cardBg }}>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            基本情報
          </h2>

          <div className="space-y-4">
            {/* 案件名 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                案件名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="例: ○○道路舗装工事"
                maxLength={100}
                className={`w-full px-4 py-3 rounded-xl text-sm ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* 得意先 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                得意先 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm ${errors.client_id ? 'ring-2 ring-red-500' : ''}`}
                style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
              >
                <option value="">選択してください</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.client_id}
                </p>
              )}
            </div>

            {/* 有効期限 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                有効期限 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => handleFormChange('valid_until', e.target.value)}
                min={getTodayString()}
                className={`w-full px-4 py-3 rounded-xl text-sm ${errors.valid_until ? 'ring-2 ring-red-500' : ''}`}
                style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
              />
              {errors.valid_until && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.valid_until}
                </p>
              )}
            </div>

            {/* 備考 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">備考</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="備考があれば入力"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
              />
              <p className="text-xs mt-1" style={{ color: textLight }}>
                {formData.notes.length}/500文字
              </p>
            </div>
          </div>
        </div>

        {/* 明細カード */}
        <div className="rounded-2xl p-5" style={{ background: cardBg }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">明細</h2>
            <div className="flex items-center gap-2">
              {/* テンプレートダウンロード */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100"
                style={{ color: textLight }}
              >
                <Download className="w-4 h-4" />
                テンプレート
              </button>
              {/* Excel取込ボタン */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={excelParsing}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {excelParsing ? '読込中...' : 'Excel取込'}
              </button>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" /> 行追加
              </button>
            </div>
          </div>

          {errors.items && (
            <p className="text-red-500 text-sm mb-3 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> {errors.items}
            </p>
          )}

          {/* 明細テーブル */}
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: textLight, width: '60px' }}>分類</th>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: textLight }}>
                    項目名 <span className="text-red-500">*</span>
                  </th>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: textLight, width: '120px' }}>仕様</th>
                  <th className="px-3 py-2 text-right font-medium" style={{ color: textLight, width: '80px' }}>
                    数量 <span className="text-red-500">*</span>
                  </th>
                  <th className="px-3 py-2 text-center font-medium" style={{ color: textLight, width: '70px' }}>
                    単位 <span className="text-red-500">*</span>
                  </th>
                  <th className="px-3 py-2 text-right font-medium" style={{ color: textLight, width: '100px' }}>
                    単価 <span className="text-red-500">*</span>
                  </th>
                  <th className="px-3 py-2 text-right font-medium" style={{ color: textLight, width: '100px' }}>原価</th>
                  <th className="px-3 py-2 text-right font-medium" style={{ color: textLight, width: '100px' }}>金額</th>
                  <th className="px-3 py-2" style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    {/* 分類 */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.category || ''}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        maxLength={50}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 項目名 */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        maxLength={100}
                        className={`w-full px-2 py-1.5 rounded text-sm ${errors[`item_${index}_name`] ? 'ring-2 ring-red-500' : ''}`}
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 仕様 */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.specification || item.spec || ''}
                        onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                        maxLength={200}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 数量 */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-2 py-1.5 rounded text-sm text-right ${errors[`item_${index}_quantity`] ? 'ring-2 ring-red-500' : ''}`}
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 単位 */}
                    <td className="px-3 py-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded text-sm"
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      >
                        {UNIT_OPTIONS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </td>
                    {/* 単価 */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        min="0"
                        className={`w-full px-2 py-1.5 rounded text-sm text-right ${errors[`item_${index}_unit_price`] ? 'ring-2 ring-red-500' : ''}`}
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 原価 */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.cost_price || ''}
                        onChange={(e) => handleItemChange(index, 'cost_price', e.target.value)}
                        min="0"
                        className="w-full px-2 py-1.5 rounded text-sm text-right"
                        style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                      />
                    </td>
                    {/* 金額 */}
                    <td className="px-3 py-2 text-right font-medium">
                      ¥{(item.amount || 0).toLocaleString()}
                    </td>
                    {/* 削除 */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDeleteRow(index)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 合計金額カード */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
          <div className="text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="opacity-80">小計</span>
              <span className="text-lg">¥{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="opacity-80">消費税(10%)</span>
              <span className="text-lg">¥{totals.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/30">
              <span className="font-bold">合計（税込）</span>
              <span className="text-2xl font-bold">¥{totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* フッターボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-3" style={{ background: cardBg }}>
        <button
          onClick={handleCancel}
          className="flex-1 py-3 rounded-xl font-medium"
          style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
        >
          キャンセル
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-medium border border-blue-500 text-blue-500 hover:bg-blue-50 disabled:opacity-50"
        >
          {saving ? '...' : '下書き保存'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '...' : '見積を作成'}
        </button>
      </div>

      {/* トースト */}
      {toast.show && (
        <div
          className={`fixed top-20 right-4 px-4 py-3 rounded-xl shadow-lg z-50 ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}

      {/* Excel取込プレビューモーダル */}
      {excelPreview.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: cardBg }}
          >
            {/* モーダルヘッダー */}
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: cardBorder }}>
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold">Excel取込プレビュー</h3>
              </div>
              <button onClick={handleExcelCancel} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 列マッピングUI */}
            <div className="px-5 py-3 border-b" style={{ borderColor: cardBorder, background: inputBg }}>
              <div className="text-sm font-medium mb-2">列マッピング</div>
              <div className="flex flex-wrap gap-3">
                {FIELD_DEFINITIONS.map(field => {
                  const isDetected = excelPreview.detectedFields.includes(field.key)
                  const currentValue = excelPreview.columnMap[field.key]
                  return (
                    <div key={field.key} className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: textLight }}>
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}:
                      </span>
                      {isDetected ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          {excelPreview.headers.find(h => h.index === currentValue)?.label || `列${currentValue + 1}`}
                        </span>
                      ) : (
                        <select
                          value={currentValue ?? ''}
                          onChange={(e) => handleColumnMapChange(field.key, e.target.value)}
                          className="text-xs px-2 py-1 rounded border"
                          style={{ borderColor: cardBorder }}
                        >
                          <option value="">未割当</option>
                          {excelPreview.headers.map(h => (
                            <option key={h.index} value={h.index}>{h.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
              {!hasRequiredFields() && (
                <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  必須項目（項目名、数量、単価）を割り当ててください
                </div>
              )}
            </div>

            {/* エラー表示 */}
            {excelPreview.errors.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-700 mb-1">注意事項</div>
                    <ul className="text-amber-600 space-y-0.5">
                      {excelPreview.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>
                          {err.row > 0 && `行${err.row}: `}{err.message}
                        </li>
                      ))}
                      {excelPreview.errors.length > 5 && (
                        <li>...他 {excelPreview.errors.length - 5} 件</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* プレビューテーブル */}
            <div className="flex-1 overflow-auto p-5">
              <div className="text-sm mb-3" style={{ color: textLight }}>
                {excelPreview.items.length}件の明細を取り込みます
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                      <th className="px-2 py-2 text-left font-medium" style={{ color: textLight }}>#</th>
                      <th className="px-2 py-2 text-left font-medium" style={{ color: textLight }}>分類</th>
                      <th className="px-2 py-2 text-left font-medium" style={{ color: textLight }}>項目名</th>
                      <th className="px-2 py-2 text-left font-medium" style={{ color: textLight }}>仕様</th>
                      <th className="px-2 py-2 text-right font-medium" style={{ color: textLight }}>数量</th>
                      <th className="px-2 py-2 text-center font-medium" style={{ color: textLight }}>単位</th>
                      <th className="px-2 py-2 text-right font-medium" style={{ color: textLight }}>単価</th>
                      <th className="px-2 py-2 text-right font-medium" style={{ color: textLight }}>原価</th>
                      <th className="px-2 py-2 text-right font-medium" style={{ color: textLight }}>金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreview.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                        <td className="px-2 py-2" style={{ color: textLight }}>{idx + 1}</td>
                        <td className="px-2 py-2">{item.category || '-'}</td>
                        <td className="px-2 py-2 font-medium">{item.name || '-'}</td>
                        <td className="px-2 py-2">{item.specification || '-'}</td>
                        <td className="px-2 py-2 text-right">{item.quantity || '-'}</td>
                        <td className="px-2 py-2 text-center">{item.unit || '-'}</td>
                        <td className="px-2 py-2 text-right">{item.unit_price ? `¥${parseInt(item.unit_price).toLocaleString()}` : '-'}</td>
                        <td className="px-2 py-2 text-right">{item.cost_price ? `¥${parseInt(item.cost_price).toLocaleString()}` : '-'}</td>
                        <td className="px-2 py-2 text-right font-medium text-blue-500">¥{(item.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid ${cardBorder}` }}>
                      <td colSpan={8} className="px-2 py-3 text-right font-bold">合計</td>
                      <td className="px-2 py-3 text-right font-bold text-blue-500">
                        ¥{excelPreview.items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="px-5 py-4 border-t" style={{ borderColor: cardBorder }}>
              {/* 追加/置換選択 */}
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium">取込方法:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="add"
                    checked={excelPreview.importMode === 'add'}
                    onChange={() => handleImportModeChange('add')}
                    className="w-4 h-4 text-emerald-500"
                  />
                  <span className="text-sm">追加（既存明細を残す）</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={excelPreview.importMode === 'replace'}
                    onChange={() => handleImportModeChange('replace')}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-sm text-red-600">置換（既存明細を削除）</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExcelCancel}
                  className="flex-1 py-3 rounded-xl font-medium"
                  style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleExcelConfirm}
                  disabled={!hasRequiredFields()}
                  className="flex-1 py-3 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                取り込む
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
