import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getSiteData, CMS_API_URL } from '../lib/api'
import { CMSProvider } from '../contexts/CMSContext'
import { LoyaltyProvider } from '../contexts/LoyaltyContext'
import { Header } from '../components/theme-d1/Header'
import { Footer } from '../components/theme-d1/Footer'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, CreditCard, DollarSign, Clock, User, Phone, Mail, Calendar, Check, X, Loader2, Gift, Star } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'

export async function getServerSideProps({ query }) {
  const rawSite = query.site
  const siteId = (rawSite && rawSite !== 'undefined' && rawSite.trim() !== '')
    ? rawSite
    : (process.env.SITE_ID || '')
  const data = await getSiteData(siteId)
  return { props: { data } }
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
      <div style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: 8, marginTop: 12, background: '#f9fafb' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {error && (
        <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6 }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          marginTop: 12,
          padding: '12px 24px',
          background: (!stripe || loading) ? '#94a3b8' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: (!stripe || loading) ? 'not-allowed' : 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center'
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Pay Now'}
      </button>
    </form>
  )
}

export default function CheckoutPage({ data }) {
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
            <title>Checkout - Your Cart is Empty</title>
          </Head>
          <Header />
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <ShoppingCart size={64} style={{ color: '#ccc', margin: '0 auto 16px' }} />
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h1>
              <p style={{ color: '#666', marginBottom: 24 }}>Add items from the menu to proceed to checkout</p>
              <button
                onClick={() => router.push(`/?site=${router.query.site}`)}
                style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Browse Menu
              </button>
            </div>
          </div>
          <Footer />
        </CMSProvider>
      </LoyaltyProvider>
    )
  }

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
        rewardUsed: redeemedReward ? { id: redeemedReward.id, name: redeemedReward.name, discountValue: redeemedReward.discountValue } : null
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
        clearCart()
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handlePaymentSuccess = (paymentIntent) => {
    const siteId = router.query.site
    router.push(`/order/${orderId}?site=${siteId}`)
    clearCart()
  }

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage)
  }

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
      return paymentMethod === 'cash' || (paymentMethod === 'stripe' && paymentGateway.isActive)
    }
    return false
  }

  const siteName = data?.settings?.displayName || data?.settings?.restaurantName || data?.client?.name || ''

  return (
    <LoyaltyProvider clientId={clientId} loyaltyConfig={data?.loyaltyConfig}>
      <CheckoutContentWrapper data={data} siteName={siteName} router={router} />
    </LoyaltyProvider>
  )
}

function CheckoutContentWrapper({ data, siteName, router }) {
  const { customer, loyaltyConfig, lookupCustomer, upsertCustomer, redeemReward, canRedeemReward, getPointsToNextReward, isLoyaltyEnabled } = useLoyalty()
  return <CheckoutContent data={data} siteName={siteName} router={router} customer={customer} loyaltyConfig={loyaltyConfig} lookupCustomer={lookupCustomer} upsertCustomer={upsertCustomer} redeemReward={redeemReward} canRedeemReward={canRedeemReward} getPointsToNextReward={getPointsToNextReward} isLoyaltyEnabled={isLoyaltyEnabled} />
}

