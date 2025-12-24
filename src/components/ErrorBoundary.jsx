import { Component } from 'react'
import { logError } from '../utils/errorHandler'

// エラーバウンダリーコンポーネント
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
      location: window.location.href,
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIが渡された場合
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのエラー画面
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">
              <span role="img" aria-label="error">!</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              エラーが発生しました
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              予期せぬエラーが発生しました。
              <br />
              問題が続く場合はサポートにお問い合わせください。
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: 'var(--primary, #FF6B00)' }}
              >
                再試行
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full py-3 rounded-xl font-medium"
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-light)' }}
              >
                ホームに戻る
              </button>
            </div>

            {/* 開発環境ではエラー詳細を表示 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-light)' }}>
                  エラー詳細
                </summary>
                <pre className="mt-2 p-2 rounded text-xs text-red-400 overflow-auto max-h-40" style={{ backgroundColor: 'var(--bg)' }}>
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
