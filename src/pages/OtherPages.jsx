import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Button, Badge, Toast } from '../components/common'
import { useAppStore, useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

// テーマフック
const useTheme = () => {
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  return currentBg
}

// 承認センター
export function ApprovePage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
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
        setToastMsg(action === 'approve' ? '✅ 承認しました' : '❌ 却下しました')
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

// 通知
export function NotifyPage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/`)
      if (res.ok) {
        setNotifications(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' })
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="通知"
        icon="🔔"
        gradient="from-pink-700 to-pink-400"
        onBack={() => navigate(-1)}
        action={
          notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-app-primary"
            >
              全て既読
            </button>
          )
        }
      />

      <div className="px-5 py-4">
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>
            <div className="text-4xl mb-2">🔔</div>
            <div>通知はありません</div>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="mb-2.5 flex gap-3 cursor-pointer"
                onClick={() => markAsRead(notif.id)}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                  notif.is_read ? 'bg-app-border' : 'bg-app-primary'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1" style={{ color: currentBg.text }}>{notif.title}</div>
                  <div className="text-xs mb-1" style={{ color: currentBg.textLight }}>{notif.message}</div>
                  <div className="text-[11px]" style={{ color: currentBg.textLight }}>
                    {notif.created_at?.split('T')[0]}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// 緊急連絡先
export function EmergencyPage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/emergency-contacts/`)
      if (res.ok) {
        setContacts(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    const icons = { hospital: '🏥', client: '🏢', internal: '👔', worker: '👷' }
    return icons[role] || '📞'
  }

  const groupedContacts = contacts.reduce((acc, contact) => {
    const role = contact.role || 'other'
    if (!acc[role]) acc[role] = []
    acc[role].push(contact)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="緊急連絡先"
        icon="🚨"
        gradient="from-red-800 to-red-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        <SectionTitle>🆘 緊急通報</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="tel:119"
            className="flex flex-col items-center py-6 bg-gradient-to-br from-red-800 to-red-500 rounded-2xl text-white"
          >
            <span className="text-4xl mb-2">🚒</span>
            <span className="text-sm font-medium">消防・救急</span>
            <span className="text-2xl font-bold mt-1">119</span>
          </a>
          <a
            href="tel:110"
            className="flex flex-col items-center py-6 bg-gradient-to-br from-blue-800 to-blue-500 rounded-2xl text-white"
          >
            <span className="text-4xl mb-2">🚔</span>
            <span className="text-sm font-medium">警察</span>
            <span className="text-2xl font-bold mt-1">110</span>
          </a>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : (
          <>
            {groupedContacts.hospital?.length > 0 && (
              <>
                <SectionTitle>🏥 最寄り病院</SectionTitle>
                {groupedContacts.hospital.map((contact, i) => (
                  <ContactCard key={i} icon="🏥" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {groupedContacts.client?.length > 0 && (
              <>
                <SectionTitle>🏢 元請け連絡先</SectionTitle>
                {groupedContacts.client.map((contact, i) => (
                  <ContactCard key={i} icon="🏢" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {groupedContacts.internal?.length > 0 && (
              <>
                <SectionTitle>👔 社内連絡先</SectionTitle>
                {groupedContacts.internal.map((contact, i) => (
                  <ContactCard key={i} icon="👔" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {contacts.length === 0 && (
              <Card className="text-center py-6 text-slate-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">登録された連絡先はありません</div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ContactCard({ icon, name, detail, tel }) {
  return (
    <a 
      href={`tel:${tel}`}
      className="flex items-center gap-3 bg-app-card p-4 rounded-xl mb-2.5"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{name}</div>
        <div className="text-xs text-slate-400">{detail}</div>
      </div>
      <div className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center text-xl">
        📞
      </div>
    </a>
  )
}

// チェックリスト
export function ChecklistPage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChecklist, setActiveChecklist] = useState(null)

  useEffect(() => {
    fetchChecklists()
  }, [])

  const fetchChecklists = async () => {
    try {
      const res = await fetch(`${API_BASE}/checklists/`)
      if (res.ok) {
        setChecklists(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (checklistId, itemIndex) => {
    const checklist = checklists.find(c => c.id === checklistId)
    if (!checklist) return

    const items = JSON.parse(checklist.items || '[]')
    const completedItems = JSON.parse(checklist.completed_items || '[]')
    const item = items[itemIndex]

    let newCompleted
    if (completedItems.includes(item)) {
      newCompleted = completedItems.filter(i => i !== item)
    } else {
      newCompleted = [...completedItems, item]
    }

    try {
      await fetch(`${API_BASE}/checklists/${checklistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_items: JSON.stringify(newCompleted) }),
      })

      setChecklists(prev =>
        prev.map(c => c.id === checklistId
          ? { ...c, completed_items: JSON.stringify(newCompleted) }
          : c
        )
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // デフォルトのチェックリスト（APIにデータがない場合）
  const defaultItems = [
    { id: 'health', label: '体調確認（全員）' },
    { id: 'weather', label: '天候確認' },
    { id: 'ky', label: 'KY記録作成' },
    { id: 'report', label: '元請けへ作業報告' },
    { id: 'zone', label: '規制材の配置確認' },
  ]

  const [localChecks, setLocalChecks] = useState({})

  const toggleLocal = (id) => {
    setLocalChecks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const localCompleted = Object.values(localChecks).filter(Boolean).length
  const today = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="チェックリスト"
        icon="📋"
        gradient="from-lime-700 to-lime-400"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        <SectionTitle>✅ 朝礼前チェック - {today}</SectionTitle>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : checklists.length === 0 ? (
          // デフォルトチェックリスト表示
          <>
            {defaultItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="mb-2 flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleLocal(item.id)}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-sm ${
                    localChecks[item.id]
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-500'
                  }`}>
                    {localChecks[item.id] && '✓'}
                  </div>
                  <span className="text-sm">{item.label}</span>
                </Card>
              </motion.div>
            ))}

            <div className="mt-4">
              <div className="h-2 bg-app-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(localCompleted / defaultItems.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 text-right mt-1">
                {localCompleted}/{defaultItems.length} 完了
              </div>
            </div>
          </>
        ) : (
          checklists.map((checklist, ci) => {
            const items = JSON.parse(checklist.items || '[]')
            const completedItems = JSON.parse(checklist.completed_items || '[]')
            const completed = completedItems.length

            return (
              <Card key={checklist.id} className="mb-4">
                <div className="text-sm font-semibold mb-3">{checklist.name}</div>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                    onClick={() => toggleItem(checklist.id, i)}
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-sm ${
                      completedItems.includes(item)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-500'
                    }`}>
                      {completedItems.includes(item) && '✓'}
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
                <div className="mt-3">
                  <div className="h-2 bg-app-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 text-right mt-1">
                    {completed}/{items.length} 完了
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

// 車両管理
export function CarPage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
  const [vehicles, setVehicles] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    plate_number: '',
    type: '',
    inspection_date: '',
    insurance_date: '',
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const [vehiclesRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/vehicles/`),
        fetch(`${API_BASE}/vehicles/alerts`),
      ])

      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json())
      if (alertsRes.ok) setAlerts(await alertsRes.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShakenUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    // 車検証AI読み取りシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000))

    // OCR結果をシミュレート（実際はAI APIを呼び出す）
    const ocrResult = {
      name: 'トヨタ ハイエース',
      plate_number: '品川 300 あ 1234',
      type: 'バン',
      inspection_date: '2025-06-15',
      insurance_date: '2025-12-01',
    }

    setForm(ocrResult)
    setScanning(false)
    setToastMsg('✅ 車検証を読み取りました')
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.plate_number) {
      setToastMsg('⚠️ 車名とナンバーは必須です')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setToastMsg('✅ 車両を登録しました')
        setToast(true)
        setTimeout(() => setToast(false), 2000)
        setShowModal(false)
        setForm({ name: '', plate_number: '', type: '', inspection_date: '', insurance_date: '' })
        fetchVehicles()
      }
    } catch (error) {
      setToastMsg('❌ 登録に失敗しました')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      available: 'bg-emerald-500/20 text-emerald-400',
      'in-use': 'bg-blue-500/20 text-blue-400',
      in_use: 'bg-blue-500/20 text-blue-400',
      maintenance: 'bg-amber-500/20 text-amber-400',
    }
    return styles[status] || styles.available
  }

  const getStatusLabel = (status) => {
    const labels = { available: '空き', 'in-use': '使用中', in_use: '使用中', maintenance: '点検中' }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="車両管理"
        icon="🚗"
        gradient="from-slate-700 to-slate-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* 追加ボタン */}
        <div className="flex gap-2 mb-4">
          <label className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-center text-sm font-bold cursor-pointer text-white">
            📷 車検証を撮影
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleShakenUpload}
            />
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ background: currentBg.bg, color: currentBg.text }}
          >
            ✏️ 手動で追加
          </button>
        </div>

        {/* アラート */}
        {alerts.length > 0 && (
          <Card className="mb-4 bg-gradient-to-r from-amber-900/50 to-amber-800/50 border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-sm font-bold text-amber-400">車検・保険アラート</div>
                <div className="text-xs text-slate-300">
                  {alerts.length}件の車両の期限が近づいています
                </div>
              </div>
            </div>
          </Card>
        )}

        <SectionTitle>🚗 車両一覧（{vehicles.length}台）</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">🚗</div>
            <div>車両がありません</div>
            <div className="text-xs mt-2">車検証を撮影して登録しましょう</div>
          </div>
        ) : (
          vehicles.map((vehicle, i) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`mb-3 ${vehicle.status === 'maintenance' ? 'border-l-2 border-amber-400' : ''}`}>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-2xl">
                    {vehicle.name?.includes('ダンプ') || vehicle.type?.includes('ダンプ') ? '🚚' : '🚗'}
                  </span>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold">{vehicle.name}</div>
                    <div className="text-xs text-slate-400">{vehicle.plate_number}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(vehicle.status || 'available')}`}>
                    {getStatusLabel(vehicle.status || 'available')}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  {vehicle.inspection_date && (
                    <span>🔧 車検: {vehicle.inspection_date}</span>
                  )}
                  {vehicle.insurance_date && (
                    <span>📋 保険: {vehicle.insurance_date}</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* 追加モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            {/* ヘッダー（登録ボタン含む） */}
            <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
              <h3 className="text-lg font-bold">
                {scanning ? '🔍 車検証を読み取り中...' : '🚗 車両を追加'}
              </h3>
              <div className="flex items-center gap-2">
                {!scanning && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-bold text-white"
                  >
                    登録
                  </button>
                )}
                <button onClick={() => { setShowModal(false); setScanning(false) }} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {scanning ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 animate-pulse">📄</div>
                  <div className="text-slate-300">AI が車検証を解析しています...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">車名 *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="例: トヨタ ハイエース"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">ナンバー *</label>
                    <input
                      type="text"
                      value={form.plate_number}
                      onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      placeholder="例: 品川 300 あ 1234"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">車種</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                    >
                      <option value="">選択してください</option>
                      <option value="乗用車">乗用車</option>
                      <option value="バン">バン</option>
                      <option value="トラック">トラック</option>
                      <option value="ダンプ">ダンプ</option>
                      <option value="重機">重機</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">車検期限</label>
                      <input
                        type="date"
                        value={form.inspection_date}
                        onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">保険期限</label>
                      <input
                        type="date"
                        value={form.insurance_date}
                        onChange={(e) => setForm({ ...form, insurance_date: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}

      <Toast message={toastMsg} isVisible={toast} />
    </div>
  )
}

// 機材管理
export function EquipmentPage() {
  const navigate = useNavigate()
  const currentBg = useTheme()
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: '',
    status: 'available',
    note: '',
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const res = await fetch(`${API_BASE}/equipment/`)
      if (res.ok) setEquipment(await res.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setShowModal(true)

    // 銘板AI読み取りシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000))

    const ocrResult = {
      name: 'コマツ PC200',
      category: '油圧ショベル',
      status: 'available',
      note: '製造番号: 12345',
    }

    setForm(ocrResult)
    setScanning(false)
    setToastMsg('✅ 銘板を読み取りました')
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  const handleSubmit = async () => {
    if (!form.name) {
      setToastMsg('⚠️ 機材名は必須です')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/equipment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setToastMsg('✅ 機材を登録しました')
        setToast(true)
        setTimeout(() => setToast(false), 2000)
        setShowModal(false)
        setForm({ name: '', category: '', status: 'available', note: '' })
        fetchEquipment()
      }
    } catch (error) {
      setToastMsg('❌ 登録に失敗しました')
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    }
  }

  const getStatusStyle = (status) => {
    const styles = {
      available: 'bg-emerald-500/20 text-emerald-400',
      'in-use': 'bg-blue-500/20 text-blue-400',
      in_use: 'bg-blue-500/20 text-blue-400',
      maintenance: 'bg-amber-500/20 text-amber-400',
    }
    return styles[status] || styles.available
  }

  const getStatusLabel = (status) => {
    const labels = { available: '空き', 'in-use': '使用中', in_use: '使用中', maintenance: '整備中' }
    return labels[status] || status
  }

  const maintenanceItems = equipment.filter(e => e.status === 'maintenance')

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="機材管理"
        icon="🔧"
        gradient="from-orange-700 to-orange-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="flex bg-app-bg-light p-1 mx-5 mb-4 rounded-xl">
        {['list', 'maintenance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium ${
              activeTab === tab ? 'bg-app-primary text-white' : 'text-slate-400'
            }`}
          >
            {tab === 'list' ? '機材一覧' : '点検中'}
          </button>
        ))}
      </div>

      <div className="px-5">
        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : activeTab === 'list' ? (
          <>
            <SectionTitle>🔧 機材一覧（{equipment.length}台）</SectionTitle>
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🔧</div>
                <div>機材がありません</div>
              </div>
            ) : (
              equipment.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`mb-3 ${item.status === 'maintenance' ? 'border-l-2 border-amber-400' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🚜</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category || '未分類'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusStyle(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-400">{item.note}</div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </>
        ) : (
          <>
            <SectionTitle>🔧 点検中機材（{maintenanceItems.length}台）</SectionTitle>
            {maintenanceItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">✅</div>
                <div>点検中の機材はありません</div>
              </div>
            ) : (
              maintenanceItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="mb-3 border-l-2 border-amber-400">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🚜</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-semibold">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category || '未分類'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                        整備中
                      </span>
                    </div>
                    {item.note && (
                      <div className="text-xs text-slate-400">{item.note}</div>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {/* 追加モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full bg-slate-800 rounded-t-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
          >
            {/* ヘッダー（登録ボタン含む） */}
            <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
              <h3 className="text-lg font-bold">
                {scanning ? '🔍 銘板を読み取り中...' : '🔧 機材を追加'}
              </h3>
              <div className="flex items-center gap-2">
                {!scanning && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-sm font-bold text-white"
                  >
                    登録
                  </button>
                )}
                <button onClick={() => { setShowModal(false); setScanning(false) }} className="text-2xl text-slate-400">×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {scanning ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4 animate-pulse">📷</div>
                  <div className="text-slate-300">AI が銘板を解析しています...</div>
                </div>
              ) : (
                <>
                  <label className="block w-full py-3 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl text-center text-sm font-bold cursor-pointer">
                    📷 銘板を撮影して自動入力
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">機材名 *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                        placeholder="例: コマツ PC200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">カテゴリ</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      >
                        <option value="">選択してください</option>
                        <option value="油圧ショベル">油圧ショベル</option>
                        <option value="ブルドーザー">ブルドーザー</option>
                        <option value="ローラー">ローラー</option>
                        <option value="クレーン">クレーン</option>
                        <option value="発電機">発電機</option>
                        <option value="その他">その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">状態</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm"
                      >
                        <option value="available">空き</option>
                        <option value="in_use">使用中</option>
                        <option value="maintenance">整備中</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">備考</label>
                      <textarea
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 text-sm resize-none"
                        rows={2}
                        placeholder="メモを入力"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

          </motion.div>
        </div>
      )}

      <Toast message={toastMsg} isVisible={toast} />
    </div>
  )
}
