import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'

const STATUS_OPTIONS = [
  { value: 'pending', label: '支払待ち', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'scheduled', label: '支払予定', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'completed', label: '支払済み', color: 'bg-emerald-500/20 text-emerald-400' },
]

const VENDOR_TYPES = [
  { value: 'subcon', label: '協力会社', icon: '👷' },
  { value: 'material', label: '資材', icon: '🏗️' },
  { value: 'rental', label: 'レンタル', icon: '🚜' },
  { value: 'other', label: 'その他', icon: '📦' },
]

export default function ExpensePayPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeStatus, setActiveStatus] = useState('')
  const [activeVendorType, setActiveVendorType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  // サンプルデータ
  const payments = [
    { id: 1, vendor: '株式会社山田組', vendorType: 'subcon', project: '新宿マンション新築工事', invoiceNo: 'PAY-2024-001', amount: 5500000, dueDate: '2024-01-25', status: 'pending', invoiceDate: '2024-01-10' },
    { id: 2, vendor: 'サンワレンタル', vendorType: 'rental', project: '渋谷商業ビル改修', invoiceNo: 'PAY-2024-002', amount: 850000, dueDate: '2024-01-20', status: 'scheduled', scheduledDate: '2024-01-20', invoiceDate: '2024-01-05' },
    { id: 3, vendor: '東京鋼材株式会社', vendorType: 'material', project: '品川駅前再開発', invoiceNo: 'PAY-2024-003', amount: 3200000, dueDate: '2024-01-31', status: 'pending', invoiceDate: '2024-01-08' },
    { id: 4, vendor: '有限会社佐藤電工', vendorType: 'subcon', project: '新宿マンション新築工事', invoiceNo: 'PAY-2023-098', amount: 2800000, dueDate: '2023-12-28', status: 'completed', paidDate: '2023-12-27', invoiceDate: '2023-12-10' },
    { id: 5, vendor: '関東コンクリート', vendorType: 'material', project: '横浜港湾施設', invoiceNo: 'PAY-2023-095', amount: 4500000, dueDate: '2023-12-25', status: 'completed', paidDate: '2023-12-22', invoiceDate: '2023-12-05' },
  ]

  const filteredPayments = payments.filter(item => {
    const matchStatus = !activeStatus || item.status === activeStatus
    const matchType = !activeVendorType || item.vendorType === activeVendorType
    return matchStatus && matchType
  })

  const getStatusStyle = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find(s => s.value === status)
    return found ? found.label : status
  }

  const getVendorIcon = (type) => {
    const found = VENDOR_TYPES.find(t => t.value === type)
    return found ? found.icon : '📦'
  }

  const formatAmount = (amount) => {
    return `${(amount / 10000).toLocaleString()}万円`
  }

  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const totalScheduled = payments.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0)
  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)

  const handleMarkAsPaid = (item) => {
    showToast('支払いを記録しました')
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
        title="支払管理"
        icon="💳"
        gradient="from-rose-700 to-rose-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>支払待ち</div>
            <div className="text-lg font-bold text-amber-400">{formatAmount(totalPending)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>今月予定</div>
            <div className="text-lg font-bold text-blue-400">{formatAmount(totalScheduled)}</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>支払済み</div>
            <div className="text-lg font-bold text-emerald-400">{formatAmount(totalCompleted)}</div>
          </Card>
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveStatus('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !activeStatus ? 'bg-rose-500/20 text-rose-400' : ''
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

        {/* 業者種別フィルター */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {VENDOR_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setActiveVendorType(activeVendorType === type.value ? '' : type.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                activeVendorType === type.value ? 'bg-rose-500/20 text-rose-400' : ''
              }`}
              style={activeVendorType !== type.value ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        <SectionTitle>支払一覧</SectionTitle>

        {/* 支払一覧 */}
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            <div className="text-5xl mb-3">💳</div>
            <div className="text-lg mb-1">該当する支払がありません</div>
          </div>
        ) : (
          filteredPayments.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { setSelectedItem(item); setShowModal(true) }}
            >
              <Card className="mb-2.5 cursor-pointer hover:opacity-80">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getVendorIcon(item.vendorType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusStyle(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="text-xs" style={{ color: currentBg.textLight }}>{item.invoiceNo}</span>
                      </div>
                      <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                        {item.vendor}
                      </div>
                      <div className="text-xs mt-1 truncate" style={{ color: currentBg.textLight }}>
                        {item.project}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: currentBg.text }}>
                      {formatAmount(item.amount)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>
                    請求日: {item.invoiceDate}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: currentBg.textLight }}>
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
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); setSelectedItem(null) }}
          >
            <motion.div
              className="w-full rounded-t-2xl p-5 max-h-[85vh] overflow-auto"
              style={{ background: cardBg, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: currentBg.text }}>
                  💳 支払詳細
                </h3>
                <button onClick={() => { setShowModal(false); setSelectedItem(null) }} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              <div className="space-y-4">
                <div className="text-center py-4 rounded-xl" style={{ background: inputBg }}>
                  <div className="text-4xl mb-2">{getVendorIcon(selectedItem.vendorType)}</div>
                  <div className="text-3xl font-bold" style={{ color: currentBg.text }}>
                    {formatAmount(selectedItem.amount)}
                  </div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${getStatusStyle(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>支払番号</span>
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: currentBg.textLight }}>支払先</span>
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.vendor}</span>
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
                    <span className="text-sm font-semibold" style={{ color: currentBg.text }}>{selectedItem.dueDate}</span>
                  </div>
                  {selectedItem.scheduledDate && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: currentBg.textLight }}>支払予定日</span>
                      <span className="text-sm font-semibold text-blue-400">{selectedItem.scheduledDate}</span>
                    </div>
                  )}
                  {selectedItem.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: currentBg.textLight }}>支払日</span>
                      <span className="text-sm font-semibold text-emerald-400">{selectedItem.paidDate}</span>
                    </div>
                  )}
                </div>

                {selectedItem.status !== 'completed' && (
                  <div className="pt-4 space-y-3">
                    {selectedItem.status === 'pending' && (
                      <button
                        onClick={() => { showToast('支払予定を設定しました'); setShowModal(false) }}
                        className="w-full py-3.5 rounded-xl text-sm font-bold"
                        style={{ background: inputBg, color: currentBg.text }}
                      >
                        📅 支払予定を設定
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkAsPaid(selectedItem)}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl text-sm font-bold text-white"
                    >
                      支払いを記録する
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { showToast('請求書を表示'); }}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    📄 請求書を見る
                  </button>
                  <button
                    onClick={() => navigate('/subcon')}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    🏢 業者情報
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
