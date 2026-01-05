import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function ApprovePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/approvals/pending`)
      if (res.ok) {
        setApprovals(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject'
      const res = await fetch(`${API_BASE}/approvals/${id}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: '管理者' }),
      })

      if (res.ok) {
        setToastMsg(action === 'approve' ? '承認しました' : '却下しました')
        setToast(true)
        setTimeout(() => setToast(false), 2000)
        fetchApprovals()
      }
    } catch (error) {
      setToastMsg('エラーが発生しました')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    }
  }

  const getTypeIcon = (type) => {
    const icons = { expense: '💳', invoice: '📄', leave: '🏖️' }
    return icons[type] || '📋'
  }

  const getTypeLabel = (type) => {
    const labels = { expense: '経費精算', invoice: '請求書', leave: '休暇申請' }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="承認センター"
        icon="✅"
        gradient="from-amber-700 to-amber-400"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        <SectionTitle>📋 承認待ち（{approvals.length}件）</SectionTitle>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">✅</div>
            <div>承認待ちはありません</div>
          </div>
        ) : (
          approvals.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs" style={{ color: currentBg.textLight }}>
                    {getTypeIcon(item.type)} {getTypeLabel(item.type)}
                  </span>
                  <span className="text-xs" style={{ color: currentBg.textLight }}>{item.requested_at?.split('T')[0]}</span>
                </div>
                <div className="text-[15px] font-semibold mb-1" style={{ color: currentBg.text }}>申請 #{item.reference_id}</div>
                <div className="text-xs mb-3" style={{ color: currentBg.textLight }}>申請者: {item.requested_by || '不明'}</div>
                <div className="flex gap-2.5">
                  <button
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                    onClick={() => handleAction(item.id, 'reject')}
                  >
                    却下
                  </button>
                  <button
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    onClick={() => handleAction(item.id, 'approve')}
                  >
                    承認
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Toast message={toastMsg} isVisible={toast} />
    </div>
  )
}
