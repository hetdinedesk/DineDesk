import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart, Settings, DollarSign, Truck, Clock, CreditCard, Mail, Server, Zap, AlertTriangle } from 'lucide-react'
import { getConfig, saveConfig } from '../api/config'
import { getPayments, savePayments } from '../api/payments'
import { C } from '../theme'

const labelStyle = { display:'block', fontSize:12, fontWeight:600, color:C.t2, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }
const inputStyle = { width:'100%', padding:'10px 12px', background:C.card, border:`1px solid ${C.border2}`, borderRadius:8, color:C.t0, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
const selectStyle = { ...inputStyle, cursor:'pointer' }
const hintStyle = { fontSize:11, color:C.t3, marginTop:4 }

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0' }}>
      <span style={{ fontSize:14, fontWeight:600, color:C.t0 }}>{label}</span>
      <button type='button' onClick={onChange}
        style={{
          width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
          background: checked ? C.green : C.border, position:'relative', transition:'background 0.2s'
        }}>
        <span style={{
          width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3,
          left: checked ? 23 : 3, transition:'left 0.15s', display:'block',
          boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
        }}/>
      </button>
    </div>
  )
}

export default function OnlineOrderingSection({ clientId, subsection = 'ordering-config' }) {
  const qc = useQueryClient()

  const { data: config = {} } = useQuery({
    queryKey: ['config', clientId],
    queryFn: () => getConfig(clientId),
    enabled: !!clientId
  })

  const { data: paymentConfig = {} } = useQuery({
    queryKey: ['payments', clientId],
    queryFn: () => getPayments(clientId),
    enabled: !!clientId
  })

  const defaultForm = {
    enabled: false,
    taxRate: 0,
    taxLabel: 'Tax',
    minOrderAmount: 0,
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    estimatedPrepTime: '15-25 min',
    acceptingOrders: true,
    pauseMessage: 'We are currently not accepting orders. Please try again later.',
    orderTypes: ['pickup'],
    requirePhone: true,
    requireEmail: true,
    notificationEmail: '',
    checkoutMessage: '',
    successMessage: 'Thank you for your order! We will notify you when it is ready.',
  }

  const [form, setForm] = useState({ ...defaultForm, ...(config.ordering || {}) })
  const savedRef = useRef({ ...defaultForm, ...(config.ordering || {}) })

  const defaultPaymentForm = {
    testSecretKey: '',
    liveSecretKey: '',
    testPublishableKey: '',
    livePublishableKey: '',
    cashEnabled: true,
    cashLabel: 'Pay at Pickup',
    testMode: true,
    currency: 'AUD'
  }

  const [paymentForm, setPaymentForm] = useState({ ...defaultPaymentForm, ...(paymentConfig.config || {}) })
  const paymentSavedRef = useRef({ ...defaultPaymentForm, ...(paymentConfig.config || {}) })

  const defaultNotificationsForm = {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    sendCustomerReceipt: true,
    sendRestaurantNotification: true,
    sendgridApiKey: '',
    sendgridFrom: '',
    useSendGrid: false
  }

  // Track if form has been modified by user to prevent overwriting
  const [isNotificationsFormDirty, setIsNotificationsFormDirty] = useState(false)
  
  // Initialize with a function to ensure we don't lose data during initial load
  const [notificationsForm, setNotificationsForm] = useState(() => {
    const initialData = config.notifications || {}
    const form = { ...defaultNotificationsForm, ...initialData }
    return form
  })
  const notificationsSavedRef = useRef({ ...defaultNotificationsForm, ...(config.notifications || {}) })

  const defaultPOSForm = {
    posType: 'none',
    posName: '',
    apiKey: '',
    apiSecret: '',
    locationId: '',
    webhookUrl: '',
    fallbackEmail: '',
    fallbackMethod: 'email',
    autoConfirm: true
  }

  const [posForm, setPOSForm] = useState({ ...defaultPOSForm, ...(config.posConfig || {}) })
  const posSavedRef = useRef({ ...defaultPOSForm, ...(config.posConfig || {}) })

  useEffect(() => {
    const newForm = { ...defaultForm, ...(config.ordering || {}) }
    setForm(newForm)
    savedRef.current = newForm
  }, [config.ordering])

  useEffect(() => {
    const newPaymentForm = { ...defaultPaymentForm, ...(paymentConfig.config || {}) }
    setPaymentForm(newPaymentForm)
    paymentSavedRef.current = newPaymentForm
  }, [paymentConfig.config])

  useEffect(() => {
    // Don't update if user has modified the form
    if (isNotificationsFormDirty) {
      return
    }
    
    // Update form only when API has actual data and form hasn't been modified by user
    if (config.notifications && Object.keys(config.notifications).length > 0) {
      const newNotificationsForm = { ...defaultNotificationsForm, ...config.notifications }
      setNotificationsForm(newNotificationsForm)
      notificationsSavedRef.current = newNotificationsForm
    } else if (config.notifications && Object.keys(config.notifications).length === 0) {
      // Handle case where API returns empty object but we need to preserve defaults
      setNotificationsForm(defaultNotificationsForm)
      notificationsSavedRef.current = defaultNotificationsForm
    }
  }, [config.notifications, isNotificationsFormDirty])

  useEffect(() => {
    const newPOSForm = { ...defaultPOSForm, ...(config.posConfig || {}) }
    // Only pre-fill fallbackEmail if it's not already set in config and client email exists
    // Don't overwrite if user has already set a value
    if (!config.posConfig?.fallbackEmail && config.client?.email) {
      newPOSForm.fallbackEmail = config.client.email
    }
    setPOSForm(newPOSForm)
    posSavedRef.current = newPOSForm
  }, [config.posConfig, config.client?.email])

  const mutation = useMutation({
    mutationFn: () => {
      // Ensure boolean values are properly serialized
      const notificationsToSave = {
        ...notificationsForm,
        useSendGrid: Boolean(notificationsForm.useSendGrid),
        sendCustomerReceipt: Boolean(notificationsForm.sendCustomerReceipt),
        sendRestaurantNotification: Boolean(notificationsForm.sendRestaurantNotification)
      }
      return saveConfig(clientId, { ordering: form, notifications: notificationsToSave, posConfig: posForm })
    },
    onSuccess: (data) => {
      // Update the cache with the saved data to prevent unnecessary refetch
      qc.setQueryData(['config', clientId], data)
      // Update refs to match saved state
      savedRef.current = { ...form }
      notificationsSavedRef.current = { ...notificationsForm }
      posSavedRef.current = { ...posForm }
      // Reset dirty flag after successful save
      setIsNotificationsFormDirty(false)
    }
  })

  const paymentMutation = useMutation({
    mutationFn: () => savePayments(clientId, {
      ...paymentConfig,
      config: paymentForm,
      isActive: paymentConfig.isActive !== false,
      provider: 'stripe',
      currency: paymentForm.currency || 'AUD'
    }),
    onSuccess: (data) => {
      qc.setQueryData(['payments', clientId], data)
      paymentSavedRef.current = { ...paymentForm }
    }
  })

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const updatePayment = (key, val) => setPaymentForm(prev => ({ ...prev, [key]: val }))
  const updateNotifications = (key, val) => {
    setIsNotificationsFormDirty(true)
    setNotificationsForm(prev => ({ ...prev, [key]: val }))
  }
  const updatePOS = (key, val) => setPOSForm(prev => ({ ...prev, [key]: val }))

  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedRef.current)
  const hasPaymentChanges = JSON.stringify(paymentForm) !== JSON.stringify(paymentSavedRef.current)
  const hasNotificationChanges = JSON.stringify(notificationsForm) !== JSON.stringify(notificationsSavedRef.current)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:17, fontWeight:700, color:C.t0 }}>
            {subsection === 'ordering-config' ? 'Online Ordering' : subsection === 'payment-settings' ? 'Payment Settings' : subsection === 'notifications' ? 'Notifications' : 'POS Integration'}
          </h2>
          <p style={{ margin:0, fontSize:13, color:C.t3 }}>
            {subsection === 'ordering-config' && 'Enable online ordering so customers can add menu items to their cart and place orders directly from your site.'}
            {subsection === 'payment-settings' && 'Configure payment methods and Stripe integration for online orders.'}
            {subsection === 'notifications' && 'Configure email notifications for orders and customer receipts.'}
            {subsection === 'pos-integration' && 'Configure your POS (Point of Sale) system integration to send orders directly to your kitchen.'}
          </p>
        </div>
      </div>

      {subsection === 'ordering-config' && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginTop:16, marginBottom:24 }}>
            <ToggleSwitch
              label='Enable Online Ordering'
              checked={form.enabled}
              onChange={() => update('enabled', !form.enabled)}
            />
            <p style={{ fontSize:12, color:C.t3, margin:'4px 0 0' }}>
              When enabled, menu items will display an "+Add" button and a cart icon will appear in the navigation bar.
            </p>
          </div>

          {form.enabled && (
            <>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Clock size={16} style={{ color:C.acc }} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Order Status</span>
                </div>

                <ToggleSwitch
                  label='Currently Accepting Orders'
                  checked={form.acceptingOrders !== false}
                  onChange={() => update('acceptingOrders', !form.acceptingOrders)}
                />

                {!form.acceptingOrders && (
                  <div style={{ marginTop:8 }}>
                    <label style={labelStyle}>Pause Message</label>
                    <input
                      type='text'
                      value={form.pauseMessage || ''}
                      onChange={e => update('pauseMessage', e.target.value)}
                      style={inputStyle}
                      placeholder='We are currently not accepting orders...'
                    />
                    <p style={hintStyle}>Shown to customers when ordering is paused</p>
                  </div>
                )}

                <div style={{ marginTop:12 }}>
                  <label style={labelStyle}>Estimated Prep Time</label>
                  <input
                    type='text'
                    value={form.estimatedPrepTime || ''}
                    onChange={e => update('estimatedPrepTime', e.target.value)}
                    style={inputStyle}
                    placeholder='15-25 min'
                  />
                  <p style={hintStyle}>Displayed to customers during checkout</p>
                </div>
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <DollarSign size={16} style={{ color:C.acc }} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Tax & Pricing</span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={labelStyle}>Tax Rate (%)</label>
                    <input
                      type='number'
                      value={form.taxRate || 0}
                      onChange={e => update('taxRate', parseFloat(e.target.value) || 0)}
                      style={inputStyle}
                      min='0'
                      max='100'
                      step='0.1'
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Label</label>
                    <input
                      type='text'
                      value={form.taxLabel || ''}
                      onChange={e => update('taxLabel', e.target.value)}
                      style={inputStyle}
                      placeholder='Tax / GST / VAT'
                    />
                  </div>
                </div>

                <div style={{ marginTop:12 }}>
                  <label style={labelStyle}>Minimum Order Amount ($)</label>
                  <input
                    type='number'
                    value={form.minOrderAmount || 0}
                    onChange={e => update('minOrderAmount', parseFloat(e.target.value) || 0)}
                    style={inputStyle}
                    min='0'
                    step='0.5'
                  />
                  <p style={hintStyle}>Set to 0 for no minimum</p>
                </div>
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Truck size={16} style={{ color:C.acc }} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Order Types</span>
                </div>

                <div style={{ display:'flex', gap:12 }}>
                  {['pickup', 'delivery', 'dine-in'].map(type => {
                    const isChecked = (form.orderTypes || []).includes(type)
                    return (
                      <label key={type} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color:C.t0 }}>
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => {
                            const types = form.orderTypes || []
                            update('orderTypes', isChecked ? types.filter(t => t !== type) : [...types, type])
                          }}
                          style={{ accentColor: C.acc }}
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    )
                  })}
                </div>

                {(form.orderTypes || []).includes('delivery') && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                    <div>
                      <label style={labelStyle}>Delivery Fee ($)</label>
                      <input
                        type='number'
                        value={form.deliveryFee || 0}
                        onChange={e => update('deliveryFee', parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                        min='0'
                        step='0.5'
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Free Delivery Above ($)</label>
                      <input
                        type='number'
                        value={form.freeDeliveryThreshold || 0}
                        onChange={e => update('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                        style={inputStyle}
                        min='0'
                        step='1'
                      />
                      <p style={hintStyle}>0 = no free delivery</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Settings size={16} style={{ color:C.acc }} />
                  <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Checkout Requirements</span>
                </div>

                <ToggleSwitch label='Require Phone Number' checked={form.requirePhone !== false} onChange={() => update('requirePhone', !form.requirePhone)} />
                <ToggleSwitch label='Require Email' checked={form.requireEmail !== false} onChange={() => update('requireEmail', !form.requireEmail)} />
              </div>
            </>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !hasChanges}
              style={{
                padding:'10px 28px', background: (mutation.isPending || !hasChanges) ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: (mutation.isPending || !hasChanges) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: (mutation.isPending || !hasChanges) ? 'none' : `0 4px 16px ${C.acc}50`
              }}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
            {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
            {mutation.isError && <span style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>❌ Failed</span>}
          </div>
        </>
      )}

      {subsection === 'payment-settings' && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <CreditCard size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Stripe Configuration</span>
            </div>

            <ToggleSwitch
              label='Test Mode'
              checked={paymentForm.testMode}
              onChange={() => updatePayment('testMode', !paymentForm.testMode)}
            />
            <p style={{ fontSize:12, color:C.t3, margin:'4px 0 12px' }}>
              Use test keys for development. Switch to live keys for production.
            </p>

            {paymentForm.testMode ? (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>Test Secret Key</label>
                  <input
                    type='password'
                    value={paymentForm.testSecretKey || ''}
                    onChange={e => updatePayment('testSecretKey', e.target.value)}
                    style={inputStyle}
                    placeholder='sk_test_...'
                  />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>Test Publishable Key</label>
                  <input
                    type='text'
                    value={paymentForm.testPublishableKey || ''}
                    onChange={e => updatePayment('testPublishableKey', e.target.value)}
                    style={inputStyle}
                    placeholder='pk_test_...'
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>Live Secret Key</label>
                  <input
                    type='password'
                    value={paymentForm.liveSecretKey || ''}
                    onChange={e => updatePayment('liveSecretKey', e.target.value)}
                    style={inputStyle}
                    placeholder='sk_live_...'
                  />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>Live Publishable Key</label>
                  <input
                    type='text'
                    value={paymentForm.livePublishableKey || ''}
                    onChange={e => updatePayment('livePublishableKey', e.target.value)}
                    style={inputStyle}
                    placeholder='pk_live_...'
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom:12 }}>
              <label style={labelStyle}>Currency</label>
              <select
                value={paymentForm.currency || 'AUD'}
                onChange={e => updatePayment('currency', e.target.value)}
                style={selectStyle}
              >
                <option value='AUD'>AUD - Australian Dollar</option>
                <option value='USD'>USD - US Dollar</option>
                <option value='GBP'>GBP - British Pound</option>
                <option value='EUR'>EUR - Euro</option>
                <option value='NZD'>NZD - New Zealand Dollar</option>
                <option value='CAD'>CAD - Canadian Dollar</option>
              </select>
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <DollarSign size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Cash Payment</span>
            </div>

            <ToggleSwitch
              label='Enable Cash / Pay at Pickup'
              checked={paymentForm.cashEnabled}
              onChange={() => updatePayment('cashEnabled', !paymentForm.cashEnabled)}
            />

            {paymentForm.cashEnabled && (
              <div style={{ marginTop:12 }}>
                <label style={labelStyle}>Payment Label</label>
                <input
                  type='text'
                  value={paymentForm.cashLabel || ''}
                  onChange={e => updatePayment('cashLabel', e.target.value)}
                  style={inputStyle}
                  placeholder='Pay at Pickup'
                />
                <p style={hintStyle}>Text shown to customers for the cash payment option</p>
              </div>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending || !hasPaymentChanges}
              style={{
                padding:'10px 28px', background: (paymentMutation.isPending || !hasPaymentChanges) ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: (paymentMutation.isPending || !hasPaymentChanges) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: (paymentMutation.isPending || !hasPaymentChanges) ? 'none' : `0 4px 16px ${C.acc}50`
              }}>
              {paymentMutation.isPending ? 'Saving…' : 'Save Payment Settings'}
            </button>
            {paymentMutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
            {paymentMutation.isError && <span style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>❌ Failed</span>}
          </div>
        </>
      )}

      {subsection === 'notifications' && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Mail size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>SMTP Configuration</span>
            </div>

            <p style={{ fontSize:12, color:C.t3, marginBottom:12 }}>
              Configure your SMTP server to send order notifications and receipts. Leave blank to use the default email service.
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={labelStyle}>SMTP Host</label>
                <input
                  type='text'
                  value={notificationsForm.smtpHost || ''}
                  onChange={e => updateNotifications('smtpHost', e.target.value)}
                  style={inputStyle}
                  placeholder='smtp.gmail.com'
                />
              </div>
              <div>
                <label style={labelStyle}>SMTP Port</label>
                <input
                  type='text'
                  value={notificationsForm.smtpPort || '587'}
                  onChange={e => updateNotifications('smtpPort', e.target.value)}
                  style={inputStyle}
                  placeholder='587'
                />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={labelStyle}>SMTP User</label>
                <input
                  type='text'
                  value={notificationsForm.smtpUser || ''}
                  onChange={e => updateNotifications('smtpUser', e.target.value)}
                  style={inputStyle}
                  placeholder='your-email@gmail.com'
                />
              </div>
              <div>
                <label style={labelStyle}>SMTP Password</label>
                <input
                  type='password'
                  value={notificationsForm.smtpPassword || ''}
                  onChange={e => updateNotifications('smtpPassword', e.target.value)}
                  style={inputStyle}
                  placeholder='••••••••'
                />
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={labelStyle}>From Email</label>
              <input
                type='email'
                value={notificationsForm.smtpFrom || ''}
                onChange={e => updateNotifications('smtpFrom', e.target.value)}
                style={inputStyle}
                placeholder='noreply@yourrestaurant.com'
              />
              <p style={hintStyle}>Email address that will send notifications</p>
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Zap size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>SendGrid Configuration</span>
            </div>

            <p style={{ fontSize:12, color:C.t3, marginBottom:12 }}>
              Use SendGrid for reliable email delivery. Recommended for cloud platforms like Railway.
            </p>

            <ToggleSwitch
              label='Use SendGrid (Recommended)'
              checked={notificationsForm.useSendGrid || false}
              onChange={() => updateNotifications('useSendGrid', !notificationsForm.useSendGrid)}
            />
            <p style={{ fontSize:12, color:C.t3, margin:'4px 0 12px' }}>
              Enable SendGrid for reliable email delivery on cloud platforms
            </p>

            {(notificationsForm.useSendGrid || false) && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>SendGrid API Key</label>
                  <input
                    type='password'
                    value={notificationsForm.sendgridApiKey || ''}
                    onChange={e => updateNotifications('sendgridApiKey', e.target.value)}
                    style={inputStyle}
                    placeholder='SG.xxxxxx...'
                  />
                  <p style={hintStyle}>Get your API key from SendGrid dashboard</p>
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>SendGrid From Email</label>
                  <input
                    type='email'
                    value={notificationsForm.sendgridFrom || ''}
                    onChange={e => updateNotifications('sendgridFrom', e.target.value)}
                    style={inputStyle}
                    placeholder='noreply@yourrestaurant.com'
                  />
                  <p style={hintStyle}>Must be verified in your SendGrid account</p>
                </div>
              </>
            )}
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Settings size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Notification Settings</span>
            </div>

            <ToggleSwitch
              label='Send Receipt to Customer'
              checked={notificationsForm.sendCustomerReceipt !== false}
              onChange={() => updateNotifications('sendCustomerReceipt', !notificationsForm.sendCustomerReceipt)}
            />
            <p style={{ fontSize:12, color:C.t3, margin:'4px 0 12px' }}>
              Send an order confirmation and receipt to the customer's email
            </p>

            <ToggleSwitch
              label='Send Notification to Restaurant'
              checked={notificationsForm.sendRestaurantNotification !== false}
              onChange={() => updateNotifications('sendRestaurantNotification', !notificationsForm.sendRestaurantNotification)}
            />
            <p style={{ fontSize:12, color:C.t3, margin:'4px 0 0' }}>
              Send new order notifications to the restaurant email configured in General settings
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !hasNotificationChanges}
              style={{
                padding:'10px 28px', background: (mutation.isPending || !hasNotificationChanges) ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: (mutation.isPending || !hasNotificationChanges) ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: (mutation.isPending || !hasNotificationChanges) ? 'none' : `0 4px 16px ${C.acc}50`
              }}>
              {mutation.isPending ? 'Saving…' : 'Save Notification Settings'}
            </button>
            {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
            {mutation.isError && <span style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>❌ Failed</span>}
          </div>
        </>
      )}

      {subsection === 'pos-integration' && (
        <>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Server size={16} style={{ color:C.acc }} />
              <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>POS System Selection</span>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={labelStyle}>POS Type</label>
              <select
                value={posForm.posType || 'none'}
                onChange={e => updatePOS('posType', e.target.value)}
                style={selectStyle}
              >
                <option value='none'>No POS Integration (Email/Print only)</option>
                <option value='api'>🟢 API POS (Square, Lightspeed, Toast)</option>
                <option value='online-orders'>🔵 Online Orders System (Abacus-style)</option>
                <option value='email-import'>🟡 Email/Import System</option>
                <option value='unknown'>🔴 Unknown/Legacy System</option>
              </select>
              <p style={hintStyle}>Select your POS type to configure the appropriate integration method</p>
            </div>

            {posForm.posType !== 'none' && (
              <div style={{ marginTop:12 }}>
                <label style={labelStyle}>POS Name (optional)</label>
                <input
                  type='text'
                  value={posForm.posName || ''}
                  onChange={e => updatePOS('posName', e.target.value)}
                  style={inputStyle}
                  placeholder='e.g. Square, Lightspeed, Abacus'
                />
              </div>
            )}

            <div style={{ marginTop:12 }}>
              <label style={labelStyle}>Order Confirmation Email</label>
              <input
                type='email'
                value={posForm.fallbackEmail || ''}
                onChange={e => updatePOS('fallbackEmail', e.target.value)}
                style={inputStyle}
                placeholder='orders@yourrestaurant.com'
              />
              <p style={hintStyle}>Email address where order confirmations will be sent. Leave empty to use the restaurant's default email.</p>
            </div>
          </div>

          {posForm.posType === 'api' && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Zap size={16} style={{ color:C.acc }} />
                <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>API Configuration</span>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>API Key</label>
                <input
                  type='password'
                  value={posForm.apiKey || ''}
                  onChange={e => updatePOS('apiKey', e.target.value)}
                  style={inputStyle}
                  placeholder='Your POS API key'
                />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>API Secret</label>
                <input
                  type='password'
                  value={posForm.apiSecret || ''}
                  onChange={e => updatePOS('apiSecret', e.target.value)}
                  style={inputStyle}
                  placeholder='Your POS API secret'
                />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Location ID</label>
                <input
                  type='text'
                  value={posForm.locationId || ''}
                  onChange={e => updatePOS('locationId', e.target.value)}
                  style={inputStyle}
                  placeholder='Your POS location ID'
                />
                <p style={hintStyle}>Required for multi-location POS systems</p>
              </div>

              <ToggleSwitch
                label='Auto-confirm Orders'
                checked={posForm.autoConfirm !== false}
                onChange={() => updatePOS('autoConfirm', !posForm.autoConfirm)}
              />
              <p style={{ fontSize:12, color:C.t3, margin:'4px 0 0' }}>
                Automatically confirm orders when sent to POS. Disable if you want manual confirmation.
              </p>
            </div>
          )}

          {posForm.posType === 'online-orders' && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Zap size={16} style={{ color:C.acc }} />
                <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Online Orders Integration</span>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Webhook URL</label>
                <input
                  type='text'
                  value={posForm.webhookUrl || ''}
                  onChange={e => updatePOS('webhookUrl', e.target.value)}
                  style={inputStyle}
                  placeholder='https://your-pos.com/api/orders'
                />
                <p style={hintStyle}>The endpoint where orders will be sent</p>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>API Key (if required)</label>
                <input
                  type='password'
                  value={posForm.apiKey || ''}
                  onChange={e => updatePOS('apiKey', e.target.value)}
                  style={inputStyle}
                  placeholder='Authentication key for webhook'
                />
              </div>

              <ToggleSwitch
                label='Auto-confirm Orders'
                checked={posForm.autoConfirm !== false}
                onChange={() => updatePOS('autoConfirm', !posForm.autoConfirm)}
              />
            </div>
          )}

          {(posForm.posType === 'email-import' || posForm.posType === 'unknown' || posForm.posType === 'none') && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 20px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <AlertTriangle size={16} style={{ color:C.acc }} />
                <span style={{ fontSize:14, fontWeight:700, color:C.t0 }}>Fallback Configuration</span>
              </div>

              <p style={{ fontSize:12, color:C.t3, marginBottom:12 }}>
                Orders will be sent via email and can be printed for the kitchen. Configure your fallback method below.
              </p>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Fallback Email</label>
                <input
                  type='email'
                  value={posForm.fallbackEmail || ''}
                  onChange={e => updatePOS('fallbackEmail', e.target.value)}
                  style={inputStyle}
                  placeholder='orders@yourrestaurant.com'
                />
                <p style={hintStyle}>Email address to receive order notifications</p>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>Fallback Method</label>
                <select
                  value={posForm.fallbackMethod || 'email'}
                  onChange={e => updatePOS('fallbackMethod', e.target.value)}
                  style={selectStyle}
                >
                  <option value='email'>Email Only</option>
                  <option value='email-print'>Email + Print to Kitchen</option>
                  <option value='print'>Print to Kitchen Only</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:20 }}>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              style={{
                padding:'10px 28px', background: mutation.isPending ? C.card : C.acc,
                border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer', fontFamily:'inherit',
                boxShadow: mutation.isPending ? 'none' : `0 4px 16px ${C.acc}50`
              }}>
              {mutation.isPending ? 'Saving…' : 'Save POS Configuration'}
            </button>
            {mutation.isSuccess && <span style={{ fontSize:13, color:C.green, fontWeight:600 }}>✅ Saved</span>}
            {mutation.isError && <span style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>❌ Failed</span>}
          </div>
        </>
      )}
    </div>
  )
}
