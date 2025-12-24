import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Hotel, MapPin, Calendar, Users, Search,
  ExternalLink, Building2, ChevronDown, Check, Send,
  UserPlus, MessageSquare
} from 'lucide-react'
import { API_BASE } from '../config/api'

// 宿泊予約サイト
const bookingSites = [
  {
    id: 'rakuten',
    name: '楽天トラベル',
    color: 'bg-red-500',
    logo: '🏨',
    getUrl: (params) => {
      const { address, checkin, checkout, adults } = params
      const checkInDate = checkin.replace(/-/g, '/')
      const checkOutDate = checkout.replace(/-/g, '/')
      return `https://travel.rakuten.co.jp/yado/search/?f_teikei=&f_keyword=${encodeURIComponent(address)}&f_cd1=${checkInDate}&f_cd2=${checkOutDate}&f_adult_num=${adults}`
    }
  },
  {
    id: 'jalan',
    name: 'じゃらん',
    color: 'bg-orange-500',
    logo: '🧳',
    getUrl: (params) => {
      const { address, checkin, checkout, adults } = params
      return `https://www.jalan.net/yw/keyword/?keyword=${encodeURIComponent(address)}&adession=${adults}&checkin=${checkin}&checkout=${checkout}`
    }
  },
  {
    id: 'booking',
    name: 'Booking.com',
    color: 'bg-blue-600',
    logo: '🌐',
    getUrl: (params) => {
      const { address, checkin, checkout, adults } = params
      return `https://www.booking.com/searchresults.ja.html?ss=${encodeURIComponent(address)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}`
    }
  },
  {
    id: 'agoda',
    name: 'Agoda',
    color: 'bg-red-600',
    logo: '🔴',
    getUrl: (params) => {
      const { address, checkin, checkout, adults } = params
      return `https://www.agoda.com/ja-jp/search?city=0&textToSearch=${encodeURIComponent(address)}&checkIn=${checkin}&checkOut=${checkout}&rooms=1&adults=${adults}`
    }
  },
  {
    id: 'trivago',
    name: 'トリバゴ',
    color: 'bg-sky-500',
    logo: '🔍',
    getUrl: (params) => {
      const { address, checkin, checkout, adults } = params
      return `https://www.trivago.jp/?search=${encodeURIComponent(address)}&arrival=${checkin}&departure=${checkout}&adession=${adults}`
    }
  }
]

