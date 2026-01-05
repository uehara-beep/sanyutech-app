import { motion } from 'framer-motion'

// Base skeleton component
export function Skeleton({ className = '', animate = true }) {
  return (
    <div
      className={`bg-slate-700/50 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  )
}

// Card skeleton for list items
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 mb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          {lines > 2 && <Skeleton className="h-3 w-2/3" />}
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

// List skeleton with multiple cards
export function ListSkeleton({ count = 5, showHeader = true }) {
  return (
    <div className="px-5">
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-700/50 last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl mt-6" />
    </div>
  )
}

// Summary card skeleton
export function SummaryCardSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
      <Skeleton className="h-3 w-16 mx-auto mb-2" />
      <Skeleton className="h-6 w-24 mx-auto" />
    </div>
  )
}

// Grid of summary cards
export function SummaryGridSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-${count} gap-3 mb-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SummaryCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Filter/Tab skeleton
export function FilterSkeleton({ count = 4 }) {
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-20 rounded-xl flex-shrink-0" />
      ))}
    </div>
  )
}

// Full page loading skeleton
export function PageSkeleton({ showSummary = true, showFilter = true, listCount = 5 }) {
  return (
    <div className="pb-24">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4 pt-12">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="px-5 py-4">
        {showSummary && <SummaryGridSkeleton />}
        {showFilter && <FilterSkeleton />}
        <ListSkeleton count={listCount} />
      </div>
    </div>
  )
}

export default Skeleton
