import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, User, Bell, Shield, Palette, Info, HelpCircle, LogOut, Monitor, Type } from 'lucide-react'
import { PageHeader, Card, SectionTitle } from '../components/common'
import { useThemeStore, themeColors, backgroundStyles, fontSizes, useAppStore } from '../store'

export default function SettingsPage() {
  const {
    themeId, setTheme, getCurrentTheme,
    backgroundId, setBackground, getCurrentBackground,
    fontSizeId, setFontSize, getCurrentFontSize
  } = useThemeStore()
  const { user } = useAppStore()
  const currentTheme = getCurrentTheme()
  const currentBackground = getCurrentBackground()
  const currentFontSize = getCurrentFontSize()

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg)' }}>
      <PageHeader title="設定" icon="⚙️" />

      <div className="p-4 space-y-6">
        {/* ユーザー情報 */}
        <Card className="!p-0 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-white">{user?.name || 'ユーザー'}</div>
              <div className="text-sm text-gray-400">{user?.role || '役職'} / {user?.company || '会社名'}</div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </div>
        </Card>

        {/* テーマカラー */}
        <div>
          <SectionTitle>テーマカラー</SectionTitle>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Palette size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">現在のテーマ</div>
                <div className="text-xs text-gray-400">{currentTheme.emoji} {currentTheme.name} - {currentTheme.desc}</div>
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
                  <span className="text-[10px] text-gray-400 font-medium">{theme.name}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        {/* 背景スタイル */}
        <div>
          <SectionTitle>背景スタイル</SectionTitle>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <Monitor size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">現在の背景</div>
                <div className="text-xs text-gray-400">{currentBackground.name} - {currentBackground.desc}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {backgroundStyles.map((bg) => (
                <motion.button
                  key={bg.id}
                  className="relative p-3 rounded-xl transition-colors flex items-center gap-3"
                  style={{
                    backgroundColor: backgroundId === bg.id ? `${currentTheme.primary}20` : 'var(--bg)',
                    border: backgroundId === bg.id ? `2px solid ${currentTheme.primary}` : '2px solid var(--border)'
                  }}
                  onClick={() => setBackground(bg.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-600"
                    style={{
                      background: bg.id === 'gradient'
                        ? `linear-gradient(135deg, ${currentTheme.dark}, #1c1c1e)`
                        : bg.bg
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{bg.name}</div>
                    <div className="text-[10px] text-gray-400">{bg.desc}</div>
                  </div>
                  {backgroundId === bg.id && (
                    <Check size={18} style={{ color: currentTheme.primary }} />
                  )}
                </motion.button>
              ))}
            </div>
          </Card>
        </div>

        {/* 文字サイズ */}
        <div>
          <SectionTitle>文字サイズ</SectionTitle>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Type size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">現在のサイズ</div>
                <div className="text-xs text-gray-400">{currentFontSize.name} - {currentFontSize.desc}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((size) => (
                <motion.button
                  key={size.id}
                  className="relative p-3 rounded-xl transition-colors text-center"
                  style={{
                    backgroundColor: fontSizeId === size.id ? `${currentTheme.primary}20` : 'var(--bg)',
                    border: fontSizeId === size.id ? `2px solid ${currentTheme.primary}` : '2px solid var(--border)'
                  }}
                  onClick={() => setFontSize(size.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="font-bold text-white mb-1"
                    style={{ fontSize: `${size.base}px` }}
                  >
                    Aa
                  </div>
                  <div className="text-[10px] text-gray-400">{size.name}</div>
                  {fontSizeId === size.id && (
                    <div className="absolute top-1 right-1">
                      <Check size={14} style={{ color: currentTheme.primary }} />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* プレビュー */}
            <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-light)' }}>プレビュー</div>
              <div style={{ fontSize: `${currentFontSize.base}px`, color: 'var(--text)' }}>
                サンプルテキスト - Sample Text 123
              </div>
            </div>
          </Card>
        </div>

        {/* 設定メニュー */}
        <div>
          <SectionTitle>一般設定</SectionTitle>
          <div className="space-y-2">
            <SettingItem icon={<Bell size={20} />} title="通知設定" subtitle="プッシュ通知、メール通知" />
            <SettingItem icon={<Shield size={20} />} title="プライバシー" subtitle="データ管理、セキュリティ" />
            <SettingItem icon={<User size={20} />} title="アカウント" subtitle="ログイン情報、パスワード変更" />
          </div>
        </div>

        {/* その他 */}
        <div>
          <SectionTitle>その他</SectionTitle>
          <div className="space-y-2">
            <SettingItem icon={<HelpCircle size={20} />} title="ヘルプ" subtitle="使い方、FAQ" />
            <SettingItem icon={<Info size={20} />} title="アプリ情報" subtitle="バージョン 1.0.0" />
          </div>
        </div>

        {/* ログアウト */}
        <motion.button
          className="w-full py-4 bg-red-500/10 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={20} />
          ログアウト
        </motion.button>
      </div>
    </div>
  )
}

function SettingItem({ icon, title, subtitle, onClick }) {
  return (
    <motion.div
      className="bg-[#2c2c2e] rounded-xl p-4 flex items-center gap-3 cursor-pointer border border-[#3c3c3e]"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ backgroundColor: '#3c3c3e' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{title}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
      <ChevronRight size={20} className="text-gray-500" />
    </motion.div>
  )
}

// プレースホルダーページ
function PlaceholderPage({ title, icon }) {
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg)' }}>
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
