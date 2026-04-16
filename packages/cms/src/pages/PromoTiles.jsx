import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPromoTiles, createPromoTile, updatePromoTile, deletePromoTile, getPromoConfig, updatePromoConfig } from '../api/promoTiles'
import ImageUpload from '../Components/ImageUpload'
import ConfirmationModal from '../Components/ConfirmationModal'
import { C } from '../theme'

const ToggleSwitch = ({ checked, onChange, label }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`
    }}
  >
    <div style={{
      width: 36, height: 20,
      borderRadius: 10, background: checked ? C.green : C.border,
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', position: 'absolute', top: 3,
        left: checked ? 19 : 3, transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }} />
    </div>
    {label && <span style={{ fontSize: 13, color: C.t1 }}>{label}</span>}
  </div>
)

const InputField = ({ label, value, onChange, placeholder, type = 'text', required, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8
    }}>{label} {required && <span style={{ color: C.red }}>*</span>}</label>
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px', background: C.input, border: `1px solid ${C.border}`,
        borderRadius: 8, color: C.t0, fontSize: 13, outline: 'none', boxSizing: 'border-box'
      }}
    />
    {hint && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>}
  </div>
)

const btnCyan = { padding: '6px 14px', background: C.acc, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnDanger = { padding: '6px 14px', background: C.red, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }

export default function PromoTiles({ clientId }) {
  const [configModal, setConfigModal] = useState(null)
  const [tileModal, setTileModal] = useState(null)
  const [delId, setDelId] = useState(null)
  
  const { data: config = {} } = useQuery({
    queryKey: ['promo-config', clientId],
    queryFn: () => getPromoConfig(clientId)
  })
  
  const { data: tiles = [] } = useQuery({
    queryKey: ['promo-tiles', clientId],
    queryFn: () => getPromoTiles(clientId)
  })
  
  const qc = useQueryClient()

  const mUpdateConfig = useMutation({
    mutationFn: (body) => updatePromoConfig(clientId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-config', clientId] })
      setConfigModal(null)
    }
  })

  const mCreate = useMutation({
    mutationFn: (body) => createPromoTile(clientId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-tiles', clientId] })
  })
  const mUpdate = useMutation({
    mutationFn: ({ id, body }) => updatePromoTile(clientId, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-tiles', clientId] })
  })
  const mDelete = useMutation({
    mutationFn: (id) => deletePromoTile(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-tiles', clientId] })
  })

  const openConfig = () => setConfigModal({
    heading: config.heading || '',
    subheading: config.subheading || '',
    isActive: config.isActive !== false
  })

  const saveConfig = () => {
    mUpdateConfig.mutate({
      heading: configModal.heading || null,
      subheading: configModal.subheading || null,
      isActive: configModal.isActive !== false
    })
  }

  const openAddTile = () => setTileModal({
    heading: '', subheading: '', extraHeading: '', extraSubheading: '', imageUrl: '', linkUrl: '', linkLabel: '',
    isExternal: false, isActive: true, sortOrder: tiles.length
  })
  
  const openEditTile = (t) => setTileModal({ 
    ...t, 
    isExternal: t.isExternal || false
  })

  const saveTile = () => {
    if (!tileModal?.heading?.trim()) return
    const body = {
      heading: tileModal.heading || null,
      subheading: tileModal.subheading || null,
      extraHeading: tileModal.extraHeading || null,
      extraSubheading: tileModal.extraSubheading || null,
      imageUrl: tileModal.imageUrl || null,
      linkUrl: tileModal.linkUrl || null,
      linkLabel: tileModal.linkLabel || null,
      isExternal: tileModal.isExternal || false,
      isActive: tileModal.isActive !== false,
      sortOrder: tileModal.sortOrder || 0
    }
    if (tileModal.id && !String(tileModal.id).startsWith('temp')) mUpdate.mutate({ id: tileModal.id, body })
    else mCreate.mutate(body)
    setTileModal(null)
  }

  const activeTiles = tiles.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.t0 }}>Promo Tiles</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={openConfig}
            style={{
              padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.t1, fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Edit Section
          </button>
          {activeTiles.length < 6 && (
            <button
              type="button"
              onClick={openAddTile}
              style={{
                padding: '6px 14px', background: C.acc, border: 'none',
                borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              + Add Tile
            </button>
          )}
        </div>
      </div>

      <p style={{ margin: '0 0 24px', fontSize: 13, color: C.t2 }}>
        Add up to 6 promo tiles with images, headings, and links. Tiles appear on the homepage below the banner carousel.
      </p>

      {/* Section Config Display */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, color: C.t0, marginBottom: 8 }}>Section Settings</div>
        <div style={{ fontSize: 13, color: C.t2 }}>
          <div>Heading: {config.heading || '<not set>'}</div>
          <div>Subheading: {config.subheading || '<not set>'}</div>
          <div>Active: {config.isActive !== false ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Tiles Grid */}
      {activeTiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.t3, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No promo tiles yet</div>
          <div style={{ fontSize: 13 }}>Add up to 6 tiles to display on your homepage</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {activeTiles.map((t) => (
            <div
              key={t.id}
              style={{
                background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}
            >
              {t.imageUrl && (
                <img src={t.imageUrl} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              )}
              <div style={{ padding: 16, flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.t0, fontSize: 15, marginBottom: 4 }}>
                  {t.heading}
                </div>
                {t.subheading && (
                  <div style={{ fontSize: 13, color: C.t2, marginBottom: 8 }}>{t.subheading}</div>
                )}
                {t.linkLabel && (
                  <div style={{ fontSize: 12, color: C.acc, fontWeight: 600 }}>
                    → {t.linkLabel}
                  </div>
                )}
              </div>
              <div style={{ padding: 12, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <ToggleSwitch checked={t.isActive !== false} onChange={() => mUpdate.mutate({ id: t.id, body: { isActive: !t.isActive } })} />
                <button type="button" onClick={() => openEditTile(t)} style={btnCyan}>Edit</button>
                <button type="button" onClick={() => setDelId(t.id)} style={btnDanger}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config Modal */}
      {configModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.t0 }}>Edit Section</h3>
              <button onClick={() => setConfigModal(null)} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <InputField label="Section Heading" value={configModal.heading} onChange={(e) => setConfigModal({ ...configModal, heading: e.target.value })} placeholder="Special Offers" />
              <InputField label="Section Subheading" value={configModal.subheading} onChange={(e) => setConfigModal({ ...configModal, subheading: e.target.value })} placeholder="Limited time deals" />
              <div style={{ padding: 16, background: C.card, borderRadius: 8 }}>
                <ToggleSwitch checked={configModal.isActive !== false} onChange={() => setConfigModal({ ...configModal, isActive: !configModal.isActive })} label="Active" />
              </div>
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfigModal(null)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveConfig} style={{ padding: '10px 20px', background: C.acc, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Tile Modal */}
      {tileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.t0 }}>
                {tileModal.id && !String(tileModal.id).startsWith('temp') ? 'Edit Tile' : 'Add Tile'}
              </h3>
              <button onClick={() => setTileModal(null)} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <InputField label="Heading" value={tileModal.heading} onChange={(e) => setTileModal({ ...tileModal, heading: e.target.value })} placeholder="Special Offer" required />
              <InputField label="Subheading" value={tileModal.subheading} onChange={(e) => setTileModal({ ...tileModal, subheading: e.target.value })} placeholder="50% off this week" />
              <div style={{ marginBottom: 16 }}>
                <ImageUpload clientId={clientId} label="Tile Image" value={tileModal.imageUrl} onChange={(url) => setTileModal({ ...tileModal, imageUrl: url })} displayDimensions={{ width: 400, height: 300 }} />
              </div>
              <InputField label="Extra Heading" value={tileModal.extraHeading} onChange={(e) => setTileModal({ ...tileModal, extraHeading: e.target.value })} placeholder="e.g., Pricing" hint="Optional: Extra heading for additional info like pricing" />
              <InputField label="Extra Subheading" value={tileModal.extraSubheading} onChange={(e) => setTileModal({ ...tileModal, extraSubheading: e.target.value })} placeholder="e.g., $25 per person" hint="Optional: Extra subheading for additional info" />
              <InputField label="Link URL" value={tileModal.linkUrl} onChange={(e) => setTileModal({ ...tileModal, linkUrl: e.target.value })} placeholder="/menu or https://..." hint="Internal: /page-path | External: https://..." />
              <InputField label="Link Label / CTA Text" value={tileModal.linkLabel} onChange={(e) => setTileModal({ ...tileModal, linkLabel: e.target.value })} placeholder="View Deal" hint="If set, clicking CTA button. Otherwise clicking tile." />
              <div style={{ marginTop: 12 }}>
                <ToggleSwitch checked={tileModal.isExternal || false} onChange={() => setTileModal({ ...tileModal, isExternal: !tileModal.isExternal })} label="External link" />
              </div>
              <div style={{ padding: 16, background: C.card, borderRadius: 8, marginTop: 20 }}>
                <ToggleSwitch checked={tileModal.isActive !== false} onChange={() => setTileModal({ ...tileModal, isActive: !tileModal.isActive })} label="Active" />
              </div>
            </div>
            <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setTileModal(null)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.t1, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveTile} style={{ padding: '10px 20px', background: C.acc, border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!delId}
        onClose={() => setDelId(null)}
        title="Delete tile"
        message="Remove this promo tile?"
        onConfirm={() => { mDelete.mutate(delId); setDelId(null) }}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
