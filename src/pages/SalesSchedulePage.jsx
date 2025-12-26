import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'

const EVENT_TYPES = [
  { value: 'visit', label: '訪問', color: 'bg-blue-500/20 text-blue-400', icon: '🏢' },
  { value: 'meeting', label: '商談', color: 'bg-emerald-500/20 text-emerald-400', icon: '🤝' },
  { value: 'estimate', label: '見積提出', color: 'bg-amber-500/20 text-amber-400', icon: '📋' },
  { value: 'inspection', label: '現調', color: 'bg-purple-500/20 text-purple-400', icon: '🔍' },
]

export default function SalesSchedulePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeTab, setActiveTab] = useState('list') // list, calendar
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    title: '',
    type: 'visit',
    client: '',
    date: '',
    time: '',
    location: '',
    memo: '',
  })

  // サンプルデータ
  const events = [
    { id: 1, title: '大成建設 新規案件打合せ', type: 'meeting', client: '株式会社大成建設', date: '2024-01-15', time: '10:00', location: '本社会議室', memo: '新規マンション案件について' },
    { id: 2, title: '清水建設 見積提出', type: 'estimate', client: '清水建設株式会社', date: '2024-01-15', time: '14:00', location: '清水建設本社', memo: '商業施設改修工事' },
    { id: 3, title: '東京都庁 現地調査', type: 'inspection', client: '東京都建設局', date: '2024-01-16', time: '09:00', location: '新宿区西新宿', memo: '道路改修工事の現調' },
    { id: 4, title: '鹿島建設 定例訪問', type: 'visit', client: '鹿島建設株式会社', date: '2024-01-17', time: '15:00', location: '港区元赤坂', memo: '' },
    { id: 5, title: '国交省 入札説明会', type: 'meeting', client: '国土交通省', date: '2024-01-18', time: '13:00', location: 'さいたま新都心', memo: '橋梁補修工事' },
  ]

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {})

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`
  }

  const getTypeStyle = (type) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    return found ? found.color : 'bg-slate-500/20 text-slate-400'
  }

  const getTypeIcon = (type) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    return found ? found.icon : '📅'
  }

  const getTypeLabel = (type) => {
    const found = EVENT_TYPES.find(t => t.value === type)
    return found ? found.label : 'その他'
  }

  const handleSubmit = () => {
    if (!form.title || !form.date) {
      showToast('タイトルと日付は必須です')
      return
    }
    showToast(selectedEvent ? '更新しました' : '登録しました')
    setShowModal(false)
    resetForm()
  }

  const openEventDetail = (event) => {
    setSelectedEvent(event)
    setForm({
      title: event.title || '',
      type: event.type || 'visit',
      client: event.client || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      memo: event.memo || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setForm({
      title: '',
      type: 'visit',
      client: '',
      date: '',
      time: '',
      location: '',
      memo: '',
    })
    setSelectedEvent(null)
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="営業スケジュール"
        icon="📅"
        gradient="from-indigo-700 to-indigo-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 新規登録ボタン */}
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl text-sm font-bold text-white"
        >
          + 予定を追加
        </button>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'list' ? 'bg-indigo-500/20 text-indigo-400' : ''
            }`}
            style={activeTab !== 'list' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            📋 リスト
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'calendar' ? 'bg-indigo-500/20 text-indigo-400' : ''
            }`}
            style={activeTab !== 'calendar' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            📆 カレンダー
          </button>
        </div>

        {/* 今日の予定サマリー */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: currentBg.text }}>今日の予定</span>
            <span className="text-xs" style={{ color: currentBg.textLight }}>
              {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {EVENT_TYPES.map(type => (
              <div key={type.value} className="py-2 rounded-lg" style={{ background: inputBg }}>
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {events.filter(e => e.type === type.value && e.date === '2024-01-15').length}
                </div>
                <div className="text-[10px]" style={{ color: currentBg.textLight }}>{type.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {activeTab === 'list' ? (
          <>
            {/* 日付別リスト */}
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <div key={date} className="mb-6">
                <SectionTitle>{formatDate(date)}</SectionTitle>
                {dayEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openEventDetail(event)}
                  >
                    <Card className="mb-2.5 cursor-pointer hover:opacity-80">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getTypeIcon(event.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${getTypeStyle(event.type)}`}>
                              {getTypeLabel(event.type)}
                            </span>
                            <span className="text-xs font-bold" style={{ color: currentBg.text }}>{event.time}</span>
                          </div>
                          <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                            {event.title}
                          </div>
                          <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                            {event.client}
                          </div>
                          {event.location && (
                            <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ))}
          </>
        ) : (
          <Card>
            <div className="text-center py-12" style={{ color: currentBg.textLight }}>
              <div className="text-5xl mb-3">📆</div>
              <div className="text-sm">カレンダービュー</div>
              <div className="text-xs mt-1">（実装予定）</div>
            </div>
          </Card>
        )}
      </div>

      {/* 登録・編集モーダル */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowModal(false); resetForm() }}
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
                  {selectedEvent ? '📅 予定を編集' : '📅 予定を追加'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm() }} className="text-2xl" style={{ color: currentBg.textLight }}>×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>タイトル *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="打合せの内容を入力"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>種別</label>
                  <div className="flex gap-2 flex-wrap">
                    {EVENT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: type.value })}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          form.type === type.value ? type.color : ''
                        }`}
                        style={form.type !== type.value ? { background: inputBg, color: currentBg.textLight } : {}}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>顧客名</label>
                  <input
                    type="text"
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="株式会社サンプル"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>日付 *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-sm"
                      style={{ background: inputBg, color: currentBg.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>時間</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-sm"
                      style={{ background: inputBg, color: currentBg.text }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>場所</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                    placeholder="会議室・住所など"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>メモ</label>
                  <textarea
                    value={form.memo}
                    onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                    style={{ background: inputBg, color: currentBg.text }}
                    rows={3}
                    placeholder="補足情報を入力"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowModal(false); resetForm() }}
                    className="flex-1 py-3 rounded-xl font-bold"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl font-bold text-white"
                  >
                    {selectedEvent ? '更新する' : '登録する'}
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
