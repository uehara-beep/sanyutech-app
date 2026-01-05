import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, FileText, List, Eye } from 'lucide-react'
import { Header, Card, Toast } from '../components/common'
import { API_BASE, authPostFormData } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function QuoteImportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        showToast('Excel形式(.xlsx, .xls)のファイルを選択してください')
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      showToast('ファイルを選択してください')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const data = await authPostFormData(`${API_BASE}/quotes/import-excel`, formData)

      if (data.success) {
        setResult({
          success: true,
          id: data.id,
          projectName: data.project_name,
          totalAmount: data.total_amount,
          itemsCount: data.items_count,
          conditionsCount: data.conditions_count,
          detailSheets: data.detail_sheets || [],
          conditionSheets: data.condition_sheets || [],
          message: data.message || '見積書を取り込みました'
        })
        showToast('取り込みが完了しました')
      } else {
        setResult({
          success: false,
          message: data.detail || 'ファイルの読み込みに失敗しました'
        })
        showToast('エラーが発生しました')
      }
    } catch (error) {
      console.error('Import error:', error)
      setResult({
        success: false,
        message: error.message || 'ネットワークエラーが発生しました'
      })
      showToast('エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="Excel取込"
        icon="📥"
        gradient="from-emerald-600 to-emerald-500"
        onBack={() => navigate(-1)}
      />

      <div className="p-4 space-y-4">
        {/* 説明 */}
        <Card>
          <div className="text-sm font-bold mb-3" style={{ color: currentBg.text }}>
            📋 サンユウテック見積書フォーマット
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: inputBg }}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: currentBg.text }}>シート1: 表紙</div>
                <div className="text-xs mt-0.5" style={{ color: currentBg.textLight }}>
                  発注者、工事名、工事場所、工期、有効期限、支払条件、担当者
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: inputBg }}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={16} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: currentBg.text }}>シート2: 内訳明細</div>
                <div className="text-xs mt-0.5" style={{ color: currentBg.textLight }}>
                  名称、規格、数量、単位、単価、金額、備考
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: inputBg }}>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <List size={16} className="text-purple-500" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: currentBg.text }}>シート3: 条件書</div>
                <div className="text-xs mt-0.5" style={{ color: currentBg.textLight }}>
                  施工条件リスト（番号付き）
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ファイル選択エリア */}
        <motion.div
          className="rounded-2xl p-8 text-center cursor-pointer border-2 border-dashed"
          style={{
            background: inputBg,
            borderColor: file ? '#10b981' : currentBg.textLight
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileSelect}
          />

          {file ? (
            <>
              <FileSpreadsheet size={48} className="mx-auto mb-3 text-emerald-500" />
              <div className="font-bold" style={{ color: currentBg.text }}>{file.name}</div>
              <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <div className="text-xs mt-2 text-emerald-500">
                クリックして別のファイルを選択
              </div>
            </>
          ) : (
            <>
              <Upload size={48} className="mx-auto mb-3" style={{ color: currentBg.textLight }} />
              <div className="font-bold" style={{ color: currentBg.text }}>
                ファイルを選択
              </div>
              <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                クリックしてExcelファイル(.xlsx, .xls)を選択
              </div>
            </>
          )}
        </motion.div>

        {/* 結果表示 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={result.success ? 'border-emerald-500/50' : 'border-red-500/50'}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold" style={{ color: currentBg.text }}>
                    {result.success ? '取り込み完了' : 'エラー'}
                  </div>
                  <div className="text-sm mt-1" style={{ color: currentBg.textLight }}>
                    {result.message}
                  </div>

                  {result.success && (
                    <div className="mt-3 space-y-3">
                      <div className="text-sm" style={{ color: currentBg.text }}>
                        <span className="font-bold">{result.projectName}</span>
                      </div>
                      <div className="flex gap-4 text-xs" style={{ color: currentBg.textLight }}>
                        <span>明細: {result.itemsCount}件</span>
                        <span>条件: {result.conditionsCount}件</span>
                        <span>金額: ¥{(result.totalAmount || 0).toLocaleString()}</span>
                      </div>

                      {/* 読み込んだシート情報 */}
                      {(result.detailSheets?.length > 0 || result.conditionSheets?.length > 0) && (
                        <div className="p-2 rounded-lg text-xs" style={{ background: inputBg }}>
                          <div className="font-bold mb-1.5" style={{ color: currentBg.text }}>📑 読み込んだシート</div>
                          {result.detailSheets?.length > 0 && (
                            <div className="flex items-center gap-1.5 mb-1" style={{ color: currentBg.textLight }}>
                              <FileSpreadsheet size={12} className="text-emerald-500" />
                              <span>内訳: {result.detailSheets.join(', ')}</span>
                            </div>
                          )}
                          {result.conditionSheets?.length > 0 && (
                            <div className="flex items-center gap-1.5" style={{ color: currentBg.textLight }}>
                              <List size={12} className="text-purple-500" />
                              <span>条件書: {result.conditionSheets.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 詳細を見るボタン */}
                      <button
                        onClick={() => navigate(`/quotes/${result.id}/edit`)}
                        className="mt-3 w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        見積書を確認
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/quotes')}
            className="flex-1 py-3.5 rounded-xl font-bold"
            style={{ background: inputBg, color: currentBg.textLight }}
          >
            見積一覧へ
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                取込中...
              </>
            ) : (
              <>
                <Upload size={18} />
                取り込む
              </>
            )}
          </button>
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
