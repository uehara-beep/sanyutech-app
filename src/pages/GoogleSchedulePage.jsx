/**
 * Google Workspace スケジュール連携画面
 * - Google Calendarの予定を表示
 * - 権限に応じて表示内容を制御
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, Toast } from '../components/common'
import { API_BASE, authGet } from '../config/api'
import { useThemeStore, useAuthStore, backgroundStyles } from '../store'

// 日付ユーティリティ
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const formatDateYMD = (d) => {
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 週の開始日（月曜日）を取得
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// 月の日付配列を取得
const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  // 月の開始日の曜日（0=日曜）
  const startDayOfWeek = firstDay.getDay()

  // 前月の日を追加
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, isCurrentMonth: false })
  }

  // 当月の日を追加
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // 次月の日を追加（6週分になるまで）
  while (days.length < 42) {
    const lastDate = days[days.length - 1].date
    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + 1)
    days.push({ date: nextDate, isCurrentMonth: false })
  }

  return days
}

export default function GoogleSchedulePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const { user } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('week') // week | month
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [userRole, setUserRole] = useState('employee')

  // 表示期間を計算
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = getWeekStart(currentDate)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return { start, end }
    } else {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      return { start, end }
    }
  }

  // スケジュール取得
  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      const startStr = formatDateYMD(start)
      const endStr = formatDateYMD(end)

      const data = await authGet(`${API_BASE}/schedules/?start_date=${startStr}&end_date=${endStr}`)
      setSchedules(data.schedules || [])
      setUserRole(data.user_role || 'employee')

      if (data.message) {
        showToast(data.message)
      }
    } catch (error) {
      console.error('Schedule fetch error:', error)
      showToast('スケジュールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [currentDate, viewMode])

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  // 前へ
  const handlePrev = () => {
    const d = new Date(currentDate)
    if (viewMode === 'week') {
      d.setDate(d.getDate() - 7)
    } else {
      d.setMonth(d.getMonth() - 1)
    }
    setCurrentDate(d)
  }

  // 次へ
  const handleNext = () => {
    const d = new Date(currentDate)
    if (viewMode === 'week') {
      d.setDate(d.getDate() + 7)
    } else {
      d.setMonth(d.getMonth() + 1)
    }
    setCurrentDate(d)
  }

  // 今日へ
  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // 特定の日の予定を取得
  const getEventsForDate = (date) => {
    const dateStr = formatDateYMD(date)
    return schedules.filter(s => {
      const eventDate = s.start?.split('T')[0]
      return eventDate === dateStr
    })
  }

  // 週表示用の日付配列
  const getWeekDays = () => {
    const start = getWeekStart(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  // イベント詳細モーダルを開く
  const openEventDetail = (event) => {
    if (event.is_own && event.description) {
      setSelectedEvent(event)
    }
  }

  // 権限の説明
  const getRoleDescription = () => {
    if (userRole === 'admin') {
      return '役職者：タイトル表示'
    } else {
      return '一般：予定ありのみ表示'
    }
  }

  // 週間ビュー
  const renderWeekView = () => {
    const weekDays = getWeekDays()
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const today = formatDateYMD(new Date())

    return (
      <div className="space-y-2">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs" style={{ color: currentBg.textLight }}>
          {dayNames.map((day, i) => (
            <div key={i} className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* 日付と予定 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((date, i) => {
            const dateStr = formatDateYMD(date)
            const isToday = dateStr === today
            const dayEvents = getEventsForDate(date)

            return (
              <div
                key={i}
                className={`min-h-24 rounded-lg p-1 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                style={{ background: inputBg }}
              >
                <div className={`text-center text-sm font-bold mb-1 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''
                }`} style={{ color: i !== 0 && i !== 6 ? currentBg.text : undefined }}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event, j) => (
                    <div
                      key={j}
                      onClick={() => openEventDetail(event)}
                      className={`text-[10px] px-1 py-0.5 rounded truncate ${
                        event.is_own
                          ? 'bg-blue-500 text-white cursor-pointer'
                          : event.display === 'busy'
                          ? 'bg-gray-500/50 text-gray-300'
                          : 'bg-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {event.display === 'busy' ? '予定あり' : event.display}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-center" style={{ color: currentBg.textLight }}>
                      +{dayEvents.length - 3}件
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 月間ビュー
  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate.getFullYear(), currentDate.getMonth())
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const today = formatDateYMD(new Date())

    return (
      <div className="space-y-2">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs" style={{ color: currentBg.textLight }}>
          {dayNames.map((day, i) => (
            <div key={i} className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((dayInfo, i) => {
            const { date, isCurrentMonth } = dayInfo
            const dateStr = formatDateYMD(date)
            const isToday = dateStr === today
            const dayEvents = getEventsForDate(date)
            const dayOfWeek = date.getDay()

            return (
              <div
                key={i}
                className={`min-h-16 rounded-lg p-1 ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
                style={{ background: inputBg }}
              >
                <div className={`text-center text-xs font-bold ${
                  dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''
                }`} style={{ color: dayOfWeek !== 0 && dayOfWeek !== 6 ? currentBg.text : undefined }}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((event, j) => (
                    <div
                      key={j}
                      onClick={() => openEventDetail(event)}
                      className={`text-[9px] px-0.5 rounded truncate ${
                        event.is_own
                          ? 'bg-blue-500 text-white cursor-pointer'
                          : event.display === 'busy'
                          ? 'bg-gray-500/50 text-gray-300'
                          : 'bg-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {event.display === 'busy' ? '予定' : event.display?.substring(0, 4)}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-center" style={{ color: currentBg.textLight }}>
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ヘッダータイトル
  const getHeaderTitle = () => {
    if (viewMode === 'week') {
      const { start, end } = getDateRange()
      return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
    } else {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="スケジュール"
        icon="📅"
        gradient="from-blue-700 to-blue-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 表示切替 */}
        <div className="flex gap-2 mb-4">
          <div className="flex bg-opacity-50 p-1 rounded-xl flex-1" style={{ background: inputBg }}>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                viewMode === 'week' ? 'bg-blue-500 text-white' : ''
              }`}
              style={viewMode !== 'week' ? { color: currentBg.textLight } : {}}
            >
              週間
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                viewMode === 'month' ? 'bg-blue-500 text-white' : ''
              }`}
              style={viewMode !== 'month' ? { color: currentBg.textLight } : {}}
            >
              月間
            </button>
          </div>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white"
          >
            今日
          </button>
        </div>

        {/* 期間ナビゲーション */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: inputBg, color: currentBg.text }}
          >
            ←
          </button>
          <div className="text-lg font-bold" style={{ color: currentBg.text }}>
            {getHeaderTitle()}
          </div>
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: inputBg, color: currentBg.text }}
          >
            →
          </button>
        </div>

        {/* 権限表示 */}
        <div className="text-xs text-center mb-4" style={{ color: currentBg.textLight }}>
          {getRoleDescription()}
        </div>

        {/* カレンダー */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <div style={{ color: currentBg.textLight }}>読み込み中...</div>
          </div>
        ) : (
          <div className="rounded-xl p-3" style={{ background: cardBg }}>
            {viewMode === 'week' ? renderWeekView() : renderMonthView()}
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-4 flex justify-center gap-4 text-xs" style={{ color: currentBg.textLight }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>自分の予定</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/50" />
            <span>タイトル表示</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-500/50" />
            <span>予定あり</span>
          </div>
        </div>

        {/* 予定件数 */}
        <div className="mt-4 text-center text-sm" style={{ color: currentBg.textLight }}>
          {schedules.length}件の予定
        </div>
      </div>

      {/* イベント詳細モーダル */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: cardBg }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">📅</div>
                <div className="text-lg font-bold" style={{ color: currentBg.text }}>
                  {selectedEvent.display}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="rounded-xl p-3" style={{ background: inputBg }}>
                  <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>日時</div>
                  <div style={{ color: currentBg.text }}>
                    {formatDate(selectedEvent.start)} {formatTime(selectedEvent.start)}
                    {' - '}
                    {formatTime(selectedEvent.end)}
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="rounded-xl p-3" style={{ background: inputBg }}>
                    <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>詳細</div>
                    <div className="text-sm whitespace-pre-wrap" style={{ color: currentBg.text }}>
                      {selectedEvent.description}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: inputBg, color: currentBg.text }}
              >
                閉じる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
