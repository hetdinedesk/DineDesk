import React from 'react'

const LAYOUT = {
  MAX_WIDTH: 1400,
  DESKTOP_PAD: 32,
  MOBILE_PAD: 16,
}

export function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(window.matchMedia(query).matches)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) setMatches(media.matches)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function Container({ children, fullWidth = false, row = false, fill = false, rowWrap = true, height = 'auto' }) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const pad = isMobile ? LAYOUT.MOBILE_PAD : LAYOUT.DESKTOP_PAD
  const sidePadding = fullWidth ? `${pad}px` : `max(${pad}px, calc((100vw - ${LAYOUT.MAX_WIDTH}px) / 2))`
  return (
    <div
      style={{
        padding: `0 ${sidePadding}`,
        width: '100%',
        height,
        boxSizing: 'border-box',
        minWidth: 0,
        ...(fill
          ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
          : {}),
        ...(row
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: rowWrap ? 'wrap' : 'nowrap',
              ...(rowWrap ? { rowGap: 12 } : {}),
            }
          : {}),
      }}
    >
      {children}
    </div>
  )
}

export function DDLogo({ size = 32 }) {
  return <img src="/logo-icon.png" alt="" style={{ width: size, height: size }} />
}
