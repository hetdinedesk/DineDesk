import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSiteData, CMS_API_URL } from '../lib/api'
import { CMSProvider } from '../contexts/CMSContext'
import { LoyaltyProvider, useLoyalty } from '../contexts/LoyaltyContext'
import { Header as ThemeD1Header } from '../components/theme-d1/Header'
import { Footer as ThemeD1Footer } from '../components/theme-d1/Footer'
import { Header as ThemeD2Header } from '../components/theme-d2/Header'
import { Footer as ThemeD2Footer } from '../components/theme-d2/Footer'
import { Header as ThemeD3Header } from '../components/theme-d3/Header'
import { Footer as ThemeD3Footer } from '../components/theme-d3/Footer'

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
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, CreditCard, DollarSign, Clock, User, Phone, Mail, Calendar, Check, X, Loader2, Gift, Star, ArrowLeft, ArrowRight, MapPin, UtensilsCrossed, Sparkles } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'

export async function getServerSideProps({ query }) {
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  const template = data?.themeKey || data?.colours?.theme || process.env.SITE_TEMPLATE || 'theme-d1'
  return { props: { data, template } }
}

// Stripe Checkout Form Component
function StripeCheckoutForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      }
    })

    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
      onError(stripeError.message)
    } else {
      setLoading(false)
      onSuccess(paymentIntent)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 border border-[var(--color-secondary)]/20 rounded-full mt-6 bg-[var(--color-accent)]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: 'var(--color-secondary)',
                '::placeholder': {
                  color: 'var(--color-secondary)',
                },
              },
            },
          }}
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm mt-3 p-4 bg-red-50 rounded-full">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 py-5 rounded-full text-[10px] font-bold tracking-widest uppercase text-[var(--color-accent)] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 width={18} height={18} strokeWidth={2} className="animate-spin" /> : 'PAY NOW'}
      </button>
    </form>
  )
}

export default function CheckoutPage({ data, template }) {
  // Get correct Header/Footer for theme - do this first before any usage
  const normalizedTemplate = template?.replace(/\s+/g, '-') || 'theme-d1'
  const { Header, Footer } = THEME_COMPONENTS[normalizedTemplate] || THEME_COMPONENTS['theme-d1']

  const router = useRouter()
  const { items, totalItems, subtotal, taxAmount, taxRate, taxLabel, total, clearCart, ordering } = useCart()
  const paymentGateway = data?.paymentGateway || {}

  const [step, setStep] = useState(1) // 1: Info, 2: Pickup, 3: Payment
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [stripePromise, setStripePromise] = useState(null)

  // Initialize Stripe with publishable key
  useEffect(() => {
    if (paymentGateway?.isActive && paymentGateway?.provider === 'stripe') {
      const publishableKey = paymentGateway.testMode 
        ? paymentGateway.testPublishableKey 
        : paymentGateway.livePublishableKey
      
      if (publishableKey) {
        setStripePromise(loadStripe(publishableKey))
      }
    }
  }, [paymentGateway])

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    note: ''
  })

  // Pickup info
  const [pickupType, setPickupType] = useState('asap') // asap | scheduled
  const [scheduledTime, setScheduledTime] = useState('')
  const [orderType, setOrderType] = useState('pickup') // pickup | delivery | dine-in
  const [selectedLocation, setSelectedLocation] = useState('')

  // Auto-select first location if only one active location exists
  useEffect(() => {
    const activeLocations = data?.locations?.filter(loc => loc.isActive !== false) || []
    if (activeLocations.length === 1) {
      setSelectedLocation(activeLocations[0].id)
    }
  }, [data?.locations])

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash') // stripe | cash

  const clientId = data?.client?.id

  // Loyalty state
  const [showLoyaltyInfo, setShowLoyaltyInfo] = useState(false)
  const [redeemedReward, setRedeemedReward] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  if (totalItems === 0) {
    return (
      <LoyaltyProvider clientId={clientId} loyaltyConfig={data?.loyaltyConfig}>
        <CMSProvider data={data}>
          <Head>
            <title>Checkout - {normalizedTemplate === 'theme-d1' ? 'Your Cart is Empty' : normalizedTemplate === 'theme-d2' ? 'Your Cart is Empty' : 'Your Harvest is Empty'}</title>
          </Head>
          <div className="min-h-screen bg-[var(--color-accent)]">
            <Header />
            <div className="min-h-[60vh] flex items-center justify-center px-6 pt-32 pb-24">
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingCart width={32} height={32} strokeWidth={2} className="text-[var(--color-primary)]/40" />
                </div>
                <div>
                  <h1 className="font-serif text-5xl italic text-[var(--color-secondary)] mb-4">
                    {normalizedTemplate === 'theme-d1' ? 'Your cart is empty' : normalizedTemplate === 'theme-d2' ? 'Your cart is empty' : 'Your harvest is empty'}
                  </h1>
                  <p className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">ADD ITEMS FROM THE MENU</p>
                </div>
                <button
                  onClick={() => router.push(`/menu?site=${router.query.site}`)}
                  className="px-8 py-4 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg inline-flex items-center gap-3"
                >
                  <ArrowLeft width={18} height={18} strokeWidth={2} />
                  BROWSE MENU
                </button>
              </div>
            </div>
            <Footer />
          </div>
        </CMSProvider>
      </LoyaltyProvider>
    )
  }

  const siteName = data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''

  return (
    <LoyaltyProvider clientId={clientId} loyaltyConfig={data?.loyaltyConfig}>
      <CheckoutContentWrapper data={data} siteName={siteName} router={router} Header={Header} Footer={Footer} normalizedTemplate={normalizedTemplate} />
    </LoyaltyProvider>
  )
}

