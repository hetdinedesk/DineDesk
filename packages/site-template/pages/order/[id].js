import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSiteData, CMS_API_URL } from '../../lib/api'
import { buildThemeCSS } from '../../lib/theme'
import { CMSProvider } from '../../contexts/CMSContext'
import { LoyaltyProvider } from '../../contexts/LoyaltyContext'
import { Header as ThemeD1Header } from '../../components/theme-d1/Header'
import { Footer as ThemeD1Footer } from '../../components/theme-d1/Footer'
import { Header as ThemeD2Header } from '../../components/theme-d2/Header'
import { Footer as ThemeD2Footer } from '../../components/theme-d2/Footer'
import { Header as ThemeD3Header } from '../../components/theme-d3/Header'
import { Footer as ThemeD3Footer } from '../../components/theme-d3/Footer'

// Theme component mapping
const THEME_COMPONENTS = {
  'theme-v1': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'theme-d1': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'theme-d2': { Header: ThemeD2Header, Footer: ThemeD2Footer },
  'theme-d3': { Header: ThemeD3Header, Footer: ThemeD3Footer },
  'cafe': { Header: ThemeD3Header, Footer: ThemeD3Footer },
  'food-truck': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'casual-family': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'modern-trendy': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'delivery': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'urban-bistro': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'noir-fine-dine': { Header: ThemeD1Header, Footer: ThemeD1Footer },
  'garden-fresh': { Header: ThemeD1Header, Footer: ThemeD1Footer },
}
import { Check, CheckCircle, Clock, Package, XCircle, Loader2, Receipt, Mail, Phone, User, Calendar, Star, Gift, Printer, Download, X, MapPin, UtensilsCrossed, ArrowLeft, Sparkles } from 'lucide-react'

export async function getServerSideProps({ query }) {
  const { id } = query
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  const template = data?.themeKey || data?.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'
  return { props: { data, orderId: id, template } }
}

