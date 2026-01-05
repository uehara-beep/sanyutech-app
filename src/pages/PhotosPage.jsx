import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function PhotosPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // カードスタイル
  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [photos, setPhotos] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [viewPhoto, setViewPhoto] = useState(null)
  const [toast, setToast] = useState('')

  const categories = ['着工前', '施工中', '完成', '検査', '是正']

  useEffect(() => {
    fetchProjects()
    fetchPhotos()
  }, [selectedProject, selectedCategory])

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/projects`)
    setProjects(await res.json())
  }

  const fetchPhotos = async () => {
    let url = `${API_BASE}/site-photos/?`
    if (selectedProject) url += `project_id=${selectedProject}&`
    if (selectedCategory) url += `category=${selectedCategory}&`
    const res = await fetch(url)
    setPhotos(await res.json())
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      project_id: parseInt(form.project_id.value),
      category: form.category.value,
      work_type: form.work_type.value,
      taken_by: form.taken_by.value,
      taken_at: new Date().toISOString()
    }
    await fetch(`${API_BASE}/site-photos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setShowUpload(false)
    fetchPhotos()
    setToast('写真を登録しました')
    setTimeout(() => setToast(''), 2000)
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    await fetch(`${API_BASE}/site-photos/${id}`, { method: 'DELETE' })
    fetchPhotos()
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBg.bg }}>
      <PageHeader title="工事写真" onBack={() => navigate(-1)} />

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
          <select
            className="p-3 rounded-lg border-0"
            style={{ background: cardBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">全カテゴリ</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex-1 py-3 bg-blue-500 rounded-lg text-white flex items-center justify-center gap-2"
          >
            📷 写真追加
          </button>
          <button className="px-4 py-3 bg-green-500 rounded-lg text-white">
            📋 台帳出力
          </button>
        </div>

        {/* カテゴリタブ */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(selectedCategory === c ? '' : c)}
              className="px-4 py-2 rounded-full whitespace-nowrap"
              style={selectedCategory === c
                ? { backgroundColor: '#3B82F6', color: '#fff' }
                : { background: cardBg, color: currentBg.textLight, border: `1px solid ${cardBorder}` }
              }
            >
              {c}
            </button>
          ))}
        </div>

        {/* 写真グリッド */}
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-lg overflow-hidden relative"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              onClick={() => setViewPhoto(photo)}
            >
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                🏗️
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white">
                <div className="truncate">{photo.category}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-12" style={{ color: currentBg.textLight }}>
            写真がありません
          </div>
        )}
      </div>

      {/* 写真詳細モーダル */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button onClick={() => setViewPhoto(null)} className="text-white">✕ 閉じる</button>
            <button onClick={() => handleDelete(viewPhoto.id)} className="text-red-400">削除</button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-8xl">🏗️</div>
          </div>
          <div className="p-4" style={{ background: cardBg }}>
            <div className="font-bold" style={{ color: currentBg.text }}>{viewPhoto.category}</div>
            <div className="text-sm" style={{ color: currentBg.textLight }}>{viewPhoto.work_type}</div>
            <div className="text-xs mt-2" style={{ color: currentBg.textLight }}>
              {viewPhoto.taken_at && new Date(viewPhoto.taken_at).toLocaleString('ja-JP')}
              {viewPhoto.taken_by && ` by ${viewPhoto.taken_by}`}
            </div>
          </div>
        </div>
      )}

      {/* アップロードモーダル */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-xl w-full max-w-md"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>写真登録</h3>
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
                <label className="text-sm" style={{ color: currentBg.textLight }}>カテゴリ</label>
                <select name="category" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>工種</label>
                <input name="work_type" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>撮影者</label>
                <input name="taken_by" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-3 rounded-lg" style={{ background: inputBg, color: currentBg.text }}>
                  キャンセル
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-500 rounded-lg text-white">
                  登録
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
