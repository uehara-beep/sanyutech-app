import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const SLIP_TYPES = [
  { id: 'all', label: '全て', icon: '📋' },
  { id: '廃材伝票', label: '廃材', icon: '🗑️' },
  { id: '建材納品書', label: '建材', icon: '🧱' },
  { id: '産廃受入書', label: '産廃', icon: '♻️' },
]

export default function MaterialSlipPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [slips, setSlips] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [slipsRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/material-slips/`).catch(() => null),
        fetch(`${API_BASE}/projects`),
      ])

      if (slipsRes?.ok) setSlips(await slipsRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowResult(true)
    setOcrResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/ocr/material-slip`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          setOcrResult(result.data)
          showToast('伝票を読み取りました')
        } else {
          showToast(result.error || '読み取りに失敗しました')
          setShowResult(false)
        }
      } else {
        showToast('サーバーエラーが発生しました')
        setShowResult(false)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      showToast('通信エラーが発生しました')
      setShowResult(false)
    } finally {
      setScanning(false)
    }
  }

  const handleSave = async () => {
    if (!ocrResult) return

    try {
      const res = await fetch(`${API_BASE}/material-slips/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slip_type: ocrResult.slip_type,
          date: ocrResult.date,
          time: ocrResult.time,
          customer_name: ocrResult.customer_name,
          site_name: ocrResult.site_name,
          items: ocrResult.items,
          vehicle_number: ocrResult.vehicle_number,
          vendor_name: ocrResult.vendor_name,
          notes: ocrResult.notes,
        }),
      })

      if (res.ok) {
        showToast('保存しました')
        setShowResult(false)
        setOcrResult(null)
        fetchData()
      } else {
        showToast('保存しました（デモ）')
        setShowResult(false)
        setOcrResult(null)
        // Add to local list for demo
        setSlips(prev => [{
          id: Date.now(),
          ...ocrResult,
          created_at: new Date().toISOString(),
        }, ...prev])
      }
    } catch (error) {
      // Demo mode
      showToast('保存しました（デモ）')
      setShowResult(false)
      setSlips(prev => [{
        id: Date.now(),
        ...ocrResult,
        created_at: new Date().toISOString(),
      }, ...prev])
      setOcrResult(null)
    }
  }

  const getSlipIcon = (type) => {
    const icons = {
      '廃材伝票': '🗑️',
      '建材納品書': '🧱',
      '産廃受入書': '♻️',
    }
    return icons[type] || '📋'
  }

  const getSlipColor = (type) => {
    const colors = {
      '廃材伝票': 'from-amber-600 to-amber-400',
      '建材納品書': 'from-blue-600 to-blue-400',
      '産廃受入書': 'from-green-600 to-green-400',
    }
    return colors[type] || 'from-slate-600 to-slate-400'
  }

  const filteredSlips = filter === 'all'
    ? slips
    : slips.filter(s => s.slip_type === filter)

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="材料伝票"
        icon="📋"
        gradient="from-amber-800 to-amber-400"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* スキャンボタン */}
        <label className="block mb-6">
          <Card className="py-6 text-center border-2 border-dashed border-amber-500/50 cursor-pointer">
            {scanning ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm" style={{ color: currentBg.textLight }}>読み取り中...</span>
              </div>
            ) : (
              <>
                <Camera className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                <div className="text-sm font-semibold" style={{ color: currentBg.text }}>伝票を撮影</div>
                <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                  廃材伝票・建材納品書・産廃受入書
                </div>
              </>
            )}
          </Card>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScan}
            disabled={scanning}
          />
        </label>

        {/* フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {SLIP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                filter === type.id
                  ? 'bg-amber-500 text-white'
                  : ''
              }`}
              style={filter !== type.id ? { background: inputBg, color: currentBg.text } : {}}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        <SectionTitle>📋 伝票履歴</SectionTitle>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : filteredSlips.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">📭</div>
            <div>伝票がありません</div>
          </div>
        ) : (
          filteredSlips.map((slip, i) => (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getSlipColor(slip.slip_type)} flex items-center justify-center text-lg`}>
                    {getSlipIcon(slip.slip_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold truncate" style={{ color: currentBg.text }}>
                        {slip.vendor_name || slip.customer_name || '不明'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 whitespace-nowrap ml-2">
                        {slip.slip_type}
                      </span>
                    </div>
                    <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>
                      {slip.site_name || '現場不明'}
                    </div>
                    {slip.items && slip.items.length > 0 && (
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        {slip.items.map((item, idx) => (
                          <span key={idx}>
                            {item.name} {item.quantity}{item.unit}
                            {idx < slip.items.length - 1 && '、'}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[11px]" style={{ color: currentBg.textLight }}>
                        {slip.date} {slip.time || ''}
                      </span>
                      {slip.vehicle_number && (
                        <span className="text-[11px]" style={{ color: currentBg.textLight }}>
                          🚛 {slip.vehicle_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* OCR結果モーダル */}
      {showResult && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => !scanning && setShowResult(false)}
        >
          <motion.div
            className="w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: isOcean ? 'rgba(30,30,50,0.98)' : currentBg.cardBg || '#1a1a2e' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>
              {scanning ? '読み取り中...' : '読み取り結果'}
            </div>

            {scanning ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p style={{ color: currentBg.textLight }}>AIが伝票を解析しています...</p>
              </div>
            ) : ocrResult ? (
              <div className="space-y-4">
                {/* 伝票種類 */}
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: inputBg }}>
                  <span className="text-2xl">{getSlipIcon(ocrResult.slip_type)}</span>
                  <div>
                    <div className="text-xs" style={{ color: currentBg.textLight }}>伝票種類</div>
                    <div className="font-bold" style={{ color: currentBg.text }}>{ocrResult.slip_type}</div>
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                    <div className="text-xs" style={{ color: currentBg.textLight }}>日付</div>
                    <div className="font-semibold" style={{ color: currentBg.text }}>{ocrResult.date || '-'}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                    <div className="text-xs" style={{ color: currentBg.textLight }}>時刻</div>
                    <div className="font-semibold" style={{ color: currentBg.text }}>{ocrResult.time || '-'}</div>
                  </div>
                </div>

                {/* 業者・客先 */}
                <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>業者名</div>
                  <div className="font-semibold" style={{ color: currentBg.text }}>{ocrResult.vendor_name || '-'}</div>
                </div>

                <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>客先名</div>
                  <div className="font-semibold" style={{ color: currentBg.text }}>{ocrResult.customer_name || '-'}</div>
                </div>

                <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>現場名</div>
                  <div className="font-semibold" style={{ color: currentBg.text }}>{ocrResult.site_name || '-'}</div>
                </div>

                {/* 品目 */}
                {ocrResult.items && ocrResult.items.length > 0 && (
                  <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                    <div className="text-xs mb-2" style={{ color: currentBg.textLight }}>品目</div>
                    {ocrResult.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b last:border-0" style={{ borderColor: currentBg.border }}>
                        <span style={{ color: currentBg.text }}>{item.name}</span>
                        <span className="font-bold text-amber-500">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 車番 */}
                {ocrResult.vehicle_number && (
                  <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                    <div className="text-xs" style={{ color: currentBg.textLight }}>車番</div>
                    <div className="font-semibold" style={{ color: currentBg.text }}>🚛 {ocrResult.vehicle_number}</div>
                  </div>
                )}

                {/* 備考 */}
                {ocrResult.notes && (
                  <div className="p-3 rounded-xl" style={{ background: inputBg }}>
                    <div className="text-xs" style={{ color: currentBg.textLight }}>備考</div>
                    <div className="text-sm" style={{ color: currentBg.text }}>{ocrResult.notes}</div>
                  </div>
                )}

                {/* 保存ボタン */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowResult(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl font-bold"
                  >
                    保存する
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
