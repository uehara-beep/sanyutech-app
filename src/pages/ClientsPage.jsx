import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const CLIENT_TYPES = [
  { value: 'prime', label: '元請け', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'owner', label: '発注者', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'partner', label: '協力先', color: 'bg-purple-500/20 text-purple-400' },
]

export default function ClientsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    name: '',
    type: 'prime',
    representative: '',
    phone: '',
    email: '',
    address: '',
    memo: '',
  })

  // サンプルデータ
  const sampleClients = [
    { id: 1, name: '株式会社 大成建設', type: 'prime', representative: '山田太郎', phone: '03-1234-5678', email: 'yamada@taisei.co.jp', address: '東京都新宿区西新宿1-1-1', memo: '主要取引先', totalAmount: 125000000 },
    { id: 2, name: '清水建設 株式会社', type: 'prime', representative: '佐藤次郎', phone: '03-2345-6789', email: 'sato@shimizu.co.jp', address: '東京都中央区京橋2-2-2', memo: '', totalAmount: 89000000 },
    { id: 3, name: '東京都建設局', type: 'owner', representative: '鈴木三郎', phone: '03-3456-7890', email: 'suzuki@metro.tokyo.jp', address: '東京都新宿区西新宿2-8-1', memo: '公共工事', totalAmount: 156000000 },
    { id: 4, name: '国土交通省 関東地方整備局', type: 'owner', representative: '田中四郎', phone: '048-601-3151', email: 'tanaka@mlit.go.jp', address: '埼玉県さいたま市中央区新都心2-1', memo: '', totalAmount: 78000000 },
    { id: 5, name: '鹿島建設 株式会社', type: 'partner', representative: '高橋五郎', phone: '03-5544-1111', email: 'takahashi@kajima.co.jp', address: '東京都港区元赤坂1-3-1', memo: 'JV案件', totalAmount: 45000000 },
  ]

  useEffect(() => {
    // 実際のAPI呼び出しはコメントアウト
    // fetchClients()
    setClients(sampleClients)
    setLoading(false)
  }, [search, activeType])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (activeType) params.append('type', activeType)

      const res = await fetch(`${API_BASE}/clients/?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.representative?.includes(search)
    const matchType = !activeType || c.type === activeType
    return matchSearch && matchType
  })

  const handleSubmit = async () => {
    if (!form.name) {
      showToast('会社名は必須です')
      return
    }

    try {
      // API呼び出しシミュレーション
      showToast(selectedClient ? '更新しました' : '登録しました')
      setShowModal(false)
      resetForm()
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const openClientDetail = (client) => {
    setSelectedClient(client)
    setForm({
      name: client.name || '',
      type: client.type || 'prime',
      representative: client.representative || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      memo: client.memo || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setForm({
      name: '',
      type: 'prime',
      representative: '',
      phone: '',
      email: '',
      address: '',
      memo: '',
    })
    setSelectedClient(null)
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getTypeStyle = (type) => {
    const found = CLIENT_TYPES.find(t => t.value === type)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getTypeLabel = (type) => {
    const found = CLIENT_TYPES.find(t => t.value === type)
    return found ? found.label : 'その他'
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}億円`
    }
    return `${(amount / 10000).toLocaleString()}万円`
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="顧客管理"
        icon="🏢"
        gradient="from-blue-700 to-blue-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 新規登録ボタン */}
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-sm font-bold text-white"
        >
          + 新規顧客を登録
        </button>

        {/* 検索 */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・担当者名で検索"
            className="w-full rounded-xl px-4 py-3 pl-10 text-sm"
            style={{ background: inputBg, color: currentBg.text }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: currentBg.textLight }}>🔍</span>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeType ? 'bg-blue-500/20 text-blue-400' : ''
            }`}
            style={activeType ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            すべて
          </button>
          {CLIENT_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                activeType === type.value ? type.color : ''
              }`}
              style={activeType !== type.value ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold" style={{ color: currentBg.text }}>{clients.length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>総顧客数</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-blue-400">{clients.filter(c => c.type === 'prime').length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>元請け</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-emerald-400">{clients.filter(c => c.type === 'owner').length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>発注者</div>
          </Card>
        </div>

        <SectionTitle>顧客一覧</SectionTitle>

        {/* 顧客一覧 */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">🏢</div>
            <div className="text-lg mb-1">顧客がありません</div>
            <div className="text-xs">新規顧客を登録しましょう</div>
          </div>
        ) : (
          filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => openClientDetail(client)}
            >
              <Card className="mb-2.5 cursor-pointer hover:opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-xl font-bold text-white">
                    {client.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>{client.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getTypeStyle(client.type)}`}>
                        {getTypeLabel(client.type)}
                      </span>
                    </div>
                    <div className="text-xs truncate" style={{ color: currentBg.textLight }}>
                      {client.representative && `担当: ${client.representative}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: currentBg.text }}>
                      {formatAmount(client.totalAmount)}
                    </div>
                    <div className="text-[10px]" style={{ color: currentBg.textLight }}>累計取引</div>
                  </div>
                </div>
                {/* クイックアクション */}
                <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs text-center"
                    >
                      📞 電話
                    </a>
                  )}
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs text-center"
                    >
                      ✉️ メール
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/sbase?client=${client.id}`) }}
                    className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs text-center"
                  >
                    📊 案件一覧
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 登録・編集モーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); resetForm() }}
          >
            <motion.div
              className="w-full rounded-t-2xl flex flex-col"
              style={{ background: cardBg, backdropFilter: isOcean ? 'blur(10px)' : 'none', maxHeight: 'calc(100vh - 60px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー（保存ボタン含む） */}
              <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {selectedClient ? '🏢 顧客を編集' : '🏢 顧客を登録'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-bold text-white"
                  >
                    {selectedClient ? '更新' : '登録'}
                  </button>
                  <button onClick={() => { setShowModal(false); resetForm() }} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>会社名 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="株式会社サンプル"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>種別</label>
                  <div className="flex gap-2 flex-wrap">
                    {CLIENT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: type.value })}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                          form.type === type.value ? type.color : ''
                        }`}
                        style={form.type !== type.value ? { background: inputBg, color: currentBg.textLight } : {}}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>担当者名</label>
                  <input
                    type="text"
                    value={form.representative}
                    onChange={(e) => setForm({ ...form, representative: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>電話番号</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-sm"
                      style={{ background: inputBg, color: currentBg.text }}
                      placeholder="03-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>メール</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-sm"
                      style={{ background: inputBg, color: currentBg.text }}
                      placeholder="example@company.co.jp"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>住所</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="東京都千代田区..."
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>メモ</label>
                  <textarea
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                    style={{ background: inputBg, color: currentBg.text }}
                    rows={2}
                    placeholder="メモを入力"
                  />
                </div>

                <div className="h-4" />
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
