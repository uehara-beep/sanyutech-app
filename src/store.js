import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// メインストア
export const useAppStore = create(
  persist(
    (set, get) => ({
      // ユーザー情報
      user: {
        name: '田中 太郎',
        role: '職長',
        company: 'サンユウテック'
      },
      
      // 通知
      notifications: [
        { id: 1, type: 'approval', title: '承認依頼', body: '田中太郎さんが経費精算を申請しました', time: '5分前', read: false },
        { id: 2, type: 'alert', title: '在庫アラート', body: 'ヘルメットの在庫が最小数量を下回りました', time: '1時間前', read: false },
        { id: 3, type: 'info', title: 'KY承認完了', body: '久留米現場のKY記録が承認されました', time: '昨日', read: true },
      ],
      unreadCount: 2,
      
      // 承認待ち
      pendingApprovals: 3,
      
      // 現場データ
      sites: [
        {
          id: 'kurume',
          name: '九州自動車道 久留米管内舗装補修',
          shortName: '久留米',
          client: '鹿島道路㈱',
          location: '福岡県久留米市東合川1-2-3',
          lat: 33.3152,
          lng: 130.5070,
          period: { start: '2024-04-01', end: '2025-02-28' },
          status: 'active',
          shift: 'day',
          members: ['田中', '山田', '佐藤', '鈴木', '高橋'],
          photos: 23,
          documents: 3,
        },
        {
          id: 'miyazaki',
          name: '宮崎自動車道 舗装補修工事',
          shortName: '宮崎',
          client: '鹿島道路㈱',
          location: '宮崎県宮崎市',
          lat: 31.9077,
          lng: 131.4202,
          period: { start: '2024-07-01', end: '2024-12-31' },
          status: 'active',
          shift: 'night',
          members: ['伊藤', '渡辺', '中村'],
          photos: 15,
          documents: 2,
        },
        {
          id: 'chidori',
          name: '千鳥橋JCT舗装改良',
          shortName: '千鳥橋',
          client: 'NIPPO',
          location: '福岡県福岡市',
          lat: 33.5902,
          lng: 130.4017,
          period: { start: '2024-10-01', end: '2025-01-31' },
          status: 'active',
          shift: 'day',
          members: ['木村', '加藤'],
          photos: 8,
          documents: 1,
        },
      ],
      
      // 作業員
      workers: [
        { id: 1, name: '田中 太郎', role: '職長', company: 'サンユウテック', type: 'employee' },
        { id: 2, name: '山田 次郎', role: '作業員', company: 'サンユウテック', type: 'employee' },
        { id: 3, name: '佐藤 三郎', role: '作業員', company: '〇〇工業', type: 'subcontractor' },
        { id: 4, name: '鈴木 四郎', role: '作業員', company: 'サンユウテック', type: 'employee' },
        { id: 5, name: '高橋 五郎', role: '作業員', company: 'サンユウテック', type: 'employee' },
        { id: 6, name: '伊藤 六郎', role: '作業員', company: '△△建設', type: 'subcontractor' },
        { id: 7, name: '渡辺 七郎', role: 'オペ', company: 'サンユウテック', type: 'employee' },
        { id: 8, name: '中村 八郎', role: '作業員', company: '□□組', type: 'subcontractor' },
      ],
      
      // 車両
      vehicles: [
        { id: 1, name: 'ハイエース', plate: '福岡 100 あ 1234', status: 'available', location: '本社駐車場', fuel: 50, nextInspection: '2025-01-15' },
        { id: 2, name: '2tダンプ', plate: '福岡 200 か 5678', status: 'in-use', location: '久留米現場', user: '田中', nextInspection: '2025-02-20' },
        { id: 3, name: '4tダンプ', plate: '福岡 800 さ 9012', status: 'in-use', location: '宮崎現場', user: '伊藤', nextInspection: '2025-01-10' },
        { id: 4, name: 'キャラバン', plate: '福岡 300 た 3456', status: 'maintenance', location: '整備工場', nextInspection: '2025-03-01' },
      ],
      
      // 機材
      equipment: [
        { id: 1, name: 'バックホー 0.25㎥', code: 'BH-001', status: 'in-use', location: '久留米現場', user: '田中', hours: 1234, type: 'owned' },
        { id: 2, name: 'バックホー 0.45㎥', code: 'BH-002', status: 'available', location: '本社倉庫', hours: 2567, type: 'owned' },
        { id: 3, name: 'ローラー 3t', code: 'RL-001', status: 'in-use', location: '宮崎現場', user: '伊藤', hours: 890, type: 'owned' },
        { id: 4, name: 'アスファルトフィニッシャー', code: 'AF-001', status: 'in-use', location: '久留米現場', user: '山田', hours: 3456, type: 'owned' },
        { id: 5, name: 'ブレーカー', code: 'BR-001', status: 'maintenance', location: '整備工場', hours: 567, type: 'owned' },
      ],
      
      // レンタル機材
      rentals: [
        { id: 1, name: 'バックホー 0.7㎥', company: 'アクティオ', site: '久留米', startDate: '2024-12-10', endDate: '2024-12-28', dailyRate: 25000 },
        { id: 2, name: 'タイヤローラー 10t', company: 'ニッケン', site: '久留米', startDate: '2024-12-15', endDate: '2024-12-25', dailyRate: 18000 },
        { id: 3, name: '路面切削機', company: 'カナモト', site: '千鳥橋', startDate: '2024-12-18', endDate: '2024-12-21', dailyRate: 45000 },
      ],
      
      // 在庫
      inventory: [
        { id: 1, name: 'ヘルメット', stock: 3, min: 5, location: '倉庫A', unit: '個' },
        { id: 2, name: '軍手', stock: 50, min: 20, location: '倉庫A', unit: '双' },
        { id: 3, name: '安全ベスト', stock: 8, min: 10, location: '倉庫A', unit: '枚' },
        { id: 4, name: 'カラーコーン', stock: 30, min: 15, location: '倉庫B', unit: '本' },
      ],
      
      // 単価マスタ
      priceMaster: {
        rental: [
          { id: 1, vendor: 'アクティオ', item: 'バックホー 0.7㎥', dailyRate: 25000, deliveryFee: 35000, date: '2024-12-20' },
          { id: 2, vendor: 'ニッケン', item: 'タイヤローラー 10t', dailyRate: 18000, deliveryFee: 28000, date: '2024-12-15' },
          { id: 3, vendor: 'カナモト', item: '路面切削機', dailyRate: 45000, deliveryFee: 50000, date: '2024-12-18' },
        ],
        material: [
          { id: 1, vendor: '〇〇建材', item: 'アスファルト合材（密粒度13）', unitPrice: 9500, unit: 't', date: '2024-12-01' },
          { id: 2, vendor: '△△砕石', item: '路盤材（RC-40）', unitPrice: 3500, unit: 't', date: '2024-12-01' },
        ],
        subcon: [
          { id: 1, vendor: '〇〇工業', item: '舗装作業員', dailyRate: 20000, date: '2024-04-01' },
          { id: 2, vendor: '△△建設', item: '重機オペレーター', dailyRate: 25000, date: '2024-04-01' },
        ],
      },
      
      // 問い合わせ履歴
      feedbacks: [
        { id: 1, category: 'improve', content: '週間配置表を現場軸にしてほしい', date: '2024-12-19', status: 'resolved' },
        { id: 2, category: 'feature', content: '天気予報を複数ソースで集約してほしい', date: '2024-12-18', status: 'resolved' },
        { id: 3, category: 'feature', content: '機材管理を追加してほしい', date: '2024-12-18', status: 'resolved' },
      ],
      
      // アクション
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.notifications.filter(n => !n.read && n.id !== id).length
      })),
      
      addFeedback: (feedback) => set((state) => ({
        feedbacks: [{ ...feedback, id: Date.now(), date: new Date().toISOString().split('T')[0], status: 'pending' }, ...state.feedbacks]
      })),
      
      addSite: (site) => set((state) => ({
        sites: [...state.sites, { ...site, id: Date.now().toString() }]
      })),
      
      updateSite: (id, updates) => set((state) => ({
        sites: state.sites.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
    }),
    {
      name: 'sanyutech-storage',
      partialize: (state) => ({
        feedbacks: state.feedbacks,
        notifications: state.notifications,
      }),
    }
  )
)

