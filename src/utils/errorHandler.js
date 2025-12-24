// 統一エラーハンドリングユーティリティ

// エラーメッセージのマッピング
const ERROR_MESSAGES = {
  // HTTPステータスコード
  400: 'リクエストが正しくありません',
  401: 'ログインが必要です',
  403: 'アクセス権限がありません',
  404: 'データが見つかりません',
  408: 'リクエストがタイムアウトしました',
  409: 'データが競合しています',
  422: '入力内容を確認してください',
  429: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  500: 'サーバーエラーが発生しました',
  502: 'サーバーに接続できません',
  503: 'サービスが一時的に利用できません',
  504: 'サーバーが応答しません',

  // カスタムエラーコード
  NETWORK_ERROR: 'ネットワークに接続できません',
  TIMEOUT: '接続がタイムアウトしました',
  UNKNOWN: '予期せぬエラーが発生しました',
  OFFLINE: 'オフラインです。接続を確認してください',
}

// エラーの種類
export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown',
}

// エラーを分類
export function classifyError(error) {
  if (!navigator.onLine) {
    return ErrorType.NETWORK
  }

  if (error.status === 401 || error.status === 403) {
    return ErrorType.AUTH
  }

  if (error.status === 400 || error.status === 422) {
    return ErrorType.VALIDATION
  }

  if (error.status >= 500) {
    return ErrorType.SERVER
  }

  if (error.status >= 400 && error.status < 500) {
    return ErrorType.CLIENT
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return ErrorType.NETWORK
  }

  return ErrorType.UNKNOWN
}

// エラーメッセージを取得
export function getErrorMessage(error) {
  // ネットワークエラー
  if (!navigator.onLine) {
    return ERROR_MESSAGES.OFFLINE
  }

  // APIエラーレスポンスにメッセージがある場合
  if (error.data?.message) {
    return error.data.message
  }

  if (error.data?.detail) {
    return error.data.detail
  }

  // HTTPステータスコードに対応するメッセージ
  if (error.status && ERROR_MESSAGES[error.status]) {
    return ERROR_MESSAGES[error.status]
  }

  // fetch失敗の場合
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  // タイムアウト
  if (error.name === 'AbortError') {
    return ERROR_MESSAGES.TIMEOUT
  }

  // その他
  return error.message || ERROR_MESSAGES.UNKNOWN
}

// エラーをログに記録
export function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    status: error.status,
    type: classifyError(error),
    timestamp: new Date().toISOString(),
    ...context,
  }

  // 開発環境ではコンソールに出力
  if (import.meta.env.DEV) {
    console.error('Error:', errorInfo)
  }

  // TODO: 本番環境ではエラー監視サービスに送信
  // sendToErrorTracking(errorInfo)
}

// API呼び出しをラップしてエラーハンドリングを統一
export async function handleApiCall(
  apiCall,
  options = {}
) {
  const {
    onSuccess,
    onError,
    showToast = true,
    context = {},
  } = options

  try {
    const result = await apiCall()
    if (onSuccess) {
      onSuccess(result)
    }
    return { data: result, error: null }
  } catch (error) {
    logError(error, context)
    const message = getErrorMessage(error)
    const type = classifyError(error)

    if (onError) {
      onError({ error, message, type })
    }

    return { data: null, error: { raw: error, message, type } }
  }
}

// リトライ機能付きAPI呼び出し
export async function apiCallWithRetry(
  apiCall,
  options = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504],
    ...handleOptions
  } = options

  let lastError = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall()
      return { data: result, error: null }
    } catch (error) {
      lastError = error

      // リトライ対象のエラーかチェック
      const shouldRetry =
        attempt < maxRetries &&
        (retryOn.includes(error.status) ||
          error.name === 'TypeError' ||
          !navigator.onLine)

      if (shouldRetry) {
        // 指数バックオフ
        const delay = retryDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      break
    }
  }

  logError(lastError, handleOptions.context)
  const message = getErrorMessage(lastError)
  const type = classifyError(lastError)

  return { data: null, error: { raw: lastError, message, type } }
}

// デフォルトエクスポート
export default {
  classifyError,
  getErrorMessage,
  logError,
  handleApiCall,
  apiCallWithRetry,
  ErrorType,
}
