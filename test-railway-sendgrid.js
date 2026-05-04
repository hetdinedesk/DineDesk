// Test script to verify Railway SendGrid configuration
require('dotenv').config({ path: require('path').join(__dirname, 'packages/api/.env') })

const { sendOrderConfirmation } = require('./packages/api/src/lib/email')

async function testRailwaySendGrid() {
  console.log('🚂 Testing Railway SendGrid configuration...\n')
  
  // Mock order data
  const testOrder = {
    orderNumber: 12345,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+1234567890',
    orderType: 'pickup',
    paymentMethod: 'stripe',
    subtotal: 25.00,
    taxAmount: 2.50,
    total: 27.50,
    currency: 'AUD',
    items: [
      { name: 'Test Item', price: 25.00, quantity: 1 }
    ]
  }
  
  // Test notification config (empty to force Railway env vars)
  const notificationConfig = {
    sendCustomerReceipt: true,
    sendRestaurantNotification: true
    // No SendGrid config - should use Railway env vars
  }
  
  try {
    console.log('1. Testing customer receipt with Railway SendGrid...')
    const result1 = await sendOrderConfirmation(testOrder, 'Test Restaurant', notificationConfig)
    console.log('Customer receipt result:', result1)
    
    if (result1.success) {
      console.log('\n✅ Railway SendGrid configuration is working!')
    } else {
      console.log('\n❌ Railway SendGrid configuration failed:', result1.message)
      console.log('\n💡 Make sure to set these environment variables in Railway:')
      console.log('   SENDGRID_API_KEY=SG.xxxxxxxxxx.yyyyyyyy.zzzzzzzz')
      console.log('   SENDGRID_FROM_EMAIL=noreply@yourrestaurant.com')
      console.log('   USE_SENDGRID_DEFAULT=true')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testRailwaySendGrid();
