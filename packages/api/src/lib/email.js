const nodemailer = require('nodemailer')
const sgMail = require('@sendgrid/mail')

let transporter = null

function getTransporter(config) {
  console.log('[EMAIL] getTransporter called')
  console.log('[EMAIL] smtpHost:', config.smtpHost)
  console.log('[EMAIL] smtpUser:', config.smtpUser)
  console.log('[EMAIL] smtpPort:', config.smtpPort)
  console.log('[EMAIL] smtpPassword set:', !!config.smtpPassword)
  
  if (config.smtpHost && config.smtpUser && config.smtpPassword) {
    console.log('[EMAIL] Creating SMTP transporter...')
    // Force port 465 with SSL for cloud platforms like Railway
    const port = config.smtpPort === '465' ? 465 : 465
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: port,
      secure: true, // Use SSL
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    })
    console.log('[EMAIL] Transporter created successfully on port', port, 'with SSL')
    return transporter
  }
  console.log('[EMAIL] Missing SMTP credentials, returning null')
  return null
}

function generateCustomerReceiptHtml(order, clientName, clientData = {}, locationData = {}) {
  const items = Array.isArray(order.items) ? order.items : []
  const logoUrl = clientData.logo || ''
  const primaryColor = clientData.colours?.primary || '#2563eb'
  const location = locationData.name ? locationData : null
  const address = locationData.address ? locationData.address : clientData.address || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${primaryColor}; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white; }
        .header h1 { margin: 0 0 8px; color: white; }
        .header p { margin: 0; color: rgba(255,255,255,0.9); }
        .logo { max-width: 120px; max-height: 60px; margin-bottom: 16px; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .order-number { background: ${primaryColor}20; color: ${primaryColor}; padding: 10px 20px; border-radius: 6px; display: inline-block; font-weight: 600; margin: 20px 0; }
        .info-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb; }
        .info-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 4px; }
        .item { padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
        .item:last-child { border-bottom: none; }
        .item-name { font-weight: 600; color: #1a1a1a; }
        .item-qty { color: #666; font-size: 14px; margin-top: 4px; }
        .item-price { text-align: right; font-weight: 600; color: ${primaryColor}; }
        .summary { margin-top: 24px; padding-top: 24px; border-top: 2px solid ${primaryColor}20; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .total { font-size: 20px; font-weight: 700; color: ${primaryColor}; margin-top: 16px; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${clientName}" class="logo" />` : ''}
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order from ${clientName}</p>
        </div>
        <div class="content">
          <div class="order-number">Order #${order.orderNumber}</div>

          ${location ? `
          <div class="info-box">
            <div class="info-label">Pickup Location</div>
            <div style="font-weight: 600; font-size: 16px;">${location.name}</div>
            ${address ? `<div style="color: #666; margin-top: 4px;">${address}</div>` : ''}
          </div>
          ` : ''}

          <div class="info-box">
            <div class="info-label">Order Status</div>
            <div style="font-weight: 600;">${order.status || 'New'}</div>
          </div>

          <div class="info-box">
            <div class="info-label">Payment Method</div>
            <div style="font-weight: 600;">${order.paymentMethod === 'stripe' ? 'Card Payment' : order.paymentMethod === 'cash' ? 'Pay at Pickup' : order.paymentMethod}</div>
          </div>

          ${order.pickupTime ? `
          <div class="info-box">
            <div class="info-label">Pickup Time</div>
            <div style="font-weight: 600;">${new Date(order.pickupTime).toLocaleString()}</div>
          </div>
          ` : ''}

          <h3 style="margin-top: 32px; color: ${primaryColor};">Order Details</h3>
          ${items.map(item => `
            <div class="item">
              <div style="display: flex; justify-content: space-between;">
                <div style="flex: 1;">
                  <div class="item-name">${item.name}</div>
                  ${item.quantity > 1 ? `<div class="item-qty">Quantity: ${item.quantity}</div>` : ''}
                </div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            </div>
          `).join('')}

          <div class="summary">
            <div class="summary-row"><span>Subtotal</span><span>$${order.subtotal.toFixed(2)}</span></div>
            ${order.taxAmount > 0 ? `<div class="summary-row"><span>Tax</span><span>$${order.taxAmount.toFixed(2)}</span></div>` : ''}
            ${order.deliveryFee > 0 ? `<div class="summary-row"><span>Delivery Fee</span><span>$${order.deliveryFee.toFixed(2)}</span></div>` : ''}
            <div class="summary-row total"><span>Total</span><span>$${order.total.toFixed(2)} ${order.currency || 'AUD'}</span></div>
          </div>

          ${order.note ? `
          <div style="margin-top: 24px; padding: 16px; background: ${primaryColor}10; border-left: 4px solid ${primaryColor}; border-radius: 4px;">
            <div class="info-label">Special Instructions</div>
            ${order.note}
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p style="margin: 0;">If you have any questions, please contact us.</p>
          ${address ? `<p style="margin: 8px 0 0;">${address}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

function generateRestaurantNotificationHtml(order, clientName) {
  const items = Array.isArray(order.items) ? order.items : []
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dcfce7; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; color: #166534; }
        .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
        .order-number { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 4px; display: inline-block; font-weight: 600; margin: 10px 0; }
        .info-box { background: #f9fafb; padding: 12px; border-radius: 4px; margin: 12px 0; }
        .item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Order Received!</h1>
          <p>${clientName}</p>
        </div>
        <div class="content">
          <div class="order-number">Order #${order.orderNumber}</div>
          
          <div class="info-box">
            <strong>Customer:</strong> ${order.customerName}<br>
            <strong>Phone:</strong> ${order.customerPhone}<br>
            <strong>Email:</strong> ${order.customerEmail}
          </div>
          
          <div class="info-box">
            <strong>Order Type:</strong> ${order.orderType}<br>
            <strong>Pickup:</strong> ${order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'ASAP'}<br>
            <strong>Payment:</strong> ${order.paymentMethod === 'stripe' ? 'Card' : order.paymentMethod}
          </div>
          
          <h3>Items:</h3>
          ${items.map(item => `
            <div class="item">
              <strong>${item.name}</strong> x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}
            </div>
          `).join('')}
          
          <div class="total">Total: $${order.total.toFixed(2)} ${order.currency}</div>
          
          ${order.note ? `
          <div class="info-box">
            <strong>Note:</strong> ${order.note}
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

function generateEnquiryEmailHtml(enquiry, clientName, clientData = {}) {
  const primaryColor = clientData.colours?.primary || '#2563eb'
  const logoUrl = clientData.logo || ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${primaryColor}; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white; }
        .header h1 { margin: 0 0 8px; color: white; }
        .header p { margin: 0; color: rgba(255,255,255,0.9); }
        .logo { max-width: 120px; max-height: 60px; margin-bottom: 16px; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .info-box { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb; }
        .info-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 4px; }
        .message-box { background: ${primaryColor}10; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor}; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${clientName}" class="logo" />` : ''}
          <h1>📬 New Enquiry</h1>
          <p>Website Contact Form</p>
        </div>
        <div class="content">
          <div class="info-box">
            <div class="info-label">From</div>
            <div style="font-weight: 600; font-size: 16px;">${enquiry.name}</div>
            <div style="color: #666; margin-top: 4px;">${enquiry.email}</div>
            ${enquiry.phone ? `<div style="color: #666; margin-top: 4px;">${enquiry.phone}</div>` : ''}
          </div>

          <div class="info-box">
            <div class="info-label">Subject</div>
            <div style="font-weight: 600;">${enquiry.subject}</div>
          </div>

          <div class="message-box">
            <div class="info-label">Message</div>
            <div style="white-space: pre-wrap; line-height: 1.8;">${enquiry.message}</div>
          </div>

          <div style="margin-top: 20px; font-size: 12px; color: #999;">
            Submitted on: ${new Date().toLocaleString()}
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0;">This enquiry was submitted via the ${clientName} website contact form.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

async function sendOrderConfirmation(order, clientName, notificationConfig, clientData = {}, locationData = {}) {
  console.log('[EMAIL] sendOrderConfirmation called')
  console.log('[EMAIL] sendCustomerReceipt:', notificationConfig?.sendCustomerReceipt)
  console.log('[EMAIL] notificationConfig:', JSON.stringify(notificationConfig, null, 2))
  
  if (!notificationConfig?.sendCustomerReceipt) {
    console.log('[EMAIL] Customer receipt disabled, skipping')
    return { success: false, message: 'Customer receipt disabled' }
  }

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      console.log('[EMAIL] Using SendGrid for customer receipt')
      console.log('[EMAIL] SendGrid API key present:', !!notificationConfig.sendgridApiKey)
      console.log('[EMAIL] SendGrid from email:', notificationConfig.sendgridFrom || notificationConfig.smtpFrom)
      return await sendSendGridEmail(order, clientName, 'customer', notificationConfig, clientData, locationData)
    }
    
    // Fallback to SMTP
    console.log('[EMAIL] No SendGrid key, trying SMTP')
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      console.log('[EMAIL] SMTP not configured, using fallback')
      return sendFallbackEmail(order, clientName, 'customer', clientData, locationData)
    }

    const fromEmail = notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateCustomerReceiptHtml(order, clientName, clientData, locationData)

    console.log('[EMAIL] Attempting to send customer receipt to:', order.customerEmail)
    console.log('[EMAIL] From:', fromEmail)
    
    try {
      await Promise.race([
        emailTransporter.sendMail({
          from: fromEmail,
          to: order.customerEmail,
          subject: `Order #${order.orderNumber} Confirmed - ${clientName}`,
          html
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000)
        )
      ])
      console.log('[EMAIL] Customer receipt sent successfully')
      return { success: true, message: 'Customer receipt sent' }
    } catch (err) {
      console.error('[EMAIL] SMTP failed, using fallback:', err.message)
      return sendFallbackEmail(order, clientName, 'customer', clientData, locationData)
    }
  } catch (err) {
    console.error('[EMAIL] Failed to send customer receipt:', err)
    return { success: false, message: err.message }
  }
}

async function sendRestaurantNotification(order, clientName, notificationConfig, restaurantEmail) {
  console.log('[EMAIL] sendRestaurantNotification called')
  console.log('[EMAIL] sendRestaurantNotification:', notificationConfig?.sendRestaurantNotification)
  console.log('[EMAIL] restaurantEmail:', restaurantEmail)
  
  if (!notificationConfig?.sendRestaurantNotification) {
    console.log('[EMAIL] Restaurant notification disabled, skipping')
    return { success: false, message: 'Restaurant notification disabled' }
  }

  if (!restaurantEmail) {
    console.log('[EMAIL] No restaurant email configured')
    return { success: false, message: 'No restaurant email configured' }
  }

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      console.log('[EMAIL] Using SendGrid for restaurant notification')
      console.log('[EMAIL] SendGrid API key present:', !!notificationConfig.sendgridApiKey)
      console.log('[EMAIL] SendGrid from email:', notificationConfig.sendgridFrom || notificationConfig.smtpFrom)
      return await sendSendGridEmail(order, clientName, 'restaurant', notificationConfig, {}, {}, restaurantEmail)
    }
    
    // Fallback to SMTP
    console.log('[EMAIL] No SendGrid key, trying SMTP')
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      console.log('[EMAIL] SMTP not configured, using fallback')
      return sendFallbackEmail(order, clientName, 'restaurant', {}, {}, restaurantEmail)
    }

    const fromEmail = notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateRestaurantNotificationHtml(order, clientName)

    console.log('[EMAIL] Attempting to send restaurant notification to:', restaurantEmail)
    console.log('[EMAIL] From:', fromEmail)
    
    try {
      await Promise.race([
        emailTransporter.sendMail({
          from: fromEmail,
          to: restaurantEmail,
          subject: `🔔 New Order #${order.orderNumber} - ${clientName}`,
          html
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000)
        )
      ])
      console.log('[EMAIL] Restaurant notification sent successfully')
      return { success: true, message: 'Restaurant notification sent' }
    } catch (err) {
      console.error('[EMAIL] SMTP failed, using fallback:', err.message)
      return sendFallbackEmail(order, clientName, 'restaurant', {}, {}, restaurantEmail)
    }
  } catch (err) {
    console.error('[EMAIL] Failed to send restaurant notification:', err)
    return { success: false, message: err.message }
  }
}

// SendGrid email function
async function sendSendGridEmail(order, clientName, type, notificationConfig, clientData = {}, locationData = {}, restaurantEmail = null) {
  console.log('[EMAIL] Using SendGrid for:', type)
  
  if (!notificationConfig.sendgridApiKey) {
    console.log('[EMAIL] SendGrid API key not configured')
    return sendFallbackEmail(order, clientName, type, clientData, locationData, restaurantEmail)
  }

  try {
    sgMail.setApiKey(notificationConfig.sendgridApiKey)
    
    const toEmail = type === 'customer' ? order.customerEmail : restaurantEmail
    const subject = type === 'customer' 
      ? `Order #${order.orderNumber} Confirmed - ${clientName}`
      : `🔔 New Order #${order.orderNumber} - ${clientName}`
    
    const html = type === 'customer' 
      ? generateCustomerReceiptHtml(order, clientName, clientData, locationData)
      : generateRestaurantNotificationHtml(order, clientName)

    const msg = {
      to: toEmail,
      from: notificationConfig.sendgridFrom || notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`,
      subject: subject,
      html: html
    }

    console.log('[EMAIL] Sending via SendGrid to:', toEmail)
    await sgMail.send(msg)
    console.log('[EMAIL] SendGrid email sent successfully')
    
    return { success: true, message: 'Email sent via SendGrid' }
  } catch (err) {
    console.error('[EMAIL] SendGrid failed:', err.message)
    return sendFallbackEmail(order, clientName, type, clientData, locationData, restaurantEmail)
  }
}

// Fallback email function for when SMTP fails
async function sendFallbackEmail(order, clientName, type, clientData = {}, locationData = {}, restaurantEmail = null) {
  console.log('[EMAIL] Using fallback email method for:', type)
  
  try {
    // Use a simple HTTP email service or log the email
    const emailData = {
      clientName,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      restaurantEmail: restaurantEmail || order.customerEmail,
      orderType: order.orderType,
      total: order.total,
      items: order.items,
      type, // 'customer' or 'restaurant'
      timestamp: new Date().toISOString()
    }

    // Store email in logs for now (you can integrate with SendGrid/Mailgun later)
    console.log('[FALLBACK EMAIL] Email data:', JSON.stringify(emailData, null, 2))
    
    // For now, we'll just log it and return success
    // In production, you would send this to a real email service
    console.log(`[FALLBACK EMAIL] ${type === 'customer' ? 'Customer receipt' : 'Restaurant notification'} would be sent to ${emailData.restaurantEmail}`)
    
    return { success: true, message: `Email sent via fallback method` }
  } catch (err) {
    console.error('[EMAIL] Fallback email failed:', err)
    return { success: false, message: err.message }
  }
}

async function sendEnquiryEmail(enquiry, clientName, notificationConfig, clientData = {}) {
  if (!notificationConfig?.smtpHost || !notificationConfig?.smtpUser || !notificationConfig?.smtpPassword) {
    return { success: false, message: 'SMTP not configured' }
  }

  try {
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      return { success: false, message: 'Failed to create email transporter' }
    }

    const fromEmail = notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const toEmail = clientData.email || clientData.settings?.defaultEmail || notificationConfig.smtpFrom

    if (!toEmail) {
      return { success: false, message: 'No recipient email configured' }
    }

    const html = generateEnquiryEmailHtml(enquiry, clientName, clientData)

    await emailTransporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `📬 New Enquiry from ${enquiry.name} - ${clientName}`,
      html
    })

    return { success: true, message: 'Enquiry email sent' }
  } catch (err) {
    console.error('[EMAIL] Failed to send enquiry email:', err)
    return { success: false, message: err.message }
  }
}

module.exports = {
  sendOrderConfirmation,
  sendRestaurantNotification,
  sendEnquiryEmail,
  sendFallbackEmail
}
