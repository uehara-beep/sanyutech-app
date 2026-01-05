import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function ChecklistPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)

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
          checklists.map((checklist) => {
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
