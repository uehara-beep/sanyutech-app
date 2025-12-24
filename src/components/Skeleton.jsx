import { motion } from 'framer-motion'

// 基本スケルトン
export function Skeleton({ className = '', width, height, rounded = 'rounded-xl' }) {
  return (
    <motion.div
      className={`${rounded} ${className}`}
      style={{ width, height, backgroundColor: 'var(--border)' }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// テキストスケルトン
export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  )
}

// カードスケルトン
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

// リストアイテムスケルトン
export function SkeletonListItem({ className = '' }) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 ${className}`} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <Skeleton className="w-12 h-12" rounded="rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-8 h-8" rounded="rounded-lg" />
    </div>
  )
}

// リストスケルトン
export function SkeletonList({ count = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

// アバタースケルトン
export function SkeletonAvatar({ size = 40, className = '' }) {
  return (
    <Skeleton
      className={className}
      width={size}
      height={size}
      rounded="rounded-full"
    />
  )
}

// 画像スケルトン
export function SkeletonImage({ aspectRatio = '16/9', className = '' }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <Skeleton className="absolute inset-0 w-full h-full" />
    </div>
  )
}

// グリッドスケルトン
export function SkeletonGrid({ cols = 2, count = 4, className = '' }) {
  return (
    <div
      className={`grid gap-3 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ページ全体のスケルトン
export function SkeletonPage({ className = '' }) {
  return (
    <div className={`min-h-screen ${className}`} style={{ backgroundColor: 'var(--bg)' }}>
      {/* ヘッダー */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Skeleton className="h-8 w-32" />
      </div>

      {/* コンテンツ */}
      <div className="p-4 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        {/* セクションタイトル */}
        <Skeleton className="h-6 w-20 mt-6" />

        {/* リスト */}
        <SkeletonList count={4} />
      </div>
    </div>
  )
}

// テーブルスケルトン
export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* ヘッダー */}
      <div className="flex gap-4 p-4" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* 行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 last:border-b-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-4 flex-1"
              width={colIndex === 0 ? '60%' : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ダッシュボードスケルトン
export function SkeletonDashboard({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* チャート */}
      <Skeleton className="h-48" />

      {/* リスト */}
      <Skeleton className="h-6 w-24" />
      <SkeletonList count={3} />
    </div>
  )
}

export default {
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
}
