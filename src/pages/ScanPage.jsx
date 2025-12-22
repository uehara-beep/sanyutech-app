import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Card, SectionTitle, Button, Input, Select, Toast } from '../components/common'

const scanTypes = [
  { icon: '📄', name: '見積書', dest: '単価マスタ' },
  { icon: '🔧', name: 'レンタル伝票', dest: '機材管理' },
  { icon: '🧱', name: '建材伝票', dest: '材料費' },
  { icon: '🛒', name: 'ホームセンター', dest: '消耗品/経費' },
  { icon: '⛽', name: 'ガソリン', dest: '車両/燃料費' },
  { icon: '👷', name: '出面表', dest: '労務費' },
]

const recentScans = [
  { id: 1, type: '見積書', icon: '📄', name: 'アクティオ - バックホー 0.7㎥', date: '12/20 08:30', status: 'done' },
  { id: 2, type: 'レンタル伝票', icon: '🔧', name: 'ニッケン - タイヤローラー', date: '12/19 17:45', status: 'done' },
  { id: 3, type: '建材伝票', icon: '🧱', name: '〇〇建材 - アスファルト合材 50t', date: '12/19 14:20', status: 'done' },
]

export default function ScanPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  
  const handleScan = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProcessing(true)
      setTimeout(() => {
        setProcessing(false)
        navigate('/scan-result')
      }, 1500)
    }
  }
  
  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="撮影ステーション" 
        icon="📸"
        gradient="from-blue-800 to-blue-500"
        onBack={() => navigate('/')}
      />
      
      <div className="px-5 py-4">
        {/* メイン撮影エリア */}
        <motion.div
          className="bg-gradient-to-br from-blue-900 to-blue-500 rounded-3xl p-12 text-center cursor-pointer mb-6"
          onClick={handleScan}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="text-7xl mb-4"
            animate={processing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: processing ? Infinity : 0, ease: 'linear' }}
          >
            {processing ? '🔄' : '📷'}
          </motion.div>
          <div className="text-xl font-bold mb-2">
            {processing ? 'AI読取中...' : 'タップして撮影'}
          </div>
          <div className="text-sm opacity-80">伝票・レシート・見積書なんでもOK</div>
        </motion.div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {/* AI判定タイプ */}
        <Card className="mb-6">
          <div className="text-sm font-semibold text-center mb-4">📋 AIが自動判定して振り分け</div>
          <div className="grid grid-cols-3 gap-3">
            {scanTypes.map((type, i) => (
              <motion.div
                key={type.name}
                className="text-center p-3 bg-app-bg rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-[11px] font-semibold mb-0.5">{type.name}</div>
                <div className="text-[9px] text-slate-400">→ {type.dest}</div>
              </motion.div>
            ))}
          </div>
        </Card>
        
        {/* 最近の読取 */}
        <SectionTitle>🕐 最近の読取</SectionTitle>
        {recentScans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card 
              className="mb-2.5 flex items-center gap-3" 
              onClick={() => navigate('/scan-result')}
            >
              <span className="text-2xl">{scan.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-app-primary font-semibold">{scan.type}</div>
                <div className="text-sm font-medium truncate">{scan.name}</div>
                <div className="text-[11px] text-slate-400">{scan.date}</div>
              </div>
              <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs">
                ✓
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// 読取結果ページ
export function ScanResultPage() {
  const navigate = useNavigate()
  const [toast, setToast] = useState(false)
  
  const handleSave = () => {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      navigate('/scan')
    }, 1500)
  }
  
  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="読取結果" 
        icon="📸"
        gradient="from-blue-800 to-blue-500"
        onBack={() => navigate('/scan')}
      />
      
      <div className="px-5 py-4">
        <Card className="mb-5">
          <div className="inline-block bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
            🤖 AI判定: 見積書
          </div>
          
          <div className="w-full h-28 bg-app-bg rounded-xl flex items-center justify-center text-5xl mb-5">
            📄
          </div>
          
          <Input label="取引先" value="アクティオ" />
          <Input label="品名" value="バックホー 0.7㎥" />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">単価</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-3 bg-slate-800 border border-app-border rounded-xl text-white"
                value="25,000"
                readOnly
              />
              <select className="w-24 px-3 py-3 bg-slate-800 border border-app-border rounded-xl text-white">
                <option>円/日</option>
                <option>円/t</option>
                <option>円/㎥</option>
              </select>
            </div>
          </div>
          
          <Input label="回送費" value="35,000" />
          
          <Select 
            label="現場（紐付け）"
            value="kurume"
            options={[
              { value: 'kurume', label: '久留米管内舗装補修' },
              { value: 'miyazaki', label: '宮崎舗装補修工事' },
              { value: 'chidori', label: '千鳥橋JCT舗装改良' },
            ]}
          />
          
          <Select 
            label="カテゴリ"
            value="rental"
            options={[
              { value: 'rental', label: 'レンタル機材' },
              { value: 'material', label: '材料費' },
              { value: 'subcon', label: '外注費' },
              { value: 'expense', label: '経費' },
            ]}
          />
          
          <div className="bg-app-bg rounded-xl p-4 mt-5">
            <div className="text-xs font-semibold mb-2.5">🔗 自動連携先</div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px]">
                🔧 機材管理
              </span>
              <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px]">
                📊 S-BASE原価
              </span>
              <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1.5 rounded-lg text-[11px]">
                📆 返却日カレンダー
              </span>
            </div>
          </div>
        </Card>
        
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/scan')} className="flex-1">
            キャンセル
          </Button>
          <Button onClick={handleSave} className="flex-[2]">
            登録する
          </Button>
        </div>
      </div>
      
      <Toast message="✅ 登録しました！" isVisible={toast} />
    </div>
  )
}