const statusConfig = {
  new: { label: 'Order Sent to Restaurant', icon: Clock, color: '#f59e0b', description: 'Your order has been sent to the restaurant and is awaiting confirmation.' },
  accepted: { label: 'Order Accepted', icon: Check, color: '#10b981', description: 'Your order has been accepted by the restaurant.' },
  preparing: { label: 'Preparing', icon: Package, color: '#3b82f6', description: 'Your order is being prepared.' },
  almost_ready: { label: 'Almost Ready', icon: Clock, color: '#8b5cf6', description: 'Your order is almost ready!' },
  packing: { label: 'Packing', icon: Package, color: '#06b6d4', description: 'Your order is being packed.' },
  ready: { label: 'Ready for Pickup', icon: CheckCircle, color: '#10b981', description: 'Your order is ready for pickup!' },
  completed: { label: 'Completed', icon: CheckCircle, color: '#10b981', description: 'Your order has been completed.' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#ef4444', description: 'Your order has been cancelled.' }
}

// Printable Receipt Component
function PrintableReceipt({ order, data }) {
  const siteName = data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''

  // Generate theme CSS
  const settings = data?.settings || {}
  const colours = data?.colours || {}
  const themeCSS = buildThemeCSS(colours, settings)

  const logo = data?.colours?.logoLight || data?.colours?.logoDark || null
  const abn = data?.settings?.abn || ''
  const primaryLocation = data?.locations?.find(l => l.isPrimary) || data?.locations?.[0] || {}
  
  // Build full address from location
  const addressParts = [
    primaryLocation?.address,
    primaryLocation?.suburb,
    primaryLocation?.state,
    primaryLocation?.postcode
  ].filter(Boolean)
  const fullAddress = addressParts.join(', ') || data?.settings?.address || ''
  
  const phone = primaryLocation?.phone || data?.settings?.phone || ''
  const items = Array.isArray(order.items) ? order.items : []
  const statusInfo = statusConfig[order.status] || statusConfig.new

  return (
    <div id="printable-receipt" style={{
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.4',
      width: '100%',
      maxWidth: '700px',
      margin: '0 auto',
      padding: '20px',
      background: 'white',
      color: 'black',
      display: 'none',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {logo && (
          <img
            src={logo}
            alt={siteName}
            style={{ maxWidth: '200px', maxHeight: '100px', margin: '0 auto 10px', display: 'block' }}
          />
        )}
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase' }}>{siteName}</h2>
        {fullAddress && <p style={{ margin: '4px 0', fontSize: '12px' }}>{fullAddress}</p>}
        {phone && <p style={{ margin: '4px 0', fontSize: '12px' }}>Phone: {phone}</p>}
        {abn && <p style={{ margin: '4px 0', fontSize: '12px' }}>ABN: {abn}</p>}
      </div>

      <div style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '12px 0', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
          ORDER RECEIPT
        </div>
        <div style={{ fontSize: '14px' }}>
          Order #: {order.orderNumber}
        </div>
        <div style={{ fontSize: '14px' }}>
          {new Date(order.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>CUSTOMER:</div>
        <div>{order.customerName}</div>
        {order.customerPhone && <div>{order.customerPhone}</div>}
      </div>

      {/* Order Type */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>ORDER TYPE:</div>
        <div style={{ textTransform: 'capitalize' }}>{order.orderType}</div>
        <div>Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}</div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid black', paddingBottom: '8px', fontSize: '16px' }}>ITEMS:</div>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            {item.options && item.options.length > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                {item.options.map((opt, i) => <div key={i}>+ {opt}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ borderTop: '2px solid black', paddingTop: '12px', marginBottom: '16px', fontSize: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Subtotal:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        {order.taxAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Tax:</span>
            <span>${order.taxAmount.toFixed(2)}</span>
          </div>
        )}
        {order.deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Delivery Fee:</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Discount{order.rewardUsed?.name ? ` (${order.rewardUsed.name})` : ''}:</span>
            <span>-${order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginTop: '12px', borderTop: '2px solid black', paddingTop: '12px' }}>
          <span>TOTAL:</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginBottom: '16px', fontSize: '14px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>PAYMENT:</div>
        <div style={{ textTransform: 'capitalize' }}>{order.paymentMethod}</div>
        <div style={{ textTransform: 'capitalize' }}>Status: {order.paymentStatus}</div>
      </div>

      {/* Loyalty Points */}
      {(order.pointsEarned > 0 || order.pointsUsed > 0) && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', fontSize: '14px' }}>
          {order.pointsEarned > 0 && <div>Points Earned: +{order.pointsEarned}</div>}
          {order.pointsUsed > 0 && <div>Points Redeemed: -{order.pointsUsed}</div>}
        </div>
      )}

      {/* Special Instructions */}
      {order.note && (
        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>SPECIAL INSTRUCTIONS:</div>
          <div>{order.note}</div>
        </div>
      )}

      {/* Order Progress Bar */}
      {order.status !== 'new' && order.status !== 'cancelled' && (
        <div style={{ marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>ORDER PROGRESS</div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#666' }}>
                {(() => {
                  if (order.status === 'accepted') return 'Order Accepted'
                  if (order.status === 'preparing') return 'Preparing'
                  if (order.status === 'almost_ready') return 'Almost Ready'
                  if (order.status === 'packing') return 'Packing'
                  if (order.status === 'ready') return 'Ready for Pickup'
                  return order.status
                })()}
              </span>
              <span style={{ color: '#666' }}>
                {(() => {
                  if (order.acceptedAt) {
                    const diffMs = new Date() - new Date(order.acceptedAt)
                    const diffMins = Math.floor(diffMs / 60000)
                    return diffMins < 1 ? 'Just now' : `${diffMins}m ago`
                  }
                  return ''
                })()}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: (() => {
                  if (order.status === 'accepted') return '25%'
                  if (order.status === 'preparing') return '50%'
                  if (order.status === 'almost_ready') return '75%'
                  if (order.status === 'packing') return '85%'
                  if (order.status === 'ready') return '100%'
                  return '0%'
                })(),
                height: '100%',
                background: statusInfo.color,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed black', fontSize: '14px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>THANK YOU FOR YOUR ORDER!</div>
        <div>Status: {statusInfo.label}</div>
        <div style={{ marginTop: '8px' }}>{siteName}</div>
        {phone && <div>{phone}</div>}
      </div>
    </div>
  )
}

export default function OrderStatusPage({ data, orderId, template }) {
  // Get correct Header/Footer for theme - do this first before any usage
  const normalizedTemplate = template?.replace(/\s+/g, '-') || 'theme-d1'
  const { Header, Footer } = THEME_COMPONENTS[normalizedTemplate] || THEME_COMPONENTS['theme-d1']

  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const fetchOrder = async () => {
    try {
      const siteId = router.query.site
      const clientId = data?.client?.id

      if (!clientId) {
        throw new Error('Client ID not found')
      }

      const response = await fetch(`${CMS_API_URL}/clients/${clientId}/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Order not found')
      }
      const orderData = await response.json()
      setOrder(orderData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [orderId])

  const siteName = data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''

  // Generate theme CSS
  const settings = data?.settings || {}
  const colours = data?.colours || {}
  const themeCSS = buildThemeCSS(colours, settings)

  if (loading) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>Order Status - {siteName}</title>
          {/* Theme CSS */}
          {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }}/>}
        </Head>
        <div className="min-h-screen bg-[var(--color-accent)]">
          <Header />
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 width={48} height={48} strokeWidth={2} className="animate-spin text-[var(--color-primary)]" />
          </div>
          <Footer />
        </div>
      </CMSProvider>
    )
  }

  if (error || !order) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>Order Not Found - {siteName}</title>
          {/* Theme CSS */}
          {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }}/>}
        </Head>
        <div className="min-h-screen bg-[var(--color-accent)]">
          <Header />
          <div className="min-h-[60vh] flex items-center justify-center px-6 pt-32 pb-24">
            <div className="text-center space-y-8">
              <div className="w-24 h-24 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle width={40} height={40} strokeWidth={2} className="text-red-500" />
              </div>
              <div>
                <h1 className="font-heading text-5xl italic text-[var(--color-secondary)] mb-4">Order Not Found</h1>
                <p className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">{error || 'This order could not be found.'}</p>
              </div>
              <button
                onClick={() => router.push(`/?site=${router.query.site}`)}
                className="px-8 py-4 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg inline-flex items-center gap-3"
              >
                <ArrowLeft width={18} height={18} strokeWidth={2} />
                Return Home
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </CMSProvider>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.new
  const StatusIcon = statusInfo.icon
  const items = Array.isArray(order.items) ? order.items : []

  // Check if order is scheduled (has a future pickup time)
  const isScheduledOrder = order.pickupTime && new Date(order.pickupTime) > new Date()
  const scheduledTime = order.pickupTime ? new Date(order.pickupTime) : null

  // Adjust status description for scheduled orders
  let statusDescription = statusInfo.description
  if (isScheduledOrder && order.status === 'new') {
    statusDescription = 'Your order has been received and will be prepared closer to your scheduled pickup time.'
  } else if (isScheduledOrder && order.status === 'preparing') {
    statusDescription = 'Your order is being prepared for your scheduled pickup time.'
  }

  const handleDownloadReceipt = () => {
    const printableReceipt = document.getElementById('printable-receipt')
    if (printableReceipt) {
      printableReceipt.style.display = 'block'
      window.print()
      printableReceipt.style.display = 'none'
    }
  }

  return (
    <CMSProvider data={data}>
      <Head>
        <title>Order #{order.orderNumber} - {siteName}</title>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            @page {
              margin: 0;
              size: auto;
            }
            @page :left, @page :right {
              margin: 0;
            }
          }
        `}</style>
        
        {/* Theme CSS */}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }}/>}
      </Head>
      <style jsx>{`
        :global(.font-heading) {
          font-family: var(--font-heading);
        }
        :global(.font-body) {
          font-family: var(--font-body);
        }
      `}</style>
      <div className="min-h-screen bg-[var(--color-accent)]">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-32">
        {/* Order Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 p-6 bg-[var(--color-primary)]/10 rounded-full mb-8">
            <StatusIcon width={32} height={32} strokeWidth={2} style={{ color: statusInfo.color }} />
            <div className="text-left">
              <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Order #{order.orderNumber}</div>
              <div className="font-heading text-2xl italic" style={{ color: statusInfo.color }}>{statusInfo.label}</div>
            </div>
          </div>
          <p className="font-body text-sm text-[var(--color-secondary)]/60 max-w-xl mx-auto leading-relaxed">{statusDescription}</p>
        </div>

        {/* Scheduled Order Banner */}
        {isScheduledOrder && scheduledTime && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-[48px] p-6 mb-12">
            <div className="flex items-center justify-center gap-4">
              <Calendar width={32} height={32} strokeWidth={2} className="text-amber-600" />
              <div className="text-left">
                <div className="font-heading text-xl italic text-amber-800">Scheduled Order</div>
                <div className="font-body text-sm text-amber-700">
                  Your order is scheduled for <span className="font-bold">{scheduledTime.toLocaleDateString()}</span> at <span className="font-bold">{scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Progress */}
        <div className="bg-white rounded-[48px] border border-[var(--color-secondary)]/10 p-8 mb-12">
          <h3 className="font-heading text-2xl italic text-[var(--color-secondary)] mb-8">Order Progress</h3>
          <div className="flex justify-between relative">
            {['new', 'preparing', 'packing', 'ready'].map((status, index) => {
              const statusOrder = ['new', 'preparing', 'almost_ready', 'packing', 'ready', 'completed']
              const currentIndex = statusOrder.indexOf(order.status)
              const displayOrder = ['new', 'preparing', 'packing', 'ready']
              const displayIndex = displayOrder.indexOf(status)
              const isComplete = currentIndex >= statusOrder.indexOf(status)
              const isActive = order.status === status
              const StatusIcon = statusConfig[status]?.icon || Clock

              return (
                <div key={status} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div className={`absolute top-6 left-[-50%] w-full h-0.5 z-0 ${isComplete ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-secondary)]/20'}`} />
                  )}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 mb-4 ${
                    isComplete ? 'bg-[var(--color-primary)] text-[var(--color-accent)]' : isActive ? 'bg-[var(--color-primary)] text-[var(--color-accent)]' : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]/60'
                  }`}>
                    {isComplete ? <Check width={20} height={20} strokeWidth={2} /> : <StatusIcon width={20} height={20} strokeWidth={2} />}
                  </div>
                  <div className="text-xs font-body font-bold tracking-widest uppercase text-[var(--color-secondary)]/60">{status.replace('_', ' ')}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Loyalty Points Section */}
        {(order.pointsEarned > 0 || order.pointsUsed > 0) && (
          <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-[48px] border border-[var(--color-primary)]/20 p-8 mb-12">
            <h3 className="font-heading text-2xl italic text-[var(--color-secondary)] mb-8 flex items-center gap-3">
              <Star width={24} height={24} strokeWidth={2} className="text-[var(--color-primary)]" />
              Loyalty Rewards
            </h3>
            <div className="grid gap-6">
              {order.pointsEarned > 0 && (
                <div className="flex items-center gap-4 p-6 bg-white rounded-full">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Star width={24} height={24} strokeWidth={2} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-body text-sm font-bold text-green-700">Points Earned</div>
                    <div className="font-heading text-2xl italic text-green-600">+{order.pointsEarned} points</div>
                  </div>
                </div>
              )}
              {order.pointsUsed > 0 && (
                <div className="flex items-center gap-4 p-6 bg-white rounded-full">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Gift width={24} height={24} strokeWidth={2} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="font-body text-sm font-bold text-amber-800">Points Redeemed</div>
                    <div className="font-heading text-2xl italic text-amber-600">-{order.pointsUsed} points</div>
                    {order.rewardUsed && (
                      <div className="font-body text-xs text-amber-700">{order.rewardUsed.name}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-[48px] border border-[var(--color-secondary)]/10 p-8">
            <h3 className="font-heading text-2xl italic text-[var(--color-secondary)] mb-8 flex items-center gap-3">
              <Receipt width={24} height={24} strokeWidth={2} />
              Order Details
            </h3>

            <div className="flex flex-col gap-6 mb-8">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-6 border-b border-[var(--color-secondary)]/10 last:border-0">
                  <div className="flex-1">
                    <div className="font-heading text-lg italic text-[var(--color-secondary)]">{item.name}</div>
                    {item.quantity > 1 && <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Qty: {item.quantity}</div>}
                    {item.options && item.options.length > 0 && (
                      <div className="text-xs text-[var(--color-secondary)]/60 mt-2">
                        {item.options.map((opt, i) => (
                          <div key={i}>+ {opt}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="font-body font-bold text-[var(--color-secondary)]">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--color-secondary)]/10 pt-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Subtotal</span>
                <span className="font-body font-bold text-[var(--color-secondary)]">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Tax</span>
                  <span className="font-body font-bold text-[var(--color-secondary)]">${order.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Delivery Fee</span>
                  <span className="font-body font-bold text-[var(--color-secondary)]">${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Discount{order.rewardUsed?.name ? ` (${order.rewardUsed.name})` : ''}</span>
                  <span className="text-xs font-body font-bold tracking-widest text-green-600 uppercase">-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <span className="font-heading text-2xl italic text-[var(--color-secondary)]">Total</span>
                <span className="font-heading text-2xl italic text-[var(--color-primary)]">${order.total.toFixed(2)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Customer & Pickup Info */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[48px] border border-[var(--color-secondary)]/10 p-8">
              <h3 className="font-heading text-2xl italic text-[var(--color-secondary)] mb-8 flex items-center gap-3">
                <User width={24} height={24} strokeWidth={2} />
                Customer Information
              </h3>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <User width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Name</div>
                    <div className="font-body font-bold text-[var(--color-secondary)]">{order.customerName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Mail width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Email</div>
                    <div className="font-body font-bold text-[var(--color-secondary)]">{order.customerEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Phone width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Phone</div>
                    <div className="font-body font-bold text-[var(--color-secondary)]">{order.customerPhone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[48px] border border-[var(--color-secondary)]/10 p-8">
              <h3 className="font-heading text-2xl italic text-[var(--color-secondary)] mb-8 flex items-center gap-3">
                <Calendar width={24} height={24} strokeWidth={2} />
                Pickup Information
              </h3>

              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Package width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Order Type</div>
                    <div className="font-body font-bold text-[var(--color-secondary)] capitalize">{order.orderType}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Clock width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Pickup Time</div>
                    <div className="font-body font-bold text-[var(--color-secondary)]">
                      {order.pickupTime
                        ? new Date(order.pickupTime).toLocaleString()
                        : 'ASAP'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <Receipt width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Payment Method</div>
                    <div className="font-body font-bold text-[var(--color-secondary)] capitalize">{order.paymentMethod}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <CheckCircle width={18} height={18} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                  </div>
                  <div>
                    <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">Payment Status</div>
                    <div className={`font-body font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {order.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>

              {order.note && (
                <div className="mt-8 p-6 bg-[var(--color-accent)] rounded-full">
                  <div className="text-xs font-body font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase mb-2">Special Instructions</div>
                  <div className="font-body text-sm text-[var(--color-secondary)]">{order.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-12">
          <button
            onClick={() => router.push(`/?site=${router.query.site}`)}
            className="px-8 py-4 bg-white border border-[var(--color-secondary)]/20 rounded-full font-body font-bold text-sm text-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Return Home
          </button>
          <button
            onClick={() => setShowReceiptModal(true)}
            className="px-8 py-4 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg flex items-center gap-3"
          >
            <Receipt width={18} height={18} strokeWidth={2} />
            View Receipt
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-[var(--color-secondary)]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
          <div className="bg-white rounded-[48px] max-w-[700px] w-[90%] max-h-[90vh] overflow-auto relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-6 right-6 bg-none border-none cursor-pointer p-3 rounded-full hover:bg-[var(--color-accent)] transition-colors z-10"
            >
              <X width={24} height={24} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
            </button>
            
            <div className="p-10">
              <div id="modal-receipt" className="font-mono text-xs leading-relaxed">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2 uppercase">
                    {data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''}
                  </h2>
                  {data?.locations?.[0]?.address && <p className="text-xs">{data.locations[0].address}</p>}
                  {data?.locations?.[0]?.phone && <p className="text-xs">Phone: {data.locations[0].phone}</p>}
                  {data?.settings?.abn && <p className="text-xs">ABN: {data.settings.abn}</p>}
                </div>

                <div className="border-t-2 border-b-2 border-black py-4 mb-8 text-center">
                  <div className="text-lg font-bold mb-1">ORDER RECEIPT</div>
                  <div className="text-sm">Order #: {order.orderNumber}</div>
                  <div className="text-sm">{new Date(order.createdAt).toLocaleString()}</div>
                </div>

                <div className="mb-6 text-sm">
                  <div className="font-bold mb-2 text-base">CUSTOMER:</div>
                  <div>{order.customerName}</div>
                  {order.customerPhone && <div>{order.customerPhone}</div>}
                </div>

                <div className="mb-6 text-sm">
                  <div className="font-bold mb-2 text-base">ORDER TYPE:</div>
                  <div className="capitalize">{order.orderType}</div>
                  <div>Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}</div>
                </div>

                <div className="mb-6">
                  <div className="font-bold mb-2 text-base border-b-2 border-black pb-2">ITEMS:</div>
                  {items.map((item, index) => (
                    <div key={index} className="mb-4 text-sm">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <div className="text-xs text-[var(--color-secondary)]/60 ml-2">
                          {item.options.map((opt, i) => <div key={i}>+ {opt}</div>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-black pt-4 mb-6 text-sm">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between mb-2">
                      <span>Tax:</span>
                      <span>${order.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between mb-2">
                      <span>Delivery Fee:</span>
                      <span>${order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between mb-2">
                      <span>Discount{order.rewardUsed?.name ? ` (${order.rewardUsed.name})` : ''}:</span>
                      <span>-${order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t-2 border-black">
                    <span>TOTAL:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-6 text-sm">
                  <div className="font-bold mb-2 text-base">PAYMENT:</div>
                  <div className="capitalize">{order.paymentMethod}</div>
                  <div className="capitalize">Status: {order.paymentStatus}</div>
                </div>

                <div className="text-center mt-8 pt-8 border-t-2 border-dashed border-black text-sm">
                  <div className="font-bold mb-2 text-lg">THANK YOU FOR YOUR ORDER!</div>
                  <div>Status: {statusInfo.label}</div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 justify-center">
                <button
                  onClick={handleDownloadReceipt}
                  className="px-8 py-4 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg flex items-center gap-3"
                >
                  <Download width={18} height={18} strokeWidth={2} />
                  Download / Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt (hidden by default, shown during print) */}
      <PrintableReceipt order={order} data={data} />

      <Footer />
      </div>
    </CMSProvider>
  )
}
