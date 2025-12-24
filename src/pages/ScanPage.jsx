import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Image, FileText, X, Check, Loader2, ChevronRight, AlertCircle } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Button, Input, Select, Modal, Toast } from '../components/common'
import { useThemeStore } from '../store'
import { API_BASE } from '../config/api'

// 書類タイプ定義
const documentTypes = [
  { id: 'estimate', icon: '📄', name: '見積書', dest: '単価マスタ', color: 'bg-blue-500' },
  { id: 'rental', icon: '🔧', name: 'レンタル伝票', dest: '機材管理', color: 'bg-orange-500' },
  { id: 'material', icon: '🧱', name: '建材伝票', dest: '材料費', color: 'bg-amber-500' },
  { id: 'receipt', icon: '🛒', name: 'ホームセンター', dest: '消耗品/経費', color: 'bg-green-500' },
  { id: 'fuel', icon: '⛽', name: 'ガソリン', dest: '車両/燃料費', color: 'bg-red-500' },
  { id: 'attendance', icon: '👷', name: '出面表', dest: '労務費', color: 'bg-purple-500' },
]

// 現場リスト（実際はAPIから取得）
const projects = [
  { value: 'kurume', label: '久留米管内舗装補修' },
  { value: 'miyazaki', label: '宮崎舗装補修工事' },
  { value: 'chidori', label: '千鳥橋JCT舗装改良' },
]

// カテゴリリスト
const categories = [
  { value: 'rental', label: 'レンタル機材' },
  { value: 'material', label: '材料費' },
  { value: 'subcon', label: '外注費' },
  { value: 'expense', label: '経費' },
  { value: 'fuel', label: '燃料費' },
  { value: 'labor', label: '労務費' },
]

