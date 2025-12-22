import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import ja from 'date-fns/locale/ja'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('ja', ja)

// ページヘッダー（モダンオレンジテーマ）
export function PageHeader({ title, icon, gradient = 'from-orange-500 to-orange-600', onBack, rightAction }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className={`bg-gradient-to-r ${gradient} text-white px-5 py-4 flex items-center gap-3 sticky top-0 z-50 shadow-md`}>
      <button
        onClick={handleBack}
        className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
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

// カード（モダンUI - 白背景 or 暗い背景）
export function Card({ children, className = '', onClick, padding = true, variant = 'light' }) {
  const variantStyles = {
    light: 'bg-white text-gray-800 shadow-md',
    dark: 'bg-slate-800 text-white'
  }

  return (
    <motion.div
      className={`${variantStyles[variant]} rounded-xl ${padding ? 'p-4' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
    <h3 className="text-sm font-bold text-gray-700 mb-3 px-1">{children}</h3>
  )
}

// タブ（モダンUI）
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex bg-gray-100 p-1 mx-5 mb-4 rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ボタン（モダンUI）
export function Button({ children, variant = 'primary', size = 'md', block = false, onClick, className = '' }) {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-500',
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

// リストアイテム（モダンUI）
export function ListItem({ icon, iconBg = 'bg-orange-500', title, subtitle, right, onClick }) {
  return (
    <motion.div
      className="bg-white text-gray-800 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer mb-2.5 shadow-sm"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
    >
      {icon && (
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center text-xl shrink-0 text-white`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
      </div>
      {right && <div className="text-right shrink-0">{right}</div>}
    </motion.div>
  )
}

// モーダル（モダンUI - 白背景）
export function Modal({ isOpen, onClose, title, children, footer }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-[200] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white text-gray-800 w-full max-h-[85vh] rounded-t-3xl overflow-auto shadow-xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// トースト
export function Toast({ message, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-medium z-[300] shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 入力フィールド（モダンUI）
export function Input({ label, type = 'text', value, onChange, placeholder, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
        {...props}
      />
    </div>
  )
}

// セレクト（モダンUI）
export function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 appearance-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// テキストエリア（モダンUI）
export function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-colors"
      />
    </div>
  )
}

// 進捗バー（モダンUI）
export function ProgressBar({ value, max = 100, color = 'bg-orange-500', size = 'md' }) {
  const percent = (value / max) * 100
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }
  
  return (
    <div className={`w-full ${heights[size]} bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-300`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// 空状態（モダンUI）
export function Empty({ icon = '📭', title = 'データがありません', subtitle }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-gray-700 font-medium mb-1">{title}</div>
      {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
    </div>
  )
}

// 日付ピッカー
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
      {label && <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          locale="ja"
          dateFormat="yyyy/MM/dd"
          placeholderText={placeholder}
          className="w-full px-4 py-3 bg-slate-800 border border-app-border rounded-xl text-white placeholder:text-slate-500 pr-10"
          calendarClassName="dark-calendar"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
      </div>
    </div>
  )
}

// PageHeaderのエイリアス（互換性のため）
export const Header = PageHeader