function CheckoutContent({ data, siteName, router, customer, loyaltyConfig, lookupCustomer, upsertCustomer, redeemReward, canRedeemReward, getPointsToNextReward, isLoyaltyEnabled }) {
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

  // Loyalty state
  const [showLoyaltyInfo, setShowLoyaltyInfo] = useState(false)
  const [redeemedReward, setRedeemedReward] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

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

  return (
    <CMSProvider data={data}>
      <Head>
        <title>Checkout - {siteName}</title>
        <style>{`
          @media (max-width: 768px) {
            .checkout-grid {
              grid-template-columns: 1fr !important;
            }
            .checkout-sticky {
              position: static !important;
            }
            .checkout-sticky > div {
              position: static !important;
            }
            .checkout-step {
              padding: 16px !important;
            }
            .checkout-input {
              padding: 12px !important;
              font-size: 16px !important;
            }
            .checkout-btn {
              padding: 14px 20px !important;
              font-size: 15px !important;
            }
          }
        `}</style>
      </Head>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 40px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Checkout</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Complete your order</p>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 24, color: '#991b1b' }}>
            {error}
          </div>
        )}

        <div className="checkout-grid" style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 340px' }}>
          {/* Left Column - Form Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Step 1: Customer Info */}
            <div className="checkout-step" style={{ background: 'white', borderRadius: 12, border: step === 1 ? '2px solid #2563eb' : '1px solid #e5e7eb', padding: 24 }}>
              <button 
                onClick={() => setStep(1)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: step === 1 ? 20 : 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= 1 ? '#2563eb' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= 1 ? 'white' : '#666', fontWeight: 600 }}>
                  {step > 1 ? <Check size={16} /> : '1'}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Customer Information</h2>
              </button>

              {step === 1 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      placeholder="Your phone number"
                    />
                    {/* Loyalty info display */}
                    {isLoyaltyEnabled && customer && (
                      <div style={{ marginTop: 12, padding: 12, background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Star size={16} style={{ color: '#059669' }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                            Welcome back! You have {customer.points} points
                          </span>
                        </div>
                        {getPointsToNextReward() && (
                          <p style={{ fontSize: 12, color: '#047857', margin: 0 }}>
                            Only {getPointsToNextReward().pointsNeeded} more points for {getPointsToNextReward().reward.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Special Instructions (optional)</label>
                    <textarea
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minHeight: 80, resize: 'vertical' }}
                      placeholder="Any special requests or dietary requirements..."
                    />
                  </div>

                  {/* Rewards Redemption Section */}
                  {isLoyaltyEnabled && customer && loyaltyConfig?.rewards?.length > 0 && (
                    <div style={{ marginTop: 8, padding: 16, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Gift size={18} style={{ color: '#d97706' }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#92400e' }}>Rewards Available</span>
                      </div>
                      {redeemedReward ? (
                        <div style={{ padding: 12, background: '#d1fae5', border: '1px solid #10b981', borderRadius: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                              {redeemedReward.name} applied
                            </span>
                            <button
                              onClick={() => {
                                setRedeemedReward(null)
                                setDiscountAmount(0)
                              }}
                              style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                          <div style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>
                            -${redeemedReward.discountValue.toFixed(2)} discount
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {loyaltyConfig.rewards.map(reward => {
                            const canRedeem = canRedeemReward(reward)
                            return (
                              <button
                                key={reward.id}
                                onClick={async () => {
                                  const result = await redeemReward(reward.id)
                                  if (result) {
                                    setRedeemedReward(reward)
                                    setDiscountAmount(reward.discountType === 'percentage' 
                                      ? total * (reward.discountValue / 100)
                                      : reward.discountValue
                                    )
                                  }
                                }}
                                disabled={!canRedeem}
                                style={{
                                  padding: 12,
                                  border: canRedeem ? '2px solid #f59e0b' : '1px solid #d1d5db',
                                  borderRadius: 6,
                                  background: canRedeem ? '#fffbeb' : '#f3f4f6',
                                  cursor: canRedeem ? 'pointer' : 'not-allowed',
                                  opacity: canRedeem ? 1 : 0.6,
                                  textAlign: 'left'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: canRedeem ? '#92400e' : '#6b7280' }}>
                                      {reward.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: canRedeem ? '#b45309' : '#9ca3af' }}>
                                      {reward.pointsRequired} points
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: canRedeem ? '#059669' : '#9ca3af' }}>
                                    {reward.discountType === 'percentage' 
                                      ? `${reward.discountValue}% OFF`
                                      : `$${reward.discountValue.toFixed(2)} OFF`
                                    }
                                  </div>
                                </div>
                                {!canRedeem && (
                                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
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
                    style={{ padding: '12px 24px', background: isStepValid() ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isStepValid() ? 'pointer' : 'not-allowed', width: '100%' }}
                  >
                    Continue to Pickup
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Pickup Info */}
            <div className="checkout-step" style={{ background: 'white', borderRadius: 12, border: step === 2 ? '2px solid #2563eb' : '1px solid #e5e7eb', padding: 24 }}>
              <button 
                onClick={() => step >= 2 && setStep(2)}
                disabled={step < 2}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: step === 2 ? 20 : 0, background: 'none', border: 'none', cursor: step >= 2 ? 'pointer' : 'not-allowed', padding: 0 }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= 2 ? '#2563eb' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= 2 ? 'white' : '#666', fontWeight: 600 }}>
                  {step > 2 ? <Check size={16} /> : '2'}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Pickup Information</h2>
              </button>

              {step === 2 && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Order Type</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {(ordering?.orderTypes || ['pickup']).map(type => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: orderType === type ? '2px solid #2563eb' : '1px solid #d1d5db',
                            borderRadius: 8,
                            background: orderType === type ? '#eff6ff' : 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pickup Time</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={() => setPickupType('asap')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          border: pickupType === 'asap' ? '2px solid #2563eb' : '1px solid #d1d5db',
                          borderRadius: 8,
                          background: pickupType === 'asap' ? '#eff6ff' : 'white',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <Clock size={16} />
                        ASAP
                      </button>
                      <button
                        onClick={() => setPickupType('scheduled')}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          border: pickupType === 'scheduled' ? '2px solid #2563eb' : '1px solid #d1d5db',
                          borderRadius: 8,
                          background: pickupType === 'scheduled' ? '#eff6ff' : 'white',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <Calendar size={16} />
                        Scheduled
                      </button>
                    </div>
                  </div>

                  {pickupType === 'scheduled' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Pickup Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}

                  {/* Location dropdown - show only if multiple active locations */}
                  {data?.locations && data.locations.filter(loc => loc.isActive !== false).length > 1 && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Select Location *</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
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
                    <p style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} />
                      Estimated prep time: {ordering.estimatedPrepTime}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setStep(1)}
                      style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!isStepValid()}
                      style={{ padding: '12px 24px', background: isStepValid() ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isStepValid() ? 'pointer' : 'not-allowed', flex: 1 }}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div className="checkout-step" style={{ background: 'white', borderRadius: 12, border: step === 3 ? '2px solid #2563eb' : '1px solid #e5e7eb', padding: 24 }}>
              <button 
                onClick={() => step >= 3 && setStep(3)}
                disabled={step < 3}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: step === 3 ? 20 : 0, background: 'none', border: 'none', cursor: step >= 3 ? 'pointer' : 'not-allowed', padding: 0 }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= 3 ? '#2563eb' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= 3 ? 'white' : '#666', fontWeight: 600 }}>
                  {step > 3 ? <Check size={16} /> : '3'}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Payment</h2>
              </button>

              {step === 3 && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {paymentGateway.cashEnabled !== false && (
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: paymentMethod === 'cash' ? '2px solid #2563eb' : '1px solid #d1d5db',
                        borderRadius: 8,
                        background: paymentMethod === 'cash' ? '#eff6ff' : 'white',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <DollarSign size={20} />
                      <div style={{ textAlign: 'left' }}>
                        <div>{paymentGateway.cashLabel || 'Pay at Pickup'}</div>
                        <div style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>Pay when you pick up your order</div>
                      </div>
                      {paymentMethod === 'cash' && <Check size={20} style={{ marginLeft: 'auto', color: '#2563eb' }} />}
                    </button>
                  )}

                  {paymentGateway.isActive && paymentGateway.provider === 'stripe' && (
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: paymentMethod === 'stripe' ? '2px solid #2563eb' : '1px solid #d1d5db',
                        borderRadius: 8,
                        background: paymentMethod === 'stripe' ? '#eff6ff' : 'white',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <CreditCard size={20} />
                        <span style={{ fontSize: 18, fontWeight: 500 }}>💳</span>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div>Card Payment</div>
                        <div style={{ fontSize: 12, fontWeight: 400, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                      {paymentMethod === 'stripe' && <Check size={20} style={{ color: '#2563eb' }} />}
                    </button>
                  )}

                  {paymentMethod === 'stripe' && clientSecret && stripePromise && (
                    <div style={{ marginTop: 12 }}>
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
                      style={{ padding: '12px 24px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12 }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue to Payment'}
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setStep(2)}
                      style={{ padding: '12px 24px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }}
                    >
                      Back
                    </button>
                    {paymentMethod === 'cash' && (
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!isStepValid() || loading}
                        style={{ padding: '12px 24px', background: isStepValid() && !loading ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isStepValid() && !loading ? 'pointer' : 'not-allowed', flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Place Order'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-sticky" style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={20} />
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {taxRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: '#666' }}>{taxLabel} ({taxRate}%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {orderType === 'delivery' && ordering?.deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: '#666' }}>Delivery Fee</span>
                    <span>${ordering.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: '#059669' }}>Loyalty Discount</span>
                    <span style={{ color: '#059669' }}>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, marginTop: 12 }}>
                  <span>Total</span>
                  <span>${totalWithDiscount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </CMSProvider>
  )
}
