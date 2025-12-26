import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header, Card, SectionTitle, Toast } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'

export default function DailyReportPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeTab, setActiveTab] = useState('new') // new, history
  const [toast, setToast] = useState({ show: false, message: '' })
  const [selectedReport, setSelectedReport] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    date: today,
    site: '',
    weather: 'sunny',
    content: '',
    workers: '',
    materials: '',
    issues: '',
    photos: [],
  })

  // サンプル現場データ
  const sites = [
    { id: 1, name: '新宿マンション新築工事' },
    { id: 2, name: '渋谷商業ビル改修' },
    { id: 3, name: '品川駅前再開発' },
    { id: 4, name: '横浜港湾施設' },
  ]

  // サンプル履歴データ
  const reports = [
    { id: 1, date: '2024-01-14', site: '新宿マンション新築工事', weather: 'sunny', content: '鉄骨建方3階まで完了', workers: '山田、佐藤、鈴木、高橋', status: 'approved' },
    { id: 2, date: '2024-01-13', site: '渋谷商業ビル改修', weather: 'cloudy', content: '内装解体作業', workers: '田中、伊藤', status: 'pending' },
    { id: 3, date: '2024-01-12', site: '新宿マンション新築工事', weather: 'rainy', content: '雨天中止', workers: '-', status: 'approved' },
  ]

  const weatherOptions = [
    { value: 'sunny', label: '晴れ', icon: '☀️' },
    { value: 'cloudy', label: '曇り', icon: '☁️' },
    { value: 'rainy', label: '雨', icon: '🌧️' },
    { value: 'snowy', label: '雪', icon: '❄️' },
  ]

  const getWeatherIcon = (weather) => {
    const found = weatherOptions.find(w => w.value === weather)
    return found ? found.icon : '☀️'
  }

  const handleSubmit = () => {
    if (!form.site || !form.content) {
      showToast('現場名と作業内容は必須です')
      return
    }
    showToast('日報を提出しました')
    setForm({
      date: today,
      site: '',
      weather: 'sunny',
      content: '',
      workers: '',
      materials: '',
      issues: '',
      photos: [],
    })
  }

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setForm({ ...form, photos: [...form.photos, ...files.map(f => URL.createObjectURL(f))] })
      showToast(`${files.length}枚の写真を追加しました`)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="日報入力"
        icon="📝"
        gradient="from-teal-700 to-teal-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'new' ? 'bg-teal-500/20 text-teal-400' : ''
            }`}
            style={activeTab !== 'new' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            ✏️ 新規作成
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
              activeTab === 'history' ? 'bg-teal-500/20 text-teal-400' : ''
            }`}
            style={activeTab !== 'history' ? { background: inputBg, color: currentBg.textLight } : {}}
          >
            📋 履歴
          </button>
        </div>

        {activeTab === 'new' ? (
          <Card>
            <div className="space-y-4">
              {/* 日付 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>日付</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text }}
                />
              </div>

              {/* 現場選択 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>現場名 *</label>
                <select
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text }}
                >
                  <option value="">現場を選択</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.name}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* 天気 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>天気</label>
                <div className="flex gap-2">
                  {weatherOptions.map(w => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setForm({ ...form, weather: w.value })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                        form.weather === w.value ? 'bg-teal-500/20 text-teal-400 border border-teal-400/50' : ''
                      }`}
                      style={form.weather !== w.value ? { background: inputBg, color: currentBg.textLight } : {}}
                    >
                      {w.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* 作業内容 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業内容 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={4}
                  placeholder="本日の作業内容を入力"
                />
              </div>

              {/* 作業員 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業員</label>
                <input
                  type="text"
                  value={form.workers}
                  onChange={(e) => setForm({ ...form, workers: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm"
                  style={{ background: inputBg, color: currentBg.text }}
                  placeholder="山田、佐藤、鈴木（カンマ区切り）"
                />
              </div>

              {/* 使用材料 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>使用材料・数量</label>
                <textarea
                  value={form.materials}
                  onChange={(e) => setForm({ ...form, materials: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={2}
                  placeholder="鉄筋 D16 100本、コンクリート 10m3"
                />
              </div>

              {/* 問題点・連絡事項 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>問題点・連絡事項</label>
                <textarea
                  value={form.issues}
                  onChange={(e) => setForm({ ...form, issues: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-sm resize-none"
                  style={{ background: inputBg, color: currentBg.text }}
                  rows={2}
                  placeholder="特記事項があれば入力"
                />
              </div>

              {/* 写真 */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBg.textLight }}>作業写真</label>
                <div className="flex gap-2 flex-wrap">
                  {form.photos.map((photo, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg overflow-hidden relative">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-lg flex flex-col items-center justify-center cursor-pointer" style={{ background: inputBg, border: `1px dashed ${currentBg.textLight}` }}>
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px]" style={{ color: currentBg.textLight }}>追加</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl text-sm font-bold text-white mt-2"
              >
                日報を提出する
              </button>
            </div>
          </Card>
        ) : (
          <>
            <SectionTitle>提出履歴</SectionTitle>
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mb-2.5">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getWeatherIcon(report.weather)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: currentBg.text }}>{report.date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          report.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {report.status === 'approved' ? '承認済' : '承認待ち'}
                        </span>
                      </div>
                      <div className="font-semibold text-sm truncate" style={{ color: currentBg.text }}>
                        {report.site}
                      </div>
                      <div className="text-xs mt-1 line-clamp-2" style={{ color: currentBg.textLight }}>
                        {report.content}
                      </div>
                      <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                        👷 {report.workers}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}
