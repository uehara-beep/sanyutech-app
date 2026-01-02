import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, User, Bell, Shield, Palette, Info, HelpCircle, LogOut, Monitor, Type, ArrowLeft, Settings as SettingsIcon, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore, themeColors, backgroundStyles, fontSizes, useAppStore, useAuthStore, useDashboardStore, dashboardWidgets, dashboardCategories, kpiOptions } from '../store'
import { ClipboardList, HardHat, FileText, BarChart3, ChevronDown } from 'lucide-react'

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
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]
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
  return <PlaceholderPage title="ユーザー管理" icon="👥" />
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

export function CompanySettingsPage() {
  return <PlaceholderPage title="会社設定" icon="🏢" />
}
