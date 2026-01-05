import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Building, ChevronRight } from 'lucide-react'
import { Header, Card, Toast } from '../components/common'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function SitesPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [toast, setToast] = useState({ show: false, message: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`)
      if (res.ok) {
        setProjects(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  const filteredProjects = projects.filter(p => {
    if (filter === 'active') return p.status === '施工中'
    if (filter === 'completed') return p.status === '完工'
    return true
  })

  const hasLocation = (p) => p.latitude && p.longitude

  const openGoogleMaps = (project) => {
    if (hasLocation(project)) {
      window.open(`https://www.google.com/maps?q=${project.latitude},${project.longitude}`, '_blank')
    } else if (project.address) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(project.address)}`, '_blank')
    } else {
      showToast('位置情報が登録されていません')
    }
  }

  const openNavigation = (project) => {
    if (hasLocation(project)) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${project.latitude},${project.longitude}`, '_blank')
    } else if (project.address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(project.address)}`, '_blank')
    } else {
      showToast('位置情報が登録されていません')
    }
  }

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="現場位置"
        icon="📍"
        gradient="from-blue-700 to-blue-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4 space-y-4">
        {/* フィルター */}
        <div className="flex gap-2">
          {[
            { id: 'active', label: '施工中' },
            { id: 'completed', label: '完工' },
            { id: 'all', label: '全て' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                filter === f.id
                  ? 'bg-blue-500 text-white'
                  : ''
              }`}
              style={filter !== f.id ? { background: inputBg, color: currentBg.textLight } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 集計 */}
        <Card className="flex justify-around py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {filteredProjects.filter(p => hasLocation(p)).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>位置登録済</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">
              {filteredProjects.filter(p => !hasLocation(p)).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>未登録</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: currentBg.text }}>
              {filteredProjects.length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>合計</div>
          </div>
        </Card>

        {/* 現場リスト */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : filteredProjects.length === 0 ? (
          <Card className="text-center py-8">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" style={{ color: currentBg.textLight }} />
            <p style={{ color: currentBg.textLight }}>現場がありません</p>
          </Card>
        ) : (
          filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    hasLocation(project) ? 'bg-blue-500/20' : 'bg-gray-500/20'
                  }`}>
                    <MapPin size={24} className={hasLocation(project) ? 'text-blue-400' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: currentBg.text }}>
                      {project.name}
                    </div>
                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: currentBg.textLight }}>
                      <Building size={12} />
                      {project.client || '元請け未設定'}
                    </div>
                    {project.address && (
                      <div className="text-xs mt-1 truncate" style={{ color: currentBg.textLight }}>
                        📍 {project.address}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    project.status === '施工中' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openGoogleMaps(project)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                    style={{ background: inputBg, color: currentBg.text }}
                  >
                    <MapPin size={16} />
                    地図を見る
                  </button>
                  <button
                    onClick={() => openNavigation(project)}
                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <Navigation size={16} />
                    ナビ開始
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/sbase/${project.id}`)}
                  className="w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1"
                  style={{ background: inputBg, color: currentBg.textLight }}
                >
                  案件詳細
                  <ChevronRight size={16} />
                </button>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
