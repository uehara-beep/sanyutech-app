/**
 * 見積作成画面（設計書3.1準拠）
 * 画面ID: SCR-SALES-002
 * URL: /sales/quote-create
 * アクセス権限: 営業、管理者
 *
 * 手入力のみ対応（Excel取込は対象外）
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, FileText, AlertCircle } from 'lucide-react'
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

export default function QuoteCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams()  // 編集モード時のID
  const isEditMode = !!id

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
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> 行追加
            </button>
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
    </div>
  )
}
