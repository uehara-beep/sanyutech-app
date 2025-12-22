import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'

const API_BASE = '/api'

export default function PhotosPage() {
  const navigate = useNavigate()
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
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="工事写真管理" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        {/* フィルター */}
        <div className="flex gap-2">
          <select
            className="flex-1 p-3 bg-card rounded-lg text-white border-0"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">全案件</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            className="p-3 bg-card rounded-lg text-white border-0"
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
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === c ? 'bg-blue-500 text-white' : 'bg-card text-gray-400'
              }`}
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
              className="aspect-square bg-card rounded-lg overflow-hidden relative"
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
          <div className="text-center py-12 text-gray-500">
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
          <div className="p-4 bg-card">
            <div className="text-white font-bold">{viewPhoto.category}</div>
            <div className="text-gray-400 text-sm">{viewPhoto.work_type}</div>
            <div className="text-gray-500 text-xs mt-2">
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
            className="bg-card p-6 rounded-xl w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">写真登録</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">案件</label>
                <select name="project_id" required className="w-full p-3 bg-gray-800 rounded-lg text-white">
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">カテゴリ</label>
                <select name="category" required className="w-full p-3 bg-gray-800 rounded-lg text-white">
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">工種</label>
                <input name="work_type" className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">撮影者</label>
                <input name="taken_by" className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-3 bg-gray-700 rounded-lg">
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
