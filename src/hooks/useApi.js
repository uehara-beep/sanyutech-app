import { useState, useCallback } from 'react'
import { API_BASE } from '../config/api'
import { handleApiCall, getErrorMessage, logError } from '../utils/errorHandler'

// API呼び出し用カスタムフック
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 汎用的なfetch呼び出し
  const fetchData = useCallback(async (endpoint, options = {}) => {
    setLoading(true)
    setError(null)

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      })

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.status = response.status
        try {
          error.data = await response.json()
        } catch {
          error.data = null
        }
        throw error
      }

      const data = await response.json()
      setLoading(false)
      return { data, error: null }
    } catch (err) {
      logError(err, { endpoint })
      const message = getErrorMessage(err)
      setError(message)
      setLoading(false)
      return { data: null, error: message }
    }
  }, [])

  // GETリクエスト
  const get = useCallback((endpoint) => {
    return fetchData(endpoint, { method: 'GET' })
  }, [fetchData])

  // POSTリクエスト
  const post = useCallback((endpoint, body) => {
    return fetchData(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }, [fetchData])

  // PUTリクエスト
  const put = useCallback((endpoint, body) => {
    return fetchData(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }, [fetchData])

  // DELETEリクエスト
  const del = useCallback((endpoint) => {
    return fetchData(endpoint, { method: 'DELETE' })
  }, [fetchData])

  // FormData POST（ファイルアップロード用）
  const postFormData = useCallback(async (endpoint, formData) => {
    setLoading(true)
    setError(null)

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.status = response.status
        throw error
      }

      const data = await response.json()
      setLoading(false)
      return { data, error: null }
    } catch (err) {
      logError(err, { endpoint })
      const message = getErrorMessage(err)
      setError(message)
      setLoading(false)
      return { data: null, error: message }
    }
  }, [])

  return {
    loading,
    error,
    get,
    post,
    put,
    del,
    postFormData,
    fetchData,
  }
}

export default useApi
