import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSiteData, CMS_API_URL } from '../../lib/api'
import { CMSProvider } from '../../contexts/CMSContext'
import { LoyaltyProvider } from '../../contexts/LoyaltyContext'
import { Header } from '../../components/theme-d1/Header'
import { Footer } from '../../components/theme-d1/Footer'
import { Check, CheckCircle, Clock, Package, XCircle, Loader2, Receipt, Mail, Phone, User, Calendar, Star, Gift, Printer, Download, X } from 'lucide-react'

export async function getServerSideProps({ query }) {
  const { id } = query
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  return { props: { data, orderId: id } }
}

const statusConfig = {
  new: { label: 'Order Received', icon: Clock, color: '#f59e0b', description: 'Your order has been received and is being prepared.' },
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

export default function OrderStatusPage({ data, orderId }) {
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

  if (loading) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>Order Status - {siteName}</title>
        </Head>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={48} className="animate-spin" />
        </div>
        <Footer />
      </CMSProvider>
    )
  }

  if (error || !order) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>Order Not Found - {siteName}</title>
        </Head>
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <XCircle size={64} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order Not Found</h1>
            <p style={{ color: '#666', marginBottom: 24 }}>{error || 'This order could not be found.'}</p>
            <button
              onClick={() => router.push(`/?site=${router.query.site}`)}
              style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Return Home
            </button>
          </div>
        </div>
        <Footer />
      </CMSProvider>
    )
  }

  const statusInfo = statusConfig[order.status] || statusConfig.new
  const StatusIcon = statusInfo.icon
  const items = Array.isArray(order.items) ? order.items : []

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
      </Head>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {/* Order Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 24px', background: `${statusInfo.color}15`, borderRadius: 16, marginBottom: 16 }}>
            <StatusIcon size={32} style={{ color: statusInfo.color }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, color: '#666' }}>Order #{order.orderNumber}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: statusInfo.color }}>{statusInfo.label}</div>
            </div>
          </div>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 500, margin: '0 auto' }}>{statusInfo.description}</p>
        </div>

        {/* Status Progress */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Order Progress</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {['new', 'preparing', 'packing', 'ready'].map((status, index) => {
              const statusOrder = ['new', 'preparing', 'almost_ready', 'packing', 'ready', 'completed']
              const currentIndex = statusOrder.indexOf(order.status)
              const displayOrder = ['new', 'preparing', 'packing', 'ready']
              const displayIndex = displayOrder.indexOf(status)
              const isComplete = currentIndex >= statusOrder.indexOf(status)
              const isActive = order.status === status
              const StatusIcon = statusConfig[status]?.icon || Clock

              return (
                <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  {index > 0 && (
                    <div style={{
                      position: 'absolute', top: 16, left: '-50%', width: '100%', height: 2,
                      background: isComplete ? '#10b981' : '#e5e7eb', zIndex: 0
                    }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isComplete ? '#10b981' : isActive ? statusInfo.color : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isComplete ? 'white' : isActive ? 'white' : '#666',
                    zIndex: 1, marginBottom: 8
                  }}>
                    {isComplete ? <Check size={16} /> : <StatusIcon size={16} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Loyalty Points Section */}
        {(order.pointsEarned > 0 || order.pointsUsed > 0) && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #d1fae5 100%)', borderRadius: 12, border: '1px solid #f59e0b', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={18} style={{ color: '#d97706' }} />
              Loyalty Rewards
            </h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {order.pointsEarned > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'white', borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={20} style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>Points Earned</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>+{order.pointsEarned} points</div>
                  </div>
                </div>
              )}
              {order.pointsUsed > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'white', borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gift size={20} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>Points Redeemed</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>-{order.pointsUsed} points</div>
                    {order.rewardUsed && (
                      <div style={{ fontSize: 13, color: '#b45309' }}>{order.rewardUsed.name}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
          {/* Order Details */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={18} />
              Order Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    {item.quantity > 1 && <div style={{ fontSize: 13, color: '#666' }}>Qty: {item.quantity}</div>}
                    {item.options && item.options.length > 0 && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {item.options.map((opt, i) => (
                          <div key={i}>+ {opt}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>Tax</span>
                  <span>${order.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>Delivery Fee</span>
                  <span>${order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>Discount{order.rewardUsed?.name ? ` (${order.rewardUsed.name})` : ''}</span>
                  <span style={{ color: '#10b981' }}>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 12 }}>
                <span>Total</span>
                <span>${order.total.toFixed(2)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Customer & Pickup Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} />
                Customer Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Name</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customerName}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Email</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customerEmail}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Phone</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{order.customerPhone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} />
                Pickup Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Order Type</div>
                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{order.orderType}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Pickup Time</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {order.pickupTime
                        ? new Date(order.pickupTime).toLocaleString()
                        : 'ASAP'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Payment Method</div>
                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{order.paymentMethod}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={16} style={{ color: '#666' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#666' }}>Payment Status</div>
                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize', color: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }}>
                      {order.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>

              {order.note && (
                <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Special Instructions</div>
                  <div style={{ fontSize: 14 }}>{order.note}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
          <button
            onClick={() => router.push(`/?site=${router.query.site}`)}
            style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Return Home
          </button>
          <button
            onClick={() => setShowReceiptModal(true)}
            style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Receipt size={16} />
            View Receipt
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowReceiptModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={24} />
            </button>
            
            <div style={{ padding: '40px' }}>
              <div id="modal-receipt" style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase' }}>
                    {data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''}
                  </h2>
                  {data?.locations?.[0]?.address && <p style={{ margin: '4px 0', fontSize: '12px' }}>{data.locations[0].address}</p>}
                  {data?.locations?.[0]?.phone && <p style={{ margin: '4px 0', fontSize: '12px' }}>Phone: {data.locations[0].phone}</p>}
                  {data?.settings?.abn && <p style={{ margin: '4px 0', fontSize: '12px' }}>ABN: {data.settings.abn}</p>}
                </div>

                <div style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '12px 0', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ORDER RECEIPT</div>
                  <div style={{ fontSize: '14px' }}>Order #: {order.orderNumber}</div>
                  <div style={{ fontSize: '14px' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>

                <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>CUSTOMER:</div>
                  <div>{order.customerName}</div>
                  {order.customerPhone && <div>{order.customerPhone}</div>}
                </div>

                <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>ORDER TYPE:</div>
                  <div style={{ textTransform: 'capitalize' }}>{order.orderType}</div>
                  <div>Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}</div>
                </div>

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

                <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>PAYMENT:</div>
                  <div style={{ textTransform: 'capitalize' }}>{order.paymentMethod}</div>
                  <div style={{ textTransform: 'capitalize' }}>Status: {order.paymentStatus}</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed black', fontSize: '14px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>THANK YOU FOR YOUR ORDER!</div>
                  <div>Status: {statusInfo.label}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: '24px', justifyContent: 'center' }}>
                <button
                  onClick={handleDownloadReceipt}
                  style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Download size={16} />
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
    </CMSProvider>
  )
}
