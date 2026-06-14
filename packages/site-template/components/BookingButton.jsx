import { useState } from 'react'
import BookingForm from './BookingForm'

export default function BookingButton({ booking, locations = [], className = '', children, variant = 'default' }) {
  const [showForm, setShowForm] = useState(false)

  const confirmationMethod = booking?.confirmationMethod || 'external'
  const bookingUrl = booking?.bookingUrl
  const bookingPhone = booking?.bookingPhone

  const handleClick = (e) => {
    if (confirmationMethod === 'external' && bookingUrl) {
      // Let the default link behavior work
      return
    } else if (confirmationMethod === 'phone' && bookingPhone) {
      // Let the tel: link work
      return
    } else {
      // Show the booking form for email/phone methods when no direct link
      e.preventDefault()
      setShowForm(true)
    }
  }

  const buttonContent = children || booking?.bookLabel || 'Book a Table'

  if (confirmationMethod === 'external' && bookingUrl) {
    return (
      <a href={bookingUrl} className={className}>
        {buttonContent}
      </a>
    )
  }

  if (confirmationMethod === 'phone' && bookingPhone) {
    return (
      <a href={`tel:${bookingPhone}`} className={className}>
        {buttonContent}
      </a>
    )
  }

  // For email method or when no direct link, show form on click
  return (
    <>
      <button onClick={handleClick} className={className}>
        {buttonContent}
      </button>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start justify-center z-[10000] p-4 sm:p-6 overflow-y-auto"
          onClick={() => setShowForm(false)}
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] mt-8 sm:mt-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Book a Table</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Close booking form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable form content */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <BookingForm
                clientId={booking?.clientId}
                config={{ booking }}
                locations={locations}
                onSuccess={() => {
                  setShowForm(false)
                  alert(booking?.bookConfirmMsg || 'Booking submitted successfully!')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
