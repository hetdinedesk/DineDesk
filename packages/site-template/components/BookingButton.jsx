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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowForm(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-200"
            >
              ✕
            </button>
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
      )}
    </>
  )
}
