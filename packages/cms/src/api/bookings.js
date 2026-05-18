import api from './client'

export const getBookings = (clientId) =>
  api.get(`/bookings/${clientId}`).then(r => r.data)

export const getLocationBookings = (locationId) =>
  api.get(`/bookings/location/${locationId}`).then(r => r.data)

export const updateBookingStatus = (bookingId, status) =>
  api.patch(`/bookings/${bookingId}/status`, { status }).then(r => r.data)

export const deleteBooking = (bookingId) =>
  api.delete(`/bookings/${bookingId}`).then(r => r.data)
