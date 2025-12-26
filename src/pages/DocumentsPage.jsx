import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'

const DOC_TYPES = [
  { value: 'contract', label: '契約書', color: 'bg-blue-500/20 text-blue-400', icon: '📜' },
  { value: 'drawing', label: '図面', color: 'bg-emerald-500/20 text-emerald-400', icon: '📐' },
  { value: 'spec', label: '仕様書', color: 'bg-purple-500/20 text-purple-400', icon: '📋' },
  { value: 'permit', label: '届出・許可', color: 'bg-amber-500/20 text-amber-400', icon: '📄' },
  { value: 'report', label: '報告書', color: 'bg-pink-500/20 text-pink-400', icon: '📊' },
  { value: 'other', label: 'その他', color: 'bg-slate-500/20 text-slate-400', icon: '📁' },
]

export default function DocumentsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [activeSite, setActiveSite] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  // サンプル現場データ
  const sites = [
    { id: 1, name: '新宿マンション新築工事' },
    { id: 2, name: '渋谷商業ビル改修' },
    { id: 3, name: '品川駅前再開発' },
  ]

  // サンプル書類データ
  const documents = [
    { id: 1, name: '工事請負契約書', type: 'contract', site: '新宿マンション新築工事', date: '2024-01-10', size: '2.4MB', pages: 12 },
    { id: 2, name: '構造図（S-01〜S-15）', type: 'drawing', site: '新宿マンション新築工事', date: '2024-01-08', size: '15.8MB', pages: 15 },
    { id: 3, name: '建築確認申請書', type: 'permit', site: '新宿マンション新築工事', date: '2024-01-05', size: '1.2MB', pages: 8 },
    { id: 4, name: '施工要領書', type: 'spec', site: '渋谷商業ビル改修', date: '2024-01-12', size: '3.6MB', pages: 24 },
    { id: 5, name: '中間検査報告書', type: 'report', site: '品川駅前再開発', date: '2024-01-14', size: '5.1MB', pages: 18 },
    { id: 6, name: '道路使用許可証', type: 'permit', site: '品川駅前再開発', date: '2024-01-03', size: '0.8MB', pages: 2 },
  ]

  const filteredDocs = documents.filter(doc => {
    const matchSearch = !search || doc.name.includes(search)
    const matchType = !activeType || doc.type === activeType
    const matchSite = !activeSite || doc.site === activeSite
    return matchSearch && matchType && matchSite
  })

  const getTypeStyle = (type) => {
    const found = DOC_TYPES.find(t => t.value === type)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getTypeIcon = (type) => {
    const found = DOC_TYPES.find(t => t.value === type)
    return found ? found.icon : '📁'
  }

  const getTypeLabel = (type) => {
    const found = DOC_TYPES.find(t => t.value === type)
    return found ? found.label : 'その他'
  }

  const handleUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      showToast(`${files.length}件のファイルをアップロードしました`)
      setShowUploadModal(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="書類管理"
        icon="📁"
        gradient="from-orange-700 to-orange-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* アップロードボタン */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl text-sm font-bold text-white"
        >
          📤 書類をアップロード
        </button>

        {/* 検索 */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="書類名で検索"
            className="w-full rounded-xl px-4 py-3 pl-10 text-sm"
            style={{ background: inputBg, color: currentBg.text }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: currentBg.textLight }}>🔍</span>
        </div>

        {/* 現場フィルター */}
        <div className="mb-4">
          <select
            value={activeSite}
            onChange={(e) => setActiveSite(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{ background: inputBg, color: currentBg.text }}
          >
            <option value="">すべての現場</option>
            {sites.map(site => (
              <option key={site.id} value={site.name}>{site.name}</option>
            ))}
          </select>
        </div>

        {/* 種別フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeType ? 'bg-orange-500/20 text-orange-400' : ''
            }`}
            style={activeType ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            すべて
          </button>
          {DOC_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                activeType === type.value ? type.color : ''
              }`}
              style={activeType !== type.value ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        {/* 統計 */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: currentBg.text }}>書類サマリー</span>
            <span className="text-xs" style={{ color: currentBg.textLight }}>
              全{documents.length}件
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPES.slice(0, 3).map(type => (
              <div key={type.value} className="text-center py-2 rounded-lg" style={{ background: inputBg }}>
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {documents.filter(d => d.type === type.value).length}
                </div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>{type.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <SectionTitle>書類一覧</SectionTitle>

        {/* 書類一覧 */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">📁</div>
            <div className="text-lg mb-1">書類がありません</div>
            <div className="text-xs">書類をアップロードしましょう</div>
          </div>
        ) : (
          filteredDocs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedDoc(doc)}
            >
              <Card className="mb-2.5 cursor-pointer hover:opacity-80">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: inputBg }}>
                    {getTypeIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getTypeStyle(doc.type)}`}>
                        {getTypeLabel(doc.type)}
                      </span>
                    </div>
                    <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                      {doc.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                      📍 {doc.site}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: currentBg.textLight }}>{doc.date}</span>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>{doc.size}</span>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>{doc.pages}ページ</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); showToast('ダウンロードを開始しました') }}
                    className="p-2 rounded-lg"
                    style={{ background: inputBg }}
                  >
                    📥
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* アップロードモーダル */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              className="w-full rounded-t-2xl p-5"
              style={{ background: cardBg, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  📤 書類をアップロード
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>現場を選択</label>
                  <select
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    <option value="">現場を選択</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>書類の種類</label>
                  <div className="flex gap-2 flex-wrap">
                    {DOC_TYPES.map(type => (
                      <button
                        key={type.value}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1`}
                        style={{ background: inputBg, color: currentBg.textLight }}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block py-12 border-2 border-dashed rounded-xl text-center cursor-pointer" style={{ borderColor: currentBg.textLight }}>
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-sm font-semibold" style={{ color: currentBg.text }}>ファイルを選択</div>
                  <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>PDF、Word、Excel、画像ファイルに対応</div>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" multiple className="hidden" onChange={handleUpload} />
                </label>

                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-3 rounded-xl font-bold"
                  style={{ background: inputBg, color: currentBg.textLight }}
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* プレビューモーダル */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-5"
              style={{ background: cardBg, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {getTypeIcon(selectedDoc.type)} {selectedDoc.name}
                </h3>
                <button onClick={() => setSelectedDoc(null)} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              <div className="py-8 text-center rounded-xl mb-4" style={{ background: inputBg }}>
                <div className="text-6xl mb-3">📄</div>
                <div className="text-sm" style={{ color: currentBg.textLight }}>PDFプレビュー</div>
                <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>（{selectedDoc.pages}ページ）</div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentBg.textLight }}>現場</span>
                  <span style={{ color: currentBg.text }}>{selectedDoc.site}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentBg.textLight }}>種類</span>
                  <span style={{ color: currentBg.text }}>{getTypeLabel(selectedDoc.type)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentBg.textLight }}>登録日</span>
                  <span style={{ color: currentBg.text }}>{selectedDoc.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentBg.textLight }}>サイズ</span>
                  <span style={{ color: currentBg.text }}>{selectedDoc.size}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { showToast('ダウンロードを開始しました'); setSelectedDoc(null) }}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl font-bold text-white"
                >
                  📥 ダウンロード
                </button>
                <button
                  onClick={() => { showToast('共有リンクをコピーしました'); setSelectedDoc(null) }}
                  className="py-3 px-4 rounded-xl font-bold"
                  style={{ background: inputBg, color: currentBg.textLight }}
                >
                  🔗
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
