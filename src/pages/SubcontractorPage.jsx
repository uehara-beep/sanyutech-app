import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function SubcontractorPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [subcontractors, setSubcontractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    note: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/subcontractors/`)
      if (res.ok) setSubcontractors(await res.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowForm(true)

    // 名刺AI読み取りシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000))

    const ocrResult = {
      name: '株式会社 山田建設',
      contact_person: '山田 太郎',
      phone: '092-123-4567',
      email: 'yamada@example.com',
      address: '福岡県福岡市中央区天神1-1-1',
      category: '土工',
      note: '',
    }

    setForm(ocrResult)
    setScanning(false)
    showToast('✅ 名刺を読み取りました')
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/subcontractors/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        showToast('登録しました')
        setShowForm(false)
        setForm({
          name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          category: '',
          note: '',
        })
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

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="業者マスタ"
        icon="🤝"
        gradient="from-yellow-700 to-yellow-400"
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

      {/* 名刺撮影ボタン */}
      <div className="px-5 pt-4">
        <label className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-sm font-bold cursor-pointer">
          📷 名刺を撮影して登録
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCardUpload}
          />
        </label>
      </div>

      <div className="px-5 py-4">
        <SectionTitle>🏢 協力会社一覧（{subcontractors.length}社）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : subcontractors.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>協力会社がありません</div>
          </div>
        ) : (
          subcontractors.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-app-primary/20 flex items-center justify-center text-xl">
                    🏢
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-semibold">{sub.name}</div>
                      {sub.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-app-primary/20 text-app-primary">
                          {sub.category}
                        </span>
                      )}
                    </div>
                    {sub.contact_person && (
                      <div className="text-xs text-slate-400 mb-1">担当: {sub.contact_person}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {sub.phone && (
                        <a
                          href={`tel:${sub.phone}`}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-1"
                        >
                          📞 電話
                        </a>
                      )}
                      {sub.email && (
                        <a
                          href={`mailto:${sub.email}`}
                          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs flex items-center gap-1"
                        >
                          ✉️ メール
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 新規登録モーダル */}
      {showForm && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => { setShowForm(false); setScanning(false) }}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl flex flex-col"
            style={{ maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（保存ボタン含む） */}
            <div className="flex justify-between items-center p-4 border-b border-app-border">
              <div className="text-lg font-bold">
                {scanning ? '🔍 名刺を読み取り中...' : '🏢 協力会社登録'}
              </div>
              <div className="flex items-center gap-2">
                {!scanning && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-app-primary rounded-lg text-sm font-bold text-white"
                  >
                    保存
                  </button>
                )}
                <button onClick={() => { setShowForm(false); setScanning(false) }} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            {/* スクロール可能なコンテンツ */}
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {scanning ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 animate-pulse">📇</div>
                  <div className="text-slate-300">AI が名刺を解析しています...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">会社名</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="〇〇工業株式会社"
                      className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">担当者名</label>
                    <input
                      type="text"
                      value={form.contact_person}
                      onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                      placeholder="山田太郎"
                      className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">電話番号</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="090-1234-5678"
                        className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">カテゴリ</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                      >
                        <option value="">選択</option>
                        <option value="舗装">舗装</option>
                        <option value="土工">土工</option>
                        <option value="運搬">運搬</option>
                        <option value="機械">機械</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">メールアドレス</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="info@example.com"
                      className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">住所</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="福岡県福岡市..."
                      className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">備考</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="メモを入力"
                      rows={3}
                      className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
