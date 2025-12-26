import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, TrendingUp, PieChart, Users, Target,
  BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config/api'
import { useThemeStore, backgroundStyles } from '../store'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlySales, setMonthlySales] = useState([])
  const [clientBreakdown, setClientBreakdown] = useState([])
  const [personRanking, setPersonRanking] = useState([])
  const [targetVsActual, setTargetVsActual] = useState(null)
  const [profitTrend, setProfitTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [year])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [sales, clients, ranking, target, trend] = await Promise.all([
        fetch(`${API_BASE}/analytics/monthly-sales?year=${year}`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/client-breakdown?year=${year}`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/person-ranking?year=${year}`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/target-vs-actual`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/profit-trend?year=${year}`).then(r => r.json())
      ])
      setMonthlySales(sales)
      setClientBreakdown(clients)
      setPersonRanking(ranking)
      setTargetVsActual(target)
      setProfitTrend(trend)
    } catch (e) {
      console.error('Analytics load error:', e)
    }
    setLoading(false)
  }

  const formatAmount = (amount) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億`
    if (amount >= 10000) return `${Math.round(amount / 10000)}万`
    return amount?.toLocaleString() || '0'
  }

  const maxSales = Math.max(...monthlySales.map(m => m.sales || 0), 1)
  const totalClientSales = clientBreakdown.reduce((sum, c) => sum + (c.sales || 0), 0)

  // カードスタイル
  const cardStyle = {
    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.9)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">経営分析</h1>
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex bg-white/20 rounded-lg p-1">
            {[2024, 2025, 2026].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-1 rounded text-white ${year === y ? 'bg-white !text-purple-600' : ''}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* 年間目標vs実績 */}
          {targetVsActual && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4"
              style={cardStyle}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-purple-400" />
                <h2 className="font-bold" style={{ color: currentBg.text }}>年間売上目標 vs 実績</h2>
              </div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs" style={{ color: currentBg.textLight }}>実績</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatAmount(targetVsActual.actual)}円
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: currentBg.textLight }}>目標</p>
                  <p className="text-lg" style={{ color: currentBg.text }}>
                    {formatAmount(targetVsActual.target)}円
                  </p>
                </div>
              </div>
              <div className="w-full rounded-full h-4 mb-2" style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(targetVsActual.achievement_rate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-400 font-bold">
                  達成率 {targetVsActual.achievement_rate}%
                </span>
                <span style={{ color: currentBg.textLight }}>
                  残り {formatAmount(targetVsActual.remaining)}円
                </span>
              </div>
            </motion.div>
          )}

          {/* 月別売上推移 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold" style={{ color: currentBg.text }}>月別売上推移</h2>
            </div>
            <div className="flex items-end gap-1 h-32">
              {monthlySales.map((m, i) => {
                const height = maxSales > 0 ? (m.sales / maxSales) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className="text-xs mt-1" style={{ color: currentBg.textLight }}>{i + 1}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs" style={{ color: currentBg.textLight }}>
              <span>1月</span>
              <span>12月</span>
            </div>
          </motion.div>

          {/* 顧客別売上比率 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-green-400" />
              <h2 className="font-bold" style={{ color: currentBg.text }}>顧客別売上比率</h2>
            </div>
            <div className="space-y-2">
              {clientBreakdown.slice(0, 5).map((c, i) => {
                const percent = totalClientSales > 0 ? (c.sales / totalClientSales) * 100 : 0
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate" style={{ color: currentBg.text }}>{c.client}</span>
                      <span style={{ color: currentBg.textLight }}>{formatAmount(c.sales)}円</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                      <div
                        className={`${colors[i]} h-2 rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* 担当者別粗利ランキング */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-yellow-400" />
              <h2 className="font-bold" style={{ color: currentBg.text }}>担当者別粗利ランキング</h2>
            </div>
            <div className="space-y-2">
              {personRanking.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                    ${i === 0 ? 'bg-yellow-500 text-black' :
                      i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: currentBg.text }}>{p.person}</p>
                    <p className="text-xs" style={{ color: currentBg.textLight }}>
                      売上 {formatAmount(p.sales)}円
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.profit >= 0 ? '+' : ''}{formatAmount(p.profit)}円
                    </p>
                    <div className="flex items-center text-xs">
                      {p.profit >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                      )}
                      <span style={{ color: currentBg.textLight }}>粗利</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 月別粗利率推移 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-4"
            style={cardStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h2 className="font-bold" style={{ color: currentBg.text }}>月別粗利率推移</h2>
            </div>
            <div className="flex items-end gap-1 h-24">
              {profitTrend.map((m, i) => {
                const rate = m.profit_rate || 0
                const color = rate >= 20 ? 'bg-green-500' : rate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="relative w-full flex justify-center">
                      <div
                        className={`w-3/4 ${color} rounded-t`}
                        style={{ height: `${Math.max(rate, 0)}px` }}
                      />
                    </div>
                    <span className="text-xs mt-1" style={{ color: currentBg.textLight }}>{i + 1}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span style={{ color: currentBg.textLight }}>目標ライン: 20%</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded"></span>
                  <span style={{ color: currentBg.textLight }}>20%+</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded"></span>
                  <span style={{ color: currentBg.textLight }}>10-20%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded"></span>
                  <span style={{ color: currentBg.textLight }}>10%未満</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
