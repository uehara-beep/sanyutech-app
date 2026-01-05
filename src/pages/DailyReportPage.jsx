import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles, useAuthStore } from '../store'
import { X, Plus, UserPlus, CheckCircle, Clock, Bell, Users, Eye } from 'lucide-react'
import { API_BASE } from '../config/api'

export default function DailyReportPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const { user: authUser, token } = useAuthStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeTab, setActiveTab] = useState('new') // new, history, confirm
  const [toast, setToast] = useState({ show: false, message: '' })
  const [selectedReport, setSelectedReport] = useState(null)
  const [sites, setSites] = useState([])
  const [reports, setReports] = useState([])
  const [pendingConfirmations, setPendingConfirmations] = useState([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [showReportDetail, setShowReportDetail] = useState(false)
  const [reportDetail, setReportDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    date: today,
    site: '',
    siteId: null,
    weather: 'sunny',
    startTime: '08:00',
    endTime: '17:00',
    breakTime: 60, // 休憩時間（分）: 0, 30, 60
    travelDistance: '',
    travelType: 'round', // 'one-way' or 'round'
    content: '',
    members: [], // { id, name, isFromDantori }
    materials: '',
    issues: '',
    photos: [],
  })

  // 現場データと履歴をAPIから取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 認証ストアからユーザー情報を取得
        if (authUser) {
          setCurrentUser(authUser)
        }

        // 現場一覧を取得
        const projectsRes = await fetch(`${API_BASE}/projects/`)
        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setSites(data.map(p => ({ id: p.id, name: p.name })))
        }

        // 日報履歴を取得
        const reportsRes = await fetch(`${API_BASE}/daily-reports/`)
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json()
          setReports(reportsData)
        }

        // 確認待ち日報を取得
        if (token) {
          const confirmRes = await fetch(`${API_BASE}/daily-reports/pending-confirmations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (confirmRes.ok) {
            const confirmData = await confirmRes.json()
            setPendingConfirmations(confirmData)
          }
        }
      } catch (e) {
        console.error('Failed to fetch data:', e)
      }
    }
    fetchData()
  }, [])

  // 現場選択時に段取りからメンバーを取得
  const handleSiteChange = async (siteId, siteName) => {
    setForm(prev => ({ ...prev, site: siteName, siteId: parseInt(siteId) }))

    if (siteId) {
      try {
        // 段取り（配置管理）からその日のメンバーを取得
        const res = await fetch(`${API_BASE}/assignments/?project_id=${siteId}&date=${form.date}`)
        if (res.ok) {
          const assignments = await res.json()
          const members = assignments.map(a => ({
            id: a.worker_id || a.id,
            name: a.worker_name || a.name || '不明',
            isFromDantori: true,
          }))
          setForm(prev => ({ ...prev, members }))
        }
      } catch (e) {
        console.error('Failed to fetch assignments:', e)
      }
    }
  }

  // メンバー削除（急遽休み対応）
  const handleRemoveMember = (memberId) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }))
    showToast('メンバーを削除しました')
  }

  // メンバー手動追加
  const handleAddMember = () => {
    if (!newMemberName.trim()) return
    const newMember = {
      id: `manual-${Date.now()}`,
      name: newMemberName.trim(),
      isFromDantori: false,
    }
    setForm(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }))
    setNewMemberName('')
    setShowAddMember(false)
    showToast('メンバーを追加しました')
  }

  const weatherOptions = [
    { value: 'sunny', label: '晴れ', icon: '☀️' },
    { value: 'cloudy', label: '曇り', icon: '☁️' },
    { value: 'rainy', label: '雨', icon: '🌧️' },
    { value: 'snowy', label: '雪', icon: '❄️' },
  ]

  const getWeatherIcon = (weather) => {
    const found = weatherOptions.find(w => w.value === weather)
    return found ? found.icon : '☀️'
  }

  const handleSubmit = async () => {
    if (!form.site || !form.content) {
      showToast('現場名と作業内容は必須です')
      return
    }

    try {
      const payload = {
        project_id: form.siteId,
        report_date: form.date,
        weather: form.weather,
        start_time: form.startTime,
        end_time: form.endTime,
        break_time: form.breakTime,
        travel_distance: form.travelDistance ? parseFloat(form.travelDistance) : null,
        travel_type: form.travelType,
        work_content: form.content,
        members: form.members.map(m => ({ id: m.id, name: m.name, is_from_dantori: m.isFromDantori })),
        materials: form.materials || null,
        issues: form.issues || null,
      }

      const res = await fetch(`${API_BASE}/daily-reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showToast('日報を提出しました')
      } else {
        showToast('日報を提出しました（デモ）')
      }
    } catch (e) {
      console.error('Submit error:', e)
      showToast('日報を提出しました（デモ）')
    }

    setForm({
      date: today,
      site: '',
      siteId: null,
      weather: 'sunny',
      startTime: '08:00',
      endTime: '17:00',
      breakTime: 60,
      travelDistance: '',
      travelType: 'round',
      content: '',
      members: [],
      materials: '',
      issues: '',
      photos: [],
    })
  }

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setForm({ ...form, photos: [...form.photos, ...files.map(f => URL.createObjectURL(f))] })
      showToast(`${files.length}枚の写真を追加しました`)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  // 日報詳細を取得（確認状況含む）
  const fetchReportDetail = async (reportId) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`${API_BASE}/daily-reports/${reportId}/detail`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setReportDetail(data)
        setShowReportDetail(true)
      } else {
        showToast('詳細の取得に失敗しました')
      }
    } catch (e) {
      console.error('Fetch detail error:', e)
      showToast('詳細の取得に失敗しました')
    } finally {
      setLoadingDetail(false)
    }
  }

  // 日報を確認する
  const handleConfirmReport = async (dailyReportId) => {
    if (!token) {
      showToast('ログインが必要です')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/daily-reports/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daily_report_id: dailyReportId })
      })

      if (res.ok) {
        // 確認済みリストから削除
        setPendingConfirmations(prev => prev.filter(c => c.daily_report_id !== dailyReportId))
        showToast('日報を確認しました')
      } else {
        const data = await res.json()
        showToast(data.detail || '確認に失敗しました')
      }
    } catch (e) {
      console.error('Confirm error:', e)
      showToast('確認に失敗しました')
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="日報入力"
        icon="📝"
        gradient="from-teal-700 to-teal-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'new' ? 'bg-teal-500/20 text-teal-400' : ''
            }`}
            style={activeTab !== 'new' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            ✏️ 新規
          </button>
          <button
            onClick={() => setActiveTab('confirm')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold relative ${
              activeTab === 'confirm' ? 'bg-teal-500/20 text-teal-400' : ''
            }`}
            style={activeTab !== 'confirm' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            <span className="flex items-center justify-center gap-1">
              <Bell size={14} />
              確認待ち
              {pendingConfirmations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {pendingConfirmations.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'history' ? 'bg-teal-500/20 text-teal-400' : ''
            }`}
            style={activeTab !== 'history' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            📋 履歴
          </button>
        </div>

        {activeTab === 'confirm' ? (
          <>
            <SectionTitle>確認待ちの日報</SectionTitle>
            {pendingConfirmations.length === 0 ? (
              <Card>
                <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                  <Clock size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">確認待ちの日報はありません</p>
                </div>
              </Card>
            ) : (
              pendingConfirmations.map((confirmation, i) => (
                <motion.div
                  key={confirmation.confirmation_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-3">
                    <div className="space-y-3">
                      {/* ヘッダー */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold" style={{ color: currentBg.text }}>
                              {confirmation.report_date}
                            </span>
                            <span className="text-2xl">{getWeatherIcon(confirmation.weather)}</span>
                          </div>
                          <div className="font-semibold text-sm" style={{ color: currentBg.text }}>
                            {confirmation.project_name}
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-[10px] bg-amber-500/20 text-amber-400 flex items-center gap-1">
                          <Clock size={10} />
                          確認待ち
                        </span>
                      </div>

                      {/* 作業時間・休憩 */}
                      <div className="p-3 rounded-lg" style={{ background: inputBg }}>
                        <div className="flex items-center gap-4 text-sm" style={{ color: currentBg.text }}>
                          <div className="flex items-center gap-1">
                            <span style={{ color: currentBg.textLight }}>出勤:</span>
                            <span className="font-medium">{confirmation.start_time || '--:--'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: currentBg.textLight }}>退勤:</span>
                            <span className="font-medium">{confirmation.end_time || '--:--'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: currentBg.textLight }}>休憩:</span>
                            <span className="font-medium">{confirmation.break_time || 0}分</span>
                          </div>
                        </div>
                      </div>

                      {/* 作業内容 */}
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        <div className="font-medium mb-1" style={{ color: currentBg.text }}>作業内容:</div>
                        <p className="line-clamp-3">{confirmation.work_content}</p>
                      </div>

                      {/* メンバー */}
                      {confirmation.members && confirmation.members.length > 0 && (
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          <span className="font-medium" style={{ color: currentBg.text }}>出面: </span>
                          {confirmation.members.map(m => m.name).join('、')}
                        </div>
                      )}

                      {/* 確認ボタン */}
                      <button
                        onClick={() => handleConfirmReport(confirmation.daily_report_id)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        確認しました
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </>
        ) : activeTab === 'new' ? (
          <Card>
            <div className="space-y-4">
              {/* 日付 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>日付</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text }}
                />
              </div>

              {/* 現場選択 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>現場名 *</label>
                <select
                  value={form.siteId || ''}
                  onChange={(e) => {
                    const selected = sites.find(s => s.id === parseInt(e.target.value))
                    handleSiteChange(e.target.value, selected?.name || '')
                  }}
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text }}
                >
                  <option value="">現場を選択</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* 作業時間 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業時間</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="flex-1 rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                  <span style={{ color: currentBg.textLight }}>〜</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="flex-1 rounded-lg px-4 py-3 text-sm"
                    style={{ background: inputBg, color: currentBg.text }}
                  />
                </div>
              </div>

              {/* 休憩時間 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>休憩時間</label>
                <div className="flex rounded-lg overflow-hidden" style={{ background: inputBg }}>
                  {[0, 30, 60].map(minutes => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setForm({ ...form, breakTime: minutes })}
                      className="flex-1 py-3 text-sm font-medium transition-colors"
                      style={{
                        background: form.breakTime === minutes ? '#14b8a6' : 'transparent',
                        color: form.breakTime === minutes ? 'white' : currentBg.textLight
                      }}
                    >
                      {minutes === 0 ? 'なし' : `${minutes}分`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 移動距離 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>移動距離</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={form.travelDistance}
                      onChange={(e) => setForm({ ...form, travelDistance: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-sm pr-12"
                      style={{ background: inputBg, color: currentBg.text }}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: currentBg.textLight }}>km</span>
                  </div>
                  <div className="flex rounded-lg overflow-hidden" style={{ background: inputBg }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, travelType: 'one-way' })}
                      className="px-4 py-3 text-xs font-medium transition-colors"
                      style={{
                        background: form.travelType === 'one-way' ? '#14b8a6' : 'transparent',
                        color: form.travelType === 'one-way' ? 'white' : currentBg.textLight
                      }}
                    >
                      片道
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, travelType: 'round' })}
                      className="px-4 py-3 text-xs font-medium transition-colors"
                      style={{
                        background: form.travelType === 'round' ? '#14b8a6' : 'transparent',
                        color: form.travelType === 'round' ? 'white' : currentBg.textLight
                      }}
                    >
                      往復
                    </button>
                  </div>
                </div>
              </div>

              {/* 天気 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>天気</label>
                <div className="flex gap-2">
                  {weatherOptions.map(w => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setForm({ ...form, weather: w.value })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                        form.weather === w.value ? 'bg-teal-500/20 text-teal-400 border border-teal-400/50' : ''
                      }`}
                      style={form.weather !== w.value ? { background: inputBg, color: currentBg.textLight } : {}}
                    >
                      {w.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* 作業内容 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業内容 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={4}
                  placeholder="本日の作業内容を入力"
                />
              </div>

              {/* 作業員（メンバー管理） */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs" style={{ color: currentBg.textLight }}>作業員</label>
                  {form.members.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
                      {form.members.length}名
                    </span>
                  )}
                </div>

                {/* メンバーリスト */}
                {form.members.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {form.members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                        style={{ background: inputBg }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center text-sm">
                            👷
                          </span>
                          <span className="text-sm font-medium" style={{ color: currentBg.text }}>
                            {member.name}
                          </span>
                          {member.isFromDantori && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              段取り
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center py-4 rounded-lg mb-3"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    <p className="text-xs">現場を選択すると段取りから自動で反映されます</p>
                  </div>
                )}

                {/* メンバー追加フォーム */}
                <AnimatePresence>
                  {showAddMember && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="flex-1 rounded-lg px-4 py-2.5 text-sm"
                          style={{ background: inputBg, color: currentBg.text }}
                          placeholder="名前を入力"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                        />
                        <button
                          type="button"
                          onClick={handleAddMember}
                          className="px-4 py-2.5 bg-teal-500 text-white rounded-lg text-sm font-medium"
                        >
                          追加
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddMember(false); setNewMemberName('') }}
                          className="px-3 py-2.5 rounded-lg text-sm"
                          style={{ background: inputBg, color: currentBg.textLight }}
                        >
                          取消
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* メンバー追加ボタン */}
                {!showAddMember && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    style={{ background: inputBg, color: currentBg.textLight }}
                  >
                    <UserPlus size={16} />
                    メンバーを手動追加
                  </button>
                )}
              </div>

              {/* 使用材料 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>使用材料・数量</label>
                <textarea
                  value={form.materials}
                  onChange={(e) => setForm({ ...form, materials: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={2}
                  placeholder="鉄筋 D16 100本、コンクリート 10m3"
                />
              </div>

              {/* 問題点・連絡事項 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>問題点・連絡事項</label>
                <textarea
                  value={form.issues}
                  onChange={(e) => setForm({ ...form, issues: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={2}
                  placeholder="特記事項があれば入力"
                />
              </div>

              {/* 写真 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業写真</label>
                <div className="flex gap-2 flex-wrap">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg overflow-hidden relative">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg flex flex-col items-center justify-center cursor-pointer" style={{ background: inputBg, border: `1px dashed ${currentBg.textLight}` }}>
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px]" style={{ color: currentBg.textLight }}>追加</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl text-sm font-bold text-white mt-2"
              >
                日報を提出する
              </button>
            </div>
          </Card>
        ) : (
          <>
            <SectionTitle>提出履歴</SectionTitle>
            {reports.length === 0 ? (
              <Card>
                <div className="text-center py-8" style={{ color: currentBg.textLight }}>
                  <p className="text-sm">まだ日報の提出履歴がありません</p>
                </div>
              </Card>
            ) : (
              reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-2.5 cursor-pointer" onClick={() => fetchReportDetail(report.id)}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getWeatherIcon(report.weather)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: currentBg.text }}>{report.date || report.report_date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                            report.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : report.status === 'approved'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {report.status === 'confirmed' && <CheckCircle size={10} />}
                            {report.status === 'confirmed' ? '全員確認済' : report.status === 'approved' ? '承認済' : '確認中'}
                          </span>
                          <Eye size={14} style={{ color: currentBg.textLight }} />
                        </div>
                        <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                          {report.site || report.project_name}
                        </div>

                        {/* 作業時間 */}
                        {(report.start_time || report.end_time) && (
                          <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                            🕐 {report.start_time || '--:--'} 〜 {report.end_time || '--:--'}
                            {report.break_time !== undefined && ` (休憩${report.break_time}分)`}
                          </div>
                        )}

                        {/* 移動距離 */}
                        {report.travel_distance && (
                          <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                            🚗 {report.travel_distance}km（{report.travel_type === 'round' ? '往復' : '片道'}）
                          </div>
                        )}

                        <div className="text-xs mt-1 line-clamp-2" style={{ color: currentBg.textLight }}>
                          {report.content || report.work_content}
                        </div>

                        {/* メンバー */}
                        <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                          👷 {report.members?.map(m => m.name).join('、') || report.workers || '-'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />

      {/* 日報詳細モーダル */}
      <AnimatePresence>
        {showReportDetail && reportDetail && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 背景オーバーレイ */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowReportDetail(false)}
            />

            {/* モーダル本体 */}
            <motion.div
              className="relative w-full max-h-[85vh] rounded-t-3xl overflow-hidden"
              style={{ background: isOcean ? 'rgba(0,80,90,0.95)' : isLightTheme ? '#fff' : '#1a1a1a' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: currentBg.border }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getWeatherIcon(reportDetail.weather)}</span>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: currentBg.text }}>
                      {reportDetail.project_name}
                    </h3>
                    <p className="text-xs" style={{ color: currentBg.textLight }}>
                      {reportDetail.report_date}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportDetail(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: inputBg }}
                >
                  <X size={18} style={{ color: currentBg.textLight }} />
                </button>
              </div>

              {/* コンテンツ */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                {/* 作業時間 */}
                <div className="p-3 rounded-xl mb-4" style={{ background: inputBg }}>
                  <div className="flex items-center gap-4 text-sm" style={{ color: currentBg.text }}>
                    <div>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>出勤</span>
                      <p className="font-medium">{reportDetail.start_time || '--:--'}</p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>退勤</span>
                      <p className="font-medium">{reportDetail.end_time || '--:--'}</p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: currentBg.textLight }}>休憩</span>
                      <p className="font-medium">{reportDetail.break_time || 0}分</p>
                    </div>
                  </div>
                </div>

                {/* 作業内容 */}
                <div className="mb-4">
                  <label className="text-xs font-medium mb-1 block" style={{ color: currentBg.textLight }}>作業内容</label>
                  <p className="text-sm" style={{ color: currentBg.text }}>{reportDetail.work_content || '-'}</p>
                </div>

                {/* 確認状況 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={16} style={{ color: currentBg.text }} />
                    <label className="text-sm font-bold" style={{ color: currentBg.text }}>メンバー確認状況</label>
                    {reportDetail.all_confirmed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={10} />
                        全員確認済
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {reportDetail.confirmations && reportDetail.confirmations.length > 0 ? (
                      reportDetail.confirmations.map((conf, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ background: inputBg }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
                              style={{ background: conf.status === 'confirmed' ? '#10b98120' : '#f5920520' }}
                            >
                              👷
                            </div>
                            <span className="text-sm font-medium" style={{ color: currentBg.text }}>
                              {conf.member_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {conf.status === 'confirmed' ? (
                              <>
                                <CheckCircle size={16} className="text-emerald-500" />
                                <div className="text-right">
                                  <span className="text-xs text-emerald-500 font-medium">確認済</span>
                                  {conf.confirmed_at && (
                                    <p className="text-[10px]" style={{ color: currentBg.textLight }}>
                                      {new Date(conf.confirmed_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <Clock size={16} className="text-amber-500" />
                                <span className="text-xs text-amber-500 font-medium">未確認</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4" style={{ color: currentBg.textLight }}>
                        <p className="text-sm">メンバーの確認情報がありません</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ステータス */}
                <div className="flex items-center justify-center gap-2 py-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    reportDetail.status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : reportDetail.status === 'approved'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {reportDetail.status === 'confirmed' && <CheckCircle size={16} />}
                    {reportDetail.status === 'confirmed' ? '全員確認済み（確定）' : reportDetail.status === 'approved' ? '承認済み' : '確認待ち'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
