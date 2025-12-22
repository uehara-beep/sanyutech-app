import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'

const API_BASE = '/api'

const TAGS = [
  { value: 'client', label: '元請け', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'subcon', label: '協力会社', color: 'bg-green-500/20 text-green-400' },
  { value: 'vendor', label: '資材', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'other', label: 'その他', color: 'bg-slate-500/20 text-slate-400' },
]

export default function BusinessCardsPage() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    company_name: '',
    person_name: '',
    department: '',
    position: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    url: '',
    tag: 'other',
    memo: '',
  })

  useEffect(() => {
    fetchCards()
  }, [search, activeTag, showFavorites])

  const fetchCards = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (activeTag) params.append('tag', activeTag)
      if (showFavorites) params.append('favorite_only', 'true')

      const res = await fetch(`${API_BASE}/business-cards/?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards || [])
        setGrouped(data.grouped || {})
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    // 名刺AI読み取りシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2500))

    // OCR結果をシミュレート
    const ocrResult = {
      company_name: '株式会社サンプル建設',
      person_name: '田中 一郎',
      department: '工事部',
      position: '部長',
      phone: '03-1234-5678',
      mobile: '090-1234-5678',
      email: 'tanaka@sample.co.jp',
      address: '東京都千代田区丸の内1-1-1',
      url: 'https://sample.co.jp',
      tag: 'client',
      memo: '',
    }

    setForm(ocrResult)
    setScanning(false)
    showToast('名刺を読み取りました')
  }

  const handleSubmit = async () => {
    if (!form.person_name) {
      showToast('氏名は必須です')
      return
    }

    try {
      const url = selectedCard
        ? `${API_BASE}/business-cards/${selectedCard.id}`
        : `${API_BASE}/business-cards/`
      const method = selectedCard ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        showToast(selectedCard ? '更新しました' : '登録しました')
        setShowModal(false)
        resetForm()
        fetchCards()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleToggleFavorite = async (cardId, e) => {
    e.stopPropagation()
    try {
      await fetch(`${API_BASE}/business-cards/${cardId}/favorite`, { method: 'PUT' })
      fetchCards()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDelete = async (cardId) => {
    if (!confirm('この名刺を削除しますか？')) return
    try {
      await fetch(`${API_BASE}/business-cards/${cardId}`, { method: 'DELETE' })
      showToast('削除しました')
      setSelectedCard(null)
      fetchCards()
    } catch (error) {
      showToast('削除に失敗しました')
    }
  }

  const openCardDetail = (card) => {
    setSelectedCard(card)
    setForm({
      company_name: card.company_name || '',
      person_name: card.person_name || '',
      department: card.department || '',
      position: card.position || '',
      phone: card.phone || '',
      mobile: card.mobile || '',
      email: card.email || '',
      address: card.address || '',
      url: card.url || '',
      tag: card.tag || 'other',
      memo: card.memo || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setForm({
      company_name: '',
      person_name: '',
      department: '',
      position: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      url: '',
      tag: 'other',
      memo: '',
    })
    setSelectedCard(null)
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getTagStyle = (tag) => {
    const found = TAGS.find(t => t.value === tag)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getTagLabel = (tag) => {
    const found = TAGS.find(t => t.value === tag)
    return found ? found.label : 'その他'
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="名刺図書館"
        icon="📇"
        gradient="from-purple-700 to-purple-500"
        onBack={() => navigate('/')}
      />

      <div className="px-5 py-4">
        {/* 名刺撮影ボタン */}
        <label className="flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-sm font-bold cursor-pointer">
          📷 名刺を撮影して登録
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </label>

        {/* 検索 */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・氏名・メモで検索"
            className="w-full bg-slate-800 rounded-xl px-4 py-3 pl-10 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              showFavorites ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'
            }`}
          >
            ⭐ お気に入り
          </button>
          <button
            onClick={() => setActiveTag('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeTag ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
            }`}
          >
            すべて
          </button>
          {TAGS.map(tag => (
            <button
              key={tag.value}
              onClick={() => setActiveTag(tag.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                activeTag === tag.value ? tag.color : 'bg-slate-700 text-slate-400'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* 名刺一覧（会社別グループ） */}
        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-3">📇</div>
            <div className="text-lg mb-1">名刺がありません</div>
            <div className="text-xs">名刺を撮影して登録しましょう</div>
          </div>
        ) : (
          Object.entries(grouped).map(([company, companyCards]) => (
            <div key={company} className="mb-6">
              <div className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <span className="text-lg">🏢</span>
                {company}
                <span className="text-xs text-slate-500">({companyCards.length})</span>
              </div>
              {companyCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openCardDetail(card)}
                >
                  <Card className="mb-2 cursor-pointer hover:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-xl font-bold">
                        {card.person_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{card.person_name}</span>
                          {card.is_favorite && <span>⭐</span>}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {[card.department, card.position].filter(Boolean).join(' / ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${getTagStyle(card.tag)}`}>
                          {getTagLabel(card.tag)}
                        </span>
                        <button
                          onClick={(e) => handleToggleFavorite(card.id, e)}
                          className="text-lg"
                        >
                          {card.is_favorite ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                    {/* クイックアクション */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                      {card.phone && (
                        <a
                          href={`tel:${card.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs text-center"
                        >
                          📞 電話
                        </a>
                      )}
                      {card.email && (
                        <a
                          href={`mailto:${card.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs text-center"
                        >
                          ✉️ メール
                        </a>
                      )}
                      {card.mobile && (
                        <a
                          href={`tel:${card.mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs text-center"
                        >
                          📱 携帯
                        </a>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 登録・編集モーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); resetForm(); setScanning(false) }}
          >
            <motion.div
              className="w-full bg-slate-800 rounded-t-2xl p-5 max-h-[85vh] overflow-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {scanning ? '🔍 名刺を読み取り中...' : selectedCard ? '📇 名刺を編集' : '📇 名刺を登録'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); setScanning(false) }} className="text-2xl">×</button>
              </div>

              {scanning ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 animate-pulse">📇</div>
                  <div className="text-slate-300">AIが名刺を解析しています...</div>
                  <div className="text-xs text-slate-500 mt-2">会社名・氏名・連絡先を自動認識</div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">会社名</label>
                        <input
                          type="text"
                          value={form.company_name}
                          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="株式会社サンプル"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">氏名 *</label>
                        <input
                          type="text"
                          value={form.person_name}
                          onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="山田 太郎"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">役職</label>
                        <input
                          type="text"
                          value={form.position}
                          onChange={(e) => setForm({ ...form, position: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="部長"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">部署</label>
                        <input
                          type="text"
                          value={form.department}
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="営業部"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">電話番号</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="03-1234-5678"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">携帯番号</label>
                        <input
                          type="tel"
                          value={form.mobile}
                          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="090-1234-5678"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">メールアドレス</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="example@company.co.jp"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">住所</label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="東京都千代田区..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">URL</label>
                        <input
                          type="url"
                          value={form.url}
                          onChange={(e) => setForm({ ...form, url: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">タグ</label>
                        <div className="flex gap-2 flex-wrap">
                          {TAGS.map(tag => (
                            <button
                              key={tag.value}
                              type="button"
                              onClick={() => setForm({ ...form, tag: tag.value })}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                                form.tag === tag.value ? tag.color : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 mb-1 block">メモ</label>
                        <textarea
                          value={form.memo}
                          onChange={(e) => setForm({ ...form, memo: e.target.value })}
                          className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm resize-none"
                          rows={2}
                          placeholder="メモを入力"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      {selectedCard && (
                        <button
                          onClick={() => handleDelete(selectedCard.id)}
                          className="py-3 px-4 bg-red-500/20 text-red-400 rounded-xl font-bold"
                        >
                          削除
                        </button>
                      )}
                      <button
                        onClick={() => { setShowModal(false); resetForm() }}
                        className="flex-1 py-3 bg-slate-700 rounded-xl font-bold"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl font-bold"
                      >
                        {selectedCard ? '更新する' : '登録する'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