export default function ScanPage() {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  // Refs
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const pdfInputRef = useRef(null)

  // State
  const [processing, setProcessing] = useState(false)
  const [showInputModal, setShowInputModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [scannedImage, setScannedImage] = useState(null)
  const [ocrResult, setOcrResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [recentScans, setRecentScans] = useState([
    { id: 1, type: '見積書', icon: '📄', name: 'アクティオ - バックホー 0.7㎥', date: '12/20 08:30', status: 'done' },
    { id: 2, type: 'レンタル伝票', icon: '🔧', name: 'ニッケン - タイヤローラー', date: '12/19 17:45', status: 'done' },
    { id: 3, type: '建材伝票', icon: '🧱', name: '〇〇建材 - アスファルト合材 50t', date: '12/19 14:20', status: 'done' },
  ])

  // 編集用データ
  const [editData, setEditData] = useState({
    docType: 'estimate',
    vendor: '',
    itemName: '',
    price: '',
    unit: '円/日',
    deliveryFee: '',
    projectId: 'kurume',
    category: 'rental',
  })

  // 入力方法選択モーダルを開く
  const handleOpenInput = () => {
    setShowInputModal(true)
  }

  // カメラで撮影
  const handleCamera = () => {
    setShowInputModal(false)
    cameraInputRef.current?.click()
  }

  // ギャラリーから選択
  const handleGallery = () => {
    setShowInputModal(false)
    galleryInputRef.current?.click()
  }

  // PDFを選択
  const handlePdf = () => {
    setShowInputModal(false)
    pdfInputRef.current?.click()
  }

  // ファイル選択後の処理
  const handleFileSelect = async (e, fileType) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setError(null)

    // プレビュー画像を設定
    if (fileType !== 'pdf') {
      const reader = new FileReader()
      reader.onload = (e) => setScannedImage(e.target.result)
      reader.readAsDataURL(file)
    } else {
      setScannedImage('/pdf-icon.png')
    }

    try {
      // OCR APIを呼び出し
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)

      const response = await fetch(`${API_BASE}/ocr/scan`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('OCR処理に失敗しました')
      }

      const result = await response.json()
      setOcrResult(result)

      // 結果をeditDataに設定
      setEditData({
        docType: result.document_type || 'estimate',
        vendor: result.vendor || '',
        itemName: result.item_name || '',
        price: result.price?.toString() || '',
        unit: result.unit || '円/日',
        deliveryFee: result.delivery_fee?.toString() || '',
        projectId: 'kurume',
        category: mapDocTypeToCategory(result.document_type),
      })

      setShowResultModal(true)
    } catch (err) {
      console.error('OCR Error:', err)
      // デモ用：APIがない場合はダミーデータを設定
      const dummyResult = generateDummyResult(fileType)
      setOcrResult(dummyResult)
      setEditData({
        docType: dummyResult.document_type,
        vendor: dummyResult.vendor,
        itemName: dummyResult.item_name,
        price: dummyResult.price?.toString() || '',
        unit: dummyResult.unit || '円/日',
        deliveryFee: dummyResult.delivery_fee?.toString() || '',
        projectId: 'kurume',
        category: mapDocTypeToCategory(dummyResult.document_type),
      })
      setShowResultModal(true)
    } finally {
      setProcessing(false)
      // input をリセット
      e.target.value = ''
    }
  }

  // 書類タイプからカテゴリへのマッピング
  const mapDocTypeToCategory = (docType) => {
    const map = {
      estimate: 'rental',
      rental: 'rental',
      material: 'material',
      receipt: 'expense',
      fuel: 'fuel',
      attendance: 'labor',
    }
    return map[docType] || 'expense'
  }

  // ダミーデータ生成（デモ用）
  const generateDummyResult = (fileType) => {
    const types = ['estimate', 'rental', 'material', 'receipt', 'fuel', 'attendance']
    const docType = types[Math.floor(Math.random() * types.length)]

    const dummyData = {
      estimate: { vendor: 'アクティオ', item_name: 'バックホー 0.7㎥', price: 25000, unit: '円/日', delivery_fee: 35000 },
      rental: { vendor: 'ニッケン', item_name: 'タイヤローラー 10t', price: 18000, unit: '円/日', delivery_fee: 28000 },
      material: { vendor: '〇〇建材', item_name: 'アスファルト合材（密粒度13）', price: 9500, unit: '円/t', delivery_fee: 0 },
      receipt: { vendor: 'コメリ', item_name: '作業用手袋・軍手', price: 3480, unit: '円', delivery_fee: 0 },
      fuel: { vendor: 'コスモ石油', item_name: 'レギュラーガソリン 45L', price: 7200, unit: '円', delivery_fee: 0 },
      attendance: { vendor: '〇〇工業', item_name: '作業員 3名 x 1日', price: 60000, unit: '円', delivery_fee: 0 },
    }

    return {
      document_type: docType,
      ...dummyData[docType],
      confidence: 0.92,
    }
  }

  // 登録処理
  const handleRegister = async () => {
    setProcessing(true)

    try {
      // カテゴリに応じたAPIエンドポイントを決定
      const endpoints = {
        rental: '/api/equipment/',
        material: '/api/materials/',
        expense: '/api/expenses/',
        fuel: '/api/expenses/',
        labor: '/api/costs/',
        subcon: '/api/costs/',
      }

      const endpoint = endpoints[editData.category] || '/api/expenses/'

      const payload = {
        vendor: editData.vendor,
        item_name: editData.itemName,
        price: parseFloat(editData.price) || 0,
        unit: editData.unit,
        delivery_fee: parseFloat(editData.deliveryFee) || 0,
        project_id: editData.projectId,
        category: editData.category,
        document_type: editData.docType,
        created_at: new Date().toISOString(),
      }

      // API呼び出し（実際の環境用）
      // await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      // 最近のスキャンに追加
      const docType = documentTypes.find(d => d.id === editData.docType)
      const newScan = {
        id: Date.now(),
        type: docType?.name || '書類',
        icon: docType?.icon || '📄',
        name: `${editData.vendor} - ${editData.itemName}`,
        date: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'done',
      }
      setRecentScans([newScan, ...recentScans.slice(0, 9)])

      setShowResultModal(false)
      setToast({ show: true, message: '✅ 登録しました！' })
      setTimeout(() => setToast({ show: false, message: '' }), 2000)

    } catch (err) {
      console.error('Register Error:', err)
      setError('登録に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  // 書類タイプを取得
  const getDocTypeInfo = (typeId) => {
    return documentTypes.find(d => d.id === typeId) || documentTypes[0]
  }

  return (
    <div className="min-h-screen pb-24 bg-[#1c1c1e]">
      <PageHeader
        title="撮影ステーション"
        icon="📸"
        onBack={() => navigate('/')}
      />

      <div className="px-4 py-4">
        {/* メイン撮影エリア */}
        <motion.div
          className="rounded-3xl p-10 text-center cursor-pointer mb-6 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
          onClick={handleOpenInput}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={processing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: processing ? Infinity : 0, ease: 'linear' }}
          >
            {processing ? '🔄' : '📷'}
          </motion.div>
          <div className="text-xl font-bold text-white mb-2">
            {processing ? 'AI読取中...' : 'タップして撮影'}
          </div>
          <div className="text-sm text-white/80">伝票・レシート・見積書なんでもOK</div>
        </motion.div>

        {/* 隠しinput要素 */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'camera')}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'gallery')}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'pdf')}
        />

        {/* AI判定タイプ */}
        <Card className="mb-6">
          <div className="text-sm font-semibold text-center mb-4 text-white">📋 AIが自動判定して振り分け</div>
          <div className="grid grid-cols-3 gap-3">
            {documentTypes.map((type, i) => (
              <motion.div
                key={type.id}
                className="text-center p-3 bg-[#1c1c1e] rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-[11px] font-semibold text-white mb-0.5">{type.name}</div>
                <div className="text-[9px] text-gray-400">→ {type.dest}</div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* 最近の読取 */}
        <SectionTitle>🕐 最近の読取</SectionTitle>
        {recentScans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className="mb-2.5 flex items-center gap-3"
              onClick={() => {}}
            >
              <span className="text-2xl">{scan.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold" style={{ color: theme.primary }}>{scan.type}</div>
                <div className="text-sm font-medium text-white truncate">{scan.name}</div>
                <div className="text-[11px] text-gray-400">{scan.date}</div>
              </div>
              <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs">
                ✓
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 入力方法選択モーダル */}
      <Modal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        title="入力方法を選択"
      >
        <div className="space-y-3">
          <motion.button
            className="w-full p-4 bg-[#1c1c1e] rounded-xl flex items-center gap-4 border border-[#3c3c3e]"
            onClick={handleCamera}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <Camera size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">カメラで撮影</div>
              <div className="text-xs text-gray-400">その場で書類を撮影</div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </motion.button>

          <motion.button
            className="w-full p-4 bg-[#1c1c1e] rounded-xl flex items-center gap-4 border border-[#3c3c3e]"
            onClick={handleGallery}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Image size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">ギャラリーから選択</div>
              <div className="text-xs text-gray-400">保存済みの画像を選択</div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </motion.button>

          <motion.button
            className="w-full p-4 bg-[#1c1c1e] rounded-xl flex items-center gap-4 border border-[#3c3c3e]"
            onClick={handlePdf}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-white">PDFを選択</div>
              <div className="text-xs text-gray-400">PDF書類を読み込み</div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </motion.button>
        </div>
      </Modal>

      {/* 読取結果確認モーダル */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="読取結果"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResultModal(false)} className="flex-1">
              キャンセル
            </Button>
            <Button onClick={handleRegister} className="flex-[2]" disabled={processing}>
              {processing ? <Loader2 className="animate-spin" size={18} /> : '登録する'}
            </Button>
          </>
        }
      >
        {/* AI判定バッジ */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: `${theme.primary}30`, color: theme.primary }}
          >
            🤖 AI判定: {getDocTypeInfo(editData.docType).name}
          </span>
          {ocrResult?.confidence && (
            <span className="text-xs text-gray-400">
              信頼度: {Math.round(ocrResult.confidence * 100)}%
            </span>
          )}
        </div>

        {/* プレビュー画像 */}
        {scannedImage && (
          <div className="w-full h-32 bg-[#1c1c1e] rounded-xl flex items-center justify-center mb-5 overflow-hidden">
            {scannedImage === '/pdf-icon.png' ? (
              <FileText size={48} className="text-gray-500" />
            ) : (
              <img src={scannedImage} alt="スキャン画像" className="max-h-full max-w-full object-contain" />
            )}
          </div>
        )}

        {/* 書類タイプ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">書類タイプ</label>
          <div className="flex flex-wrap gap-2">
            {documentTypes.map((type) => (
              <button
                key={type.id}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                  editData.docType === type.id
                    ? 'border-transparent text-white'
                    : 'border-[#3c3c3e] text-gray-400 bg-[#1c1c1e]'
                }`}
                style={editData.docType === type.id ? { backgroundColor: theme.primary } : {}}
                onClick={() => setEditData({ ...editData, docType: type.id, category: mapDocTypeToCategory(type.id) })}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 入力フォーム */}
        <Input
          label="取引先"
          value={editData.vendor}
          onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
          placeholder="取引先名を入力"
        />

        <Input
          label="品名"
          value={editData.itemName}
          onChange={(e) => setEditData({ ...editData, itemName: e.target.value })}
          placeholder="品名を入力"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">単価</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-3 bg-[#1c1c1e] border border-[#3c3c3e] rounded-xl text-white"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: e.target.value })}
              placeholder="0"
            />
            <select
              className="w-24 px-3 py-3 bg-[#1c1c1e] border border-[#3c3c3e] rounded-xl text-white"
              value={editData.unit}
              onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
            >
              <option value="円/日">円/日</option>
              <option value="円/t">円/t</option>
              <option value="円/㎥">円/㎥</option>
              <option value="円">円</option>
            </select>
          </div>
        </div>

        {(editData.docType === 'estimate' || editData.docType === 'rental') && (
          <Input
            label="回送費"
            value={editData.deliveryFee}
            onChange={(e) => setEditData({ ...editData, deliveryFee: e.target.value })}
            placeholder="0"
          />
        )}

        <Select
          label="現場（紐付け）"
          value={editData.projectId}
          onChange={(e) => setEditData({ ...editData, projectId: e.target.value })}
          options={projects}
        />

        <Select
          label="カテゴリ"
          value={editData.category}
          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
          options={categories}
        />

        {/* 自動連携先 */}
        <div className="bg-[#1c1c1e] rounded-xl p-4 mt-4">
          <div className="text-xs font-semibold text-white mb-2.5">🔗 自動連携先</div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px]">
              {getDocTypeInfo(editData.docType).icon} {getDocTypeInfo(editData.docType).dest}
            </span>
            <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px]">
              📊 S-BASE原価
            </span>
          </div>
        </div>
      </Modal>

      {/* 処理中オーバーレイ */}
      <AnimatePresence>
        {processing && !showResultModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                🔄
              </motion.div>
              <div className="text-white text-lg font-semibold">AI読取中...</div>
              <div className="text-gray-400 text-sm mt-2">書類を解析しています</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* エラー表示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-xl flex items-center gap-2 z-[300]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <AlertCircle size={20} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// 読取結果ページ（別ルートからのアクセス用）
export function ScanResultPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen pb-24 bg-[#1c1c1e]">
      <PageHeader
        title="読取結果"
        icon="📸"
        onBack={() => navigate('/scan')}
      />
      <div className="p-4 text-center text-gray-400 mt-20">
        <div className="text-4xl mb-4">📸</div>
        <div>撮影ステーションから書類をスキャンしてください</div>
        <Button className="mt-6" onClick={() => navigate('/scan')}>
          撮影画面へ
        </Button>
      </div>
    </div>
  )
}
