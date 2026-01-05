import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

const STATUS_OPTIONS = [
  { value: 'pending', label: '入金待ち', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'partial', label: '一部入金', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'completed', label: '入金済み', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'overdue', label: '延滞', color: 'bg-red-500/20 text-red-400' },
]

export default function IncomePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeStatus, setActiveStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)

  // APIからデータを取得
  useEffect(() => {
    fetchIncomes()
  }, [])

  const fetchIncomes = async () => {
    try {
      const res = await fetch(`${API_BASE}/receivables/`)
      if (res.ok) {
        const data = await res.json()
        // ステータスを判定（期限切れチェック）
        const today = new Date().toISOString().split('T')[0]
        const processedData = data.map(item => {
          let status = item.status || 'pending'
          if (status === 'pending' && item.expected_date && item.expected_date < today) {
            status = 'overdue'
          }
          return {
            id: item.id,
            client: item.client_name || '未設定',
            project: item.description || '案件名未設定',
            invoiceNo: `RCV-${item.id}`,
            amount: item.amount || 0,
            dueDate: item.expected_date || '',
            status: status,
            invoiceDate: item.created_at?.split('T')[0] || '',
            paidAmount: status === 'completed' ? item.amount : 0,
            paidDate: item.actual_date || '',
          }
        })
        setIncomes(processedData)
      }
    } catch (error) {
      console.error('Failed to fetch incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredIncomes = incomes.filter(item => {
    return !activeStatus || item.status === activeStatus
  })

  const getStatusStyle = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status)
    return found ? found.label : status
  }

  const formatAmount = (amount) => {
    return `${(amount / 10000).toLocaleString()}万円`
  }

  const totalPending = incomes.filter(i => i.status === 'pending' || i.status === 'partial').reduce((sum, i) => sum + (i.amount - (i.paidAmount || 0)), 0)
  const totalOverdue = incomes.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0)
  const totalCompleted = incomes.filter(i => i.status === 'completed').reduce((sum, i) => sum + i.amount, 0)

  const handleMarkAsPaid = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/receivables/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          actual_date: new Date().toISOString().split('T')[0],
        }),
      })
      if (res.ok) {
        showToast('入金を記録しました')
        fetchIncomes()
      } else {
        showToast('更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to mark as paid:', error)
      showToast('エラーが発生しました')
    }
    setShowModal(false)
    setSelectedItem(null)
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="入金管理"
        icon="💰"
        gradient="from-emerald-700 to-emerald-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>入金待ち</div>
            <div className="text-lg font-bold text-amber-400">{formatAmount(totalPending)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>延滞</div>
            <div className="text-lg font-bold text-red-400">{formatAmount(totalOverdue)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>今月入金</div>
            <div className="text-lg font-bold text-emerald-400">{formatAmount(totalCompleted)}</div>
          </Card>
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveStatus('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeStatus ? 'bg-emerald-500/20 text-emerald-400' : ''
            }`}
            style={activeStatus ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            すべて
          </button>
          {STATUS_OPTIONS.map(status => (
            <button
              key={status.value}
              onClick={() => setActiveStatus(status.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                activeStatus === status.value ? status.color : ''
              }`}
              style={activeStatus !== status.value ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {status.label}
            </button>
          ))}
        </div>

        <SectionTitle>入金一覧</SectionTitle>

        {/* 入金一覧 */}
        {loading ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm">読み込み中...</div>
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">💰</div>
            <div className="text-lg mb-1">該当する入金がありません</div>
          </div>
        ) : (
          filteredIncomes.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { setSelectedItem(item); setShowModal(true) }}
            >
              <Card className="mb-2.5 cursor-pointer hover:opacity-80">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusStyle(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>{item.invoiceNo}</span>
                    </div>
                    <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                      {item.client}
                    </div>
                    <div className="text-xs mt-1 truncate" style={{ color: currentBg.textLight }}>
                      {item.project}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: currentBg.text }}>
                      {formatAmount(item.amount)}
                    </div>
                    {item.status === 'partial' && (
                      <div className="text-xs text-blue-400">
                        入金済: {formatAmount(item.paidAmount)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>
                    請求日: {item.invoiceDate}
                  </div>
                  <div className={`text-xs font-semibold ${item.status === 'overdue' ? 'text-red-400' : ''}`} style={item.status !== 'overdue' ? { color: currentBg.textLight } : {}}>
                    支払期限: {item.dueDate}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 詳細モーダル */}
      <AnimatePresence>
        {showModal && selectedItem && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); setSelectedItem(null) }}
          >
            <motion.div
              className="w-full rounded-t-2xl flex flex-col"
              style={{ background: cardBg, backdropFilter: isOcean ? 'blur(10px)' : 'none', maxHeight: 'calc(100vh - 60px)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  💰 入金詳細
                </h3>
                <button onClick={() => { setShowModal(false); setSelectedItem(null) }} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-4">
                <div className="text-center py-4 rounded-xl" style={{ background: inputBg }}>
                  <div className="text-3xl font-bold" style={{ color: currentBg.text }}>
                    {formatAmount(selectedItem.amount)}
                  </div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${getStatusStyle(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>請求番号</span>
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>取引先</span>
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>案件名</span>
                    <span className="text-sm font-semibold text-right" style={{ color: currentBg.text }}>{selectedItem.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>請求日</span>
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.invoiceDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>支払期限</span>
                    <span className={`text-sm font-semibold ${selectedItem.status === 'overdue' ? 'text-red-400' : ''}`} style={selectedItem.status !== 'overdue' ? { color: currentBg.text } : {}}>{selectedItem.dueDate}</span>
                  </div>
                  {selectedItem.paidAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: currentBg.textLight }}>入金済み額</span>
                      <span className="text-sm font-semibold text-emerald-400">{formatAmount(selectedItem.paidAmount)}</span>
                    </div>
                  )}
                  {selectedItem.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: currentBg.textLight }}>入金日</span>
                      <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.paidDate}</span>
                    </div>
                  )}
                </div>

                {selectedItem.status !== 'completed' && (
                  <div className="pt-4">
                    <button
                      onClick={() => handleMarkAsPaid(selectedItem)}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-sm font-bold text-white"
                    >
                      入金を記録する
                    </button>
                  </div>
                )}

              </div>
              </div>

              {/* 固定フッター */}
              <div className="p-5 pt-3 flex-shrink-0" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                <div className="flex gap-3">
                  <button
                    onClick={() => { showToast('請求書を表示'); }}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    📄 請求書を見る
                  </button>
                  <button
                    onClick={() => { showToast('催促メールを送信'); setShowModal(false) }}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    ✉️ 催促メール
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
