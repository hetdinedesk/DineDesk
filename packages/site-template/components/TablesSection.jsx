import { useState, useEffect } from 'react'
import { replaceShortcodes } from '../lib/shortcodes'

export default function TablesSection({ data={}, clientId }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const colours    = data.colours    || {}
  const shortcodes = data.shortcodes || {}
  const sc         = (text) => replaceShortcodes(text || '', shortcodes)

  const primaryCol = colours.primary  || '#C8823A'
  const bodyBg     = colours.bodyBg   || '#fff'
  const accentBg   = colours.accentBg || '#F7F2EA'
  const bodyText   = colours.bodyText || '#1A1A1A'
  const ctaBg      = colours.ctaBg    || primaryCol
  const ctaText    = colors.ctaText  || '#fff'

  useEffect(() => {
    if (!clientId) return
    
    const fetchTables = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/locations/${data.locationId}/tables`)
        if (!response.ok) throw new Error('Failed to fetch tables')
        const tablesData = await response.json()
        setTables(tablesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [clientId, data.locationId])

  const generateQRCode = async (tableId) => {
    try {
      const response = await fetch(`/api/locations/${data.locationId}/tables/${tableId}/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error('Failed to generate QR code')
      const result = await response.json()
      
      // Refresh tables to get updated QR code
      setTables(prev => prev.map(table => 
        table.id === tableId ? { ...table, qrCodeUrl: result.qrCodeUrl } : table
      ))
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  const updateTable = async (tableId, updates) => {
    try {
      const response = await fetch(`/api/locations/${data.locationId}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update table')
      const updatedTable = await response.json()
      
      setTables(prev => prev.map(table => 
        table.id === tableId ? updatedTable : table
      ))
    } catch (err) {
      console.error('Error updating table:', err)
    }
  }

  const deleteTable = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table?')) return
    
    try {
      const response = await fetch(`/api/locations/${data.locationId}/tables/${tableId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete table')
      
      setTables(prev => prev.filter(table => table.id !== tableId))
    } catch (err) {
      console.error('Error deleting table:', err)
    }
  }

  const createTable = async () => {
    const tableNumber = prompt('Enter table number:')
    if (!tableNumber) return
    
    const capacity = prompt('Enter table capacity (e.g., 4):')
    if (!capacity) return
    
    try {
      const response = await fetch(`/api/locations/${data.locationId}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber, 
          capacity: parseInt(capacity),
          autoGenerateQR: true 
        })
      })
      if (!response.ok) throw new Error('Failed to create table')
      const newTable = await response.json()
      
      setTables(prev => [...prev, newTable])
    } catch (err) {
      console.error('Error creating table:', err)
    }
  }

  if (loading) {
    return (
      <section style={{ padding:'80px 64px', background:bodyBg }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div>Loading tables...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section style={{ padding:'80px 64px', background:bodyBg }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ color: 'red' }}>Error: {error}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="tables" style={{ padding:'80px 64px', background:bodyBg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:primaryCol,
              letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>
              Table Management
            </div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:36,
              fontWeight:900, color:bodyText, margin:0 }}>
              Restaurant Tables
            </h2>
          </div>
          <button
            onClick={createTable}
            style={{
              background: ctaBg,
              color: ctaText,
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            + Add Table
          </button>
        </div>

        {tables.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, background:'#fff',
            border:'1px solid #E8E0D4', borderRadius:14 }}>
            <div style={{ fontSize:18, color:bodyText, marginBottom:8 }}>
              No tables configured yet
            </div>
            <div style={{ fontSize:14, color:'#5C5C5C' }}>
              Add your first table to enable QR code ordering
            </div>
          </div>
        ) : (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',
            gap:24 }}>
            {tables.map(table => (
              <div key={table.id}
                style={{ background:'#fff', border:'1px solid #E8E0D4',
                  borderRadius:14, overflow:'hidden',
                  boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', 
                    alignItems:'flex-start', marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:'Georgia,serif', fontSize:20,
                        fontWeight:700, color:bodyText, marginBottom:4 }}>
                        Table {table.tableNumber}
                      </div>
                      <div style={{ fontSize:13, color:'#5C5C5C' }}>
                        Capacity: {table.capacity} guests
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button
                        onClick={() => updateTable(table.id, { isActive: !table.isActive })}
                        style={{
                          background: table.isActive ? '#10B981' : '#EF4444',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        {table.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteTable(table.id)}
                        style={{
                          background: '#EF4444',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {table.qrCodeUrl ? (
                    <div style={{ textAlign:'center', marginBottom:16 }}>
                      <div style={{ fontSize:12, color:'#5C5C5C', marginBottom:8 }}>
                        QR Code for Table {table.tableNumber}
                      </div>
                      <div style={{ 
                        width: 120, 
                        height: 120, 
                        margin: '0 auto',
                        background: '#f8f8f8',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: '#666'
                      }}>
                        QR Code
                      </div>
                      <div style={{ fontSize:10, color:'#999', marginTop:4 }}>
                        {table.qrCodeUrl}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', marginBottom:16 }}>
                      <div style={{ 
                        width: 120, 
                        height: 120, 
                        margin: '0 auto',
                        background: '#f8f8f8',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#999'
                      }}>
                        No QR Code
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => generateQRCode(table.id)}
                    style={{
                      width: '100%',
                      background: ctaBg,
                      color: ctaText,
                      border: 'none',
                      padding: '10px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {table.qrCodeUrl ? 'Regenerate QR Code' : 'Generate QR Code'}
                  </button>

                  {table.booking && (
                    <div style={{ 
                      marginTop:12, 
                      padding:8, 
                      background:accentBg,
                      borderRadius:6,
                      fontSize:12,
                      color:bodyText
                    }}>
                      <div style={{ fontWeight:600, marginBottom:2 }}>
                        Current Booking:
                      </div>
                      <div>{table.booking.customerName}</div>
                      <div style={{ fontSize:11, color:'#666' }}>
                        {new Date(table.booking.bookingDate).toLocaleDateString()} at {table.booking.bookingTime}
                      </div>
                    </div>
                  )}

                  {table._count?.orders > 0 && (
                    <div style={{ 
                      marginTop:8, 
                      fontSize:11, 
                      color:'#666',
                      textAlign:'center'
                    }}>
                      {table._count.orders} order{table._count.orders !== 1 ? 's' : ''} placed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}