import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function DrawingsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // カードスタイル
  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [drawings, setDrawings] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchProjects()
    fetchDrawings()
  }, [selectedProject])

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/projects`)
    setProjects(await res.json())
  }

  const fetchDrawings = async () => {
    const url = selectedProject ? `${API_BASE}/drawings/?project_id=${selectedProject}` : `${API_BASE}/drawings/`
    const res = await fetch(url)
    setDrawings(await res.json())
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      project_id: parseInt(form.project_id.value),
      name: form.name.value,
      file_type: form.file_type.value,
      uploaded_by: form.uploaded_by.value
    }
    await fetch(`${API_BASE}/drawings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setShowUpload(false)
    fetchDrawings()
    setToast('図面をアップロードしました')
    setTimeout(() => setToast(''), 2000)
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    await fetch(`${API_BASE}/drawings/${id}`, { method: 'DELETE' })
    fetchDrawings()
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBg.bg }}>
      <PageHeader title="図面管理" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        {/* フィルター */}
        <div className="flex gap-2">
          <select
            className="flex-1 p-3 rounded-lg border-0"
            style={{ background: cardBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">全案件</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-500 rounded-lg text-white"
          >
            アップロード
          </button>
        </div>

        {/* 図面一覧 */}
        <div className="space-y-3">
          {drawings.map(d => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {d.file_type === 'pdf' ? '📄' : d.file_type === 'dwg' ? '📐' : '🖼️'}
                    </span>
                    <div>
                      <div className="font-bold" style={{ color: currentBg.text }}>{d.name}</div>
                      <div className="text-xs" style={{ color: currentBg.textLight }}>
                        v{d.version} {d.is_latest && <span className="text-green-400">最新</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm mt-2" style={{ color: currentBg.textLight }}>
                    {new Date(d.uploaded_at).toLocaleDateString('ja-JP')} by {d.uploaded_by || '-'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                    表示
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {drawings.length === 0 && (
            <div className="text-center py-12" style={{ color: currentBg.textLight }}>
              図面がありません
            </div>
          )}
        </div>
      </div>

      {/* アップロードモーダル */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-xl w-full max-w-md"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>図面アップロード</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>案件</label>
                <select name="project_id" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>図面名</label>
                <input name="name" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>ファイル形式</label>
                <select name="file_type" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  <option value="pdf">PDF</option>
                  <option value="dwg">DWG</option>
                  <option value="jpg">画像</option>
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>アップロード者</label>
                <input name="uploaded_by" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-3 rounded-lg" style={{ background: inputBg, color: currentBg.text }}>
                  キャンセル
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-500 rounded-lg text-white">
                  アップロード
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
