import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, FileText, CreditCard, Scan, X, Check, Copy, Download } from 'lucide-react'
import { Header, Card, Button, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function OCRPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [activeTab, setActiveTab] = useState('invoice') // invoice, general, business-card
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // ファイルサイズチェック（20MB）
    if (file.size > 20 * 1024 * 1024) {
      showToast('ファイルサイズは20MB以下にしてください')
      return
    }

    setSelectedFile(file)
    setResult(null)

    // プレビュー作成
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleOCR = async () => {
    if (!selectedFile) {
      showToast('画像を選択してください')
      return
    }

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    const endpoints = {
      'invoice': '/api/ocr/invoice',
      'general': '/api/ocr/general',
      'business-card': '/api/ocr/business-card'
    }

    try {
      const res = await fetch(`${API_BASE}${endpoints[activeTab]}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'OCR処理に失敗しました')
      }

      const data = await res.json()
      setResult(data)
      showToast('OCR処理が完了しました')
    } catch (error) {
      console.error('OCR error:', error)
      showToast(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text)
    showToast('コピーしました')
  }

  const clearAll = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
  }

  const tabs = [
    { id: 'invoice', label: '請求書', icon: '📄' },
    { id: 'general', label: '汎用OCR', icon: '📝' },
    { id: 'business-card', label: '名刺', icon: '💳' },
  ]

  const inputBg = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="OCR読取"
        icon="🔍"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4 space-y-4">
        {/* タブ切り替え */}
        <div className="flex p-1 rounded-xl" style={{ background: inputBg }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); clearAll() }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab.id ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === tab.id ? '#FF6B00' : 'transparent',
                color: activeTab === tab.id ? 'white' : currentBg.textLight
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 説明 */}
        <Card className="text-center py-4">
          <div className="text-2xl mb-2">
            {activeTab === 'invoice' && '📄'}
            {activeTab === 'general' && '📝'}
            {activeTab === 'business-card' && '💳'}
          </div>
          <div className="text-sm font-medium" style={{ color: currentBg.text }}>
            {activeTab === 'invoice' && '請求書から情報を自動抽出'}
            {activeTab === 'general' && '画像内のテキストを抽出'}
            {activeTab === 'business-card' && '名刺から連絡先情報を抽出'}
          </div>
          <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
            Claude Vision AIによる高精度OCR
          </div>
        </Card>

        {/* 画像選択エリア */}
        {!preview ? (
          <Card className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                  style={{ background: '#FF6B00' }}
                >
                  <Camera className="w-7 h-7 text-white" />
                  <span className="text-xs text-white">撮影</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                  style={{ background: inputBg, border: `1px solid ${currentBg.border}` }}
                >
                  <Upload className="w-7 h-7" style={{ color: currentBg.text }} />
                  <span className="text-xs" style={{ color: currentBg.text }}>選択</span>
                </motion.button>
              </div>

              <p className="text-xs" style={{ color: currentBg.textLight }}>
                対応形式: JPEG, PNG, GIF, WebP, PDF（最大20MB）
              </p>
            </div>
          </Card>
        ) : (
          /* 画像プレビュー */
          <Card className="relative">
            <button
              onClick={clearAll}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <img
              src={preview}
              alt="プレビュー"
              className="w-full rounded-xl max-h-64 object-contain"
            />
            <div className="mt-3 flex gap-2">
              <Button
                block
                onClick={handleOCR}
                className="flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    OCR実行
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* 結果表示 */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium" style={{ color: currentBg.text }}>抽出結果</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.structured_data || result.data || result.text)}
                    className="p-2 rounded-lg"
                    style={{ background: inputBg }}
                  >
                    <Copy className="w-4 h-4" style={{ color: currentBg.text }} />
                  </button>
                </div>

                {/* 請求書結果 */}
                {activeTab === 'invoice' && result.structured_data && (
                  <div className="space-y-3">
                    <ResultRow label="業者名" value={result.structured_data.vendor_name} />
                    <ResultRow label="請求日" value={result.structured_data.invoice_date} />
                    <ResultRow label="金額" value={result.structured_data.total_amount ? `¥${result.structured_data.total_amount.toLocaleString()}` : null} highlight />
                    <ResultRow label="件名" value={result.structured_data.subject} />

                    {result.structured_data.items && result.structured_data.items.length > 0 && (
                      <div>
                        <div className="text-xs mb-2" style={{ color: currentBg.textLight }}>明細</div>
                        <div className="space-y-1">
                          {result.structured_data.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 rounded-lg" style={{ background: inputBg }}>
                              <span style={{ color: currentBg.text }}>{item.description}</span>
                              <span className="text-emerald-400">¥{item.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.structured_data.bank_info?.bank_name && (
                      <div>
                        <div className="text-xs mb-2" style={{ color: currentBg.textLight }}>振込先</div>
                        <div className="text-sm p-2 rounded-lg" style={{ background: inputBg, color: currentBg.text }}>
                          {result.structured_data.bank_info.bank_name} {result.structured_data.bank_info.branch_name}<br/>
                          {result.structured_data.bank_info.account_type} {result.structured_data.bank_info.account_number}<br/>
                          {result.structured_data.bank_info.account_holder}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 名刺結果 */}
                {activeTab === 'business-card' && result.data && (
                  <div className="space-y-3">
                    <ResultRow label="会社名" value={result.data.company_name} />
                    <ResultRow label="部署" value={result.data.department} />
                    <ResultRow label="役職" value={result.data.position} />
                    <ResultRow label="氏名" value={result.data.name} highlight />
                    <ResultRow label="電話" value={result.data.phone} />
                    <ResultRow label="携帯" value={result.data.mobile} />
                    <ResultRow label="メール" value={result.data.email} />
                    <ResultRow label="住所" value={result.data.address} />
                  </div>
                )}

                {/* 汎用OCR結果 */}
                {activeTab === 'general' && result.text && (
                  <div
                    className="text-sm whitespace-pre-wrap p-3 rounded-lg max-h-64 overflow-y-auto"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    {result.text}
                  </div>
                )}

                {/* 生テキスト表示（請求書） */}
                {result.raw_text && activeTab === 'invoice' && (
                  <details className="mt-3">
                    <summary className="text-xs cursor-pointer" style={{ color: currentBg.textLight }}>
                      生テキストを表示
                    </summary>
                    <div
                      className="text-xs whitespace-pre-wrap mt-2 p-2 rounded-lg max-h-32 overflow-y-auto"
                      style={{ background: inputBg, color: currentBg.textLight }}
                    >
                      {result.raw_text}
                    </div>
                  </details>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// 結果行コンポーネント
function ResultRow({ label, value, highlight = false }) {
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]

  if (!value) return null

  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: currentBg.textLight }}>{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? 'text-emerald-400' : ''}`}
        style={{ color: highlight ? undefined : currentBg.text }}
      >
        {value}
      </span>
    </div>
  )
}
