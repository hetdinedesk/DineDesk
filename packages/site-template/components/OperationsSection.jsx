import { useState, useEffect } from 'react'
import { replaceShortcodes } from '../lib/shortcodes'
import { TablesAPI } from '../lib/tables'

export default function OperationsSection({ data={}, clientId }) {
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(data.locationId || null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTable, setFilterTable] = useState('all')

  const colours    = data.colours    || {}
  const shortcodes = data.shortcodes || {}
  const sc         = (text) => replaceShortcodes(text || '', shortcodes)

  const primaryCol = colours.primary  || '#C8823A'
  const bodyBg     = colours.bodyBg   || '#fff'
  const accentBg   = colours.accentBg || '#F7F2EA'
  const bodyText   = colours.bodyText || '#1A1A1A'
  const ctaBg      = colours.ctaBg    || primaryCol
  const ctaText    = colours.ctaText  || '#fff'

  useEffect(() => {
    if (!clientId || !selectedLocation) return
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch both tables and orders in parallel
        const [tablesData, ordersData] = await Promise.all([
          TablesAPI.getTables(selectedLocation),
          fetchOrders(selectedLocation)
        ])
        
        setTables(tablesData)
        setOrders(ordersData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId, selectedLocation])

  const fetchOrders = async (locationId) => {
    const response = await fetch(`/api/clients/${clientId}/orders?locationId=${locationId}`)
    if (!response.ok) throw new Error('Failed to fetch orders')
    return response.json()
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update order status')
      
      const updatedOrder = await response.json()
      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ))
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#EF4444'
      case 'preparing': return '#F59E0B'
      case 'ready': return '#10B981'
      case 'completed': return '#6B7280'
      default: return '#9CA3AF'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'New Order'
      case 'preparing': return 'Preparing'
      case 'ready': return 'Ready for Pickup'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  const getOrderTypeIcon = (orderType) => {
    switch (orderType) {
      case 'dine_in': return '🍽️'
      case 'pickup': return '🥡'
      case 'delivery': return '🚚'
      default: return '📋'
    }
  }

  const getTableNumber = (order) => {
    if (order.orderType === 'dine_in' && order.tableId) {
      const table = tables.find(t => t.id === order.tableId)
      return table ? `Table ${table.tableNumber}` : 'Unknown Table'
    }
    return order.orderType === 'pickup' ? 'Pickup' : 'Delivery'
  }

  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'all' || order.status === filterStatus
    const tableMatch = filterTable === 'all' || order.tableId === filterTable
    return statusMatch && tableMatch
  })

  const ordersByStatus = {
    new: filteredOrders.filter(o => o.status === 'new'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    completed: filteredOrders.filter(o => o.status === 'completed')
  }

  if (loading) {
    return (
      <section style={{ padding:'80px 64px', background:bodyBg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
          <div>Loading operations data...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section style={{ padding:'80px 64px', background:bodyBg }}>
        <div style={{ maxWidth:1200, margin:'0 auto', textAlign:'center' }}>
          <div style={{ color: 'red' }}>Error: {error}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="operations" style={{ padding:'80px 64px', background:bodyBg }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:800, color:primaryCol,
            letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>
            Operations
          </div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:36,
            fontWeight:900, color:bodyText, marginBottom:16 }}>
            Order Management
          </h2>
          <p style={{ fontSize:16, color:'#666', maxWidth:600, margin:'0 auto' }}>
            Manage and track orders from your restaurant tables and online orders
          </p>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:16, marginBottom:32, flexWrap:'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding:'8px 12px',
              border:'1px solid #E8E0D4',
              borderRadius:8,
              fontSize:14,
              background:'#fff'
            }}
          >
            <option value="all">All Status</option>
            <option value="new">New Orders</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            style={{
              padding:'8px 12px',
              border:'1px solid #E8E0D4',
              borderRadius:8,
              fontSize:14,
              background:'#fff'
            }}
          >
            <option value="all">All Tables</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                Table {table.tableNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Order Status Columns */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
            <div key={status} style={{ background:'#fff', border:'1px solid #E8E0D4', borderRadius:14, overflow:'hidden' }}>
              <div style={{ 
                padding:'16px 20px', 
                background:getStatusColor(status), 
                color:'#fff',
                fontWeight:600,
                fontSize:14,
                display:'flex',
                justifyContent:'space-between',
                alignItems:'center'
              }}>
                <span>{getStatusText(status)}</span>
                <span style={{ 
                  background:'rgba(255,255,255,0.2)', 
                  padding:'4px 8px', 
                  borderRadius:12,
                  fontSize:12
                }}>
                  {statusOrders.length}
                </span>
              </div>
              
              <div style={{ maxHeight:400, overflowY:'auto' }}>
                {statusOrders.length === 0 ? (
                  <div style={{ padding:'32px 20px', textAlign:'center', color:'#999' }}>
                    No orders
                  </div>
                ) : (
                  <div style={{ padding:'12px' }}>
                    {statusOrders.map(order => (
                      <div key={order.id} style={{ 
                        padding:'16px', 
                        marginBottom:12, 
                        border:'1px solid #E8E0D4', 
                        borderRadius:8,
                        background:'#FAFAFA'
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:600, color:bodyText, marginBottom:4 }}>
                              {getOrderTypeIcon(order.orderType)} {getTableNumber(order)}
                            </div>
                            <div style={{ fontSize:12, color:'#666' }}>
                              Order #{order.orderNumber}
                            </div>
                            <div style={{ fontSize:12, color:'#666' }}>
                              {order.customerName}
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:600, color:primaryCol }}>
                              ${order.total.toFixed(2)}
                            </div>
                            <div style={{ fontSize:11, color:'#666' }}>
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ marginBottom:12 }}>
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} style={{ fontSize:12, color:'#666', marginBottom:2 }}>
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div style={{ fontSize:11, color:'#999' }}>
                              +{order.items.length - 3} more items
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display:'flex', gap:8 }}>
                          {status === 'new' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              style={{
                                flex:1,
                                padding:'6px 12px',
                                background:ctaBg,
                                color:ctaText,
                                border:'none',
                                borderRadius:6,
                                fontSize:12,
                                cursor:'pointer'
                              }}
                            >
                              Start Preparing
                            </button>
                          )}
                          
                          {status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              style={{
                                flex:1,
                                padding:'6px 12px',
                                background:'#10B981',
                                color:'#fff',
                                border:'none',
                                borderRadius:6,
                                fontSize:12,
                                cursor:'pointer'
                              }}
                            >
                              Mark Ready
                            </button>
                          )}
                          
                          {status === 'ready' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              style={{
                                flex:1,
                                padding:'6px 12px',
                                background:'#6B7280',
                                color:'#fff',
                                border:'none',
                                borderRadius:6,
                                fontSize:12,
                                cursor:'pointer'
                              }}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div style={{ 
          display:'grid', 
          gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', 
          gap:16, 
          marginTop:40 
        }}>
          <div style={{ 
            padding:'20px', 
            background:'#fff', 
            border:'1px solid #E8E0D4', 
            borderRadius:12,
            textAlign:'center'
          }}>
            <div style={{ fontSize:24, fontWeight:700, color:primaryCol }}>
              {ordersByStatus.new.length}
            </div>
            <div style={{ fontSize:14, color:'#666' }}>New Orders</div>
          </div>
          
          <div style={{ 
            padding:'20px', 
            background:'#fff', 
            border:'1px solid #E8E0D4', 
            borderRadius:12,
            textAlign:'center'
          }}>
            <div style={{ fontSize:24, fontWeight:700, color:'#F59E0B' }}>
              {ordersByStatus.preparing.length}
            </div>
            <div style={{ fontSize:14, color:'#666' }}>Preparing</div>
          </div>
          
          <div style={{ 
            padding:'20px', 
            background:'#fff', 
            border:'1px solid #E8E0D4', 
            borderRadius:12,
            textAlign:'center'
          }}>
            <div style={{ fontSize:24, fontWeight:700, color:'#10B981' }}>
              {ordersByStatus.ready.length}
            </div>
            <div style={{ fontSize:14, color:'#666' }}>Ready</div>
          </div>
          
          <div style={{ 
            padding:'20px', 
            background:'#fff', 
            border:'1px solid #E8E0D4', 
            borderRadius:12,
            textAlign:'center'
          }}>
            <div style={{ fontSize:24, fontWeight:700, color:bodyText }}>
              {filteredOrders.length}
            </div>
            <div style={{ fontSize:14, color:'#666' }}>Total Orders</div>
          </div>
        </div>
      </div>
    </section>
  )
}