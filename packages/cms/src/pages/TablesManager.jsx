import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Armchair, Users, Clock, DollarSign, Calendar, ChevronRight, X, Edit, Check } from 'lucide-react'
import { getTables } from '../api/tables'
import { getBookings, updateBooking } from '../api/bookings'
import { C } from '../theme'

const TABLE_STATUS = {
  available: { bg: '#DCFCE7', border: '#16A34A', text: '#15803D', topBar: '#22C55E', label: 'Available' },
  occupied: { bg: '#FFF3E6', border: '#EA580C', text: '#C2410C', topBar: '#F97316', label: 'Occupied' },
  reserved: { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8', topBar: '#3B82F6', label: 'Reserved' }
}

export default function TablesManager({ clientId, selectedLocation, liveOrders }) {
  const [selectedTable, setSelectedTable] = useState(null)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', clientId, selectedLocation],
    queryFn: () => getTables(clientId, selectedLocation),
    enabled: !!selectedLocation,
    refetchInterval: 30000
  })

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', clientId, selectedLocation],
    queryFn: () => getBookings(clientId).then(data =>
      data.filter(b => !selectedLocation || b.locationId === selectedLocation)
    ),
    enabled: !!selectedLocation,
    refetchInterval: 30000
  })

  // Update booking mutation (for table reassignment)
  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, data }) => updateBooking(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
      setShowReassignModal(false)
    },
    onError: (error) => {
      console.error('[CMS] Booking update failed:', error)
      alert('Failed to update booking: ' + error.message)
    }
  })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const now = new Date()

  // Get table status
  const getTableStatus = (table) => {
    // Check if table has current booking (seated)
    const currentBooking = bookings.find(b => 
      b.tableId === table.id && 
      b.status === 'seated' && 
      b.bookingDate === todayStr
    )
    if (currentBooking) return 'occupied'

    // Check if table has future reservation today
    const futureReservation = bookings.find(b => 
      b.tableId === table.id && 
      b.status === 'confirmed' && 
      b.bookingDate === todayStr
    )
    if (futureReservation) return 'reserved'

    return 'available'
  }

  // Get orders for a specific table
  const getTableOrders = (tableId, tableNumber) => {
    return liveOrders.filter(o => o.tableNumber === tableNumber && o.status !== 'completed')
  }

  // Get future reservations for a table
  const getTableReservations = (tableId) => {
    return bookings.filter(b => 
      b.tableId === tableId && 
      b.status === 'confirmed' && 
      new Date(b.bookingDate) >= today
    ).sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
  }

  // Calculate total billing for a table
  const getTableBilling = (tableId, tableNumber) => {
    const orders = getTableOrders(tableId, tableNumber)
    return orders.reduce((sum, order) => sum + (order.total || 0), 0)
  }

  // Handle table reassignment
  const handleReassignTable = (booking, newTableId) => {
    updateBookingMutation.mutate({
      bookingId: booking.id,
      data: { tableId: newTableId }
    })
  }

  if (!selectedLocation) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
        Please select a location to view tables
      </div>
    )
  }

  if (tablesLoading || bookingsLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading tables...</div>
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', padding: 0, maxWidth: '100%' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`,
        gap: 12,
        background: C.panel
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Armchair size={15} color={C.t2} />
          <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>Tables</span>
          <span style={{ 
            fontSize: 11.5, 
            color: C.t3, 
            background: C.card, 
            border: `0.5px solid ${C.border}`, 
            padding: '2px 8px', 
            borderRadius: 20 
          }}>{tables.length} tables</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            <span style={{ fontSize: 11.5, color: C.t2 }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316' }} />
            <span style={{ fontSize: 11.5, color: C.t2 }}>Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
            <span style={{ fontSize: 11.5, color: C.t2 }}>Reserved</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
        {tables.map(table => {
          const status = getTableStatus(table)
          const statusConfig = TABLE_STATUS[status]
          const orders = getTableOrders(table.id, table.tableNumber)
          const reservations = getTableReservations(table.id)
          const billing = getTableBilling(table.id, table.tableNumber)

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              style={{
                background: C.card,
                border: `1.5px solid ${statusConfig.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.13s, transform 0.1s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Colored Top Bar */}
              <div style={{ height: '3px', width: '100%', background: statusConfig.topBar }} />

              {/* Card Header */}
              <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: C.t0, lineHeight: 1 }}>Table {table.tableNumber}</div>
                  <div style={{ fontSize: 11.5, color: C.t3, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <Users size={12} />
                    {table.capacity} seats
                  </div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '3px 8px',
                  borderRadius: 20,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  background: statusConfig.bg,
                  color: statusConfig.text
                }}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: '0.5px', background: C.border, margin: '0 12px' }} />

              {/* Card Body */}
              <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Orders */}
                {orders.length > 0 && orders.slice(0, 2).map(order => (
                  <div key={order.id} style={{
                    background: C.panel,
                    border: `0.5px solid ${C.border}`,
                    borderRadius: 7,
                    padding: '7px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: C.t0 }}>#{order.orderNumber}</span>
                      <span style={{ fontSize: 11, color: C.t3 }}>
                        {new Date(order.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.t2 }}>
                      {order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: C.t0, textAlign: 'right' }}>
                      ${(order.total || 0).toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Billing Total */}
                {billing > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    background: C.panel,
                    borderRadius: 7,
                    border: `0.5px solid ${C.border}`
                  }}>
                    <div style={{ fontSize: 11.5, color: C.t2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <DollarSign size={13} />
                      Running bill
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.t0 }}>${billing.toFixed(2)}</div>
                  </div>
                )}

                {/* Reservations */}
                {reservations.length > 0 && reservations.slice(0, 2).map(reservation => (
                  <div key={reservation.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 10px',
                    background: '#EFF6FF',
                    border: '0.5px solid #BFDBFE',
                    borderRadius: 7
                  }}>
                    <Calendar size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 500, color: '#1D4ED8' }}>
                        {reservation.customerName} · {reservation.partySize} guests
                      </div>
                      <div style={{ fontSize: 11, color: '#3B82F6' }}>
                        {new Date(reservation.bookingDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} at {reservation.bookingTime}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {orders.length === 0 && reservations.length === 0 && (
                  <div style={{
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    color: C.t3,
                    fontSize: 12,
                    textAlign: 'center'
                  }}>
                    <Armchair size={22} />
                    No orders or upcoming bookings
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && typeof document !== 'undefined' && document.body && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24
        }}>
          <div style={{
            background: C.card,
            borderRadius: 12,
            border: `0.5px solid ${C.border}`,
            width: '100%',
            maxWidth: 420,
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: `0.5px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: C.panel
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.t0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Armchair size={15} />
                Table {selectedTable.tableNumber} · {selectedTable.capacity} seats
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '3px 8px',
                  borderRadius: 20,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  background: TABLE_STATUS[getTableStatus(selectedTable)].bg,
                  color: TABLE_STATUS[getTableStatus(selectedTable)].text
                }}>
                  {TABLE_STATUS[getTableStatus(selectedTable)].label}
                </span>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: `0.5px solid ${C.border}`,
                  background: C.card,
                  color: C.t2,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Active Orders */}
              <div>
                <div style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: C.t3,
                  marginBottom: 6
                }}>Active orders</div>
                {getTableOrders(selectedTable.id, selectedTable.tableNumber).length === 0 ? (
                  <div style={{ fontSize: 12, color: C.t3, padding: '8px 0' }}>No active orders.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {getTableOrders(selectedTable.id, selectedTable.tableNumber).map(order => (
                      <div key={order.id} style={{
                        background: C.panel,
                        border: `0.5px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>#{order.orderNumber}</span>
                          <span style={{ fontSize: 12, color: C.t3 }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {order.items?.map(item => (
                          <div key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 12
                          }}>
                            <span style={{ color: C.t2 }}>{item.quantity}x {item.name}</span>
                            <span style={{ color: C.t0, fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ height: '0.5px', background: C.border, margin: '2px 0' }} />
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: C.t0
                        }}>
                          <span>Subtotal</span>
                          <span>${(order.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Billing */}
              {getTableBilling(selectedTable.id, selectedTable.tableNumber) > 0 && (
                <div style={{
                  background: C.panel,
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 13, color: C.t2, fontWeight: 500 }}>Total bill</span>
                  <span style={{ fontSize: 18, fontWeight: 500, color: C.t0 }}>
                    ${getTableBilling(selectedTable.id, selectedTable.tableNumber).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Upcoming Reservations */}
              <div>
                <div style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: C.t3,
                  marginBottom: 6
                }}>Upcoming reservations</div>
                {getTableReservations(selectedTable.id).length === 0 ? (
                  <div style={{ fontSize: 12, color: C.t3 }}>No upcoming reservations today.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {getTableReservations(selectedTable.id).map(reservation => (
                      <div key={reservation.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 10px',
                        background: '#EFF6FF',
                        border: '0.5px solid #BFDBFE',
                        borderRadius: 7
                      }}>
                        <Calendar size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 500, color: '#1D4ED8' }}>
                            {reservation.customerName} · {reservation.partySize} guests
                          </div>
                          <div style={{ fontSize: 11, color: '#3B82F6' }}>
                            {new Date(reservation.bookingDate).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} at {reservation.bookingTime}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: `0.5px solid ${C.border}`,
              display: 'flex',
              gap: 8
            }}>
              <button
                onClick={() => setSelectedTable(null)}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 500,
                  border: `0.5px solid ${C.border}`,
                  background: C.panel,
                  color: C.t0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <X size={13} />
                Close
              </button>
              {getTableOrders(selectedTable.id, selectedTable.tableNumber).length > 0 && (
                <button
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 7,
                    fontSize: 12.5,
                    fontWeight: 500,
                    border: `0.5px solid ${C.border}`,
                    background: '#E8531A',
                    borderColor: '#E8531A',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5
                  }}
                >
                  <DollarSign size={13} />
                  Print bill
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
