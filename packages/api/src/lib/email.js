const nodemailer = require('nodemailer')
const sgMail = require('@sendgrid/mail')

let transporter = null

function getTransporter(config) {
  if (config.smtpHost && config.smtpUser && config.smtpPassword) {
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
    return transporter
  }
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
            <div style="font-weight: 600;">${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'New'}</div>
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
  if (!notificationConfig?.sendCustomerReceipt) {
    return { success: false, message: 'Customer receipt disabled' }
  }

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      return await sendSendGridEmail(order, clientName, 'customer', notificationConfig, clientData, locationData)
    }
    
    // Fallback to SMTP
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      return sendFallbackEmail(order, clientName, 'customer', clientData, locationData)
    }

    const fromEmail = notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateCustomerReceiptHtml(order, clientName, clientData, locationData)
    
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
      return { success: true, message: 'Customer receipt sent' }
    } catch (err) {
      return sendFallbackEmail(order, clientName, 'customer', clientData, locationData)
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

async function sendRestaurantNotification(order, clientName, notificationConfig, restaurantEmail) {
  if (!notificationConfig?.sendRestaurantNotification) {
    return { success: false, message: 'Restaurant notification disabled' }
  }

  if (!restaurantEmail) {
    return { success: false, message: 'No restaurant email configured' }
  }

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      return await sendSendGridEmail(order, clientName, 'restaurant', notificationConfig, {}, {}, restaurantEmail)
    }
    
    // Fallback to SMTP
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      return sendFallbackEmail(order, clientName, 'restaurant', {}, {}, restaurantEmail)
    }

    const fromEmail = notificationConfig.smtpFrom || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateRestaurantNotificationHtml(order, clientName)
    
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
      return { success: true, message: 'Restaurant notification sent' }
    } catch (err) {
      return sendFallbackEmail(order, clientName, 'restaurant', {}, {}, restaurantEmail)
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// SendGrid email function
async function sendSendGridEmail(order, clientName, type, notificationConfig, clientData = {}, locationData = {}, restaurantEmail = null) {
  if (!notificationConfig.sendgridApiKey) {
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

    // Use verified sender from env or client settings, never fake domain
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || notificationConfig.sendgridFrom
    const fromName = process.env.SENDGRID_FROM_NAME || clientName

    const msg = {
      to: toEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      html: html,
      // Add anti-spam headers
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'X-Mailer': 'DineDesk'
      },
      // Add tracking settings
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    }

    await sgMail.send(msg)
    
    return { success: true, message: 'Email sent via SendGrid' }
  } catch (err) {
    return sendFallbackEmail(order, clientName, type, clientData, locationData, restaurantEmail)
  }
}

// Fallback email function for when SMTP/SendGrid fails
async function sendFallbackEmail(order, clientName, type, clientData = {}, locationData = {}, restaurantEmail = null) {
  // Log the failure for debugging - in production, implement a retry queue
  const emailData = {
    clientName,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    restaurantEmail: restaurantEmail || order.customerEmail,
    type,
    timestamp: new Date().toISOString(),
    reason: 'No email provider configured or all providers failed'
  }
  
  // Return failure so calling code knows email wasn't sent
  return { 
    success: false, 
    message: 'Email delivery failed - no configured email provider available',
    data: emailData
  }
}

async function sendEnquiryEmail(enquiry, clientName, notificationConfig, clientData = {}) {
  // Get recipient email from client settings or primary email
  const toEmail = clientData.email || clientData.settings?.email || clientData.settings?.defaultEmail || notificationConfig.smtpFrom

  if (!toEmail) {
    return { success: false, message: 'No recipient email configured' }
  }

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      sgMail.setApiKey(notificationConfig.sendgridApiKey)

      const html = generateEnquiryEmailHtml(enquiry, clientName, clientData)

      // Use verified sender from env or client settings
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || notificationConfig.sendgridFrom
      const fromName = process.env.SENDGRID_FROM_NAME || clientName

      const msg = {
        to: toEmail,
        from: {
          email: fromEmail,
          name: fromName
        },
        replyTo: enquiry.email,
        subject: `📬 New Enquiry from ${enquiry.name} - ${clientName}`,
        html: html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
          'X-Mailer': 'DineDesk'
        }
      }

      await sgMail.send(msg)
      return { success: true, message: 'Enquiry email sent via SendGrid' }
    }

    // Fallback to SMTP
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      return { success: false, message: 'No email provider configured' }
    }

    const fromEmail = notificationConfig.smtpFrom || process.env.SENDGRID_FROM_EMAIL || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateEnquiryEmailHtml(enquiry, clientName, clientData)

    await Promise.race([
      emailTransporter.sendMail({
        from: fromEmail,
        to: toEmail,
        replyTo: enquiry.email,
        subject: `📬 New Enquiry from ${enquiry.name} - ${clientName}`,
        html
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000)
      )
    ])
    return { success: true, message: 'Enquiry email sent via SMTP' }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