export default function HotelSearch() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchAddress, setSearchAddress] = useState('')
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [manualMember, setManualMember] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [showMemberSection, setShowMemberSection] = useState(false)
  const [sending, setSending] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  // デフォルト日付を設定（今日と明日）
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setCheckin(today.toISOString().split('T')[0])
    setCheckout(tomorrow.toISOString().split('T')[0])
  }, [])

  // 工事一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects/`)
        if (res.ok) {
          const data = await res.json()
          setProjects(data.filter(p => p.address))
        }
      } catch (e) {
        console.error('Projects fetch error:', e)
      }
    }
    fetchProjects()
  }, [])

  // メンバー一覧を取得
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_BASE}/members`)
        if (res.ok) {
          const data = await res.json()
          setMembers(data)
        } else {
          // メンバーがない場合は初期化
          await fetch(`${API_BASE}/members/init`, { method: 'POST' })
          const res2 = await fetch(`${API_BASE}/members`)
          if (res2.ok) setMembers(await res2.json())
        }
      } catch (e) {
        console.error('Members fetch error:', e)
      }
    }
    fetchMembers()
  }, [])

  // 工事を選択
  const handleSelectProject = (project) => {
    setSelectedProject(project)
    setSearchAddress(project.address || '')
    setShowProjectDropdown(false)
  }

  // メンバー選択トグル
  const toggleMember = (memberName) => {
    setSelectedMembers(prev =>
      prev.includes(memberName)
        ? prev.filter(m => m !== memberName)
        : [...prev, memberName]
    )
  }

  // 手入力メンバー追加
  const addManualMember = () => {
    if (manualMember.trim() && !selectedMembers.includes(manualMember.trim())) {
      setSelectedMembers(prev => [...prev, manualMember.trim()])
      setManualMember('')
    }
  }

  // 泊数計算
  const calculateNights = () => {
    if (!checkin || !checkout) return 1
    const start = new Date(checkin)
    const end = new Date(checkout)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }

  // 検索リンクを生成
  const getSearchLinks = () => {
    const params = {
      address: searchAddress,
      checkin,
      checkout,
      adults: selectedMembers.length || 1
    }
    return bookingSites.reduce((acc, site) => {
      acc[site.name] = site.getUrl(params)
      return acc
    }, {})
  }

  // 予約サイトを開く
  const openBookingSite = (site) => {
    if (!searchAddress) {
      alert('住所を入力してください')
      return
    }
    const url = site.getUrl({
      address: searchAddress,
      checkin,
      checkout,
      adults: selectedMembers.length || 1
    })
    window.open(url, '_blank')
  }

  // 事務員に予約依頼を送信
  const sendHotelRequest = async () => {
    if (!searchAddress) {
      alert('住所を入力してください')
      return
    }
    if (selectedMembers.length === 0) {
      alert('宿泊メンバーを選択してください')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/hotel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject?.id,
          project_name: selectedProject?.name || '手入力',
          location: searchAddress,
          checkin,
          checkout,
          nights: calculateNights(),
          members: selectedMembers,
          search_links: getSearchLinks(),
          requested_by: '現場'
        })
      })

      if (res.ok) {
        setRequestSent(true)
        setTimeout(() => setRequestSent(false), 5000)
      } else {
        alert('依頼の送信に失敗しました')
      }
    } catch (e) {
      console.error('Request error:', e)
      alert('依頼の送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#1c1c1e]">
      {/* ヘッダー */}
      <header className="bg-[#2c2c2e] border-b border-[#3c3c3e] sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center gap-3">
          <motion.button
            className="w-10 h-10 bg-[#3c3c3e] rounded-xl flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} className="text-white" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Hotel size={20} className="text-blue-400" />
            <h1 className="text-lg font-bold text-white">ホテル検索</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 工事から選択 */}
        <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-[#3c3c3e]">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={18} className="text-orange-400" />
            <span className="text-sm font-bold text-white">工事現場から選択</span>
          </div>

          <div className="relative">
            <button
              className="w-full bg-[#3c3c3e] rounded-xl p-3 text-left flex items-center justify-between"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <div className="flex-1">
                {selectedProject ? (
                  <div>
                    <div className="text-white font-medium">{selectedProject.name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {selectedProject.address}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">工事を選択...</span>
                )}
              </div>
              <ChevronDown size={18} className="text-gray-400" />
            </button>

            {showProjectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#3c3c3e] rounded-xl shadow-xl border border-[#4c4c4e] max-h-60 overflow-y-auto z-10">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full p-3 text-left hover:bg-[#4c4c4e] border-b border-[#4c4c4e] last:border-b-0"
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="text-white text-sm font-medium">{project.name}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                        <MapPin size={12} />
                        {project.address}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-gray-400 text-sm text-center">
                    住所が登録された工事がありません
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 住所入力 */}
        <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-[#3c3c3e]">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">検索住所</span>
          </div>
          <input
            type="text"
            className="w-full bg-[#3c3c3e] rounded-xl p-3 text-white placeholder-gray-400"
            placeholder="住所を入力（例：東京都渋谷区）"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
        </div>

        {/* 日付 */}
        <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-[#3c3c3e]">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-purple-400" />
            <span className="text-sm font-bold text-white">宿泊日程</span>
            <span className="text-xs text-orange-400 ml-auto">{calculateNights()}泊</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">チェックイン</label>
              <input
                type="date"
                className="w-full bg-[#3c3c3e] rounded-xl p-3 text-white"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">チェックアウト</label>
              <input
                type="date"
                className="w-full bg-[#3c3c3e] rounded-xl p-3 text-white"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* メンバー選択 */}
        <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-[#3c3c3e]">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setShowMemberSection(!showMemberSection)}
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <span className="text-sm font-bold text-white">宿泊メンバー</span>
              {selectedMembers.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {selectedMembers.length}名
                </span>
              )}
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${showMemberSection ? 'rotate-180' : ''}`} />
          </button>

          {showMemberSection && (
            <div className="mt-3 space-y-3">
              {/* メンバーチェックボックス */}
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    className={`p-2 rounded-lg text-left flex items-center gap-2 ${
                      selectedMembers.includes(member.name)
                        ? 'bg-blue-500/20 border border-blue-500'
                        : 'bg-[#3c3c3e] border border-transparent'
                    }`}
                    onClick={() => toggleMember(member.name)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      selectedMembers.includes(member.name) ? 'bg-blue-500' : 'bg-[#4c4c4e]'
                    }`}>
                      {selectedMembers.includes(member.name) && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{member.name}</div>
                      <div className="text-gray-400 text-[10px]">{member.department}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 手入力 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-[#3c3c3e] rounded-lg p-2 text-white text-sm placeholder-gray-400"
                  placeholder="メンバーを手入力..."
                  value={manualMember}
                  onChange={(e) => setManualMember(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addManualMember()}
                />
                <button
                  className="bg-[#3c3c3e] rounded-lg px-3 flex items-center"
                  onClick={addManualMember}
                >
                  <UserPlus size={16} className="text-gray-400" />
                </button>
              </div>

              {/* 選択済みメンバー表示 */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedMembers.map((name) => (
                    <span
                      key={name}
                      className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {name}
                      <button
                        onClick={() => toggleMember(name)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 事務員に予約依頼 */}
        <motion.button
          className={`w-full p-4 rounded-2xl flex items-center justify-center gap-2 ${
            requestSent
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
          onClick={sendHotelRequest}
          disabled={sending || requestSent}
          whileTap={{ scale: 0.98 }}
        >
          {requestSent ? (
            <>
              <Check size={20} className="text-white" />
              <span className="text-white font-bold">依頼を送信しました！</span>
            </>
          ) : sending ? (
            <span className="text-white font-bold">送信中...</span>
          ) : (
            <>
              <MessageSquare size={20} className="text-white" />
              <span className="text-white font-bold">事務員さんに予約依頼</span>
              <Send size={16} className="text-white/70" />
            </>
          )}
        </motion.button>

        {/* 予約サイト */}
        <div className="bg-[#2c2c2e] rounded-2xl p-4 border border-[#3c3c3e]">
          <div className="flex items-center gap-2 mb-3">
            <Search size={18} className="text-blue-400" />
            <span className="text-sm font-bold text-white">自分で検索</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {bookingSites.map((site) => (
              <motion.button
                key={site.id}
                className={`${site.color} rounded-xl p-3 flex items-center justify-between`}
                onClick={() => openBookingSite(site)}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{site.logo}</span>
                  <span className="text-white font-medium text-sm">{site.name}</span>
                </div>
                <ExternalLink size={14} className="text-white/70" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* 使い方ヒント */}
        <div className="bg-[#2c2c2e]/50 rounded-2xl p-4 border border-[#3c3c3e]">
          <div className="text-xs text-gray-400 space-y-1">
            <p>💡 工事現場を選択すると住所が自動入力されます</p>
            <p>💡 メンバーを選択して「事務員さんに予約依頼」でLINE WORKSに送信</p>
            <p>💡 自分で検索する場合は各予約サイトボタンをタップ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
