import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Card, Toast } from '../components/common'
import { API_BASE, authPostFormData } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function InvoicePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [projects, setProjects] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  // OCR結果
  const [ocrResult, setOcrResult] = useState(null)
  // 明細と現場の紐付け
  const [itemProjects, setItemProjects] = useState({})

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`)
      if (res.ok) setProjects(await res.json())
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*,application/pdf'
      input.onchange = (ev) => handleFileUpload(ev)
      input.click()
      return
    }

    setAnalyzing(true)
    setOcrResult(null)
    setItemProjects({})

    try {
      console.log('=== OCRアップロード ===')
      console.log('ファイル:', file.name, file.size, 'bytes')

      const formData = new FormData()
      formData.append('file', file)

      const result = await authPostFormData(`${API_BASE}/ocr/invoice`, formData)
      console.log('OCR結果:', result)

      if (result.success && result.data) {
        setOcrResult(result.data)
        showToast('AI解析完了')
      } else {
        showToast(result.error || '解析に失敗しました')
      }
    } catch (error) {
      console.error('OCR Error:', error)
      showToast('通信エラーが発生しました')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleProjectChange = (index, projectId) => {
    setItemProjects(prev => ({
      ...prev,
      [index]: projectId
    }))
  }

  const handleRegister = async () => {
    if (!ocrResult) return

    const items = ocrResult.items || []
    let successCount = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const projectId = itemProjects[i]

      if (!projectId) continue

      try {
        const res = await fetch(`${API_BASE}/billings/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor: ocrResult.vendor_name || '',
            amount: item.amount || 0,
            date: ocrResult.invoice_date || new Date().toISOString().split('T')[0],
            items: item.name || '',
            category: 'subcontract',
            project_id: parseInt(projectId),
            status: 'pending',
          }),
        })

        if (res.ok) successCount++
      } catch (error) {
        console.error('登録エラー:', error)
      }
    }

    if (successCount > 0) {
      showToast(`${successCount}件を登録しました`)
      setOcrResult(null)
      setItemProjects({})
    } else {
      showToast('現場を選択してください')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const formatAmount = (amount) => {
    if (!amount) return '¥0'
    return `¥${Number(amount).toLocaleString()}`
  }

  return (
    <div className="min-h-screen pb-24 overflow-y-auto" style={{ background: currentBg.bg }}>
      <Header
        title="請求書AI"
        icon="📄"
        gradient="from-orange-900 to-orange-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* アップロードボタン */}
        <button
          onClick={handleFileUpload}
          disabled={analyzing}
          className="w-full py-6 mb-6 border-2 border-dashed border-orange-500/50 rounded-xl text-center bg-orange-500/10"
        >
          {analyzing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-orange-400">AI解析中...</span>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-2">📤</div>
              <div className="text-sm font-semibold">請求書をアップロード</div>
              <div className="text-xs text-slate-400 mt-1">PDF / 画像</div>
            </>
          )}
        </button>

        {/* OCR結果表示 */}
        {ocrResult && (
          <div className="space-y-4">
            {/* ヘッダー情報 */}
            <Card className="p-4">
              <div className="text-xs text-slate-400 mb-1">請求元</div>
              <div className="text-lg font-bold mb-3">{ocrResult.vendor_name || '不明'}</div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400">日付</div>
                  <div>{ocrResult.invoice_date || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">合計金額</div>
                  <div className="text-orange-400 font-bold">{formatAmount(ocrResult.total_amount)}</div>
                </div>
              </div>

              {ocrResult.subject && (
                <div className="mt-3">
                  <div className="text-xs text-slate-400">件名</div>
                  <div className="text-sm">{ocrResult.subject}</div>
                </div>
              )}
            </Card>

            {/* 明細一覧 */}
            <div className="text-sm font-semibold text-slate-300 mb-2">📋 明細一覧</div>

            {(ocrResult.items || []).length === 0 ? (
              <Card className="p-4 text-center text-slate-400">
                明細がありません
              </Card>
            ) : (
              <div className="space-y-3">
                {ocrResult.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-4">
                        <div className="text-sm font-medium">{item.name || `明細 ${index + 1}`}</div>
                        {item.quantity && (
                          <div className="text-xs text-slate-400">
                            {item.quantity} {item.unit || '式'}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-orange-400 font-bold">{formatAmount(item.amount)}</div>
                      </div>
                    </div>

                    {/* 現場選択 */}
                    <select
                      value={itemProjects[index] || ''}
                      onChange={(e) => handleProjectChange(index, e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">現場を選択...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Card>
                ))}
              </div>
            )}

            {/* 登録ボタン */}
            <button
              onClick={handleRegister}
              className="w-full py-4 bg-orange-500 rounded-xl text-white font-bold mt-4"
            >
              選択した現場に登録
            </button>
          </div>
        )}

        {/* 初期状態 */}
        {!ocrResult && !analyzing && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">🧾</div>
            <div className="text-sm">請求書をアップロードすると</div>
            <div className="text-sm">AIが自動で情報を抽出します</div>
          </div>
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