function generateBookingConfirmationHtml(booking, clientName, clientData = {}, locationData = {}) {
  const primaryColor = clientData.colours?.primary || '#2563eb'
  const logoUrl = clientData.logo || ''
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; }
        .header { text-align: center; padding-bottom: 30px; border-bottom: 2px solid ${primaryColor}; }
        .logo { max-width: 150px; margin-bottom: 20px; }
        h1 { color: ${primaryColor}; margin: 0; font-size: 28px; }
        .content { padding: 30px 0; }
        .info-box { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-label { color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: 600; color: #333; }
        .message-box { background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor}; }
        .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${clientName}" class="logo" />` : ''}
          <h1>🎉 Booking Confirmed!</h1>
          <p>${clientName}</p>
        </div>
        <div class="content">
          <div class="info-box">
            <div class="info-label">Customer</div>
            <div class="info-value">${booking.customerName}</div>
            <div style="margin-top: 8px; color: #666;">${booking.customerEmail}</div>
            <div style="color: #666;">${booking.customerPhone}</div>
          </div>
          
          <div class="info-box">
            <div class="info-label">Booking Details</div>
            <div class="info-value">${new Date(booking.bookingDate).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="info-value" style="margin-top: 8px;">${booking.bookingTime}</div>
            <div class="info-value" style="margin-top: 8px;">Party of ${booking.partySize}</div>
            ${locationData.name ? `<div style="margin-top: 8px; color: #666;">Location: ${locationData.name}</div>` : ''}
          </div>
          
          ${booking.table ? `
          <div class="info-box">
            <div class="info-label">Table Assigned</div>
            <div class="info-value">Table ${booking.table.tableNumber}</div>
            <div style="margin-top: 8px; color: #666;">Capacity: ${booking.table.capacity} seats</div>
          </div>
          ` : ''}
          
          ${booking.notes ? `
          <div class="message-box">
            <div class="info-label">Special Requests</div>
            <div>${booking.notes}</div>
          </div>
          ` : ''}
          
          <div class="message-box" style="background-color: #f0f9f0; border-left-color: #22c55e;">
            <p style="margin: 0; color: #166534;">We look forward to seeing you! Please arrive on time. If you need to cancel or modify your booking, please contact us directly.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

async function sendBookingConfirmation(booking, clientName, notificationConfig, clientData = {}, locationData = {}) {
  if (!booking.customerEmail) {
    console.log('[Email] Booking confirmation skipped - no customer email provided')
    return { success: false, message: 'No customer email provided' }
  }

  console.log('[Email] Sending booking confirmation to:', booking.customerEmail, 'via SendGrid:', !!notificationConfig.sendgridApiKey)

  try {
    // Try SendGrid first
    if (notificationConfig.sendgridApiKey) {
      sgMail.setApiKey(notificationConfig.sendgridApiKey)

      const html = generateBookingConfirmationHtml(booking, clientName, clientData, locationData)

      // Use verified sender from env or client settings
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || notificationConfig.sendgridFrom
      const fromName = process.env.SENDGRID_FROM_NAME || clientName

      const msg = {
        to: booking.customerEmail,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: `Booking Confirmed - ${clientName}`,
        html: html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
          'X-Mailer': 'DineDesk'
        }
      }

      await sgMail.send(msg)
      console.log('[Email] Booking confirmation sent successfully via SendGrid')
      return { success: true, message: 'Booking confirmation sent via SendGrid' }
    }

    // Fallback to SMTP
    const emailTransporter = getTransporter(notificationConfig)
    if (!emailTransporter) {
      // Log the failure but don't fail the booking
      console.log('[Email] No email provider configured for booking confirmation')
      return { success: false, message: 'No email provider configured' }
    }

    const fromEmail = notificationConfig.smtpFrom || process.env.SENDGRID_FROM_EMAIL || `noreply@${clientName.toLowerCase().replace(/\s+/g, '')}.com`
    const html = generateBookingConfirmationHtml(booking, clientName, clientData, locationData)

    await Promise.race([
      emailTransporter.sendMail({
        from: fromEmail,
        to: booking.customerEmail,
        subject: `Booking Confirmed - ${clientName}`,
        html
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000)
      )
    ])
    return { success: true, message: 'Booking confirmation sent via SMTP' }
  } catch (err) {
    console.error('[Email] Booking confirmation error:', err)
    return { success: false, message: err.message }
  }
}

module.exports = {
  sendOrderConfirmation,
  sendRestaurantNotification,
  sendEnquiryEmail,
  sendBookingConfirmation,
  sendFallbackEmail
}
