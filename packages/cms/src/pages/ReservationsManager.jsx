import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Calendar, List, Plus, ChevronLeft, ChevronRight, Clock, Users, Armchair, Phone, Mail, FileText, Check, X, Edit } from 'lucide-react'
import { getTables } from '../api/tables'
import { getBookings, updateBookingStatus, deleteBooking, createBooking } from '../api/bookings'
import { C } from '../theme'

const STATUS_COLORS = {
  confirmed: { bg: '#E6F1FB', border: '#85B7EB', text: '#185FA5', chip: '#B5D4F4', chipText: '#0C447C' },
  pending: { bg: '#FAEEDA', border: '#EF9F27', text: '#854F0B', chip: '#FAC775', chipText: '#633806' },
  seated: { bg: '#EAF3DE', border: '#639922', text: '#3B6D11', chip: '#C0DD97', chipText: '#27500A' },
  cancelled: { bg: '#F1EFE8', border: '#5F5E5A', text: '#5F5E5A', chip: '#D3D1C7', chipText: '#444441' }
}

const TIME_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

export default function ReservationsManager({ clientId, selectedLocation, clientData }) {
  const [currentView, setCurrentView] = useState('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const queryClient = useQueryClient()

  // Fetch tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', clientId, selectedLocation],
    queryFn: () => getTables(clientId, selectedLocation),
    enabled: !!selectedLocation,
    refetchInterval: 60000
  })

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', clientId, selectedLocation],
    queryFn: () => getBookings(clientId).then(data =>
      data.filter(b => !selectedLocation || b.locationId === selectedLocation)
    ),
    enabled: !!selectedLocation,
    refetchInterval: 60000
  })

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) => updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking status update failed:', error)
      alert('Failed to update booking status: ' + error.message)
    }
  })

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId) => deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
    },
    onError: (error) => {
      console.error('[CMS] Booking deletion failed:', error)
      alert('Failed to delete booking: ' + error.message)
    }
  })

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data) => createBooking(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings', clientId, selectedLocation])
      queryClient.invalidateQueries(['tables', clientId, selectedLocation])
      setShowAddModal(false)
    },
    onError: (error) => {
      console.error('[CMS] Booking creation failed:', error)
      alert('Failed to create booking: ' + error.message)
    }
  })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const getWeekDates = (offset = 0) => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d)
      dd.setDate(d.getDate() + i)
      return dd
    })
  }

  const formatDate = (d) => d.toISOString().split('T')[0]
  const formatDay = (d) => d.toLocaleDateString('en-AU', { weekday: 'short' })
  const formatDayNum = (d) => d.getDate()
  const formatMonth = (d) => d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  const getDateOnly = (dateStr) => {
    if (!dateStr) return ''
    // Handle both ISO strings and YYYY-MM-DD formats
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const getStats = () => {
    const todaysBookings = bookings.filter(b => getDateOnly(b.bookingDate) === todayStr && b.status !== 'cancelled')
    const covers = todaysBookings.reduce((a, b) => a + (b.partySize || 0), 0)
    const pending = bookings.filter(b => b.status === 'pending').length
    const occupiedTables = new Set(todaysBookings.map(b => b.tableId)).size
    const weekDates = getWeekDates(weekOffset).map(formatDate)
    const weekBookings = bookings.filter(b => weekDates.includes(getDateOnly(b.bookingDate)) && b.status !== 'cancelled').length

    return { todays: todaysBookings.length, covers, pending, occupied: occupiedTables, week: weekBookings }
  }

  const autoAssignTable = (guests, date, time, excludeId = null) => {
    const taken = new Set(
      bookings
        .filter(b => getDateOnly(b.bookingDate) === date && b.bookingTime === time && b.status !== 'cancelled' && b.id !== excludeId)
        .map(b => b.tableId)
    )
    const suitable = tables
      .filter(t => t.capacity >= guests && t.isActive && !taken.has(t.id))
      .sort((a, b) => a.capacity - b.capacity)
    return suitable[0] || null
  }

  const handleStatusChange = (bookingId, status) => {
    updateStatusMutation.mutate({ bookingId, status })
    setShowDetailModal(false)
  }

  const handleDeleteBooking = (bookingId) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      deleteBookingMutation.mutate(bookingId)
      setShowDetailModal(false)
    }
  }

  const handleSaveBooking = (bookingData) => {
    if (modalMode === 'add') {
      createBookingMutation.mutate(bookingData)
    } else {
      // For edit, we'd need an update mutation - for now just handle add
      createBookingMutation.mutate(bookingData)
    }
  }

  if (!selectedLocation) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
        Please select a location to view reservations
      </div>
    )
  }

  if (tablesLoading || bookingsLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading reservations...</div>
  }

  const stats = getStats()
  const weekDates = getWeekDates(weekOffset)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', padding: 0, maxWidth: '100%' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={18} color={C.t2} />
          <span style={{ fontSize: 16, fontWeight: 500, color: C.t0 }}>Reservations</span>
          <span style={{ fontSize: 13, color: C.t2 }}>— {clientData?.name || 'Restaurant'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setCurrentView('calendar')}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                background: currentView === 'calendar' ? C.card : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: currentView === 'calendar' ? C.t0 : C.t2,
                fontWeight: currentView === 'calendar' ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Calendar size={14} /> Calendar
            </button>
            <button
              onClick={() => setCurrentView('list')}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                background: currentView === 'list' ? C.card : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: currentView === 'list' ? C.t0 : C.t2,
                fontWeight: currentView === 'list' ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <List size={14} /> List
            </button>
          </div>
          <button
            onClick={() => { setModalMode('add'); setShowAddModal(true) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: C.t0,
              color: C.page,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> New booking
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{ background: C.card, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>Today's bookings</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: C.t0 }}>{stats.todays}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{stats.covers} covers</div>
        </div>
        <div style={{ background: C.card, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>Tables occupied</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: C.t0 }}>{stats.occupied} / {tables.length}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>Right now</div>
        </div>
        <div style={{ background: C.card, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>Pending confirm</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: C.t0 }}>{stats.pending}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{stats.pending > 0 ? 'Needs attention' : 'All clear'}</div>
        </div>
        <div style={{ background: C.card, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>This week</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: C.t0 }}>{stats.week}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>bookings total</div>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', minHeight: 420 }}>
        {/* Left Panel */}
        <div style={{ borderRight: `1px solid ${C.border}` }}>
          {/* Calendar Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: `1px solid ${C.border}`
          }}>
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.t2
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.t0 }}>
              {formatMonth(weekDates[0])} <span style={{ fontWeight: 400, color: C.t2 }}>({formatDisplayDate(formatDate(weekDates[0]))} - {formatDisplayDate(formatDate(weekDates[6]))})</span>
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.t2
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Calendar View */}
          {currentView === 'calendar' && (
            <div style={{ overflowY: 'auto', maxHeight: 360 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.t2, padding: '6px 8px', borderRight: `1px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}></div>
                {weekDates.map(d => (
                  <div key={formatDate(d)} style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '6px 4px',
                    textAlign: 'center',
                    color: formatDate(d) === todayStr ? C.acc : C.t2,
                    borderRight: `1px solid ${C.border}`,
                    background: C.card
                  }}>
                    {formatDay(d)}<br /><strong>{formatDayNum(d)}</strong>
                  </div>
                ))}
              </div>
              {TIME_SLOTS.map(time => (
                <div key={time} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.t2, padding: '6px 8px', borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', background: C.card }}>
                    {time}
                  </div>
                  {weekDates.map(d => {
                    const dateStr = formatDate(d)
                    const dayBookings = bookings.filter(b => getDateOnly(b.bookingDate) === dateStr && b.bookingTime === time && b.status !== 'cancelled')
                    return (
                      <div
                        key={`${dateStr}-${time}`}
                        onClick={() => { setSelectedDate(dateStr); setModalMode('add'); setShowAddModal(true) }}
                        style={{
                          borderRight: `1px solid ${C.border}`,
                          padding: 2,
                          position: 'relative',
                          minHeight: 36,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.card}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {dayBookings.map(b => (
                          <div
                            key={b.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); setShowDetailModal(true) }}
                            style={{
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: 11,
                              fontWeight: 500,
                              cursor: 'pointer',
                              marginBottom: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                              background: STATUS_COLORS[b.status]?.chip || STATUS_COLORS.confirmed.chip,
                              color: STATUS_COLORS[b.status]?.chipText || STATUS_COLORS.confirmed.chipText
                            }}
                            title={`${b.customerName} — ${b.partySize} guests`}
                          >
                            {b.customerName.split(' ')[0]} ({b.partySize})
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <div style={{ padding: 16, overflowY: 'auto', maxHeight: 400 }}>
              <BookingListView 
                bookings={bookings.filter(b => weekDates.map(formatDate).includes(getDateOnly(b.bookingDate)))} 
                onBookingClick={(b) => { setSelectedBooking(b); setShowDetailModal(true) }} 
              />
            </div>
          )}

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '8px 20px',
            borderTop: `1px solid ${C.border}`,
            flexWrap: 'wrap'
          }}>
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.t2 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: colors.chip, flexShrink: 0 }} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: C.t2, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tables</h3>
          <TableGrid tables={tables} bookings={bookings} onTableClick={(table) => { setSelectedDate(todayStr); setModalMode('add'); setShowAddModal(true) }} onBookingClick={(b) => { setSelectedBooking(b); setShowDetailModal(true) }} />
          
          <h3 style={{ fontSize: 13, fontWeight: 500, color: C.t2, marginBottom: 12, marginTop: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming</h3>
          <UpcomingList bookings={bookings} onBookingClick={(b) => { setSelectedBooking(b); setShowDetailModal(true) }} />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <BookingModal
          mode={modalMode}
          booking={modalMode === 'edit' ? selectedBooking : null}
          tables={tables}
          bookings={bookings}
          timeSlots={TIME_SLOTS}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveBooking}
          autoAssignTable={autoAssignTable}
          selectedDate={selectedDate}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          tables={tables}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteBooking}
          onEdit={() => { setModalMode('edit'); setShowAddModal(true); setShowDetailModal(false) }}
        />
      )}
    </div>
  )
}

// Booking List View Component
function BookingListView({ bookings, onBookingClick }) {
  const getDateOnly = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const sorted = [...bookings].sort((a, b) => getDateOnly(a.bookingDate).localeCompare(getDateOnly(b.bookingDate)) || a.bookingTime.localeCompare(b.bookingTime))
  
  if (!sorted.length) {
    return <p style={{ color: C.t3, fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>No bookings yet</p>
  }

  let lastDate = ''
  return (
    <div>
      {sorted.map(booking => {
        const bookingDateOnly = getDateOnly(booking.bookingDate)
        const showDate = bookingDateOnly !== lastDate
        lastDate = bookingDateOnly
        const table = booking.tableId ? { tableNumber: booking.tableNumber || booking.table?.tableNumber || '?' } : null
        const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed

        return (
          <div key={booking.id}>
            {showDate && (
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: C.t2,
                padding: '8px 0',
                marginTop: showDate && lastDate !== bookingDateOnly ? '16px' : '0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {bookingDateOnly === new Date().toISOString().split('T')[0] ? 'Today' : new Date(bookingDateOnly).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            )}
            <div
              onClick={() => onBookingClick(booking)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                marginBottom: 6,
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.border}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>{booking.customerName}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: colors.bg,
                  color: colors.text,
                  textTransform: 'capitalize'
                }}>
                  {booking.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.t2 }}>
                <Clock size={13} /> {booking.bookingTime}
                <Users size={13} /> {booking.partySize} guests
                <Armchair size={13} /> {table ? `Table ${table.tableNumber}` : '—'}
              </div>
              {booking.notes && (
                <div style={{ fontSize: 11, color: C.t3, marginTop: 4, fontStyle: 'italic' }}>
                  "{booking.notes}"
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Table Grid Component
function TableGrid({ tables, bookings, onTableClick, onBookingClick }) {
  const getDateOnly = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => getDateOnly(b.bookingDate) === todayStr && b.status !== 'cancelled')
  const occupiedIds = new Set(todayBookings.map(b => b.tableId))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
      {tables.map(table => {
        const occupied = occupiedIds.has(table.id)
        const booking = todayBookings.find(b => b.tableId === table.id)
        const colors = occupied ? STATUS_COLORS.confirmed : { bg: 'transparent', border: C.border }

        return (
          <div
            key={table.id}
            onClick={() => booking ? onBookingClick(booking) : onTableClick(table)}
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '8px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: occupied ? colors.bg : C.page
            }}
            title={`${table.name || `Table ${table.tableNumber}`} — ${table.capacity} seats${booking ? ` — ${booking.customerName}` : ''}`}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.border}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
          >
            <div style={{ fontSize: 14, fontWeight: 500, color: occupied ? colors.text : C.t0 }}>{table.tableNumber}</div>
            <div style={{ fontSize: 11, color: occupied ? colors.text : C.t2, marginTop: 2 }}>{table.capacity} seats</div>
            <div style={{ fontSize: 10, marginTop: 3, fontWeight: 500, color: occupied ? colors.text : C.t2 }}>
              {occupied ? booking?.bookingTime || 'Occupied' : 'Free'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Upcoming List Component
function UpcomingList({ bookings, onBookingClick }) {
  const getDateOnly = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = bookings
    .filter(b => getDateOnly(b.bookingDate) === todayStr && b.status !== 'cancelled' && b.status !== 'seated')
    .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
    .slice(0, 4)

  if (!upcoming.length) {
    return <p style={{ fontSize: 12, color: C.t2 }}>No upcoming today</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {upcoming.map(booking => {
        const table = booking.tableId ? { tableNumber: booking.tableNumber || booking.table?.tableNumber || '?' } : null
        const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed

        return (
          <div
            key={booking.id}
            onClick={() => onBookingClick(booking)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
              transition: 'border-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.border}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.t0 }}>{booking.customerName}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>{booking.bookingTime}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.t2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.chip }} />
              <span>{booking.partySize} guests</span>
              <span>·</span>
              <span>{table ? `Table ${table.tableNumber}` : '?'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Booking Modal Component
function BookingModal({ mode, booking, tables, bookings, timeSlots, onClose, onSave, autoAssignTable, selectedDate }) {
  const [formData, setFormData] = useState({
    customerName: booking?.customerName || '',
    customerPhone: booking?.customerPhone || '',
    customerEmail: booking?.customerEmail || '',
    bookingDate: booking?.bookingDate || selectedDate,
    bookingTime: booking?.bookingTime || '19:00',
    partySize: booking?.partySize || 2,
    tableId: booking?.tableId || '',
    notes: booking?.notes || ''
  })

  const [suggestedTable, setSuggestedTable] = useState(null)

  useEffect(() => {
    if (mode === 'add') {
      const best = autoAssignTable(formData.partySize, formData.bookingDate, formData.bookingTime)
      setSuggestedTable(best)
      if (best) {
        setFormData(prev => ({ ...prev, tableId: best.id }))
      }
    }
  }, [formData.partySize, formData.bookingDate, formData.bookingTime, mode, autoAssignTable])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.customerName.trim()) {
      alert('Please enter customer name')
      return
    }
    onSave({
      ...formData,
      locationId: booking?.locationId,
      status: booking?.status || 'confirmed'
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        width: 340,
        maxWidth: '90%'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: C.t0 }}>
          {mode === 'add' ? <><Plus size={16} style={{ verticalAlign: -2, marginRight: 6 }} /> New booking</> : `Edit booking — ${booking?.customerName}`}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Guest name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Full name"
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Phone</label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="04xx xxx xxx"
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="guest@email.com"
              style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Date</label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Time</label>
              <select
                value={formData.bookingTime}
                onChange={e => setFormData({ ...formData, bookingTime: e.target.value })}
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Guests</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.partySize}
                onChange={e => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Table</label>
              <select
                value={formData.tableId}
                onChange={e => setFormData({ ...formData, tableId: parseInt(e.target.value) })}
                style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0 }}
              >
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.name || `Table ${t.tableNumber}`} ({t.capacity} seats)</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: C.t2, marginBottom: 4 }}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dietary needs, special requests..."
              style={{ width: '100%', fontSize: 13, padding: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.input, color: C.t0, height: 60, resize: 'none' }}
            />
          </div>
          {!suggestedTable && mode === 'add' && (
            <div style={{
              fontSize: 12,
              color: STATUS_COLORS.pending.text,
              background: STATUS_COLORS.pending.bg,
              padding: '6px 10px',
              borderRadius: 6,
              marginBottom: 12
            }}>
              No available tables for {formData.partySize} guests at this time. Please choose a different time.
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: '7px 16px',
                fontSize: 13,
                cursor: 'pointer',
                color: C.t2
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: C.t0,
                color: C.page,
                border: 'none',
                borderRadius: 6,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Save booking
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Booking Detail Modal Component
function BookingDetailModal({ booking, tables, onClose, onStatusChange, onDelete, onEdit }) {
  const getDateOnly = (dateStr) => {
    if (!dateStr) return ''
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }
    return dateStr
  }

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const table = tables.find(t => t.id === booking.tableId)
  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.confirmed
  const initials = booking.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 20,
        width: 320,
        maxWidth: '90%'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: C.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: C.acc,
              flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: C.t0 }}>{booking.customerName}</div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: colors.bg,
                color: colors.text,
                textTransform: 'capitalize'
              }}>
                {booking.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: C.t2, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
          <Calendar size={14} /> {formatDisplayDate(booking.bookingDate)} at {booking.bookingTime}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
          <Users size={14} /> {booking.partySize} guests
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
          <Armchair size={14} /> {table ? `${table.name || `Table ${table.tableNumber}`} (${table.capacity} seats)` : 'No table'}
        </div>
        {booking.customerPhone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
            <Phone size={14} /> {booking.customerPhone}
          </div>
        )}
        {booking.customerEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
            <Mail size={14} /> {booking.customerEmail}
          </div>
        )}
        {booking.notes && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.t2, marginBottom: 8 }}>
            <FileText size={14} style={{ marginTop: 2 }} /> <em>{booking.notes}</em>
          </div>
        )}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`
        }}>
          {booking.status === 'confirmed' && (
            <button
              onClick={() => onStatusChange(booking.id, 'seated')}
              style={{
                flex: 1,
                padding: 7,
                fontSize: 12,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                border: `1px solid ${C.border}`,
                background: C.t0,
                color: C.page,
                borderColor: 'transparent'
              }}
            >
              <Armchair size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> Seat
            </button>
          )}
          {booking.status === 'pending' && (
            <button
              onClick={() => onStatusChange(booking.id, 'confirmed')}
              style={{
                flex: 1,
                padding: 7,
                fontSize: 12,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                border: `1px solid ${C.border}`,
                background: C.t0,
                color: C.page,
                borderColor: 'transparent'
              }}
            >
              <Check size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> Confirm
            </button>
          )}
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              padding: 7,
              fontSize: 12,
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.t2
            }}
          >
            <Edit size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> Edit
          </button>
          {booking.status !== 'cancelled' && (
            <button
              onClick={() => onDelete(booking.id)}
              style={{
                flex: 1,
                padding: 7,
                fontSize: 12,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: '#A32D2D',
                borderColor: '#F09595'
              }}
            >
              <X size={12} style={{ verticalAlign: -2, marginRight: 4 }} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
