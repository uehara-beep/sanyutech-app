import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, Toast } from '../components/common'
import { API_BASE, authPostFormData, authFetch, authGet } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const TAGS = [
  { value: 'sales_target', label: '営業先', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'subcon', label: '協力会社', color: 'bg-green-500/20 text-green-400' },
  { value: 'other', label: 'その他', color: 'bg-slate-500/20 text-slate-400' },
]

export default function BusinessCardsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [cards, setCards] = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState('capture') // capture | form | detail
  const [scanning, setScanning] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  // 画像URL
  const [frontImageUrl, setFrontImageUrl] = useState('')
  const [backImageUrl, setBackImageUrl] = useState('')

  // 会社マスタ
  const [companies, setCompanies] = useState([])
  const [companySearch, setCompanySearch] = useState('')
  const [companyType, setCompanyType] = useState('prime')
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  const [form, setForm] = useState({
    company_name: '',
    person_name: '',
    phone: '',
    email: '',
    tag: 'other',
    linked_company_type: null,
    linked_company_id: null,
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

      const data = await authGet(`${API_BASE}/business-cards/?${params}`)
      setCards(data.cards || [])
      setGrouped(data.grouped || {})
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 会社マスタ検索
  const searchCompanies = async (query, type) => {
    try {
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (type) params.append('type', type)
      const data = await authGet(`${API_BASE}/companies/?${params}`)
      setCompanies(data || [])
    } catch (error) {
      console.error('Company search error:', error)
    }
  }

  useEffect(() => {
    if (step === 'form') {
      searchCompanies(companySearch, companyType)
    }
  }, [companySearch, companyType, step])

  // 画像アップロード
  const uploadImage = async (file, side) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('side', side)
    try {
      const result = await authPostFormData(`${API_BASE}/business-cards/upload-image?side=${side}`, formData)
      return result.url
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  // 表面撮影
  const handleFrontCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    const url = await uploadImage(file, 'front')
    if (url) {
      setFrontImageUrl(url)

      // OCR実行
      const formData = new FormData()
      formData.append('file', file)
      try {
        const result = await authPostFormData(`${API_BASE}/ocr/business-card`, formData)
        if (result.success) {
          setForm(prev => ({
            ...prev,
            company_name: result.company_name || '',
            person_name: result.name || '',
            phone: result.phone || '',
            email: result.email || '',
          }))
          showToast('名刺を読み取りました')
        } else {
          showToast(result.message || 'OCR失敗。手動で入力してください')
        }
      } catch (error) {
        showToast('OCR処理に失敗しました')
      }
    }
    setScanning(false)
  }

  // 裏面撮影
  const handleBackCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    const url = await uploadImage(file, 'back')
    if (url) {
      setBackImageUrl(url)
      showToast('裏面を登録しました')
    }
    setScanning(false)
  }

  // 新規会社作成
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      showToast('会社名を入力してください')
      return
    }
    try {
      const result = await authFetch(`${API_BASE}/companies/`, {
        method: 'POST',
        body: JSON.stringify({ name: newCompanyName, type: companyType })
      })
      setForm(prev => ({
        ...prev,
        company_name: result.name,
        linked_company_type: result.type,
        linked_company_id: result.id,
      }))
      showToast('会社マスタを作成しました')
      setShowNewCompany(false)
      setNewCompanyName('')
      searchCompanies('', companyType)
    } catch (error) {
      showToast('会社作成に失敗しました')
    }
  }

  // 会社選択
  const handleSelectCompany = (company) => {
    setForm(prev => ({
      ...prev,
      company_name: company.name,
      linked_company_type: company.type,
      linked_company_id: company.id,
    }))
    showToast(`${company.name}を選択しました`)
  }

  // 保存
  const handleSubmit = async () => {
    if (!form.person_name) {
      showToast('氏名は必須です')
      return
    }
    if (!frontImageUrl || !backImageUrl) {
      showToast('表裏両方の画像が必要です')
      return
    }

    try {
      const payload = {
        ...form,
        front_image_url: frontImageUrl,
        back_image_url: backImageUrl,
      }
      const url = selectedCard
        ? `${API_BASE}/business-cards/${selectedCard.id}`
        : `${API_BASE}/business-cards/`
      const method = selectedCard ? 'PUT' : 'POST'

      await authFetch(url, { method, body: JSON.stringify(payload) })
      showToast(selectedCard ? '更新しました' : '登録しました')
      closeModal()
      fetchCards()
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const handleToggleFavorite = async (cardId, e) => {
    e.stopPropagation()
    try {
      await authFetch(`${API_BASE}/business-cards/${cardId}/favorite`, { method: 'PUT' })
      fetchCards()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDelete = async (cardId) => {
    if (!confirm('この名刺を削除しますか？')) return
    try {
      await authFetch(`${API_BASE}/business-cards/${cardId}`, { method: 'DELETE' })
      showToast('削除しました')
      closeModal()
      fetchCards()
    } catch (error) {
      showToast('削除に失敗しました')
    }
  }

  // 詳細表示
  const openCardDetail = async (card) => {
    try {
      const detail = await authGet(`${API_BASE}/business-cards/${card.id}`)
      setSelectedCard(detail)
      setFrontImageUrl(detail.front_image_url || '')
      setBackImageUrl(detail.back_image_url || '')
      setForm({
        company_name: detail.company_name || '',
        person_name: detail.person_name || '',
        phone: detail.phone || '',
        email: detail.email || '',
        tag: detail.tag || 'other',
        linked_company_type: detail.linked_company_type,
        linked_company_id: detail.linked_company_id,
      })
      setStep('detail')
      setShowModal(true)
    } catch (error) {
      showToast('詳細取得に失敗しました')
    }
  }

  // 新規登録開始
  const startNewCard = () => {
    resetForm()
    setStep('capture')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setForm({
      company_name: '',
      person_name: '',
      phone: '',
      email: '',
      tag: 'other',
      linked_company_type: null,
      linked_company_id: null,
    })
    setFrontImageUrl('')
    setBackImageUrl('')
    setSelectedCard(null)
    setStep('capture')
    setShowNewCompany(false)
    setNewCompanyName('')
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

  // 画像URL生成（バックエンドから取得）
  const getImageSrc = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${API_BASE.replace('/api', '')}${url}`
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="名刺管理"
        icon="📇"
        gradient="from-purple-700 to-purple-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 名刺撮影ボタン */}
        <button
          onClick={startNewCard}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-sm font-bold text-white"
        >
          📷 名刺を撮影して登録
        </button>

        {/* 検索 */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・氏名で検索"
            className="w-full rounded-xl px-4 py-3 pl-10 text-sm"
            style={{ background: inputBg, color: currentBg.text }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: currentBg.textLight }}>🔍</span>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              showFavorites ? 'bg-yellow-500/20 text-yellow-400' : ''
            }`}
            style={!showFavorites ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            ⭐ お気に入り
          </button>
          <button
            onClick={() => setActiveTag('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeTag ? 'bg-blue-500/20 text-blue-400' : ''
            }`}
            style={activeTag ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            すべて
          </button>
          {TAGS.map(tag => (
            <button
              key={tag.value}
              onClick={() => setActiveTag(tag.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                activeTag === tag.value ? tag.color : ''
              }`}
              style={activeTag !== tag.value ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* 名刺一覧 */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">📇</div>
            <div className="text-lg mb-1">名刺がありません</div>
            <div className="text-xs">名刺を撮影して登録しましょう</div>
          </div>
        ) : (
          Object.entries(grouped).map(([company, companyCards]) => (
            <div key={company} className="mb-6">
              <div className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: currentBg.textLight }}>
                <span className="text-lg">🏢</span>
                {company}
                <span className="text-xs">({companyCards.length})</span>
              </div>
              {companyCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openCardDetail(card)}
                >
                  <Card className="mb-2 cursor-pointer hover:opacity-80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-xl font-bold text-white">
                        {card.person_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>{card.person_name}</span>
                          {card.is_favorite && <span>⭐</span>}
                        </div>
                        <div className="text-xs truncate" style={{ color: currentBg.textLight }}>
                          {card.phone || card.email || '-'}
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
                  </Card>
                </motion.div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* モーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="absolute left-0 right-0 rounded-t-2xl flex flex-col"
              style={{
                background: cardBg,
                backdropFilter: isOcean ? 'blur(10px)' : 'none',
                top: '60px',
                bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {step === 'capture' ? '📷 名刺撮影' : step === 'detail' ? '📇 名刺詳細' : '📝 名刺情報入力'}
                </h3>
                <button onClick={closeModal} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

                {/* 撮影ステップ */}
                {step === 'capture' && (
                  <div className="space-y-4">
                    <p className="text-sm text-center" style={{ color: currentBg.textLight }}>
                      名刺の表と裏を撮影してください
                    </p>

                    {/* 表面 */}
                    <div className="rounded-xl p-4" style={{ background: inputBg }}>
                      <div className="text-sm font-bold mb-2" style={{ color: currentBg.text }}>表面（必須）</div>
                      {frontImageUrl ? (
                        <div className="relative">
                          <img src={getImageSrc(frontImageUrl)} alt="表面" className="w-full h-40 object-cover rounded-lg" />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">✓ 撮影済</span>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer" style={{ borderColor: cardBorder }}>
                          <span className="text-4xl mb-2">📷</span>
                          <span className="text-sm" style={{ color: currentBg.textLight }}>タップして撮影</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontCapture} />
                        </label>
                      )}
                    </div>

                    {/* 裏面 */}
                    <div className="rounded-xl p-4" style={{ background: inputBg }}>
                      <div className="text-sm font-bold mb-2" style={{ color: currentBg.text }}>裏面（必須）</div>
                      {backImageUrl ? (
                        <div className="relative">
                          <img src={getImageSrc(backImageUrl)} alt="裏面" className="w-full h-40 object-cover rounded-lg" />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">✓ 撮影済</span>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer" style={{ borderColor: cardBorder }}>
                          <span className="text-4xl mb-2">📷</span>
                          <span className="text-sm" style={{ color: currentBg.textLight }}>タップして撮影</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackCapture} />
                        </label>
                      )}
                    </div>

                    {scanning && (
                      <div className="text-center py-4">
                        <div className="text-2xl animate-pulse mb-2">🔍</div>
                        <div className="text-sm" style={{ color: currentBg.textLight }}>処理中...</div>
                      </div>
                    )}

                    {frontImageUrl && backImageUrl && !scanning && (
                      <button
                        onClick={() => setStep('form')}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500"
                      >
                        次へ：情報を入力
                      </button>
                    )}
                  </div>
                )}

                {/* フォーム入力ステップ */}
                {step === 'form' && (
                  <div className="space-y-4">
                    {/* 画像プレビュー */}
                    <div className="flex gap-2">
                      {frontImageUrl && <img src={getImageSrc(frontImageUrl)} alt="表" className="w-1/2 h-20 object-cover rounded-lg" />}
                      {backImageUrl && <img src={getImageSrc(backImageUrl)} alt="裏" className="w-1/2 h-20 object-cover rounded-lg" />}
                    </div>

                    {/* OCR結果 / 手入力フォーム */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>会社名</label>
                        <input
                          type="text"
                          value={form.company_name}
                          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className="w-full rounded-lg px-4 py-3 text-sm"
                          style={{ background: inputBg, color: currentBg.text }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>氏名 *</label>
                        <input
                          type="text"
                          value={form.person_name}
                          onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                          className="w-full rounded-lg px-4 py-3 text-sm"
                          style={{ background: inputBg, color: currentBg.text }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>電話番号</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-lg px-4 py-3 text-sm"
                          style={{ background: inputBg, color: currentBg.text }}
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
                        />
                      </div>
                    </div>

                    {/* 会社マスタ紐付け */}
                    <div className="rounded-xl p-4" style={{ background: inputBg }}>
                      <div className="text-sm font-bold mb-3" style={{ color: currentBg.text }}>
                        会社マスタ紐付け
                        {form.linked_company_id && (
                          <span className="ml-2 text-green-400 text-xs">✓ 紐付け済</span>
                        )}
                      </div>

                      {/* タイプ切替 */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setCompanyType('prime')}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold ${companyType === 'prime' ? 'bg-blue-500 text-white' : ''}`}
                          style={companyType !== 'prime' ? { background: cardBg, color: currentBg.textLight } : {}}
                        >
                          元請け
                        </button>
                        <button
                          onClick={() => setCompanyType('subcon')}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold ${companyType === 'subcon' ? 'bg-green-500 text-white' : ''}`}
                          style={companyType !== 'subcon' ? { background: cardBg, color: currentBg.textLight } : {}}
                        >
                          協力会社
                        </button>
                      </div>

                      {/* 検索 */}
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="会社名で検索..."
                        className="w-full rounded-lg px-3 py-2 text-sm mb-2"
                        style={{ background: cardBg, color: currentBg.text }}
                      />

                      {/* 会社リスト */}
                      <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                        {companies.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectCompany(c)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${form.linked_company_id === c.id ? 'bg-blue-500/20 text-blue-400' : ''}`}
                            style={form.linked_company_id !== c.id ? { color: currentBg.text } : {}}
                          >
                            {c.name}
                          </button>
                        ))}
                        {companies.length === 0 && (
                          <div className="text-xs text-center py-2" style={{ color: currentBg.textLight }}>該当なし</div>
                        )}
                      </div>

                      {/* 新規作成 */}
                      {!showNewCompany ? (
                        <button
                          onClick={() => setShowNewCompany(true)}
                          className="w-full py-2 rounded-lg text-xs font-semibold border border-dashed"
                          style={{ borderColor: cardBorder, color: currentBg.textLight }}
                        >
                          ＋ 新規でマスタ作成
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="会社名を入力"
                            className="flex-1 rounded-lg px-3 py-2 text-sm"
                            style={{ background: cardBg, color: currentBg.text }}
                          />
                          <button
                            onClick={handleCreateCompany}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-500 text-white"
                          >
                            作成
                          </button>
                        </div>
                      )}
                    </div>

                    {/* タグ */}
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>タグ</label>
                      <div className="flex gap-2 flex-wrap">
                        {TAGS.map(tag => (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => setForm({ ...form, tag: tag.value })}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold ${form.tag === tag.value ? tag.color : ''}`}
                            style={form.tag !== tag.value ? { background: inputBg, color: currentBg.textLight } : {}}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 詳細表示ステップ */}
                {step === 'detail' && selectedCard && (
                  <div className="space-y-4">
                    {/* 画像 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>表面</div>
                        {frontImageUrl ? (
                          <img src={getImageSrc(frontImageUrl)} alt="表面" className="w-full h-32 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-32 rounded-lg flex items-center justify-center text-2xl" style={{ background: inputBg }}>📷</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>裏面</div>
                        {backImageUrl ? (
                          <img src={getImageSrc(backImageUrl)} alt="裏面" className="w-full h-32 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-32 rounded-lg flex items-center justify-center text-2xl" style={{ background: inputBg }}>📷</div>
                        )}
                      </div>
                    </div>

                    {/* 情報 */}
                    <div className="rounded-xl p-4" style={{ background: inputBg }}>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs" style={{ color: currentBg.textLight }}>会社名</div>
                          <div className="font-semibold" style={{ color: currentBg.text }}>{selectedCard.company_name || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs" style={{ color: currentBg.textLight }}>氏名</div>
                          <div className="font-semibold" style={{ color: currentBg.text }}>{selectedCard.person_name || '-'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs" style={{ color: currentBg.textLight }}>電話</div>
                            <div style={{ color: currentBg.text }}>{selectedCard.phone || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs" style={{ color: currentBg.textLight }}>メール</div>
                            <div className="truncate" style={{ color: currentBg.text }}>{selectedCard.email || '-'}</div>
                          </div>
                        </div>
                        {selectedCard.linked_company && (
                          <div>
                            <div className="text-xs" style={{ color: currentBg.textLight }}>紐付け会社</div>
                            <div className="flex items-center gap-2" style={{ color: currentBg.text }}>
                              <span className={`px-2 py-0.5 rounded text-[10px] ${selectedCard.linked_company.type === 'prime' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                {selectedCard.linked_company.type === 'prime' ? '元請' : '協力'}
                              </span>
                              {selectedCard.linked_company.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* クイックアクション */}
                    <div className="flex gap-2">
                      {selectedCard.phone && (
                        <a href={`tel:${selectedCard.phone}`} className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm text-center font-semibold">
                          📞 電話
                        </a>
                      )}
                      {selectedCard.email && (
                        <a href={`mailto:${selectedCard.email}`} className="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl text-sm text-center font-semibold">
                          ✉️ メール
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* フッター */}
              {step === 'form' && (
                <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4" style={{ background: cardBg, borderTop: `1px solid ${cardBorder}` }}>
                  <button
                    onClick={() => setStep('capture')}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    戻る
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-[2] py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500"
                  >
                    登録する
                  </button>
                </div>
              )}

              {step === 'detail' && (
                <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4" style={{ background: cardBg, borderTop: `1px solid ${cardBorder}` }}>
                  <button
                    onClick={() => handleDelete(selectedCard.id)}
                    className="py-3 px-4 rounded-xl text-sm font-bold bg-red-500/20 text-red-400"
                  >
                    削除
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl text-sm font-bold"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    閉じる
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
