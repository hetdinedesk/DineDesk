import { useState, useEffect, useRef } from 'react'
import { C } from '../theme'

// Inject content transition keyframe once
if (typeof document !== 'undefined' && !document.getElementById('section-fade-kf')) {
  const s = document.createElement('style')
  s.id = 'section-fade-kf'
  s.textContent = `
    @keyframes sectionFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(s)
}

export default function SectionShell({
  railItems,
  flyoutMap,
  activeRail,
  activeFlyout,
  onRailChange,
  onFlyoutChange,
  children,
}) {
  const [tooltip, setTooltip] = useState(null)
  const [contentKey, setContentKey] = useState(activeFlyout)
  const [fading, setFading] = useState(false)
  const prevFlyout = useRef(activeFlyout)

  useEffect(() => {
    if (activeFlyout !== prevFlyout.current) {
      prevFlyout.current = activeFlyout
      setFading(true)
      const t = setTimeout(() => {
        setContentKey(activeFlyout)
        setFading(false)
      }, 80)
      return () => clearTimeout(t)
    }
  }, [activeFlyout])

  const currentFlyout = flyoutMap[activeRail] || []
  const hasFlyout = currentFlyout.length > 0

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Icon Rail */}
      <div style={{
        width: 56,
        minWidth: 56,
        background: C.panel,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
        gap: 2,
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>
        {railItems.map(item => {
          const Icon = item.Icon
          const isActive = activeRail === item.key
          return (
            <div
              key={item.key}
              style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ key: item.key, top: rect.top + rect.height / 2, left: rect.right + 8 })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <button
                onClick={() => onRailChange(item.key)}
                title={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 44,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  gap: 0,
                  transition: 'all 0.15s',
                  background: isActive
                    ? 'linear-gradient(135deg, #FF6B2B22, #FF6B2B44)'
                    : 'transparent',
                  boxShadow: isActive ? `0 0 0 1px #FF6B2B55` : 'none',
                  color: isActive ? C.acc : C.t3,
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = C.hover
                  if (!isActive) e.currentTarget.style.color = C.t1
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                  if (!isActive) e.currentTarget.style.color = C.t3
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: '0 3px 3px 0',
                    background: C.acc,
                  }} />
                )}
                <Icon size={18} />
              </button>

              {/* Tooltip */}
              {tooltip?.key === item.key && (
                <div style={{
                  position: 'fixed',
                  left: tooltip.left,
                  top: tooltip.top,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  background: '#1A2540',
                  border: `1px solid ${C.border2}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.t0,
                  whiteSpace: 'nowrap',
                  zIndex: 9999,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                  letterSpacing: '0.02em',
                }}>
                  {item.label}
                  <span style={{
                    position: 'absolute',
                    left: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent',
                    borderRight: `5px solid ${C.border2}`,
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Fly-out Sub-panel */}
      <div style={{
        width: hasFlyout ? 192 : 0,
        minWidth: hasFlyout ? 192 : 0,
        overflow: 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        background: C.panel,
        borderRight: hasFlyout ? `1px solid ${C.border}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Section header */}
        <div style={{
          padding: '12px 14px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: C.acc,
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.acc,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {railItems.find(r => r.key === activeRail)?.label || ''}
          </span>
        </div>

        {/* Sub-items */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4, paddingBottom: 8 }}>
          {currentFlyout.map(item => {
            const Icon = item.Icon
            const isActive = activeFlyout === item.key
            return (
              <button
                key={item.key}
                onClick={() => onFlyoutChange(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  padding: '8px 14px 8px 16px',
                  border: 'none',
                  background: isActive ? C.active : 'transparent',
                  color: isActive ? C.t0 : C.t2,
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  borderLeft: `2px solid ${isActive ? C.acc : 'transparent'}`,
                  transition: 'background 0.12s, color 0.12s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = C.hover
                    e.currentTarget.style.color = C.t1
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = C.t2
                  }
                }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', background: C.page, position: 'relative' }}>
        <div
          key={contentKey}
          style={{
            animation: fading ? 'none' : 'sectionFadeIn 0.18s ease forwards',
            opacity: fading ? 0 : 1,
            transition: fading ? 'opacity 0.08s ease' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
