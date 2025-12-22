import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle } from '../components/common'

const API_BASE = '/api'

export default function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schedulesRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/schedules/`),
        fetch(`${API_BASE}/projects`),
      ])

      if (schedulesRes.ok) setSchedules(await schedulesRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []

    // 前月の日
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 今月の日
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    // 次月の日（6週間分になるまで）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date)
    const events = []

    // プロジェクトの期間内かチェック
    projects.forEach(project => {
      if (project.period) {
        const [start, end] = project.period.split('〜')
        if (dateStr >= start && dateStr <= end) {
          events.push({
            type: 'project',
            name: project.name,
            color: '#3b82f6',
          })
        }
      }
    })

    return events
  }

  const isToday = (date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="カレンダー"
        icon="📆"
        gradient="from-pink-700 to-pink-400"
        onBack={() => navigate('/')}
      />

      <div className="px-5 py-4">
        {/* 月選択 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            ←
          </button>
          <div className="text-xl font-bold">
            {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center"
          >
            →
          </button>
        </div>

        {/* カレンダー */}
        <Card className="p-4 mb-4">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const events = getEventsForDate(day.date)
              const dayOfWeek = day.date.getDay()
              const isSelected = selectedDate && formatDate(day.date) === formatDate(selectedDate)

              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day.date)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg ${
                    !day.isCurrentMonth ? 'opacity-30' : ''
                  } ${
                    isToday(day.date) ? 'bg-app-primary text-white' : ''
                  } ${
                    isSelected && !isToday(day.date) ? 'bg-app-primary/20' : ''
                  } ${
                    dayOfWeek === 0 && !isToday(day.date) ? 'text-red-400' : ''
                  } ${
                    dayOfWeek === 6 && !isToday(day.date) ? 'text-blue-400' : ''
                  }`}
                >
                  <span className="text-sm">{day.date.getDate()}</span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map((event, j) => (
                        <div
                          key={j}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </Card>

        {/* 選択日の予定 */}
        {selectedDate && (
          <div>
            <SectionTitle>
              {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}の予定
            </SectionTitle>

            {getSelectedDateEvents().length === 0 ? (
              <Card className="text-center py-6 text-slate-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">予定はありません</div>
              </Card>
            ) : (
              getSelectedDateEvents().map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-2 flex items-center gap-3">
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <div>
                      <div className="text-sm font-semibold">{event.name}</div>
                      <div className="text-xs text-slate-400">{event.type === 'project' ? '工期' : '予定'}</div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
