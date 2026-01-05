import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, FileText, Calendar, Check, ChevronDown } from 'lucide-react'
import { Header, Card, SectionTitle } from '../components/common'
import Toast from '../components/ui/Toast'
import { SummaryCardSkeleton } from '../components/ui/Skeleton'
import FormField, { Select, DateInput, SubmitButton } from '../components/form/FormField'
import { api } from '../utils/api'
import { required, validateForm } from '../utils/validators'
import { useThemeStore, backgroundStyles } from '../store'

const EXPORT_TYPES = [
  { value: 'sales', label: '売上仕訳', icon: '📈', description: '請求書データを売上仕訳として出力' },
  { value: 'purchase', label: '仕入仕訳', icon: '📦', description: '発注・支払データを仕入仕訳として出力' },
  { value: 'expense', label: '経費仕訳', icon: '💰', description: '経費精算データを仕訳として出力' },
  { value: 'all', label: '全仕訳', icon: '📋', description: '全ての仕訳データを一括出力' },
]

export default function ExportsPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState([])
  const [summary, setSummary] = useState({ sales: 0, purchase: 0, expense: 0 })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    export_type: 'all',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 仮のサマリーデータ（実際のAPIからデータ取得）
      setSummary({ sales: 15, purchase: 8, expense: 12 })
      setExportHistory([
        { id: 1, type: '売上仕訳', date: '2024-01-15', count: 25, user: '管理者' },
        { id: 2, type: '全仕訳', date: '2024-01-01', count: 45, user: '管理者' },
      ])
    } catch (error) {
      showToast('データの取得に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const hideToast = () => setToast(prev => ({ ...prev, show: false }))

  const validateExportForm = () => {
    const schema = {
      export_type: [(v) => required(v, '出力種類')],
      start_date: [(v) => required(v, '開始日')],
      end_date: [(v) => required(v, '終了日')],
    }
    const { isValid, errors: validationErrors } = validateForm(form, schema)
    setErrors(validationErrors)
    return { isValid, errors: validationErrors }
  }

  const handleExport = async (e) => {
    e.preventDefault()
    const { isValid } = validateExportForm()
    if (!isValid) return

    setExporting(true)
    try {
      const result = await api.download(
        `/exports/yayoi?type=${form.export_type}&start_date=${form.start_date}&end_date=${form.end_date}`,
        `yayoi_${form.export_type}_${form.start_date}_${form.end_date}.csv`
      )
      if (result.success) {
        showToast('CSVを出力しました', 'success')
        fetchData() // 履歴更新
      } else {
        showToast(`エラー: ${result.error || 'CSV出力に失敗しました'}`, 'error')
      }
    } catch (error) {
      showToast('エラー: CSV出力に失敗しました', 'error')
    } finally {
      setExporting(false)
    }
  }

  const getTypeLabel = (type) => {
    const found = EXPORT_TYPES.find(t => t.value === type)
    return found?.label || type
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="弥生会計CSV出力"
        icon="📊"
        gradient="from-violet-700 to-violet-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* サマリー */}
        <SectionTitle>📈 出力対象データ</SectionTitle>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">売上仕訳</div>
              <div className="text-lg font-bold text-emerald-400">{summary.sales}件</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">仕入仕訳</div>
              <div className="text-lg font-bold text-blue-400">{summary.purchase}件</div>
            </Card>
            <Card className="text-center py-3">
              <div className="text-xs text-slate-400">経費仕訳</div>
              <div className="text-lg font-bold text-amber-400">{summary.expense}件</div>
            </Card>
          </div>
        )}

        {/* 出力種類選択 */}
        <SectionTitle>📋 出力設定</SectionTitle>

        <Card className="mb-6">
          <form onSubmit={handleExport} className="space-y-4">
            <FormField label="出力種類" required error={errors.export_type}>
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm({ ...form, export_type: type.value })}
                    className={`p-3 rounded-xl text-left border-2 transition-all ${
                      form.export_type === type.value
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-semibold text-sm">{type.label}</span>
                      {form.export_type === type.value && (
                        <Check size={14} className="text-violet-400 ml-auto" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{type.description}</div>
                  </button>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="開始日" required error={errors.start_date}>
                <DateInput
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  error={errors.start_date}
                />
              </FormField>
              <FormField label="終了日" required error={errors.end_date}>
                <DateInput
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  error={errors.end_date}
                />
              </FormField>
            </div>

            <SubmitButton loading={exporting} variant="primary" icon={<Download size={18} />}>
              CSV出力
            </SubmitButton>
          </form>
        </Card>

        {/* 出力履歴 */}
        <SectionTitle>📜 出力履歴</SectionTitle>

        {exportHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <div>出力履歴がありません</div>
          </div>
        ) : (
          exportHistory.map((history, i) => (
            <motion.div
              key={history.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm">{history.type}</div>
                    <div className="text-xs text-slate-400">
                      {history.date} / {history.count}件 / {history.user}
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs flex items-center gap-1">
                    <Download size={12} /> 再出力
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  )
}
