import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, LogIn, LogOut, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { ListSkeleton, SummaryCardSkeleton } from '../components/ui/Skeleton'
import { api } from '../utils/api'
import { useThemeStore, backgroundStyles, useAuthStore } from '../store'

export default function AttendancePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const { user } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [todayAttendance, setTodayAttendance] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/attendances/today'),
        api.get(`/attendances/monthly/${user?.id || 0}/${currentMonth.year}/${currentMonth.month}`),
      ])
      if (todayRes.success !== false) setTodayAttendance(todayRes.data || todayRes)
      if (monthlyRes.success !== false) setMonthlyData(monthlyRes.data || monthlyRes || [])
    } catch (error) {
      showToast('データの取得に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const handleCheckIn = async () => {
    setSubmitting(true)
    try {
      const result = await api.post('/attendances/check-in')
      if (result.success || result.id) {
        showToast('出勤を記録しました', 'success')
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '出勤記録に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    setSubmitting(true)
    try {
      const result = await api.post('/attendances/check-out')
      if (result.success || result.id || result.message) {
        showToast('退勤を記録しました', 'success')
        fetchData()
      } else {
        showToast(`エラー: ${result.error || '退勤記録に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: 通信に失敗しました', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const changeMonth = (delta) => {
    setCurrentMonth(prev => {
      let newMonth = prev.month + delta
      let newYear = prev.year
      if (newMonth > 12) {
        newMonth = 1
        newYear++
      } else if (newMonth < 1) {
        newMonth = 12
        newYear--
      }
      return { year: newYear, month: newMonth }
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--'
    return timeStr.slice(0, 5)
  }

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '--:--'
    const [inH, inM] = checkIn.split(':').map(Number)
    const [outH, outM] = checkOut.split(':').map(Number)
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM)
    if (totalMinutes < 0) return '--:--'
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }

  const monthlyStats = {
    totalDays: monthlyData.length,
    totalHours: monthlyData.reduce((sum, d) => {
      if (d.check_in && d.check_out) {
        const [inH, inM] = d.check_in.split(':').map(Number)
        const [outH, outM] = d.check_out.split(':').map(Number)
        return sum + ((outH * 60 + outM) - (inH * 60 + inM)) / 60
      }
      return sum
    }, 0),
    avgHours: 0,
  }
  monthlyStats.avgHours = monthlyStats.totalDays > 0
    ? (monthlyStats.totalHours / monthlyStats.totalDays).toFixed(1)
    : 0

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="勤怠管理"
        icon="⏰"
        gradient="from-cyan-700 to-cyan-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 今日の打刻 */}
        <SectionTitle>🕐 本日の勤怠</SectionTitle>

        {loading ? (
          <SummaryCardSkeleton />
        ) : (
          <Card className="mb-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-cyan-400">{currentTime}</div>
              <div className="text-xs text-slate-400 mt-1">
                {now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">出勤</div>
                <div className="text-lg font-semibold text-emerald-400">
                  {formatTime(todayAttendance?.check_in)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">退勤</div>
                <div className="text-lg font-semibold text-amber-400">
                  {formatTime(todayAttendance?.check_out)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCheckIn}
                disabled={submitting || todayAttendance?.check_in}
                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  todayAttendance?.check_in
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {submitting ? '...' : <><LogIn size={18} /> 出勤</>}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={submitting || !todayAttendance?.check_in || todayAttendance?.check_out}
                className={`py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  !todayAttendance?.check_in || todayAttendance?.check_out
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {submitting ? '...' : <><LogOut size={18} /> 退勤</>}
              </button>
            </div>
          </Card>
        )}

        {/* 月次サマリー */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">出勤日数</div>
              <div className="text-lg font-bold text-cyan-400">{monthlyStats.totalDays}日</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">総労働時間</div>
              <div className="text-lg font-bold text-emerald-400">{monthlyStats.totalHours.toFixed(1)}h</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">平均/日</div>
              <div className="text-lg font-bold text-amber-400">{monthlyStats.avgHours}h</div>
            </Card>
          </div>
        )}

        {/* 月選択 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-bold">
            {currentMonth.year}年{currentMonth.month}月
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <SectionTitle>📋 勤怠記録</SectionTitle>

        {loading ? (
          <ListSkeleton count={10} showHeader={false} />
        ) : monthlyData.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <div>記録がありません</div>
          </div>
        ) : (
          monthlyData.map((record, i) => (
            <motion.div
              key={record.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="mb-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold">{record.date}</div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-400">
                      <Clock size={14} className="inline mr-1" />
                      {formatTime(record.check_in)}
                    </span>
                    <span className="text-amber-400">
                      <Clock size={14} className="inline mr-1" />
                      {formatTime(record.check_out)}
                    </span>
                    <span className="text-slate-400">
                      {calculateWorkHours(record.check_in, record.check_out)}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}
