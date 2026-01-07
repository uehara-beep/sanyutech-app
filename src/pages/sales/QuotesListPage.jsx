/**
 * 見積一覧画面（設計書準拠）
 * 画面ID: SCR-SALES-001
 * URL: /sales/quotes
 *
 * 機能:
 * - 見積一覧表示
 * - ステータスフィルター（下書き/提出済/受注/失注）
 * - カードクリックで見積詳細へ遷移
 * - 予算vs原価表示
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, FileText } from 'lucide-react'
import { API_BASE, authGet } from '../../config/api'
import { useThemeStore, backgroundStyles } from '../../store'

// ステータス定義（設計書準拠）
const STATUS_CONFIG = {
  draft: {
    label: '下書き',
    color: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    dotColor: '#6b7280',
  },
  submitted: {
    label: '提出済',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    dotColor: '#3b82f6',
  },
  ordered: {
    label: '受注',
    color: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    dotColor: '#10b981',
  },
  lost: {
    label: '失注',
    color: 'bg-red-500/20',
    textColor: 'text-red-400',
    dotColor: '#ef4444',
  },
}

// ステータスのマッピング
const normalizeStatus = (status) => {
  if (!status) return 'draft'
  const s = status.toLowerCase()
  if (s === 'draft' || s === '下書き' || s === '作成中') return 'draft'
  if (s === 'submitted' || s === '提出済' || s === '提出済み' || s === '送付済') return 'submitted'
  if (s === 'ordered' || s === '受注' || s === '受注済' || s === '受注済み') return 'ordered'
  if (s === 'lost' || s === '失注') return 'lost'
  return 'draft'
}

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '¥0'
  return `¥${Math.floor(amount).toLocaleString()}`
}

export default function QuotesListPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  // スタイル
  const cardBg = currentBg.cardBg || 'rgba(255, 255, 255, 0.95)'
  const textColor = currentBg.textColor || '#1e293b'
  const textLight = currentBg.textLight || '#64748b'
  const inputBg = currentBg.inputBg || '#f8fafc'
  const cardBorder = currentBg.cardBorder || '#e2e8f0'

  // State
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  // 見積一覧取得
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const data = await authGet(`${API_BASE}/quotes`)
        setQuotes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('見積取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuotes()
  }, [])

  // フィルタリング
  const filteredQuotes = quotes.filter(q => {
    // ステータスフィルター
    if (statusFilter !== 'all') {
      const normalized = normalizeStatus(q.status)
      if (normalized !== statusFilter) return false
    }
    // テキスト検索
    if (searchText) {
      const search = searchText.toLowerCase()
      const title = (q.title || q.project_name || '').toLowerCase()
      const client = (q.client_name || '').toLowerCase()
      const quoteNo = (q.quote_no || '').toLowerCase()
      if (!title.includes(search) && !client.includes(search) && !quoteNo.includes(search)) {
        return false
      }
    }
    return true
  })

  // ステータスごとの件数
  const countByStatus = (status) => {
    if (status === 'all') return quotes.length
    return quotes.filter(q => normalizeStatus(q.status) === status).length
  }

  // カードクリック → 見積詳細へ
  const handleCardClick = (quoteId) => {
    navigate(`/sales/quotes/${quoteId}`)
  }

  // 新規作成
  const handleCreate = () => {
    navigate('/sales/quote-create')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ color: textColor }}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 px-4 py-3" style={{ background: cardBg }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            見積一覧
          </h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            新規見積
          </button>
        </div>

        {/* 検索 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textLight }} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="案件名・得意先・見積番号で検索"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: inputBg, border: `1px solid ${cardBorder}` }}
          />
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { value: 'all', label: '全て' },
            { value: 'draft', label: '下書き' },
            { value: 'submitted', label: '提出済' },
            { value: 'ordered', label: '受注' },
            { value: 'lost', label: '失注' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value ? 'bg-blue-500 text-white' : ''
              }`}
              style={statusFilter !== tab.value ? { background: inputBg, color: textLight } : {}}
            >
              {tab.label}
              <span className="ml-1 opacity-70">({countByStatus(tab.value)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 見積一覧 */}
      <div className="p-4">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12" style={{ color: textLight }}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">見積がありません</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm"
            >
              新規見積を作成
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              const status = normalizeStatus(quote.status)
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
              const totalAmount = quote.total_amount || quote.total || 0
              const costAmount = quote.cost_total || quote.actual_cost || 0
              const budgetAmount = quote.subtotal || totalAmount
              const profit = budgetAmount - costAmount
              const profitRate = budgetAmount > 0 ? ((profit / budgetAmount) * 100).toFixed(1) : 0

              return (
                <div
                  key={quote.id}
                  onClick={() => handleCardClick(quote.id)}
                  className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderLeft: `4px solid ${config.dotColor}`,
                  }}
                >
                  {/* ヘッダー行 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {/* 見積番号 */}
                      <div className="text-xs mb-1" style={{ color: textLight }}>
                        {quote.quote_no || `Q-${String(quote.id).padStart(6, '0')}`}
                      </div>
                      {/* 案件名 */}
                      <div className="font-semibold text-base" style={{ color: textColor }}>
                        {quote.title || quote.project_name || '無題'}
                      </div>
                    </div>
                    {/* ステータスバッジ */}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${config.color} ${config.textColor}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* 得意先 */}
                  <div className="text-sm mb-2" style={{ color: textLight }}>
                    {quote.client_name || '得意先未設定'}
                  </div>

                  {/* 有効期限 */}
                  {quote.valid_until && (
                    <div className="text-xs mb-3" style={{ color: textLight }}>
                      有効期限: {quote.valid_until}
                    </div>
                  )}

                  {/* 金額・予算vs原価 */}
                  <div className="pt-3 flex items-end justify-between" style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <div>
                      <div className="text-xs" style={{ color: textLight }}>見積金額</div>
                      <div className="text-lg font-bold text-blue-500">
                        {formatMoney(totalAmount)}
                      </div>
                    </div>

                    {/* 予算vs原価 */}
                    {status !== 'lost' && (costAmount > 0 || status === 'ordered') && (
                      <div className="text-right">
                        <div className="text-xs" style={{ color: textLight }}>
                          予算 {formatMoney(budgetAmount)} / 原価 {formatMoney(costAmount)}
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs" style={{ color: textLight }}>粗利:</span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}
                          >
                            {formatMoney(profit)}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: profit >= 0 ? '#10b981' : '#ef4444' }}
                          >
                            ({profitRate}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 矢印 */}
                    <ChevronRight className="w-5 h-5 ml-2" style={{ color: textLight }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