// S-BASE用ストア
export const useSbaseStore = create((set) => ({
  projects: [
    {
      id: 'kurume',
      name: '久留米管内舗装補修',
      client: '鹿島道路㈱',
      contractAmount: 28000000,
      budget: 25200000,
      actualCost: 19600000,
      status: 'active',
      progress: 75,
    },
    {
      id: 'miyazaki',
      name: '宮崎舗装補修工事',
      client: '鹿島道路㈱',
      contractAmount: 13500000,
      budget: 12150000,
      actualCost: 10800000,
      status: 'active',
      progress: 90,
    },
    {
      id: 'chidori',
      name: '千鳥橋JCT舗装改良',
      client: 'NIPPO',
      contractAmount: 8500000,
      budget: 7650000,
      actualCost: 4200000,
      status: 'active',
      progress: 60,
    },
  ],
  
  totalProfit: 8730000,
  profitRate: 18.0,
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
}))

// 天気用ストア
export const useWeatherStore = create((set) => ({
  weatherData: {
    kurume: {
      location: '福岡県久留米市',
      current: { icon: '☀️', temp: 12, condition: '晴れ', confidence: 95 },
      sources: [
        { name: 'Yahoo天気', forecast: '☀️ 晴れ' },
        { name: 'tenki.jp', forecast: '☀️ 晴れ' },
        { name: 'ウェザーニュース', forecast: '☀️ 晴れ' },
      ],
      weekly: [
        { day: '土', icon: '☀️', temp: 14, rain: 0 },
        { day: '日', icon: '☁️', temp: 12, rain: 20 },
        { day: '月', icon: '🌧️', temp: 8, rain: 80, alert: true },
        { day: '火', icon: '☁️', temp: 10, rain: 30 },
        { day: '水', icon: '☀️', temp: 13, rain: 10 },
      ],
    },
    miyazaki: {
      location: '宮崎県宮崎市',
      current: { icon: '☀️', temp: 15, condition: '晴れ', confidence: 90 },
      sources: [
        { name: 'Yahoo天気', forecast: '☀️ 晴れ' },
        { name: 'tenki.jp', forecast: '🌤️ 晴れ時々曇' },
        { name: 'ウェザーニュース', forecast: '☀️ 晴れ' },
      ],
      weekly: [
        { day: '土', icon: '☀️', temp: 16, rain: 5 },
        { day: '日', icon: '☀️', temp: 15, rain: 10 },
        { day: '月', icon: '☁️', temp: 12, rain: 40 },
        { day: '火', icon: '☀️', temp: 14, rain: 15 },
        { day: '水', icon: '☀️', temp: 15, rain: 5 },
      ],
    },
    chidori: {
      location: '福岡県福岡市',
      current: { icon: '🌤️', temp: 13, condition: '晴れ時々曇り', confidence: 75 },
      sources: [
        { name: 'Yahoo天気', forecast: '☀️ 晴れ' },
        { name: 'tenki.jp', forecast: '🌤️ 晴れ時々曇' },
        { name: 'ウェザーニュース', forecast: '☁️ 曇り' },
      ],
      weekly: [
        { day: '土', icon: '☀️', temp: 14, rain: 10 },
        { day: '日', icon: '☁️', temp: 11, rain: 30 },
        { day: '月', icon: '🌧️', temp: 9, rain: 85, alert: true },
        { day: '火', icon: '🌤️', temp: 11, rain: 25 },
        { day: '水', icon: '☀️', temp: 13, rain: 10 },
      ],
    },
  },
  lastUpdated: '12/20 8:00',
  
  refreshWeather: () => set({ lastUpdated: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }),
}))
