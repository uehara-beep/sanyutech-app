import { forwardRef } from 'react'

// Form field wrapper with label and error message
export default function FormField({
  label,
  required = false,
  error,
  children,
  className = '',
  hint,
}) {
  return (
    <div className={className}>
      {label && (
        <label className="text-xs text-slate-400 mb-1.5 block">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
}

// Input component with error state
export const Input = forwardRef(function Input({
  type = 'text',
  error,
  className = '',
  prefix,
  suffix,
  ...props
}, ref) {
  const baseClasses = 'w-full bg-slate-700 rounded-lg px-4 py-3 text-sm transition-colors'
  const errorClasses = error ? 'border-2 border-red-500 focus:border-red-500' : 'border border-transparent focus:border-blue-500'

  if (prefix || suffix) {
    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
        )}
        <input
          ref={ref}
          type={type}
          className={`${baseClasses} ${errorClasses} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>
        )}
      </div>
    )
  }

  return (
    <input
      ref={ref}
      type={type}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
})

// Select component with error state
export const Select = forwardRef(function Select({
  error,
  children,
  className = '',
  placeholder,
  ...props
}, ref) {
  const baseClasses = 'w-full bg-slate-700 rounded-lg px-4 py-3 text-sm transition-colors appearance-none'
  const errorClasses = error ? 'border-2 border-red-500' : 'border border-transparent focus:border-blue-500'

  return (
    <div className="relative">
      <select
        ref={ref}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
})

// Textarea component with error state
export const Textarea = forwardRef(function Textarea({
  error,
  className = '',
  rows = 3,
  ...props
}, ref) {
  const baseClasses = 'w-full bg-slate-700 rounded-lg px-4 py-3 text-sm transition-colors resize-none'
  const errorClasses = error ? 'border-2 border-red-500' : 'border border-transparent focus:border-blue-500'

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
})

// Date input
export const DateInput = forwardRef(function DateInput({
  error,
  className = '',
  ...props
}, ref) {
  const baseClasses = 'w-full bg-slate-700 rounded-lg px-4 py-3 text-sm transition-colors'
  const errorClasses = error ? 'border-2 border-red-500' : 'border border-transparent focus:border-blue-500'

  return (
    <input
      ref={ref}
      type="date"
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
})

// Submit button with loading state
export function SubmitButton({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400',
    warning: 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
    secondary: 'bg-slate-700 hover:bg-slate-600',
  }

  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${variants[variant]} ${
        (loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>...</span>
        </span>
      ) : children}
    </button>
  )
}

// Number input with increment/decrement
export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  error,
  className = '',
  ...props
}) {
  const handleDecrement = () => {
    const newValue = Math.max(min, (parseFloat(value) || 0) - step)
    onChange?.(newValue)
  }

  const handleIncrement = () => {
    const newValue = max !== undefined
      ? Math.min(max, (parseFloat(value) || 0) + step)
      : (parseFloat(value) || 0) + step
    onChange?.(newValue)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg hover:bg-slate-600"
      >
        -
      </button>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
        error={error}
        className={`text-center ${className}`}
        min={min}
        max={max}
        step={step}
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg hover:bg-slate-600"
      >
        +
      </button>
    </div>
  )
}
