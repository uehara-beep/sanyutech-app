import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import ja from 'date-fns/locale/ja'
import 'react-datepicker/dist/react-datepicker.css'
import { useThemeStore } from '../store'

registerLocale('ja', ja)

// ページヘッダー（テーマカラー対応）
export function PageHeader({ title, icon, onBack, rightAction }) {
  const navigate = useNavigate()
  const { getCurrentTheme } = useThemeStore()
  const theme = getCurrentTheme()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      className="text-white px-5 py-4 flex items-center gap-3 sticky top-0 z-50 shadow-lg"
      style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}
    >
      <button
        onClick={handleBack}
        className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-lg font-semibold flex-1">{icon} {title}</span>
      {rightAction && rightAction}
    </header>
  )
}

// ヘッダーボタン
export function HeaderButton({ children, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="px-3 py-2 rounded-lg bg-white/15 text-white text-sm font-medium"
    >
      {children}
    </button>
  )
}

// カード（モダンUI - テーマ対応）
export function Card({ children, className = '', onClick, padding = true, variant = 'dark' }) {
  return (
    <motion.div
      className={`rounded-xl ${padding ? 'p-4' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ backgroundColor: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : {}}
      whileHover={onClick ? { y: -2 } : {}}
    >
      {children}
    </motion.div>
  )
}

// セクションタイトル
export function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-bold mb-3 px-1" style={{ color: 'var(--text)' }}>{children}</h3>
  )
}

// タブ（モダンUI - テーマカラー対応）
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex p-1 mx-5 mb-4 rounded-xl overflow-x-auto" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
          style={activeTab === tab.id ? { backgroundColor: 'var(--primary)' } : {}}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ボタン（モダンUI - テーマカラー対応）
export function Button({ children, variant = 'primary', size = 'md', block = false, onClick, className = '' }) {
  const variants = {
    primary: 'text-white shadow-md',
    secondary: 'text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    ghost: 'bg-transparent',
  }

  const getStyle = () => {
    if (variant === 'secondary') return { backgroundColor: 'var(--border)' }
    if (variant === 'ghost') return { color: 'var(--text-light)' }
    if (variant === 'primary') return { backgroundColor: 'var(--primary)' }
    return {}
  }

  const sizes = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-sm',
    lg: 'py-4 px-6 text-base',
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`${variants[variant]} ${sizes[size]} rounded-xl font-semibold transition-colors ${block ? 'w-full' : ''} ${className}`}
      style={getStyle()}
    >
      {children}
    </motion.button>
  )
}

// ステータスバッジ
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-blue-500/20 text-blue-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20 text-amber-400',
    danger: 'bg-red-500/20 text-red-400',
    day: 'bg-amber-500/20 text-amber-400',
    night: 'bg-indigo-500/20 text-indigo-400',
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

// リストアイテム（モダンUI - テーマカラー対応）
export function ListItem({ icon, iconBg, title, subtitle, right, onClick }) {
  return (
    <motion.div
      className="rounded-xl p-3.5 flex items-center gap-3 cursor-pointer mb-2.5"
      style={{ backgroundColor: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
    >
      {icon && (
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 text-white ${iconBg || ''}`}
          style={!iconBg ? { backgroundColor: 'var(--primary)' } : {}}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
      </div>
      {right && <div className="text-right shrink-0">{right}</div>}
    </motion.div>
  )
}

// モーダル（モダンUI - ダークテーマ）
export function Modal({ isOpen, onClose, title, children, footer }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[200] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-h-[85vh] rounded-t-3xl overflow-auto shadow-xl"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text)', borderTop: '1px solid var(--border)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 sticky top-0" style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
              <button onClick={onClose} style={{ color: 'var(--text-light)' }}>
                <X size={24} />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="p-4 flex gap-3" style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// トースト（type: success, error, warning, info）
export function Toast({ message, isVisible, type = 'success', onClose }) {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-500',
      icon: null,
    },
    error: {
      bg: 'bg-red-500',
      icon: null,
    },
    warning: {
      bg: 'bg-amber-500',
      icon: null,
    },
    info: {
      bg: 'bg-blue-500',
      icon: null,
    },
  }

  const style = typeStyles[type] || typeStyles.success

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${style.bg} text-white px-6 py-3 rounded-xl text-sm font-medium z-[300] shadow-lg flex items-center gap-2`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 入力フィールド（モダンUI - テーマカラー対応）
export function Input({ label, type = 'text', value, onChange, placeholder, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl transition-colors focus:outline-none"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
        {...props}
      />
    </div>
  )
}

// セレクト（モダンUI - テーマカラー対応）
export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl appearance-none transition-colors focus:outline-none"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// テキストエリア（モダンUI - テーマカラー対応）
export function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-light)' }}>{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl resize-none transition-colors focus:outline-none"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

// 進捗バー（モダンUI - テーマカラー対応）
export function ProgressBar({ value, max = 100, color, size = 'md' }) {
  const percent = (value / max) * 100
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className={`w-full ${heights[size]} rounded-full overflow-hidden`} style={{ backgroundColor: 'var(--border)' }}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color || ''}`}
        style={{ width: `${percent}%`, backgroundColor: color ? undefined : 'var(--primary)' }}
      />
    </div>
  )
}

// 空状態（モダンUI - テーマ対応）
export function Empty({ icon = '📭', title = 'データがありません', subtitle }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-medium mb-1" style={{ color: 'var(--text)' }}>{title}</div>
      {subtitle && <div className="text-sm" style={{ color: 'var(--text-light)' }}>{subtitle}</div>}
    </div>
  )
}

// 日付ピッカー（ダークテーマ）
export function DatePickerInput({ label, value, onChange, placeholder = '日付を選択' }) {
  const selectedDate = value ? new Date(value) : null

  const handleChange = (date) => {
    if (date) {
      const formatted = date.toISOString().split('T')[0]
      onChange({ target: { value: formatted } })
    } else {
      onChange({ target: { value: '' } })
    }
  }

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          locale="ja"
          dateFormat="yyyy/MM/dd"
          placeholderText={placeholder}
          className="w-full px-4 py-3 rounded-xl pr-10"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          calendarClassName="dark-calendar"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      </div>
    </div>
  )
}

// PageHeaderのエイリアス（互換性のため）
export const Header = PageHeader

// スケルトンコンポーネントを再エクスポート
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonListItem,
  SkeletonList,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonGrid,
  SkeletonPage,
  SkeletonTable,
  SkeletonDashboard,
} from './Skeleton'
