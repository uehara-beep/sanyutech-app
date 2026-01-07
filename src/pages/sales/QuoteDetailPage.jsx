/**
 * 見積詳細画面（設計書準拠）
 * 画面ID: SCR-SALES-003
 * URL: /sales/quotes/:id
 *
 * 機能:
 * - 見積内容の表示
 * - 編集ボタン→見積作成画面へ遷移
 * - ステータス変更（下書き→提出済→受注/失注）
 * - 受注時に現場を自動作成（設計書2.1.2）
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit3, FileText, Send, CheckCircle, XCircle,
  Building2, Calendar, Clock, ChevronRight
} from 'lucide-react'
import { API_BASE, authGet, authFetch } from '../../config/api'
import { useThemeStore, backgroundStyles } from '../../store'

// ステータス定義
const STATUS_CONFIG = {
  draft: { label: '下書き', color: 'bg-gray-500', next: 'submitted', nextLabel: '提出する' },
  submitted: { label: '提出済', color: 'bg-blue-500', next: 'ordered', nextLabel: '受注する' },
  ordered: { label: '受注', color: 'bg-emerald-500', next: null, nextLabel: null },
  lost: { label: '失注', color: 'bg-red-500', next: null, nextLabel: null },
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

export default function QuoteDetailPage() {
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
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // 見積取得
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const data = await authGet(`${API_BASE}/quotes/${id}`)
        setQuote(data)
      } catch (error) {
        console.error('見積取得エラー:', error)
        showToast('見積の取得に失敗しました', 'error')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchQuote()
  }, [id])

  // トースト表示
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  // 編集画面へ
  const handleEdit = () => {
    navigate(`/sales/quote-create/${id}`)
  }

  // ステータス変更
  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`ステータスを「${STATUS_CONFIG[newStatus]?.label || newStatus}」に変更しますか？`)) {
      return
    }

    setProcessing(true)
    try {
      await authFetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus === 'submitted' ? '提出済' : newStatus === 'lost' ? '失注' : newStatus })
      })
      showToast(`ステータスを変更しました`)
      // 再取得
      const data = await authGet(`${API_BASE}/quotes/${id}`)
      setQuote(data)
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      showToast('ステータスの変更に失敗しました', 'error')
    } finally {
      setProcessing(false)
    }
  }

  // 受注処理（現場自動作成）
  const handleOrder = async () => {
    if (!window.confirm('受注処理を行いますか？\n現場が自動作成されます。')) {
      return
    }

    setProcessing(true)
    try {
      const result = await authFetch(`${API_BASE}/quotes/${id}/to-order`, {
        method: 'POST'
      })
      showToast(result.message || '受注処理が完了しました')

      // 現場詳細へ遷移
      if (result.project_id) {
        setTimeout(() => {
          navigate(`/projects/${result.project_id}`)
        }, 1500)
      } else {
        // 再取得
        const data = await authGet(`${API_BASE}/quotes/${id}`)
        setQuote(data)
      }
    } catch (error) {
      console.error('受注処理エラー:', error)
      showToast(error.data?.detail || '受注処理に失敗しました', 'error')
    } finally {
      setProcessing(false)
    }
  }

  // 失注処理
  const handleLost = async () => {
    if (!window.confirm('失注にしますか？')) {
      return
    }

    setProcessing(true)
    try {
      await authFetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: '失注' })
      })
      showToast('失注にしました')
      // 再取得
      const data = await authGet(`${API_BASE}/quotes/${id}`)
      setQuote(data)
    } catch (error) {
      console.error('失注処理エラー:', error)
      showToast('失注処理に失敗しました', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ color: textColor }}>
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">見積が見つかりません</p>
        <button
          onClick={() => navigate('/sales/quotes')}
          className="px-4 py-2 rounded-xl bg-blue-500 text-white"
        >
          一覧に戻る
        </button>
      </div>
    )
  }

  const status = normalizeStatus(quote.status)
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const items = quote.items || []
  const subtotal = quote.subtotal || items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const tax = quote.tax_amount || Math.floor(subtotal * 0.1)
  const total = quote.total || quote.total_amount || subtotal + tax

  return (
    <div className="min-h-screen pb-32" style={{ color: textColor }}>
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: cardBg }}>
        <button onClick={() => navigate('/sales/quotes')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">見積詳細</h1>
          <p className="text-xs" style={{ color: textLight }}>
            {quote.quote_no || `Q-${String(quote.id).padStart(6, '0')}`}
          </p>
        </div>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-500 text-white text-sm"
        >
          <Edit3 className="w-4 h-4" />
          編集
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* ステータス */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-white text-sm ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {quote.project_id && (
                <button
                  onClick={() => navigate(`/projects/${quote.project_id}`)}
                  className="flex items-center gap-1 text-xs text-blue-500"
                >
                  <Building2 className="w-3 h-3" />
                  現場を見る
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            基本情報
          </h2>

          <div className="space-y-3">
            <div>
              <div className="text-xs" style={{ color: textLight }}>案件名</div>
              <div className="font-medium">{quote.title || quote.project_name || '無題'}</div>
            </div>

            <div>
              <div className="text-xs" style={{ color: textLight }}>得意先</div>
              <div className="font-medium">{quote.client_name || '未設定'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs" style={{ color: textLight }}>発行日</div>
                <div className="font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" style={{ color: textLight }} />
                  {quote.issue_date || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: textLight }}>有効期限</div>
                <div className="font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" style={{ color: textLight }} />
                  {quote.valid_until || '-'}
                </div>
              </div>
            </div>

            {quote.notes && (
              <div>
                <div className="text-xs" style={{ color: textLight }}>備考</div>
                <div className="text-sm whitespace-pre-wrap">{quote.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* 明細 */}
        <div className="rounded-xl p-4" style={{ background: cardBg }}>
          <h2 className="text-base font-bold mb-3">明細</h2>

          {items.length === 0 ? (
            <p className="text-sm" style={{ color: textLight }}>明細がありません</p>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg"
                  style={{ background: inputBg }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium text-sm">{item.name || '名称なし'}</div>
                    <div className="font-bold text-sm text-blue-500">{formatMoney(item.amount)}</div>
                  </div>
                  <div className="text-xs" style={{ color: textLight }}>
                    {item.specification && <span>{item.specification} / </span>}
                    {item.quantity || 0} {item.unit || '式'} × {formatMoney(item.unit_price)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 合計金額 */}
        <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
          <div className="text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="opacity-80">小計</span>
              <span className="text-lg">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="opacity-80">消費税(10%)</span>
              <span className="text-lg">{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/30">
              <span className="font-bold">合計（税込）</span>
              <span className="text-2xl font-bold">{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* フッターアクション */}
      <div className="fixed bottom-0 left-0 right-0 p-4 space-y-2" style={{ background: cardBg }}>
        {/* ステータスに応じたアクションボタン */}
        {status === 'draft' && (
          <button
            onClick={() => handleStatusChange('submitted')}
            disabled={processing}
            className="w-full py-3 rounded-xl font-medium bg-blue-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {processing ? '処理中...' : '提出する'}
          </button>
        )}

        {status === 'submitted' && (
          <div className="flex gap-2">
            <button
              onClick={handleLost}
              disabled={processing}
              className="flex-1 py-3 rounded-xl font-medium border border-red-500 text-red-500 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              失注
            </button>
            <button
              onClick={handleOrder}
              disabled={processing}
              className="flex-1 py-3 rounded-xl font-medium bg-emerald-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {processing ? '処理中...' : '受注する'}
            </button>
          </div>
        )}

        {status === 'ordered' && quote.project_id && (
          <button
            onClick={() => navigate(`/projects/${quote.project_id}`)}
            className="w-full py-3 rounded-xl font-medium bg-emerald-500 text-white flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            現場詳細へ
          </button>
        )}

        {status === 'lost' && (
          <div className="text-center py-2 text-sm" style={{ color: textLight }}>
            この見積は失注になりました
          </div>
        )}
      </div>

      {/* トースト */}
      {toast.show && (
        <div
          className={`fixed top-20 right-4 px-4 py-3 rounded-xl shadow-lg z-50 ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
