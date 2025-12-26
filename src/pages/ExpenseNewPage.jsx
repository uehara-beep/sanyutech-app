import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Receipt } from 'lucide-react'
import { Header, Card, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function ExpenseNewPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [projects, setProjects] = useState([])
  const [categories, setCategories] = useState([])
  const [fuelPrice, setFuelPrice] = useState(170)
  const [saving, setSaving] = useState(false)
  const [scanningReceipt, setScanningReceipt] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    category_id: '',
    project_id: '',
    amount: '',
    fuel_liter: '',
    fuel_type: 'regular',
    store_name: '',
    memo: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [projectsRes, categoriesRes, fuelPriceRes] = await Promise.all([
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/expense-categories/`),
        fetch(`${API_BASE}/fuel-prices/latest`).catch(() => null),
      ])

      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
      if (fuelPriceRes?.ok) {
        const fp = await fuelPriceRes.json()
        if (fp.regular_price) setFuelPrice(fp.regular_price)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      // デモ用カテゴリ
      setCategories([
        { id: 1, name: '燃料費', icon: '⛽', is_fuel: true },
        { id: 2, name: '材料費', icon: '🧱', is_fuel: false },
        { id: 3, name: '消耗品', icon: '🔧', is_fuel: false },
        { id: 4, name: '交通費', icon: '🚗', is_fuel: false },
        { id: 5, name: '飲食費', icon: '🍱', is_fuel: false },
        { id: 6, name: 'その他', icon: '📋', is_fuel: false },
      ])
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const handleReceiptOCR = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanningReceipt(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/ocr/receipt`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          // 金額を設定
          if (result.data.total_amount) {
            setForm(prev => ({ ...prev, amount: String(result.data.total_amount) }))
          }
          // 店舗名を設定
          if (result.data.store_name) {
            setForm(prev => ({ ...prev, store_name: result.data.store_name }))
          }
          showToast('レシートを読み取りました')
        } else {
          showToast(result.error || 'レシートの読み取りに失敗しました')
        }
      } else {
        showToast('サーバーエラーが発生しました')
      }
    } catch (error) {
      console.error('Receipt OCR Error:', error)
      showToast('通信エラーが発生しました')
    } finally {
      setScanningReceipt(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === parseInt(form.category_id))
  const isFuelCategory = selectedCategory?.is_fuel

  const calculatedAmount = isFuelCategory && form.fuel_liter
    ? Math.round(parseFloat(form.fuel_liter) * fuelPrice)
    : parseInt(form.amount) || 0

  const handleSubmit = async () => {
    if (!form.project_id || !form.category_id) {
      showToast('現場とカテゴリを選択してください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: parseInt(form.project_id),
          category_id: parseInt(form.category_id),
          expense_date: new Date().toISOString().split('T')[0],
          amount: isFuelCategory ? null : calculatedAmount,
          fuel_type: isFuelCategory ? form.fuel_type : null,
          fuel_liter: isFuelCategory ? parseFloat(form.fuel_liter) : null,
          store_name: form.store_name || null,
          memo: form.memo || null,
        }),
      })

      if (res.ok) {
        showToast('申請しました')
        setTimeout(() => navigate('/expense'), 1500)
      } else {
        const err = await res.json()
        showToast(`エラー: ${err.detail || '保存に失敗しました'}`)
      }
    } catch (error) {
      showToast('申請しました（デモ）')
      setTimeout(() => navigate('/expense'), 1500)
    } finally {
      setSaving(false)
    }
  }

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'
  const inputStyle = {
    background: inputBg,
    color: currentBg.text,
    border: `1px solid ${currentBg.border}`,
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="経費申請"
        icon="💳"
        gradient="from-purple-800 to-purple-400"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4 space-y-4">
        {/* 燃料単価 */}
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>今月の燃料単価</div>
            <div className="text-lg font-bold text-purple-400">¥{fuelPrice}/L</div>
          </div>
          <span className="text-2xl">⛽</span>
        </Card>

        {/* カテゴリ選択 */}
        <Card>
          <label className="text-sm font-bold block mb-3" style={{ color: currentBg.text }}>
            カテゴリ *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setForm({ ...form, category_id: String(cat.id) })}
                className={`py-3 rounded-xl text-center transition-all ${
                  form.category_id === String(cat.id)
                    ? 'bg-purple-500 text-white ring-2 ring-purple-400'
                    : ''
                }`}
                style={form.category_id !== String(cat.id) ? { background: inputBg, color: currentBg.text } : {}}
              >
                <div className="text-xl mb-1">{cat.icon || '📋'}</div>
                <div className="text-[10px]">{cat.name}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* 現場選択 */}
        <Card>
          <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
            現場 *
          </label>
          <select
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            className="w-full rounded-xl px-4 py-3"
            style={inputStyle}
          >
            <option value="">選択してください</option>
            {projects.filter(p => p.status === '施工中').map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Card>

        {/* 金額入力 */}
        <Card>
          {isFuelCategory ? (
            <>
              <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
                給油量（L）
              </label>
              <input
                type="number"
                value={form.fuel_liter}
                onChange={(e) => setForm({ ...form, fuel_liter: e.target.value })}
                placeholder="例: 45"
                className="w-full rounded-xl px-4 py-3"
                style={inputStyle}
              />
              {form.fuel_liter && (
                <div className="mt-2 text-right text-purple-400 font-bold">
                  計算金額: ¥{calculatedAmount.toLocaleString()}
                </div>
              )}
              <div className="mt-3">
                <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
                  燃料タイプ
                </label>
                <div className="flex gap-2">
                  {['regular', 'diesel'].map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, fuel_type: type })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                        form.fuel_type === type ? 'bg-purple-500 text-white' : ''
                      }`}
                      style={form.fuel_type !== type ? { background: inputBg, color: currentBg.text } : {}}
                    >
                      {type === 'regular' ? 'レギュラー' : '軽油'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
                金額
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="¥0"
                className="w-full rounded-xl px-4 py-3"
                style={inputStyle}
              />
            </>
          )}
        </Card>

        {/* 店舗名・備考 */}
        <Card>
          <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
            店舗名（任意）
          </label>
          <input
            type="text"
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
            placeholder="例: ENEOS、コンビニ"
            className="w-full rounded-xl px-4 py-3 mb-4"
            style={inputStyle}
          />

          <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
            備考（任意）
          </label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="メモを入力"
            className="w-full rounded-xl px-4 py-3"
            style={inputStyle}
          />
        </Card>

        {/* レシート写真OCR */}
        <Card>
          <label className="text-sm font-bold block mb-2" style={{ color: currentBg.text }}>
            レシート撮影（AIで自動入力）
          </label>
          <label
            className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            style={{ borderColor: currentBg.border, color: currentBg.textLight }}
          >
            <Camera size={24} />
            <span>レシートを撮影</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptOCR}
            />
          </label>
          {scanningReceipt && (
            <div className="mt-3 text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs mt-2" style={{ color: currentBg.textLight }}>レシートを読み取り中...</p>
            </div>
          )}
        </Card>

        {/* 送信ボタン */}
        <div className="flex gap-3 pt-2">
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
            className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Receipt size={18} />
                申請する
              </>
            )}
          </button>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