function CheckoutContentWrapper({ data, siteName, router, Header, Footer, normalizedTemplate }) {
  const { customer, loyaltyConfig, lookupCustomer, upsertCustomer, redeemReward, canRedeemReward, getPointsToNextReward, isLoyaltyEnabled } = useLoyalty()
  return <CheckoutContent 
    data={data} 
    siteName={siteName} 
    router={router} 
    customer={customer} 
    loyaltyConfig={loyaltyConfig} 
    lookupCustomer={lookupCustomer} 
    upsertCustomer={upsertCustomer} 
    redeemReward={redeemReward} 
    canRedeemReward={canRedeemReward} 
    getPointsToNextReward={getPointsToNextReward} 
    isLoyaltyEnabled={isLoyaltyEnabled}
    Header={Header}
    Footer={Footer}
    normalizedTemplate={normalizedTemplate}
  />
}

function CheckoutContent({ data, siteName, router, customer, loyaltyConfig, lookupCustomer, upsertCustomer, redeemReward, canRedeemReward, getPointsToNextReward, isLoyaltyEnabled, Header, Footer, normalizedTemplate }) {
  const { items, totalItems, subtotal, taxAmount, taxRate, taxLabel, total, clearCart, ordering } = useCart()
  const paymentGateway = data?.paymentGateway || {}

  // Check if ordering is enabled
  const isOrderingEnabled = data?.ordering?.enabled !== false

  const [step, setStep] = useState(1) // 1: Info, 2: Pickup, 3: Payment
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [stripePromise, setStripePromise] = useState(null)

  // Initialize Stripe with publishable key
  useEffect(() => {
    if (paymentGateway?.isActive && paymentGateway?.provider === 'stripe') {
      const publishableKey = paymentGateway.testMode 
        ? paymentGateway.testPublishableKey 
        : paymentGateway.livePublishableKey
      
      if (publishableKey) {
        setStripePromise(loadStripe(publishableKey))
      }
    }
  }, [paymentGateway])

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    note: ''
  })

  // Pickup info
  const [pickupType, setPickupType] = useState('asap') // asap | scheduled
  const [scheduledTime, setScheduledTime] = useState('')
  const [orderType, setOrderType] = useState('pickup') // pickup | delivery | dine-in
  const [selectedLocation, setSelectedLocation] = useState('')

  // Auto-select first location if only one active location exists
  useEffect(() => {
    const activeLocations = data?.locations?.filter(loc => loc.isActive !== false) || []
    if (activeLocations.length === 1) {
      setSelectedLocation(activeLocations[0].id)
    }
  }, [data?.locations])

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash') // stripe | cash

  // Loyalty state
  const [showLoyaltyInfo, setShowLoyaltyInfo] = useState(false)
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [redeemedReward, setRedeemedReward] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  const handlePlaceOrder = async () => {
    setLoading(true)
    setError(null)

    try {
      const siteId = router.query.site
      const clientId = data?.client?.id

      if (!clientId) {
        throw new Error('Client ID not found')
      }

      // Ensure customer exists in loyalty system
      let loyaltyCustomerId = null
      if (isLoyaltyEnabled && customerInfo.phone) {
        const createdCustomer = await upsertCustomer(customerInfo.phone, customerInfo.name, customerInfo.email)
        loyaltyCustomerId = createdCustomer?.id
      }

      const orderData = {
        items,
        subtotal,
        taxAmount,
        total: totalWithDiscount,
        currency: paymentGateway.currency || 'AUD',
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        orderType,
        pickupTime: pickupType === 'scheduled' ? scheduledTime : null,
        paymentMethod,
        note: customerInfo.note,
        deliveryFee: orderType === 'delivery' ? (ordering?.deliveryFee || 0) : 0,
        locationId: selectedLocation || null,
        loyaltyCustomerId,
        pointsUsed: redeemedReward ? redeemedReward.pointsRequired : 0,
        rewardUsed: redeemedReward ? { id: redeemedReward.id, name: redeemedReward.name, discountValue: redeemedReward.discountValue } : null,
        discountAmount
      }

      // For Stripe, create order first then PaymentIntent
      if (paymentMethod === 'stripe') {
        const response = await fetch(`${CMS_API_URL}/clients/${clientId}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create order')
        }

        const result = await response.json()
        setOrderId(result.order.id)

        // Create PaymentIntent with discounted amount
        const paymentResponse = await fetch(`${CMS_API_URL}/clients/${clientId}/payments/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: result.orderId,
            amount: totalWithDiscount,
            currency: paymentGateway.currency || 'AUD'
          })
        })

        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment')
        }

        const paymentResult = await paymentResponse.json()
        setClientSecret(paymentResult.clientSecret)
        setLoading(false)
      } else {
        // Cash payment - create order and redirect
        const response = await fetch(`${CMS_API_URL}/clients/${clientId}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create order')
        }

        const result = await response.json()
        router.push(`/order/${result.order.id}?site=${siteId}`)
        // Clear cart after redirect to prevent empty cart flash
        setTimeout(() => clearCart(), 100)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent) => {
    const siteId = router.query.site
    router.push(`/order/${orderId}?site=${siteId}`)
    // Clear cart after redirect to prevent empty cart flash
    setTimeout(() => clearCart(), 100)
  }

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage)
  }

  // Lookup customer when phone changes
  useEffect(() => {
    if (customerInfo.phone && isLoyaltyEnabled) {
      const timer = setTimeout(() => {
        lookupCustomer(customerInfo.phone)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [customerInfo.phone, isLoyaltyEnabled, lookupCustomer])

  // Calculate total with discount
  const totalWithDiscount = total - discountAmount

  const isStepValid = () => {
    if (step === 1) {
      return customerInfo.name && customerInfo.email && customerInfo.phone &&
             (!ordering?.requirePhone || customerInfo.phone) &&
             (!ordering?.requireEmail || customerInfo.email)
    }
    if (step === 2) {
      const activeLocations = data?.locations?.filter(loc => loc.isActive !== false) || []
      const locationRequired = activeLocations.length > 1
      const locationValid = !locationRequired || selectedLocation
      return (pickupType === 'asap' || (pickupType === 'scheduled' && scheduledTime)) && locationValid
    }
    if (step === 3) {
      return (paymentMethod === 'cash' && paymentGateway.cashEnabled !== false) || (paymentMethod === 'stripe' && paymentGateway.isActive)
    }
    return false
  }

  // Show ordering disabled message
  if (!isOrderingEnabled) {
    return (
      <CMSProvider data={data}>
        <Head>
          <title>Orders Unavailable - {siteName}</title>
        </Head>
        <div className="min-h-screen bg-[var(--color-accent)]">
          <Header />
          
          {/* Theme-specific Hero */}
          {normalizedTemplate === 'theme-d1' && (
            <div className="relative bg-[var(--color-primary)] py-32 px-6 text-center text-white overflow-hidden">
              <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                <h1 className="font-serif text-5xl md:text-7xl leading-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  Orders Temporarily Unavailable
                </h1>
                <p className="max-w-2xl mx-auto text-white/90 font-light text-xl leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  We're not accepting orders at the moment
                </p>
              </div>
              {/* Decorative bottom wave */}
              <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                </svg>
              </div>
            </div>
          )}
          
          {normalizedTemplate === 'theme-d2' && (
            <div className="relative bg-gradient-to-br from-teal-50 to-cyan-100 py-32 px-6 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
              <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-3 text-teal-600 font-sans font-semibold text-sm uppercase tracking-wider">
                  <div className="w-8 h-0.5 bg-teal-600"></div>
                  <span>Orders Unavailable</span>
                  <div className="w-8 h-0.5 bg-teal-600"></div>
                </div>
                <h1 className="font-sans text-5xl md:text-7xl font-bold leading-tight text-gray-900">
                  Sorry, Not Accepting Orders
                </h1>
                <p className="max-w-2xl mx-auto text-gray-600 font-medium text-lg leading-relaxed">
                  We're temporarily unable to accept online orders
                </p>
              </div>
            </div>
          )}
          
          {normalizedTemplate === 'theme-d3' && (
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-32 px-6 text-center text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                <h1 className="font-serif text-5xl md:text-7xl leading-tight">
                  Orders Unavailable
                </h1>
                <p className="max-w-2xl mx-auto text-gray-300 font-light text-xl leading-relaxed">
                  We're not accepting orders at the moment
                </p>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Sorry, Not Accepting Orders at the Moment
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                We're temporarily unable to accept online orders. Please check back later or call us directly to place your order.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/?site=' + router.query.site)}
                  className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary)]/90 transition-colors"
                >
                  Return to Menu
                </button>
                {data?.settings?.phone && (
                  <a
                    href={`tel:${data.settings.phone}`}
                    className="px-8 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                  >
                    Call Us: {data.settings.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <Footer />
        </div>
      </CMSProvider>
    )
  }

  return (
    <CMSProvider data={data}>
      <Head>
        <title>Checkout - {siteName}</title>
      </Head>
      <div className="min-h-screen bg-[var(--color-accent)]">
        <Header />
        
        {/* Theme-specific Hero */}
        {normalizedTemplate === 'theme-d1' && (
          <div className="relative bg-[var(--color-primary)] py-32 px-6 text-center text-white overflow-hidden">
            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
              <h1 className="font-serif text-5xl md:text-7xl leading-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                Checkout
              </h1>
              <p className="max-w-2xl mx-auto text-white/90 font-light text-xl leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                Complete your order with our secure checkout process
              </p>
            </div>
            {/* Decorative bottom wave */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
              </svg>
            </div>
          </div>
        )}
        
        {normalizedTemplate === 'theme-d2' && (
          <div className="relative bg-gradient-to-br from-teal-50 to-cyan-100 py-32 px-6 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-3 text-teal-600 font-sans font-semibold text-sm uppercase tracking-wider">
                <div className="w-8 h-0.5 bg-teal-600"></div>
                <span>Modern Dining</span>
                <div className="w-8 h-0.5 bg-teal-600"></div>
              </div>
              <h1 className="font-sans text-5xl md:text-7xl font-bold leading-tight text-gray-900">
                Checkout
              </h1>
              <p className="max-w-2xl mx-auto text-gray-600 font-medium text-lg leading-relaxed">
                Secure and convenient payment experience
              </p>
            </div>
          </div>
        )}
        
        {(normalizedTemplate === 'theme-d3' || !['theme-d1', 'theme-d2'].includes(normalizedTemplate)) && (
          <div className="relative bg-[var(--color-secondary)] py-48 px-6 text-center text-[var(--color-accent)] overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
              <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2033&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-4 text-[var(--color-primary)] font-sans font-semibold uppercase tracking-[0.4em] text-[10px]">
                <Sparkles width={16} height={16} strokeWidth={2} />
                <span>The Harvest</span>
              </div>
              <h1 className="font-serif text-6xl md:text-[120px] leading-[0.8] tracking-tight">
                <span className="italic text-[var(--color-primary)]">Checkout</span>
              </h1>
              <p className="max-w-xl mx-auto text-[var(--color-accent)]/60 font-sans text-sm font-light leading-relaxed">
                Complete your harvest collection
              </p>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 pb-24">

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-[32px] mb-8 text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Form Steps */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Customer Info */}
            <div className={`${normalizedTemplate === 'theme-d1' ? 'bg-white border-[var(--color-secondary)]/20' : normalizedTemplate === 'theme-d2' ? 'bg-white border-teal-200' : 'bg-white'} rounded-[48px] border p-8 transition-all ${step === 1 ? (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)] shadow-[var(--color-secondary)]/20' : normalizedTemplate === 'theme-d2' ? 'border-teal-500 shadow-teal-500/20' : 'border-[var(--color-primary)]') + ' shadow-xl' : (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)]/10' : normalizedTemplate === 'theme-d2' ? 'border-teal-200' : 'border-[var(--color-secondary)]/10')}`}>
              <button 
                onClick={() => setStep(1)}
                className="w-full flex items-center gap-4 mb-8 bg-none border-none cursor-pointer p-0"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step >= 1 ? (normalizedTemplate === 'theme-d1' ? 'bg-[var(--color-secondary)] text-white' : normalizedTemplate === 'theme-d2' ? 'bg-teal-500 text-white' : 'bg-[var(--color-primary)] text-[var(--color-accent)]') : (normalizedTemplate === 'theme-d1' ? 'bg-gray-200 text-gray-500' : normalizedTemplate === 'theme-d2' ? 'bg-gray-200 text-gray-500' : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]/60')}`}>
                  {step > 1 ? <Check width={20} height={20} strokeWidth={2} /> : '1'}
                </div>
                <h2 className={`font-serif text-2xl italic ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-primary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-secondary)]'}`}>Customer Information</h2>
              </button>

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className={`block font-sans text-[10px] font-bold tracking-widest uppercase mb-2 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className={`w-full px-6 py-4 rounded-full focus:outline-none font-sans ${normalizedTemplate === 'theme-d1' ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-teal-500' : 'bg-[var(--color-accent)] border-[var(--color-secondary)]/20 text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 focus:border-[var(--color-primary)]'}`}
                      placeholder="YOUR NAME"
                    />
                  </div>

                  <div>
                    <label className={`block font-sans text-[10px] font-bold tracking-widest uppercase mb-2 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>Email *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className={`w-full px-6 py-4 rounded-full focus:outline-none font-sans ${normalizedTemplate === 'theme-d1' ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-teal-500' : 'bg-[var(--color-accent)] border-[var(--color-secondary)]/20 text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 focus:border-[var(--color-primary)]'}`}
                      placeholder="YOUR@EMAIL.COM"
                    />
                  </div>

                  <div>
                    <label className={`block font-sans text-[10px] font-bold tracking-widest uppercase mb-2 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>Phone *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className={`w-full px-6 py-4 rounded-full focus:outline-none font-sans ${normalizedTemplate === 'theme-d1' ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-teal-500' : 'bg-[var(--color-accent)] border-[var(--color-secondary)]/20 text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 focus:border-[var(--color-primary)]'}`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {/* Loyalty info display */}
                    {isLoyaltyEnabled && customerInfo.phone && (
                      customer ? (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-full">
                          <div className="flex items-center gap-3 mb-2">
                            <Star width={16} height={16} strokeWidth={2} className="text-green-600" />
                            <span className="text-sm font-bold text-green-700">
                              Welcome back! You have {customer.points} points
                            </span>
                          </div>
                          {getPointsToNextReward() && (
                            <p className="text-xs text-green-600">
                              Only {getPointsToNextReward().pointsNeeded} more points for {getPointsToNextReward().reward.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-full">
                          <div className="flex items-center gap-3">
                            <Gift width={16} height={16} strokeWidth={2} className="text-amber-600" />
                            <span className="text-sm font-bold text-amber-800">
                              Join our loyalty program!
                            </span>
                          </div>
                          <p className="text-xs text-amber-700 mt-2">
                            Earn points with every order and redeem rewards
                          </p>
                          <button
                            onClick={() => setShowLoyaltyModal(true)}
                            className="mt-3 px-4 py-2 bg-transparent text-amber-600 border border-amber-600 rounded-full text-[10px] font-bold tracking-widest uppercase cursor-pointer hover:bg-amber-600 hover:text-white transition-colors"
                          >
                            Learn More
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] font-bold tracking-widest text-[var(--color-primary)] uppercase mb-2">Special Instructions (optional)</label>
                    <textarea
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] placeholder:text-[var(--color-secondary)]/40 resize-none font-sans"
                      placeholder="ANY SPECIAL REQUESTS OR DIETARY REQUIREMENTS..."
                      rows={3}
                    />
                  </div>

                  {/* Rewards Redemption Section */}
                  {isLoyaltyEnabled && customer && loyaltyConfig?.rewards?.length > 0 && (
                    <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-[32px]">
                      <div className="flex items-center gap-3 mb-6">
                        <Gift width={20} height={20} strokeWidth={2} className="text-amber-600" />
                        <span className="font-serif text-xl italic text-amber-800">Rewards Available</span>
                      </div>
                      {redeemedReward ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-full">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-green-700">
                              {redeemedReward.name} applied
                            </span>
                            <button
                              onClick={() => {
                                setRedeemedReward(null)
                                setDiscountAmount(0)
                              }}
                              className="px-4 py-2 bg-red-500 text-white border-none rounded-full text-xs font-bold cursor-pointer hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="text-sm text-green-600 mt-2">
                            -${redeemedReward.discountValue.toFixed(2)} discount
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {loyaltyConfig.rewards.map(reward => {
                            const canRedeem = canRedeemReward(reward)
                            return (
                              <button
                                key={reward.id}
                                onClick={() => {
                                  setRedeemedReward(reward)
                                  setDiscountAmount(reward.discountType === 'percentage' 
                                    ? total * (reward.discountValue / 100)
                                    : reward.discountValue
                                  )
                                }}
                                disabled={!canRedeem}
                                className={`p-4 border rounded-full text-left transition-all ${
                                  canRedeem 
                                    ? 'border-amber-400 bg-amber-50 cursor-pointer hover:bg-amber-100' 
                                    : 'border-[var(--color-secondary)]/20 bg-[var(--color-accent)] cursor-not-allowed opacity-60'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className={`font-bold ${canRedeem ? 'text-amber-800' : 'text-[var(--color-secondary)]/60'}`}>
                                      {reward.name}
                                    </div>
                                    <div className={`text-xs ${canRedeem ? 'text-amber-600' : 'text-[var(--color-secondary)]/40'}`}>
                                      {reward.pointsRequired} points
                                    </div>
                                  </div>
                                  <div className={`font-bold ${canRedeem ? 'text-green-600' : 'text-[var(--color-secondary)]/40'}`}>
                                    {reward.discountType === 'percentage' 
                                      ? `${reward.discountValue}% OFF`
                                      : `$${reward.discountValue.toFixed(2)} OFF`
                                    }
                                  </div>
                                </div>
                                {!canRedeem && (
                                  <div className="text-xs text-[var(--color-secondary)]/40 mt-2">
                                    Need {reward.pointsRequired - customer.points} more points
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setStep(2)}
                    disabled={!isStepValid()}
                    className={`w-full py-5 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      normalizedTemplate === 'theme-d1' 
                        ? 'bg-amber-400 text-gray-900 hover:bg-amber-500' 
                        : normalizedTemplate === 'theme-d2' 
                        ? 'bg-teal-500 text-white hover:bg-teal-600' 
                        : 'bg-[var(--color-primary)] text-[var(--color-accent)] hover:bg-[var(--color-secondary)]'
                    }`}
                  >
                    CONTINUE TO PICKUP
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Pickup Info */}
            <div className={`${normalizedTemplate === 'theme-d1' ? 'bg-white border-[var(--color-secondary)]/20' : normalizedTemplate === 'theme-d2' ? 'bg-white border-teal-200' : 'bg-white'} rounded-[48px] border p-8 transition-all ${step === 2 ? (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)] shadow-[var(--color-secondary)]/20' : normalizedTemplate === 'theme-d2' ? 'border-teal-500 shadow-teal-500/20' : 'border-[var(--color-primary)]') + ' shadow-xl' : (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)]/10' : normalizedTemplate === 'theme-d2' ? 'border-teal-200' : 'border-[var(--color-secondary)]/10')}`}>
              <button 
                onClick={() => step >= 2 && setStep(2)}
                disabled={step < 2}
                className="w-full flex items-center gap-4 mb-8 bg-none border-none cursor-pointer p-0 disabled:cursor-not-allowed"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step >= 2 ? (normalizedTemplate === 'theme-d1' ? 'bg-[var(--color-secondary)] text-white' : normalizedTemplate === 'theme-d2' ? 'bg-teal-500 text-white' : 'bg-[var(--color-primary)] text-[var(--color-accent)]') : (normalizedTemplate === 'theme-d1' ? 'bg-gray-200 text-gray-500' : normalizedTemplate === 'theme-d2' ? 'bg-gray-200 text-gray-500' : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]/60')}`}>
                  {step > 2 ? <Check width={20} height={20} strokeWidth={2} /> : '2'}
                </div>
                <h2 className={`font-serif text-2xl italic ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-primary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-secondary)]'}`}>Pickup Information</h2>
              </button>

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className={`block font-sans text-[10px] font-bold tracking-widest uppercase mb-4 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>Order Type</label>
                    <div className="flex gap-4">
                      {(ordering?.orderTypes || ['pickup']).map(type => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          className={`flex-1 px-6 py-4 border rounded-full font-sans font-bold text-sm transition-all ${
                            orderType === type 
                              ? (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'border-teal-500 bg-teal-500/10 text-teal-500' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]') 
                              : (normalizedTemplate === 'theme-d1' ? 'border-gray-300 bg-white text-gray-700 hover:border-[var(--color-secondary)]/50' : normalizedTemplate === 'theme-d2' ? 'border-gray-300 bg-white text-gray-700 hover:border-teal-500/50' : 'border-[var(--color-secondary)]/20 bg-white text-[var(--color-secondary)] hover:border-[var(--color-primary)]/50')
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={`block font-sans text-[10px] font-bold tracking-widest uppercase mb-4 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>Pickup Time</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPickupType('asap')}
                        className={`flex-1 px-6 py-4 border rounded-full font-sans font-bold text-sm transition-all flex items-center justify-center gap-3 ${
                          pickupType === 'asap' 
                            ? (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'border-teal-500 bg-teal-500/10 text-teal-500' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]') 
                            : (normalizedTemplate === 'theme-d1' ? 'border-gray-300 bg-white text-gray-700 hover:border-[var(--color-secondary)]/50' : normalizedTemplate === 'theme-d2' ? 'border-gray-300 bg-white text-gray-700 hover:border-teal-500/50' : 'border-[var(--color-secondary)]/20 bg-white text-[var(--color-secondary)] hover:border-[var(--color-primary)]/50')
                        }`}
                      >
                        <Clock width={18} height={18} strokeWidth={2} />
                        ASAP
                      </button>
                      <button
                        onClick={() => setPickupType('scheduled')}
                        className={`flex-1 px-6 py-4 border rounded-full font-sans font-bold text-sm transition-all flex items-center justify-center gap-3 ${
                          pickupType === 'scheduled' 
                            ? (normalizedTemplate === 'theme-d1' ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'border-teal-500 bg-teal-500/10 text-teal-500' : 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]') 
                            : (normalizedTemplate === 'theme-d1' ? 'border-gray-300 bg-white text-gray-700 hover:border-[var(--color-secondary)]/50' : normalizedTemplate === 'theme-d2' ? 'border-gray-300 bg-white text-gray-700 hover:border-teal-500/50' : 'border-[var(--color-secondary)]/20 bg-white text-[var(--color-secondary)] hover:border-[var(--color-primary)]/50')
                        }`}
                      >
                        <Calendar width={18} height={18} strokeWidth={2} />
                        Scheduled
                      </button>
                    </div>
                  </div>

                  {pickupType === 'scheduled' && (
                    <div>
                      <label className="block font-sans text-[10px] font-bold tracking-widest text-[var(--color-primary)] uppercase mb-2">Pickup Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] font-sans"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}

                  {/* Location dropdown - show only if multiple active locations */}
                  {data?.locations && data.locations.filter(loc => loc.isActive !== false).length > 1 && (
                    <div>
                      <label className="block font-sans text-[10px] font-bold tracking-widest text-[var(--color-primary)] uppercase mb-2">Select Location *</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-6 py-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/20 rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-secondary)] font-sans"
                        required
                      >
                        <option value="">Choose a location...</option>
                        {data.locations.filter(loc => loc.isActive !== false).map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {ordering?.estimatedPrepTime && (
                    <p className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/40 uppercase flex items-center gap-3">
                      <Clock width={14} height={14} strokeWidth={2} />
                      Estimated prep time: {ordering.estimatedPrepTime}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-white border border-[var(--color-secondary)]/20 rounded-full font-sans font-bold text-sm text-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!isStepValid()}
                      className="flex-1 py-4 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CONTINUE TO PAYMENT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div className={`bg-white rounded-[48px] border p-8 transition-all ${step === 3 ? 'border-[var(--color-primary)] shadow-xl' : 'border-[var(--color-secondary)]/10'}`}>
              <button 
                onClick={() => step >= 3 && setStep(3)}
                disabled={step < 3}
                className="w-full flex items-center gap-4 mb-8 bg-none border-none cursor-pointer p-0 disabled:cursor-not-allowed"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[var(--color-primary)] text-[var(--color-accent)]' : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]/60'}`}>
                  {step > 3 ? <Check width={20} height={20} strokeWidth={2} /> : '3'}
                </div>
                <h2 className="font-serif text-2xl italic text-[var(--color-secondary)]">Payment</h2>
              </button>

              {step === 3 && (
                <div className="space-y-4">
                  {paymentGateway.cashEnabled !== false && (
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`w-full p-6 border rounded-full font-sans font-bold text-sm transition-all flex items-center gap-4 ${
                        paymentMethod === 'cash' 
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                          : 'border-[var(--color-secondary)]/20 bg-white text-[var(--color-secondary)] hover:border-[var(--color-primary)]/50'
                      }`}
                    >
                      <DollarSign width={24} height={24} strokeWidth={2} />
                      <div className="text-left flex-1">
                        <div>{paymentGateway.cashLabel || 'Pay at Pickup'}</div>
                        <div className="text-xs font-normal text-[var(--color-secondary)]/60">Pay when you pick up your order</div>
                      </div>
                      {paymentMethod === 'cash' && <Check width={24} height={24} strokeWidth={2} className="text-[var(--color-primary)]" />}
                    </button>
                  )}

                  {paymentGateway.isActive && paymentGateway.provider === 'stripe' && (
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full p-6 border rounded-full font-sans font-bold text-sm transition-all flex items-center gap-4 ${
                        paymentMethod === 'stripe' 
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                          : 'border-[var(--color-secondary)]/20 bg-white text-[var(--color-secondary)] hover:border-[var(--color-primary)]/50'
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        <CreditCard width={24} height={24} strokeWidth={2} />
                        <span className="text-2xl">💳</span>
                      </div>
                      <div className="text-left flex-1">
                        <div>Card Payment</div>
                        <div className="text-xs font-normal text-[var(--color-secondary)]/60 flex items-center gap-2">
                          <span>Visa</span>
                          <span>•</span>
                          <span>Mastercard</span>
                          <span>•</span>
                          <span>Amex</span>
                          <span>•</span>
                          <span>Apple Pay</span>
                          <span>•</span>
                          <span>Google Pay</span>
                        </div>
                      </div>
                      {paymentMethod === 'stripe' && <Check width={24} height={24} strokeWidth={2} className="text-[var(--color-primary)]" />}
                    </button>
                  )}

                  {paymentMethod === 'stripe' && clientSecret && stripePromise && (
                    <div className="mt-6">
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripeCheckoutForm 
                          clientSecret={clientSecret}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </div>
                  )}

                  {paymentMethod === 'stripe' && !clientSecret && (
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="w-full py-5 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {loading ? <Loader2 width={18} height={18} strokeWidth={2} className="animate-spin" /> : 'CONTINUE TO PAYMENT'}
                    </button>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-4 bg-white border border-[var(--color-secondary)]/20 rounded-full font-sans font-bold text-sm text-[var(--color-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Back
                    </button>
                    {paymentMethod === 'cash' && (
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!isStepValid() || loading}
                        className="flex-1 py-5 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <Loader2 width={18} height={18} strokeWidth={2} className="animate-spin" /> : 'PLACE ORDER'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className={`${normalizedTemplate === 'theme-d1' ? 'bg-white border-[var(--color-secondary)]/20' : normalizedTemplate === 'theme-d2' ? 'bg-white border-teal-200' : 'bg-white'} rounded-[48px] border p-8 sticky top-8`}>
              <h2 className={`font-serif text-2xl italic mb-8 flex items-center gap-3 ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-primary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-secondary)]'}`}>
                <ShoppingCart width={24} height={24} strokeWidth={2} />
                {normalizedTemplate === 'theme-d1' ? 'Order Summary' : normalizedTemplate === 'theme-d2' ? 'Your Order' : 'Your Harvest'}
              </h2>

              <div className="flex flex-col gap-4 mb-8 max-h-[300px] overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className={`font-serif text-lg italic ${normalizedTemplate === 'theme-d1' ? 'text-gray-900' : normalizedTemplate === 'theme-d2' ? 'text-gray-900' : 'text-[var(--color-secondary)]'}`}>{item.name}</div>
                      <div className={`text-xs font-sans font-bold tracking-widest uppercase ${normalizedTemplate === 'theme-d1' ? 'text-gray-500' : normalizedTemplate === 'theme-d2' ? 'text-gray-500' : 'text-[var(--color-secondary)]/60'}`}>Qty: {item.quantity}</div>
                    </div>
                    <div className={`font-sans font-bold ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-secondary)]'}`}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className={`border-t pt-8 space-y-4 ${normalizedTemplate === 'theme-d1' ? 'border-amber-200' : normalizedTemplate === 'theme-d2' ? 'border-teal-200' : 'border-[var(--color-secondary)]/10'}`}>
                <div className="flex justify-between">
                  <span className={`text-xs font-sans font-bold tracking-widest uppercase ${normalizedTemplate === 'theme-d1' ? 'text-gray-500' : normalizedTemplate === 'theme-d2' ? 'text-gray-500' : 'text-[var(--color-secondary)]/60'}`}>Subtotal</span>
                  <span className={`font-sans font-bold ${normalizedTemplate === 'theme-d1' ? 'text-gray-900' : normalizedTemplate === 'theme-d2' ? 'text-gray-900' : 'text-[var(--color-secondary)]'}`}>${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className={`text-xs font-sans font-bold tracking-widest uppercase ${normalizedTemplate === 'theme-d1' ? 'text-gray-500' : normalizedTemplate === 'theme-d2' ? 'text-gray-500' : 'text-[var(--color-secondary)]/60'}`}>{taxLabel} ({taxRate}%)</span>
                    <span className={`font-sans font-bold ${normalizedTemplate === 'theme-d1' ? 'text-gray-900' : normalizedTemplate === 'theme-d2' ? 'text-gray-900' : 'text-[var(--color-secondary)]'}`}>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {orderType === 'delivery' && ordering?.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className={`text-xs font-sans font-bold tracking-widest uppercase ${normalizedTemplate === 'theme-d1' ? 'text-gray-500' : normalizedTemplate === 'theme-d2' ? 'text-gray-500' : 'text-[var(--color-secondary)]/60'}`}>Delivery Fee</span>
                    <span className={`font-sans font-bold ${normalizedTemplate === 'theme-d1' ? 'text-gray-900' : normalizedTemplate === 'theme-d2' ? 'text-gray-900' : 'text-[var(--color-secondary)]'}`}>${ordering.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {redeemedReward && (
                  <div className="flex justify-between">
                    <span className="text-xs font-sans font-bold tracking-widest text-green-600 uppercase">Loyalty Discount ({redeemedReward.name})</span>
                    <span className="text-xs font-sans font-bold tracking-widest text-green-600 uppercase">{discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : '$0.00'}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <span className={`font-serif text-2xl italic ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-primary)]' : normalizedTemplate === 'theme-d2' ? 'text-gray-900' : 'text-[var(--color-secondary)]'}`}>Total</span>
                  <span className={`font-serif text-2xl italic ${normalizedTemplate === 'theme-d1' ? 'text-[var(--color-secondary)]' : normalizedTemplate === 'theme-d2' ? 'text-teal-600' : 'text-[var(--color-primary)]'}`}>${totalWithDiscount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Info Modal */}
        {showLoyaltyModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-[var(--color-secondary)]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-6">
            <div className="bg-white rounded-[48px] max-w-[500px] w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-serif text-3xl italic text-[var(--color-secondary)] flex items-center gap-3">
                  <Gift width={28} height={28} strokeWidth={2} className="text-[var(--color-primary)]" />
                  Loyalty Program
                </h2>
                <button
                  onClick={() => setShowLoyaltyModal(false)}
                  className="bg-none border-none cursor-pointer p-2 hover:bg-[var(--color-accent)] rounded-full transition-colors"
                >
                  <X width={24} height={24} strokeWidth={2} className="text-[var(--color-secondary)]/60" />
                </button>
              </div>

              <div className="mb-8">
                <p className="font-sans text-sm text-[var(--color-secondary)] leading-relaxed mb-6">
                  Earn points with every order and redeem them for exclusive rewards!
                </p>
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-[32px] mb-8">
                  <div className="font-sans text-[10px] font-bold tracking-widest text-amber-800 uppercase mb-4">
                    How it works:
                  </div>
                  <ul className="font-sans text-xs text-amber-700 space-y-2 pl-6 leading-relaxed">
                    <li>Earn <strong>{loyaltyConfig?.pointsPerDollar || 1} point</strong> for every $1 spent</li>
                    <li>Points are automatically added to your account after each order</li>
                    <li>Redeem points for discounts and free items</li>
                    <li>No expiration on your points</li>
                  </ul>
                </div>

                {loyaltyConfig?.rewards?.length > 0 && (
                  <div>
                    <div className="font-sans text-[10px] font-bold tracking-widest text-[var(--color-secondary)] uppercase mb-4">
                      Available Rewards:
                    </div>
                    <div className="flex flex-col gap-4">
                      {loyaltyConfig.rewards.map(reward => (
                        <div key={reward.id} className="flex justify-between items-center p-4 bg-[var(--color-accent)] border border-[var(--color-secondary)]/10 rounded-full">
                          <div>
                            <div className="font-serif text-lg italic text-[var(--color-secondary)]">{reward.name}</div>
                            <div className="text-xs font-sans font-bold tracking-widest text-[var(--color-secondary)]/60 uppercase">{reward.pointsRequired} points</div>
                          </div>
                          <div className="font-sans font-bold text-green-600">
                            {reward.discountType === 'percentage' 
                              ? `${reward.discountValue}% OFF`
                              : `$${reward.discountValue.toFixed(2)} OFF`
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLoyaltyModal(false)}
                className="w-full py-5 bg-[var(--color-primary)] text-[var(--color-accent)] rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[var(--color-secondary)] transition-all duration-300 shadow-lg"
              >
                GOT IT!
              </button>
            </div>
          </div>
        )}
        </div>
        <Footer />
      </div>
    </CMSProvider>
  )
}
