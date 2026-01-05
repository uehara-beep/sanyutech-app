import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function ClientRankingPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [year, setYear] = useState(new Date().getFullYear())
  const [clientData, setClientData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [year])

  const loadRanking = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/analytics/client-breakdown?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setClientData(data)
      }
    } catch (e) {
      console.error('Load error:', e)
      // デモデータ
      setClientData([
        { client: '鹿島道路株式会社', sales: 45000000, projects: 8, profit_rate: 22 },
        { client: '大成建設株式会社', sales: 38000000, projects: 6, profit_rate: 18 },
        { client: '清水建設株式会社', sales: 32000000, projects: 5, profit_rate: 25 },
        { client: '福岡県', sales: 28000000, projects: 4, profit_rate: 20 },
        { client: '大林組', sales: 22000000, projects: 3, profit_rate: 15 },
      ])
    }
    setLoading(false)
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億`
    if (amount >= 10000) return `${Math.round(amount / 10000)}万`
    return amount?.toLocaleString() || '0'
  }

  const totalSales = clientData.reduce((sum, c) => sum + (c.sales || 0), 0)

  const cardStyle = {
    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.9)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-black'
    if (rank === 2) return 'bg-gray-400 text-black'
    if (rank === 3) return 'bg-orange-600 text-white'
    return 'bg-gray-600 text-gray-300'
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <Trophy className="w-6 h-6 text-white" />
          <h1 className="text-xl font-bold text-white">顧客別ランキング</h1>
        </div>
        <div className="flex justify-center mt-3">
          <div className="flex bg-white/20 rounded-lg p-1">
            {[2024, 2025, 2026].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded text-white text-sm font-medium ${year === y ? 'bg-white !text-orange-600' : ''}`}
              >
                {y}年
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* 年間合計 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={cardStyle}
          >
            <div className="text-center">
              <p className="text-sm" style={{ color: currentBg.textLight }}>{year}年 総受注金額</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">
                {formatAmount(totalSales)}円
              </p>
              <p className="text-sm mt-1" style={{ color: currentBg.textLight }}>
                {clientData.length}社から受注
              </p>
            </div>
          </motion.div>

          {/* ランキング */}
          <div className="space-y-3">
            {clientData.map((client, index) => {
              const percent = totalSales > 0 ? (client.sales / totalSales) * 100 : 0
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl p-4"
                  style={cardStyle}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${getRankStyle(index + 1)}`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: currentBg.text }}>
                        {client.client}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs" style={{ color: currentBg.textLight }}>
                          {client.projects || 0}件
                        </span>
                        {client.profit_rate !== undefined && (
                          <span className={`text-xs flex items-center gap-0.5 ${client.profit_rate >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {client.profit_rate >= 20 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            粗利 {client.profit_rate}%
                          </span>
                        )}
                      </div>
                      <div className="w-full rounded-full h-2 mt-2" style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-orange-400">
                        {formatAmount(client.sales)}円
                      </p>
                      <p className="text-xs" style={{ color: currentBg.textLight }}>
                        {percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {clientData.length === 0 && (
            <div className="text-center py-12" style={{ color: currentBg.textLight }}>
              <Trophy size={48} className="mx-auto mb-3 opacity-30" />
              <p>データがありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
