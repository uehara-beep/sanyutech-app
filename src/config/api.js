// API設定の一元管理
// 環境変数から読み込み、デフォルト値を設定

const ENV = import.meta.env

// API Base URL
// 開発環境: Vite proxyを使用するため '/api'
// 本番環境: 環境変数 VITE_API_BASE_URL を使用
export const API_BASE = ENV.VITE_API_BASE_URL || '/api'

// 認証トークンを取得（zustand persistから）
const getAuthToken = () => {
  try {
    const stored = localStorage.getItem('sanyutech-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.token || null
    }
  } catch {
    // パースエラーは無視
  }
  return null
}

// 個別のエンドポイント
export const API_ENDPOINTS = {
  // 認証関連
  auth: {
    login: `${API_BASE}/auth/login`,
    logout: `${API_BASE}/auth/logout`,
    me: `${API_BASE}/auth/me`,
  },

  // 現場・工事関連
  sites: {
    list: `${API_BASE}/sites`,
    detail: (id) => `${API_BASE}/sites/${id}`,
    create: `${API_BASE}/sites`,
    update: (id) => `${API_BASE}/sites/${id}`,
    delete: (id) => `${API_BASE}/sites/${id}`,
  },

  // 作業員・ユーザー関連
  workers: {
    list: `${API_BASE}/workers`,
    detail: (id) => `${API_BASE}/workers/${id}`,
    attendance: `${API_BASE}/workers/attendance`,
  },

  // OCR関連
  ocr: {
    scan: `${API_BASE}/ocr/scan`,
    process: `${API_BASE}/ocr/process`,
  },

  // 経費関連
  expenses: {
    list: `${API_BASE}/expenses`,
    create: `${API_BASE}/expenses`,
    approve: (id) => `${API_BASE}/expenses/${id}/approve`,
    reject: (id) => `${API_BASE}/expenses/${id}/reject`,
  },

  // 日報関連
  reports: {
    list: `${API_BASE}/reports`,
    create: `${API_BASE}/reports`,
    detail: (id) => `${API_BASE}/reports/${id}`,
  },

  // 機材・レンタル関連
  equipment: {
    list: `${API_BASE}/equipment`,
    rentals: `${API_BASE}/equipment/rentals`,
  },

  // マスタデータ関連
  master: {
    units: `${API_BASE}/master/units`,
    materials: `${API_BASE}/master/materials`,
    companies: `${API_BASE}/master/companies`,
  },

  // 承認関連
  approvals: {
    pending: `${API_BASE}/approvals/pending`,
    approve: (id) => `${API_BASE}/approvals/${id}/approve`,
    reject: (id) => `${API_BASE}/approvals/${id}/reject`,
  },

  // 通知関連
  notifications: {
    list: `${API_BASE}/notifications`,
    markRead: (id) => `${API_BASE}/notifications/${id}/read`,
  },

  // ダッシュボード関連
  dashboard: {
    summary: `${API_BASE}/dashboard/summary`,
    stats: `${API_BASE}/dashboard/stats`,
  },
}

// デフォルトのfetchオプション
export const DEFAULT_FETCH_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
}

// API呼び出しユーティリティ（認証なし）
export async function apiFetch(endpoint, options = {}) {
  const mergedOptions = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_FETCH_OPTIONS.headers,
      ...options.headers,
    },
  }

  const response = await fetch(endpoint, mergedOptions)

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`)
    error.status = response.status
    try {
      error.data = await response.json()
    } catch {
      error.data = null
    }
    throw error
  }

  return response.json()
}

// 認証付きAPI呼び出しユーティリティ
export async function authFetch(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    ...DEFAULT_FETCH_OPTIONS.headers,
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const mergedOptions = {
    ...DEFAULT_FETCH_OPTIONS,
    ...options,
    headers,
  }

  const response = await fetch(endpoint, mergedOptions)

  // 401の場合はログアウト処理（トークン期限切れ）
  if (response.status === 401) {
    localStorage.removeItem('sanyutech-auth')
    window.location.href = '/login'
    throw new Error('認証が切れました。再ログインしてください。')
  }

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`)
    error.status = response.status
    try {
      error.data = await response.json()
    } catch {
      error.data = null
    }
    throw error
  }

  return response.json()
}

// GET リクエスト（認証なし）
export function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' })
}

// POST リクエスト（認証なし）
export function apiPost(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// PUT リクエスト（認証なし）
export function apiPut(endpoint, data) {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// DELETE リクエスト（認証なし）
export function apiDelete(endpoint) {
  return apiFetch(endpoint, { method: 'DELETE' })
}

// 認証付きGET
export function authGet(endpoint) {
  return authFetch(endpoint, { method: 'GET' })
}

// 認証付きPOST
export function authPost(endpoint, data) {
  return authFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// 認証付きPUT
export function authPut(endpoint, data) {
  return authFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// 認証付きDELETE
export function authDelete(endpoint) {
  return authFetch(endpoint, { method: 'DELETE' })
}

// FormData POST（ファイルアップロード用・認証なし）
export async function apiPostFormData(endpoint, formData) {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`)
    error.status = response.status
    throw error
  }

  return response.json()
}

// 認証付きFormData POST（ファイルアップロード用）
export async function authPostFormData(endpoint, formData) {
  const token = getAuthToken()
  const headers = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  })

  if (response.status === 401) {
    localStorage.removeItem('sanyutech-auth')
    window.location.href = '/login'
    throw new Error('認証が切れました。再ログインしてください。')
  }

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`)
    error.status = response.status
    throw error
  }

  return response.json()
}

export default {
  API_BASE,
  API_ENDPOINTS,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPostFormData,
  authFetch,
  authGet,
  authPost,
  authPut,
  authDelete,
  authPostFormData,
}
