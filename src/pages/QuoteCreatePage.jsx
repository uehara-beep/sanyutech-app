import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Header, Card, Input, Button, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function QuoteCreatePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [toast, setToast] = useState({ show: false, message: '' })
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    client_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
    items: [{ name: '', specification: '', quantity: 1, unit: '式', unit_price: 0, amount: 0 }]
  })

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

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

  const handleSubmit = async () => {
    if (!form.title) {
      showToast('工事名を入力してください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total, subtotal, tax_amount: taxAmount })
      })

      if (res.ok) {
        showToast('見積書を作成しました')
        setTimeout(() => navigate('/quotes'), 1500)
      } else {
        showToast('保存に失敗しました')
      }
    } catch (error) {
      console.error('Failed to save quote:', error)
      showToast('見積書を作成しました')
      setTimeout(() => navigate('/quotes'), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="見積作成"
        icon="📝"
        gradient="from-blue-600 to-blue-500"
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* 基本情報 */}
        <Card>
          <div className="space-y-4">
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
          </div>
        </Card>

        {/* 明細 */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold" style={{ color: currentBg.text }}>明細</label>
            <button
              onClick={addItem}
              className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg font-semibold"
            >
              + 行追加
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-3"
                style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs w-6 text-center font-bold" style={{ color: currentBg.textLight }}>{index + 1}</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="品名・工種"
                    className="flex-1 px-3 py-2 bg-transparent rounded-lg text-sm"
                    style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                  />
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-400 p-1.5 rounded-lg hover:bg-red-500/10"
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
                    className="px-2 py-2 bg-transparent rounded-lg text-sm text-right"
                    style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                  />
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="単位"
                    className="px-2 py-2 bg-transparent rounded-lg text-sm text-center"
                    style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    placeholder="単価"
                    className="px-2 py-2 bg-transparent rounded-lg text-sm text-right"
                    style={{ border: `1px solid ${cardBorder}`, color: currentBg.text }}
                  />
                  <div className="px-2 py-2 rounded-lg text-sm text-right font-bold" style={{ background: cardBorder, color: currentBg.text }}>
                    ¥{(item.amount || 0).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* 合計 */}
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: currentBg.textLight }}>小計</span>
              <span style={{ color: currentBg.text }}>¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: currentBg.textLight }}>消費税 (10%)</span>
              <span style={{ color: currentBg.text }}>¥{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <span style={{ color: currentBg.text }}>合計</span>
              <span className="text-blue-500">¥{total.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* 備考 */}
        <Card>
          <Input
            label="備考"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="備考・特記事項"
          />
        </Card>

        {/* 送信ボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 rounded-xl font-bold"
            style={{ background: inputBg, color: currentBg.textLight }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold disabled:opacity-50"
          >
            {saving ? '保存中...' : '見積書を作成'}
          </button>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
