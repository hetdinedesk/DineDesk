import { useEffect, useRef } from 'react'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', green:'#22C55E', amber:'#F59E0B', red:'#EF4444'
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'success'
  onConfirm,
  loading = false,
  children
}) {
  const overlayRef = useRef()
  const modalRef = useRef()

  useEffect(() => {
    if (!isOpen) return

    const handleKeydown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !loading) onConfirm?.()
    }

    const handleOverlayClick = (e) => {
      if (e.target === overlayRef.current) onClose()
    }

    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', handleOverlayClick)
    
    // Focus trap
    modalRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('click', handleOverlayClick)
    }
  }, [isOpen, onClose, onConfirm, loading])

  if (!isOpen) return null

  const colors = {
    danger: { bg: C.redBg, border: C.red+'40', icon: '🗑️', confirm: C.red },
    warning: { bg: C.amberBg, border: C.amber+'40', icon: '⚠️', confirm: C.amber },
    success: { bg: C.greenBg, border: C.green+'40', icon: '✅', confirm: C.green }
  }

  const style = colors[variant] || colors.danger

  return (
    <>
      <div 
        ref={overlayRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
        aria-modal="true"
        role="dialog"
      >
        <div 
          ref={modalRef}
          tabIndex={-1}
          style={{
            background: C.panel,
            border: `1px solid ${style.border}`,
            borderRadius: 12,
            width: '100%', maxWidth: 440, maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            transform: 'translateY(20px)',
            animation: 'modalSlideIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            outline: 'none'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 0',
            borderBottom: `1px solid ${C.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: style.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20, flexShrink: 0,
                marginTop: 2
              }}>
                {style.icon}
              </div>
              <div>
                <h3 style={{ 
                  margin: '0 0 8px 0', fontSize: 17, fontWeight: 700, 
                  color: C.t0, lineHeight: 1.3 
                }}>
                  {title}
                </h3>
                <p style={{ 
                  margin: 0, fontSize: 14, color: C.t1, 
                  lineHeight: 1.5 
                }}>
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {children && (
            <div style={{ padding: '0 24px 24px' }}>
              {children}
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '20px 24px 24px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex', gap: 12, justifyContent: 'flex-end'
          }}>
            <button 
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 20px', 
                background: 'transparent',
                border: `1px solid ${C.border2}`,
                borderRadius: 8,
                color: C.t2,
                fontSize: 14, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                minWidth: 90,
                opacity: loading ? 0.5 : 1
              }}
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: '9px 24px',
                background: loading ? C.card : style.confirm,
                border: `1px solid ${loading ? C.border2 : style.confirm}`,
                borderRadius: 8,
                color: '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                minWidth: 110,
                boxShadow: loading ? 'none' : `0 2px 12px ${style.confirm}40`
              }}
            >
              {loading ? '⏳' : confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
      `}</style>
    </>
  )
}

