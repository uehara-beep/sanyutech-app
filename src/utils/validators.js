// Validation result type
// { valid: boolean, error?: string }

// Required field validation
export function required(value, fieldName = 'この項目') {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return { valid: false, error: `${fieldName}は必須です` }
  }
  return { valid: true }
}

// Minimum length validation
export function minLength(value, min, fieldName = 'この項目') {
  if (!value) return { valid: true } // Skip if empty (use with required)
  if (String(value).length < min) {
    return { valid: false, error: `${fieldName}は${min}文字以上で入力してください` }
  }
  return { valid: true }
}

// Maximum length validation
export function maxLength(value, max, fieldName = 'この項目') {
  if (!value) return { valid: true }
  if (String(value).length > max) {
    return { valid: false, error: `${fieldName}は${max}文字以下で入力してください` }
  }
  return { valid: true }
}

// Number validation
export function isNumber(value, fieldName = 'この項目') {
  if (value === '' || value === undefined || value === null) return { valid: true }
  if (isNaN(Number(value))) {
    return { valid: false, error: `${fieldName}は数値で入力してください` }
  }
  return { valid: true }
}

// Positive number validation
export function isPositive(value, fieldName = 'この項目') {
  if (value === '' || value === undefined || value === null) return { valid: true }
  const num = Number(value)
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: `${fieldName}は正の数で入力してください` }
  }
  return { valid: true }
}

// Non-negative number validation
export function isNonNegative(value, fieldName = 'この項目') {
  if (value === '' || value === undefined || value === null) return { valid: true }
  const num = Number(value)
  if (isNaN(num) || num < 0) {
    return { valid: false, error: `${fieldName}は0以上で入力してください` }
  }
  return { valid: true }
}

// Email validation
export function isEmail(value, fieldName = 'メールアドレス') {
  if (!value) return { valid: true }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(String(value))) {
    return { valid: false, error: `${fieldName}の形式が正しくありません` }
  }
  return { valid: true }
}

// Date validation
export function isDate(value, fieldName = '日付') {
  if (!value) return { valid: true }
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName}の形式が正しくありません` }
  }
  return { valid: true }
}

// Date range validation (start <= end)
export function isDateRange(startDate, endDate, fieldName = '期間') {
  if (!startDate || !endDate) return { valid: true }
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (start > end) {
    return { valid: false, error: `${fieldName}の開始日は終了日より前に設定してください` }
  }
  return { valid: true }
}

// Phone number validation (Japanese format)
export function isPhone(value, fieldName = '電話番号') {
  if (!value) return { valid: true }
  const phoneRegex = /^[0-9-]+$/
  if (!phoneRegex.test(String(value))) {
    return { valid: false, error: `${fieldName}の形式が正しくありません` }
  }
  return { valid: true }
}

// URL validation
export function isUrl(value, fieldName = 'URL') {
  if (!value) return { valid: true }
  try {
    new URL(value)
    return { valid: true }
  } catch {
    return { valid: false, error: `${fieldName}の形式が正しくありません` }
  }
}

// Min value validation
export function minValue(value, min, fieldName = 'この項目') {
  if (value === '' || value === undefined || value === null) return { valid: true }
  const num = Number(value)
  if (isNaN(num) || num < min) {
    return { valid: false, error: `${fieldName}は${min}以上で入力してください` }
  }
  return { valid: true }
}

// Max value validation
export function maxValue(value, max, fieldName = 'この項目') {
  if (value === '' || value === undefined || value === null) return { valid: true }
  const num = Number(value)
  if (isNaN(num) || num > max) {
    return { valid: false, error: `${fieldName}は${max}以下で入力してください` }
  }
  return { valid: true }
}

// Array minimum items validation
export function minItems(value, min, fieldName = 'この項目') {
  if (!Array.isArray(value) || value.length < min) {
    return { valid: false, error: `${fieldName}は${min}件以上必要です` }
  }
  return { valid: true }
}

// Validate multiple rules
export function validate(value, rules) {
  for (const rule of rules) {
    const result = rule(value)
    if (!result.valid) {
      return result
    }
  }
  return { valid: true }
}

// Form validation helper
export function validateForm(data, schema) {
  const errors = {}
  let isValid = true

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    for (const rule of rules) {
      const result = typeof rule === 'function' ? rule(value) : rule
      if (!result.valid) {
        errors[field] = result.error
        isValid = false
        break
      }
    }
  }

  return { isValid, errors }
}

// Create validator with custom field name
export const createValidator = (fieldName) => ({
  required: () => (value) => required(value, fieldName),
  minLength: (min) => (value) => minLength(value, min, fieldName),
  maxLength: (max) => (value) => maxLength(value, max, fieldName),
  isNumber: () => (value) => isNumber(value, fieldName),
  isPositive: () => (value) => isPositive(value, fieldName),
  isNonNegative: () => (value) => isNonNegative(value, fieldName),
  isEmail: () => (value) => isEmail(value, fieldName),
  isDate: () => (value) => isDate(value, fieldName),
  isPhone: () => (value) => isPhone(value, fieldName),
  minValue: (min) => (value) => minValue(value, min, fieldName),
  maxValue: (max) => (value) => maxValue(value, max, fieldName),
})

export default {
  required,
  minLength,
  maxLength,
  isNumber,
  isPositive,
  isNonNegative,
  isEmail,
  isDate,
  isDateRange,
  isPhone,
  isUrl,
  minValue,
  maxValue,
  minItems,
  validate,
  validateForm,
  createValidator,
}
