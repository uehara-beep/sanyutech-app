import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle } from '../components/common'
import { API_BASE } from '../config/api'

const SEARCH_TYPES = [
  { id: 'all', label: '全て', icon: '🔍' },
  { id: 'projects', label: '案件', icon: '📁' },
  { id: 'workers', label: '作業員', icon: '👷' },
  { id: 'vendors', label: '業者', icon: '🏢' },
]

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&type=${searchType}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search error:', error)
      // フォールバック：ローカル検索
      setResults({
        projects: [],
        workers: [],
        vendors: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getTotalCount = () => {
    if (!results) return 0
    return (results.projects?.length || 0) +
           (results.workers?.length || 0) +
           (results.vendors?.length || 0)
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        title="検索"
        icon="🔍"
        gradient="from-blue-700 to-blue-400"
        onBack={() => navigate('/')}
      />

      <div className="px-5 py-4">
        {/* 検索ボックス */}
        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="キーワードを入力..."
            className="w-full bg-app-card border border-app-border rounded-xl pl-12 pr-4 py-3 text-white"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>

        {/* 検索タイプ */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {SEARCH_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSearchType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                searchType === type.id
                  ? 'bg-app-primary text-white'
                  : 'bg-app-card text-slate-400'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* 検索ボタン */}
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full py-3 bg-app-primary rounded-xl font-bold text-white mb-6 disabled:opacity-50"
        >
          {loading ? '検索中...' : '検索する'}
        </button>

        {/* 検索結果 */}
        {results && (
          <div>
            <SectionTitle>
              📋 検索結果（{getTotalCount()}件）
            </SectionTitle>

            {getTotalCount() === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-4xl mb-2">🔍</div>
                <div>該当する結果がありません</div>
              </div>
            ) : (
              <>
                {/* 案件 */}
                {results.projects?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">📁 案件</div>
                    {results.projects.map((project, i) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card
                          className="mb-2 cursor-pointer"
                          onClick={() => navigate(`/sbase/${project.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📁</span>
                            <div>
                              <div className="text-sm font-semibold">{project.name}</div>
                              <div className="text-xs text-slate-400">{project.client}</div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 作業員 */}
                {results.workers?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">👷 作業員</div>
                    {results.workers.map((worker, i) => (
                      <motion.div
                        key={worker.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">👷</span>
                            <div>
                              <div className="text-sm font-semibold">{worker.name}</div>
                              <div className="text-xs text-slate-400">{worker.team}</div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 業者 */}
                {results.vendors?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2">🏢 業者</div>
                    {results.vendors.map((vendor, i) => (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🏢</span>
                            <div>
                              <div className="text-sm font-semibold">{vendor.name}</div>
                              <div className="text-xs text-slate-400">{vendor.category}</div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 検索前の状態 */}
        {!results && !loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-sm">キーワードを入力して検索</div>
          </div>
        )}
      </div>
    </div>
  )
}
