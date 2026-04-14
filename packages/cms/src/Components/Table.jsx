import { useState, useMemo } from 'react'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
  acc:'#FF6B2B', cyan:'#00D4FF', green:'#22C55E', amber:'#F59E0B', red:'#EF4444'
}

export default function Table({ 
  title, 
  headers, 
  data = [], 
  empty = 'No items found.',
  loading,
  onDelete,
  onEdit,
  selectedKeys = [],
  onSelectionChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  actions = []
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  // Filter + search
  const filtered = useMemo(() => {
    let result = [...data]
    
    // Global search
    if (search.trim()) {
      result = result.filter(row => 
        headers.some(h => 
          String(row[h.key] || '').toLowerCase().includes(search.toLowerCase())
        )
      )
    }

    // Column sort
    if (sort.key) {
      result.sort((a, b) => {
        const aval = a[sort.key] || ''
        const bval = b[sort.key] || ''
        if (aval < bval) return sort.dir === 'asc' ? -1 : 1
        if (aval > bval) return sort.dir === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, sort])

  const allSelected = filtered.length > 0 && 
    selectedKeys.length === filtered.length && 
    filtered.every(row => selectedKeys.includes(row.id))

  const handleSort = (key) => {
    if (sort.key === key) {
      setSort({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      setSort({ key, dir: 'asc' })
    }
  }

  const bulkActions = actions.filter(a => a.bulk)

  return (
    <div style={{ background: C.card, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.t0 }}>{title}</h3>
          <span style={{ fontSize: 13, color: C.t2 }}>({filtered.length})</span>
        </div>
        
        {/* Search + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {showSearch && filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.panel, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border2}` }}>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{ background: 'transparent', border: 'none', color: C.t1, fontSize: 13, width: 180, outline: 'none' }}
              />
            </div>
          )}
          
          {bulkActions.length > 0 && selectedKeys.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {bulkActions.map(action => (
                <button key={action.key} onClick={() => action.onClick(selectedKeys)}
                  style={{ padding: '6px 12px', background: C.acc, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {action.label} ({selectedKeys.length})
                </button>
              ))}
            </div>
          )}
          
          {actions.filter(a => !a.bulk).map(action => (
            <button key={action.key} onClick={action.onClick}
              style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 6, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: 48, textAlign: 'center', color: C.t3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          Loading...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: C.t3 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{empty}</div>
          {search ? 'Try adjusting your search.' : empty}
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.panel }}>
                {headers.map((header, i) => (
                  <th key={header.key} 
                    style={{ 
                      padding: '12px 16px', 
                      textAlign: header.align || 'left', 
                      fontSize: 12, 
                      fontWeight: 700, 
                      color: C.t3, 
                      borderBottom: `1px solid ${C.border}`,
                      cursor: header.sortable !== false ? 'pointer' : 'default',
                      position: 'sticky',
                      top: 0,
                      background: C.panel,
                      zIndex: 10
                    }}
                    onClick={() => header.sortable !== false && handleSort(header.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {header.label}
                      {header.sortable !== false && sort.key === header.key && (
                        <span style={{ fontSize: 10, opacity: 0.7 }}>
                          {sort.dir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ width: 80, padding: '12px 16px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, rowIndex) => {
                const isSelected = selectedKeys.includes(row.id)
                return (
                  <tr key={row.id || rowIndex}
                    style={{ 
                      background: isSelected ? C.hover : 'transparent',
                      borderBottom: `1px solid ${C.border2}`
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = C.hover
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {headers.map(header => (
                      <td key={header.key} 
                        style={{ 
                          padding: '12px 16px', 
                          color: C.t1, 
                          fontSize: 13,
                          verticalAlign: 'middle'
                        }}
                      >
                        {header.render ? header.render(row[header.key], row) : row[header.key] || '—'}
                      </td>
                    ))}
                    <td style={{ padding: '8px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(row)}
                            style={{ 
                              width: 32, height: 32,
                              background: C.panel, 
                              border: `1px solid ${C.border2}`, 
                              borderRadius: 6, 
                              color: C.t1, 
                              cursor: 'pointer',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = C.hover
                              e.currentTarget.style.borderColor = C.border
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = C.panel
                              e.currentTarget.style.borderColor = C.border2
                            }}
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(row)}
                            style={{ 
                              width: 32, height: 32,
                              background: 'transparent', 
                              border: `1px solid ${C.red}40`, 
                              borderRadius: 6, 
                              color: C.red, 
                              cursor: 'pointer',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${C.red}15`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card view (hidden on desktop) */}
      <div className="table-mobile-cards">
        {!loading && filtered.map(row => (
          <div key={row.id} style={{ /* mobile card styles */ }}>
            {/* condensed row as card */}
          </div>
        ))}
      </div>
    </div>
  )
}

// Usage example:
/*
<Table
  title="Locations"
  headers={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' }
  ]}
  data={locations}
  onEdit={handleEdit}
  onDelete={handleDelete}
  selectedKeys={selected}
  onSelectionChange={setSelected}
/>
*/

