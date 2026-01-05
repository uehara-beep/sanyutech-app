import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, User, Bell, Shield, Palette, Info, HelpCircle, LogOut, Monitor, Type, ArrowLeft, Settings as SettingsIcon, RotateCcw, Plus, Trash2, Edit3, Megaphone, Building2, Users, Upload, CheckCircle, AlertCircle, HardHat, Search, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore, themeColors, backgroundStyles, fontSizes, useAppStore, useAuthStore, useDashboardStore, dashboardWidgets, dashboardCategories, kpiOptions } from '../store'
import { ClipboardList, FileText, BarChart3, ChevronDown } from 'lucide-react'
import { API_BASE } from '../config/api'

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    themeId, setTheme, getCurrentTheme,
    backgroundId, setBackground, getCurrentBackground,
    fontSizeId, setFontSize, getCurrentFontSize
  } = useThemeStore()
  const { user } = useAppStore()
  const { logout, user: authUser } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  const currentTheme = getCurrentTheme()
  const currentBackground = getCurrentBackground()
  const currentFontSize = getCurrentFontSize()

  // ダッシュボード設定
  const { enabledWidgets, toggleWidget, resetToDefault, enabledKpis, toggleKpi } = useDashboardStore()
  const [expandedCategory, setExpandedCategory] = useState(null)

  // お知らせ管理
  const [notifications, setNotifications] = useState([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    }
  }

  const handleSaveNotification = async () => {
    try {
      const method = editingNotification ? 'PUT' : 'POST'
      const url = editingNotification
        ? `${API_BASE}/notifications/${editingNotification.id}`
        : `${API_BASE}/notifications/`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm)
      })

      if (res.ok) {
        fetchNotifications()
        setShowNotificationModal(false)
        setEditingNotification(null)
        setNotificationForm({ title: '', message: '', type: 'info' })
      }
    } catch (e) {
      console.error('Failed to save notification:', e)
    }
  }

  const handleDeleteNotification = async (id) => {
    if (!confirm('このお知らせを削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (e) {
      console.error('Failed to delete notification:', e)
    }
  }

  const openEditModal = (notification) => {
    setEditingNotification(notification)
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info'
    })
    setShowNotificationModal(true)
  }

  const openAddModal = () => {
    setEditingNotification(null)
    setNotificationForm({ title: '', message: '', type: 'info' })
    setShowNotificationModal(true)
  }

  // カテゴリアイコンマッピング
  const categoryIcons = {
    sales: ClipboardList,
    construction: HardHat,
    office: FileText,
    management: BarChart3,
  }

  // カテゴリの有効ウィジェット数を取得
  const getEnabledCount = (categoryId) => {
    return dashboardWidgets
      .filter(w => w.category === categoryId && enabledWidgets.includes(w.id))
      .length
  }

  const getTotalCount = (categoryId) => {
    return dashboardWidgets.filter(w => w.category === categoryId).length
  }

  const isOcean = currentBackground?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBackground.bg }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: currentBackground.headerBg,
          borderBottom: `1px solid ${currentBackground.border}`,
        }}
      >
        <div className="flex items-center gap-3.5 px-6 py-4">
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
            }}
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft
              size={20}
              strokeWidth={1.5}
              style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }}
            />
          </motion.button>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: isOcean
                ? 'rgba(255,255,255,0.2)'
                : `linear-gradient(145deg, ${currentTheme.primary}, ${currentTheme.primary}dd)`,
            }}
          >
            <SettingsIcon size={20} className="text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2
              className="text-lg font-medium tracking-wide"
              style={{ color: currentBackground.text }}
            >
              設定
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: currentBackground.textLight }}
            >
              テーマ・表示設定
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* ユーザー情報 */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{
            background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
            backdropFilter: isOcean ? 'blur(10px)' : 'none',
          }}
        >
          <div className="p-4 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white"
              style={{ backgroundColor: currentTheme.primary }}
            >
              {authUser?.display_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium" style={{ color: currentBackground.text }}>
                {authUser?.display_name || user?.name || 'ユーザー'}
              </div>
              <div className="text-sm" style={{ color: currentBackground.textLight }}>
                {authUser?.username || user?.role || '役職'} / {authUser?.role || user?.company || '会社名'}
              </div>
            </div>
            <ChevronRight size={20} style={{ color: currentBackground.textLight }} />
          </div>
        </motion.div>

        {/* テーマカラー */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            テーマカラー
          </div>
          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: isOcean ? 'blur(10px)' : 'none',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Palette size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: currentBackground.text }}>現在のテーマ</div>
                <div className="text-xs" style={{ color: currentBackground.textLight }}>{currentTheme.name} - {currentTheme.desc}</div>
              </div>
            </div>

            {/* カラーパレット */}
            <div className="grid grid-cols-5 gap-3">
              {themeColors.map((theme) => (
                <motion.button
                  key={theme.id}
                  className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors"
                  style={{
                    backgroundColor: themeId === theme.id ? theme.primary + '20' : 'transparent',
                    border: themeId === theme.id ? '2px solid ' + theme.primary : '2px solid transparent'
                  }}
                  onClick={() => setTheme(theme.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {themeId === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check size={20} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: currentBackground.textLight }}>{theme.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 背景テーマ */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            背景テーマ
          </div>
          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: isOcean ? 'blur(10px)' : 'none',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isOcean
                    ? 'linear-gradient(180deg, rgba(0,210,220,0.8) 0%, rgba(0,150,170,0.9) 100%)'
                    : 'linear-gradient(145deg, #666, #888)',
                }}
              >
                <Monitor size={18} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: currentBackground.text }}>現在の背景</div>
                <div className="text-xs" style={{ color: currentBackground.textLight }}>{currentBackground.name} - {currentBackground.desc}</div>
              </div>
            </div>

            <div className="space-y-2">
              {backgroundStyles.map((bg) => (
                <motion.button
                  key={bg.id}
                  className="w-full relative p-3 rounded-xl transition-colors flex items-center gap-3"
                  style={{
                    backgroundColor: backgroundId === bg.id
                      ? isOcean ? 'rgba(255,255,255,0.15)' : `${currentTheme.primary}15`
                      : isOcean ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    border: backgroundId === bg.id
                      ? `2px solid ${currentTheme.primary}`
                      : `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                  onClick={() => setBackground(bg.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="w-12 h-12 rounded-lg relative overflow-hidden shadow-sm"
                    style={{
                      background: bg.bg,
                      border: bg.id === 'ocean' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Ocean wave preview */}
                    {bg.hasOceanEffect && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'radial-gradient(ellipse 20px 15px at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 70%)'
                          }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'radial-gradient(ellipse 15px 12px at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 70%)'
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium" style={{ color: currentBackground.text }}>{bg.name}</div>
                    <div className="text-[10px]" style={{ color: currentBackground.textLight }}>{bg.desc}</div>
                  </div>
                  {backgroundId === bg.id && (
                    <Check size={18} style={{ color: currentTheme.primary }} strokeWidth={2} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 文字サイズ */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            文字サイズ
          </div>
          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: isOcean ? 'blur(10px)' : 'none',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primary }}
              >
                <Type size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: currentBackground.text }}>現在のサイズ</div>
                <div className="text-xs" style={{ color: currentBackground.textLight }}>{currentFontSize.name} - {currentFontSize.desc}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((size) => (
                <motion.button
                  key={size.id}
                  className="relative p-3 rounded-xl transition-colors text-center"
                  style={{
                    backgroundColor: fontSizeId === size.id
                      ? isOcean ? 'rgba(255,255,255,0.15)' : `${currentTheme.primary}20`
                      : isOcean ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    border: fontSizeId === size.id
                      ? `2px solid ${currentTheme.primary}`
                      : `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                  onClick={() => setFontSize(size.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="font-medium mb-1"
                    style={{ fontSize: `${size.base}px`, color: currentBackground.text }}
                  >
                    Aa
                  </div>
                  <div className="text-[10px]" style={{ color: currentBackground.textLight }}>{size.name}</div>
                  {fontSizeId === size.id && (
                    <div className="absolute top-1 right-1">
                      <Check size={14} style={{ color: currentTheme.primary }} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* プレビュー */}
            <div
              className="mt-4 p-3 rounded-xl"
              style={{
                backgroundColor: isOcean ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              }}
            >
              <div className="text-xs mb-2" style={{ color: currentBackground.textLight }}>プレビュー</div>
              <div style={{ fontSize: `${currentFontSize.base}px`, color: currentBackground.text }}>
                サンプルテキスト - Sample Text 123
              </div>
            </div>
          </motion.div>
        </div>

        {/* KPI設定 */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
              KPIカード設定（PC版ダッシュボード）
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'rgba(100,100,100,0.1)', color: currentBackground.textLight }}>
              {enabledKpis.length}/4
            </span>
          </div>

          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: isOcean ? 'blur(10px)' : 'none',
            }}
          >
            <div className="text-xs mb-3" style={{ color: currentBackground.textLight }}>
              表示するKPIを選択（最大4つ）
            </div>
            <div className="grid grid-cols-2 gap-2">
              {kpiOptions.map((kpi) => {
                const isEnabled = enabledKpis.includes(kpi.id)
                const canToggle = isEnabled || enabledKpis.length < 4
                return (
                  <motion.button
                    key={kpi.id}
                    className={`p-3 rounded-xl flex items-center gap-2 transition-all ${!canToggle ? 'opacity-50' : ''}`}
                    style={{
                      background: isEnabled ? `${kpi.color}20` : isOcean ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isEnabled ? kpi.color : 'transparent'}`,
                    }}
                    onClick={() => canToggle && toggleKpi(kpi.id)}
                    whileTap={canToggle ? { scale: 0.97 } : {}}
                    disabled={!canToggle}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${kpi.color}30` }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ background: kpi.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium" style={{ color: currentBackground.text }}>
                        {kpi.name}
                      </div>
                    </div>
                    {isEnabled && (
                      <Check size={16} style={{ color: kpi.color }} />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ダッシュボード設定 */}
        <div>
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
              ウィジェット設定
            </div>
            <motion.button
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px]"
              style={{
                background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: currentBackground.textLight,
              }}
              onClick={resetToDefault}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw size={12} />
              リセット
            </motion.button>
          </div>

          {/* カテゴリカード */}
          <div className="space-y-3">
            {dashboardCategories.map((category) => {
              const Icon = categoryIcons[category.id]
              const isExpanded = expandedCategory === category.id
              const enabledCount = getEnabledCount(category.id)
              const totalCount = getTotalCount(category.id)
              const categoryWidgets = dashboardWidgets.filter(w => w.category === category.id)

              return (
                <motion.div
                  key={category.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
                    backdropFilter: isOcean ? 'blur(10px)' : 'none',
                  }}
                >
                  {/* カードヘッダー（タップで展開） */}
                  <motion.button
                    className="w-full p-4 flex items-center gap-3"
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(145deg, ${category.color}, ${category.color}dd)` }}
                    >
                      <Icon size={22} className="text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-base font-medium" style={{ color: currentBackground.text }}>
                        {category.name}
                      </div>
                      <div className="text-xs" style={{ color: currentBackground.textLight }}>
                        {category.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: enabledCount > 0 ? `${category.color}20` : 'rgba(100,100,100,0.1)',
                          color: enabledCount > 0 ? category.color : currentBackground.textLight,
                        }}
                      >
                        {enabledCount}/{totalCount}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} style={{ color: currentBackground.textLight }} />
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* アコーディオン内容 */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      className="px-4 pb-4 pt-2 space-y-2"
                      style={{ borderTop: `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}
                    >
                      {categoryWidgets.map((widget) => (
                        <label
                          key={widget.id}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                          style={{
                            background: enabledWidgets.includes(widget.id)
                              ? `${category.color}15`
                              : isOcean ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            border: enabledWidgets.includes(widget.id)
                              ? `1px solid ${category.color}40`
                              : `1px solid ${isOcean ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}`,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={enabledWidgets.includes(widget.id)}
                            onChange={() => toggleWidget(widget.id)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: category.color }}
                          />
                          <span
                            className="text-sm flex-1"
                            style={{
                              color: enabledWidgets.includes(widget.id)
                                ? currentBackground.text
                                : currentBackground.textLight
                            }}
                          >
                            {widget.name}
                          </span>
                          {enabledWidgets.includes(widget.id) && (
                            <Check size={16} style={{ color: category.color }} />
                          )}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* 設定メニュー */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            一般設定
          </div>
          <div className="space-y-2">
            <SettingItem icon={<Bell size={20} />} title="通知設定" subtitle="プッシュ通知、メール通知" themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
            <SettingItem icon={<Shield size={20} />} title="プライバシー" subtitle="データ管理、セキュリティ" themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
            <SettingItem icon={<User size={20} />} title="アカウント" subtitle="ログイン情報、パスワード変更" themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
          </div>
        </div>

        {/* マスタ管理 */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            マスタ管理
          </div>
          <div className="space-y-2">
            <SettingItem icon={<Building2 size={20} />} title="会社設定" subtitle="会社情報、銀行口座設定" onClick={() => navigate('/settings/company')} themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
            <SettingItem icon={<Users size={20} />} title="ユーザー管理" subtitle="ユーザー追加・編集・権限設定" onClick={() => navigate('/settings/users')} themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
          </div>
        </div>

        {/* 外部連携（管理者のみ） */}
        {authUser?.role === 'admin' && (
          <div>
            <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
              外部連携
            </div>
            <div className="space-y-2">
              <SettingItem
                icon={<div className="w-5 h-5 bg-[#00C300] rounded flex items-center justify-center text-white text-xs font-bold">L</div>}
                title="LINE WORKS設定"
                subtitle="OAuth認証・API連携設定"
                onClick={() => navigate('/settings/lineworks')}
                themeStyle={currentBackground}
                isOcean={isOcean}
                isLightTheme={isLightTheme}
                currentTheme={currentTheme}
              />
            </div>
          </div>
        )}

        {/* お知らせ管理 */}
        <div>
          <div className="flex items-center justify-between px-1 py-2">
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
              お知らせ管理（管理者用）
            </div>
            <motion.button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: currentTheme.primary }}
              onClick={openAddModal}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={14} />
              追加
            </motion.button>
          </div>
          <motion.div
            className="rounded-2xl p-4"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
              backdropFilter: isOcean ? 'blur(10px)' : 'none',
            }}
          >
            {notifications.length === 0 ? (
              <div className="text-center py-8" style={{ color: currentBackground.textLight }}>
                <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">お知らせはありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 rounded-xl flex items-start gap-3"
                    style={{
                      background: isOcean ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: notification.type === 'alert' ? 'rgba(239, 68, 68, 0.2)'
                          : notification.type === 'approval' ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      {notification.type === 'alert' ? '⚠️' : notification.type === 'approval' ? '✅' : 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: currentBackground.text }}>
                        {notification.title}
                      </div>
                      <div className="text-xs truncate" style={{ color: currentBackground.textLight }}>
                        {notification.message}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                        onClick={() => openEditModal(notification)}
                      >
                        <Edit3 size={14} style={{ color: currentBackground.textLight }} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* その他 */}
        <div>
          <div className="px-1 py-2 text-[10px] font-medium uppercase tracking-widest" style={{ color: currentBackground.textLight }}>
            その他
          </div>
          <div className="space-y-2">
            <SettingItem icon={<HelpCircle size={20} />} title="ヘルプ" subtitle="使い方、FAQ" themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
            <SettingItem icon={<Info size={20} />} title="アプリ情報" subtitle="バージョン 1.0.0" themeStyle={currentBackground} isOcean={isOcean} isLightTheme={isLightTheme} currentTheme={currentTheme} />
          </div>
        </div>

        {/* ログアウト */}
        <motion.button
          className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
        >
          <LogOut size={20} />
          ログアウト
        </motion.button>
      </div>

      {/* お知らせ追加/編集モーダル */}
      {showNotificationModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNotificationModal(false)}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: isOcean ? 'rgba(30, 80, 90, 0.95)' : isLightTheme ? '#fff' : 'rgba(50,50,50,0.98)',
              border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBackground.text }}>
              {editingNotification ? 'お知らせを編集' : '新しいお知らせ'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>
                  タイトル
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    color: currentBackground.text,
                  }}
                  placeholder="お知らせのタイトル"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>
                  内容
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  rows={3}
                  style={{
                    background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                    color: currentBackground.text,
                  }}
                  placeholder="お知らせの内容"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>
                  タイプ
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'info', label: 'お知らせ', emoji: 'ℹ️' },
                    { value: 'alert', label: '警告', emoji: '⚠️' },
                    { value: 'approval', label: '承認', emoji: '✅' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors`}
                      style={{
                        background: notificationForm.type === type.value ? `${currentTheme.primary}20` : 'rgba(100,100,100,0.1)',
                        border: notificationForm.type === type.value ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
                        color: currentBackground.text,
                      }}
                      onClick={() => setNotificationForm({ ...notificationForm, type: type.value })}
                    >
                      {type.emoji} {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'rgba(100,100,100,0.1)',
                  color: currentBackground.textLight,
                }}
                onClick={() => setShowNotificationModal(false)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: currentTheme.primary }}
                onClick={handleSaveNotification}
                disabled={!notificationForm.title || !notificationForm.message}
              >
                {editingNotification ? '更新' : '追加'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function SettingItem({ icon, title, subtitle, onClick, themeStyle, isOcean, isLightTheme, currentTheme }) {
  return (
    <motion.div
      className="rounded-xl p-4 flex items-center gap-3 cursor-pointer"
      style={{
        background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
        border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
        backdropFilter: isOcean ? 'blur(10px)' : 'none',
      }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{ backgroundColor: currentTheme?.primary || '#FF6B00' }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: themeStyle?.text }}>{title}</div>
        {subtitle && <div className="text-xs" style={{ color: themeStyle?.textLight }}>{subtitle}</div>}
      </div>
      <ChevronRight size={20} style={{ color: themeStyle?.textLight }} />
    </motion.div>
  )
}

// プレースホルダーページ
function PlaceholderPage({ title, icon }) {
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  return (
    <div className="min-h-screen pb-20" style={{ background: currentBg.bg }}>
      <PageHeader title={title} icon={icon} />
      <div className="p-4 text-center text-gray-400 mt-20">
        <div className="text-4xl mb-4">{icon}</div>
        <div>{title}ページは準備中です</div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const navigate = useNavigate()
  const { getCurrentTheme, getCurrentBackground, backgroundId } = useThemeStore()
  const { token, user: authUser } = useAuthStore()
  const currentTheme = getCurrentTheme()
  const currentBackground = getCurrentBackground()
  const isOcean = currentBackground?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // State
  const [workers, setWorkers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingWorker, setEditingWorker] = useState(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [accountWorker, setAccountWorker] = useState(null)
  const [accountForm, setAccountForm] = useState({ username: '', password: '', role: 'employee' })

  // LINE WORKS Import
  const fileInputRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const [formData, setFormData] = useState({
    name: '', department: '', position: '', team: '', employment_type: '社員',
    phone: '', email: '', lineworks_id: '', daily_rate: '', is_field_worker: false, is_active: true
  })

  const roles = [
    { value: 'admin', label: '管理者', color: '#EF4444' },
    { value: 'employee', label: '社員', color: '#3B82F6' },
    { value: 'subcontractor', label: '下請', color: '#10B981' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [workersRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/workers/`),
        fetch(`${API_BASE}/users/`)
      ])
      if (workersRes.ok) setWorkers(await workersRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
    } catch (e) {
      console.error('Failed to fetch:', e)
    } finally {
      setLoading(false)
    }
  }

  // LINE WORKS インポート
  const handleImportFile = async (event) => {
    const file = event.target.files[0]
    if (!file || !token) return

    setImporting(true)
    setImportResult(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/workers/import-lineworks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ success: true, imported: data.imported, updated: data.updated, errors: data.errors })
        fetchData()
      } else {
        setImportResult({ success: false, error: data.detail || 'インポート失敗' })
      }
    } catch (e) {
      setImportResult({ success: false, error: e.message })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 社員保存
  const handleSaveWorker = async () => {
    if (!formData.name) { alert('名前を入力してください'); return }
    try {
      const url = editingWorker ? `${API_BASE}/workers/${editingWorker.id}` : `${API_BASE}/workers/`
      const method = editingWorker ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...formData, daily_rate: formData.daily_rate ? parseInt(formData.daily_rate) : null })
      })
      if (res.ok) { fetchData(); closeModal() }
      else alert('保存に失敗しました')
    } catch (e) { alert('エラーが発生しました') }
  }

  // 社員削除
  const handleDeleteWorker = async (id) => {
    if (!confirm('この社員を削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) fetchData()
    } catch (e) { console.error(e) }
  }

  // S-BASEアカウント作成
  const openAccountModal = (worker) => {
    setAccountWorker(worker)
    setAccountForm({
      username: worker.name.replace(/\s+/g, '').toLowerCase(),
      password: '',
      role: 'employee'
    })
    setShowAccountModal(true)
  }

  const handleCreateAccount = async () => {
    if (!accountForm.username || !accountForm.password) {
      alert('ユーザー名とパスワードを入力してください')
      return
    }
    if (accountForm.password.length < 8) {
      alert('パスワードは8文字以上で入力してください')
      return
    }
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: accountForm.username,
          password: accountForm.password,
          display_name: accountWorker.name,
          email: accountWorker.email || `${accountForm.username}@sbase.local`,
          role: accountForm.role,
          department: accountWorker.department || '',
          worker_id: accountWorker.id
        })
      })
      if (res.ok) {
        alert('アカウントを作成しました')
        fetchData()
        setShowAccountModal(false)
      } else {
        const err = await res.json()
        alert(err.detail || '作成に失敗しました')
      }
    } catch (e) { alert('エラーが発生しました') }
  }

  const openAddModal = () => {
    setEditingWorker(null)
    setFormData({ name: '', department: '', position: '', team: '', employment_type: '社員', phone: '', email: '', lineworks_id: '', daily_rate: '', is_field_worker: false, is_active: true })
    setShowModal(true)
  }

  const openEditModal = (worker) => {
    setEditingWorker(worker)
    setFormData({
      name: worker.name || '', department: worker.department || '', position: worker.position || '',
      team: worker.team || '', employment_type: worker.employment_type || '社員',
      phone: worker.phone || '', email: worker.email || '', lineworks_id: worker.lineworks_id || '',
      daily_rate: worker.daily_rate || '', is_field_worker: worker.is_field_worker || false,
      is_active: worker.is_active !== false
    })
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingWorker(null) }

  // フィルタリング
  const departments = [...new Set(workers.map(w => w.department).filter(Boolean))]
  const filteredWorkers = workers.filter(w => {
    if (filter && !w.name?.includes(filter) && !w.department?.includes(filter) && !w.position?.includes(filter)) return false
    if (deptFilter !== 'all' && w.department !== deptFilter) return false
    return w.is_active !== false
  })

  // ユーザーマップ（worker_id -> user）
  const userMap = users.reduce((acc, u) => { if (u.worker_id) acc[u.worker_id] = u; return acc }, {})
  const getRoleInfo = (role) => roles.find(r => r.value === role) || roles[1]

  const inputStyle = {
    background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
    color: currentBackground.text,
  }
  const cardStyle = {
    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBackground.bg }}>
        <div style={{ color: currentBackground.textLight }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBackground.bg }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: currentBackground.headerBg, borderBottom: `1px solid ${currentBackground.border}` }}>
        <div className="flex items-center gap-3 px-5 py-4">
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }}
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }} />
          </motion.button>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Users size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: currentBackground.text }}>ユーザー管理</h2>
            <p className="text-xs" style={{ color: currentBackground.textLight }}>{filteredWorkers.length}名の社員</p>
          </div>
          <motion.button
            className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1"
            style={{ backgroundColor: currentTheme.primary }}
            onClick={openAddModal}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={14} /> 追加
          </motion.button>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        {/* 検索・フィルター */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: currentBackground.text }} />
            <input
              type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="名前・部署・役職で検索..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm" style={inputStyle}>
            <option value="all">全部署</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* 集計カード */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={cardStyle}>
            <div className="text-2xl font-bold text-indigo-400">{workers.filter(w => w.is_active !== false).length}</div>
            <div className="text-xs" style={{ color: currentBackground.textLight }}>全社員</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={cardStyle}>
            <div className="text-2xl font-bold text-emerald-400">{workers.filter(w => w.is_field_worker && w.is_active !== false).length}</div>
            <div className="text-xs" style={{ color: currentBackground.textLight }}>現場作業員</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={cardStyle}>
            <div className="text-2xl font-bold text-blue-400">{users.length}</div>
            <div className="text-xs" style={{ color: currentBackground.textLight }}>ログイン可</div>
          </div>
        </div>

        {/* LINE WORKSインポート（管理者のみ） */}
        {authUser?.role === 'admin' && (
          <div className="rounded-xl p-4" style={cardStyle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Upload size={20} className="text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: currentBackground.text }}>LINE WORKSインポート</div>
                  <div className="text-xs" style={{ color: currentBackground.textLight }}>CSVから社員を一括登録</div>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white"
                style={{ background: 'linear-gradient(135deg, #00C73C, #00B136)', opacity: importing ? 0.7 : 1 }}
              >
                <Upload size={16} />
                {importing ? 'インポート中...' : 'CSV選択'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportFile} className="hidden" />

            <AnimatePresence>
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 rounded-xl"
                  style={{ background: importResult.success ? '#10b98120' : '#ef444420' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? <CheckCircle size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
                    <span className={`text-sm font-medium ${importResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {importResult.success ? 'インポート完了' : 'インポート失敗'}
                    </span>
                  </div>
                  {importResult.success ? (
                    <div className="text-xs space-y-1" style={{ color: currentBackground.text }}>
                      <p>新規登録: {importResult.imported}名</p>
                      <p>更新: {importResult.updated}名</p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-400">{importResult.error}</p>
                  )}
                  <button onClick={() => setImportResult(null)} className="mt-2 text-xs underline" style={{ color: currentBackground.textLight }}>閉じる</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 社員リスト */}
        <div className="text-sm font-bold" style={{ color: currentBackground.text }}>社員一覧</div>
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ ...cardStyle, color: currentBackground.textLight }}>
            <User size={32} className="mx-auto mb-2 opacity-50" />
            <p>社員がいません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWorkers.map((worker) => {
              const linkedUser = userMap[worker.id]
              const roleInfo = linkedUser ? getRoleInfo(linkedUser.role) : null
              return (
                <motion.div key={worker.id} className="rounded-xl p-3" style={cardStyle}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${worker.is_field_worker ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                      {worker.is_field_worker ? '👷' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium" style={{ color: currentBackground.text }}>{worker.name}</span>
                        {worker.position && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">{worker.position}</span>
                        )}
                        {worker.is_field_worker && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                            <HardHat size={10} /> 現場
                          </span>
                        )}
                        {linkedUser && roleInfo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: `${roleInfo.color}20`, color: roleInfo.color }}>
                            {roleInfo.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: currentBackground.textLight }}>
                        {worker.department || '未配属'} / {worker.employment_type || '社員'}
                      </div>
                      {worker.lineworks_id && (
                        <div className="text-[10px] mt-0.5" style={{ color: currentBackground.textLight }}>
                          <span className="text-green-500">●</span> LINE WORKS連携済
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!linkedUser && (
                        <button
                          onClick={() => openAccountModal(worker)}
                          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                          title="S-BASEアカウント作成"
                        >
                          <Key size={16} className="text-blue-400" />
                        </button>
                      )}
                      <button onClick={() => openEditModal(worker)} className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors">
                        <Edit3 size={16} style={{ color: currentBackground.textLight }} />
                      </button>
                      <button onClick={() => handleDeleteWorker(worker.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* 社員追加/編集モーダル */}
      {showModal && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={closeModal}>
          <motion.div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: isOcean ? 'rgba(30, 80, 90, 0.95)' : isLightTheme ? '#fff' : 'rgba(50,50,50,0.98)', border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBackground.text }}>
              {editingWorker ? '社員を編集' : '新しい社員'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>名前 *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="田中太郎" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>部署</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="工務部" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>役職</label>
                  <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="課長" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>班</label>
                  <select value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                    <option value="">選択してください</option>
                    <option value="舗装班">舗装班</option>
                    <option value="高速班">高速班</option>
                    <option value="土木班">土木班</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>雇用形態</label>
                  <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                    <option value="社員">社員</option>
                    <option value="契約">契約</option>
                    <option value="外注">外注</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>電話番号</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="090-1234-5678" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>メール</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="tanaka@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>LINE WORKS ID</label>
                <input type="text" value={formData.lineworks_id} onChange={(e) => setFormData({ ...formData, lineworks_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="LINE WORKS連携用" />
              </div>
              <div className="flex items-center gap-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_field_worker}
                    onChange={(e) => setFormData({ ...formData, is_field_worker: e.target.checked })}
                    className="w-5 h-5 rounded accent-emerald-500" />
                  <span className="text-sm flex items-center gap-1" style={{ color: currentBackground.text }}>
                    <HardHat size={16} className="text-emerald-500" /> 現場作業員
                  </span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(100,100,100,0.1)', color: currentBackground.textLight }} onClick={closeModal}>
                キャンセル
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: currentTheme.primary }} onClick={handleSaveWorker}>
                {editingWorker ? '更新' : '追加'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* S-BASEアカウント作成モーダル */}
      {showAccountModal && accountWorker && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAccountModal(false)}>
          <motion.div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: isOcean ? 'rgba(30, 80, 90, 0.95)' : isLightTheme ? '#fff' : 'rgba(50,50,50,0.98)', border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Key size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: currentBackground.text }}>S-BASEアカウント作成</h3>
                <p className="text-xs" style={{ color: currentBackground.textLight }}>{accountWorker.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>ログインID *</label>
                <input type="text" value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>パスワード *</label>
                <input type="password" value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="8文字以上" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: currentBackground.textLight }}>ロール</label>
                <select value={accountForm.role}
                  onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(100,100,100,0.1)', color: currentBackground.textLight }}
                onClick={() => setShowAccountModal(false)}>
                キャンセル
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#3B82F6' }} onClick={handleCreateAccount}>
                アカウント作成
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export function IntegrationsPage() {
  return <PlaceholderPage title="外部連携" icon="🔗" />
}

export function ExportPage() {
  return <PlaceholderPage title="データ出力" icon="📤" />
}

export function LineWorksPage() {
  return <PlaceholderPage title="LINE WORKS連携" icon="💬" />
}

export function LineWorksSettingsPage() {
  const navigate = useNavigate()
  const { getCurrentTheme, getCurrentBackground, backgroundId } = useThemeStore()
  const { token } = useAuthStore()
  const currentTheme = getCurrentTheme()
  const currentBackground = getCurrentBackground()
  const isOcean = currentBackground?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [settings, setSettings] = useState({
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    domain_id: '',
    service_account: '',
    private_key: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/lineworks/settings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setSettings({
          client_id: data.client_id || '',
          client_secret: data.client_secret ? '********' : '',
          redirect_uri: data.redirect_uri || `${window.location.origin}/login`,
          domain_id: data.domain_id || '',
          service_account: data.service_account || '',
          private_key: data.has_private_key ? '********' : '',
        })
      }
    } catch (e) {
      console.error('Failed to fetch LINE WORKS settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setTestResult(null)
    try {
      // パスワードフィールドが********のままなら送信しない
      const payload = { ...settings }
      if (payload.client_secret === '********') delete payload.client_secret
      if (payload.private_key === '********') delete payload.private_key

      const res = await fetch(`${API_BASE}/lineworks/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        alert('保存しました')
        fetchSettings()
      } else {
        const err = await res.json()
        alert(err.detail || '保存に失敗しました')
      }
    } catch (e) {
      console.error('Failed to save:', e)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${API_BASE}/lineworks/test-connection`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      setTestResult({
        success: res.ok,
        message: data.message || (res.ok ? '接続成功' : data.detail || '接続失敗')
      })
    } catch (e) {
      setTestResult({ success: false, message: '接続テストに失敗しました' })
    } finally {
      setTesting(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const inputStyle = {
    background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
    color: currentBackground.text,
  }

  const cardStyle = {
    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBackground.bg }}>
        <div className="text-center" style={{ color: currentBackground.textLight }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBackground.bg }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: currentBackground.headerBg, borderBottom: `1px solid ${currentBackground.border}` }}>
        <div className="flex items-center gap-3.5 px-6 py-4">
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }}
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} strokeWidth={1.5} style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }} />
          </motion.button>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#00C300' }}>
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <div>
            <h2 className="text-lg font-medium tracking-wide" style={{ color: currentBackground.text }}>LINE WORKS設定</h2>
            <p className="text-xs mt-0.5" style={{ color: currentBackground.textLight }}>OAuth認証・API連携</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 説明 */}
        <div className="rounded-2xl p-4" style={{ ...cardStyle, background: isOcean ? 'rgba(0,195,0,0.15)' : 'rgba(0,195,0,0.1)' }}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-medium text-sm mb-1" style={{ color: currentBackground.text }}>LINE WORKS連携について</div>
              <div className="text-xs leading-relaxed" style={{ color: currentBackground.textLight }}>
                LINE WORKSでログインするには、LINE WORKS Developer Consoleでアプリを作成し、以下の情報を設定してください。
                <br />
                <a href="https://developers.worksmobile.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  LINE WORKS Developer Console
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* OAuth設定 */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: currentBackground.text }}>OAuth 2.0設定</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Client ID</label>
              <input
                type="text"
                value={settings.client_id}
                onChange={e => handleChange('client_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={inputStyle}
                placeholder="LINE WORKS App Client ID"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Client Secret</label>
              <input
                type="password"
                value={settings.client_secret}
                onChange={e => handleChange('client_secret', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={inputStyle}
                placeholder="LINE WORKS App Client Secret"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Redirect URI</label>
              <input
                type="text"
                value={settings.redirect_uri}
                onChange={e => handleChange('redirect_uri', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={inputStyle}
                placeholder={`${window.location.origin}/login`}
              />
              <p className="text-[10px] mt-1" style={{ color: currentBackground.textLight }}>
                LINE WORKS Developer Consoleの「Redirect URI」にも同じ値を登録してください
              </p>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Domain ID</label>
              <input
                type="text"
                value={settings.domain_id}
                onChange={e => handleChange('domain_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={inputStyle}
                placeholder="LINE WORKS Domain ID"
              />
            </div>
          </div>
        </div>

        {/* Service Account設定 */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: currentBackground.text }}>Service Account設定（オプション）</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Service Account</label>
              <input
                type="text"
                value={settings.service_account}
                onChange={e => handleChange('service_account', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={inputStyle}
                placeholder="xxxxx.serviceaccount@xxx"
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>Private Key</label>
              <textarea
                value={settings.private_key}
                onChange={e => handleChange('private_key', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none"
                rows={4}
                style={inputStyle}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
            </div>
          </div>
        </div>

        {/* 接続テスト結果 */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{
              ...cardStyle,
              background: testResult.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <AlertCircle size={20} className="text-red-500" />
              )}
              <span className={`font-medium ${testResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                {testResult.message}
              </span>
            </div>
          </motion.div>
        )}

        {/* ボタン */}
        <div className="flex gap-3">
          <motion.button
            className="flex-1 py-3 rounded-xl font-medium"
            style={{
              background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: currentBackground.text,
              border: `1px solid ${currentBackground.border}`,
            }}
            onClick={handleTest}
            disabled={testing || !settings.client_id}
            whileTap={{ scale: 0.98 }}
          >
            {testing ? '接続テスト中...' : '接続テスト'}
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-xl font-medium text-white"
            style={{ backgroundColor: currentTheme.primary }}
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? '保存中...' : '保存する'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export function CompanySettingsPage() {
  const navigate = useNavigate()
  const { getCurrentTheme, getCurrentBackground, backgroundId } = useThemeStore()
  const currentTheme = getCurrentTheme()
  const currentBackground = getCurrentBackground()
  const isOcean = currentBackground?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  const [settings, setSettings] = useState({
    company_name: '',
    postal_code: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    invoice_number: '',
    bank_name: '',
    bank_branch: '',
    account_type: '普通',
    account_number: '',
    account_name: '',
    fiscal_year_start: 4,
    annual_target: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/company-settings/`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (e) {
      console.error('Failed to fetch company settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/company-settings/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        alert('保存しました')
      }
    } catch (e) {
      console.error('Failed to save:', e)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const inputStyle = {
    background: isOcean ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
    color: currentBackground.text,
  }

  const cardStyle = {
    background: isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isOcean ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
    backdropFilter: isOcean ? 'blur(10px)' : 'none',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentBackground.bg }}>
        <div className="text-center" style={{ color: currentBackground.textLight }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBackground.bg }}>
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: currentBackground.headerBg, borderBottom: `1px solid ${currentBackground.border}` }}>
        <div className="flex items-center gap-3.5 px-6 py-4">
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: isOcean ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }}
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={20} strokeWidth={1.5} style={{ color: isLightTheme ? '#666' : 'rgba(255,255,255,0.9)' }} />
          </motion.button>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: isOcean ? 'rgba(255,255,255,0.2)' : `linear-gradient(145deg, ${currentTheme.primary}, ${currentTheme.primary}dd)` }}>
            🏢
          </div>
          <div>
            <h2 className="text-lg font-medium tracking-wide" style={{ color: currentBackground.text }}>会社設定</h2>
            <p className="text-xs mt-0.5" style={{ color: currentBackground.textLight }}>会社情報・銀行口座</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 会社情報 */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: currentBackground.text }}>会社情報</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>会社名</label>
              <input type="text" value={settings.company_name || ''} onChange={e => handleChange('company_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="株式会社サンユウテック" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>郵便番号</label>
                <input type="text" value={settings.postal_code || ''} onChange={e => handleChange('postal_code', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="000-0000" />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>電話番号</label>
                <input type="text" value={settings.phone || ''} onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="000-000-0000" />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>住所</label>
              <input type="text" value={settings.address || ''} onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="福岡県..." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>FAX</label>
                <input type="text" value={settings.fax || ''} onChange={e => handleChange('fax', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="000-000-0000" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>メール</label>
                <input type="email" value={settings.email || ''} onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="info@example.com" />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>適格請求書発行事業者登録番号</label>
              <input type="text" value={settings.invoice_number || ''} onChange={e => handleChange('invoice_number', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="T0000000000000" />
            </div>
          </div>
        </div>

        {/* 銀行口座 */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: currentBackground.text }}>振込先口座</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>銀行名</label>
                <input type="text" value={settings.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="〇〇銀行" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>支店名</label>
                <input type="text" value={settings.bank_branch || ''} onChange={e => handleChange('bank_branch', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="〇〇支店" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>口座種別</label>
                <select value={settings.account_type || '普通'} onChange={e => handleChange('account_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>口座番号</label>
                <input type="text" value={settings.account_number || ''} onChange={e => handleChange('account_number', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="0000000" />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>口座名義</label>
              <input type="text" value={settings.account_name || ''} onChange={e => handleChange('account_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="カ）サンユウテック" />
            </div>
          </div>
        </div>

        {/* 経営設定 */}
        <div className="rounded-2xl p-4" style={cardStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: currentBackground.text }}>経営設定</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>期首月</label>
                <select value={settings.fiscal_year_start || 4} onChange={e => handleChange('fiscal_year_start', parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: currentBackground.textLight }}>年間売上目標（万円）</label>
                <input type="number" value={settings.annual_target || 0} onChange={e => handleChange('annual_target', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <motion.button
          className="w-full py-3 rounded-xl font-medium text-white"
          style={{ backgroundColor: currentTheme.primary }}
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? '保存中...' : '保存する'}
        </motion.button>
      </div>
    </div>
  )
}
