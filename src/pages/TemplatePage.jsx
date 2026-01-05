import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

const TEMPLATE_TYPES = [
  { id: 'ky', label: 'KY', icon: '⚠️' },
  { id: 'checklist', label: 'チェックリスト', icon: '✅' },
  { id: 'report', label: '報告書', icon: '📄' },
]

export default function TemplatePage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeType, setActiveType] = useState('all')
  const [toast, setToast] = useState({ show: false, message: '' })

  const [form, setForm] = useState({
    name: '',
    type: 'ky',
    content: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates/`)
      if (res.ok) setTemplates(await res.json())
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          content: form.content,
        }),
      })

      if (res.ok) {
        showToast('テンプレートを作成しました')
        setShowForm(false)
        setForm({ name: '', type: 'ky', content: '' })
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const deleteTemplate = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/templates/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const getTypeInfo = (type) => {
    return TEMPLATE_TYPES.find(t => t.id === type) || { icon: '📋', label: type }
  }

  const filteredTemplates = activeType === 'all'
    ? templates
    : templates.filter(t => t.type === activeType)

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="テンプレート"
        icon="📝"
        gradient="from-slate-600 to-slate-400"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="px-5 py-4">
        {/* タイプフィルター */}
        <div className="flex bg-app-bg-light p-1 mb-4 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveType('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeType === 'all' ? 'bg-app-primary text-white' : 'text-slate-400'
            }`}
          >
            全て
          </button>
          {TEMPLATE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeType === type.id ? 'bg-app-primary text-white' : 'text-slate-400'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        <SectionTitle>📋 テンプレート一覧</SectionTitle>

        {loading ? (
          <div className="text-center py-8 text-slate-400">読み込み中...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>テンプレートがありません</div>
          </div>
        ) : (
          filteredTemplates.map((template, i) => {
            const typeInfo = getTypeInfo(template.type)
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{typeInfo.icon}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-semibold">{template.name}</div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-app-primary/20 text-app-primary">
                          {typeInfo.label}
                        </span>
                      </div>
                      {template.content && (
                        <div className="text-xs text-slate-400 line-clamp-2 mb-2">
                          {template.content}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-app-primary/20 text-app-primary rounded-lg text-xs">
                          使用する
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      {/* 新規作成モーダル */}
      {showForm && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowForm(false)}
        >
          <motion.div
            className="w-full bg-app-bg-light rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 60px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（作成ボタン含む） */}
            <div className="flex justify-between items-center p-6 pb-3 flex-shrink-0">
              <div className="text-lg font-bold">📝 テンプレート作成</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-app-primary rounded-lg text-sm font-bold text-white"
                >
                  作成
                </button>
                <button onClick={() => setShowForm(false)} className="text-2xl text-slate-400">×</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">テンプレート名</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="朝礼KYテンプレート"
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">タイプ</label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setForm({ ...form, type: type.id })}
                    className={`py-3 rounded-xl text-center ${
                      form.type === type.id
                        ? 'bg-app-primary text-white'
                        : 'bg-app-card text-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className="text-[10px]">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">内容</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="テンプレートの内容を入力..."
                rows={6}
                className="w-full bg-app-card border border-app-border rounded-xl px-4 py-3 text-white resize-none"
              />
            </div>
            </div>

          </motion.div>
        </motion.div>
      )}

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
