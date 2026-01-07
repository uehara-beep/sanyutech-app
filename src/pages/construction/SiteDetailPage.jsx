/**
 * 現場詳細画面（設計書3.2準拠）
 * 画面ID: SCR-CONST-002
 * URL: /construction/sites/:id
 *
 * 機能:
 * - 現場情報の表示（見積から連携されたデータ）
 * - 予算・原価・粗利の表示
 * - 日報入力・KY記録・写真管理へのリンク
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, Calendar, MapPin, User,
  FileText, ClipboardList, Camera, Edit3, TrendingUp, TrendingDown,
  ChevronRight, AlertCircle
} from 'lucide-react'
import { API_BASE, authGet } from '../../config/api'
import { useThemeStore, backgroundStyles } from '../../store'

// ステータス定義
const STATUS_CONFIG = {
  '準備中': { color: 'bg-gray-500', textColor: 'text-gray-100' },
  '施工中': { color: 'bg-blue-500', textColor: 'text-blue-100' },
  '完工': { color: 'bg-emerald-500', textColor: 'text-emerald-100' },
  '受注確定': { color: 'bg-blue-500', textColor: 'text-blue-100' },
}

// 金額フォーマット
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '¥0'
  return `¥${Math.floor(amount).toLocaleString()}`
}

export default function SiteDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  // スタイル
  const cardBg = currentBg.cardBg || 'rgba(255, 255, 255, 0.95)'
  const textColor = currentBg.textColor || '#1e293b'
  const textLight = currentBg.textLight || '#64748b'
  const inputBg = currentBg.inputBg || '#f8fafc'
  const cardBorder = currentBg.cardBorder || '#e2e8f0'

  // State
  const [project, setProject] = useState(null)
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)

  // 現場（プロジェクト）取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectData = await authGet(`${API_BASE}/projects/${id}`)
        setProject(projectData)

        // 関連する見積を取得（quote_idがあれば）
        if (projectData.quote_id) {
          try {
            const quoteData = await authGet(`${API_BASE}/quotes/${projectData.quote_id}`)
            setQuote(quoteData)
          } catch (e) {
            console.log('見積取得スキップ')
          }
        }
      } catch (error) {
        console.error('現場取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ color: textColor }}>
        <Building2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">現場が見つかりません</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white"
        >
          戻る
        </button>
      </div>
    )
  }

  // 金額計算
  const budget = project.order_amount || project.budget_amount || 0
  const costTotal = project.cost_total || 0  // 原価累計（日報から集計）
  const profit = budget - costTotal
  const profitRate = budget > 0 ? ((profit / budget) * 100).toFixed(1) : 0

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG['準備中']

  // アクションボタン
  const actions = [
    { icon: FileText, label: '日報入力', path: `/daily-report?project_id=${id}`, color: 'bg-blue-500' },
    { icon: ClipboardList, label: 'KY記録', path: `/ky?project_id=${id}`, color: 'bg-amber-500' },
    { icon: Camera, label: '写真管理', path: `/photos?project_id=${id}`, color: 'bg-emerald-500' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ color: textColor }}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: cardBg }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">現場詳細</h1>
          <p className="text-xs" style={{ color: textLight }}>
            {project.code || `P-${String(project.id).padStart(6, '0')}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm text-white ${statusConfig.color}`}>
          {project.status || '準備中'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* 現場名カード */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <h2 className="text-xl font-bold mb-2">{project.name || '無題'}</h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: textLight }}>
            <User className="w-4 h-4" />
            <span>{project.client || '得意先未設定'}</span>
          </div>
          {project.prefecture && (
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: textLight }}>
              <MapPin className="w-4 h-4" />
              <span>{project.prefecture}</span>
            </div>
          )}
        </div>

        {/* 予算・原価・粗利カード */}
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
          <div className="text-white">
            <div className="text-sm opacity-80 mb-1">予算（税抜）</div>
            <div className="text-3xl font-bold mb-4">{formatMoney(budget)}</div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/20">
              <div>
                <div className="text-xs opacity-70">原価累計</div>
                <div className="text-lg font-bold">{formatMoney(costTotal)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">粗利</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{formatMoney(profit)}</span>
                  <span className={`text-sm flex items-center gap-0.5 ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {profitRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 工期 */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            工期
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-sm" style={{ background: inputBg }}>
              {project.start_date || '未定'}
            </span>
            <span style={{ color: textLight }}>〜</span>
            <span className="px-3 py-1.5 rounded-lg text-sm" style={{ background: inputBg }}>
              {project.end_date || '未定'}
            </span>
          </div>
        </div>

        {/* 見積連携情報 */}
        {quote && (
          <div className="rounded-xl p-4" style={{ background: cardBg }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              見積連携
            </h3>
            <button
              onClick={() => navigate(`/sales/quotes/${quote.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50"
              style={{ background: inputBg }}
            >
              <div>
                <div className="text-sm font-medium">{quote.quote_no || `Q-${String(quote.id).padStart(6, '0')}`}</div>
                <div className="text-xs" style={{ color: textLight }}>
                  見積金額: {formatMoney(quote.total || quote.total_amount)}
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: textLight }} />
            </button>
          </div>
        )}

        {/* アクションボタン */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <h3 className="text-sm font-bold mb-3">アクション</h3>
          <div className="grid grid-cols-3 gap-3">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl text-white ${action.color}`}
              >
                <action.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 備考（あれば） */}
        {project.notes && (
          <div className="rounded-xl p-4" style={{ background: cardBg }}>
            <h3 className="text-sm font-bold mb-2">備考</h3>
            <p className="text-sm whitespace-pre-wrap" style={{ color: textLight }}>
              {project.notes}
            </p>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: cardBg }}>
        <button
          onClick={() => navigate(`/construction/sites/${id}/edit`)}
          className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white flex items-center justify-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          現場情報を編集
        </button>
      </div>
    </div>
  )
}
