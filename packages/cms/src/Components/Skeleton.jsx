import { C } from '../theme'

const shimmerStyle = {
  background: `linear-gradient(90deg, ${C.card} 25%, ${C.hover} 50%, ${C.card} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease infinite',
  borderRadius: 6,
}

// Inject the keyframe once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-kf')) {
  const style = document.createElement('style')
  style.id = 'skeleton-kf'
  style.textContent = `
    @keyframes skeleton-shimmer {
      0%   { background-position: 200% 0 }
      100% { background-position: -200% 0 }
    }
  `
  document.head.appendChild(style)
}

export function SkeletonLine({ width = '100%', height = 14, style = {} }) {
  return <div style={{ ...shimmerStyle, width, height, ...style }} />
}

export function SkeletonBlock({ height = 80, style = {} }) {
  return <div style={{ ...shimmerStyle, width: '100%', height, borderRadius: 10, ...style }} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, marginBottom: 12,
    }}>
      <SkeletonLine width="40%" height={13} style={{ marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '65%' : '100%'} height={12} style={{ marginBottom: 10 }} />
      ))}
    </div>
  )
}

export function SkeletonPage({ cards = 2 }) {
  return (
    <div style={{ maxWidth: 900, paddingTop: 4 }}>
      <SkeletonLine width="220px" height={17} style={{ marginBottom: 8 }} />
      <SkeletonLine width="340px" height={12} style={{ marginBottom: 28 }} />
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  )
}
