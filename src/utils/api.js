import { API_BASE } from '../config/api'

// Get auth token from store
const getToken = () => {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.token
    }
  } catch (e) {
    console.error('Failed to get token:', e)
  }
  return null
}

// Common headers
const getHeaders = (isFormData = false) => {
  const headers = {}
  const token = getToken()

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

// Generic API request handler
async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(options.isFormData),
        ...options.headers,
      },
    })

    // Handle non-JSON responses (like PDF/file downloads)
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('application/json')) {
      if (response.ok) {
        return { success: true, data: await response.blob() }
      }
      return { success: false, error: 'ファイルのダウンロードに失敗しました' }
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      // Handle different error formats
      const errorMessage = data.detail || data.error || data.message || getDefaultErrorMessage(response.status)
      return { success: false, error: errorMessage, status: response.status }
    }

    // Normalize response format
    if (data.success !== undefined) {
      return data
    }

    return { success: true, data }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error.message === 'Failed to fetch'
        ? 'サーバーに接続できません'
        : 'エラーが発生しました'
    }
  }
}

// Default error messages by status code
function getDefaultErrorMessage(status) {
  const messages = {
    400: '入力内容に誤りがあります',
    401: 'ログインが必要です',
    403: 'アクセス権限がありません',
    404: 'データが見つかりません',
    409: 'データが重複しています',
    422: '入力内容を確認してください',
    500: 'サーバーエラーが発生しました',
  }
  return messages[status] || 'エラーが発生しました'
}

// HTTP methods
export const api = {
  get: (endpoint, params = {}) => {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint
    return apiRequest(url, { method: 'GET' })
  },

  post: (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put: (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  patch: (endpoint, data = {}) => {
    return apiRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' })
  },

  // FormData upload (for files)
  upload: (endpoint, formData) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
  },

  // Download file (PDF, CSV, etc.)
  download: async (endpoint, filename) => {
    const result = await apiRequest(endpoint, { method: 'GET' })
    if (result.success && result.data instanceof Blob) {
      const url = window.URL.createObjectURL(result.data)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      return { success: true }
    }
    return result
  },
}

// Convenience functions for common operations
export const fetchList = (endpoint, params = {}) => api.get(endpoint, params)
export const fetchOne = (endpoint, id) => api.get(`${endpoint}/${id}`)
export const create = (endpoint, data) => api.post(endpoint, data)
export const update = (endpoint, id, data) => api.put(`${endpoint}/${id}`, data)
export const remove = (endpoint, id) => api.delete(`${endpoint}/${id}`)

export default api
