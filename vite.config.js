import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    },
    // キャッシュ無効化設定
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    // HMR設定
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    },
    // ファイル監視設定
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  // ビルド時のキャッシュ無効化
  build: {
    // ファイル名にハッシュを含める
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  // 開発時のキャッシュ無効化
  optimizeDeps: {
    force: true,
  },
})
