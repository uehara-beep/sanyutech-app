import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, HeaderButton, Card } from '../components/common'
import { useWeatherStore, useAppStore, useThemeStore, backgroundStyles } from '../store'

export default function WeatherPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
  const { weatherData, lastUpdated, refreshWeather } = useWeatherStore()
  const { sites } = useAppStore()
  
  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="天気予報"
        icon="🌤️"
        gradient="from-sky-700 to-sky-400"
        onBack={() => navigate(-1)}
        rightAction={<HeaderButton onClick={refreshWeather}>🔄</HeaderButton>}
      />
      
      <div className="px-5 py-4">
        <Card className="mb-4 text-center">
          <div className="text-sm font-semibold mb-2.5">📊 3つの天気予報を集約</div>
          <div className="flex justify-center gap-2 flex-wrap mb-2">
            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-full text-[11px]">Yahoo天気</span>
            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-full text-[11px]">tenki.jp</span>
            <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-full text-[11px]">ウェザーニュース</span>
          </div>
          <div className="text-[11px] text-slate-400">最終更新: {lastUpdated}</div>
        </Card>
        
        {sites.filter(s => s.status === 'active').map((site, i) => {
          const weather = weatherData[site.id]
          if (!weather) return null
          
          return (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <WeatherCard site={site} weather={weather} />
            </motion.div>
          )
        })}
        
        <Card className="mt-4">
          <div className="text-sm font-semibold mb-2.5">📊 信頼度について</div>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[11px]">90%以上</span>
              3社一致
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[11px]">70-89%</span>
              2社一致
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[11px]">70%未満</span>
              予報が分かれる
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function WeatherCard({ site, weather }) {
  const getConfidenceStyle = (confidence) => {
    if (confidence >= 90) return 'bg-emerald-500/20 text-emerald-400'
    if (confidence >= 70) return 'bg-amber-500/20 text-amber-400'
    return 'bg-red-500/20 text-red-400'
  }
  
  return (
    <Card className="mb-4">
      <div className="mb-4">
        <div className="text-sm font-semibold">📍 {site.name}</div>
        <div className="text-xs text-slate-400">{weather.location}</div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl">{weather.current.icon}</span>
        <span className="text-4xl font-bold">{weather.current.temp}°</span>
        <div>
          <div className="text-sm">{weather.current.condition}</div>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] mt-1 ${getConfidenceStyle(weather.current.confidence)}`}>
            信頼度 {weather.current.confidence}%
          </span>
        </div>
      </div>
      
      <div className="bg-app-bg rounded-xl p-3 mb-4">
        {weather.sources.map((source, i) => (
          <div key={i} className={`flex justify-between py-1.5 text-xs ${
            i < weather.sources.length - 1 ? 'border-b border-app-border' : ''
          }`}>
            <span className="text-slate-400">{source.name}</span>
            <span className="font-medium">{source.forecast}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between pt-3 border-t border-app-border">
        {weather.weekly.map((day, i) => (
          <div key={i} className={`text-center p-1.5 rounded-lg text-xs ${day.alert ? 'bg-red-500/10' : ''}`}>
            <div className="text-slate-400 mb-1">{day.day}</div>
            <div className="text-xl my-1">{day.icon}</div>
            <div>{day.temp}°</div>
            <div className={`text-[10px] mt-0.5 ${day.rain >= 80 ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
              {day.rain}%
            </div>
          </div>
        ))}
      </div>
      
      {weather.weekly.some(d => d.alert) && (
        <div className="mt-3 p-2.5 bg-amber-500/15 text-amber-400 rounded-lg text-xs">
          ⚠️ 月曜日は雨予報（80%）- 作業中止の可能性
        </div>
      )}
    </Card>
  )
}
