import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Button, Select, Textarea, Toast } from '../components/common'
import { useAppStore, useThemeStore, backgroundStyles } from '../store'

// 問い合わせページ
export function FeedbackPage() {
  const navigate = useNavigate()
  const { feedbacks, addFeedback } = useAppStore()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [category, setCategory] = useState('')
  const [app, setApp] = useState('')
  const [content, setContent] = useState('')
  const [toast, setToast] = useState(false)
  
  const categories = [
    { value: 'bug', label: '🐛 不具合・エラー' },
    { value: 'improve', label: '🔧 改善要望' },
    { value: 'feature', label: '✨ 新機能リクエスト' },
    { value: 'design', label: '🎨 デザイン・見た目' },
    { value: 'question', label: '❓ 使い方の質問' },
    { value: 'other', label: '📝 その他' },
  ]
  
  const apps = [
    { value: 'scan', label: '📸 撮影ステーション' },
    { value: 'dantori', label: '🚧 段取りくん' },
    { value: 'sbase', label: '📊 S-BASE' },
    { value: 'price', label: '💰 単価マスタ' },
    { value: 'equipment', label: '🔧 機材管理' },
    { value: 'car', label: '🚗 車両管理' },
    { value: 'weather', label: '🌤️ 天気予報' },
    { value: 'ky', label: '⚠️ KY管理' },
    { value: 'other', label: 'その他' },
  ]
  
  const handleSubmit = () => {
    if (!content.trim()) return
    addFeedback({ category, app, content })
    setToast(true)
    setCategory('')
    setApp('')
    setContent('')
    setTimeout(() => setToast(false), 2000)
  }
  
  const getCategoryStyle = (cat) => {
    const styles = {
      bug: 'bg-red-500/20 text-red-400',
      improve: 'bg-amber-500/20 text-amber-400',
      feature: 'bg-emerald-500/20 text-emerald-400',
      design: 'bg-pink-500/20 text-pink-400',
      question: 'bg-blue-500/20 text-blue-400',
      other: 'bg-slate-500/20 text-slate-400',
    }
    return styles[cat] || styles.other
  }
  
  const getCategoryLabel = (cat) => {
    const labels = {
      bug: '🐛 不具合',
      improve: '🔧 改善要望',
      feature: '✨ 新機能',
      design: '🎨 デザイン',
      question: '❓ 質問',
      other: '📝 その他',
    }
    return labels[cat] || cat
  }
  
  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="問い合わせ・要望"
        icon="💬"
        gradient="from-emerald-700 to-emerald-400"
        onBack={() => navigate(-1)}
      />
      
      <div className="px-5 py-4">
        <motion.div
          className="bg-gradient-to-br from-emerald-700 to-emerald-400 rounded-2xl p-6 text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-4xl mb-3">💡</div>
          <div className="text-sm leading-relaxed">
            使いにくい点や「こうしてほしい！」という<br/>要望があればお気軽にどうぞ！
          </div>
        </motion.div>
        
        <Card className="mb-6">
          <Select 
            label="カテゴリ"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories}
            placeholder="選択してください"
          />
          
          <Select 
            label="関連するアプリ（任意）"
            value={app}
            onChange={(e) => setApp(e.target.value)}
            options={apps}
            placeholder="選択してください"
          />
          
          <Textarea 
            label="内容 *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`例：\n・〇〇の画面で△△ができない\n・□□を追加してほしい\n・ここの文字が見づらい`}
            rows={6}
          />
          
          <Button block onClick={handleSubmit}>送信する</Button>
        </Card>
        
        <SectionTitle>📋 過去の問い合わせ</SectionTitle>
        {feedbacks.map((fb, i) => (
          <motion.div
            key={fb.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="mb-2.5">
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getCategoryStyle(fb.category)}`}>
                  {getCategoryLabel(fb.category)}
                </span>
                <span className="text-[11px] text-slate-400">{fb.date}</span>
              </div>
              <div className="text-sm mb-2">{fb.content}</div>
              <div className={`flex items-center gap-1.5 text-xs ${
                fb.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                <span>{fb.status === 'resolved' ? '✅' : '🔄'}</span>
                <span>{fb.status === 'resolved' ? '対応済み' : '対応中'}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <Toast message="送信しました！" isVisible={toast} />
    </div>
  )
}

// ヘルプページ
export function HelpPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const [openItems, setOpenItems] = useState([])
  
  const toggleItem = (id) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }
  
  const helpItems = [
    {
      id: 'scan',
      icon: '📸',
      title: '撮影ステーション',
      steps: [
        'ホーム画面の「撮影ステーション」をタップ',
        'カメラで伝票・レシート・見積書を撮影',
        'AIが自動で種類を判定',
        '内容を確認して「登録」',
      ],
      tip: '見積書を先に読み込むと、伝票の単価が自動適用されます',
    },
    {
      id: 'dantori',
      icon: '🚧',
      title: '段取りくん',
      steps: [
        '「今日」タブで本日の配置を確認',
        '現場カードをタップで詳細表示',
        '📍ナビ / 📝日報 / 📸写真 / 📄書類 を操作',
      ],
      tip: '「週間」タブで一週間の配置を確認できます',
    },
    {
      id: 'sbase',
      icon: '📊',
      title: 'S-BASE（原価管理）',
      steps: [
        'トップで全現場の最終利益を確認',
        '工事をタップで詳細を表示',
        '原価内訳・工種別の集計を確認',
      ],
      tip: '撮影ステーションで読み込んだ伝票は自動で原価に反映されます',
    },
    {
      id: 'price',
      icon: '💰',
      title: '単価マスタ',
      steps: [
        '見積書を撮影して単価を登録',
        'レンタル/材料/外注ごとに管理',
        '伝票読取時に単価が自動適用',
      ],
      tip: '見積と実績の差異を自動でチェックします',
    },
    {
      id: 'equipment',
      icon: '🔧',
      title: '機材管理',
      steps: [
        '「機材一覧」で自社機材を確認',
        '「レンタル」でレンタル中機材を管理',
        '「点検」で点検予定・履歴を確認',
      ],
      tip: 'レンタル伝票を撮影すると自動でレンタル機材に登録されます',
    },
    {
      id: 'weather',
      icon: '🌤️',
      title: '天気予報',
      steps: [
        '各現場の位置情報をもとに天気を取得',
        '3つの天気サイトを集約して信頼度を表示',
        '雨予報の日はアラート表示',
      ],
      tip: '信頼度90%以上は3社一致、70-89%は2社一致です',
    },
  ]
  
  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="使い方ガイド"
        icon="❓"
        gradient="from-indigo-700 to-indigo-400"
        onBack={() => navigate(-1)}
      />
      
      <div className="px-5 py-4">
        <div className="mb-5">
          <input 
            type="text" 
            placeholder="🔍 やりたいことを検索..."
            className="w-full px-4 py-3 bg-app-card border border-app-border rounded-xl text-white placeholder:text-slate-500"
          />
        </div>
        
        <SectionTitle>📱 アプリ別ガイド</SectionTitle>
        
        {helpItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card 
              className="mb-2.5 overflow-hidden" 
              padding={false}
            >
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="flex-1 text-sm font-semibold">{item.title}</span>
                <span className={`text-xs text-slate-400 transition-transform ${
                  openItems.includes(item.id) ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </div>
              
              {openItems.includes(item.id) && (
                <motion.div 
                  className="px-4 pb-4 border-t border-app-border"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="pt-4 space-y-2.5">
                    {item.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-app-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="text-sm pt-0.5">{step}</div>
                      </div>
                    ))}
                  </div>
                  {item.tip && (
                    <div className="mt-3 p-2.5 bg-amber-500/10 border-l-2 border-amber-400 text-amber-400 text-xs rounded-r-lg">
                      💡 {item.tip}
                    </div>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
