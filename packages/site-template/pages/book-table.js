import Head from 'next/head'
import { getSiteData } from '../lib/api'
import { CMSProvider } from '../contexts/CMSContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BookingForm from '../components/BookingForm'
import { useCMS } from '../contexts/CMSContext'
import { X } from 'lucide-react'

export default function BookTablePage({ data, template }) {
  const router = useRouter()
  const { booking, locations, clientId } = useCMS()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSuccess = () => {
    alert(booking?.bookConfirmMsg || 'Booking submitted successfully!')
    router.push('/')
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <>
      <Head>
        <title>Book a Table - {data?.client?.name || 'Restaurant'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book a Table</h1>
              <p className="text-gray-600 mt-1">Reserve your spot at {data?.client?.name || 'our restaurant'}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Close booking form"
            >
              <X width={24} height={24} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto flex-1">
            {mounted && (
              <BookingForm
                clientId={clientId}
                config={{ booking }}
                locations={locations}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ query }) {
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  const template = data?.themeKey || data?.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'
  
  return { props: { data, template } }
}
