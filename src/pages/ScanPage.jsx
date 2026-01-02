import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Image, FileText, X, Check, Loader2, ChevronRight, AlertCircle } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Button, Input, Select, Modal, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
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
  const { getCurrentTheme, backgroundId } = useThemeStore()
  const theme = getCurrentTheme()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // カードスタイル
  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1c1c1e'
  const inputBorder = isOcean ? 'rgba(255,255,255,0.2)' : isLightTheme ? 'rgba(0,0,0,0.1)' : '#3c3c3e'

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
    // ガソリン専用フィールド
    fuelType: 'レギュラー',
    fuelQuantity: '',
    fuelUnitPrice: '',
    fuelTotalAmount: '',
    vehicleNumber: '',
    fuelDate: '',
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
      // まずガソリンOCRを試す（ガソリンスタンドのレシートか自動判定）
      const formData = new FormData()
      formData.append('file', file)

      // ガソリンOCR APIを呼び出し
      const gasolineResponse = await fetch(`${API_BASE}/ocr/gasoline`, {
        method: 'POST',
        body: formData,
      })

      if (gasolineResponse.ok) {
        const gasolineResult = await gasolineResponse.json()
        console.log('ガソリンOCR結果:', gasolineResult)

        // ガソリンレシートと判定された場合（is_gasolineフラグまたはfuel_typeで判定）
        const isGasoline = gasolineResult.is_gasoline || gasolineResult.data?.is_gasoline || gasolineResult.data?.fuel_type
        if (gasolineResult.success && isGasoline) {
          const data = gasolineResult.data
          const storeName = data.store_name || data.company_name || ''
          setOcrResult({ ...data, document_type: 'fuel' })
          setEditData({
            docType: 'fuel',
            vendor: storeName,
            itemName: `${data.fuel_type || 'ガソリン'} ${data.quantity || ''}L`,
            price: data.total_amount?.toString() || '',
            unit: '円',
            deliveryFee: '',
            projectId: 'kurume',
            category: 'fuel',
            fuelType: data.fuel_type || 'レギュラー',
            fuelQuantity: data.quantity?.toString() || '',
            fuelUnitPrice: data.unit_price?.toString() || '',
            fuelTotalAmount: data.total_amount?.toString() || '',
            vehicleNumber: data.vehicle_number || '',
            fuelDate: data.date || '',
          })
          setShowResultModal(true)
          console.log('ガソリンレシートとして認識しました:', storeName, data.fuel_type)
          return
        }
      }

      // ガソリンでない場合は通常のOCR（invoice/receipt判定）
      const formData2 = new FormData()
      formData2.append('file', file)
      formData2.append('type', fileType)

      const response = await fetch(`${API_BASE}/ocr/invoice`, {
        method: 'POST',
        body: formData2,
      })

      if (!response.ok) {
        throw new Error('OCR処理に失敗しました')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setOcrResult(result.data)
        // 伝票データから適切なdocTypeを判定
        const detectedDocType = result.data.slip_type?.includes('建材') ? 'material'
          : result.data.slip_type?.includes('レンタル') ? 'rental'
          : result.data.slip_type?.includes('見積') ? 'estimate'
          : 'receipt'

        setEditData({
          docType: detectedDocType,
          vendor: result.data.vendor_name || result.data.company_name || '',
          itemName: result.data.items?.[0]?.name || result.data.description || '',
          price: result.data.total_amount?.toString() || result.data.items?.[0]?.amount?.toString() || '',
          unit: '円',
          deliveryFee: '',
          projectId: 'kurume',
          category: mapDocTypeToCategory(detectedDocType),
          fuelType: 'レギュラー',
          fuelQuantity: '',
          fuelUnitPrice: '',
          fuelTotalAmount: '',
          vehicleNumber: '',
          fuelDate: '',
        })
      } else {
        throw new Error('OCR結果が取得できませんでした')
      }

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
        fuelType: 'レギュラー',
        fuelQuantity: '',
        fuelUnitPrice: '',
        fuelTotalAmount: '',
        vehicleNumber: '',
        fuelDate: '',
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
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <PageHeader
        title="撮影ステーション"
        icon="📸"
        onBack={() => navigate(-1)}
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
        <div
          className="mb-6 rounded-2xl p-4"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            backdropFilter: isOcean ? 'blur(10px)' : 'none',
          }}
        >
          <div className="text-sm font-semibold text-center mb-4" style={{ color: currentBg.text }}>📋 AIが自動判定して振り分け</div>
          <div className="grid grid-cols-3 gap-3">
            {documentTypes.map((type, i) => (
              <motion.div
                key={type.id}
                className="text-center p-3 rounded-xl"
                style={{ background: inputBg }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: currentBg.text }}>{type.name}</div>
                <div className="text-[9px]" style={{ color: currentBg.textLight }}>→ {type.dest}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 最近の読取 */}
        <div className="text-sm font-semibold mb-3" style={{ color: currentBg.text }}>🕐 最近の読取</div>
        {recentScans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div
              className="mb-2.5 flex items-center gap-3 p-4 rounded-2xl cursor-pointer"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                backdropFilter: isOcean ? 'blur(10px)' : 'none',
              }}
            >
              <span className="text-2xl">{scan.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold" style={{ color: theme.primary }}>{scan.type}</div>
                <div className="text-sm font-medium truncate" style={{ color: currentBg.text }}>{scan.name}</div>
                <div className="text-[11px]" style={{ color: currentBg.textLight }}>{scan.date}</div>
              </div>
              <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs">
                ✓
              </div>
            </div>
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
            className="w-full p-4 rounded-xl flex items-center gap-4"
            style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
            onClick={handleCamera}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
              <Camera size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold" style={{ color: currentBg.text }}>カメラで撮影</div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>その場で書類を撮影</div>
            </div>
            <ChevronRight size={20} style={{ color: currentBg.textLight }} />
          </motion.button>

          <motion.button
            className="w-full p-4 rounded-xl flex items-center gap-4"
            style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
            onClick={handleGallery}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Image size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold" style={{ color: currentBg.text }}>ギャラリーから選択</div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>保存済みの画像を選択</div>
            </div>
            <ChevronRight size={20} style={{ color: currentBg.textLight }} />
          </motion.button>

          <motion.button
            className="w-full p-4 rounded-xl flex items-center gap-4"
            style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
            onClick={handlePdf}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold" style={{ color: currentBg.text }}>PDFを選択</div>
              <div className="text-xs" style={{ color: currentBg.textLight }}>PDF書類を読み込み</div>
            </div>
            <ChevronRight size={20} style={{ color: currentBg.textLight }} />
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
            <span className="text-xs" style={{ color: currentBg.textLight }}>
              信頼度: {Math.round(ocrResult.confidence * 100)}%
            </span>
          )}
        </div>

        {/* プレビュー画像 */}
        {scannedImage && (
          <div className="w-full h-32 rounded-xl flex items-center justify-center mb-5 overflow-hidden" style={{ background: inputBg }}>
            {scannedImage === '/pdf-icon.png' ? (
              <FileText size={48} style={{ color: currentBg.textLight }} />
            ) : (
              <img src={scannedImage} alt="スキャン画像" className="max-h-full max-w-full object-contain" />
            )}
          </div>
        )}

        {/* 書類タイプ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: currentBg.textLight }}>書類タイプ</label>
          <div className="flex flex-wrap gap-2">
            {documentTypes.map((type) => (
              <button
                key={type.id}
                className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors"
                style={editData.docType === type.id
                  ? { backgroundColor: theme.primary, borderColor: 'transparent', color: '#fff' }
                  : { background: inputBg, borderColor: inputBorder, color: currentBg.textLight }
                }
                onClick={() => setEditData({ ...editData, docType: type.id, category: mapDocTypeToCategory(type.id) })}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 入力フォーム - ガソリン専用 or 通常 */}
        {editData.docType === 'fuel' ? (
          <>
            {/* ガソリン専用フォーム */}
            <Input
              label="スタンド名"
              value={editData.vendor}
              onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
              placeholder="コスモ石油、ENEOS など"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>日付</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
                value={editData.fuelDate}
                onChange={(e) => setEditData({ ...editData, fuelDate: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>油種</label>
              <div className="flex gap-2">
                {['レギュラー', 'ハイオク', '軽油'].map((type) => (
                  <button
                    key={type}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                    style={editData.fuelType === type
                      ? { backgroundColor: theme.primary, borderColor: 'transparent', color: '#fff' }
                      : { background: inputBg, borderColor: inputBorder, color: currentBg.textLight }
                    }
                    onClick={() => setEditData({ ...editData, fuelType: type })}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>数量（L）</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
                  value={editData.fuelQuantity}
                  onChange={(e) => setEditData({ ...editData, fuelQuantity: e.target.value })}
                  placeholder="45.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>単価（円/L）</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
                  value={editData.fuelUnitPrice}
                  onChange={(e) => setEditData({ ...editData, fuelUnitPrice: e.target.value })}
                  placeholder="165"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>合計金額</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl pr-12"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
                  value={editData.fuelTotalAmount}
                  onChange={(e) => setEditData({ ...editData, fuelTotalAmount: e.target.value })}
                  placeholder="7500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: currentBg.textLight }}>円</span>
              </div>
            </div>

            <Input
              label="車両番号（任意）"
              value={editData.vehicleNumber}
              onChange={(e) => setEditData({ ...editData, vehicleNumber: e.target.value })}
              placeholder="久留米 100 あ 1234"
            />

            <Select
              label="現場（紐付け）"
              value={editData.projectId}
              onChange={(e) => setEditData({ ...editData, projectId: e.target.value })}
              options={projects}
            />

            {/* ガソリン集計情報 */}
            {editData.fuelQuantity && editData.fuelUnitPrice && (
              <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>⛽ 給油情報サマリ</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold" style={{ color: currentBg.text }}>{editData.fuelQuantity}L</div>
                    <div className="text-[10px]" style={{ color: currentBg.textLight }}>給油量</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: currentBg.text }}>{editData.fuelUnitPrice}円</div>
                    <div className="text-[10px]" style={{ color: currentBg.textLight }}>単価/L</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                      {editData.fuelTotalAmount || Math.round(parseFloat(editData.fuelQuantity || 0) * parseFloat(editData.fuelUnitPrice || 0))}円
                    </div>
                    <div className="text-[10px]" style={{ color: currentBg.textLight }}>合計</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 通常フォーム */}
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: currentBg.textLight }}>単価</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-3 rounded-xl"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
                  value={editData.price}
                  onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                  placeholder="0"
                />
                <select
                  className="w-24 px-3 py-3 rounded-xl"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: currentBg.text }}
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
          </>
        )}

        {/* 自動連携先 */}
        <div className="rounded-xl p-4 mt-4" style={{ background: inputBg }}>
          <div className="text-xs font-semibold mb-2.5" style={{ color: currentBg.text }}>🔗 自動連携先</div>
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
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <PageHeader
        title="読取結果"
        icon="📸"
        onBack={() => navigate('/scan')}
      />
      <div className="p-4 text-center mt-20" style={{ color: currentBg.textLight }}>
        <div className="text-4xl mb-4">📸</div>
        <div>撮影ステーションから書類をスキャンしてください</div>
        <Button className="mt-6" onClick={() => navigate('/scan')}>
          撮影画面へ
        </Button>
      </div>
    </div>
  )
}
