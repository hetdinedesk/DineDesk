import { C } from './theme'

// ─── Standard button styles ────────────────────────────────────────────────
const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  border: 'none', borderRadius: 7, fontFamily: 'inherit', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.15s', fontSize: 13,
}

export const btnPrimary = {
  ...btnBase,
  padding: '9px 22px',
  background: C.acc,
  color: '#fff',
  boxShadow: `0 4px 14px ${C.acc}40`,
}

export const btnGhost = {
  ...btnBase,
  padding: '7px 14px',
  background: 'transparent',
  color: C.t2,
  border: `1px solid ${C.border}`,
}

export const btnEdit = {
  ...btnBase,
  padding: '6px 12px',
  fontSize: 12,
  background: C.acc + '18',
  color: C.acc,
  border: `1px solid ${C.acc}35`,
}

export const btnDelete = {
  ...btnBase,
  padding: '6px 12px',
  fontSize: 12,
  background: C.red + '14',
  color: C.red,
  border: `1px solid ${C.red}35`,
}

export const btnAdd = {
  ...btnBase,
  padding: '7px 16px',
  background: C.acc,
  color: '#fff',
}

// ─── Page-level section header ─────────────────────────────────────────────
export function SectionHeader({ title, description, action }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>{title}</h2>
        {action}
      </div>
      {description && (
        <p style={{ margin: '6px 0 0', fontSize: 13, color: C.t2 }}>{description}</p>
      )}
    </div>
  )
}

// ─── Standard save row (button + "Saved!" feedback) ───────────────────────
export function SaveRow({ onSave, isPending, isSuccess, label = 'Save Changes', align = 'left' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginTop: 24,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    }}>
      <button
        onClick={onSave}
        disabled={isPending}
        style={{
          ...btnPrimary,
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: isPending ? 'none' : `0 4px 14px ${C.acc}40`,
        }}
      >
        {isPending ? 'Saving…' : label}
      </button>
      {isSuccess && (
        <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Saved!</span>
      )}
    </div>
  )
}

// ─── Standard modal footer (Cancel + Save) ────────────────────────────────
export function ModalFooter({ onCancel, onSave, saveLabel = 'Save', isPending }) {
  return (
    <div style={{
      padding: '14px 20px', borderTop: `1px solid ${C.border}`,
      display: 'flex', gap: 10, justifyContent: 'flex-end',
    }}>
      <button onClick={onCancel} style={{ ...btnGhost, padding: '9px 20px', fontSize: 13 }}>
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isPending}
        style={{
          ...btnPrimary,
          opacity: isPending ? 0.6 : 1,
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: isPending ? 'none' : `0 4px 14px ${C.acc}40`,
        }}
      >
        {isPending ? 'Saving…' : saveLabel}
      </button>
    </div>
  )
}

// ─── Empty state placeholder ───────────────────────────────────────────────
export function EmptyState({ message, hint }) {
  return (
    <div style={{
      padding: '48px 32px', textAlign: 'center', color: C.t3,
      background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{message}</div>
      {hint && <div style={{ fontSize: 12 }}>{hint}</div>}
    </div>
  )
}
