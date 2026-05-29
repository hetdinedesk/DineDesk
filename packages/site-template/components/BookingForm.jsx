import { useState } from 'react'

export default function BookingForm({ clientId, config, locations = [], onSuccess }) {
  const [formData, setFormData] = useState({
    locationId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    partySize: '',
    bookingDate: '',
    bookingTime: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availability, setAvailability] = useState(null)
  const [success, setSuccess] = useState(null)

  const bookingConfig = config?.booking || {}
  const confirmationMethod = bookingConfig.confirmationMethod || 'external'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const checkAvailability = async () => {
    if (!formData.bookingDate) return

    try {
      const API_URL = process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'
      const locationParam = formData.locationId ? `&locationId=${formData.locationId}` : ''
      const url = `${API_URL}/clients/${clientId}/bookings/availability?date=${formData.bookingDate}${formData.bookingTime ? `&time=${formData.bookingTime}` : ''}${locationParam}`
      
      console.log('[BookingForm] Checking availability:', { API_URL, clientId, url })
      
      const response = await fetch(url)
      
      console.log('[BookingForm] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[BookingForm] Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      setAvailability(data)
      return data
    } catch (err) {
      console.error('[BookingForm] Availability check error:', err)
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!formData.customerEmail) {
      setError('Email is required')
      setLoading(false)
      return
    }
    if (!formData.customerPhone) {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_URL}/clients/${clientId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          confirmationMethod,
          partySize: parseInt(formData.partySize),
          locationId: formData.locationId || null,
          autoAssignTable: true // Enable auto-assignment
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Success
      setSuccess(data)
      if (onSuccess) {
        onSuccess(data)
      }

      // Reset form after 3 seconds
      setTimeout(() => {
      setFormData({
        locationId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        partySize: '',
        bookingDate: '',
        bookingTime: '',
        notes: ''
      })
      setAvailability(null)
        setSuccess(null)
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Generate time slots based on location operation hours
  const generateTimeSlots = () => {
    const slotInterval = bookingConfig.slotInterval || 30
    const slots = []

    // Get selected location's hours (fall back to first location if none selected)
    const selectedLocation = locations.find(loc => loc.id === formData.locationId) || locations[0]
    const locationHours = selectedLocation?.hours

    // Default to 11am-10pm if no hours configured
    const defaultOpenHour = 11
    const defaultCloseHour = 22

    // Get day of week from selected booking date, or current day
    let targetDayFull, targetDayShort
    if (formData.bookingDate) {
      const bookingDateObj = new Date(formData.bookingDate + 'T00:00:00')
      targetDayFull = bookingDateObj.toLocaleDateString('en-US', { weekday: 'long' })
      targetDayShort = bookingDateObj.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      targetDayFull = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      targetDayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' })
    }

    // Parse time string to { hour, min } in 24h format
    const parseTime = (timeStr) => {
      if (!timeStr) return null
      // Handle 24-hour format like "09:00" or "17:00"
      if (timeStr.includes(':') && !timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
        const parts = timeStr.split(':')
        return { hour: parseInt(parts[0]) || 0, min: parseInt(parts[1]) || 0 }
      }
      // Handle 12-hour format like "6am", "9:30pm", "6:00 AM"
      const match = timeStr.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
      if (!match) return null
      let hour = parseInt(match[1])
      const min = match[2] ? parseInt(match[2]) : 0
      const meridiem = match[3]
      if (meridiem === 'pm' && hour !== 12) hour += 12
      if (meridiem === 'am' && hour === 12) hour = 0
      return { hour, min }
    }

    // Find the hours entry for the target day
    let dayOpen = null
    let dayClose = null

    if (Array.isArray(locationHours)) {
      // Array format from CMSContext: [{ day: 'Monday', open: '6am', close: '9:30pm', closed: false }, ...]
      const entry = locationHours.find(h => h.day === targetDayFull || h.day === targetDayShort)
      if (entry && !entry.closed && entry.open && entry.close) {
        dayOpen = parseTime(entry.open)
        dayClose = parseTime(entry.close)
      }
    } else if (locationHours && typeof locationHours === 'object') {
      // Object format: { Monday: { open: '6am', close: '9:30pm' }, ... }
      const entry = locationHours[targetDayFull] || locationHours[targetDayShort]
      if (entry && !entry.closed && entry.open && entry.close) {
        dayOpen = parseTime(entry.open)
        dayClose = parseTime(entry.close)
      }
    }

    const openHour = dayOpen ? dayOpen.hour : defaultOpenHour
    const closeHour = dayClose ? dayClose.hour : defaultCloseHour
    const closeMin = dayClose ? dayClose.min : 0

    // Generate slots from open to close time
    for (let hour = openHour; hour <= closeHour; hour++) {
      for (let min = (hour === openHour ? 0 : 0); min < 60; min += slotInterval) {
        // Stop if we've passed the closing time
        if (hour === closeHour && min >= closeMin) break
        if (hour > closeHour) break
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots()
  const hasMultipleLocations = locations && locations.length > 1

  // Calculate max date for booking
  const maxDaysAhead = bookingConfig.maxDaysAhead || 60
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + maxDaysAhead)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <div className="p-4">
      {bookingConfig.bookLabel && (
        <p className="text-gray-600 mb-4 text-sm">{bookingConfig.bookLabel}</p>
      )}

      {/* Success Message with Allocated Table */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
          <div className="flex items-center text-green-700 mb-1">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-sm">Booking Confirmed!</span>
          </div>
          {success.table && (
            <div className="text-xs text-green-600">
              <p className="font-medium">Table Allocated: {success.table.tableNumber}</p>
              <p>Capacity: {success.table.capacity} seats</p>
            </div>
          )}
          {!success.table && (
            <p className="text-xs text-green-600">
              A table will be assigned upon arrival.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Location selection - only show if multiple locations */}
        {hasMultipleLocations && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <select
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              onBlur={checkAvailability}
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.displayName || loc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleChange}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Size *
            </label>
            <input
              type="number"
              name="partySize"
              value={formData.partySize}
              onChange={handleChange}
              min={bookingConfig.minParty || 1}
              max={bookingConfig.maxParty || 20}
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleChange}
              onBlur={checkAvailability}
              min={new Date().toISOString().split('T')[0]}
              max={maxDateStr}
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time *
          </label>
          <select
            name="bookingTime"
            value={formData.bookingTime}
            onChange={handleChange}
            onBlur={checkAvailability}
            required
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Select time</option>
            {timeSlots.map(time => {
              const [hour, min] = time.split(':')
              const hourNum = parseInt(hour)
              const ampm = hourNum >= 12 ? 'PM' : 'AM'
              const displayHour = hourNum % 12 || 12
              const displayTime = `${displayHour}:${min} ${ampm}`
              return <option key={time} value={time}>{displayTime}</option>
            })}
          </select>
        </div>

        {availability && (
          <div className={`p-2 rounded-md text-sm ${availability.isAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {availability.isAvailable ? (
              <p>{availability.availableTables} tables available</p>
            ) : (
              <p>No tables available for this time slot</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (availability && !availability.isAvailable)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
        >
          {loading ? 'Submitting...' : 'Book Table'}
        </button>
      </form>
    </div>
  )
}
