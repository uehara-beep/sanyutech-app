import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react'
import { useAuthStore, useThemeStore } from '../store'
import { API_BASE } from '../config/api'

// LINE WORKSのロゴアイコン（SVG）
const LineWorksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register, loginWithLineWorks, loading, error, clearError } = useAuthStore()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [lineWorksLoading, setLineWorksLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
  })

  // LINE WORKS OAuthコールバック処理
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (code && state === 'lineworks_oauth') {
      handleLineWorksCallback(code)
    }
  }, [searchParams])

  const handleLineWorksCallback = async (code) => {
    setLineWorksLoading(true)
    clearError()
    try {
      const result = await loginWithLineWorks(code)
      if (result.success) {
        navigate('/')
      }
    } finally {
      setLineWorksLoading(false)
    }
  }

  const handleLineWorksLogin = () => {
    // LINE WORKS OAuth認証エンドポイントにリダイレクト
    window.location.href = `${API_BASE}/auth/lineworks/authorize`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    let result
    if (mode === 'login') {
      result = await login(formData.username, formData.password)
    } else {
      result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name || formData.username,
      })
    }

    if (result.success) {
      navigate('/')
    }
  }

  // ログイン画面専用のスタイル（常にダークテーマ）
  const inputStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
  }

  const labelStyle = {
    color: 'rgba(255,255,255,0.7)',
  }

  const iconStyle = {
    color: 'rgba(255,255,255,0.5)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/backgrounds/SunyuTEC_login_bg_iphone_1170x2532.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 上部グラデーションオーバーレイ（ロゴ視認性向上） */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl p-8 relative z-10"
        style={{
          background: 'rgba(10, 21, 37, 0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo/SunyuTEC_icon_white_256.png"
            alt="SunyuTEC"
            className="w-20 h-20 mx-auto mb-4"
            style={{ borderRadius: '12px' }}
          />
          <h1 className="text-2xl font-bold text-white">
            S-BASE
          </h1>
          <p className="text-sm mt-1 text-gray-300">
            サンユウテック現場管理システム
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex mb-6 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => { setMode('login'); clearError() }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === 'login' ? '#FF6B00' : 'transparent',
              color: mode === 'login' ? 'white' : 'rgba(255,255,255,0.6)',
            }}
          >
            ログイン
          </button>
          <button
            onClick={() => { setMode('register'); clearError() }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === 'register' ? '#FF6B00' : 'transparent',
              color: mode === 'register' ? 'white' : 'rgba(255,255,255,0.6)',
            }}
          >
            新規登録
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>
              ユーザー名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={iconStyle} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="username"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ ...inputStyle, '--tw-ring-color': theme.primary }}
              />
            </div>
          </div>

          {/* Email (Register only) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium mb-2" style={labelStyle}>
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={iconStyle} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required={mode === 'register'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                  style={{ ...inputStyle, '--tw-ring-color': theme.primary }}
                />
              </div>
            </motion.div>
          )}

          {/* Display Name (Register only) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm font-medium mb-2" style={labelStyle}>
                表示名
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={iconStyle} />
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="田中 太郎"
                  className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                  style={{ ...inputStyle, '--tw-ring-color': theme.primary }}
                />
              </div>
            </motion.div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={iconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="********"
                required
                minLength={4}
                className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ ...inputStyle, '--tw-ring-color': theme.primary }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" style={iconStyle} />
                ) : (
                  <Eye className="w-5 h-5" style={iconStyle} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || lineWorksLoading}
            className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'ログイン' : '登録'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="text-sm" style={labelStyle}>または</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* LINE WORKS Button */}
        <motion.button
          type="button"
          onClick={handleLineWorksLogin}
          disabled={loading || lineWorksLoading}
          className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#00C300' }}
          whileTap={{ scale: 0.98 }}
        >
          {lineWorksLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LineWorksIcon />
              {mode === 'login' ? 'LINE WORKSでログイン' : 'LINE WORKSで登録'}
            </>
          )}
        </motion.button>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs text-center" style={labelStyle}>
            社員の方はLINE WORKSでログイン・登録してください
          </p>
        </div>
      </motion.div>
    </div>
  )
}
